const { asyncHandler } = require('../utils');
const { Report } = require('../models/Report');
const { buildWorkbook } = require('../services/excelService');

const exportExcel = asyncHandler(async (req, res) => {
  const reports = await Report.find().sort({ createdAt: -1 }).lean();

  const workbook = await buildWorkbook(reports);
  const buffer = await workbook.xlsx.writeBuffer();

  const date = new Date().toISOString().slice(0, 10);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="snarenet-cases-${date}.xlsx"`);
  return res.send(Buffer.from(buffer));
});

module.exports = { exportExcel };