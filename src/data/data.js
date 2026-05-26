const DATA_FILE = "/data/progress_reports.csv";

const PREFIX_MAP = {
  ACG: ["Accounting", "College of Business"],
  TAX: ["Accounting", "College of Business"],
  FIN: ["Finance", "College of Business"],
  MAN: ["Management", "College of Business"],
  GEB: ["Management", "College of Business"],
  MAR: ["Marketing", "College of Business"],
  ISM: ["Information Systems", "College of Business"],
  COP: ["Computer Science", "College of Engineering & Computer Science"],
  CDA: ["Computer Engineering", "College of Engineering & Computer Science"],
  COT: ["Computer Science", "College of Engineering & Computer Science"],
  CES: ["Civil Engineering", "College of Engineering & Computer Science"],
  CEN: ["Civil Engineering", "College of Engineering & Computer Science"],
  EEL: ["Electrical Engineering", "College of Engineering & Computer Science"],
  EEE: ["Electrical Engineering", "College of Engineering & Computer Science"],
  EML: ["Mechanical Engineering", "College of Engineering & Computer Science"],
  EGN: ["Mechanical Engineering", "College of Engineering & Computer Science"],
  ENC: ["English", "College of Arts & Letters"],
  LIT: ["English", "College of Arts & Letters"],
  ENL: ["English", "College of Arts & Letters"],
  COM: ["Communication", "College of Arts & Letters"],
  MMC: ["Communication", "College of Arts & Letters"],
  MUS: ["Music", "College of Arts & Letters"],
  ARH: ["Art & Art History", "College of Arts & Letters"],
  ART: ["Art & Art History", "College of Arts & Letters"],
  PHI: ["Philosophy", "College of Arts & Letters"],
  BSC: ["Biology", "College of Science"],
  MCB: ["Biology", "College of Science"],
  PCB: ["Biology", "College of Science"],
  CHM: ["Chemistry", "College of Science"],
  MAC: ["Mathematics", "College of Science"],
  MAD: ["Mathematics", "College of Science"],
  MAP: ["Mathematics", "College of Science"],
  MAT: ["Mathematics", "College of Science"],
  PHY: ["Physics", "College of Science"],
  PSY: ["Psychology", "College of Science"],
  EDG: ["Curriculum & Instruction", "College of Education"],
  EDF: ["Curriculum & Instruction", "College of Education"],
  EDA: ["Educational Leadership", "College of Education"],
  MHS: ["Counselor Education", "College of Education"],
  PET: ["Exercise Science", "College of Education"],
  APK: ["Exercise Science", "College of Education"],
  SWO: ["Social Work", "College of Social Work & Criminal Justice"],
  CCJ: ["Criminal Justice", "College of Social Work & Criminal Justice"],
  CJC: ["Criminal Justice", "College of Social Work & Criminal Justice"],
  IDH: ["Honors Program", "Honors College"],
};

function cleanHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map(cleanHeader);

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function firstValue(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && String(value).trim() !== "") return String(value).trim();
  }
  return "";
}

function getCoursePrefix(courseNumber) {
  const match = String(courseNumber || "").toUpperCase().match(/[A-Z]{3}/);
  return match ? match[0] : "UNK";
}

function normalizeResponded(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["yes", "y", "true", "submitted", "complete", "completed", "responded", "1"].includes(normalized)) return "Yes";
  return "No";
}

function normalizeRow(row) {
  const courseNumber = firstValue(row, ["course_number", "full_course_name", "course", "course_name"]);
  const prefix = firstValue(row, ["course_prefix", "prefix"]) || getCoursePrefix(courseNumber);
  const mapped = PREFIX_MAP[prefix] || ["Unknown Department", "Unknown College"];

  const firstName = firstValue(row, ["professor_requested_first_name", "professor_first_name", "first_name"]);
  const lastName = firstValue(row, ["professor_requested_last_name", "professor_last_name", "last_name"]);
  const name = firstValue(row, ["professor_requested_name", "professor_name", "instructor", "instr_desc"]) ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Unknown Faculty";
  const email = firstValue(row, ["professor_requested_email", "professor_email", "email", "instructor_email"]) ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "") + "@unknown";

  return {
    professor_requested_name: name,
    professor_requested_first_name: firstName,
    professor_requested_last_name: lastName,
    professor_requested_email: email,
    course_number: courseNumber,
    section_name: firstValue(row, ["section_name", "course_section_no", "section"]),
    responded: normalizeResponded(firstValue(row, ["responded", "submitted", "submission_status", "status", "user_can_view_report"])),
    responded_date: firstValue(row, ["responded_date", "submitted_date", "completion_date"]),
    student_count: Number(firstValue(row, ["student_count", "students", "enrollment"])) || 1,
    course_prefix: prefix,
    department: firstValue(row, ["department", "course_dept"]) || mapped[0],
    college: firstValue(row, ["college", "course_college"]) || mapped[1],
  };
}

export async function loadDashboardData() {
  const response = await fetch(DATA_FILE, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${DATA_FILE}. Make sure the CSV exists in public/data/.`);
  }

  const text = await response.text();
  return parseCsv(text).map(normalizeRow);
}

function rate(submitted, total) {
  return total === 0 ? 0 : Math.round((submitted / total) * 100);
}

export function getOverallStats(rows = []) {
  const total = rows.length;
  const submitted = rows.filter((r) => r.responded === "Yes").length;
  const missing = total - submitted;
  const pct = rate(submitted, total);
  const colleges = new Set(rows.map((r) => r.college)).size;
  const depts = new Set(rows.map((r) => r.department)).size;
  const faculty = new Set(rows.map((r) => r.professor_requested_email)).size;
  return { total, submitted, missing, pct, colleges, depts, faculty };
}

export function getCollegeStats(rows = []) {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.college]) map[r.college] = { college: r.college, total: 0, submitted: 0 };
    map[r.college].total += 1;
    if (r.responded === "Yes") map[r.college].submitted += 1;
  });
  return Object.values(map)
    .map((c) => ({ ...c, rate: rate(c.submitted, c.total), missing: c.total - c.submitted }))
    .sort((a, b) => b.rate - a.rate);
}

export function getDeptStats(rows = [], collegeFilter = "") {
  const map = {};
  rows
    .filter((r) => !collegeFilter || r.college === collegeFilter)
    .forEach((r) => {
      const key = `${r.college}||${r.department}`;
      if (!map[key]) map[key] = { college: r.college, department: r.department, total: 0, submitted: 0 };
      map[key].total += 1;
      if (r.responded === "Yes") map[key].submitted += 1;
    });
  return Object.values(map)
    .map((d) => ({ ...d, rate: rate(d.submitted, d.total), missing: d.total - d.submitted }))
    .sort((a, b) => b.rate - a.rate);
}

export function getFacultyStats(rows = [], collegeFilter = "", deptFilter = "", statusFilter = "") {
  const map = {};
  rows
    .filter((r) => {
      if (collegeFilter && r.college !== collegeFilter) return false;
      if (deptFilter && r.department !== deptFilter) return false;
      return true;
    })
    .forEach((r) => {
      const key = r.professor_requested_email;
      if (!map[key]) {
        map[key] = {
          name: r.professor_requested_name,
          email: r.professor_requested_email,
          college: r.college,
          department: r.department,
          total: 0,
          submitted: 0,
        };
      }
      map[key].total += 1;
      if (r.responded === "Yes") map[key].submitted += 1;
    });

  return Object.values(map)
    .map((f) => ({ ...f, rate: rate(f.submitted, f.total), missing: f.total - f.submitted }))
    .filter((f) => {
      if (statusFilter === "submitted") return f.rate === 100;
      if (statusFilter === "partial") return f.rate > 0 && f.rate < 100;
      if (statusFilter === "missing") return f.rate === 0;
      return true;
    })
    .sort((a, b) => a.rate - b.rate);
}

export function getAllColleges(rows = []) {
  return [...new Set(rows.map((r) => r.college))].sort();
}

export function getAllDepts(rows = [], college = "") {
  return [...new Set(rows.filter((r) => !college || r.college === college).map((r) => r.department))].sort();
}
