
import Footer from "@/components/Footer";

export default function TermsPage() {
    return (
        <main className="relative pt-20 overflow-hidden min-h-screen bg-[#0a0a0c]">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/05 blur-[120px] rounded-full" />
            </div>

            <section className="relative container mx-auto px-6 py-20 max-w-4xl z-10">
                <div className="mb-16 text-center">
                    <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">Terms of Service</h1>
                    <p className="text-zinc-400">Last Updated: January 27, 2026</p>
                </div>

                <div className="space-y-12 text-zinc-300 leading-relaxed">

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing or use our Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                        <p>
                            Hakam is an AI-powered code review and engineering policy enforcement tool. We provide automated analysis, reasoning, and feedback on software repositories.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Accounts</h2>
                        <p>
                            When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Intellectual Property</h2>
                        <p className="mb-4">
                            The Service and its original content (excluding Content provided by users), features and functionality are and will remain the exclusive property of Hattab Group and its licensors.
                        </p>
                        <p>
                            <strong>Your Code:</strong> You retain full ownership of all source code and intellectual property you submit to the Service for analysis. As stated in our Privacy Policy, we do not claim ownership of, store, or resell your code.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Termination</h2>
                        <p>
                            We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">6. Limitation of Liability</h2>
                        <p>
                            In no event shall Hattab Group, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white mb-4">7. Changes</h2>
                        <p>
                            We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days notice prior to any new terms taking effect.
                        </p>
                    </div>

                    <div className="border-t border-white/10 pt-12">
                        <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <br />
                            <a href="mailto:info@hattabgroup.com" className="text-indigo-400 hover:text-indigo-300 transition-colors">info@hattabgroup.com</a>
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
