import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Brain,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

import { API_URL } from "../services/apiConfig";


function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);


  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (!password) {
      setError(
        "Please enter a new password."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token,
            new_password: password,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
          "Unable to reset password."
        );
      }

      setSuccess(true);

    } catch (error) {
      console.error(
        "Password reset failed:",
        error
      );

      setError(
        error.message ||
        "Unable to reset password."
      );

    } finally {
      setLoading(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-screen bg-slate-950">

        <div className="flex min-h-screen items-center justify-center bg-white px-6">

          <div className="w-full max-w-md text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">

              <CheckCircle
                size={30}
                className="text-green-600"
              />

            </div>

            <h2 className="mt-6 text-3xl font-semibold text-slate-900">
              Password reset successful
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Your password has been changed successfully.
              You can now sign in with your new password.
            </p>

            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Go to Login
              <ArrowRight size={18} />
            </button>

          </div>

        </div>

      </div>
    );
  }


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

          </div>


          <p className="text-sm text-slate-600">
            © 2026 ResearchAI
          </p>

        </div>


        {/* RIGHT SIDE */}

        <div className="flex w-full items-center justify-center bg-white px-6 py-10 lg:w-1/2">

          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">

              <div className="flex items-center gap-3">

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

            </div>


            <div className="mb-8">

              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
                Reset your password
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter a new password for your ResearchAI account.
              </p>

            </div>


            {error && (

              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                {error}

              </div>

            )}


            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* NEW PASSWORD */}

              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  New password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
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
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >

                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


              {/* CONFIRM PASSWORD */}

              <div>

                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Confirm password
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(
                        event.target.value
                      )
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (previous) =>
                          !previous
                      )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >

                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}

                  </button>

                </div>

              </div>


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
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>


            <p className="mt-8 text-center text-sm text-slate-500">

              Remember your password?{" "}

              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-700"
              >
                Back to login
              </Link>

            </p>

          </div>

        </div>

      </div>

    </div>
  );
}


export default ResetPassword;