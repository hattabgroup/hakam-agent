"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import PricingTable from '@/components/PricingTable';
import Link from 'next/link';

interface Subscription {
    plan_name: string;
    status: string; // active, trialing, past_due, canceled
    trial_days_left: number | null;
    current_period_end: string | null;
    allowed_repos: number;
    used_repos: number;
    extra_repos_quantity: number;
    next_bill_date: string | null;
}

export default function BillingPage() {
    const { user, loading: authLoading } = useAuth();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && user) {
            fetchSubscription();
        }
    }, [user, authLoading]);

    const fetchSubscription = async () => {
        try {
            const res = await axios.get('/api/billing/subscription');
            setSubscription(res.data);
        } catch (error) {
            console.error("Failed to fetch subscription", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubscribe = async (priceId: string, extraRepos: number) => {
        setProcessing(true);
        try {
            // Check if upgrading active subscription or creating new one
            const isUpgrade = subscription && ['active', 'trialing'].includes(subscription.status);

            if (isUpgrade) {
                const res = await axios.post('/api/billing/upgrade', {
                    price_id: priceId,
                    extra_repos: extraRepos
                });

                if (res.data.url) {
                    window.location.href = res.data.url;
                } else {
                    // Success without immediate payment action needed (rare for upgrade unless free or credit)
                    fetchSubscription();
                    alert("Plan updated successfully!");
                    setProcessing(false);
                }
            } else {
                const res = await axios.post('/api/billing/checkout', {
                    price_id: priceId,
                    extra_repos: extraRepos
                });
                window.location.href = res.data.url;
            }

        } catch (error: any) {
            console.error("Subscription action failed", error);
            const msg = error.response?.data?.detail || "Failed to process request. Please try again.";
            alert(msg);
            setProcessing(false);
        }
    };

    const handleManageBilling = async () => {
        setProcessing(true);
        try {
            const res = await axios.post('/api/billing/portal');
            window.location.href = res.data.url;
        } catch (error) {
            console.error("Portal failed", error);
            alert("Failed to open billing portal.");
            setProcessing(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
            </div>
        );
    }

    const isActive = subscription && ['active', 'trialing'].includes(subscription.status);

    return (
        <div className="px-10 py-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Billing & Plans</h1>
                    <p className="text-[var(--fg-muted)]">Manage your subscription, billing details, and repository limits.</p>
                </div>
            </div>

            {isActive ? (
                <div className="space-y-8">
                    {/* Subscription Status Card */}
                    <div className="glass rounded-[32px] p-8 border border-white/10 relative overflow-hidden">


                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-8">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h2 className="text-2xl font-bold text-white">{subscription.plan_name} Plan</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${subscription.status === 'trialing' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                                            }`}>
                                            {subscription.status}
                                        </span>
                                    </div>
                                    {subscription.status === 'trialing' && (
                                        <p className="text-zinc-400">
                                            Trial ends in {subscription.trial_days_left} days
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={handleManageBilling}
                                    disabled={processing}
                                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold transition-all flex items-center gap-2"
                                >
                                    {processing ? 'Loading...' : 'Manage Billing'}
                                </button>
                            </div>

                            {/* Usage Stats */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Repositories Used</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black text-white">{subscription.used_repos}</span>
                                        <span className="text-zinc-500 mb-1">/ {subscription.allowed_repos}</span>
                                    </div>
                                    <div className="mt-4 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-500 transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (subscription.used_repos / subscription.allowed_repos) * 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-2xl bg-black/20 border border-white/5">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Extra Repos Add-on</p>
                                    <div className="flex items-end gap-2">
                                        <span className="text-3xl font-black text-white">{subscription.extra_repos_quantity}</span>
                                        <span className="text-zinc-500 mb-1">active</span>
                                    </div>
                                    <p className="text-xs text-zinc-600 mt-2">Manage via portal</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {/* Always Show Pricing Table for Upgrades or New Subs */}
            <div className="space-y-8 mt-12">
                <div className="glass p-8 rounded-[32px] border border-white/10 text-center py-16">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {isActive ? 'Change your plan' : 'Choose your plan'}
                    </h2>
                    <p className="text-zinc-400 max-w-xl mx-auto mb-12">
                        {isActive
                            ? 'Upgrade or downgrade your plan. Changes take effect immediately.'
                            : 'Select the plan that fits your team size. All plans include access to our automated review engine.'}
                    </p>
                    <PricingTable
                        onSelect={handleSubscribe}
                        currentPlanName={subscription?.plan_name}
                    />
                </div>
            </div>

            {processing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                        <p className="text-white font-bold">Processing...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
