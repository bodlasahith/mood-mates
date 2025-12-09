import React, { useState, useEffect, useCallback } from "react";
import supabase from "../supabaseClient";

export default function Auth({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [isSignUp, setIsSignUp] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isFetchingProfile, setIsFetchingProfile] = useState(false);

  const fetchUserProfile = useCallback(
    async (email) => {
      if (!email || isFetchingProfile) return;
      setIsFetchingProfile(true);
      try {
        const { data, error } = await supabase
          .from("users")
          .select("id,username,email")
          .eq("email", email)
          .single();
        if (error) {
          if (error.code === "PGRST116") {
            const defaultUsername = email.split("@")[0];
            const { data: inserted, error: insertErr } = await supabase
              .from("users")
              .insert([{ username: defaultUsername, email }])
              .select("id,username,email")
              .single();
            if (!insertErr && inserted) {
              setCurrentUser(inserted);
              setNewUsername(inserted.username || "");
            } else if (insertErr && insertErr.code === "23505") {
              const { data: raced } = await supabase
                .from("users")
                .select("id,username,email")
                .eq("email", email)
                .single();
              if (raced) {
                setCurrentUser(raced);
                setNewUsername(raced.username || "");
              }
            }
          } else {
            console.warn("Profile fetch error", error);
          }
        } else if (data) {
          setCurrentUser(data);
          setNewUsername(data.username || "");
        }
      } finally {
        setIsFetchingProfile(false);
      }
    },
    [isFetchingProfile]
  );

  useEffect(() => {
    supabase.auth.getSession().then((r) => {
      setSession(r.data?.session ?? null);
      const email = r.data?.session?.user?.email;
      if (email) fetchUserProfile(email);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      const email = s?.user?.email;
      if (email) fetchUserProfile(email);
      onAuth && onAuth(s);
    });
    return () => listener?.subscription?.unsubscribe && listener.subscription.unsubscribe();
  }, [onAuth, fetchUserProfile]);

  async function signUp(e) {
    e.preventDefault();
    if (!username.trim()) return alert.error("Username is required");

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      alert.error(authError.message);
      setLoading(false);
      return;
    }

    const { error: profileErr } = await supabase
      .from("users")
      .insert([{ username: username.trim(), email }]);
    if (profileErr && profileErr.code !== "23505") {
      console.warn("Profile create error", profileErr);
    }
    alert("Account created! Check your email for confirmation (if enabled)");
    setIsSignUp(false);
    setUsername("");

    setLoading(false);
  }

  async function signIn(e) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    onAuth && onAuth(null);
  }

  async function updateProfile(e) {
    e.preventDefault();
    if (!newUsername.trim()) return alert("Username cannot be empty");

    setLoading(true);
    const { error } = await supabase
      .from("users")
      .update({ username: newUsername.trim() })
      .eq("email", session.user.email);

    if (error) {
      alert(error.message);
    } else {
      setEditingProfile(false);
      fetchUserProfile(session.user.email);
    }
    setLoading(false);
  }

  if (session && session.user) {
    return (
      <div className="flex items-center gap-3">
        {editingProfile ? (
          <form onSubmit={updateProfile} className="flex items-center gap-2">
            <input
              className="h-9 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60"
              placeholder="Username"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-3 rounded-md bg-brand text-white text-sm disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => {
                setEditingProfile(false);
                setNewUsername(currentUser?.username || "");
              }}
              className="h-9 px-3 rounded-md bg-slate-200 text-slate-700 text-sm"
            >
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div className="text-xs text-slate-600">
              {currentUser?.username ? (
                <>
                  <strong>{currentUser.username}</strong> ({session.user.email})
                </>
              ) : (
                session.user.email
              )}
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
            >
              Edit Profile
            </button>
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm"
            >
              Sign out
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={isSignUp ? signUp : signIn} className="flex flex-col gap-4 mobile-form">
        {isSignUp && (
          <input
            className="mobile-input touch-btn"
            placeholder="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input
          className="mobile-input touch-btn"
          placeholder="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="mobile-input touch-btn"
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-brand text-white font-medium text-base shadow-soft disabled:opacity-50 touch-btn mobile-btn"
          >
            {isSignUp ? "Sign up" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setUsername("");
            }}
            disabled={loading}
            className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-base shadow-soft disabled:opacity-50 touch-btn mobile-btn"
          >
            {isSignUp ? "Back to Sign in" : "Create Account"}
          </button>
        </div>
      </form>
    </div>
  );
}
