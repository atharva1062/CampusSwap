const xlsx = require('xlsx');
const { DEPARTMENTS } = require('../constants/departments');

/**
 * Format ERP ID to clean string (specifically 8-digit format when numeric)
 */
function cleanErpId(val) {
  if (val === undefined || val === null) return '';
  let str = String(val).trim();
  
  // Strip .0 from numeric excel floats like 20241062.0
  if (str.endsWith('.0')) {
    str = str.slice(0, -2);
  }
  
  // Handle scientific notation like 2.0241062e+07
  if (/^[0-9]+(\.[0-9]+)?[eE]\+[0-9]+$/.test(str)) {
    try {
      str = String(Math.round(Number(str)));
    } catch (_) {}
  }

  const digitsOnly = str.replace(/\D/g, '');
  if (digitsOnly.length === 8) {
    return digitsOnly;
  }
  if (digitsOnly.length >= 4 && digitsOnly.length <= 12) {
    return digitsOnly;
  }
  return str.toUpperCase();
}

/**
 * Clean and format student official email: {erpid}.dit@dypvp.edu.in
 */
function formatCollegeEmail(emailVal, erpIdVal) {
  const erp = cleanErpId(erpIdVal);
  if (emailVal && typeof emailVal === 'string' && emailVal.includes('@')) {
    return emailVal.toLowerCase().trim();
  }
  if (erp) {
    return `${erp.toLowerCase()}.dit@dypvp.edu.in`;
  }
  return '';
}

/**
 * Match department name against the 12 official DIT departments
 */
function matchDepartment(deptStr) {
  if (!deptStr || typeof deptStr !== 'string') return DEPARTMENTS[3]; // Default Computer Engineering
  const clean = deptStr.trim().toLowerCase();

  const found = DEPARTMENTS.find((d) => {
    const dl = d.toLowerCase();
    return (
      dl === clean ||
      dl.includes(clean) ||
      clean.includes(dl) ||
      (clean.includes('comp') && dl.includes('computer engineering')) ||
      (clean.includes('ai') && dl.includes('intelligence')) ||
      (clean.includes('mech') && dl.includes('mechanical')) ||
      (clean.includes('civil') && dl.includes('civil')) ||
      (clean.includes('electr') && dl.includes('electrical')) ||
      (clean.includes('entc') && dl.includes('telecommunication')) ||
      (clean.includes('e&tc') && dl.includes('telecommunication')) ||
      (clean.includes('it') && dl.includes('information technology')) ||
      (clean.includes('robot') && dl.includes('robotics')) ||
      (clean.includes('fe') && dl.includes('first year')) ||
      (clean.includes('inst') && dl.includes('instrumentation')) ||
      (clean.includes('str') && dl === 'str')
    );
  });

  return found || deptStr.trim();
}

/**
 * Match Year of study
 */
function matchYear(yearStr) {
  if (!yearStr) return '1st Year';
  const y = String(yearStr).toLowerCase();
  if (y.includes('1') || y.includes('first') || y.includes('fe')) return '1st Year';
  if (y.includes('2') || y.includes('second') || y.includes('se')) return '2nd Year';
  if (y.includes('3') || y.includes('third') || y.includes('te')) return '3rd Year';
  if (y.includes('4') || y.includes('fourth') || y.includes('be') || y.includes('final')) return '4th Year';
  return String(yearStr).trim();
}

/**
 * Universal Student Data Parser
 * Accepts:
 * - Buffer (Excel / CSV / TXT file upload)
 * - Array of objects / JSON
 * - Raw string (Pasted CSV, TSV, or comma/tab separated lines)
 */
function parseStudentData(input) {
  const students = [];

  if (!input) return students;

  // 1. Buffer Upload (Excel / CSV / Text)
  if (Buffer.isBuffer(input)) {
    try {
      const workbook = xlsx.read(input, { type: 'buffer' });
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (!rows || rows.length === 0) continue;

        // Find header row or use positional
        let headerRowIndex = -1;
        let colMap = {};

        for (let i = 0; i < Math.min(rows.length, 8); i++) {
          const rowStr = rows[i].map((c) => String(c).toLowerCase()).join(' ');
          if (
            rowStr.includes('name') ||
            rowStr.includes('erp') ||
            rowStr.includes('roll') ||
            rowStr.includes('email') ||
            rowStr.includes('mail') ||
            rowStr.includes('dept') ||
            rowStr.includes('branch')
          ) {
            headerRowIndex = i;
            // Map header column indices
            rows[i].forEach((colName, colIdx) => {
              const c = String(colName).toLowerCase().trim();
              if (/name|student.*name|full.*name|candidate|std.*name/i.test(c) && colMap.name === undefined) {
                colMap.name = colIdx;
              } else if (/erp.*id|erp|erpid|erp.*no|roll.*no|roll|rollno|prn|id.*no|reg.*no|id/i.test(c) && colMap.collegeId === undefined) {
                colMap.collegeId = colIdx;
              } else if (/email|mail|e-mail|email.*id/i.test(c) && colMap.email === undefined) {
                colMap.email = colIdx;
              } else if (/phone|mobile|contact|cell|tel|phone.*no|mobile.*no/i.test(c) && colMap.phone === undefined) {
                colMap.phone = colIdx;
              } else if (/dept|department|branch|stream|course|discipline/i.test(c) && colMap.department === undefined) {
                colMap.department = colIdx;
              } else if (/year|class|sem|semester|std|academic.*year/i.test(c) && colMap.year === undefined) {
                colMap.year = colIdx;
              }
            });
            break;
          }
        }

        const dataStartIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

        for (let i = dataStartIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || !row.some((cell) => Boolean(String(cell).trim()))) continue;

          let name = '';
          let collegeId = '';
          let email = '';
          let phone = '';
          let department = '';
          let year = '1st Year';

          if (headerRowIndex >= 0) {
            name = colMap.name !== undefined ? String(row[colMap.name] || '').trim() : '';
            collegeId = colMap.collegeId !== undefined ? String(row[colMap.collegeId] || '').trim() : '';
            email = colMap.email !== undefined ? String(row[colMap.email] || '').trim() : '';
            phone = colMap.phone !== undefined ? String(row[colMap.phone] || '').trim() : '';
            department = colMap.department !== undefined ? String(row[colMap.department] || '').trim() : '';
            year = colMap.year !== undefined ? String(row[colMap.year] || '1st Year').trim() : '1st Year';
          }

          // Positional fallback / Heuristic detection if columns not mapped
          if (!name || !collegeId) {
            row.forEach((cellVal) => {
              const val = String(cellVal).trim();
              if (!val) return;

              // Check if 8-digit numeric or alphanumeric ERP
              if (!collegeId && (/^\d{8}$/.test(val) || /^[A-Z0-9-]{6,12}$/i.test(val)) && !val.includes('@')) {
                collegeId = val;
              } else if (!email && val.includes('@')) {
                email = val;
              } else if (!phone && /^\d{10}$/.test(val.replace(/\D/g, ''))) {
                phone = val;
              } else if (!department && DEPARTMENTS.some((d) => d.toLowerCase().includes(val.toLowerCase()))) {
                department = val;
              } else if (!name && val.length >= 3 && isNaN(val) && !val.includes('@') && !val.includes('.com') && !val.includes('.in')) {
                name = val;
              }
            });
          }

          if (name || collegeId) {
            const finalCollegeId = cleanErpId(collegeId) || cleanErpId(name.split(' ')[0]);
            const finalEmail = formatCollegeEmail(email, finalCollegeId);
            const cleanPhoneDigits = phone ? phone.replace(/\D/g, '').slice(-10) : null;

            students.push({
              name: name || `Student ${finalCollegeId}`,
              collegeId: finalCollegeId || 'PENDING',
              email: finalEmail,
              phone: cleanPhoneDigits || null,
              department: matchDepartment(department),
              year: matchYear(year),
            });
          }
        }
      }
      return students;
    } catch (err) {
      console.error('Buffer Parse Error:', err);
    }
  }

  // 2. Array of Objects (JSON / pre-parsed from Frontend)
  if (Array.isArray(input)) {
    for (const item of input) {
      if (!item || typeof item !== 'object') continue;
      
      const name = item.name || item.studentName || item.fullName || item['Student Name'] || item['Name'] || item['Candidate Name'] || '';
      const collegeId = item.collegeId || item.erpId || item.erp || item['ERP ID'] || item['ERP'] || item['ERP No'] || item['Roll No'] || item['PRN'] || '';
      const email = item.email || item['Email'] || item['College Email'] || item['Email ID'] || '';
      const phone = item.phone || item.mobile || item['Mobile'] || item['Phone'] || item['Contact'] || null;
      const department = item.department || item.dept || item.branch || item['Department'] || item['Branch'] || 'Computer Engineering';
      const year = item.year || item['Year'] || item['Class'] || '1st Year';

      if (name || collegeId || email) {
        const finalCollegeId = cleanErpId(collegeId) || (email ? email.split('@')[0].replace(/\D/g, '') : cleanErpId(String(name).split(' ')[0]));
        const finalEmail = formatCollegeEmail(email, finalCollegeId);
        const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : null;

        students.push({
          name: String(name).trim() || `Student ${finalCollegeId}`,
          collegeId: finalCollegeId || 'PENDING',
          email: finalEmail,
          phone: cleanPhone || null,
          department: matchDepartment(department),
          year: matchYear(year),
        });
      }
    }
    return students;
  }

  // 3. Raw String (CSV, TSV, Copy-Pasted Text)
  if (typeof input === 'string') {
    const lines = input.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      // Ignore header row if pasted
      if (/student.*name|erp.*id|college.*email/i.test(line)) continue;

      const parts = line.split(/[,\t|;]/).map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0) continue;

      let name = parts[0] || '';
      let collegeId = parts[1] || '';
      let email = parts[2] || '';
      let phone = parts[3] || null;
      let department = parts[4] || 'Computer Engineering';
      let year = parts[5] || '1st Year';

      // Positional / Heuristic detection across tokens
      parts.forEach((p) => {
        if (/^\d{8}$/.test(p) || (/^[A-Z0-9-]{6,12}$/i.test(p) && !p.includes('@'))) collegeId = p;
        else if (p.includes('@')) email = p;
        else if (/^\d{10}$/.test(p.replace(/\D/g, ''))) phone = p;
      });

      if (name || collegeId || email) {
        const finalCollegeId = cleanErpId(collegeId) || cleanErpId(name.split(' ')[0]);
        const finalEmail = formatCollegeEmail(email, finalCollegeId);
        const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : null;

        students.push({
          name: name.trim() || `Student ${finalCollegeId}`,
          collegeId: finalCollegeId || 'PENDING',
          email: finalEmail,
          phone: cleanPhone || null,
          department: matchDepartment(department),
          year: matchYear(year),
        });
      }
    }
  }

  return students;
}

module.exports = {
  cleanErpId,
  formatCollegeEmail,
  matchDepartment,
  matchYear,
  parseStudentData,
};
