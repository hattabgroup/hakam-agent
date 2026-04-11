"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import ReCAPTCHA from "react-google-recaptcha";

function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            let token = recaptchaToken;
            if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !token) {
                token = await recaptchaRef.current?.executeAsync() as string;
                setRecaptchaToken(token);
            }

            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, recaptcha_token: token })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage(data.message || "Reset link sent! Please check your email.");
            } else {
                setStatus("error");
                setMessage(data.detail || "Something went wrong. Please try again.");
                recaptchaRef.current?.reset();
                setRecaptchaToken(null);
            }
        } catch (err: any) {
            setStatus("error");
            setMessage("Network error. Please try again.");
            recaptchaRef.current?.reset();
            setRecaptchaToken(null);
        }
    };

    if (status === "success") {
        return (
            <div className="w-full max-w-md text-center">
                <div className="mb-6 p-8 rounded-[32px] glass border-white/10 shadow-2xl">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Check your email</h2>
                    <p className="text-zinc-400 mb-8">{message}</p>
                    <Link href="/login" className="btn-premium w-full py-4 text-center block">
                        Return to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md">
            <div className="text-center mb-10">
                <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg group-hover:rotate-12 transition-transform">H</div>
                    <span className="text-2xl font-bold tracking-tight text-white uppercase italic">Hakam</span>
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">Forgot Password?</h1>
                <p className="text-zinc-400 text-sm">No worries, we'll send you reset instructions.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass p-8 rounded-[32px] border-white/10 shadow-2xl">
                {status === "error" && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                        {message}
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
                        disabled={status === "loading"}
                        className="btn-premium w-full py-4 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === "loading" ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Sending...
                            </div>
                        ) : "Reset Password"}
                    </button>
                    
                    <Link href="/login" className="block text-center text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
                        Back to login
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center relative overflow-hidden text-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[120px] -z-10" />
            <ForgotPasswordForm />
        </div>
    );
}
