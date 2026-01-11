"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Modal from "@/components/Modal";

interface Category {
    id: number;
    name: string;
    description: string;
    rules: any[];
}

export default function PoliciesPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New Category State
    const [newCategory, setNewCategory] = useState({
        name: "",
        description: ""
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const fetchCategories = async () => {
        try {
            const response = await fetch("/api/policy/categories");
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchCategories();
        }
    }, [user]);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/policy/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCategory)
            });
            if (response.ok) {
                setIsModalOpen(false);
                setNewCategory({ name: "", description: "" });
                fetchCategories();
            }
        } catch (error) {
            console.error("Failed to create category:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteCategory = async (e: React.MouseEvent, id: number) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this category and all its rules?")) return;

        try {
            const response = await fetch(`/api/policy/categories/${id}`, {
                method: "DELETE"
            });
            if (response.ok) {
                fetchCategories();
            }
        } catch (error) {
            console.error("Failed to delete category:", error);
        }
    };

    return (
        <div className="px-10 py-10">
            <div className="flex items-center justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Policy Management</h1>
                    <p className="text-zinc-500">Define and manage code review rules across different categories.</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-premium px-6 py-2.5 text-sm flex items-center gap-2"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                        New Category
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                </div>
            ) : categories.length === 0 ? (
                <div className="glass p-12 rounded-[40px] text-center border-white/5 bg-white/5">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-4xl mb-6 mx-auto border border-indigo-500/20">
                        🛡️
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No categories yet</h3>
                    <p className="text-zinc-500 mb-8 max-w-md mx-auto">Start by creating your first policy category to organize your review rules.</p>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="btn-outline px-8 py-3 rounded-2xl"
                    >
                        Create Your First Category
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/dashboard/policies/${cat.id}`}
                            className="glass p-8 rounded-[32px] border-white/5 bg-white/5 hover:bg-white/[0.08] transition-all duration-300 group relative overflow-hidden flex flex-col h-full"
                        >
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-2xl font-bold text-white group-hover:text-indigo-400 transition-colors uppercase italic">{cat.name}</h3>
                                    <button
                                        onClick={(e) => handleDeleteCategory(e, cat.id)}
                                        className="p-2 rounded-lg bg-white/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>
                                    </button>
                                </div>
                                <p className="text-zinc-400 text-sm mb-6 line-clamp-2">{cat.description || "No description provided."}</p>
                            </div>

                            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Rules</span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-black border border-indigo-500/20">
                                        {cat.rules?.length || 0}
                                    </span>
                                </div>
                                <div className="text-indigo-400 group-hover:translate-x-1 transition-transform">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity -z-10">
                                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Create Policy Category"
                maxWidth="max-w-xl"
            >
                <form onSubmit={handleCreateCategory} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Category Name</label>
                        <input
                            type="text"
                            required
                            value={newCategory.name}
                            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                            placeholder="e.g., Security, Performance, Style..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                        <textarea
                            value={newCategory.description}
                            onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                            placeholder="Optional description of this policy group..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-colors h-32"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-sm font-bold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn-premium px-8 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Category"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
