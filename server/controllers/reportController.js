const { asyncHandler, ApiError } = require('../utils');
const { Report, CASE_STATUSES } = require('../models/Report');
const { generateCaseId } = require('../utils/caseId');
const { validationResult } = require('express-validator');
const {
  notifyReportSubmitted,
  notifyStatusChanged,
  notifyNoteAdded,
  safeNotify,
} = require('../services/mailer');

const publicCreate = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, errors.array()[0]?.msg || 'Validation failed');
  }

  const body = req.body;
  if (body.consent !== true) {
    throw new ApiError(400, 'Consent is required to submit a report');
  }

  const { victim, incident, scammer, transaction, evidence } = body;

  // Retry on the (unlikely) case-ID collision to honor the unique index.
  let doc = null;
  for (let attempt = 0; attempt < 3 && !doc; attempt += 1) {
    try {
      doc = await Report.create({
        caseId: generateCaseId(),
        victim: {
          fullName: victim.fullName,
          email: victim.email || '',
          phone: victim.phone || '',
          whatsapp: victim.whatsapp || '',
          country: victim.country || '',
          state: victim.state || '',
          preferredContact: victim.preferredContact || 'Email',
        },
        incident: {
          type: incident.type,
          date: incident.date || '',
          time: incident.time || '',
          amount: incident.amount || '',
          currency: incident.currency || 'USD',
          country: incident.country || '',
          description: incident.description,
        },
        scammer: {
          name: scammer?.name || '',
          alias: scammer?.alias || '',
          phone: scammer?.phone || '',
          email: scammer?.email || '',
          socialMedia: scammer?.socialMedia || '',
          website: scammer?.website || '',
          bankName: scammer?.bankName || '',
          accountName: scammer?.accountName || '',
          accountNumber: scammer?.accountNumber || '',
          walletAddress: scammer?.walletAddress || '',
          otherInformation: scammer?.otherInformation || '',
        },
        transaction: {
          reference: transaction?.reference || '',
          transactionId: transaction?.transactionId || '',
          cryptoHash: transaction?.cryptoHash || '',
          sendingPlatform: transaction?.sendingPlatform || '',
          receivingPlatform: transaction?.receivingPlatform || '',
          paymentMethod: transaction?.paymentMethod || '',
        },
        evidence: {
          description: evidence?.description || '',
          links: Array.isArray(evidence?.links) ? evidence.links : [],
          urls: Array.isArray(evidence?.urls) ? evidence.urls : [],
        },
        consent: true,
        status: 'NEW',
      });
    } catch (err) {
      if (err.code === 11000 && attempt < 2) continue;
      throw err;
    }
  }

  // Fire-and-forget: email with the tracking code (must never block submission).
  safeNotify(() => notifyReportSubmitted(doc));

  return res.status(201).json({ caseId: doc.caseId });
});

// Public lookup: minimal safe status only.
const publicLookup = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  if (!/^SCR-\d{4}-[0-9A-F]{6}$/.test(caseId)) {
    throw new ApiError(404, 'Case not found');
  }
  const doc = await Report.findOne({ caseId }).lean();
  if (!doc) throw new ApiError(404, 'Case not found');
  return res.json({ caseId: doc.caseId, status: doc.status, submittedAt: doc.createdAt });
});

const adminList = asyncHandler(async (req, res) => {
  const { q, status, scamType, sort = 'newest', page = '1', limit = '20' } = req.query;

  const filter = {};
  if (status && status !== 'ALL') filter.status = status;
  if (scamType && scamType !== 'ALL') filter['incident.type'] = scamType;

  if (q) {
    filter.$or = [
      { caseId: { $regex: q, $options: 'i' } },
      { 'victim.fullName': { $regex: q, $options: 'i' } },
      { 'victim.email': { $regex: q, $options: 'i' } },
      { 'victim.phone': { $regex: q, $options: 'i' } },
      { 'scammer.name': { $regex: q, $options: 'i' } },
      { 'scammer.alias': { $regex: q, $options: 'i' } },
      { 'incident.description': { $regex: q, $options: 'i' } },
      { 'assignedInvestigator': { $regex: q, $options: 'i' } },
    ];
  }

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    updated: { updatedAt: -1 },
    caseId: { caseId: 1 },
    amount: { 'incident.amount': 1 },
  };
  const sortBy = sortOptions[sort] || sortOptions.newest;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  const [total, reports] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter)
      .sort(sortBy)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
  ]);

  return res.json({
    reports,
    total,
    page: pageNum,
    pages: Math.max(1, Math.ceil(total / limitNum)),
    limit: limitNum,
  });
});

const adminGet = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const doc = await Report.findOne({ caseId }).lean();
  if (!doc) throw new ApiError(404, 'Case not found');
  return res.json(doc);
});

const adminUpdate = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const doc = await Report.findOne({ caseId });
  if (!doc) throw new ApiError(404, 'Case not found');

  if (req.body.status && !CASE_STATUSES.includes(req.body.status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const previousStatus = doc.status;

  const allowed = ['status', 'assignedInvestigator'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) {
      doc[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }
  });

  await doc.save();

  if (req.body.status !== undefined && req.body.status !== previousStatus) {
    safeNotify(() => notifyStatusChanged(doc, previousStatus));
  }

  return res.json(doc);
});

const adminArchive = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const doc = await Report.findOne({ caseId });
  if (!doc) throw new ApiError(404, 'Case not found');
  const previousStatus = doc.status;
  doc.status = 'ARCHIVED';
  await doc.save();
  if (previousStatus !== 'ARCHIVED') {
    safeNotify(() => notifyStatusChanged(doc, previousStatus));
  }
  return res.json(doc);
});

// Permanent delete requires the exact case ID.
const adminDelete = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const { confirmCaseId } = req.body;

  if (confirmCaseId !== caseId) {
    throw new ApiError(400, 'Type the exact Case ID to confirm permanent deletion');
  }

  const doc = await Report.findOneAndDelete({ caseId });
  if (!doc) throw new ApiError(404, 'Case not found');
  return res.json({ message: 'Case permanently deleted' });
});

const addNote = asyncHandler(async (req, res) => {
  const { caseId } = req.params;
  const doc = await Report.findOne({ caseId });
  if (!doc) throw new ApiError(404, 'Case not found');

  const { text } = req.body;
  if (!text || !String(text).trim()) throw new ApiError(400, 'Note text is required');

  doc.notes.push({
    text: String(text).trim(),
    author: req.admin?.name || 'Administrator',
  });
  await doc.save();
  const note = doc.notes[doc.notes.length - 1];
  safeNotify(() => notifyNoteAdded(doc, note));
  return res.status(201).json(note);
});

const updateNote = asyncHandler(async (req, res) => {
  const { caseId, noteId } = req.params;
  if (!/^[0-9a-fA-F]{24}$/.test(noteId)) throw new ApiError(404, 'Note not found');

  const doc = await Report.findOne({ caseId });
  if (!doc) throw new ApiError(404, 'Case not found');

  const note = doc.notes.id(noteId);
  if (!note) throw new ApiError(404, 'Note not found');

  const { text } = req.body;
  if (!text || !String(text).trim()) throw new ApiError(400, 'Note text is required');
  note.text = String(text).trim();
  await doc.save();
  return res.json(note);
});

const deleteNote = asyncHandler(async (req, res) => {
  const { caseId, noteId } = req.params;
  if (!/^[0-9a-fA-F]{24}$/.test(noteId)) throw new ApiError(404, 'Note not found');

  const doc = await Report.findOne({ caseId });
  if (!doc) throw new ApiError(404, 'Case not found');

  const note = doc.notes.id(noteId);
  if (!note) throw new ApiError(404, 'Note not found');

  note.deleteOne();
  await doc.save();
  return res.json({ message: 'Note deleted' });
});

const dashboardStats = asyncHandler(async (req, res) => {
  const counts = await Report.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const map = {};
  counts.forEach((c) => {
    map[c._id] = c.count;
  });

  const total = await Report.countDocuments();
  const stats = {
    total,
    NEW: map.NEW || 0,
    UNDER_REVIEW: map.UNDER_REVIEW || 0,
    INVESTIGATING: map.INVESTIGATING || 0,
    SCAMMER_IDENTIFIED: map.SCAMMER_IDENTIFIED || 0,
    RECOVERY_IN_PROGRESS: map.RECOVERY_IN_PROGRESS || 0,
    RECOVERED: map.RECOVERED || 0,
    CLOSED: map.CLOSED || 0,
    ARCHIVED: map.ARCHIVED || 0,
  };
  return res.json(stats);
});

module.exports = {
  publicCreate,
  publicLookup,
  adminList,
  adminGet,
  adminUpdate,
  adminArchive,
  adminDelete,
  addNote,
  updateNote,
  deleteNote,
  dashboardStats,
};