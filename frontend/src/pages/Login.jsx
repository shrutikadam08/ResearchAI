import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Brain,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";

import {
  loginUser,
  setToken,
} from "../services/authService";


function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");


  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };


  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!formData.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser(formData);

      /*
       * Save JWT token.
       * The Find Papers page will use this token
       * when calling the protected FastAPI endpoints.
       */
     setToken(
  response.access_token
);

      /*
       * Save basic login state.
       */
      localStorage.setItem(
        "is_logged_in",
        "true"
      );

      /*
       * Go to dashboard after successful login.
       */
      navigate("/dashboard", {
        replace:true,
      });

    } catch (error) {
      console.error(
        "Login failed:",
        error
      );

      if (error.response?.status === 401) {
        setError(
          "Invalid email or password."
        );
      } else if (
        error.response?.status === 403
      ) {
        setError(
          "Your account is inactive."
        );
      } else if (
        error.response?.data?.detail
      ) {
        setError(
          error.response.data.detail
        );
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-950">

      <div className="flex min-h-screen">

        {/* LEFT SIDE */}

        <div className="hidden w-1/2 flex-col justify-between bg-slate-950 p-12 lg:flex">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">

                <Brain
                  size={23}
                  className="text-white"
                />

              </div>

              <span className="text-xl font-semibold text-white">
                ResearchAI
              </span>

            </div>

          </div>


          <div className="max-w-lg">

            <p className="mb-4 text-sm font-medium uppercase tracking-widest text-indigo-400">
              AI-Powered Research
            </p>

            <h1 className="text-5xl font-semibold leading-tight tracking-tight text-white">
              Discover research.
              <br />
              Understand more.
              <br />
              Research smarter.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
              Discover academic papers, explore
              research literature and use AI to
              understand your research faster.
            </p>

          </div>


          <p className="text-sm text-slate-600">
            © 2026 ResearchAI
          </p>

        </div>


        {/* RIGHT SIDE */}

        <div className="flex w-full items-center justify-center bg-white px-6 py-10 lg:w-1/2">

          <div className="w-full max-w-md">

            {/* Mobile logo */}

            <div className="mb-10 flex items-center gap-3 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">

                <Brain
                  size={22}
                  className="text-white"
                />

              </div>

              <span className="text-xl font-semibold text-slate-900">
                ResearchAI
              </span>

            </div>


            {/* Heading */}

            <div className="mb-8">

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue your research.
              </p>

            </div>


            {/* Error */}

            {error && (

              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                {error}

              </div>

            )}


            {/* Form */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />

                </div>

              </div>


              {/* Password */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


              {/* Login button */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in

                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>


            {/* Register */}

            <p className="mt-8 text-center text-sm text-slate-500">

              Don't have an account?{" "}

              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Create an account
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


export default Login;