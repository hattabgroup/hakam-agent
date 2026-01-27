"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = React.useState(false);
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();
    const isDashboard = pathname.startsWith('/dashboard');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (isDashboard) return null;

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-4 shadow-2xl' : 'py-6 bg-transparent'}`}>
            <div className="container mx-auto px-6 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center font-black text-white shadow-lg group-hover:rotate-12 transition-transform">H</div>
                    <span className="text-xl font-bold tracking-tight text-white uppercase italic">Hakam</span>
                </Link>

                <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[var(--fg-muted)]">
                    {pathname === '/' && (
                        <>
                            <Link href="#" className="hover:text-white transition-colors">Home</Link>
                            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
                            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                            <Link href="#ready" className="hover:text-white transition-colors">Ready?</Link>
                        </>
                    )}
                    {user && (
                        <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 transition-colors">Dashboard</Link>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {loading ? (
                        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-indigo-500 animate-spin" />
                    ) : user ? (
                        <div className="flex items-center gap-4">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-xs font-bold text-white leading-none">{user.email.split('@')[0]}</span>
                                <span className="text-[10px] text-zinc-500">Free Plan</span>
                            </div>
                            <button onClick={logout} className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors">Logout</button>
                            <Link href="/dashboard" className="btn-premium px-6 py-2.5 text-sm hidden sm:block">Go to App</Link>
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-semibold text-zinc-400 hover:text-white transition-colors hidden sm:block">Login</Link>
                            <Link href="/signup" className="btn-premium px-6 py-2.5 text-sm">Start Now</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
