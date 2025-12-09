import React, { useEffect, useState, useCallback } from "react";
import supabase from "../supabaseClient";

export default function Friends({ user, dbUser }) {
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [targetEmail, setTargetEmail] = useState("");

  const fetchFriends = useCallback(async () => {
    if (!dbUser?.id) return;
    const { data, error } = await supabase
      .from("friends")
      .select("id,friend_id,status")
      .eq("user_id", dbUser.id);
    const { data: incoming, error: incomingError } = await supabase
      .from("friends")
      .select("id,user_id,status")
      .eq("friend_id", dbUser.id);
    if (error) {
      console.error(error);
    } else if (incomingError) {
      console.error(incomingError);
    } else {
      const friendsWithDetails = await Promise.all(
        (data || []).map(async (f) => {
          const { data: userData } = await supabase
            .from("users")
            .select("email,username")
            .eq("id", f.friend_id)
            .single();

          const { data: mutualFriend } = await supabase
            .from("friends")
            .select("id")
            .eq("user_id", f.friend_id)
            .eq("friend_id", dbUser.id)
            .single();

          const displayStatus = mutualFriend ? "friends" : "requested";

          return { ...f, friendData: userData, displayStatus };
        })
      );

      const incomingWithDetails = await Promise.all(
        (incoming || []).map(async (req) => {
          const { data: requesterData } = await supabase
            .from("users")
            .select("email,username")
            .eq("id", req.user_id)
            .single();

          const { data: mutual } = await supabase
            .from("friends")
            .select("id")
            .eq("user_id", dbUser.id)
            .eq("friend_id", req.user_id)
            .single();

          const displayStatus = mutual ? "friends" : "requested";

          return { ...req, requesterData, displayStatus, hasReciprocal: Boolean(mutual) };
        })
      );

      const pendingIncoming = incomingWithDetails.filter((r) => !r.hasReciprocal);

      setFriends(friendsWithDetails);
      setIncomingRequests(pendingIncoming);
    }
  }, [dbUser?.id]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

  async function addFriend(e) {
    e.preventDefault();
    if (!targetEmail) return;
    if (!dbUser?.id) return alert("Profile not ready yet. Please wait a moment.");

    const { data: users, error: uerr } = await supabase
      .from("users")
      .select("id,email")
      .eq("email", targetEmail)
      .limit(1);
    if (uerr) return alert(uerr.message);
    if (!users || users.length === 0) return alert("No user with that email");
    const friendId = users[0].id;

    if (friendId === dbUser.id) return alert("You can't add yourself as a friend");

    const { data: existing } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", dbUser.id)
      .eq("friend_id", friendId)
      .single();

    if (existing) {
      alert("You've already added this friend");
      return;
    }

    const { error } = await supabase
      .from("friends")
      .insert([{ user_id: dbUser.id, friend_id: friendId, status: "requested" }]);
    if (error) alert(error.message);
    else {
      setTargetEmail("");
      fetchFriends();
      alert("Friend request sent!");
    }
  }

  async function removeFriend(friendshipId) {
    if (!window.confirm("Remove this friend?")) return;

    const { data: friendship } = await supabase
      .from("friends")
      .select("friend_id")
      .eq("id", friendshipId)
      .eq("user_id", dbUser.id)
      .single();

    if (!friendship) return alert("Friendship not found");

    const { error } = await supabase
      .from("friends")
      .delete()
      .or(
        `and(user_id.eq.${dbUser.id},friend_id.eq.${friendship.friend_id}),and(user_id.eq.${friendship.friend_id},friend_id.eq.${dbUser.id})`
      );

    if (error) {
      alert(error.message);
    } else {
      fetchFriends();
    }
  }

  async function acceptFriendRequest(requestId, requesterId) {
    if (!dbUser?.id) return alert("Profile not ready yet. Please wait a moment.");

    const { data: existing } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", dbUser.id)
      .eq("friend_id", requesterId)
      .single();

    if (!existing) {
      const { error: insertError } = await supabase
        .from("friends")
        .insert([{ user_id: dbUser.id, friend_id: requesterId, status: "friends" }]);

      if (insertError) return alert(insertError.message);
    }

    await supabase.from("friends").update({ status: "friends" }).eq("id", requestId);

    alert("Friend request accepted");
    fetchFriends();
  }

  async function declineFriendRequest(requestId) {
    if (!dbUser?.id) return alert("Profile not ready yet. Please wait a moment.");

    const { error } = await supabase
      .from("friends")
      .delete()
      .eq("id", requestId)
      .eq("friend_id", dbUser.id);

    if (error) alert(error.message);
    else {
      alert("Friend request declined");
      fetchFriends();
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "friends":
        return "bg-green-100 text-green-700";
      case "requested":
        return "bg-yellow-100 text-yellow-700";
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
      <div className="mb-4">
        <div className="text-xs font-semibold text-slate-500 uppercase">Friend Requests</div>
        <ul className="divide-y divide-slate-100 text-sm mt-2">
          {incomingRequests.map((req) => (
            <li key={req.id} className="py-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-slate-800">
                  {req.requesterData?.username || req.requesterData?.email || "Unknown"}
                </div>
                {req.requesterData?.email && req.requesterData?.username && (
                  <div className="text-xs text-slate-500 mt-0.5">{req.requesterData.email}</div>
                )}
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${getStatusColor(
                    req.displayStatus
                  )}`}
                >
                  {req.displayStatus}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => acceptFriendRequest(req.id, req.user_id)}
                  className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => declineFriendRequest(req.id)}
                  className="px-2 py-1 rounded text-xs bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Decline
                </button>
              </div>
            </li>
          ))}
          {incomingRequests.length === 0 && (
            <li className="py-3 text-slate-500">No incoming requests</li>
          )}
        </ul>
      </div>
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
                  f.displayStatus
                )}`}
              >
                {f.displayStatus}
              </span>
            </div>
            <div className="flex flex-col gap-1">
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
