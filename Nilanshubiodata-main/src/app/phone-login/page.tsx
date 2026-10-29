"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "../../lib/firebase";

type WidgetResponse = Record<string, unknown> | string | null | undefined;
type WidgetCallback = (data: WidgetResponse) => void;
type WidgetFailure = (error: unknown) => void;

declare global {
  interface Window {
    initSendOTP?: (configuration: Record<string, unknown>) => void;
    sendOtp?: (identifier: string, success?: WidgetCallback, failure?: WidgetFailure) => void;
    verifyOtp?: (otp: string, success?: WidgetCallback, failure?: WidgetFailure, reqId?: string) => void;
    retryOtp?: (channel: string | null, success?: WidgetCallback, failure?: WidgetFailure, reqId?: string) => void;
    isCaptchaVerified?: () => boolean;
  }
}

const API = `${(process.env.NEXT_PUBLIC_OTP_API_URL || "http://localhost:4000").replace(/\/$/, "")}/api/otp`;
const WIDGET_ID = process.env.NEXT_PUBLIC_MSG91_WIDGET_ID || "366a43656134313539333338";
const TOKEN_AUTH = process.env.NEXT_PUBLIC_MSG91_TOKEN_AUTH || "";

function findString(value: unknown, keys: string[]): string | null {
  if (!value || typeof value !== "object") return null;
  const object = value as Record<string, unknown>;
  for (const key of keys) {
    const candidate = object[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  for (const key of ["data", "result", "response"]) {
    const nested = object[key];
    const found = findString(nested, keys);
    if (found) return found;
  }
  return null;
}

function extractAccessToken(data: WidgetResponse): string | null {
  if (typeof data === "string" && data.split(".").length === 3) return data;
  return findString(data, ["access-token", "accessToken", "access_token", "jwt_token", "jwtToken", "token"]);
}

function errorText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const item = error as Record<string, unknown>;
    for (const key of ["message", "msg", "error"]) {
      if (typeof item[key] === "string") return item[key] as string;
    }
  }
  return "MSG91 request failed. Please try again.";
}

export default function PhoneLoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestId = useRef("");
  const loginStarted = useRef(false);
  const nameRef = useRef(name);
  nameRef.current = name;

  const completeLogin = useCallback(async (widgetData: WidgetResponse) => {
    if (loginStarted.current) return;
    const accessToken = extractAccessToken(widgetData);
    if (!accessToken) {
      setError("MSG91 verified response mein access token nahi mila. Please try again.");
      setLoading(false);
      return;
    }

    loginStarted.current = true;
    setLoading(true);
    setError("");
    setMessage("OTP verified. Secure login complete kar rahe hain...");

    try {
      const response = await fetch(`${API}/verify-widget-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameRef.current.trim(), accessToken }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "MSG91 token verification failed.");
      if (typeof data.token !== "string" || !data.token) {
        throw new Error("Backend ne valid Firebase login token return nahi kiya.");
      }
      await signInWithCustomToken(auth, data.token);
      setMessage("Phone verified! Dashboard khol rahe hain...");
      router.replace("/dashboard");
    } catch (err: unknown) {
      loginStarted.current = false;
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!TOKEN_AUTH) {
      setError("MSG91 token abhi configure nahi hai. Netlify environment variables mein NEXT_PUBLIC_MSG91_TOKEN_AUTH set karo.");
      return;
    }

    let cancelled = false;
    const config: Record<string, unknown> = {
      widgetId: WIDGET_ID,
      tokenAuth: TOKEN_AUTH,
      exposeMethods: true,
      captchaRenderId: "msg91-captcha",
      // OTP verify callbacks below handle the custom UI flow, avoiding duplicate success events.
      success: () => {},
      failure: () => {},
    };

    const scriptUrls = [
      "https://verify.msg91.com/otp-provider.js",
      "https://verify.phone91.com/otp-provider.js",
    ];
    let index = 0;
    const loadNext = () => {
      if (cancelled || index >= scriptUrls.length) {
        if (!cancelled) setError("MSG91 widget load nahi hua. Page refresh karke dobara try karo.");
        return;
      }
      const script = document.createElement("script");
      script.src = scriptUrls[index++];
      script.async = true;
      script.onload = () => {
        if (cancelled) return;
        if (typeof window.initSendOTP !== "function") {
          loadNext();
          return;
        }
        try {
          window.initSendOTP(config);
          setWidgetReady(true);
          setError("");
        } catch {
          setError("MSG91 widget initialize nahi hua. Widget ID aur token settings check karo.");
        }
      };
      script.onerror = () => {
        script.remove();
        loadNext();
      };
      document.head.appendChild(script);
    };
    loadNext();
    return () => { cancelled = true; };
  }, [completeLogin]);

  function sendOTP() {
    setError("");
    setMessage("");
    loginStarted.current = false;
    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[\s()-]/g, "");
    if (cleanName.length < 2 || cleanName.length > 80) {
      setError("Name 2 se 80 characters ke beech hona chahiye.");
      return;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(cleanPhone)) {
      setError("Valid phone number enter karo, jaise +919876543210.");
      return;
    }
    if (!widgetReady || typeof window.sendOtp !== "function") {
      setError("MSG91 widget abhi ready nahi hai. Thodi der baad try karo.");
      return;
    }
    if (typeof window.isCaptchaVerified === "function" && !window.isCaptchaVerified()) {
      setError("Please pehle CAPTCHA complete karo.");
      return;
    }

    setLoading(true);
    const identifier = cleanPhone.replace(/^\+/, "");
    window.sendOtp(identifier, (data) => {
      requestId.current = findString(data, ["reqId", "req_id", "requestId", "request_id"]) || "";
      setPhone(cleanPhone);
      setSent(true);
      setOtp("");
      setLoading(false);
      setMessage("OTP sent! Apne SMS inbox ko check karo.");
    }, (reason) => {
      setLoading(false);
      setError(errorText(reason));
    });
  }

  function verifyOTP() {
    setError("");
    setMessage("");
    if (!/^\d{4}$/.test(otp.trim())) {
      setError("Please 4-digit OTP enter karo.");
      return;
    }
    if (typeof window.verifyOtp !== "function") {
      setError("MSG91 widget ready nahi hai. Page refresh karke try karo.");
      return;
    }
    if (typeof window.isCaptchaVerified === "function" && !window.isCaptchaVerified()) {
      setError("Please pehle CAPTCHA complete karo.");
      return;
    }
    setLoading(true);
    window.verifyOtp(otp.trim(), (data) => {
      void completeLogin(data);
    }, (reason) => {
      setLoading(false);
      setError(errorText(reason));
    }, requestId.current || undefined);
  }

  function requestNewOTP() {
    setSent(false);
    setOtp("");
    setError("");
    setMessage("");
    requestId.current = "";
    loginStarted.current = false;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-7 text-center">
          <div className="mb-4 text-5xl">📱</div>
          <h1 className="text-3xl font-bold">Phone Number Login</h1>
          <p className="mt-2 text-sm text-slate-400">Login securely with your mobile number</p>
        </div>

        <form className="space-y-5" onSubmit={(event) => {
          event.preventDefault();
          if (loading) return;
          if (sent) verifyOTP(); else sendOTP();
        }}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">Full Name</label>
            <input id="name" type="text" autoComplete="name" value={name}
              onChange={(event) => setName(event.target.value)} placeholder="Enter your full name"
              minLength={2} maxLength={80} required disabled={sent || loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </div>

          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-medium">Phone Number</label>
            <input id="phone" type="tel" autoComplete="tel" value={phone}
              onChange={(event) => setPhone(event.target.value)} placeholder="+919876543210"
              required disabled={sent || loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:opacity-60" />
            <p className="mt-2 text-xs text-slate-400">Country code ke saath number enter karo, jaise +91.</p>
          </div>

          <div id="msg91-captcha" className="min-h-1" aria-label="MSG91 CAPTCHA" />

          {sent && <div>
            <label htmlFor="otp" className="mb-2 block text-sm font-medium">Enter 4-Digit OTP</label>
            <input id="otp" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={4}
              value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234" required disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-blue-500 disabled:opacity-60" />
          </div>}

          {message && <p role="status" aria-live="polite" className="break-words text-sm text-green-400">{message}</p>}
          {error && <p role="alert" className="break-words text-sm text-red-400">{error}</p>}

          <button type="submit" disabled={loading || !widgetReady}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? "Please wait..." : sent ? "Verify OTP & Login" : widgetReady ? "Send OTP" : "Loading secure OTP..."}
          </button>
        </form>

        {sent && <button type="button" disabled={loading} onClick={requestNewOTP}
          className="mt-4 w-full rounded-xl border border-slate-700 px-4 py-3 text-sm text-blue-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">Change Number / Resend OTP</button>}

        <button type="button" onClick={() => router.push("/login")}
          className="mt-7 w-full text-sm text-slate-400 transition hover:text-white">← Back to Login</button>
        <p className="mt-6 text-center text-xs text-slate-500">Secured with MSG91 and Firebase Authentication</p>
      </section>
    </main>
  );
}
