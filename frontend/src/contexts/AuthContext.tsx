import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { apiService } from "../services/apiService";

interface User {
	id: number;
	username: string;
	email: string;
	fullName?: string;
	role: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	loading: boolean;
	login: (
		email: string,
		password: string,
	) => Promise<{ success: boolean; message?: string }>;
	register: (
		username: string,
		email: string,
		password: string,
		fullName?: string,
	) => Promise<{ success: boolean; message?: string }>;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	// Load user from localStorage on mount
	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		const storedUser = localStorage.getItem("user");

		if (storedToken && storedUser) {
			setToken(storedToken);
			setUser(JSON.parse(storedUser));
		}

		setLoading(false);
	}, []);

	const login = async (email: string, password: string) => {
		try {
			const response: any = await apiService.login({ email, password });

			if (response.success && response.token) {
				setToken(response.token);
				setUser(response.user);

				// Save to localStorage
				localStorage.setItem("token", response.token);
				localStorage.setItem("user", JSON.stringify(response.user));

				return { success: true };
			} else {
				return { success: false, message: response.message || "Login failed" };
			}
		} catch (error: any) {
			console.error("Login error:", error);
			return {
				success: false,
				message: error.message || "An error occurred during login",
			};
		}
	};

	const register = async (
		username: string,
		email: string,
		password: string,
		fullName?: string,
	) => {
		try {
			const response: any = await apiService.register({
				username,
				email,
				password,
				fullName,
			});

			if (response.success && response.token) {
				setToken(response.token);
				setUser(response.user);

				// Save to localStorage
				localStorage.setItem("token", response.token);
				localStorage.setItem("user", JSON.stringify(response.user));

				return { success: true };
			} else {
				return {
					success: false,
					message: response.message || "Registration failed",
				};
			}
		} catch (error: any) {
			console.error("Registration error:", error);
			return {
				success: false,
				message: error.message || "An error occurred during registration",
			};
		}
	};

	const logout = () => {
		setUser(null);
		setToken(null);
		localStorage.removeItem("token");
		localStorage.removeItem("user");
	};

	const value = {
		user,
		token,
		loading,
		login,
		register,
		logout,
		isAuthenticated: !!token,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
