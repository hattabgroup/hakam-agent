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
                    <p className="max-w-xs leading-relaxed">Intelligence-driven code analysis for modern engineering teams. A Hattab Group Company.</p>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6">Product</h4>
                    <ul className="flex flex-col gap-4">
                        <li><Link href="/#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                        <li><Link href="/#pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
                        <li><Link href="/#docs" className="hover:text-indigo-400 transition-colors">Documentation</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-bold mb-6">Company</h4>
                    <ul className="flex flex-col gap-4">
                        <li><Link href="/about" className="hover:text-indigo-400 transition-colors">About</Link></li>
                        <li><Link href="/privacy" className="hover:text-indigo-400 transition-colors">Privacy</Link></li>
                        <li><Link href="/terms" className="hover:text-indigo-400 transition-colors">Terms</Link></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-[var(--border)] pt-12 flex flex-col md:flex-row items-center justify-between gap-4">
                <p>© 2026 Hakam Intelligence. Built for high-performance teams.</p>
                <p className="text-xs opacity-50">Part of Hattab Group</p>
            </div>
        </footer>
    );
}
