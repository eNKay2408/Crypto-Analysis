import { NavLink } from "react-router-dom";

export const RightNavigationPanel = () => {
	return (
		<div className="flex w-20 flex-col border-l border-slate-800 bg-slate-900">
			{/* Panel Header */}
			<div className="flex h-14 items-center justify-center border-b border-slate-800">
				<div className="text-xs font-semibold text-slate-500">Menu</div>
			</div>

			{/* Navigation Tabs */}
			<nav className="flex flex-col gap-2 p-2">
				<NavLink
					to="/dashboard"
					end
					className={({ isActive }) =>
						`group flex flex-col items-center gap-1 rounded-lg px-2 py-3 transition-all ${
							isActive
								? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
								: "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
						}`
					}
				>
					{({ isActive }) => (
						<>
							{/* Dashboard Icon */}
							<svg
								className="h-6 w-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
							<span className="text-[10px] font-medium">Dashboard</span>
						</>
					)}
				</NavLink>

				<NavLink
					to="/news-analysis"
					className={({ isActive }) =>
						`group flex flex-col items-center gap-1 rounded-lg px-2 py-3 transition-all ${
							isActive
								? "bg-sky-600 text-white shadow-lg shadow-sky-600/30"
								: "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
						}`
					}
				>
					{({ isActive }) => (
						<>
							{/* News Icon */}
							<svg
								className="h-6 w-6"
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
							<span className="text-[10px] font-medium">News</span>
						</>
					)}
				</NavLink>
			</nav>
		</div>
	);
};
