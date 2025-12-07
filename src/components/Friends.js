import React, { useEffect, useState, useCallback } from "react";
import supabase from "../supabaseClient";
import { useToast } from '../contexts/ToastContext';

export default function Friends({ user, dbUser }) {
  const { toast } = useToast();
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
    if (!dbUser?.id) return toast.error("Profile not ready yet. Please wait a moment.");

    // Look up user by email
    const { data: users, error: uerr } = await supabase
      .from("users")
      .select("id,email")
      .eq("email", targetEmail)
      .limit(1);
    if (uerr) return toast.error(uerr.message);
    if (!users || users.length === 0) return toast.error("No user with that email");
    const friendId = users[0].id;

    if (friendId === dbUser.id) return toast.error("You can't add yourself as a friend");

    // Check if friendship already exists
    const { data: existing } = await supabase
      .from("friends")
      .select("id")
      .or(`and(user_id.eq.${dbUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${dbUser.id})`);

    if (existing && existing.length > 0) return toast.warning("Friendship already exists");

    // Create bidirectional friendship - both users get a record
    const { error } = await supabase
      .from("friends")
      .insert([
        { user_id: dbUser.id, friend_id: friendId, status: "sent" },
        { user_id: friendId, friend_id: dbUser.id, status: "received" }
      ]);

    if (error) toast.error(error.message);
    else {
      setTargetEmail("");
      fetchFriends();
      toast.success("Friend request sent!");
    }
  }

  async function updateFriendStatus(friendshipId, newStatus) {
    // First get the friend_id for this friendship
    const { data: friendship } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("id", friendshipId)
      .eq("user_id", dbUser.id)
      .single();

    if (!friendship) return toast.error("Friendship not found");

    // Update both sides of the friendship
    const { error } = await supabase
      .from("friends")
      .update({ status: newStatus })
      .or(`and(user_id.eq.${dbUser.id},friend_id.eq.${friendship.friend_id}),and(user_id.eq.${friendship.friend_id},friend_id.eq.${dbUser.id})`);

    if (error) {
      toast.error(error.message);
    } else {
      fetchFriends();
      if (newStatus === "accepted") {
        toast.success("Friend request accepted!");
      }
    }
  }

  async function removeFriend(friendshipId) {
    if (!window.confirm("Remove this friend?")) return;

    // First get the friend_id for this friendship
    const { data: friendship } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("id", friendshipId)
      .eq("user_id", dbUser.id)
      .single();

    if (!friendship) return toast.error("Friendship not found");

    // Remove both sides of the friendship
    const { error } = await supabase
      .from("friends")
      .delete()
      .or(`and(user_id.eq.${dbUser.id},friend_id.eq.${friendship.friend_id}),and(user_id.eq.${friendship.friend_id},friend_id.eq.${dbUser.id})`);

    if (error) {
      toast.error(error.message);
    } else {
      fetchFriends();
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "received":
        return "bg-yellow-100 text-yellow-700";
      case "declined":
        return "bg-gray-100 text-gray-700";
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
              {f.status === "sent" && (
                <span className="px-2 py-1 text-xs text-slate-500">
                  Request Sent
                </span>
              )}
              {f.status === "received" && (
                <>
                  <button
                    onClick={() => updateFriendStatus(f.id, "accepted")}
                    className="px-2 py-1 rounded text-xs bg-green-500 text-white hover:bg-green-600"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => updateFriendStatus(f.id, "declined")}
                    className="px-2 py-1 rounded text-xs bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Decline
                  </button>
                </>
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
