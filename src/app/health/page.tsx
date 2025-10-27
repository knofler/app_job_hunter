"use client";

import { useEffect, useState } from "react";

import { getApiBaseUrl } from "@/lib/api";

export default function Health() {
  const [healthStatus, setHealthStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHealthStatus() {
      try {
        const apiBaseUrl = getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}/health`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHealthStatus(data.message); // Assuming the API returns { status: "ok", message: "API is healthy" }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    }

    fetchHealthStatus();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Health Check</h1>
      {healthStatus ? (
        <p className="text-green-500">Backend Health: {healthStatus}</p>
      ) : error ? (
        <p className="text-red-500">Error: {error}</p>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}