import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

interface LoginFormState {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormState>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const nextErrors: LoginErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailRegex.test(form.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!form.password.trim()) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log("Login form submitted:", form);

    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 px-6 py-7 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-slate-50">Sign in</h1>
          <p className="mt-1 text-sm text-slate-400">
            Access your crypto analysis dashboard.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
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
              placeholder="Your password"
            />
            {errors.password && (
              <p className="text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="mt-2 inline-flex w-full items-center justify-center rounded-md bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          >
            Login
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-sky-400 hover:text-sky-300"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};
