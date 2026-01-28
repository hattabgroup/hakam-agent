"use client";

import Link from "next/link";

export default function VerifyEmailInstructionPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="glass p-10 rounded-[40px] border-white/5 bg-white/5 max-w-md w-full text-center relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

                <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl mb-8 mx-auto border border-indigo-500/20 shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]">
                    ✉️
                </div>

                <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Check your email</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    We've sent a verification link to your email address. Please click the link to activate your account.
                </p>

                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-8">
                    <p className="text-xs text-indigo-400 font-medium">
                        Can't find it? Check your spam folder or wait a minute.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Link href="/login" className="btn-secondary w-full py-3 rounded-xl font-bold text-sm">
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
