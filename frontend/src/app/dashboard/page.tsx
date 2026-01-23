"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardReviewSummary {
    repo: string;
    status: string;
    score: string;
    date: string;
}

interface DashboardStats {
    active_repos: number;
    active_repos_change: string;
    quality_score: string;
    quality_score_change: string;
    critical_issues: number;
    critical_issues_change: string;
    recent_reviews: DashboardReviewSummary[];
}

export default function DashboardPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const fetchStats = async () => {
        try {
            const response = await fetch("/api/reviews/stats");
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard stats:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user]);

    if (isLoading) {
        return (
            <div className="px-10 py-10 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-10 py-10">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Dashboard</h1>
                    <p className="text-[var(--fg-muted)]">Welcome back, <span className="text-white font-medium">{user?.email}</span></p>
                </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {[
                    { label: "Active Repos", value: stats?.active_repos || 0, change: stats?.active_repos_change || "Active", icon: "📦" },
                    { label: "Quality Score", value: stats?.quality_score || "-", change: stats?.quality_score_change || "Avg. Score", icon: "⭐" },
                    { label: "Critical Issues", value: stats?.critical_issues || 0, change: stats?.critical_issues_change || "Total Found", icon: "🛡️" },
                ].map((stat, i) => (
                    <div key={i} className="glass p-8 rounded-[32px] border-white/5 bg-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 text-3xl opacity-20 group-hover:scale-125 transition-transform duration-500">{stat.icon}</div>
                        <p className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-4">{stat.label}</p>
                        <p className="text-4xl font-black text-white mb-2">{stat.value}</p>
                        <p className="text-xs font-bold text-emerald-400">{stat.change}</p>
                    </div>
                ))}
            </div>

            <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <h2 className="text-xl font-bold">Recent Reviews</h2>
                    <Link href="/dashboard/reviews" className="text-sm font-bold text-indigo-400 hover:text-indigo-300">View all</Link>
                </div>
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
                                <th className="px-8 py-4 font-bold">Repository</th>
                                <th className="px-8 py-4 font-bold">Status</th>
                                <th className="px-8 py-4 font-bold">Score</th>
                                <th className="px-8 py-4 font-bold text-right">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {(!stats?.recent_reviews || stats.recent_reviews.length === 0) ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-12 text-center text-zinc-500 italic">No recent reviews found.</td>
                                </tr>
                            ) : (
                                stats.recent_reviews.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6 font-semibold text-zinc-300 group-hover:text-white">{row.repo}</td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tight ${row.status === 'Clean' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                row.status === 'Warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    row.status === 'Critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                        row.status === 'Failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                            row.status === 'Issues' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                                'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                                }`}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-mono text-sm text-zinc-400">{row.score}</td>
                                        <td className="px-8 py-6 text-sm text-zinc-500 text-right font-medium">{row.date}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
