import { useState } from "react";
import {useNavigate} from "react-router-dom";
import { User, Mail, Lock, ArrowRight, Brain } from "lucide-react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate=useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await axios.post(`${API_URL}/auth/register`, {
        full_name: fullName,
        email,
        password,
      });

      alert("Account created successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);

      const message =
        error.response?.data?.detail ||
        "Registration failed.";

      alert(message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* Left */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-transparent to-purple-600/20" />

        <div className="relative z-10 flex flex-col justify-center px-16 max-w-2xl">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <Brain size={27} />
            </div>

            <span className="text-2xl font-bold">
              ResearchAI
            </span>
          </div>

          <h1 className="text-5xl font-bold leading-tight">
            Start your
            <span className="text-blue-500"> research journey.</span>
          </h1>

          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            Organize your research papers, search through evidence,
            compare studies and discover research gaps with AI.
          </p>

        </div>
      </div>

      {/* Right */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center">
              <Brain size={25} />
            </div>

            <span className="text-2xl font-bold">
              ResearchAI
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold">
              Create your account
            </h2>

            <p className="text-slate-400 mt-2">
              Start exploring your research with AI.
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>

              <div className="relative">
                <User
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={19}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 rounded-xl py-3.5 font-semibold flex items-center justify-center gap-2 transition"
            >
              Create Account
              <ArrowRight size={18} />
            </button>

          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-blue-400 hover:text-blue-300 font-medium"
              >
              Sign in
            </button>
          </p>

        </div>
      </div>

    </div>
  );
}

export default Register;