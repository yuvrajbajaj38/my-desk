import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

import { auth } from "../firebase/config";

export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      }
    );
  }

  return window.recaptchaVerifier;
};

export const sendOtp = async (phone) => {
  const appVerifier = setupRecaptcha();

  return await signInWithPhoneNumber(
    auth,
    "+91" + phone,
    appVerifier
  );
};