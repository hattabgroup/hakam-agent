'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

export default function GithubCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const [status, setStatus] = useState('Processing GitHub connection...');
    const [error, setError] = useState('');
    const isConnecting = useRef(false);

    useEffect(() => {
        if (!user) return;

        const installation_id = searchParams.get('installation_id');
        const setup_action = searchParams.get('setup_action');

        if (!installation_id) {
            setError('No installation ID received from GitHub.');
            return;
        }

        const connectGithub = async () => {
            if (isConnecting.current) return;
            isConnecting.current = true;
            try {
                // Save the integration
                await axios.post('/api/integrations', {
                    provider: 'github',
                    token: installation_id // We send installation_id as the token
                });

                setStatus('Successfully connected! Redirecting...');
                setTimeout(() => {
                    router.push('/dashboard/integrations');
                }, 1500);
            } catch (err: any) {
                console.error("Failed to connect GitHub", err);
                setError(err.response?.data?.detail || 'Failed to connect GitHub App.');
                isConnecting.current = false;
            }
        };

        if (setup_action === 'install' || setup_action === 'update' || installation_id) {
            connectGithub();
        }

    }, [user, searchParams, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 text-rose-500">
                    ✕
                </div>
                <h1 className="text-2xl font-bold mb-2">Connection Failed</h1>
                <p className="text-zinc-500 mb-6">{error}</p>
                <button
                    onClick={() => router.push('/dashboard/integrations')}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-colors"
                >
                    Return to Integrations
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-6" />
            <h1 className="text-xl font-bold">{status}</h1>
        </div>
    );
}
