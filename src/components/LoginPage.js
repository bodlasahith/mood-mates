import React, { useState } from "react";
import supabase from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="mb-8 text-center">
        <div className="font-bold text-2xl mb-2 bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
          Log In to MoodMates
        </div>
      </div>
      <form className="flex flex-col gap-4 mobile-form w-full max-w-xs" onSubmit={handleLogin}>
        <input
          className="mobile-input touch-btn"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="mobile-input touch-btn"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-brand text-white font-bold text-lg shadow-soft disabled:opacity-50 touch-btn mobile-btn"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>
        <button
          type="button"
          className="w-full h-12 rounded-xl bg-slate-100 text-brand font-bold text-lg shadow-soft touch-btn mobile-btn"
          onClick={() => navigate("/signup")}
        >
          Need an account? Sign Up
        </button>
      </form>
    </div>
  );
}
