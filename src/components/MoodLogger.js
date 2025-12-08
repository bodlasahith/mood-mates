import React, { useState, useEffect } from "react";
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
  const [todaysMood, setTodaysMood] = useState(null);
  const [isUpdatingMood, setIsUpdatingMood] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submitMood(e) {
    e.preventDefault();
    if (!user) return alert("Sign in to log a mood");
    if (!dbUser?.id) return alert("Profile not ready yet. Please wait a moment and try again.");
    setLoading(true);

    // Map emoji to mood text and get color
    const moodText = emoji;
    const color = MOOD_COLORS[emoji] || "#000000";

    // Get current streak with better date handling
    const { data: lastMood } = await supabase
      .from("moods")
      .select("created_at, streak")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(1);

    let streak = 1;
    if (lastMood && lastMood.length > 0) {
      // Use UTC dates for consistent timezone handling
      const lastDate = new Date(lastMood[0].created_at);
      const today = new Date();

      // Get dates without time for comparison (normalize to start of day)
      const lastDateOnly = new Date(Date.UTC(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()));
      const todayOnly = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));

      const diffDays = Math.floor((todayOnly - lastDateOnly) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Yesterday - continue streak
        streak = (lastMood[0].streak || 0) + 1;
      } else if (diffDays === 0) {
        // Same day - prevent multiple logs
        setLoading(false);
        return alert("You've already logged your mood today! Come back tomorrow to continue your streak.");
      } else if (diffDays > 1) {
        // More than 1 day gap - streak broken, start over
        streak = 1;
      } else {
        // Future date (shouldn't happen) - reset to 1
        streak = 1;
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
      fetchTodaysMood(); // Refresh today's mood
    }
    setLoading(false);
  }
  async function fetchTodaysMood() {
    if(!dbUser?.id) return

    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    
    const { data, error } = await supabase
      .from("moods")
      .select("*")
      .eq("user_id", dbUser.id)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", todayEnd.toISOString())
      .single();

      if (!error && data) {
        setTodaysMood(data);
        setEmoji(data.mood);
        setNote(data.note || "");
      } else {
        setTodaysMood(null);
      }
  }
  useEffect(() => {
    if (dbUser?.id) {
      fetchTodaysMood();
    }
  }, [dbUser?.id]);

  return (
    <div className="space-y-4">
      {/* Today's Mood Display - shown when mood is logged */}
      {todaysMood ? (
        <div className="text-center py-8">
          <div className="bg-slate-50 rounded-xl p-6 border mb-4">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="text-4xl" style={{ filter: todaysMood.color ? `drop-shadow(0 0 6px ${todaysMood.color})` : "none" }}>
                {todaysMood.mood}
              </span>
              <div>
                <div className="font-semibold text-slate-800 text-lg">Today's Mood</div>
                <div className="text-sm text-slate-500">
                  Logged at {new Date(todaysMood.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
              </div>
            </div>
            
            {todaysMood.streak > 0 && (
              <div className="mb-3">
                <span className="text-sm bg-brand/10 text-brand px-3 py-1 rounded-full">
                  🔥 {todaysMood.streak} day streak
                </span>
              </div>
            )}
            
            {todaysMood.note && (
              <div className="text-sm text-slate-700 bg-white rounded-lg p-3 mb-3">
                "{todaysMood.note}"
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="font-medium text-slate-700">You've logged your mood for today!</div>
            <div className="text-sm text-slate-500">Come back tomorrow to continue your streak 🌟</div>
          </div>
        </div>
      ) : (
        /* Mood Logging Form - only shown when no mood logged today */
        <form className="space-y-4 mobile-form" onSubmit={submitMood}>
      <div className="flex flex-wrap gap-2 mobile-stack">
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            className={`w-14 h-14 rounded-xl text-3xl flex items-center justify-center border transition-all touch-btn mobile-btn ${e === emoji
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
      )}
    </div>
  );
}
