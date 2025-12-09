import React, { useState } from "react";
import supabase from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSignUp(e) {
    e.preventDefault();
    if (!username.trim()) return alert("Username is required");
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        alert(authError.message);
        setLoading(false);
        return;
      }

      const { error: profileErr } = await supabase.from("users").insert([
        {
          username: username.trim(),
          email,
        },
      ]);

      if (profileErr && profileErr.code !== "23505") {
        console.warn("Profile create error (this is OK, will be created on login):", profileErr);
      }

      alert("Account created! Please check your email for confirmation link.");
      setLoading(false);
      navigate("/login");
    } catch (error) {
      console.error("Signup error:", error);
      alert("There was an error creating your account. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="mb-8 text-center">
        <div className="font-bold text-2xl mb-2 bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
          Sign Up for MoodMates
        </div>
      </div>
      <form className="flex flex-col gap-4 mobile-form w-full max-w-xs" onSubmit={handleSignUp}>
        <input
          className="mobile-input touch-btn"
          placeholder="Username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
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
          {loading ? "Signing up..." : "Sign Up"}
        </button>
        <button
          type="button"
          className="w-full h-12 rounded-xl bg-slate-100 text-brand font-bold text-lg shadow-soft touch-btn mobile-btn"
          onClick={() => navigate("/login")}
        >
          Already have an account? Log In
        </button>
      </form>
    </div>
  );
}
