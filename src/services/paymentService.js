import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase/config";
import { isPaymentConfigured, razorpayKeyId } from "../config/env";

export const PAYMENT_ENABLED = false;

export const getPaymentConfig = () => ({
  configured: isPaymentConfigured,
  enabled: PAYMENT_ENABLED,
  publicKeyId: razorpayKeyId || "",
  provider: "razorpay",
});

export const createPaymentOrder = async (planId) => {
  if (!PAYMENT_ENABLED) {
    throw new Error("Payment is intentionally disabled until pricing, packages, and fulfillment rules are approved.");
  }

  if (!isPaymentConfigured) {
    throw new Error("Payment is not configured. Add Razorpay keys on the server and VITE_RAZORPAY_KEY_ID for checkout.");
  }

  const callable = httpsCallable(functions, "createPaymentOrder");
  const result = await callable({ planId });
  return result.data;
};
