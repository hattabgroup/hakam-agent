"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import axios from "axios";

interface Integration {
    id: number;
    provider: string;
    created_at: string;
}

export default function IntegrationsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

    // Form state
    const [provider, setProvider] = useState("github");
    const [token, setToken] = useState("");
    const [bitbucketUser, setBitbucketUser] = useState("");
    const [bitbucketPassword, setBitbucketPassword] = useState("");

    const fetchIntegrations = async () => {
        try {
            const response = await axios.get("/api/integrations");
            setIntegrations(response.data);
        } catch (err: any) {
            console.error("Failed to fetch integrations", err);
            setError("Failed to load integrations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }
        if (user) {
            fetchIntegrations();
        }
    }, [user, authLoading, router]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this integration? This will disconnect your provider and may affect active reviews.")) {
            return;
        }

        setError(null);
        setSuccess(null);

        try {
            await axios.delete(`/api/integrations/${id}`);
            setSuccess("Integration deleted successfully.");
            // If deleting the one being edited, reset form
            if (editingIntegration?.id === id) {
                resetForm();
            }
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to delete integration.");
        }
    };

    const handleEdit = (integration: Integration) => {
        setEditingIntegration(integration);
        setProvider(integration.provider);
        // Clear tokens for security - force user to enter new one if they want to update
        setToken("");
        setBitbucketUser("");
        setBitbucketPassword("");
        setError(null);
        setSuccess(null);
    };

    const resetForm = () => {
        setEditingIntegration(null);
        setProvider("github"); // Default
        setToken("");
        setBitbucketUser("");
        setBitbucketPassword("");
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccess(null);

        // For Bitbucket, combine user:pass
        let finalToken = token;
        if (provider === 'bitbucket') {
            finalToken = `${bitbucketUser}:${bitbucketPassword}`;
        }

        try {
            if (editingIntegration) {
                // UPDATE
                await axios.put(`/api/integrations/${editingIntegration.id}`, { token: finalToken });
                setSuccess("Integration updated successfully!");
                resetForm();
            } else {
                // CREATE
                await axios.post("/api/integrations", { provider, token: finalToken });
                setSuccess("Integration added successfully!");
                resetForm(); // Reset to defaults
            }
            fetchIntegrations();
        } catch (err: any) {
            setError(err.response?.data?.detail || `Failed to ${editingIntegration ? 'update' : 'add'} integration.`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="px-10 py-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Integrations</h1>
                    <p className="text-[var(--fg-muted)]">Connect your source control providers to enable automated reviews.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Add/Edit Integration Form */}
                <div className="lg:col-span-1">
                    <div className="glass p-8 rounded-[32px] border-white/5 bg-white/5 sticky top-32">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">{editingIntegration ? 'Edit Integration' : 'Add Integration'}</h2>
                            {editingIntegration && (
                                <button
                                    onClick={resetForm}
                                    className="text-xs font-bold text-zinc-500 hover:text-white uppercase tracking-widest"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-gap-6">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Provider</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%23666%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={provider}
                                    onChange={(e) => setProvider(e.target.value)}
                                    required
                                    disabled={!!editingIntegration}
                                >
                                    <option value="github" className="bg-zinc-900">GitHub</option>
                                    <option value="gitlab" className="bg-zinc-900">GitLab</option>
                                    <option value="bitbucket" className="bg-zinc-900">Bitbucket</option>
                                </select>
                                {editingIntegration && (
                                    <p className="mt-2 text-[10px] text-zinc-500">Provider cannot be changed while editing.</p>
                                )}
                            </div>

                            {provider === 'bitbucket' ? (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Bitbucket Email</label>
                                        <input
                                            type="text"
                                            placeholder="your-email@example.com"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            value={bitbucketUser}
                                            onChange={(e) => setBitbucketUser(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-8">
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">API Token</label>
                                        <input
                                            type="password"
                                            placeholder="Atlassian API Token"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            value={bitbucketPassword}
                                            onChange={(e) => setBitbucketPassword(e.target.value)}
                                            required
                                        />
                                        <p className="mt-2 text-[10px] text-zinc-500">
                                            Create via <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" className="text-zinc-400 underline hover:text-white">Atlassian Security</a>.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="mb-8">
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Personal Access Token</label>
                                    <input
                                        type="password"
                                        placeholder="ghp_xxxxxxxxxxxx"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        required
                                    />
                                    <p className="mt-2 text-[10px] text-zinc-500">Tokens are encrypted and stored securely.</p>
                                </div>
                            )}

                            {error && (
                                <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full btn-premium py-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (editingIntegration ? "Updating..." : "Connecting...") : (editingIntegration ? "Update Integration" : "Add Integration")}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Integrations List */}
                <div className="lg:col-span-2">
                    <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                            <h2 className="text-xl font-bold">Active Integrations</h2>
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{integrations.length} Connected</span>
                        </div>

                        {loading ? (
                            <div className="p-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                                <p className="text-sm font-medium text-zinc-500">Fetching integrations...</p>
                            </div>
                        ) : integrations.length === 0 ? (
                            <div className="p-20 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl mb-6">🔌</div>
                                <h3 className="text-xl font-bold mb-2">No integrations yet</h3>
                                <p className="text-zinc-500 max-w-xs">Connect your first provider to start discovering repositories and automating reviews.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {integrations.map((integration) => (
                                    <div key={integration.id} className="p-8 hover:bg-white/[0.02] transition-colors group flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                                                {integration.provider === 'github' ? (
                                                    <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="w-8 h-8 invert opacity-80" />
                                                ) : integration.provider === 'gitlab' ? (
                                                    <img src="https://www.svgrepo.com/show/448226/gitlab.svg" alt="GitLab" className="w-8 h-8 opacity-80" />
                                                ) : integration.provider === 'bitbucket' ? (
                                                    <img src="https://www.svgrepo.com/show/349308/bitbucket.svg" alt="Bitbucket" className="w-8 h-8 opacity-80" />
                                                ) : (
                                                    '🏗️'
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-white capitalize">{integration.provider}</h4>
                                                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                                    Added on {new Date(integration.created_at).toLocaleDateString(undefined, {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-tight">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                Active
                                            </div>
                                            <button
                                                onClick={() => handleEdit(integration)}
                                                className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                                                title="Edit Integration"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(integration.id)}
                                                className="p-2 rounded-xl bg-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                                title="Delete Integration"
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
