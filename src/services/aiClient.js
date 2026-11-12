import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";

const userMessage = (error) => {
  const code = error?.code || "";
  if (code.includes("unauthenticated")) return "Please sign in again to continue.";
  if (code.includes("resource-exhausted")) return "You do not have enough AI credits for this action.";
  if (code.includes("already-exists")) {
    return "This job is already running. Wait a moment and retry.";
  }
  if (code.includes("deadline-exceeded")) {
    return "The request timed out. Please retry.";
  }
  if (code.includes("failed-precondition")) {
    return error?.message || "This AI service is not configured on the server yet.";
  }
  if (code.includes("unavailable") || code.includes("not-found")) {
    return "The AI backend is not available yet. Deploy Cloud Functions and set server secrets to enable generation.";
  }
  return error?.message || "The AI request failed. Please try again.";
};

export const runAiJob = async (jobType, payload = {}) => {
  try {
    const callable = httpsCallable(functions, "runAiJob", { timeout: 120000 });
    const result = await callable({ jobType, payload });
    return result.data;
  } catch (error) {
    const wrapped = new Error(userMessage(error));
    wrapped.cause = error;
    wrapped.code = error?.code;
    throw wrapped;
  }
};
