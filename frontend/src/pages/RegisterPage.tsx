import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface RegisterFormState {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
}

interface RegisterErrors {
	name?: string;
	email?: string;
	password?: string;
	confirmPassword?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterPage = () => {
	const navigate = useNavigate();
	const { register: registerUser } = useAuth();
	const [form, setForm] = useState<RegisterFormState>({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [errors, setErrors] = useState<RegisterErrors>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiError, setApiError] = useState<string>("");

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: undefined }));
		setApiError("");
	};

	const validate = () => {
		const nextErrors: RegisterErrors = {};

		if (!form.name.trim()) {
			nextErrors.name = "Name is required.";
		}

		if (!form.email.trim()) {
			nextErrors.email = "Email is required.";
		} else if (!emailRegex.test(form.email)) {
			nextErrors.email = "Please enter a valid email address.";
		}

		if (!form.password.trim()) {
			nextErrors.password = "Password is required.";
		} else if (form.password.length < 6) {
			nextErrors.password = "Password must be at least 6 characters.";
		}

		if (!form.confirmPassword.trim()) {
			nextErrors.confirmPassword = "Please confirm your password.";
		} else if (form.password !== form.confirmPassword) {
			nextErrors.confirmPassword = "Passwords do not match.";
		}

		setErrors(nextErrors);
		return Object.keys(nextErrors).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		setIsSubmitting(true);
		setApiError("");

		try {
			// Generate username from email (take part before @)
			const username = form.email.split("@")[0];

			const result = await registerUser(
				username,
				form.email,
				form.password,
				form.name,
			);

			if (result.success) {
				navigate("/dashboard");
			} else {
				// Parse friendly error message
				const errorMsg =
					result.message || "Registration failed. Please try again.";
				if (errorMsg.includes("Password must be at least 6 characters")) {
					setErrors({ password: "Password must be at least 6 characters." });
				} else if (
					errorMsg.includes("Username") &&
					errorMsg.includes("between 3 and 50")
				) {
					setErrors({ name: "Username must be between 3 and 50 characters." });
				} else if (errorMsg.includes("Email must be valid")) {
					setErrors({ email: "Please enter a valid email address." });
				} else {
					setApiError(errorMsg);
				}
			}
		} catch (error: any) {
			const errorMsg =
				error?.response?.data?.message ||
				error?.message ||
				"An unexpected error occurred.";
			setApiError(errorMsg);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
			<div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 px-6 py-7 shadow-xl">
				<div className="mb-6 text-center">
					<h1 className="text-xl font-semibold text-slate-50">
						Create account
					</h1>
					<p className="mt-1 text-sm text-slate-400">
						Sign up to start using the crypto analysis dashboard.
					</p>
				</div>

				<form className="space-y-4" onSubmit={handleSubmit} noValidate>
					<div className="space-y-1.5">
						<label
							htmlFor="name"
							className="block text-sm font-medium text-slate-200"
						>
							Name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							value={form.name}
							onChange={handleChange}
							className={`w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 ${
								errors.name
									? "border-red-500"
									: "border-slate-700 focus:border-sky-500"
							}`}
							placeholder="Your full name"
						/>
						{errors.name && (
							<p className="text-xs text-red-400">{errors.name}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="email"
							className="block text-sm font-medium text-slate-200"
						>
							Email
						</label>
						<input
							id="email"
							name="email"
							type="email"
							value={form.email}
							onChange={handleChange}
							className={`w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 ${
								errors.email
									? "border-red-500"
									: "border-slate-700 focus:border-sky-500"
							}`}
							placeholder="you@example.com"
						/>
						{errors.email && (
							<p className="text-xs text-red-400">{errors.email}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="password"
							className="block text-sm font-medium text-slate-200"
						>
							Password
						</label>
						<input
							id="password"
							name="password"
							type="password"
							value={form.password}
							onChange={handleChange}
							className={`w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 ${
								errors.password
									? "border-red-500"
									: "border-slate-700 focus:border-sky-500"
							}`}
							placeholder="Create a password"
						/>
						{errors.password && (
							<p className="text-xs text-red-400">{errors.password}</p>
						)}
					</div>

					<div className="space-y-1.5">
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-slate-200"
						>
							Confirm Password
						</label>
						<input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							value={form.confirmPassword}
							onChange={handleChange}
							className={`w-full rounded-md border bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 ${
								errors.confirmPassword
									? "border-red-500"
									: "border-slate-700 focus:border-sky-500"
							}`}
							placeholder="Repeat your password"
						/>
						{errors.confirmPassword && (
							<p className="text-xs text-red-400">{errors.confirmPassword}</p>
						)}
					</div>

					{apiError && (
						<div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
							{apiError}
						</div>
					)}

					<button
						type="submit"
						disabled={isSubmitting}
						className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Registering..." : "Register"}
					</button>
				</form>

				<div className="mt-4 text-center text-xs text-slate-400">
					Already have an account?{" "}
					<Link
						to="/login"
						className="font-medium text-sky-400 hover:text-sky-300"
					>
						Login
					</Link>
				</div>
			</div>
		</div>
	);
};
