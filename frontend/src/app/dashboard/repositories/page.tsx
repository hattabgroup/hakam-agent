"use client";
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';

interface Integration {
    id: number;
    provider: string;
    created_at: string;
}

interface Repository {
    repo_external_id: string;
    repo_full_name: string;
    is_enabled: boolean;
    provider?: string;
    id?: number;
    integration_id?: number;
}

export default function RepositoriesPage() {
    const { user, loading: authLoading } = useAuth();
    const [savedRepos, setSavedRepos] = useState<Repository[]>([]);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Discovery Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIntegrationId, setSelectedIntegrationId] = useState<number | null>(null);
    const [discoveredRepos, setDiscoveredRepos] = useState<Repository[]>([]);
    const [discoveryLoading, setDiscoveryLoading] = useState(false);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);
    const [savingLoading, setSavingLoading] = useState(false);
    const [togglingRepoIds, setTogglingRepoIds] = useState<Set<string>>(new Set());

    // Subscription State
    const [subDetails, setSubDetails] = useState<any>(null);

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
        fetchSubscription();
    }, []);

    const fetchSubscription = async () => {
        try {
            const res = await axios.get('/api/billing/subscription');
            setSubDetails(res.data);
        } catch (error) {
            console.error("Failed to fetch subscription", error);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [repoRes, intRes] = await Promise.all([
                axios.get('/api/repositories'),
                axios.get('/api/integrations')
            ]);
            setSavedRepos(repoRes.data);
            setIntegrations(intRes.data);
            if (intRes.data.length > 0) {
                setSelectedIntegrationId(intRes.data[0].id);
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleDiscover = async () => {
        if (!selectedIntegrationId) return;
        setDiscoveryLoading(true);
        setDiscoveryError(null);
        setDiscoveredRepos([]);
        try {
            const response = await axios.get(`/api/repositories/discover?integration_id=${selectedIntegrationId}`);
            // Mark discovered repos that are already saved
            const discovered = response.data.map((r: Repository) => ({
                ...r,
                is_enabled: savedRepos.some(saved => saved.repo_external_id === r.repo_external_id)
            }));
            setDiscoveredRepos(discovered);
        } catch (err: any) {
            setDiscoveryError(err.response?.data?.detail || "Discovery failed. Please check your connection and token.");
        } finally {
            setDiscoveryLoading(false);
        }
    };

    const toggleSavedRepo = async (repo: Repository) => {
        setTogglingRepoIds(prev => new Set(prev).add(repo.repo_external_id));
        try {
            // Turning it off means deleting it from DB in this refactor
            const body = {
                provider: repo.provider,
                integration_id: repo.integration_id,
                repos: [{
                    repo_external_id: repo.repo_external_id,
                    repo_full_name: repo.repo_full_name,
                    is_enabled: false // Trigger deletion
                }]
            };
            await axios.post('/api/repositories', body);

            // Refresh main list
            const repoRes = await axios.get('/api/repositories');
            setSavedRepos(repoRes.data);
            // Refresh subscription stats as usage changed
            fetchSubscription();

            setSuccess(`Removed project ${repo.repo_full_name}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update repository");
        } finally {
            setTogglingRepoIds(prev => {
                const next = new Set(prev);
                next.delete(repo.repo_external_id);
                return next;
            });
        }
    };

    const handleSaveFromDiscovery = async (repo: Repository) => {
        setTogglingRepoIds(prev => new Set(prev).add(repo.repo_external_id));
        const integration = integrations.find(i => i.id === selectedIntegrationId);
        if (!integration) return;

        try {
            const isRemoving = savedRepos.some(saved => saved.repo_external_id === repo.repo_external_id);
            const body = {
                provider: integration.provider,
                integration_id: selectedIntegrationId,
                repos: [{
                    repo_external_id: repo.repo_external_id,
                    repo_full_name: repo.repo_full_name,
                    is_enabled: !isRemoving
                }]
            };
            await axios.post('/api/repositories', body);

            // Update local discovered state
            setDiscoveredRepos(prev => prev.map(r =>
                r.repo_external_id === repo.repo_external_id ? { ...r, is_enabled: !isRemoving } : r
            ));

            // Refresh main list
            const repoRes = await axios.get('/api/repositories');
            setSavedRepos(repoRes.data);
            // Refresh subscription stats
            fetchSubscription();

            setSuccess(isRemoving ? `Removed ${repo.repo_full_name}` : `Linked ${repo.repo_full_name}`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            // Check for plan limit error (402 or check text)
            if (err.response?.status === 402 || (err.response?.data?.detail && err.response.data.detail.includes("Plan limit"))) {
                if (confirm(err.response.data.detail + " \n\nGo to Billing?")) {
                    window.location.href = "/dashboard/billing";
                }
            }
            setError(err.response?.data?.detail || "Failed to save repository");
        } finally {
            setTogglingRepoIds(prev => {
                const next = new Set(prev);
                next.delete(repo.repo_external_id);
                return next;
            });
        }
    };

    const filteredSaved = useMemo(() => {
        return savedRepos.filter(r =>
            r.repo_full_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [savedRepos, searchQuery]);

    const getProviderIcon = (provider: string | undefined) => {
        if (!provider) return null;
        switch (provider.toLowerCase()) {
            case 'github':
                return <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-5 h-5 invert opacity-50" />;
            case 'gitlab':
                return <img src="https://www.svgrepo.com/show/448226/gitlab.svg" alt="GitLab" className="w-5 h-5 opacity-50" />;
            case 'bitbucket':
                return <img src="https://www.svgrepo.com/show/349308/bitbucket.svg" alt="Bitbucket" className="w-5 h-5 opacity-50" />;
            default:
                return null;
        }
    };

    // Derived state for button
    const isOverLimit = subDetails ? subDetails.used_repos >= subDetails.allowed_repos : false;

    return (
        <div className="px-10 py-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Active Projects</h1>
                    <div className="flex items-center gap-3">
                        <p className="text-[var(--fg-muted)]">Manage the repositories currently monitored by Hakam.</p>
                        {subDetails && (
                            <span className={`text-xs px-2 py-0.5 rounded border ${isOverLimit ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-white/5 text-zinc-400 border-white/10'}`}>
                                Usage: {subDetails.used_repos} / {subDetails.allowed_repos}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    {isOverLimit && (
                        <a href="/dashboard/billing" className="btn-secondary px-6 py-3 text-sm flex items-center gap-2 text-indigo-400 hover:text-indigo-300">
                            Upgrade Plan
                        </a>
                    )}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        disabled={isOverLimit}
                        className={`btn-premium px-6 py-3 text-sm flex items-center gap-2 group ${isOverLimit ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <svg className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                        Add New Project
                    </button>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm flex items-center gap-3">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    {success}
                </div>
            )}

            {/* Main List */}
            <div className="glass rounded-[32px] border-white/5 overflow-hidden">
                <div className="px-8 py-6 border-b border-white/5 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Search active projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-2.5 text-sm text-white outline-none focus:border-indigo-500/50 transition-all"
                        />
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-white/[0.01]">
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">Project</th>
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">Provider</th>
                                <th className="px-8 py-4 text-left text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">Status</th>
                                <th className="px-8 py-4 text-right text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={`skeleton-${i}`} className="animate-pulse">
                                        <td className="px-8 py-5 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5" />
                                            <div className="space-y-2"><div className="w-32 h-4 bg-white/5 rounded" /><div className="w-20 h-3 bg-white/5 rounded" /></div>
                                        </td>
                                        <td className="px-8 py-5"><div className="w-16 h-4 bg-white/5 rounded" /></td>
                                        <td className="px-8 py-5"><div className="w-16 h-6 bg-white/5 rounded-full" /></td>
                                        <td className="px-8 py-5"><div className="w-10 h-6 bg-white/5 rounded-full ml-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredSaved.length > 0 ? (
                                filteredSaved.map((repo, idx) => (
                                    <tr key={repo.repo_external_id || repo.id || idx} className={`hover:bg-white/[0.02] transition-all group ${togglingRepoIds.has(repo.repo_external_id) ? 'opacity-40 pointer-events-none' : ''}`}>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/10 group-hover:scale-110 transition-transform">
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white mb-0.5">{repo.repo_full_name}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">ID: {repo.repo_external_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                {getProviderIcon(repo.provider)}
                                                <span className="text-zinc-400 font-medium text-sm capitalize">{repo.provider}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => toggleSavedRepo(repo)}
                                                className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-all"
                                                title="Stop Monitoring"
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="w-16 h-16 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto mb-4">
                                            <svg className="text-zinc-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                        </div>
                                        <p className="text-zinc-500 font-medium mb-4">No projects are being monitored yet.</p>
                                        <button
                                            onClick={() => setIsModalOpen(true)}
                                            className="text-indigo-400 hover:text-indigo-300 font-bold text-sm underline underline-offset-4"
                                            disabled={isOverLimit}
                                        >
                                            Add your first project
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Discovery Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Link New Project"
                maxWidth="max-w-3xl"
            >
                <div className="flex flex-col gap-8">
                    {/* Select Connection */}
                    <div className="flex flex-col sm:flex-row gap-4 items-end bg-white/[0.02] border border-white/5 rounded-2xl p-6">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Source Connection</label>
                            <div className="relative group">
                                <select
                                    value={selectedIntegrationId || ""}
                                    onChange={(e) => setSelectedIntegrationId(Number(e.target.value))}
                                    className="w-full appearance-none bg-white/5 border border-white/10 text-white text-sm rounded-xl px-5 py-3.5 pr-12 outline-none focus:border-indigo-500/50 transition-all cursor-pointer"
                                >
                                    {integrations.map((int) => (
                                        <option key={int.id} value={int.id} className="bg-[#0f0f12]">
                                            {int.provider.charAt(0).toUpperCase() + int.provider.slice(1)} ({int.id})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleDiscover}
                            disabled={discoveryLoading || !selectedIntegrationId}
                            className="bg-white text-black px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center gap-2 shrink-0 h-[52px]"
                        >
                            {discoveryLoading ? (
                                <><span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> Fetching...</>
                            ) : (
                                <><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><polyline points="21 12 17 12 17 8" /></svg> Discover</>
                            )}
                        </button>
                    </div>

                    {/* Discovered List */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center justify-between">
                            Available Repositories
                            {discoveredRepos.length > 0 && <span className="text-indigo-400 normal-case tracking-normal">{discoveredRepos.length} found</span>}
                        </h3>

                        <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {discoveryLoading ? (
                                [1, 2, 3].map(i => (
                                    <div key={`discovery-skeleton-${i}`} className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] animate-pulse flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5" />
                                            <div className="w-40 h-4 bg-white/5 rounded" />
                                        </div>
                                        <div className="w-16 h-8 bg-white/5 rounded-lg" />
                                    </div>
                                ))
                            ) : discoveryError ? (
                                <div className="py-12 px-6 text-center bg-red-500/5 rounded-2xl border border-red-500/10">
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-400">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                                    </div>
                                    <p className="text-red-400 font-bold mb-1">Discovery Failed</p>
                                    <p className="text-red-400/60 text-sm max-w-xs mx-auto mb-4">{discoveryError}</p>
                                    <button
                                        onClick={handleDiscover}
                                        className="text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : discoveredRepos.length > 0 ? (
                                discoveredRepos.map((repo) => {
                                    const isLinked = repo.is_enabled;
                                    const isToggling = togglingRepoIds.has(repo.repo_external_id);

                                    return (
                                        <div
                                            key={repo.repo_external_id}
                                            className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${isLinked ? 'border-indigo-500/20 bg-indigo-500/[0.02]' : 'border-white/5 bg-white/[0.01] hover:bg-white/[0.03]'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLinked ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-500'}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>
                                                </div>
                                                <div className="font-bold text-white text-sm">{repo.repo_full_name}</div>
                                            </div>
                                            <button
                                                onClick={() => handleSaveFromDiscovery(repo)}
                                                disabled={isToggling}
                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${isLinked
                                                    ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                                                    : 'bg-indigo-500 text-white hover:bg-indigo-400'
                                                    } ${isToggling ? 'opacity-50 pointer-events-none' : ''}`}
                                            >
                                                {isToggling && <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                                                {isLinked ? 'Unlink' : 'Link Project'}
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-zinc-500 text-sm italic bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                    Click discover to find projects on your connection.
                                </div>
                            )
                            }
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
