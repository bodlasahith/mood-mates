import React, { useEffect, useState, useCallback } from "react";
import supabase from "../supabaseClient";

export default function History({ user, dbUser }) {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editNote, setEditNote] = useState("");

  const fetchHistory = useCallback(async () => {
    if (!dbUser?.id) return;
    const { data, error } = await supabase
      .from("moods")
      .select("id,mood,note,created_at,color,streak")
      .eq("user_id", dbUser.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) console.error(error);
    else setEntries(data || []);
  }, [dbUser?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  async function updateMoodNote(moodId) {
    const { error } = await supabase
      .from("moods")
      .update({ note: editNote })
      .eq("id", moodId)
      .eq("user_id", dbUser.id);

    if (error) {
      alert(error.message);
    } else {
      setEditingId(null);
      setEditNote("");
      fetchHistory();
    }
  }

  async function deleteMood(moodId) {
    if (!window.confirm("Delete this mood entry?")) return;

    const { error } = await supabase
      .from("moods")
      .delete()
      .eq("id", moodId)
      .eq("user_id", dbUser.id);

    if (error) {
      alert(error.message);
    } else {
      fetchHistory();
    }
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditNote(entry.note || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNote("");
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
        Your recent moods
      </h3>
      {entries.length === 0 && <div className="text-slate-500 py-4 text-sm">No entries yet</div>}
      <ul className="mt-2 divide-y divide-slate-100">
        {entries.map((e) => (
          <li key={e.id} className="flex items-start gap-3 py-2">
            <span className="text-2xl select-none">{e.mood}</span>
            <span className="flex-1 min-w-0">
              {editingId === e.id ? (
                <div className="space-y-2">
                  <textarea
                    className="w-full min-h-20 rounded-md border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand/60"
                    value={editNote}
                    onChange={(ev) => setEditNote(ev.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateMoodNote(e.id)}
                      className="px-3 py-1 rounded-md bg-brand text-white text-xs font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 rounded-md bg-slate-200 text-slate-700 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {e.note && (
                    <span className="block text-slate-700 text-sm break-words">{e.note}</span>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500">
                      {new Date(e.created_at).toLocaleString()}
                    </span>
                    {e.streak > 0 && (
                      <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                        🔥 {e.streak} day streak
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => startEdit(e)}
                      className="text-xs text-brand hover:underline"
                    >
                      Edit note
                    </button>
                    <button
                      onClick={() => deleteMood(e.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
