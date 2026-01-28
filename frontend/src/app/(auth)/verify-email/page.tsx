"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = use(searchParams);
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("Verifying your email...");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Invalid verification link.");
            return;
        }

        const verify = async () => {
            try {
                // Use relative path to hit Next.js API proxy
                const response = await fetch(`/api/auth/verify?token=${token}`);

                if (response.ok) {
                    setStatus("success");
                    setMessage("Email verified successfully!");
                    // Optional: Auto redirect
                    // setTimeout(() => router.push("/login"), 3000);
                } else {
                    const data = await response.json();
                    setStatus("error");
                    setMessage(data.detail || "Verification failed. The link may be expired.");
                }
            } catch (err) {
                console.error(err);
                setStatus("error");
                setMessage("Something went wrong. Please try again.");
            }
        };

        verify();
    }, [token, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="glass p-8 rounded-[32px] border-white/5 bg-white/5 max-w-md w-full text-center">
                {status === "loading" && (
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <h2 className="text-xl font-bold text-white">Verifying...</h2>
                        <p className="text-zinc-500">Please wait while we check your verification token.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-3xl border border-emerald-500/20 text-emerald-500 mb-2">
                            ✅
                        </div>
                        <h2 className="text-2xl font-bold text-white">Email Verified!</h2>
                        <p className="text-zinc-400 mb-6">Your account has been successfully activated. You can now access the dashboard.</p>
                        <Link href="/login" className="btn-premium w-full py-3 rounded-xl font-bold">
                            Continue to Login
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center text-3xl border border-rose-500/20 text-rose-500 mb-2">
                            ❌
                        </div>
                        <h2 className="text-xl font-bold text-white">Verification Failed</h2>
                        <p className="text-zinc-500 mb-6">{message}</p>
                        <Link href="/login" className="px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-bold transition-colors text-white">
                            Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
