import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

export default function Feed() {
  const [moods, setMoods] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchMoods();
      const subscription = supabase
        .channel("public:moods")
        .on("postgres_changes", { event: "*", schema: "public", table: "moods" }, (payload) => {
          fetchMoods();
        })
        .subscribe();
      return () => subscription.unsubscribe();
    }
  }, [currentUserId]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      // Get the dbUser ID from the users table
      const { data: dbUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();
      if (dbUser) {
        setCurrentUserId(dbUser.id);
      }
    }
  }

  async function fetchMoods() {
    if (!currentUserId) return;

    // Get user's accepted friends
    const { data: friendships } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", currentUserId)
      .eq("status", "accepted");

    const friendIds = friendships?.map(f => f.friend_id) || [];
    
    // Include own user ID to see own moods + friends' moods
    const userIds = [currentUserId, ...friendIds];

    if (userIds.length === 0) {
      setMoods([]);
      return;
    }

    // Calculate today's date range
    const today = new Date();
    const todayStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Fetch today's moods only from friends and self
    const { data, error } = await supabase
      .from("moods")
      .select("id,mood,note,created_at,user_id,color,streak")
      .in("user_id", userIds)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString())
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
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Today's Moods</h2>
      {moods.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-2xl mb-2">📅</div>
          <div className="font-medium">No moods shared today</div>
          <div className="text-sm mt-1">Check back throughout the day to see what friends are feeling!</div>
        </div>
      )}
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
