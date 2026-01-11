import { NavLink } from "react-router-dom";
export const Sidebar = () => {
  return (
    <aside className="flex w-56 flex-col gap-3 border-r border-slate-800 bg-slate-900 px-5 py-5 text-sm text-slate-300 max-md:h-14 max-md:w-full max-md:flex-row max-md:items-center max-md:justify-between max-md:border-b max-md:border-r-0">
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        Overview
      </div>
      <nav className="flex flex-col gap-1 max-md:flex-row">
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            [
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
              "transition-colors",
              isActive
                ? "border-sky-500 bg-slate-800 text-sky-100"
                : "border-transparent text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100",
            ].join(" ")
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/news-analysis"
          className={({ isActive }) =>
            [
              "inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs",
              "transition-colors",
              isActive
                ? "border-sky-500 bg-slate-800 text-sky-100"
                : "border-transparent text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100",
            ].join(" ")
          }
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          AI News Analysis
        </NavLink>
      </nav>
    </aside>
  );
};
