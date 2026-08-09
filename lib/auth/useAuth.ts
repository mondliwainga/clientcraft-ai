"use client";

import { useContext } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  AuthError,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { AuthContext } from "./AuthProvider";

function mapAuthError(error: AuthError): string {
  switch (error.code) {
    case "auth/email-already-in-use":
      return "This email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/network-request-failed":
      return "Connection problem. Please check your network and try again.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
}

export function useAuth() {
  const context = useContext(AuthContext);

  async function register(email: string, password: string) {
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: credential.user, error: null };
    } catch (err) {
      return { user: null, error: mapAuthError(err as AuthError) };
    }
  }

  async function signInEmail(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      return { user: credential.user, error: null };
    } catch (err) {
      return { user: null, error: mapAuthError(err as AuthError) };
    }
  }

  async function signInGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      return { user: credential.user, error: null };
    } catch (err) {
      return { user: null, error: mapAuthError(err as AuthError) };
    }
  }

  async function logout() {
    await signOut(auth);
  }

  return { ...context, register, signInEmail, signInGoogle, logout };
}
