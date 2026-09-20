const ExcelJS = require('exceljs');

// Export cases to a workbook buffer.
// Safe subset only - never admin credentials or auth data.
function buildReportRows(reports) {
  return reports.map((r) => {
    const victim = r.victim || {};
    const incident = r.incident || {};
    const scammer = r.scammer || {};
    const transaction = r.transaction || {};
    return [
      r.caseId,
      victim.fullName,
      victim.email,
      victim.phone,
      victim.country,
      victim.state,
      incident.type,
      incident.date,
      incident.time,
      incident.amount,
      incident.currency,
      incident.country,
      scammer.name,
      scammer.alias,
      scammer.phone,
      scammer.email,
      scammer.socialMedia,
      scammer.website,
      scammer.bankName,
      scammer.accountName,
      scammer.accountNumber,
      scammer.walletAddress,
      transaction.reference,
      transaction.transactionId,
      transaction.cryptoHash,
      transaction.sendingPlatform,
      transaction.receivingPlatform,
      transaction.paymentMethod,
      incident.description,
      r.status,
      r.assignedInvestigator || '',
      r.createdAt ? r.createdAt.toISOString() : '',
      r.updatedAt ? r.updatedAt.toISOString() : '',
    ];
  });
}

async function buildWorkbook(reports) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SnareNet';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Cases');

  ws.columns = [
    { header: 'Case ID', key: 'caseId', width: 20 },
    { header: 'Victim Name', key: 'victimName', width: 22 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'Victim Country', key: 'vCountry', width: 14 },
    { header: 'State', key: 'state', width: 14 },
    { header: 'Scam Type', key: 'type', width: 18 },
    { header: 'Incident Date', key: 'date', width: 14 },
    { header: 'Approx. Time', key: 'time', width: 14 },
    { header: 'Amount', key: 'amount', width: 14 },
    { header: 'Currency', key: 'currency', width: 10 },
    { header: 'Incident Country', key: 'iCountry', width: 14 },
    { header: 'Scammer Name', key: 'sName', width: 20 },
    { header: 'Alias', key: 'alias', width: 18 },
    { header: 'Scammer Phone', key: 'sPhone', width: 18 },
    { header: 'Scammer Email', key: 'sEmail', width: 26 },
    { header: 'Social Media', key: 'social', width: 26 },
    { header: 'Website', key: 'website', width: 26 },
    { header: 'Bank Name', key: 'bankName', width: 20 },
    { header: 'Account Name', key: 'accountName', width: 22 },
    { header: 'Account Number', key: 'accountNumber', width: 18 },
    { header: 'Wallet Address', key: 'wallet', width: 30 },
    { header: 'Transaction Reference', key: 'txRef', width: 24 },
    { header: 'Transaction ID', key: 'txId', width: 24 },
    { header: 'Crypto Hash', key: 'cryptoHash', width: 36 },
    { header: 'Sending Platform', key: 'sending', width: 20 },
    { header: 'Receiving Platform', key: 'receiving', width: 20 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Description', key: 'description', width: 60 },
    { header: 'Status', key: 'status', width: 20 },
    { header: 'Assigned Investigator', key: 'investigator', width: 22 },
    { header: 'Created At', key: 'createdAt', width: 24 },
    { header: 'Updated At', key: 'updatedAt', width: 24 },
  ];

  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE53935' },
  };

  reports.forEach((r) => {
    ws.addRow(buildReportRows([r])[0]);
  });

  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: Math.max(1, reports.length + 1), column: ws.columns.length },
  };

  return workbook;
}

module.exports = { buildWorkbook, buildReportRows };