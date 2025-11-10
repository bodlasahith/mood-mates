import React from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500 px-4">
      <div className="mb-8 text-center">
        <div className="font-bold text-3xl mb-2 bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
          MoodMates
        </div>
        <div className="text-lg text-slate-700 mb-4">
          Track your moods, connect with friends, and build healthy habits.
        </div>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <button
          className="w-full h-14 rounded-xl bg-brand text-white font-bold text-lg shadow-soft touch-btn mobile-btn"
          onClick={() => navigate("/signup")}
        >
          Sign Up
        </button>
        <button
          className="w-full h-14 rounded-xl bg-slate-100 text-brand font-bold text-lg shadow-soft touch-btn mobile-btn"
          onClick={() => navigate("/login")}
        >
          Log In
        </button>
      </div>
    </div>
  );
}
