// Demo data modeled on Navigate faculty submission status export
// Columns mirror: Professor Requested Name, Course Number, Section Name, Responded

const COLLEGES = [
  "College of Business",
  "College of Engineering & Computer Science",
  "College of Arts & Letters",
  "College of Science",
  "College of Education",
  "College of Social Work & Criminal Justice",
  "Honors College",
];

const DEPARTMENTS = {
  "College of Business": ["Accounting", "Finance", "Management", "Marketing", "Information Systems"],
  "College of Engineering & Computer Science": ["Computer Science", "Civil Engineering", "Electrical Engineering", "Mechanical Engineering", "Computer Engineering"],
  "College of Arts & Letters": ["English", "Communication", "Music", "Art & Art History", "Philosophy"],
  "College of Science": ["Biology", "Chemistry", "Mathematics", "Physics", "Psychology"],
  "College of Education": ["Curriculum & Instruction", "Educational Leadership", "Counselor Education", "Exercise Science"],
  "College of Social Work & Criminal Justice": ["Social Work", "Criminal Justice"],
  "Honors College": ["Honors Program"],
};

const PREFIXES = {
  "Accounting":        ["ACG", "TAX"],
  "Finance":           ["FIN"],
  "Management":        ["MAN", "GEB"],
  "Marketing":         ["MAR"],
  "Information Systems":["ISM"],
  "Computer Science":  ["COP", "CDA", "COT"],
  "Civil Engineering": ["CES", "CEN"],
  "Electrical Engineering": ["EEL", "EEE"],
  "Mechanical Engineering": ["EML", "EGN"],
  "Computer Engineering":   ["CDA", "EEL"],
  "English":           ["ENC", "LIT", "ENL"],
  "Communication":     ["COM", "MMC"],
  "Music":             ["MUS"],
  "Art & Art History": ["ARH", "ART"],
  "Philosophy":        ["PHI"],
  "Biology":           ["BSC", "MCB", "PCB"],
  "Chemistry":         ["CHM"],
  "Mathematics":       ["MAC", "MAD", "MAP", "MAT"],
  "Physics":           ["PHY"],
  "Psychology":        ["PSY"],
  "Curriculum & Instruction": ["EDG", "EDF"],
  "Educational Leadership":   ["EDA"],
  "Counselor Education":      ["MHS"],
  "Exercise Science":         ["PET", "APK"],
  "Social Work":       ["SWO"],
  "Criminal Justice":  ["CCJ", "CJC"],
  "Honors Program":    ["IDH"],
};

const FIRST_NAMES = ["James","Maria","Robert","Linda","Michael","Patricia","William","Barbara","David","Elizabeth","Richard","Jennifer","Joseph","Susan","Thomas","Jessica","Charles","Sarah","Christopher","Karen","Daniel","Nancy","Matthew","Lisa","Anthony","Betty","Donald","Dorothy","Mark","Sandra","Paul","Ashley","Steven","Emily","Andrew","Kimberly","Kenneth","Donna","Joshua","Michelle"];
const LAST_NAMES  = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green"];

function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function pick(arr, rand) { return arr[Math.floor(rand() * arr.length)]; }
function pickN(arr, n, rand) {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

function generateData() {
  const rand = rng(20260525);
  const rows = [];

  // Assign submission bias per college (some colleges comply more)
  const collegeBias = {};
  COLLEGES.forEach(c => {
    collegeBias[c] = 0.55 + rand() * 0.35; // 55%–90% base rate
  });

  // Generate ~600 section-level rows
  COLLEGES.forEach(college => {
    const depts = DEPARTMENTS[college];
    depts.forEach(dept => {
      const prefixes = PREFIXES[dept] || ["GEN"];
      const numFaculty = Math.max(2, Math.floor(rand() * 8) + 2);

      for (let f = 0; f < numFaculty; f++) {
        const firstName = pick(FIRST_NAMES, rand);
        const lastName  = pick(LAST_NAMES, rand);
        const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`;
        const numSections = Math.floor(rand() * 3) + 1;
        // Faculty-level compliance bias (some faculty just don't submit)
        const facultyBias = collegeBias[college] + (rand() - 0.5) * 0.4;

        for (let s = 0; s < numSections; s++) {
          const prefix     = pick(prefixes, rand);
          const courseNum  = `${prefix}${Math.floor(rand() * 4000) + 1000}`;
          const section    = String(Math.floor(rand() * 20) + 1).padStart(3, "0");
          const students   = Math.floor(rand() * 30) + 8;
          const responded  = rand() < Math.max(0.1, Math.min(0.98, facultyBias)) ? "Yes" : "No";
          const respondedDate = responded === "Yes"
            ? `2026-0${Math.floor(rand() * 3) + 2}-${String(Math.floor(rand() * 28) + 1).padStart(2, "0")}`
            : "";

          rows.push({
            professor_requested_name:       `${firstName} ${lastName}`,
            professor_requested_first_name:  firstName,
            professor_requested_last_name:   lastName,
            professor_requested_email:       email,
            course_number:                   courseNum,
            section_name:                    section,
            responded,
            responded_date:                  respondedDate,
            student_count:                   students,
            course_prefix:                   prefix,
            department:                      dept,
            college,
          });
        }
      }
    });
  });

  return rows;
}

export const RAW_DATA = generateData();

// ── Derived aggregates ───────────────────────────────────────────────────────

function rate(submitted, total) {
  return total === 0 ? 0 : Math.round((submitted / total) * 100);
}

export function getOverallStats() {
  const total     = RAW_DATA.length;
  const submitted = RAW_DATA.filter(r => r.responded === "Yes").length;
  const missing   = total - submitted;
  const pct       = rate(submitted, total);
  const colleges  = [...new Set(RAW_DATA.map(r => r.college))].length;
  const depts     = [...new Set(RAW_DATA.map(r => r.department))].length;
  const faculty   = [...new Set(RAW_DATA.map(r => r.professor_requested_email))].length;
  return { total, submitted, missing, pct, colleges, depts, faculty };
}

export function getCollegeStats() {
  const map = {};
  RAW_DATA.forEach(r => {
    if (!map[r.college]) map[r.college] = { college: r.college, total: 0, submitted: 0 };
    map[r.college].total++;
    if (r.responded === "Yes") map[r.college].submitted++;
  });
  return Object.values(map)
    .map(c => ({ ...c, rate: rate(c.submitted, c.total), missing: c.total - c.submitted }))
    .sort((a, b) => b.rate - a.rate);
}

export function getDeptStats(collegeFilter = "") {
  const map = {};
  RAW_DATA
    .filter(r => !collegeFilter || r.college === collegeFilter)
    .forEach(r => {
      const key = `${r.college}||${r.department}`;
      if (!map[key]) map[key] = { college: r.college, department: r.department, total: 0, submitted: 0 };
      map[key].total++;
      if (r.responded === "Yes") map[key].submitted++;
    });
  return Object.values(map)
    .map(d => ({ ...d, rate: rate(d.submitted, d.total), missing: d.total - d.submitted }))
    .sort((a, b) => b.rate - a.rate);
}

export function getFacultyStats(collegeFilter = "", deptFilter = "", statusFilter = "") {
  const map = {};
  RAW_DATA
    .filter(r => {
      if (collegeFilter && r.college !== collegeFilter) return false;
      if (deptFilter    && r.department !== deptFilter)  return false;
      return true;
    })
    .forEach(r => {
      const key = r.professor_requested_email;
      if (!map[key]) map[key] = {
        name:       r.professor_requested_name,
        email:      r.professor_requested_email,
        college:    r.college,
        department: r.department,
        total: 0, submitted: 0,
      };
      map[key].total++;
      if (r.responded === "Yes") map[key].submitted++;
    });

  return Object.values(map)
    .map(f => ({ ...f, rate: rate(f.submitted, f.total), missing: f.total - f.submitted }))
    .filter(f => {
      if (statusFilter === "submitted") return f.rate === 100;
      if (statusFilter === "partial")   return f.rate > 0 && f.rate < 100;
      if (statusFilter === "missing")   return f.rate === 0;
      return true;
    })
    .sort((a, b) => a.rate - b.rate); // worst first by default
}

export const ALL_COLLEGES  = [...new Set(RAW_DATA.map(r => r.college))].sort();
export const ALL_DEPTS     = (college) =>
  [...new Set(RAW_DATA.filter(r => !college || r.college === college).map(r => r.department))].sort();
