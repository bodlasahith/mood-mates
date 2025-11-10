import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { id: "feed", label: "Feed", icon: "📰", path: "/feed" },
  { id: "log", label: "Log", icon: "➕", path: "/log" },
  { id: "history", label: "History", icon: "📅", path: "/history" },
  { id: "friends", label: "Friends", icon: "👥", path: "/friends" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="flex gap-2 text-sm">
      {tabs.map((t) => {
        const active = location.pathname === t.path;
        return (
          <button
            key={t.id}
            onClick={() => navigate(t.path)}
            className={`flex-1 flex flex-col items-center justify-center rounded-lg py-2 font-medium transition-colors shadow-soft border text-slate-600 touch-btn mobile-btn ${
              active
                ? "bg-gradient-to-r from-brand to-brand-light text-white border-brand"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
            aria-current={active ? "page" : undefined}
          >
            <span className="text-2xl leading-none">{t.icon}</span>
          </button>
        );
      })}
    </nav>
  );
}
