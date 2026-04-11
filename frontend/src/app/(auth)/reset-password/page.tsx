"use client";

import React, { useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ReCAPTCHA from "react-google-recaptcha";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const recaptchaRef = useRef<ReCAPTCHA>(null);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "validating">("validating");
    const [message, setMessage] = useState("");

    React.useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                router.push("/login?error=reset_token_invalid");
                return;
            }

            try {
                const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
                if (!response.ok) {
                    router.push("/login?error=reset_token_invalid");
                } else {
                    setStatus("idle");
                }
            } catch (err) {
                router.push("/login?error=reset_token_invalid");
            }
        };

        validateToken();
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords do not match.");
            return;
        }

        if (!token) {
            setStatus("error");
            setMessage("Invalid or missing reset token.");
            return;
        }

        setStatus("loading");
        setMessage("");

        try {
            let rcToken = recaptchaToken;
            if (process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY && !rcToken) {
                rcToken = await recaptchaRef.current?.executeAsync() as string;
                setRecaptchaToken(rcToken);
            }

            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    token, 
                    new_password: password,
                    recaptcha_token: rcToken 
                })
            });

            const data = await response.json();

            if (response.ok) {
                setStatus("success");
                setMessage(data.message || "Password reset successfully!");
                setTimeout(() => {
                    router.push("/login");
                }, 3000);
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

    if (status === "validating") {
        return (
            <div className="w-full max-w-md text-center">
                <div className="mb-6 p-8 rounded-[32px] glass border-white/10 shadow-2xl flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6" />
                    <h2 className="text-xl font-bold text-white mb-2">Validating Link</h2>
                    <p className="text-zinc-400">Please wait while we verify your reset token...</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="w-full max-w-md text-center">
                <div className="mb-6 p-8 rounded-[32px] glass border-white/10 shadow-2xl">
                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Success!</h2>
                    <p className="text-zinc-400 mb-8">{message}</p>
                    <p className="text-xs text-zinc-500">Redirecting to login...</p>
                    <Link href="/login" className="btn-premium w-full py-4 text-center block mt-6">
                        Go to Login
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
                <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
                <p className="text-zinc-400 text-sm">Please enter your new password below.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass p-8 rounded-[32px] border-white/10 shadow-2xl">
                {status === "error" && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">New Password</label>
                        <input
                            type="password"
                            required
                            min={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-400 mb-2 ml-1">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            min={8}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                        disabled={status === "loading"}
                        className="btn-premium w-full py-4 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === "loading" ? (
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Resetting Password...
                            </div>
                        ) : "Update Password"}
                    </button>
                    
                    <Link href="/login" className="block text-center text-sm font-semibold text-zinc-500 hover:text-white transition-colors">
                        Back to login
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center relative overflow-hidden text-white">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-indigo-500/5 blur-[120px] -z-10" />
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
