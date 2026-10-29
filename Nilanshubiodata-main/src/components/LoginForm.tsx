"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function LoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = credential.user;

      // Require email verification before dashboard access.
      if (!user.emailVerified) {
        try {
          await sendEmailVerification(user);
          setSuccessMessage(
            "Please verify your email. A verification link has been sent."
          );
        } catch {
          setErrorMessage(
            "Your email is not verified, and we couldn't send a verification link. Please try again later."
          );
        }

        return;
      }

      router.replace("/dashboard");
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };

      switch (firebaseError.code) {
        case "auth/invalid-credential":
        case "auth/user-not-found":
        case "auth/wrong-password":
          setErrorMessage("Incorrect email or password.");
          break;

        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;

        case "auth/too-many-requests":
          setErrorMessage(
            "Too many login attempts. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          setErrorMessage(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div>
        <label htmlFor="login-email">Email Address</label>

        <input
          id="login-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="login-password">Password</label>

        <div className="password-field">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((previous) => !previous)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="forgot-row">
        <a href="/forgot-password">Forgot Password?</a>
      </div>

      {errorMessage && (
        <p className="form-message error-message" role="alert">
          {errorMessage}
        </p>
      )}

      {successMessage && (
        <p className="form-message success-message" role="status">
          {successMessage}
        </p>
      )}

      <button
        type="submit"
        className="primary-button"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Login"}
      </button>

      <p className="auth-footer">
        Don't have an account?{" "}
        <a href="/signup">Create Account</a>
      </p>
    </form>
  );
}