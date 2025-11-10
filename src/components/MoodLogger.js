import React, { useState } from "react";
import supabase from "../supabaseClient";

const EMOJIS = ["🤩", "😊", "😌", "😐", "😕", "😔", "😢"];
const MOOD_COLORS = {
  "🤩": "#FF6B6B",
  "😊": "#4ECDC4",
  "😌": "#95E1D3",
  "😐": "#FFA07A",
  "😕": "#FFD93D",
  "😔": "#6C5CE7",
  "😢": "#A8A8A8",
};

export default function MoodLogger({ user, dbUser }) {
  const [emoji, setEmoji] = useState(EMOJIS[1]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitMood(e) {
    e.preventDefault();
    if (!user) return alert("Sign in to log a mood");
    if (!dbUser?.id) return alert("Profile not ready yet. Please wait a moment and try again.");
    setLoading(true);

    // Map emoji to mood text and get color
    const moodText = emoji;
    const color = MOOD_COLORS[emoji] || "#000000";

    // Get current streak
    const { data: lastMood } = await supabase
      .from("moods")
      .select("created_at, streak")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let streak = 1;
    if (lastMood && lastMood.length > 0) {
      const lastDate = new Date(lastMood[0].created_at);
      const today = new Date();
      const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        streak = lastMood[0].streak + 1;
      } else if (diffDays === 0) {
        streak = lastMood[0].streak;
      }
    }

    const { error } = await supabase.from("moods").insert([
      {
        user_id: dbUser.id,
        mood: moodText,
        note,
        created_at: new Date().toISOString(),
        streak,
        color,
      },
    ]);
    if (error) alert(error.message);
    else {
      setNote("");
      alert(`Mood logged! Current streak: ${streak} days`);
    }
    setLoading(false);
  }

  return (
    <form className="space-y-4 mobile-form" onSubmit={submitMood}>
      <div className="flex flex-wrap gap-2 mobile-stack">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center border transition-all touch-btn mobile-btn ${
              e === emoji
                ? "bg-gradient-to-r from-brand to-brand-light text-white shadow-soft border-brand"
                : "bg-white border-slate-200 hover:bg-slate-50"
            }`}
            onClick={() => setEmoji(e)}
            aria-pressed={e === emoji}
          >
            {e}
          </button>
        ))}
      </div>
      <textarea
        className="w-full min-h-24 rounded-xl border border-slate-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60 mobile-input"
        placeholder="Optional note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full h-14 rounded-xl bg-brand text-white font-medium text-base shadow-soft disabled:opacity-50 touch-btn mobile-btn"
      >
        {loading ? "Saving..." : "Log mood"}
      </button>
    </form>
  );
}
