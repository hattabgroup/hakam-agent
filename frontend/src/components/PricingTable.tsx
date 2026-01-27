"use client";
import React, { useState } from 'react';

type Plan = {
    id: string; // Deprecated, using monthlyPriceId/yearlyPriceId
    monthlyPriceId: string;
    yearlyPriceId: string;
    name: string;
    price: number;
    repos: number;
    features: string[];
    discountPercent?: number; // 20 for Team, 15 for Business
};

// These should match your Env vars or be passed in. 
// Ideally we fetch them from backend, but for MVP we might hardcode or rely on props.
// User must replace with their actual Price IDs
const PLANS: Plan[] = [
    {
        id: 'starter',
        monthlyPriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_placeholder',
        yearlyPriceId: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly_placeholder',
        name: 'Starter',
        price: 29,
        repos: 3,
        features: ['3 Repositories', 'Basic Reports', 'Community Support'],
        discountPercent: 10
    },
    {
        id: 'team',
        monthlyPriceId: process.env.STRIPE_PRICE_TEAM_MONTHLY || 'price_team_placeholder',
        yearlyPriceId: process.env.STRIPE_PRICE_TEAM_YEARLY || 'price_team_yearly_placeholder',
        name: 'Team',
        price: 79,
        repos: 10,
        features: ['10 Repositories', 'Advanced Reports', 'Custom Policies 5x', 'ُTeam Improvements', 'Priority Support'],
        discountPercent: 20
    },
    {
        id: 'business',
        monthlyPriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY || 'price_business_placeholder',
        yearlyPriceId: process.env.STRIPE_PRICE_BUSINESS_YEARLY || 'price_business_yearly_placeholder',
        name: 'Business',
        price: 149,
        repos: 30,
        features: ['30 Repositories', 'Advanced Reports', 'Unlimited Custom Policies', 'ُTeam Improvements', 'Dedicated Support'],
        discountPercent: 30
    }
];

export default function PricingTable({
    onSelect,
    currentPlanName
}: {
    onSelect: (priceId: string, extraRepos: number) => void;
    currentPlanName?: string;
}) {
    // Default select the middle plan or the next upgrade
    const [selectedPlanId, setSelectedPlanId] = useState<string>('team');
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
    const [extraRepos, setExtraRepos] = useState(0);
    const extraRepoPrice = 5;

    const handleSubscribe = () => {
        const plan = PLANS.find(p => p.id === selectedPlanId);
        if (!plan) return;

        const priceId = billingCycle === 'monthly' ? plan.monthlyPriceId : plan.yearlyPriceId;
        onSelect(priceId, extraRepos);
    };

    // Helper to check if plan is current
    const isCurrent = (planName: string) => currentPlanName === planName;

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8">

            {/* Billing Toggle */}
            <div className="flex justify-center mb-10">
                <div className="bg-black/30 p-1 rounded-xl border border-white/10 flex items-center relative">
                    <button
                        onClick={() => setBillingCycle('monthly')}
                        className={`w-56 px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 flex items-center justify-center ${billingCycle === 'monthly' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('yearly')}
                        className={`w-56 px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 flex items-center justify-center gap-2 ${billingCycle === 'yearly' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        Yearly
                        <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                            Save up to 30%
                        </span>
                    </button>

                    {/* Sliding Background */}
                    <div
                        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-lg transition-all duration-300 ${billingCycle === 'monthly' ? 'left-1' : 'left-[calc(50%+0px)]'
                            }`}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {PLANS.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    const isCurrentPlan = isCurrent(plan.name);

                    // Price Calculation
                    let displayPrice = plan.price;
                    let period = "/month";

                    if (billingCycle === 'yearly' && plan.discountPercent) {
                        // Calculate discounted monthly price equivalent
                        const discountMultiplier = (100 - plan.discountPercent) / 100;
                        displayPrice = Math.round(plan.price * discountMultiplier);
                    }

                    return (
                        <div
                            key={plan.id}
                            onClick={() => !isCurrentPlan && setSelectedPlanId(plan.id)}
                            className={`relative rounded-3xl p-6 cursor-pointer transition-all duration-300 border group ${isCurrentPlan
                                ? 'bg-emerald-500/10 border-emerald-500/50 opacity-80 cursor-default'
                                : isSelected
                                    ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.2)] scale-105 z-10'
                                    : 'bg-white/5 border-white/10 hover:border-indigo-500/50 hover:bg-white/[0.07]'
                                }`}
                        >
                            {isSelected && !isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Selected
                                </div>
                            )}
                            {isCurrentPlan && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg">
                                    Current Plan
                                </div>
                            )}

                            {billingCycle === 'yearly' && plan.discountPercent && (
                                <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                    SAVE {plan.discountPercent}%
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex flex-col mb-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-white">${displayPrice}</span>
                                    <span className="text-zinc-500 font-medium">/month</span>
                                </div>
                                {billingCycle === 'yearly' && (
                                    <span className="text-xs text-zinc-500 mt-1">
                                        Billed ${displayPrice * 12} yearly
                                    </span>
                                )}
                            </div>

                            {!isCurrentPlan && (
                                <div className="mb-6 flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                                        <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
                                        7-Day Free Trial
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                                        Cancel Anytime
                                    </span>
                                </div>
                            )}

                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-sm text-zinc-300">
                                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Include {plan.repos} Repos
                                </li>
                                {plan.features.map((feat, i) => (
                                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                                        <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {feat}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {/* Add-on Section */}
            <div className="glass rounded-3xl p-8 border border-white/10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                        <h4 className="text-lg font-bold text-white mb-2">Need more repositories?</h4>
                        <p className="text-zinc-400 text-sm">Add extra repositories to your plan for just ${extraRepoPrice} per repo/month.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-black/30 p-2 rounded-xl border border-white/5">
                        <button
                            onClick={() => setExtraRepos(Math.max(0, extraRepos - 1))}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            -
                        </button>
                        <div className="text-center w-12">
                            <span className="block text-xl font-bold text-white">{extraRepos}</span>
                            <span className="text-[10px] text-zinc-500">EXTRA</span>
                        </div>
                        <button
                            onClick={() => setExtraRepos(extraRepos + 1)}
                            className="w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                        >
                            +
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary & Action */}
            <div className={`glass rounded-3xl p-8 border relative overflow-hidden transition-colors ${billingCycle === 'yearly'
                ? 'border-emerald-500/30 bg-gradient-to-r from-emerald-900/20 to-teal-900/20'
                : 'border-indigo-500/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                }`}>
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    <div>
                        <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${billingCycle === 'yearly' ? 'text-emerald-400' : 'text-indigo-300'
                            }`}>
                            Total {billingCycle === 'yearly' ? 'Yearly' : 'Monthly'} Cost
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white">
                                ${(() => {
                                    const plan = PLANS.find(p => p.id === selectedPlanId);
                                    if (!plan) return 0;

                                    let basePrice = plan.price;
                                    if (billingCycle === 'yearly' && plan.discountPercent) {
                                        const discountMultiplier = (100 - plan.discountPercent) / 100;
                                        basePrice = Math.round(plan.price * discountMultiplier);
                                    }

                                    const totalMonthly = basePrice + (extraRepos * extraRepoPrice);
                                    return billingCycle === 'yearly' ? totalMonthly * 12 : totalMonthly;
                                })()}
                            </span>
                            <span className="text-zinc-400">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                        </div>
                    </div>
                    <button
                        onClick={handleSubscribe}
                        disabled={!!currentPlanName && PLANS.find(p => p.id === selectedPlanId)?.name === currentPlanName}
                        className={`px-8 py-4 rounded-xl text-white font-bold shadow-lg transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${billingCycle === 'yearly'
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-500/25'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'
                            }`}
                    >
                        {currentPlanName ? 'Update Plan' : 'Proceed to Checkout'}
                    </button>
                </div>
                <p className="text-center mt-4 text-xs text-zinc-500">
                    {currentPlanName
                        ? 'Changes will be applied immediately.'
                        : '7-day free trial included. Cancel anytime. Model usage billed separately.'}
                </p>
            </div>
        </div>
    );
}
