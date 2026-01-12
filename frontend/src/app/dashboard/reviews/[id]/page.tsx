"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface ReviewViolation {
    id: number;
    // Relations - matching backend schema optionality
    policy_category?: { id: number; name: string };
    policy_rule?: { id: number; name: string; severity: string };
    // Fallbacks or snapshot data if relations missing
    severity: number;
    file_path: string;
    line_start: number;
    line_end: number;
    message: string;
}

interface Review {
    id: number;
    pr_id: number;
    status: string;
    summary: string | null;
    created_at: string;
    published_at: string | null;
    provider_comment_id: string | null;
    violations: ReviewViolation[];
    pull_request: {
        id: number;
        repo_id: number;
        pr_external_id: number;
        author?: string;
        title?: string;
        repository: {
            id: number;
            repo_full_name: string;
            provider: string;
        };
    };
}

export default function ReviewDetailsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const { id } = params;

    const [review, setReview] = useState<Review | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const fetchReview = async () => {
        if (!id) return;
        try {
            const response = await fetch(`/api/reviews/${id}`);
            if (response.ok) {
                const data = await response.json();
                setReview(data);
            } else {
                console.error("Failed to fetch review");
                // router.push("/dashboard/reviews"); // Optional: redirect on error
            }
        } catch (error) {
            console.error("Failed to fetch review:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user && id) {
            fetchReview();
        }
    }, [user, id]);

    const publishReview = async (dryRun = false) => {
        if (!review || isPublishing) return;

        setIsPublishing(true);
        try {
            const response = await fetch(`/api/reviews/${review.id}/publish`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ dry_run: dryRun })
            });

            if (response.ok) {
                const updatedReview = await response.json();
                setReview(updatedReview);
                alert("Review published successfully!");
            } else {
                const error = await response.json();
                alert(`Failed to publish: ${error.detail || "Unknown error"}`);
            }
        } catch (error) {
            console.error("Publish error:", error);
            alert("An error occurred while publishing.");
        } finally {
            setIsPublishing(false);
        }
    };

    const retryReview = async () => {
        if (!review) return;
        setIsPublishing(true); // Reuse state
        try {
            // Create a new review run for the same PR
            const response = await fetch("/api/reviews/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    repo_id: review.pull_request.repository.id,
                    pr_number: review.pull_request.pr_external_id
                })
            });

            if (response.ok) {
                const newReview = await response.json();
                // Redirect to the new review
                router.push(`/dashboard/reviews/${newReview.id}`);
            } else {
                const error = await response.json();
                alert(`Failed to retry review: ${error.detail || "Unknown error"}`);
                setIsPublishing(false);
            }
        } catch (err) {
            console.error("Failed to retry review:", err);
            alert("Failed to retry review. Please try again.");
            setIsPublishing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!review) {
        return (
            <div className="px-10 py-10">
                <div className="glass p-12 rounded-[40px] text-center border-white/5 bg-white/5">
                    <h3 className="text-xl font-bold text-white mb-2">Review not found</h3>
                    <Link href="/dashboard/reviews" className="text-indigo-400 hover:text-indigo-300">Back to Reviews</Link>
                </div>
            </div>
        );
    }

    const { violations = [] } = review;

    // 5=Critical, 4=High, 3=Medium, 2=Low, 1=Info
    const getSeverityLabel = (level: number) => {
        switch (level) {
            case 5: return 'CRITICAL';
            case 4: return 'HIGH';
            case 3: return 'WARNING';
            case 2: return 'LOW';
            default: return 'INFO';
        }
    };

    const getSeverityColor = (level: number) => {
        switch (level) {
            case 5: return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 4: return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 3: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
            case 2: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    const sortedViolations = [...violations].sort((a, b) => b.severity - a.severity);

    return (
        <div className="px-6 lg:px-10 py-10 pb-20">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-10">
                <div>
                    <Link
                        href="/dashboard/reviews"
                        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm font-bold mb-4 group"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6" /></svg>
                        Back to Reviews
                    </Link>
                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2 tracking-tight">
                        Review #{review.id}
                    </h1>
                    <div className="flex items-center gap-3 text-zinc-400 text-sm">
                        <span className="font-mono bg-white/5 px-2 py-1 rounded">{review.pull_request.repository.repo_full_name}</span>
                        <span>•</span>
                        <a
                            href={`https://${review.pull_request.repository.provider === 'github' ? 'github.com' : review.pull_request.repository.provider === 'gitlab' ? 'gitlab.com' : 'bitbucket.org'}/${review.pull_request.repository.repo_full_name}/${review.pull_request.repository.provider === 'gitlab' ? '-/merge_requests' : 'pull-requests'}/${review.pull_request.pr_external_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                            PR #{review.pull_request.pr_external_id}
                        </a>
                        <span>•</span>
                        <span>{new Date(review.created_at).toLocaleDateString()}</span>
                        {review.pull_request.author && (
                            <>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <span className="text-zinc-500">Author:</span>
                                    <span className="text-white font-medium">{review.pull_request.author}</span>
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${review.status === 'done' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        review.status === 'running' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            review.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                        }`}>
                        {review.status}
                    </div>

                    {review.status === 'failed' && (
                        <button
                            onClick={retryReview}
                            disabled={isPublishing}
                            className="btn-secondary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPublishing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Retrying...
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 21h5v-5" /></svg>
                                    Retry Review
                                </>
                            )}
                        </button>
                    )}

                    {review.status === 'done' && (
                        <button
                            onClick={() => publishReview(false)}
                            disabled={isPublishing || !!review.published_at}
                            className="btn-premium px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isPublishing ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Publishing...
                                </>
                            ) : review.published_at ? (
                                <>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                                    Published
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                                    Publish to PR
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Summary Section */}
                <div className="lg:col-span-2 space-y-8">
                    <section className="glass p-8 rounded-[32px] border-white/5 bg-white/5">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            AI Summary
                        </h2>
                        <div className="prose prose-invert max-w-none text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {review.summary || "No summary provided."}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                            Violations Found
                            <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-black border border-white/10">{violations.length}</span>
                        </h2>

                        {violations.length === 0 ? (
                            <div className="glass p-8 rounded-[32px] border-white/5 bg-white/5 text-center py-12">
                                <p className="text-zinc-500">No violations found in this review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sortedViolations.map((v, i) => (
                                    <div key={i} className="glass p-6 rounded-2xl border-white/5 bg-white/5 hover:bg-white/[0.08] transition-colors">
                                        <div className="flex items-start justify-between gap-4 mb-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${getSeverityColor(v.severity)}`}>
                                                    {getSeverityLabel(v.severity)}
                                                </span>
                                                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                                    {v.policy_category?.name || 'General'}
                                                </span>
                                                <span className="text-zinc-600 text-[10px]">•</span>
                                                <span className="text-indigo-400 font-mono text-xs font-bold">
                                                    {v.policy_rule?.name || 'Rule'}
                                                </span>
                                            </div>
                                            <div className="text-zinc-500 text-xs font-mono">
                                                {v.file_path}:{v.line_start}
                                            </div>
                                        </div>
                                        <p className="text-zinc-300 text-sm whitespace-pre-wrap">{v.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar Info - Simplified for now, can add stats later */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass p-6 rounded-3xl border-white/5 bg-white/5">
                        <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Review Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                <div className="text-2xl font-bold text-white mb-1">{violations.filter(v => v.severity === 5).length}</div>
                                <div className="text-[10px] text-red-400 font-bold uppercase">Critical</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center">
                                <div className="text-2xl font-bold text-white mb-1">{violations.filter(v => v.severity === 3).length}</div>
                                <div className="text-[10px] text-amber-400 font-bold uppercase">Warnings</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
