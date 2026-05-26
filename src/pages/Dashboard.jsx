import { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  Users, CheckCircle, XCircle, BarChart2,
  Search, ChevronDown, ChevronUp,
} from "lucide-react";
import KPICard from "../components/KPICard";
import RateBadge from "../components/RateBadge";
import {
  loadDashboardData, getOverallStats, getCollegeStats, getDeptStats,
  getFacultyStats, getAllColleges, getAllDepts,
} from "../data/data";

const BAR_COLOR = (rate) =>
  rate >= 80 ? "#4ade80" : rate >= 60 ? "#fbbf24" : "#f87171";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-700">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [college,  setCollege]  = useState("");
  const [dept,     setDept]     = useState("");
  const [status,   setStatus]   = useState("");
  const [search,   setSearch]   = useState("");
  const [sortDir,  setSortDir]  = useState("asc"); // asc = worst first
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    loadDashboardData()
      .then((data) => {
        if (!isMounted) return;
        setRows(data);
        setLoadError("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setLoadError(error.message || "Could not load dashboard data.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const stats    = useMemo(() => getOverallStats(rows), [rows]);
  const colleges = useMemo(() => getCollegeStats(rows), [rows]);
  const depts    = useMemo(() => getDeptStats(rows, college), [rows, college]);
  const faculty  = useMemo(
    () => getFacultyStats(rows, college, dept, status),
    [rows, college, dept, status]
  );

  const filteredFaculty = useMemo(() => {
    const base = search
      ? faculty.filter(f =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.department.toLowerCase().includes(search.toLowerCase())
        )
      : faculty;
    return [...base].sort((a, b) =>
      sortDir === "asc" ? a.rate - b.rate : b.rate - a.rate
    );
  }, [faculty, search, sortDir]);

  const allColleges = useMemo(() => getAllColleges(rows), [rows]);
  const deptOptions = useMemo(() => getAllDepts(rows, college), [rows, college]);

  const collegeChartData = colleges.map(c => ({
    name: c.college.replace("College of ", "").replace(" & ", " & ").substring(0, 22),
    fullName: c.college,
    rate: c.rate,
    submitted: c.submitted,
    total: c.total,
  }));

  const deptChartData = depts.slice(0, 15).map(d => ({
    name: d.department.substring(0, 18),
    fullName: d.department,
    rate: d.rate,
    submitted: d.submitted,
    total: d.total,
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-semibold text-slate-800">{d.fullName}</p>
        <p className="text-slate-500">{d.submitted} / {d.total} submitted</p>
        <p className={`font-bold ${d.rate >= 80 ? "text-green-600" : d.rate >= 60 ? "text-amber-600" : "text-red-600"}`}>
          {d.rate}% completion
        </p>
      </div>
    );
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Submission Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Faculty progress report submission status · Committed CSV data
          </p>
        </div>
        <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-full font-medium">
          CSV Mode
        </span>
      </div>


      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {loadError}
        </div>
      )}

      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500">
          Loading progress report data…
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Sections"      value={stats.total.toLocaleString()}     icon={BarChart2}    color="blue"  />
        <KPICard title="Submitted"           value={stats.submitted.toLocaleString()} subtitle={`${stats.pct}% completion rate`} icon={CheckCircle} color="green" />
        <KPICard title="Not Submitted"       value={stats.missing.toLocaleString()}   icon={XCircle}      color="red"   />
        <KPICard title="Faculty Members"     value={stats.faculty.toLocaleString()}   icon={Users}        color="purple"/>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-6 py-4 flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-slate-600 mr-1">Filter:</span>

        <select value={college} onChange={e => { setCollege(e.target.value); setDept(""); }}
          className="border border-slate-200 rounded-lg text-sm px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Colleges</option>
          {allColleges.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={dept} onChange={e => setDept(e.target.value)}
          className="border border-slate-200 rounded-lg text-sm px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Departments</option>
          {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-slate-200 rounded-lg text-sm px-3 py-1.5 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="submitted">Fully Submitted (100%)</option>
          <option value="partial">Partial</option>
          <option value="missing">Not Submitted (0%)</option>
        </select>

        {(college || dept || status) && (
          <button onClick={() => { setCollege(""); setDept(""); setStatus(""); }}
            className="text-xs text-slate-400 hover:text-slate-600 underline">
            Clear
          </button>
        )}

        <span className="ml-auto text-xs text-slate-400">
          {filteredFaculty.length} faculty members
        </span>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* College chart */}
        <Section title="Submission Rate by College">
          <div className="px-4 py-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collegeChartData} layout="vertical"
                margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]}
                  onClick={d => setCollege(college === d.fullName ? "" : d.fullName)}>
                  {collegeChartData.map(entry => (
                    <Cell key={entry.name}
                      fill={college === entry.fullName ? "#2563eb" : BAR_COLOR(entry.rate)}
                      opacity={college && college !== entry.fullName ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 px-6 pb-3">Click a bar to filter by college</p>
        </Section>

        {/* Dept chart */}
        <Section title={`Submission Rate by Department${college ? ` · ${college.replace("College of ", "")}` : ""}`}>
          <div className="px-4 py-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptChartData} layout="vertical"
                margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
                <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={v => `${v}%`}
                  tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rate" radius={[0, 6, 6, 0]}
                  onClick={d => setDept(dept === d.fullName ? "" : d.fullName)}>
                  {deptChartData.map(entry => (
                    <Cell key={entry.name}
                      fill={dept === entry.fullName ? "#2563eb" : BAR_COLOR(entry.rate)}
                      opacity={dept && dept !== entry.fullName ? 0.4 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 px-6 pb-3">Click a bar to filter by department</p>
        </Section>
      </div>

      {/* Department table */}
      <Section title="Department Breakdown">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">College</th>
                <th className="px-4 py-3 text-left font-medium">Rate</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium">Missing</th>
                <th className="px-4 py-3 text-left font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {depts.map(d => (
                <tr key={`${d.college}${d.department}`}
                  onClick={() => setDept(dept === d.department ? "" : d.department)}
                  className={`border-b border-slate-50 cursor-pointer transition-colors ${dept === d.department ? "bg-blue-50" : "hover:bg-slate-50"}`}>
                  <td className="px-6 py-3 font-medium text-slate-800">{d.department}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{d.college.replace("College of ", "")}</td>
                  <td className="px-4 py-3"><RateBadge rate={d.rate} /></td>
                  <td className="px-4 py-3 text-green-600 font-medium">{d.submitted}</td>
                  <td className="px-4 py-3 text-red-500">{d.missing}</td>
                  <td className="px-4 py-3 text-slate-500">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Faculty table */}
      <Section title="Faculty Submission Status">
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            <input type="text" placeholder="Search faculty or department…" value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors">
            Sort by rate {sortDir === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <span className="ml-auto text-xs text-slate-400">{filteredFaculty.length} results</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b border-slate-100 uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Faculty</th>
                <th className="px-4 py-3 text-left font-medium">Department</th>
                <th className="px-4 py-3 text-left font-medium">College</th>
                <th className="px-4 py-3 text-left font-medium">Rate</th>
                <th className="px-4 py-3 text-left font-medium">Submitted</th>
                <th className="px-4 py-3 text-left font-medium">Missing</th>
                <th className="px-4 py-3 text-left font-medium">Sections</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculty.slice(0, 100).map(f => (
                <tr key={f.email} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-slate-800">{f.name}</p>
                    <p className="text-xs text-slate-400">{f.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.department}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{f.college.replace("College of ", "")}</td>
                  <td className="px-4 py-3"><RateBadge rate={f.rate} /></td>
                  <td className="px-4 py-3 text-green-600 font-medium">{f.submitted}</td>
                  <td className="px-4 py-3 text-red-500">{f.missing}</td>
                  <td className="px-4 py-3 text-slate-500">{f.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredFaculty.length > 100 && (
            <p className="text-xs text-slate-400 px-6 py-3">
              Showing 100 of {filteredFaculty.length} — use filters to narrow results
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}
