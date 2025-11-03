import { getApiBaseUrl } from "./api";

type StreamEvent = {
  type: "status" | "result" | "partial" | "complete" | "error" | "done";
  step?: string;
  message?: string;
  data?: unknown;
};

type StreamCallbacks = {
  onStatus?: (step: string, message: string) => void;
  onResult?: (step: string, data: unknown) => void;
  onPartial?: (step: string, data: unknown) => void;
  onComplete?: (data: unknown) => void;
  onError?: (error: string) => void;
};

export async function streamRecruiterWorkflow(
  payload: unknown,
  callbacks: StreamCallbacks
): Promise<void> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/recruiter-workflow/generate-stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Stream request failed with status ${response.status}`);
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.trim() || !line.startsWith("data: ")) {
          continue;
        }

        const data = line.substring(6); // Remove "data: " prefix
        
        try {
          const event: StreamEvent = JSON.parse(data);
          console.log("[Stream] Event received:", event.type, event.step || "");
          
          if (event.type === "status" && event.step && event.message) {
            callbacks.onStatus?.(event.step, event.message);
          } else if (event.type === "partial" && event.step && event.data) {
            console.log("[Stream] Partial data for", event.step);
            callbacks.onPartial?.(event.step, event.data);
          } else if (event.type === "result" && event.step && event.data) {
            console.log("[Stream] Result data for", event.step, ":", Array.isArray(event.data) ? `${event.data.length} items` : event.data);
            callbacks.onResult?.(event.step, event.data);
          } else if (event.type === "complete" && event.data) {
            console.log("[Stream] Complete event received");
            callbacks.onComplete?.(event.data);
          } else if (event.type === "error" && event.message) {
            console.error("[Stream] Error:", event.message);
            callbacks.onError?.(event.message);
          } else if (event.type === "done") {
            console.log("[Stream] Stream finished");
            return; // Stream finished
          }
        } catch (parseError) {
          console.error("Failed to parse SSE event:", parseError, data);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
