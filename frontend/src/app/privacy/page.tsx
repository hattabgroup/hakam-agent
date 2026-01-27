
import Footer from "@/components/Footer";

export default function PrivacyPage() {
    return (
        <main className="relative pt-20 overflow-hidden min-h-screen bg-[#0a0a0c]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/05 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/05 blur-[120px] rounded-full" />
            </div>

            <section className="relative container mx-auto px-6 py-20 max-w-4xl z-10">
                <div className="mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Privacy Policy</h1>
                    <p className="text-zinc-400">Last Updated: January 27, 2026</p>
                </div>

                <div className="space-y-16 text-zinc-300 leading-relaxed">
                    {/* Introduction */}
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm">
                        <p className="mb-4">
                            At <strong>Hakam</strong> (a Hattab Group company), we take your privacy and security seriously.
                            We understand that as an engineering tool, you are trusting us with your most valuable asset: your intellectual property.
                        </p>
                        <p>
                            This Privacy Policy explains how we collect, use, and protect your information.
                        </p>
                    </div>

                    {/* VITAL SECTION: CODE SECURITY */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative p-8 rounded-3xl border border-indigo-500/30 bg-indigo-500/5 shadow-2xl shadow-indigo-500/10">
                            <div className="flex items-center gap-3 mb-6 text-indigo-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                <h2 className="text-xl font-bold uppercase tracking-widest">Code Security & Zero Storage</h2>
                            </div>
                            <div className="space-y-4 text-indigo-100/90">
                                <p className="font-bold text-white">We do not store your source code.</p>
                                <p>
                                    When Hakam analyzes your Pull Requests or repositories, the code is processed in real-time within our secure, ephemeral execution environments.
                                    Once the analysis (linting, reasoning, policy checking) is complete and the results are delivered, the code execution context is <strong>immediately destroyed</strong>.
                                </p>
                                <p>
                                    We do <strong>not</strong> use your code to train our models. Your intellectual property remains strictly yours.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Information We Collect */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-3 marker:text-indigo-500">
                            <li><strong>Account Information:</strong> Name, email address, and authentication tokens (e.g., from GitHub/GitLab) needed to provide the service.</li>
                            <li><strong>Usage Data:</strong> Metrics on how you use the platform (e.g., number of PRs scanned, policies enabled) to help us improve performance.</li>
                            <li><strong>Payment Information:</strong> Processed securely by Stripe. We do not store full credit card numbers on our servers.</li>
                        </ul>
                    </div>

                    {/* How We Use Information */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">How We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-3 marker:text-indigo-500">
                            <li>To provide and maintain the Hakam service.</li>
                            <li>To notify you about changes to our service.</li>
                            <li>To provide customer support.</li>
                            <li>To monitor the usage of our service to detect, prevent and address technical issues.</li>
                        </ul>
                    </div>

                    {/* Third Party */}
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-6">Third-Party Services</h2>
                        <p className="mb-4">
                            We may employ third-party companies and individuals to facilitate our Service (&quot;Service Providers&quot;), including:
                        </p>
                        <ul className="list-disc pl-6 space-y-3 marker:text-indigo-500">
                            <li><strong>Stripe:</strong> For payment processing.</li>
                            <li><strong>LLM Providers (e.g., OpenAI, Anthropic):</strong> For reasoning capabilities. We have strict <strong>Zero Data Retention</strong> agreements with these providers for enterprise workloads.</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="border-t border-white/10 pt-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at: <br />
                            <a href="mailto:info@hattabgroup.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">info@hattabgroup.com</a>
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
