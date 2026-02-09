"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Status State
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    // Settings State
    const [provider, setProvider] = useState<string>('openai');
    const [apiKey, setApiKey] = useState<string>('');
    const [model, setModel] = useState<string>('gpt-4o');
    const [excludedBranches, setExcludedBranches] = useState<string[]>([]);
    const [branchInput, setBranchInput] = useState('');

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Auto-dismiss notification
    useEffect(() => {
        if (status.type) {
            const timer = setTimeout(() => setStatus({ type: null, message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');
                if (response.ok) {
                    const data = await response.json();
                    // Map key-value pairs to state
                    data.forEach((item: { key: string, value: string }) => {
                        if (item.key === 'llm_provider') setProvider(item.value);
                        if (item.key === 'llm_api_key') setApiKey(item.value);
                        if (item.key === 'llm_model') setModel(item.value);
                        if (item.key === 'excluded_branches') setExcludedBranches(item.value ? item.value.split(',').map(s => s.trim()).filter(Boolean) : []);
                    });
                }
            } catch (error) {
                console.error('Failed to fetch settings:', error);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchSettings();
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setStatus({ type: null, message: '' });

        const settingsToUpdate = [
            { key: 'llm_provider', value: provider },
            { key: 'llm_api_key', value: apiKey },
            { key: 'llm_model', value: model },
            { key: 'excluded_branches', value: excludedBranches.join(',') },
        ];

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: settingsToUpdate })
            });

            if (response.ok) {
                setStatus({ type: 'success', message: 'Settings saved successfully' });
            } else {
                setStatus({ type: 'error', message: 'Failed to save settings' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setStatus({ type: 'error', message: 'An error occurred while saving' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = branchInput.trim();
            if (val && !excludedBranches.includes(val)) {
                setExcludedBranches([...excludedBranches, val]);
                setBranchInput('');
            }
        } else if (e.key === 'Backspace' && !branchInput && excludedBranches.length > 0) {
            e.preventDefault();
            setExcludedBranches(excludedBranches.slice(0, -1));
        }
    };

    const removeBranch = (branchToRemove: string) => {
        setExcludedBranches(excludedBranches.filter(b => b !== branchToRemove));
    };

    if (loading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="px-10 py-10 max-w-4xl mx-auto relative">
            {/* Notification Toast */}
            {status.type && (
                <div className={`fixed top-10 right-10 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-md border animate-slide-in-right ${status.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    }`}>
                    {status.type === 'success' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    )}
                    <span className="font-bold">{status.message}</span>
                </div>
            )}

            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Settings</h1>
            <p className="text-zinc-500 mb-10">Configure your AI review preferences.</p>

            <form onSubmit={handleSave} className="space-y-8">
                {/* AI Configuration Section */}
                <div className="glass p-8 rounded-[32px] border-white/5 bg-white/5">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Configuration</h2>
                            <p className="text-sm text-zinc-500">Manage your LLM provider and model settings.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">LLM Provider</label>
                                <div className="relative">
                                    <select
                                        value={provider}
                                        onChange={(e) => setProvider(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                                    >
                                        <option value="openai">OpenAI</option>
                                        <option value="gemini">Google Gemini</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Model</label>
                                <div className="relative">
                                    <select
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                                    >
                                        {provider === 'openai' && (
                                            <>
                                                <option value="gpt-4o">GPT-4o</option>
                                                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                            </>
                                        )}
                                        {provider === 'gemini' && (
                                            <>
                                                <option value="gemini-pro-latest">Gemini Pro (Latest)</option>
                                                <option value="gemini-flash-latest">Gemini Flash (Latest)</option>
                                            </>
                                        )}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">API Token</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="sk-..."
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500/50 transition-colors font-mono"
                            />
                            <p className="mt-2 text-xs text-zinc-600">Your API key is stored securely and encrypted on our servers.</p>
                        </div>
                    </div>
                </div>

                {/* Review Settings Section */}
                <div className="glass p-8 rounded-[32px] border-white/5 bg-white/5">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Review Scope</h2>
                            <p className="text-sm text-zinc-500">Manage which branches are excluded from automated reviews.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Excluded Branches</label>
                            <div className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus-within:border-indigo-500/50 transition-colors flex flex-wrap gap-2 items-center">
                                {excludedBranches.map(branch => (
                                    <span key={branch} className="bg-white/10 text-zinc-300 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                                        {branch}
                                        <button type="button" onClick={() => removeBranch(branch)} className="hover:text-white">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </span>
                                ))}
                                <input
                                    type="text"
                                    value={branchInput}
                                    onChange={(e) => setBranchInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={excludedBranches.length === 0 ? "main, master, release/*" : ""}
                                    className="bg-transparent border-none outline-none flex-1 min-w-[120px] placeholder:text-zinc-700"
                                />
                            </div>
                            <p className="mt-2 text-xs text-zinc-600">Comma-separated list of branches to exclude. Supports wildcards (e.g. feature/*).</p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="btn-premium px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form >
        </div >
    );
}
