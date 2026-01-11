"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";

interface Review {
    id: number;
    pr_id: number;
    status: string;
    summary: string | null;
    created_at: string;
    published_at: string | null;
    provider_comment_id: string | null;
    pull_request: {
        id: number;
        repo_id: number;
        pr_external_id: number;
        repository: {
            id: number;
            repo_full_name: string;
            provider: string;
        };
    };
}

interface Repository {
    id: number;
    repo_full_name: string;
    provider: string;
    is_enabled: boolean;
}

export default function ReviewsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepoId, setSelectedRepoId] = useState<string>("");
    const [prNumber, setPrNumber] = useState<string>("");
    const [isStartingReview, setIsStartingReview] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const fetchReviews = async () => {
        try {
            const response = await fetch("/api/reviews");
            if (response.ok) {
                const data = await response.json();
                setReviews(data);
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRepositories = async () => {
        try {
            const response = await fetch("/api/repositories");
            if (response.ok) {
                const data = await response.json();
                setRepositories(data.filter((r: Repository) => r.is_enabled));
            }
        } catch (error) {
            console.error("Failed to fetch repositories:", error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchReviews();
            fetchRepositories(); // Prefetch repos for the dropdown
        }
    }, [user]);

    const handleRunReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRepoId || !prNumber) return;

        setIsStartingReview(true);
        try {
            const response = await fetch("/api/reviews/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repo_id: parseInt(selectedRepoId),
                    pr_number: prNumber.toString()
                })
            });

            if (response.ok) {
                const newReview = await response.json();
                setIsRunModalOpen(false);
                setSelectedRepoId("");
                setPrNumber("");
                // Refresh list or add new review to top
                fetchReviews();
                router.refresh();
            } else {
                alert("Failed to start review. Please check the PR number and try again.");
            }
        } catch (error) {
            console.error("Error starting review:", error);
            alert("An error occurred while starting the review.");
        } finally {
            setIsStartingReview(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        switch (s) {
            case "queued":
                return <span className="px-2.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 text-[10px] font-black border border-zinc-500/20 uppercase tracking-wider">Queued</span>;
            case "running":
                return <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-wider animate-pulse">Running</span>;
            case "completed":
            case "done":
                return <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-black border border-green-500/20 uppercase tracking-wider">Completed</span>;
            case "failed":
                return <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black border border-red-500/20 uppercase tracking-wider">Failed</span>;
            default:
                return <span className="px-2.5 py-0.5 rounded-full bg-zinc-500/10 text-zinc-400 text-[10px] font-black border border-zinc-500/20 uppercase tracking-wider">{status}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="px-10 py-10">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Reviews</h1>
                    <p className="text-zinc-500">View and manage your automated code reviews.</p>
                </div>
                <button
                    onClick={() => setIsRunModalOpen(true)}
                    className="btn-premium px-6 py-2.5 text-sm flex items-center gap-2"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    Run Review
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : reviews.length === 0 ? (
                <div className="glass p-12 rounded-[40px] text-center border-white/5 bg-white/5">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto border border-indigo-500/20">
                        🔍
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No reviews yet</h3>
                    <p className="text-zinc-500 mb-8 max-w-md mx-auto">Code reviews will appear here once you open Pull Requests in your linked repositories.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reviews.map((review) => (
                        <Link
                            key={review.id}
                            href={`/dashboard/reviews/${review.id}`}
                            className="glass p-8 rounded-[32px] border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-6 gap-4">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 flex-shrink-0">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 3C6.77 2.16 5.14 1.16 3 1.5 3 4 5 7 5 7c-1.23.97-1.92 2.52-1.92 4.19-.07 1.51.5 2.97 1.56 3.99C4.19 19.38 4.29 20.35 4.3 22" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-white truncate text-sm" title={review.pull_request.repository.repo_full_name}>
                                            {review.pull_request.repository.repo_full_name}
                                        </h3>
                                        <p className="text-zinc-500 text-xs">PR #{review.pull_request.pr_external_id}</p>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    {getStatusBadge(review.status)}
                                </div>
                            </div>

                            <div className="flex-1">
                                <p className="text-zinc-400 text-sm mb-6 line-clamp-3">
                                    {review.summary ?
                                        review.summary.replace(/[#*`]/g, '').substring(0, 150) + "..."
                                        : "No summary available."}
                                </p>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
                                <span className="text-xs font-medium text-zinc-500">
                                    {formatDate(review.created_at)}
                                </span>
                                <div className="flex items-center gap-2 text-indigo-400 group-hover:translate-x-1 transition-transform">
                                    <span className="text-xs font-bold uppercase tracking-wider">View Details</span>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isRunModalOpen}
                onClose={() => setIsRunModalOpen(false)}
                title="Run Manual Review"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleRunReview} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Repository</label>
                        <select
                            required
                            value={selectedRepoId}
                            onChange={(e) => setSelectedRepoId(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                        >
                            <option value="" disabled className="bg-zinc-900 text-zinc-500">Select a repository...</option>
                            {repositories.map(repo => (
                                <option key={repo.id} value={repo.id} className="bg-zinc-900 text-white">
                                    {repo.repo_full_name} ({repo.provider})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Pull Request Number</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={prNumber}
                            onChange={(e) => setPrNumber(e.target.value)}
                            placeholder="e.g., 42"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>

                    <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/20 p-4">
                        <div className="flex items-start gap-3">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 mt-0.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            <p className="text-xs text-indigo-300 leading-relaxed">
                                Starting a review will queue a job for the AI agent. The review process usually takes 1-2 minutes depending on the PR size.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsRunModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isStartingReview}
                            className="btn-premium px-8 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                        >
                            {isStartingReview ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Starting...
                                </>
                            ) : (
                                "Start Review"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
