"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
} from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">(
    "error"
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return;

      const isPasswordUser = user.providerData.some(
        (provider) => provider.providerId === "password"
      );

      if (!isPasswordUser || user.emailVerified) {
        router.replace("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  function feedback(text: string, type: "error" | "success" = "error") {
    setMessage(text);
    setMessageType(type);
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;
    setMessage("");

    if (password.length < 8) {
      feedback("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      feedback("Passwords do not match.");
      return;
    }

    setLoading(true);
    let accountCreated = false;

    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      accountCreated = true;

      await updateProfile(result.user, {
        displayName: name.trim(),
      });

      await sendEmailVerification(result.user);
      await signOut(auth);

      feedback(
        "Account created! Please verify your email using the link we sent, then log in.",
        "success"
      );

      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (accountCreated) {
        try {
          await signOut(auth);
        } catch {
          // The user may already be signed out.
        }

        feedback(
          "Your account was created, but the verification email could not be sent. Please try again later."
        );
      } else if (code === "auth/email-already-in-use") {
        feedback("This email is already registered. Please log in.");
      } else if (code === "auth/weak-password") {
        feedback("Please choose a stronger password.");
      } else if (code === "auth/invalid-email") {
        feedback("Please enter a valid email address.");
      } else {
        feedback(`Account creation failed: ${code || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      await signInWithPopup(auth, provider);
      router.replace("/dashboard");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === "auth/popup-closed-by-user") {
        setMessage("");
      } else {
        feedback(`Google sign-up failed: ${code || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGithubSignup() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      const provider = new GithubAuthProvider();
      await signInWithPopup(auth, provider);
      router.replace("/dashboard");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === "auth/popup-closed-by-user") {
        setMessage("");
      } else if (code === "auth/account-exists-with-different-credential") {
        feedback(
          "This email is already registered with another sign-in method. Please sign in using that method."
        );
      } else {
        feedback(`GitHub sign-up failed: ${code || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-950 px-5 py-10 text-white sm:px-10">
      {/* Same mountain background as login */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/mountain-sunset.png')" }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-black/45"
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-r from-black/40 via-black/10 to-black/45"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
        {/* Welcome section */}
        <section className="text-center md:text-left">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-orange-300">
            NILANSHU DIGITAL IDENTITY
          </p>

          <h1 className="text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
            Create
            <br />
            Your Account
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-white/90 sm:text-lg">
            Join Nilanshu Digital Identity to access her personal website
            and dashboard securely.
          </p>

          <p className="mt-8 text-sm text-white/90">
            <Link
              href="/login"
              className="font-semibold text-orange-300 hover:underline"
            >
              ← Back to Sign In
            </Link>
          </p>
        </section>

        {/* Signup form */}
        <section className="mx-auto w-full max-w-md rounded-2xl border border-white/25 bg-black/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <h2 className="text-center text-4xl font-bold">Sign up</h2>

          <p className="mb-7 mt-2 text-center text-sm text-white/80">
            Create your account below
          </p>

          {message && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-5 break-words rounded-lg border p-3 text-sm leading-6 ${
                messageType === "success"
                  ? "border-green-300/40 bg-green-950/70 text-green-100"
                  : "border-red-300/40 bg-red-950/70 text-red-100"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label
                htmlFor="signup-name"
                className="mb-2 block text-sm font-medium"
              >
                Full Name
              </label>

              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={80}
                required
                className="w-full rounded-sm border border-white/40 bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm font-medium"
              >
                Email Address
              </label>

              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-sm border border-white/40 bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <div className="flex rounded-sm border border-white/40 bg-white focus-within:ring-2 focus-within:ring-orange-400">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="px-3 text-xs font-bold text-gray-600 hover:text-orange-600"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-confirm-password"
                className="mb-2 block text-sm font-medium"
              >
                Confirm Password
              </label>

              <div className="flex rounded-sm border border-white/40 bg-white focus-within:ring-2 focus-within:ring-orange-400">
                <input
                  id="signup-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((value) => !value)
                  }
                  className="px-3 text-xs font-bold text-gray-600 hover:text-orange-600"
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/30" />
            <span className="text-xs text-white/80">OR</span>
            <div className="h-px flex-1 bg-white/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 border border-white/50 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-bold text-blue-600">
              G
            </span>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={handleGithubSignup}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-3 border border-white/50 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-black">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-5 w-5"
                fill="currentColor"
              >
                <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.53v-2.07c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.24-1.62-1.24-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.92.1-.72.39-1.21.7-1.49-2.47-.28-5.07-1.24-5.07-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3 0 4.27-2.6 5.22-5.08 5.49.4.35.75 1.02.75 2.06V22c0 .29.2.63.76.52A11.1 11.1 0 0 0 12 .9Z" />
              </svg>
            </span>
            Continue with GitHub
          </button>

          <p className="mt-6 text-center text-sm text-white/90">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-orange-300 hover:underline"
            >
              Back to Sign In
            </Link>
          </p>

          <p className="mt-5 text-center text-xs leading-5 text-white/75">
            By creating an account, you agree to our{" "}
            <Link
              href="/terms"
              className="font-semibold text-orange-300 hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and acknowledge our{" "}
            <Link
              href="/privacy"
              className="font-semibold text-orange-300 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
