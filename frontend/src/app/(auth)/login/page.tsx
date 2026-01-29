"use client";

import React, { useState, Suspense, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSearchParams } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";

function LoginForm() {
    const { login } = useAuth();
    const searchParams = useSearchParams();
    const signupSuccess = searchParams.get("signup_success");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Resend Verification State
    const [showResend, setShowResend] = useState(false);
    const [resendStatus, setResendStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
    const [resendMessage, setResendMessage] = useState("");
    const [countdown, setCountdown] = useState(0);

    // Countdown timer effect
    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        }
        return () => clearTimeout(timer);
    }, [countdown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setShowResend(false);

        setIsSubmitting(true);

        try {
            let token = recaptchaToken;
            if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !token) {
                token = await recaptchaRef.current?.executeAsync() as string;
                setRecaptchaToken(token);
            }

            await login(email, password, token || undefined);
        } catch (err: any) {
            // Reset captcha on error so they can try again if needed
            recaptchaRef.current?.reset();
            setRecaptchaToken(null);

            const msg = err.message || "Invalid email or password";
            setError(msg);

            // Check if error is related to verification
            if (msg.includes("verified") || msg.includes("verification")) {
                setShowResend(true);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResend = async () => {
        if (countdown > 0) return;

        setResendStatus("loading");
        setResendMessage("");

        try {
            // Need to hit the backend directly since AuthContext doesn't expose resend
            const authUrl = "/api/auth/resend-verification"; // Proxied by Next.js
            const response = await fetch(authUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                setResendStatus("sent");
                setResendMessage("Verification email sent! Check your inbox.");
                setCountdown(60); // Start 60s cooldown
            } else {
                const data = await response.json();
                setResendStatus("error");
                setResendMessage(data.detail || "Failed to send email. Please try again.");
                if (response.status === 429) {
                    setCountdown(60); // Enforce cooldown on UI even if backend rejected
                }
            }
        } catch (err: any) {
            setResendStatus("error");
            setResendMessage("Network error. Please try again.");
        } finally {
            if (resendStatus !== "sent") setResendStatus("idle");
        }
    };

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-10">
                <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg group-hover:rotate-12 transition-transform">H</div>
                    <span className="text-2xl font-bold tracking-tight text-white uppercase italic">Hakam</span>
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">Welcome back</h1>
                <p className="text-[var(--fg-muted)]">Enter your credentials to access your dashboard</p>
            </div>

            {signupSuccess && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium text-center">
                    Account created successfully! You can now log in.
                </div>
            )}

            <form onSubmit={handleSubmit} className="glass p-8 rounded-[32px] border-white/10 shadow-2xl">
                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium flex flex-col gap-2">
                        <span>{error}</span>
                        {showResend && (
                            <div className="pt-2 border-t border-red-500/20 mt-1">
                                <p className="text-xs text-red-300 mb-2">Did you miss the email?</p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={countdown > 0}
                                    className="text-xs font-bold underline hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {countdown > 0 ? `Resend available in ${countdown}s` : "Resend Verification Email"}
                                </button>
                                {resendMessage && (
                                    <p className={`text-xs mt-2 font-bold ${resendStatus === 'sent' ? 'text-emerald-400' : 'text-red-300'}`}>
                                        {resendMessage}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            placeholder="name@company.com"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2 ml-1">
                            <label className="text-sm font-medium text-zinc-400">Password</label>
                            <Link href="#" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Forgot password?</Link>
                        </div>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {/* ReCAPTCHA */}
                    {process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && (
                        <div className="flex justify-center">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                                size="invisible"
                                onChange={(token: string | null) => setRecaptchaToken(token)}
                                theme="dark"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-premium w-full py-4 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Logging in...
                            </div>
                        ) : "Sign In"}
                    </button>
                </div>
            </form>

            <p className="text-center mt-8 text-zinc-500 text-sm">
                Don't have an account?{" "}
                <Link href="/signup" className="font-bold text-white hover:text-indigo-400 transition-colors">Create account</Link>
            </p>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[120px] -z-10" />
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
