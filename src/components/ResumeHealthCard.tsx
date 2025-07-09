"use client";
import { useEffect, useState } from "react";

type SubScore = { label: string; value: number };

export default function ResumeHealthCard() {
  const [score, setScore] = useState<number | null>(null);
  const [subScores, setSubScores] = useState<SubScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/resume-health")
      .then((res) => res.json())
      .then((data) => {
        setScore(data.score);
        setSubScores(data.subScores);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
      {loading ? (
        <div className="text-gray-400 text-sm">Loading...</div>
      ) : (
        <>
          <div className="text-3xl font-bold text-blue-600">{score}/100</div>
          <div className="text-sm text-gray-500 mb-4">Resume Health</div>
          <div className="flex gap-4">
            {subScores.map((sub) => (
              <div key={sub.label} className="flex flex-col items-center cursor-pointer">
                <div className="text-lg font-semibold">{sub.value}</div>
                <div className="text-xs text-gray-400">{sub.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
