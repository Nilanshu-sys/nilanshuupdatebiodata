"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function HomePage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/dashboard");
        return;
      }
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p role="status">Checking your session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-white">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-blue-400">
          Welcome to my website
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Nilanshu | Personal Biodata
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Welcome to Nilanshu&apos;s personal website. Sign in to access your account and explore the available features.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/login" className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500">Login</Link>
          <Link href="/register" className="rounded-lg border border-slate-600 px-6 py-3 font-semibold hover:bg-slate-800">Create Account</Link>
          <Link href="/phone-login" className="rounded-lg border border-blue-500 px-6 py-3 font-semibold text-blue-300 hover:bg-slate-800">Login with Phone OTP</Link>
        </div>
        <section className="mt-16 w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 text-left">
          <h2 className="text-2xl font-semibold">About This Website</h2>
          <p className="mt-4 leading-7 text-slate-300">
            This is the personal website of Nilanshu. Visitors can learn about the website and access account features through the login and registration pages.
          </p>
        </section>
      </div>
    </main>
  );
}
