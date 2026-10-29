"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  GithubAuthProvider,
  signOut,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import { auth } from "../../lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"error" | "success">("error");

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

  function feedback(
    text: string,
    type: "error" | "success" = "error"
  ) {
    setMessage(text);
    setMessageType(type);
  }

  async function setLoginPersistence() {
    await setPersistence(
      auth,
      rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence
    );
  }

  // EMAIL AND PASSWORD LOGIN
  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await setLoginPersistence();

      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (!result.user.emailVerified) {
        try {
          await sendEmailVerification(result.user);

          feedback(
            "Please verify your email. A verification link has been sent.",
            "success"
          );
        } catch {
          feedback(
            "Could not send the verification email. Please try again."
          );
        }

        await signOut(auth);
        return;
      }

      router.replace("/dashboard");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (
        code === "auth/invalid-credential" ||
        code === "auth/user-not-found" ||
        code === "auth/wrong-password"
      ) {
        feedback("Incorrect email address or password.");
      } else if (code === "auth/invalid-email") {
        feedback("Please enter a valid email address.");
      } else if (code === "auth/too-many-requests") {
        feedback("Too many attempts. Please try again later.");
      } else {
        feedback(
          `Login failed: ${code || "Please try again."}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // GOOGLE LOGIN
  async function handleGoogleLogin() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await setLoginPersistence();

      const provider = new GoogleAuthProvider();

      provider.setCustomParameters({
        prompt: "select_account",
      });

      await signInWithPopup(auth, provider);

      router.replace("/dashboard");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === "auth/popup-closed-by-user") {
        setMessage("");
      } else {
        feedback(
          `Google login failed: ${code || "Please try again."}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

 
  // GITHUB LOGIN
  async function handleGithubLogin() {
    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await setLoginPersistence();

      const provider = new GithubAuthProvider();

      provider.addScope("read:user");
      provider.addScope("user:email");

      await signInWithPopup(auth, provider);

      router.replace("/dashboard");
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === "auth/popup-closed-by-user") {
        setMessage("");
      } else if (
        code === "auth/account-exists-with-different-credential"
      ) {
        feedback(
          "An account may already exist with this email. Sign in using your existing provider first."
        );
      } else if (code === "auth/popup-blocked") {
        feedback(
          "The login popup was blocked. Allow popups and try again."
        );
      } else {
        feedback(
          `GitHub login failed: ${code || "Please try again."}`
        );
      }
    } finally {
      setLoading(false);
    }
  }

  // FORGOT PASSWORD
  async function handleForgotPassword() {
    if (!email.trim()) {
      feedback("Enter your email address first.");
      return;
    }

    if (loading) return;

    setLoading(true);
    setMessage("");

    try {
      await sendPasswordResetEmail(auth, email.trim());

      feedback(
        "If an account exists for this email, a password reset link has been sent.",
        "success"
      );
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;

      if (code === "auth/invalid-email") {
        feedback("Please enter a valid email address.");
      } else {
        feedback(
          "Could not send the password reset email. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative isolate flex min-h-screen w-full items-center justify-center overflow-x-hidden bg-slate-950 px-5 py-10 text-white sm:px-10">
      {/* Background photo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/mountain-sunset.png')",
        }}
      />

      {/* Dark overlays */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-black/40"
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
            Welcome
            <br />
            Back
          </h1>

          <p className="mt-6 max-w-lg text-base leading-7 text-white/90 sm:text-lg">
            Nilanshu digital identity, all in one place. Sign in
            securely to continue your journey and access your
            personal dashboard.
          </p>

          <p className="mt-8 text-sm text-white/90">
            New here?{" "}
            <Link
              href="/register"
              className="font-semibold text-orange-300 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </section>

        {/* Login form */}
        <section className="mx-auto w-full max-w-md rounded-2xl border border-white/25 bg-black/30 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <h2 className="mb-6 text-center text-4xl font-bold sm:text-5xl">
            Sign in
          </h2>

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

          {/* Email and password */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium"
              >
                Email Address
              </label>

              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                required
                className="w-full rounded-sm border border-white/40 bg-white px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <div className="flex rounded-sm border border-white/40 bg-white focus-within:ring-2 focus-within:ring-orange-400">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  className="min-w-0 flex-1 bg-transparent px-4 py-3 text-base text-gray-900 outline-none placeholder:text-gray-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="px-3 text-xs font-bold text-gray-600 hover:text-orange-600"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/90">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(event.target.checked)
                }
                className="h-4 w-4 accent-orange-500"
              />
              Remember Me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 px-5 py-3 font-semibold text-white transition hover:bg-orange-500 disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Sign in now"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            className="mt-5 block text-left text-sm text-white/90 hover:text-orange-300 hover:underline"
          >
            Lost your password?
          </button>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/30" />
            <span className="text-xs text-white/80">OR</span>
            <div className="h-px flex-1 bg-white/30" />
          </div>

          {/* Google Login */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 border border-white/50 bg-white/10 px-4 py-3 text-sm font-semibold hover:bg-white/20 disabled:opacity-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white font-bold text-blue-600">
              G
            </span>
            Continue with Google
          </button>


          {/* GitHub Login */}
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={loading}
            className="mt-3 flex w-full items-center justify-center gap-3 border border-white/50 bg-white px-4 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-200 disabled:opacity-50"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-6 w-6 fill-current"
            >
              <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.55.1.76-.24.76-.54v-2.1c-3.1.67-3.76-1.32-3.76-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.71 1.15 1.71 1.15.99 1.7 2.6 1.21 3.23.93.1-.72.39-1.21.7-1.49-2.48-.28-5.08-1.24-5.08-5.52 0-1.22.44-2.22 1.15-3-.12-.29-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.14a10.6 10.6 0 0 1 5.55 0c2.11-1.44 3.05-1.14 3.05-1.14.61 1.54.23 2.67.11 2.96.72.78 1.15 1.78.11 3.01 0 4.29-2.6 5.23-5.09 5.51.4.35.75 1.03.75 2.08v3.1c0 .3.2.65.76.54A11.1 11.1 0 0 0 12 .9Z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Create account */}
          <p className="mt-7 text-center text-sm text-white/90">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-orange-300 hover:underline"
            >
              Create account
            </Link>
          </p>

          {/* Terms and privacy */}
          <p className="mt-6 text-center text-xs leading-6 text-white/75">
            By signing in, you agree to our
            <br />
            <Link
              href="/terms"
              className="underline hover:text-white"
            >
              Terms of Service
            </Link>
            {" | "}
            <Link
              href="/privacy"
              className="underline hover:text-white"
            >
              Privacy Policy
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}