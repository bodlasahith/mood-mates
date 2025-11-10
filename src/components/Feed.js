import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

export default function Feed() {
  const [moods, setMoods] = useState([]);

  useEffect(() => {
    fetchMoods();
    const subscription = supabase
      .channel("public:moods")
      .on("postgres_changes", { event: "*", schema: "public", table: "moods" }, (payload) => {
        fetchMoods();
      })
      .subscribe();
    return () => subscription.unsubscribe();
  }, []);

  async function fetchMoods() {
    const { data, error } = await supabase
      .from("moods")
      .select("id,mood,note,created_at,user_id,color,streak")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error(error);
    } else {
      // Fetch user details for each mood
      const moodsWithUsers = await Promise.all(
        (data || []).map(async (m) => {
          const { data: userData } = await supabase
            .from("users")
            .select("email,username")
            .eq("id", m.user_id)
            .single();
          return { ...m, userData };
        })
      );
      setMoods(moodsWithUsers);
    }
  }

  return (
    <div>
      {moods.length === 0 && <div className="empty">No moods yet</div>}
      {moods.map((m) => (
        <div key={m.id} className="flex gap-3 py-3 border-b border-slate-100">
          <div
            className="text-3xl select-none"
            style={{ filter: m.color ? `drop-shadow(0 0 4px ${m.color})` : "none" }}
          >
            {m.mood}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-slate-800 truncate">
              {m.userData?.username || m.userData?.email || `User ${m.user_id}`}
            </div>
            {m.note && <div className="mt-1 text-slate-700 break-words">{m.note}</div>}
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {new Date(m.created_at).toLocaleString()}
              </span>
              {m.streak > 0 && (
                <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                  🔥 {m.streak} day streak
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
