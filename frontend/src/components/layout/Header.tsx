import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const Header = () => {
	const { user, logout, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	const handleLogout = () => {
		logout();
		navigate("/login");
	};

	return (
		<header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900/90 px-7">
			<div className="flex items-baseline gap-3">
				<span className="rounded-full bg-sky-500 px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950">
					CRYPTO ANALYSIS
				</span>
			</div>
			<div className="flex items-center gap-3">
				{isAuthenticated && user && (
					<>
						<span className="text-sm text-slate-400">
							Welcome,{" "}
							<span className="text-sky-400">
								{user.fullName || user.username}
							</span>
						</span>
						<button
							onClick={handleLogout}
							className="rounded-md border border-slate-600 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors"
							type="button"
						>
							Logout
						</button>
					</>
				)}
				{!isAuthenticated && (
					<button
						onClick={() => navigate("/login")}
						className="rounded-md border border-sky-600 bg-sky-600/10 px-3 py-1 text-xs text-sky-400 hover:bg-sky-600/20 transition-colors"
						type="button"
					>
						Login
					</button>
				)}
			</div>
		</header>
	);
};
