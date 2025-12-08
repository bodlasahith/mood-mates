import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import supabase from "./supabaseClient";
// import Auth from "./components/Auth";
import MoodLogger from "./components/MoodLogger";
import Feed from "./components/Feed";
import History from "./components/History";
import Friends from "./components/Friends";
import Navbar from "./components/Navbar";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";

function AppRoutes() {
  const [session, setSession] = useState(null);
  const [dbUser, setDbUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  // const [view, setView] = useState("feed");

  useEffect(() => {
    supabase.auth.getSession().then((r) => setSession(r.data?.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const user = session?.user || null;

  const ensureDbUser = useCallback(
    async (authUser) => {
      if (!authUser) return;

      // Prevent multiple simultaneous calls
      setLoadingProfile(true);

      try {
        // First, try to find existing user
        const { data, error } = await supabase
          .from("users")
          .select("id,username,email")
          .eq("email", authUser.email)
          .single();

        if (!error && data) {
          setDbUser(data);
          setLoadingProfile(false);
          return;
        }

        // If user doesn't exist, create them
        console.log("Creating user profile for:", authUser.email);
        const defaultUsername = (authUser.email || "user").split("@")[0];

        const { data: inserted, error: insertErr } = await supabase
          .from("users")
          .insert([
            {
              username: defaultUsername,
              email: authUser.email,
            },
          ])
          .select("id,username,email")
          .single();

        if (!insertErr && inserted) {
          console.log("User profile created successfully:", inserted);
          setDbUser(inserted);
          setLoadingProfile(false);
          return;
        }

        // Handle duplicate key error (race condition)
        if (insertErr && insertErr.code === "23505") {
          console.log("Duplicate user detected, fetching existing user");
          const { data: fetched, error: fetchError } = await supabase
            .from("users")
            .select("id,username,email")
            .eq("email", authUser.email)
            .single();

          if (!fetchError && fetched) {
            setDbUser(fetched);
            setLoadingProfile(false);
            return;
          }
        }

        // If we get here, something went wrong
        console.error("Failed to create or fetch user profile:", insertErr);
        setLoadingProfile(false);
      } catch (error) {
        console.error("Error in ensureDbUser:", error);
        setLoadingProfile(false);
      }
    },
    [] // Remove loadingProfile from dependencies
  );

  useEffect(() => {
    if (user?.email && !dbUser && !loadingProfile) {
      ensureDbUser(user);
    } else if (!user) {
      setDbUser(null);
    }
  }, [user?.email, dbUser, loadingProfile, ensureDbUser]);

  // Redirect signed-in users to /feed
  if (user) {
    // Show loading state while setting up user profile
    if (loadingProfile) {
      return (
        <div className="flex flex-col items-center justify-center min-h-64 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mb-4"></div>
          <p className="text-slate-600">Setting up your profile...</p>
        </div>
      );
    }

    return (
      <Routes>
        <Route path="/" element={<Navigate to="/feed" replace />} />
        <Route path="/feed" element={<Feed user={user} dbUser={dbUser} />} />
        <Route path="/log" element={<MoodLogger user={user} dbUser={dbUser} />} />
        <Route path="/history" element={<History user={user} dbUser={dbUser} />} />
        <Route path="/friends" element={<Friends user={user} dbUser={dbUser} />} />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    );
  }
  // Unauthenticated: show landing and auth pages
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then((r) => setSession(r.data?.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-slate-900">
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="max-w-2xl mx-auto flex items-center justify-between py-3 px-4">
            <div className="font-bold text-lg bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
              MoodMates
            </div>
            {session?.user && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Log Out
              </button>
            )}
          </div>
        </header>
        <main className="max-w-2xl mx-auto pt-4 pb-24 px-4">
          <AppRoutes />
        </main>
        <footer className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200">
          <div className="max-w-2xl mx-auto py-2 px-4">
            <Navbar />
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;
