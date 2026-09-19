import Link from "next/link";

export default function Footer() {
    return (
        <footer className="py-20 border-t border-[var(--border)] text-center text-sm text-[var(--fg-muted)] bg-[var(--bg-card)]">
            <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-left mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white">H</div>
                        <span className="text-lg font-bold tracking-tight text-white uppercase italic">Hakam</span>
                    </div>
                    <p className="max-w-xs leading-relaxed">Intelligence-driven code analysis and policy enforcement for modern engineering teams. Open-source under Apache 2.0.</p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6">Product</h4>
                    <ul className="flex flex-col gap-4">
                        <li><Link href="/#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                        {process.env.NEXT_PUBLIC_BILLING_ENABLED === 'true' ? (
                            <li><Link href="/#pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
                        ) : (
                            <li><Link href="/#community" className="hover:text-indigo-400 transition-colors">Community Edition</Link></li>
                        )}
                        <li><a href="https://github.com/hattabgroup/hakam-agent" target="_blank" rel="noreferrer" className="hover:text-indigo-400 transition-colors">GitHub Repository</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6">Project</h4>
                    <ul className="flex flex-col gap-4">
                        <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About</Link></li>
                        <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy</Link></li>
                        <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-[var(--border)] pt-12 flex flex-col md:flex-row items-center justify-between gap-4">
                <p>© 2026 Hakam Contributors & Hattab Group. Licensed under Apache 2.0.</p>
                <div className="flex items-center gap-4 text-xs opacity-75">
                    <a href="https://github.com/hattabgroup/hakam-agent" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
                    <span>•</span>
                    <a href="https://github.com/hattabgroup" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Hattab Group</a>
                </div>
            </div>
        </footer>
    );
}
