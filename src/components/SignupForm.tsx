"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

import { auth } from "../lib/firebase";

export default function SignupForm() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    // Validate password
    if (password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Create Firebase account
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = credential.user;

      // Save user's name
      await updateProfile(user, {
        displayName: fullName.trim(),
      });

      // Send email verification link
      await sendEmailVerification(user);

      // Sign out until email is verified
      await signOut(auth);

      setSuccessMessage(
        "Account created successfully! Please check your email and verify your account before logging in."
      );

      setTimeout(() => {
        router.replace("/login");
      }, 2500);
    } catch (error: unknown) {
      const firebaseError = error as { code?: string };

      switch (firebaseError.code) {
        case "auth/email-already-in-use":
          setErrorMessage(
            "This email is already registered. Please log in instead."
          );
          break;

        case "auth/invalid-email":
          setErrorMessage("Please enter a valid email address.");
          break;

        case "auth/weak-password":
          setErrorMessage(
            "Your password is too weak. Please choose a stronger password."
          );
          break;

        case "auth/network-request-failed":
          setErrorMessage(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setErrorMessage(
            "Signup failed. Please check your details and try again."
          );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {/* Full Name */}
      <div>
        <label htmlFor="signup-name">Full Name</label>

        <input
          id="signup-name"
          type="text"
          placeholder="Enter your full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          autoComplete="name"
          maxLength={100}
          required
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="signup-email">Email Address</label>

        <input
          id="signup-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </div>

      {/* Password */}
      <div>
        <label htmlFor="signup-password">Password</label>

        <div className="password-field">
          <input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
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

      {/* Confirm Password */}
      <div>
        <label htmlFor="confirm-password">Confirm Password</label>

        <input
          id="confirm-password"
          type={showPassword ? "text" : "password"}
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <p className="form-message error-message" role="alert">
          {errorMessage}
        </p>
      )}

      {/* Success Message */}
      {successMessage && (
        <p className="form-message success-message" role="status">
          {successMessage}
        </p>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        className="primary-button"
        disabled={loading}
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>

      {/* Login Link */}
      <p className="auth-footer">
        Already have an account?{" "}
        <a href="/login">Login</a>
      </p>
    </form>
  );
}