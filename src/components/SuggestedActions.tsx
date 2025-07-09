"use client";
import { useEffect, useState } from "react";

type Action = { id: number; text: string };

export default function SuggestedActions() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/suggested-actions")
      .then((res) => res.json())
      .then((data) => {
        setActions(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="text-base font-semibold mb-2">Top AI-Suggested Actions</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
          {actions.map((action) => (
            <li key={action.id}>{action.text}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
