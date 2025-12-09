import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient";

export default function Feed({ user, dbUser }) {
  const [moods, setMoods] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [quote, setQuote] = useState({ text: "", author: "" });
  const [quoteStatus, setQuoteStatus] = useState("idle");

  useEffect(() => {
    if (dbUser?.id) {
      fetchMoods();
      const subscription = supabase
        .channel("public:moods")
        .on("postgres_changes", { event: "*", schema: "public", table: "moods" }, (payload) => {
          fetchMoods();
        })
        .subscribe();
      return () => subscription.unsubscribe();
    }
  }, [dbUser?.id]);

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

  useEffect(() => {
    fetchQuote();
  }, []);

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
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
    if (!dbUser?.id) return;

    const { data: friendships } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("user_id", dbUser.id);

    const mutualFriendIds = [];
    for (const friendship of friendships || []) {
      const { data: mutualFriend } = await supabase
        .from("friends")
        .select("id")
        .eq("user_id", friendship.friend_id)
        .eq("friend_id", dbUser.id)
        .single();

      if (mutualFriend) {
        mutualFriendIds.push(friendship.friend_id);
      }
    }

    const allowedUserIds = [dbUser.id, ...mutualFriendIds];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { data, error } = await supabase
      .from("moods")
      .select("id,mood,note,created_at,user_id,color,streak")
      .in("user_id", allowedUserIds)
      .gte("created_at", todayISO)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
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

  async function fetchQuote() {
    try {
      setQuoteStatus("loading");
      const response = await fetch(
        "https://api.allorigins.win/get?url=" +
          encodeURIComponent(
            "http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en"
          )
      );
      const proxyPayload = await response.json();
      const quoteData = JSON.parse(proxyPayload.contents);
      setQuote({ text: quoteData.quoteText, author: quoteData.quoteAuthor || "Unknown" });
      setQuoteStatus("loaded");
    } catch (err) {
      console.error("Failed to fetch quote", err);
      setQuoteStatus("error");
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Today's Moods</h2>
      {moods.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-2xl mb-2">📅</div>
          <div className="font-medium">No moods shared today</div>
          <div className="text-sm mt-1">
            Check back throughout the day to see what friends are feeling!
          </div>
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
      <div className="mt-8 p-4 rounded-lg bg-slate-50 border border-slate-200">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Inspiration
        </div>
        {quoteStatus === "loading" && (
          <div className="text-slate-500 text-sm">Fetching a quote...</div>
        )}
        {quoteStatus === "error" && (
          <div className="text-slate-500 text-sm">Could not load a quote right now.</div>
        )}
        {quoteStatus === "loaded" && (
          <div>
            <div className="text-slate-800 italic">“{quote.text}”</div>
            <div className="text-slate-500 text-sm mt-1">— {quote.author || "Unknown"}</div>
          </div>
        )}
      </div>
    </div>
  );
}
