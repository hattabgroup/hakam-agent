"use client";

import React, { useEffect, useState, use } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Rule {
    id: number;
    name: string;
    severity: number;
    rule_text: string;
    enabled: boolean;
}

interface Category {
    id: number;
    name: string;
    description: string;
    rules: Rule[];
}

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading } = useAuth();
    const router = useRouter();
    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingRule, setIsAddingRule] = useState(false);

    const [editingRule, setEditingRule] = useState<Rule | null>(null);

    // Status State
    const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

    // Auto-dismiss notification
    useEffect(() => {
        if (status.type) {
            const timer = setTimeout(() => setStatus({ type: null, message: '' }), 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // New Rule State
    const [newRule, setNewRule] = useState({
        name: "",
        severity: "3", // Default to Medium (3)
        rule_text: "",
        enabled: true
    });

    // Helpers
    const getSeverityLabel = (level: number) => {
        switch (level) {
            case 5: return 'CRITICAL';
            case 4: return 'HIGH';
            case 3: return 'WARNING'; // or MEDIUM based on pref, using WARNING to match review page
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

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const fetchCategory = async () => {
        try {
            const response = await fetch(`/api/policy/categories`);
            if (response.ok) {
                const data: Category[] = await response.json();
                const currentCat = data.find(c => c.id.toString() === id);
                if (currentCat) {
                    setCategory(currentCat);
                } else {
                    router.push("/dashboard/policies");
                }
            }
        } catch (error) {
            console.error("Failed to fetch category:", error);
            setStatus({ type: 'error', message: "Failed to load category." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCategory();
        }
    }, [user, id]);

    const handleToggleRule = async (rule: Rule) => {
        try {
            const response = await fetch(`/api/policy/rules/${rule.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...rule, enabled: !rule.enabled })
            });
            if (response.ok) {
                fetchCategory();
                setStatus({ type: 'success', message: `Rule ${rule.enabled ? 'disabled' : 'enabled'} successfully.` });
            }
        } catch (error) {
            console.error("Failed to toggle rule:", error);
            setStatus({ type: 'error', message: "Failed to update rule status." });
        }
    };

    const handleDeleteRule = async (ruleId: number) => {
        if (!confirm("Are you sure you want to delete this rule?")) return;
        try {
            const response = await fetch(`/api/policy/rules/${ruleId}`, {
                method: "DELETE"
            });
            if (response.ok) {
                fetchCategory();
                setStatus({ type: 'success', message: "Rule deleted successfully." });
            }
        } catch (error) {
            console.error("Failed to delete rule:", error);
            setStatus({ type: 'error', message: "Failed to delete rule." });
        }
    };

    const handleEditClick = (rule: Rule) => {
        setEditingRule(rule);
        setNewRule({
            name: rule.name,
            severity: rule.severity.toString(),
            rule_text: rule.rule_text,
            enabled: rule.enabled
        });
        setIsAddingRule(true);
        setStatus({ type: null, message: '' });
    }

    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let url = `/api/policy/categories/${id}/rules`;
            let method = "POST";
            let body: any = {
                ...newRule,
                severity: parseInt(newRule.severity)
            };

            if (editingRule) {
                url = `/api/policy/rules/${editingRule.id}`;
                method = "PUT";
                // For update, we might need all fields or just changed ones.
                // Assuming backend accepts full object updates.
                // If endpoint expects only fields to update, this works if backend handles it.
                body = { ...body, id: editingRule.id };
            }

            const response = await fetch(url, {
                method: method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setIsAddingRule(false);
                setEditingRule(null);
                setNewRule({ name: "", severity: "3", rule_text: "", enabled: true });
                setStatus({ type: 'success', message: editingRule ? "Rule updated successfully." : "Rule created successfully." });
                fetchCategory();
            }
        } catch (error) {
            console.error("Failed to save rule:", error);
            setStatus({ type: 'error', message: "Failed to save rule." });
        }
    };

    if (isLoading) {
        return (
            <div className="px-10 py-10 flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    if (!category) return null;

    return (
        <div className="px-10 py-10 relative">
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
            <div className="mb-12">
                <Link href="/dashboard/policies" className="text-zinc-500 hover:text-white flex items-center gap-2 mb-6 transition-colors text-sm font-bold uppercase tracking-widest">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                    Back to Policies
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{category.name}</h1>
                        <p className="text-zinc-500">{category.description || "Manage rules for this category."}</p>
                    </div>
                    <button
                        onClick={() => setIsAddingRule(true)}
                        className="btn-premium px-6 py-2.5 text-sm flex items-center gap-2"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        Add Rule
                    </button>
                </div>
            </div>

            {isAddingRule && (
                <div className="glass p-8 rounded-[32px] border-indigo-500/30 bg-indigo-500/5 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-white mb-1">{editingRule ? "Edit Rule" : "Add New Rule"}</h2>
                        <p className="text-sm text-zinc-500">{editingRule ? "Update the rule details below." : "Define a new rule for this category."}</p>
                    </div>
                    <form onSubmit={handleSaveRule}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Rule Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newRule.name}
                                    onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                                    placeholder="e.g., No Hardcoded Secrets"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Severity</label>
                                <select
                                    value={newRule.severity}
                                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-colors appearance-none"
                                >
                                    <option value="5">Critical</option>
                                    <option value="4">High</option>
                                    <option value="3">Medium</option>
                                    <option value="2">Low</option>
                                    <option value="1">Info</option>
                                </select>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Rule Logic / Pattern (Text)</label>
                            <textarea
                                required
                                value={newRule.rule_text}
                                onChange={(e) => setNewRule({ ...newRule, rule_text: e.target.value })}
                                placeholder="Describe what the AI should look for..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors h-32"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAddingRule(false);
                                    setEditingRule(null);
                                    setNewRule({ name: "", severity: "3", rule_text: "", enabled: true });
                                }}
                                className="px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-premium px-8 py-2.5 rounded-xl text-sm font-bold"
                            >
                                {editingRule ? "Update Rule" : "Create Rule"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="glass rounded-[40px] border-white/5 overflow-hidden">
                <div className="p-0">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-xs uppercase tracking-widest text-zinc-500 bg-white/[0.01]">
                                <th className="px-8 py-4 font-bold">Rule Name</th>
                                <th className="px-8 py-4 font-bold">Severity</th>
                                <th className="px-8 py-4 font-bold">Status</th>
                                <th className="px-8 py-4 font-bold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {category.rules.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500 italic">
                                        No rules defined for this category.
                                    </td>
                                </tr>
                            ) : (
                                category.rules.map((rule) => (
                                    <tr key={rule.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-semibold text-zinc-200 group-hover:text-white transition-colors">{rule.name}</div>
                                            <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{rule.rule_text}</div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border ${getSeverityColor(rule.severity)}`}>
                                                {getSeverityLabel(rule.severity)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <button
                                                onClick={() => handleToggleRule(rule)}
                                                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors duration-200 focus:outline-none ${rule.enabled ? 'bg-indigo-600' : 'bg-zinc-700'}`}
                                            >
                                                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${rule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                            </button>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEditClick(rule)}
                                                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                                                </button>
                                            </div>
                                        </td>
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
