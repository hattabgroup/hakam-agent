"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function GitLabCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Connecting to GitLab...');
    const processed = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            setStatus('error');
            setMessage('No authorization code received from GitLab.');
            return;
        }

        if (processed.current) return;
        processed.current = true;

        const completeIntegration = async () => {
            try {
                await axios.post('/api/integrations/gitlab/callback', {
                    code: code
                });
                
                setStatus('success');
                setMessage('GitLab connected successfully! Redirecting...');
                
                setTimeout(() => {
                    router.push('/dashboard/integrations');
                }, 2000);
            } catch (err: any) {
                console.error('GitLab Integration Error:', err);
                setStatus('error');
                setMessage(err.response?.data?.detail || 'Failed to connect GitLab account.');
            }
        };

        completeIntegration();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
            <div className="glass p-12 rounded-[48px] border-white/5 bg-white/5 max-w-md w-full text-center">
                {status === 'loading' && (
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <h2 className="text-2xl font-bold text-white">{message}</h2>
                        <p className="text-zinc-500">Please do not close this window.</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center text-4xl text-emerald-500 border border-emerald-500/20">
                            ✓
                        </div>
                        <h2 className="text-2xl font-bold text-white">{message}</h2>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-4xl text-rose-500 border border-rose-500/20">
                            !
                        </div>
                        <h2 className="text-2xl font-bold text-white">Connection Failed</h2>
                        <p className="text-zinc-500 mb-6">{message}</p>
                        <button 
                            onClick={() => router.push('/dashboard/integrations')}
                            className="btn-premium px-8 py-3 font-bold"
                        >
                            Return to Integrations
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
