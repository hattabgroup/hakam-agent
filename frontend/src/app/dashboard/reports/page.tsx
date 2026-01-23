"use client";

import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Repository {
    id: number;
    repo_full_name: string;
}

interface Violation {
    id: number;
    review_id: number;
    file_path: string;
    line_start: number;
    message: string;
    severity: number;
    category: string;
    created_at: string;
    pr_id: number;
    pr_title: string;
    author: string;
    repo_name: string;
}

interface Summary {
    by_severity: Record<string, number>;
    by_category: Record<string, number>;
    total: number;
}

export default function ReportingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const [authors, setAuthors] = useState<string[]>([]);
    const [repositories, setRepositories] = useState<Repository[]>([]);

    // Filters
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const [selectedRepoIds, setSelectedRepoIds] = useState<number[]>([]);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [reportData, setReportData] = useState<{ summary: Summary; violations: Violation[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingReport, setIsFetchingReport] = useState(false);

    // UI States for dropdowns
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
    const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);

    const authorDropdownRef = useRef<HTMLDivElement>(null);
    const repoDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target as Node)) {
                setIsAuthorDropdownOpen(false);
            }
            if (repoDropdownRef.current && !repoDropdownRef.current.contains(event.target as Node)) {
                setIsRepoDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const [isRestricted, setIsRestricted] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        } else if (user) {
            checkAccess();
        }
    }, [user, loading, router]);

    const checkAccess = async () => {
        try {
            const res = await fetch('/api/billing/subscription');
            if (res.ok) {
                const sub = await res.json();
                // Gate if Starter (which has 3 repos limit usually, or check plan name)
                // Assuming 'Starter' is the name returned by backend
                // Or better, check allowed_repos < 10 (Team has 10)
                if (sub.plan_name === 'Starter' || sub.plan_name === 'Free') {
                    setIsRestricted(true);
                }
            }
        } catch (e) {
            console.error("Failed to check access:", e);
        }
    };



    const fetchFilters = async () => {
        try {
            const [authorsRes, reposRes] = await Promise.all([
                fetch("/api/reports/authors"),
                fetch("/api/repositories")
            ]);

            if (authorsRes.ok) {
                const authorsData = await authorsRes.json();
                setAuthors(authorsData);
            }
            if (reposRes.ok) {
                const reposData = await reposRes.json();
                setRepositories(reposData.filter((r: any) => r.is_enabled));
            }
        } catch (error) {
            console.error("Failed to fetch filters:", error);
        }
    };

    const fetchReport = async () => {
        setIsFetchingReport(true);
        try {
            const params = new URLSearchParams();
            selectedAuthors.forEach(a => params.append("author", a)); // Note: Backend currently implemented for single author param 'author', might need update if we want multi.
            // Wait, backend implementation was: if author: query = query.filter(models.PullRequest.author == author)
            // It only takes ONE author. I need to update backend to support multiple authors or just send one loop?
            // The user asked for "select the author ... and Repositories as mlti select".
            // "Select the author" (singular) usually. But if I want multi, I should update backend.
            // Let's assume single author for now based on my backend implementation, OR update backend.
            // Converting backend to `author: Optional[List[str]] = Query(None)` is better.
            // But for now, let's just send "author" multiple times and see if FastAPI parses it to list if defined as list, 
            // BUT implementation was `author: Optional[str]`.
            // I will strictly follow my backend implementation which is SINGLE author for now. 
            // If user wants multi authors, I'll have to Refactor backend. 
            // "select the author" (singular) "and date range ... and repositories as mlti select" (plural).
            // So Author -> Single, Repos -> Multi.

            if (selectedAuthors.length > 0) {
                // Just use the first one if multiple selected, or warn? 
                // Actually I will change UI to single select for Author to match backend & Request strict interpretation.
                // Re-reading: "select the author ... repositories as mlti select" -> Author singular, Repos multi.
                params.append("author", selectedAuthors[0]);
            }

            selectedRepoIds.forEach(id => params.append("repo_ids", id.toString()));
            if (dateFrom) params.append("start_date", dateFrom);
            if (dateTo) params.append("end_date", dateTo);

            const response = await fetch(`/api/reports/violations?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setReportData(data);
            }
        } catch (error) {
            console.error("Failed to fetch report:", error);
        } finally {
            setIsFetchingReport(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchFilters();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchReport();
        }
    }, [user, selectedAuthors, selectedRepoIds, dateFrom, dateTo]);

    // Formatters
    const formatSeverity = (sev: number) => {
        const map: any = { 1: "Info", 2: "Low", 3: "Medium", 4: "High", 5: "Critical" };
        return map[sev] || "Unknown";
    };

    const getSeverityColor = (sev: number) => {
        if (sev >= 5) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
        if (sev === 4) return "text-orange-500 bg-orange-500/10 border-orange-500/20";
        if (sev === 3) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
        return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    };

    const toggleRepo = (id: number) => {
        if (selectedRepoIds.includes(id)) {
            setSelectedRepoIds(selectedRepoIds.filter(r => r !== id));
        } else {
            setSelectedRepoIds([...selectedRepoIds, id]);
        }
    };

    // Single select for author
    const selectAuthor = (author: string) => {
        if (selectedAuthors.includes(author)) {
            setSelectedAuthors([]);
        } else {
            setSelectedAuthors([author]);
        }
        setIsAuthorDropdownOpen(false);
    };

    const handleExportCSV = () => {
        if (!reportData || reportData.violations.length === 0) return;

        const headers = ["ID", "Date", "Repository", "PR ID", "Author", "File", "Severity", "Category", "Message"];
        const csvContent = [
            headers.join(","),
            ...reportData.violations.map(v => {
                const row = [
                    v.id,
                    new Date(v.created_at).toISOString().split('T')[0],
                    `"${v.repo_name}"`, // Quote strings that might have commas
                    v.pr_id,
                    `"${v.author || 'Unknown'}"`,
                    `"${v.file_path || ''}"`,
                    formatSeverity(v.severity),
                    `"${v.category}"`,
                    `"${(v.message || '').replace(/"/g, '""')}"` // Escape quotes
                ];
                return row.join(",");
            })
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `violations_report_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isRestricted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4">Advanced Reporting</h1>
                <p className="text-zinc-400 max-w-md mb-8">
                    Gain insights into your code quality and policy violations with our advanced reporting tools.
                    This feature is available on the <strong>Team Plan</strong> and above.
                </p>
                <Link
                    href="/dashboard/billing"
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg transition-all"
                >
                    Upgrade to Team
                </Link>
            </div>
        );
    }

    return (
        <div className="px-10 py-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Policy Reporting</h1>
                    <p className="text-zinc-500">Analyze violations and trends across your codebase.</p>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={handleExportCSV}
                        disabled={!reportData || reportData.violations.length === 0}
                        className="btn-outline px-4 py-2 text-sm flex items-center gap-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="glass p-4 rounded-3xl border border-white/5 bg-white/5 mb-8 flex flex-wrap gap-4 items-center">

                {/* Author Filter (Single Select) */}
                <div className="relative" ref={authorDropdownRef}>
                    <button
                        onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-white/5 text-zinc-300 text-sm hover:border-indigo-500/30 transition-colors min-w-[200px]"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        <span className="truncate flex-1 text-left">
                            {selectedAuthors.length > 0 ? selectedAuthors[0] : "All Authors"}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform ${isAuthorDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                    {isAuthorDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full min-w-[240px] max-h-60 overflow-y-auto bg-[#0a0a0a] glass border border-white/10 rounded-xl shadow-2xl z-20 p-2">
                            <button
                                onClick={() => selectAuthor("")}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedAuthors.length === 0 ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                All Authors
                            </button>
                            {authors.map(author => (
                                <button
                                    key={author}
                                    onClick={() => selectAuthor(author)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors truncate ${selectedAuthors.includes(author) ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    {author}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Repository Filter (Multi Select) */}
                <div className="relative" ref={repoDropdownRef}>
                    <button
                        onClick={() => setIsRepoDropdownOpen(!isRepoDropdownOpen)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-xl border border-white/5 text-zinc-300 text-sm hover:border-indigo-500/30 transition-colors min-w-[200px]"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500"><path d="M2 9h20" /><path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9" /><path d="M9 22V12h6v10" /><path d="M2 9V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4" /></svg>
                        <span className="truncate flex-1 text-left">
                            {selectedRepoIds.length === 0 ? "All Repositories" : `${selectedRepoIds.length} Selected`}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-zinc-500 transition-transform ${isRepoDropdownOpen ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6" /></svg>
                    </button>
                    {isRepoDropdownOpen && (
                        <div className="absolute top-full left-0 mt-2 w-full min-w-[280px] max-h-60 overflow-y-auto bg-[#0a0a0a] glass border border-white/10 rounded-xl shadow-2xl z-20 p-2">
                            <div className="px-3 py-2 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">Select Repositories</div>
                            {repositories.map(repo => (
                                <button
                                    key={repo.id}
                                    onClick={() => toggleRepo(repo.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${selectedRepoIds.includes(repo.id) ? 'bg-indigo-500/10 text-indigo-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                                >
                                    <span className="truncate">{repo.repo_full_name}</span>
                                    {selectedRepoIds.includes(repo.id) && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="h-6 w-px bg-white/10 hidden md:block" />

                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">From</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">To</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="bg-zinc-900/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-indigo-500/50"
                    />
                </div>
            </div>

            {/* Stats Cards */}
            {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="glass p-6 rounded-3xl border-white/5 bg-white/5">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Violations</div>
                        <div className="text-4xl font-bold text-white">{reportData.summary.total}</div>
                    </div>

                    <div className="glass p-6 rounded-3xl border-white/5 bg-white/5 lg:col-span-2">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">By Severity</div>
                        <div className="flex items-end gap-2 h-12">
                            {[5, 4, 3, 2, 1].map(sev => {
                                const count = reportData.summary.by_severity[sev] || 0;
                                const max = Math.max(...Object.values(reportData.summary.by_severity), 1);
                                const height = Math.max((count / max) * 100, 10); // min 10%
                                return (
                                    <div key={sev} className="flex-1 flex flex-col items-center gap-2 group">
                                        <div className="w-full bg-white/5 rounded-lg relative overflow-hidden h-full">
                                            <div
                                                className={`absolute bottom-0 left-0 w-full rounded-lg transition-all duration-1000 ${sev === 5 ? 'bg-rose-500' :
                                                    sev === 4 ? 'bg-orange-500' :
                                                        sev === 3 ? 'bg-amber-500' :
                                                            'bg-blue-500'
                                                    }`}
                                                style={{ height: `${height}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-zinc-500 font-bold">{formatSeverity(sev)}</span>
                                        <span className="text-xs font-bold text-white">{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="glass p-6 rounded-3xl border-white/5 bg-white/5 overflow-hidden">
                        <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-4">Top Categories</div>
                        <div className="space-y-3">
                            {Object.entries(reportData.summary.by_category)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 3)
                                .map(([cat, count]) => (
                                    <div key={cat} className="flex items-center justify-between">
                                        <span className="text-sm text-zinc-300 truncate">{cat}</span>
                                        <span className="text-sm font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{count}</span>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Violations List */}
            {isLoading || isFetchingReport ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : reportData?.violations.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                    No violations found for the selected filters.
                </div>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white mb-4">Violations Details</h3>
                    {reportData?.violations.map(violation => (
                        <Link
                            key={violation.id}
                            href={`/dashboard/reviews/${violation.review_id}`}
                            className="block glass p-6 rounded-2xl border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all group"
                        >
                            <div className="flex items-start justify-between gap-4 mb-2">
                                <div className="flex items-center gap-3">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getSeverityColor(violation.severity)}`}>
                                        {formatSeverity(violation.severity)}
                                    </span>
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{violation.category}</span>
                                </div>
                                <span className="text-xs text-zinc-500">{new Date(violation.created_at).toLocaleDateString()}</span>
                            </div>

                            <p className="text-zinc-300 font-medium mb-3 group-hover:text-white transition-colors">{violation.message}</p>

                            <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                                <div className="flex items-center gap-1.5">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
                                    {violation.file_path && violation.file_path.split('/').pop()}
                                    {violation.line_start && <span className="text-zinc-600">:L{violation.line_start}</span>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                    {violation.repo_name} #{violation.pr_id}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
