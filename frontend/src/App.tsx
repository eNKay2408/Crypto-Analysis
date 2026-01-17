import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { NewsAnalysisPage } from "./pages/NewsAnalysisPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
	const { isAuthenticated, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-slate-950">
				<div className="text-slate-400">Loading...</div>
			</div>
		);
	}

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<LoginPage />} />
			<Route path="/login" element={<LoginPage />} />
			<Route path="/register" element={<RegisterPage />} />
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<DashboardLayout>
							<DashboardPage />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/news-analysis"
				element={
					<ProtectedRoute>
						<DashboardLayout>
							<NewsAnalysisPage />
						</DashboardLayout>
					</ProtectedRoute>
				}
			/>
		</Routes>
	);
}

function App() {
	return (
		<AuthProvider>
			<AppRoutes />
		</AuthProvider>
	);
}

export default App;
