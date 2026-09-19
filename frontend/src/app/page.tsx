import Link from "next/link";
import Footer from "@/components/Footer";

const isBillingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true';

export default function Home() {
    return (
        <main className="relative pt-20 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-500/10 blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] -z-10 pointer-events-none" />

            {/* HERO SECTION */}
            <section className="container mx-auto px-6 pt-20 pb-32 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 animate-pulse shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                        Next-Gen AI Agent
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.1] mb-8">
                        The First <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">AI Agent</span> <br />
                        That Fixes Your Code.
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--fg-muted)] mb-12 max-w-2xl leading-relaxed">
                        Hakam isn't just a bot—it's an autonomous <strong>AI Agent</strong> that proactively reviews pull requests, enforces your custom policies, and teaches your team best practices.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link href="/signup" className="btn-premium w-64 lg:w-fit">
                            {isBillingEnabled ? 'Start Free Trial' : 'Get Started Free'}
                        </Link>
                        <Link href="#features" className="btn-outline w-64 lg:w-fit">See How It Works</Link>
                    </div>
                    <div className="mt-12 flex items-center gap-8 opacity-70">
                        <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="h-6 invert" />
                        <img src="https://www.svgrepo.com/show/448226/gitlab.svg" alt="GitLab" className="h-6" />
                        <img src="https://www.svgrepo.com/show/349308/bitbucket.svg" alt="Bitbucket" className="h-6" />
                    </div>
                </div>
                <div className="lg:w-1/2 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-[50px] -z-10 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="glass rounded-[32px] p-2 bg-white/5 border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/20">
                        <div className="bg-[#0f0f12] rounded-[24px] overflow-hidden">
                            {/* Smart Code Snippet View */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                <span className="text-[10px] text-zinc-500 font-mono ml-2">CheckoutController.ts</span>
                            </div>
                            <div className="p-6 font-mono text-sm leading-7 relative">
                                <div className="flex gap-4"><span className="text-zinc-600 select-none">12</span><span className="text-purple-400">class</span><span className="text-yellow-200"> CheckoutController</span><span> {'{'}</span></div>
                                <div className="flex gap-4"><span className="text-zinc-600 select-none">13</span><span>&nbsp;&nbsp;<span className="text-purple-400">async</span> process(req) {'{'}</span></div>
                                {/* Violation Line */}
                                <div className="flex gap-4 bg-red-500/10 border-l-2 border-red-500 -mx-6 px-6 relative">
                                    <span className="text-zinc-600 select-none">14</span>
                                    <span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-indigo-300">const</span> user = <span className="text-blue-400">await</span> db.query(<span className="text-emerald-400">"SELECT * FROM users..."</span>);</span>
                                    {/* Pulse Indicator */}
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                </div>
                                <div className="flex gap-4"><span className="text-zinc-600 select-none">15</span><span>&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-zinc-500">// ... business logic</span></span></div>
                                <div className="flex gap-4"><span className="text-zinc-600 select-none">16</span><span>&nbsp;&nbsp;{'}'}</span></div>
                                <div className="flex gap-4"><span className="text-zinc-600 select-none">17</span><span>{'}'}</span></div>

                                {/* Hakam Smart Review Card */}
                                <div className="mt-6 rounded-xl bg-[#1a1b26] border border-indigo-500/30 overflow-hidden shadow-2xl relative z-10 transition-transform hover:scale-[1.02] duration-300">
                                    <div className="bg-indigo-500/10 px-4 py-2 border-b border-indigo-500/10 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">H</div>
                                            <span className="text-xs font-bold text-indigo-300">Hakam AI Review</span>
                                        </div>
                                        <span className="text-[10px] text-zinc-500">Just now</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="mt-0.5 text-red-400">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-white text-xs font-bold mb-1">Policy Violation: Clean Architecture</p>
                                                <p className="text-zinc-400 text-xs leading-relaxed">Direct database queries are forbidden in Controllers. Please move this logic to the Service layer.</p>
                                            </div>
                                        </div>

                                        {/* Learning Suggestion */}
                                        <div className="bg-indigo-500/5 rounded-lg p-3 border border-indigo-500/10">
                                            <p className="text-[10px] uppercase font-bold text-indigo-400 mb-2 flex items-center gap-1">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                                Recommended Learning
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-12 bg-zinc-800 rounded flex items-center justify-center text-[10px] text-zinc-500">Video</div>
                                                <div>
                                                    <p className="text-xs text-white font-medium hover:text-indigo-400 cursor-pointer transition-colors">Separation of Concerns Pattern</p>
                                                    <p className="text-[10px] text-zinc-500">Module 3 • 12 min watch</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURES SECTION */}
            <section id="features" className="py-32 bg-[var(--bg-card)] border-y border-[var(--border)] relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-24">
                        <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Scale Quality, <span className="text-gradient">Not Overhead.</span></h2>
                        <p className="text-[var(--fg-muted)] max-w-2xl mx-auto text-lg leading-relaxed">
                            Hakam integrates seamlessly with your workflow to provide continuous feedback and enforce standards across every commit.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { title: "Automated Analysis", desc: "Instantly detect logic errors, memory leaks, and performance bottlenecks using context-aware AI.", icon: "🤖" },
                            { title: "Custom Policies", desc: "Enforce your specific coding standards with custom automated AI review rules.", icon: "📜" },
                            { title: "VCS Integration", desc: "Native support for GitHub, GitLab, and Bitbucket. Setup takes less than 60 seconds.", icon: "🔌" },
                            { title: "Security Scans", desc: "Automatically identify leaked secrets, SQL injection, and vulnerable dependencies.", icon: "🛡️" },
                            { title: "Team Improvements", desc: "Unlock collaborative insights and velocity metrics designed to make your team faster.", icon: "🚀" },
                            { title: "Deep Insights", desc: "Track code quality trends and policy adoption across your entire organization.", icon: "📊" },
                        ].map((f, i) => (
                            <div key={i} className="p-8 rounded-[24px] bg-white/5 border border-white/10 hover:border-indigo-500/50 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-3xl mb-8 group-hover:bg-indigo-500 group-hover:scale-110 transition-all duration-500">{f.icon}</div>
                                <h3 className="text-xl font-bold mb-4">{f.title}</h3>
                                <p className="text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING OR COMMUNITY EDITION SECTION */}
            {isBillingEnabled ? (
                <section id="pricing" className="py-32 container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Simple Pricing for <span className="text-gradient">Every Team.</span></h2>
                        <p className="text-[var(--fg-muted)] max-w-2xl mx-auto text-lg">All plans include a 7-day free trial. Cancel anytime.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                name: "Starter",
                                price: "29",
                                repos: "3 Repositories",
                                features: ["Basic Reports", "Community Support", "Standard Policies"],
                                active: false
                            },
                            {
                                name: "Team",
                                price: "79",
                                repos: "10 Repositories",
                                features: ["Advanced Reports", "Custom Policies 5x", "Team Improvements", "Priority Support"],
                                active: true
                            },
                            {
                                name: "Business",
                                price: "149",
                                repos: "30 Repositories",
                                features: ["Advanced Reports", "Unlimited Custom Policies", "Team Improvements", "Dedicated Support"],
                                active: false
                            },
                        ].map((plan, i) => (
                            <div key={i} className={`p-10 rounded-[32px] border ${plan.active ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10 scale-105 z-10' : 'border-[var(--border)] bg-transparent'} flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden`}>
                                {plan.active && <div className="absolute top-0 right-0 bg-indigo-500 text-white px-6 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Most Popular</div>}

                                <h3 className="text-xl font-bold mb-2 uppercase tracking-widest text-zinc-400">{plan.name}</h3>
                                <div className="flex items-baseline gap-1 mb-2 pt-4">
                                    <span className="text-4xl font-black italic">$</span>
                                    <span className="text-7xl font-black tracking-tighter italic">{plan.price}</span>
                                    <span className="text-[var(--fg-muted)] text-sm">/mo</span>
                                </div>
                                <div className="mb-8 flex flex-col items-center gap-2">
                                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wide border border-emerald-500/20">7-Day Free Trial</span>
                                </div>

                                <ul className="flex flex-col gap-6 mb-12 w-full text-sm">
                                    <li className="flex items-center gap-3 text-white font-bold text-base justify-center">
                                        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {plan.repos}
                                    </li>
                                    {plan.features.map((f, j) => (
                                        <li key={j} className="flex items-center gap-3 text-zinc-300">
                                            <svg className={`w-5 h-5 ${plan.active ? 'text-indigo-400' : 'text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Link href="/signup" className={`w-full py-4 rounded-full font-bold transition-all ${plan.active ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30' : 'border border-zinc-700 hover:bg-white/5'}`}>
                                    Start Free Trial
                                </Link>
                            </div>
                        ))}
                    </div>
                </section>
            ) : (
                <section id="community" className="py-32 container mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-bold uppercase tracking-widest mb-6">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            100% Free &amp; Open Source
                        </div>
                        <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Community <span className="text-gradient">Edition.</span></h2>
                        <p className="text-[var(--fg-muted)] max-w-2xl mx-auto text-lg leading-relaxed">
                            Full code review intelligence, custom policies, and unlimited repository quotas. Free forever under the Apache 2.0 license.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto glass rounded-[36px] p-10 sm:p-14 border border-white/10 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] -z-10 pointer-events-none" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                            {[
                                { title: "Unlimited Repositories", desc: "Connect as many GitHub or GitLab repositories as your team needs with zero seat limits.", icon: "📦" },
                                { title: "Custom Policies", desc: "Define architectural and code quality policies with autonomous AI enforcement.", icon: "🛡️" },
                                { title: "100% Data Sovereignty", desc: "Self-host on your own infrastructure with Docker. Your source code never leaves your VPC.", icon: "🔒" },
                                { title: "Apache 2.0 Licensed", desc: "Permissive open-source license for commercial and personal use with zero vendor lock-in.", icon: "📜" },
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                                        <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold block">Edition Quota</span>
                                <span className="text-lg font-black text-emerald-400">Unlimited / Free Forever</span>
                            </div>
                            <div className="flex gap-4">
                                <a href="https://github.com/hattabgroup/hakam-agent" target="_blank" rel="noreferrer" className="btn-outline px-6 py-3 text-sm">
                                    Star on GitHub
                                </a>
                                <Link href="/signup" className="btn-premium px-8 py-3 text-sm font-bold">
                                    Get Started Free
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* CTA SECTION */}
            <section id="ready" className="container mx-auto px-6 py-32">
                <div className="relative rounded-[48px] overflow-hidden p-16 text-center shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 -z-10" />
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] -z-10" />
                    <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-8">Ready to revolutionize <br />your code reviews?</h2>
                    <p className="text-indigo-100/80 text-lg mb-12 max-w-xl mx-auto">Join hundreds of engineers who ship better code, faster. Get started with Hakam today.</p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <Link href="/signup" className="px-10 py-5 bg-white text-indigo-600 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-2xl">Start Now - Free</Link>
                        <Link href="#docs" className="px-10 py-5 bg-indigo-900/30 text-white rounded-full font-bold text-lg hover:bg-indigo-900/50 transition-colors border border-white/20">Read Again</Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <Footer />
        </main>
    );
}
