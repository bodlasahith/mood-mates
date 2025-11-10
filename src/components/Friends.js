import React, { useEffect, useState, useCallback } from "react";
import supabase from "../supabaseClient";

export default function Friends({ user, dbUser }) {
  const [friends, setFriends] = useState([]);
  const [targetEmail, setTargetEmail] = useState("");

  const fetchFriends = useCallback(async () => {
    if (!dbUser?.id) return;
    const { data, error } = await supabase
      .from("friends")
      .select("id,friend_id,status")
      .eq("user_id", dbUser.id);
    if (error) {
      console.error(error);
    } else {
      // Fetch friend details
      const friendsWithDetails = await Promise.all(
        (data || []).map(async (f) => {
          const { data: userData } = await supabase
            .from("users")
            .select("email,username")
            .eq("id", f.friend_id)
            .single();
          return { ...f, friendData: userData };
        })
      );
      setFriends(friendsWithDetails);
    }
  }, [dbUser?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  async function addFriend(e) {
    e.preventDefault();
    if (!targetEmail) return;
    if (!dbUser?.id) return alert("Profile not ready yet. Please wait a moment.");
    // look up user by email
    const { data: users, error: uerr } = await supabase
      .from("users")
      .select("id,email")
      .eq("email", targetEmail)
      .limit(1);
    if (uerr) return alert(uerr.message);
    if (!users || users.length === 0) return alert("No user with that email");
    const friendId = users[0].id;

    if (friendId === dbUser.id) return alert("You can't add yourself as a friend");

    const { error } = await supabase
      .from("friends")
      .insert([{ user_id: dbUser.id, friend_id: friendId, status: "pending" }]);
    if (error) alert(error.message);
    else {
      setTargetEmail("");
      fetchFriends();
    }
  }

  async function updateFriendStatus(friendshipId, newStatus) {
    const { error } = await supabase
      .from("friends")
      .update({ status: newStatus })
      .eq("id", friendshipId)
      .eq("user_id", dbUser.id);

    if (error) {
      alert(error.message);
    } else {
      fetchFriends();
    }
  }

  async function removeFriend(friendshipId) {
    if (!window.confirm("Remove this friend?")) return;

    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", friendshipId)
      .eq("user_id", dbUser.id);

    if (error) {
      alert(error.message);
    } else {
      fetchFriends();
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "blocked":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">Friends</h3>
      <form onSubmit={addFriend} className="flex gap-2 mt-2 mb-3">
        <input
          placeholder="friend's email"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
          className="flex-1 h-10 rounded-md border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60"
        />
        <button
          type="submit"
          className="h-10 px-4 rounded-md bg-brand text-white text-sm font-medium"
        >
          Add
        </button>
      </form>
      <ul className="divide-y divide-slate-100 text-sm">
        {friends.map((f) => (
          <li key={f.id} className="py-3 flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-800">
                {f.friendData?.username || f.friendData?.email || "Unknown"}
              </div>
              {f.friendData?.email && f.friendData?.username && (
                <div className="text-xs text-slate-500 mt-0.5">{f.friendData.email}</div>
              )}
              <span
                className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                  f.status
                )}`}
              >
                {f.status}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {f.status === "pending" && (
                <button
                  onClick={() => updateFriendStatus(f.id, "accepted")}
                  className="px-2 py-1 rounded text-xs bg-green-500 text-white hover:bg-green-600"
                >
                  Accept
                </button>
              )}
              {f.status === "accepted" && (
                <button
                  onClick={() => updateFriendStatus(f.id, "blocked")}
                  className="px-2 py-1 rounded text-xs bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Block
                </button>
              )}
              {f.status === "blocked" && (
                <button
                  onClick={() => updateFriendStatus(f.id, "accepted")}
                  className="px-2 py-1 rounded text-xs bg-blue-500 text-white hover:bg-blue-600"
                >
                  Unblock
                </button>
              )}
              <button
                onClick={() => removeFriend(f.id)}
                className="px-2 py-1 rounded text-xs bg-red-500 text-white hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
        {friends.length === 0 && <li className="py-4 text-slate-500">No friends yet</li>}
      </ul>
    </div>
  );
}
