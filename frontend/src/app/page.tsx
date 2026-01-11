import Link from "next/link";

export default function Home() {
    return (
        <main className="relative pt-20 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-indigo-500/10 blur-[120px] -z-10 pointer-events-none" />
            <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] -z-10 pointer-events-none" />

            {/* HERO SECTION */}
            <section className="container mx-auto px-6 pt-20 pb-32 text-center lg:text-left flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2 flex flex-col items-center lg:items-start">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-8 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        New: Hakam AI 2.0 is live
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black tracking-tighter leading-[1.1] mb-8">
                        Review code with <br />
                        <span className="text-gradient">Intelligence.</span>
                    </h1>
                    <p className="text-lg sm:text-xl text-[var(--fg-muted)] mb-12 max-w-2xl leading-relaxed">
                        Hakam automates your code review process, catching security vulnerabilities, logic flaws, and style inconsistencies before they hit production.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link href="/signup" className="btn-premium w-64 lg:w-fit">Start Now - It's Free</Link>
                        <Link href="#features" className="btn-outline w-64 lg:w-fit">Explore Features</Link>
                    </div>
                    <div className="mt-12 flex items-center gap-8">
                        <img src="https://www.svgrepo.com/show/512317/github-142.svg" alt="GitHub" className="h-6 invert" />
                        <img src="https://www.svgrepo.com/show/448226/gitlab.svg" alt="GitLab" className="h-6" />
                        <img src="https://www.svgrepo.com/show/349308/bitbucket.svg" alt="Bitbucket" className="h-6" />
                    </div>
                </div>
                <div className="lg:w-1/2 relative group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-[50px] -z-10 group-hover:scale-110 transition-transform duration-1000" />
                    <div className="glass rounded-[32px] p-2 bg-white/5 border-white/10 shadow-2xl overflow-hidden ring-1 ring-white/20">
                        <div className="bg-[#0f0f12] rounded-[24px] overflow-hidden">
                            {/* Aesthetic code snippet view */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                <span className="text-[10px] text-zinc-500 font-mono ml-2">analysis_report.py</span>
                            </div>
                            <div className="p-8 font-mono text-sm leading-7">
                                <div className="flex gap-4"><span className="text-zinc-600">01</span><span className="text-purple-400">import</span><span> hakam_ai</span></div>
                                <div className="flex gap-4"><span className="text-zinc-600">02</span><span className="text-zinc-500"># Start scaning repository...</span></div>
                                <div className="flex gap-4"><span className="text-zinc-600">03</span><span className="text-indigo-400">report</span><span> = hakam_ai.analyze(repo_url=</span><span className="text-emerald-400">"github.com/hakam/core"</span><span>)</span></div>
                                <div className="flex gap-4"><span className="text-zinc-600">04</span><span className="text-purple-400">if</span><span> report.has_violations:</span></div>
                                <div className="flex gap-4 bg-red-500/10 border-l-2 border-red-500 -mx-8 px-8"><span className="text-zinc-600">05</span><span>&nbsp;&nbsp;&nbsp;</span><span className="text-red-400">print</span><span>(</span><span className="text-red-400">{'f"Found {report.count} security risks"'}</span><span>)</span></div>
                                <div className="flex gap-4"><span className="text-zinc-600">06</span><span>&nbsp;&nbsp;&nbsp;hakam_ai.block_merge()</span></div>
                                <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs">
                                    <span className="text-indigo-400 font-bold block mb-1">Hakam Suggestion:</span>
                                    Detected suspicious SQL injection pattern in line 42. Consider using prepared statements.
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
                            { title: "Custom Policies", desc: "Enforce your team's specific coding standards with easy-to-define policy categories.", icon: "📜" },
                            { title: "VCS Integration", desc: "Native support for GitHub, GitLab, and Bitbucket. Setup takes less than 60 seconds.", icon: "🔌" },
                            { title: "Security Scans", desc: "Automatically identify leaked secrets, SQL injection, and vulnerable dependencies.", icon: "🛡️" },
                            { title: "Inline Comments", desc: "Receive feedback directly on your Pull Requests where developers are already working.", icon: "💬" },
                            { title: "Team Insights", desc: "Track code quality trends and policy adoption across your entire organization.", icon: "📊" },
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

            {/* PRICING SECTION */}
            <section id="pricing" className="py-32 container mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl sm:text-5xl font-bold mb-6 tracking-tight">Simple Pricing for <span className="text-gradient">Every Team.</span></h2>
                    <p className="text-[var(--fg-muted)] max-w-2xl mx-auto text-lg">Start for free and scale as your team grows.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {[
                        { name: "Starter", price: "0", features: ["1 Active Repo", "Standard Analysis", "Community Support"], active: false },
                        { name: "Pro", price: "29", features: ["10 Active Repos", "Deep AI Insights", "Priority Support", "Custom Policies"], active: true },
                        { name: "Enterprise", price: "99", features: ["Unlimited Repos", "Self-Hosted Options", "SSO & Audit Logs", "Dedicated account manager"], active: false },
                    ].map((plan, i) => (
                        <div key={i} className={`p-10 rounded-[32px] border ${plan.active ? 'border-indigo-500 bg-indigo-500/5 ring-4 ring-indigo-500/10' : 'border-[var(--border)] bg-transparent'} flex flex-col items-center text-center hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden`}>
                            {plan.active && <div className="absolute top-0 right-0 bg-indigo-500 text-white px-6 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Most Popular</div>}
                            <h3 className="text-xl font-bold mb-2 uppercase tracking-widest text-zinc-400">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-8 pt-4">
                                <span className="text-4xl font-black italic">$</span>
                                <span className="text-7xl font-black tracking-tighter italic">{plan.price}</span>
                                <span className="text-[var(--fg-muted)] text-sm">/mo</span>
                            </div>
                            <ul className="flex flex-col gap-6 mb-12 w-full text-sm">
                                {plan.features.map((f, j) => (
                                    <li key={j} className="flex items-center gap-3 text-zinc-300">
                                        <svg className={`w-5 h-5 ${plan.active ? 'text-indigo-400' : 'text-zinc-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Link href="/signup" className={`w-full py-4 rounded-full font-bold transition-all ${plan.active ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30' : 'border border-zinc-700 hover:bg-white/5'}`}>
                                Get Started
                            </Link>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA SECTION */}
            <section className="container mx-auto px-6 py-32">
                <div className="relative rounded-[48px] overflow-hidden p-16 text-center shadow-3xl">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-600 -z-10" />
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] -z-10" />
                    <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-8">Ready to revolutionize <br />your code reviews?</h2>
                    <p className="text-indigo-100/80 text-lg mb-12 max-w-xl mx-auto">Join hundreds of engineers who ship better code, faster. Get started with Hakam today.</p>
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <Link href="/signup" className="px-10 py-5 bg-white text-indigo-600 rounded-full font-black text-lg hover:scale-105 transition-transform shadow-2xl">Start Now - Free</Link>
                        <Link href="#docs" className="px-10 py-5 bg-indigo-900/30 text-white rounded-full font-bold text-lg hover:bg-indigo-900/50 transition-colors border border-white/20">Read Documentation</Link>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-20 border-t border-[var(--border)] text-center text-sm text-[var(--fg-muted)]">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white">H</div>
                            <span className="text-lg font-bold tracking-tight text-white uppercase italic">Hakam</span>
                        </div>
                        <p className="max-w-xs leading-relaxed">Intelligence-driven code analysis for modern engineering teams.</p>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Product</h4>
                        <ul className="flex flex-col gap-4">
                            <li><Link href="#features" className="hover:text-indigo-400">Features</Link></li>
                            <li><Link href="#pricing" className="hover:text-indigo-400">Pricing</Link></li>
                            <li><Link href="#docs" className="hover:text-indigo-400">Documentation</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-6">Company</h4>
                        <ul className="flex flex-col gap-4">
                            <li><Link href="#" className="hover:text-indigo-400">About</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400">Privacy</Link></li>
                            <li><Link href="#" className="hover:text-indigo-400">Terms</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="border-t border-[var(--border)] pt-12">
                    <p>© 2026 Hakam Intelligence. Built for high-performance teams.</p>
                </div>
            </footer>
        </main>
    );
}
