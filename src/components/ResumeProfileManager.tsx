"use client";
import { useState } from "react";

export default function ResumeProfileManager() {
  const [profiles, setProfiles] = useState([
    { id: 1, name: "Default Profile", resume: null },
  ]);
  const [activeId, setActiveId] = useState(1);
  const [newName, setNewName] = useState("");

  function addProfile() {
    if (!newName.trim()) return;
    setProfiles([
      ...profiles,
      { id: Date.now(), name: newName, resume: null },
    ]);
    setNewName("");
  }

  function switchProfile(id: number) {
    setActiveId(id);
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-6">
      <div className="font-semibold mb-2">Resume Profiles</div>
      <div className="flex gap-2 mb-2">
        {profiles.map((p) => (
          <button
            key={p.id}
            className={`px-3 py-1 rounded ${activeId === p.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => switchProfile(p.id)}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2 mb-2">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="New profile name"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={addProfile}>
          Add
        </button>
      </div>
      <div className="mt-2">
        <input type="file" accept=".pdf,.doc,.docx" className="text-sm" />
        <span className="ml-2 text-xs text-gray-400">(Upload resume for this profile)</span>
      </div>
    </div>
  );
}
