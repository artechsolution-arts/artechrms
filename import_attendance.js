// Run: node import_attendance.js
// Reads DailyAttendanceLogsDetails.xlsx and imports into HRMS

const path = require('path');
const xlsxPath = require('path').join(require('child_process').execSync('npm root -g').toString().trim(), 'xlsx');
const XLSX = require(xlsxPath);
const https = require('https');

const XLSX_FILE = 'C:/Users/Administrator.ARTECH.000/Desktop/DailyAttendanceLogsDetails.xlsx';
const API_URL  = 'https://www.arpeopliz.com/api/biometric/bulk-import';
const SECRET   = 'arpeopliz-import-2026';

function excelDateToString(serial) {
  // Excel serial date → YYYY-MM-DD
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

function decimalToTime(decimal) {
  if (decimal === null || decimal === undefined || decimal === 0) return null;
  const totalMinutes = Math.round(decimal * 24 * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
}

const wb   = XLSX.readFile(XLSX_FILE);
const ws   = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(ws);

const records = [];
for (const row of rows) {
  const dateSerial = row['Date'];
  const bioId      = String(row[' Employee Code '] || row['Employee Code'] || '').trim();
  const inDec      = row[' In Time '] || row['In Time'] || null;
  const outDec     = row['Out Time '] || row['Out Time'] || null;

  // Import any row that has an in_time (covers Present + partial-day Absent)
  if (!dateSerial || !bioId || !inDec) continue;

  const dateStr   = excelDateToString(dateSerial);
  const inTimeStr = decimalToTime(inDec);
  const outTimeStr = decimalToTime(outDec);

  if (!inTimeStr) continue;
  records.push({ date: dateStr, bio_id: bioId, in_time: inTimeStr, out_time: outTimeStr });
}

console.log(`Prepared ${records.length} Present records from ${rows.length} total rows`);

// Send in batches of 500
const BATCH = 500;
async function postBatch(batch, batchNum) {
  const body = JSON.stringify({ secret: SECRET, records: batch });
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        console.log(`Batch ${batchNum}: ${data}`);
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await postBatch(batch, Math.floor(i/BATCH)+1);
  }
  console.log('Done!');
})();
