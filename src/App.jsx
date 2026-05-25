import { GraduationCap } from "lucide-react";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center gap-3">
        <div className="bg-blue-500 rounded-lg p-1.5">
          <GraduationCap size={18} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">Intervention Tracker</span>
          <p className="text-slate-500 text-[10px] leading-none mt-0.5">Faculty Submission Status</p>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto">
        <Dashboard />
      </main>
    </div>
  );
}
