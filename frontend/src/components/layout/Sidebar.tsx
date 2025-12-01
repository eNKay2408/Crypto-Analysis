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
      </nav>
    </aside>
  );
};
