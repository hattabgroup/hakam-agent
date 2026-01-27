import Link from "next/link";
import Footer from "@/components/Footer";

export default function AboutPage() {
    return (
        <main className="relative pt-20 overflow-hidden min-h-screen bg-[#0a0a0c]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDuration: '7s' }} />
            </div>

            {/* HERO SECTION */}
            <section className="relative container mx-auto px-6 pt-20 pb-24 text-center z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-8 animate-fade-in-up">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    Meet Your New AI Engineer
                </div>

                <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 animate-fade-in-up delay-100">
                    Thinking. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Reasoning.</span> <br />
                    Coding.
                </h1>

                <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200">
                    Hakam isn&apos;t a linter. It&apos;s an autonomous agent that reads your tickets, understands your architecture, and enforces standards with human-like context.
                </p>
            </section>

            {/* PROBLEM: The Old Way vs The New Way */}
            <section className="container mx-auto px-6 py-12 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    {/* The Old Way */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-red-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-8 rounded-3xl border border-red-500/10 bg-red-950/5 grayscale group-hover:grayscale-0 transition-all duration-500">
                            <div className="flex items-center gap-3 mb-6 text-red-400/50 group-hover:text-red-400 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                <h3 className="text-sm font-bold uppercase tracking-widest">The Old Way (Static Analysis)</h3>
                            </div>
                            <div className="font-mono text-sm bg-black/40 p-4 rounded-xl border border-red-500/10 text-red-300/70">
                                <span>Error: Variable &apos;x&apos; is unused.</span> <br />
                                <span>Error: Line too long.</span> <br />
                                <span>Error: Missing semicolon.</span>
                            </div>
                            <p className="mt-6 text-zinc-500 text-sm leading-relaxed">
                                Dumb rules. No context. Blocks you for trivial formatting issues but misses the massive architectural flaw you just introduced.
                            </p>
                        </div>
                    </div>

                    {/* The New Way */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10">
                            <div className="flex items-center gap-3 mb-6 text-indigo-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <h3 className="text-sm font-bold uppercase tracking-widest">The Hakam Way (Agentic)</h3>
                            </div>
                            <div className="font-mono text-sm bg-[#1e1e2e] p-4 rounded-xl border border-indigo-500/20 text-indigo-200">
                                <div className="flex gap-2">
                                    <span className="text-purple-400">Thinking...</span>
                                </div>
                                <span className="text-zinc-400 mt-2 block pl-2 border-l-2 border-indigo-500/20">
                                    &quot;I see you&apos;re adding a payment route. According to <span className="text-white">stripe_policy.md</span>, you need to ensure idempotency here.&quot;
                                </span>
                            </div>
                            <p className="mt-6 text-indigo-200/70 text-sm leading-relaxed">
                                Hakam understands <strong>intent</strong>. It reads your documentation and policies to provide high-level architectural feedback, just like a senior engineer.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AGENT WORKFLOW */}
            <section className="container mx-auto px-6 py-20 relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-center mb-16">How It Works</h2>

                <div className="relative max-w-4xl mx-auto">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent" />

                    {/* Step 1: Ingest */}
                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16 group">
                        <div className="md:w-1/2 text-left md:text-right order-2 md:order-1">
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">1. Ingest Context</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Hakam doesn&apos;t just look at the diff. It reads your <span className="text-white bg-white/5 px-1 py-0.5 rounded">linear tickets</span>, <span className="text-white bg-white/5 px-1 py-0.5 rounded">internal docs</span>, and existing codebase to understand <em>why</em> you&apos;re making this change.
                            </p>
                        </div>
                        <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0a0a0c] border-2 border-indigo-500 z-10 group-hover:scale-125 group-hover:bg-indigo-500 transition-all duration-300 shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                        <div className="md:w-1/2 order-3 pl-16 md:pl-0">
                            {/* Visual for Step 1 */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                                <div className="flex gap-3 mb-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse delay-150" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-3/4 bg-white/10 rounded animate-pulse" />
                                    <div className="h-2 w-1/2 bg-white/10 rounded animate-pulse delay-100" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 2: Reason */}
                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 mb-16 group">
                        <div className="md:w-1/2 order-2 md:order-3">
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">2. Reason & Validate</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Using a chain-of-thought process, Hakam checks your code against agreed-upon patterns. It ignores style nits (leave that to Prettier) and focuses on logic, security, and maintainability.
                            </p>
                        </div>
                        <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0a0a0c] border-2 border-purple-500 z-10 group-hover:scale-125 group-hover:bg-purple-500 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
                        <div className="md:w-1/2 order-3 md:order-1 pl-16 md:pl-0 md:text-right">
                            {/* Visual for Step 2 */}
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm inline-block w-full text-left">
                                <div className="text-xs font-mono text-purple-300 mb-2">$ reasoning_engine --start</div>
                                <div className="text-[10px] space-y-1 text-zinc-500 font-mono">
                                    <p>&gt; Analyzing dependency graph...</p>
                                    <p>&gt; Checking against &apos;NoAuthInController&apos; policy...</p>
                                    <p className="text-red-400">&gt; Violation detected.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3: Act */}
                    <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-16 group">
                        <div className="md:w-1/2 text-left md:text-right order-2 md:order-1">
                            <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-pink-400 transition-colors">3. Act & Educate</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                Hakam comments on your PR with specific, actionable feedback. More importantly, it links to learning resources so your team actually gets better over time.
                            </p>
                        </div>
                        <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0a0a0c] border-2 border-pink-500 z-10 group-hover:scale-125 group-hover:bg-pink-500 transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.5)]"></div>
                        <div className="md:w-1/2 order-3 pl-16 md:pl-0">
                            {/* Visual for Step 3 */}
                            <div className="p-4 rounded-2xl bg-[#1a1b26] border border-pink-500/30">
                                <div className="flex gap-2 items-start">
                                    <div className="w-6 h-6 rounded bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">H</div>
                                    <div>
                                        <p className="text-xs text-white mb-1">Please move this logic to <code className="bg-black/30 px-1 rounded">PaymentService</code>.</p>
                                        <p className="text-[10px] text-pink-400 cursor-pointer hover:underline">View &quot;Service Pattern&quot; documentation →</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PHILOSOPHY & TEAM */}
            <section className="container mx-auto px-6 py-20 text-center relative z-10">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold mb-8">Built by Engineers, for Engineers.</h2>
                    <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
                        Hakam is a product of <strong className="text-white">Hattab Group</strong>. We adhere to a &quot;Build it or Kill it&quot; philosophy.
                        We got tired of reviewing the same basic errors in every PR, so we built an agent to do it for us.
                        Now, we&apos;re sharing it with you.
                    </p>

                    <div className="flex flex-wrap justify-center gap-4">
                        <Link href="/signup" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-8 font-bold text-black transition-transform hover:scale-105 hover:bg-zinc-100">
                            Get Started
                        </Link>
                        <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 px-8 font-bold text-white transition-colors hover:bg-white/5">
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
