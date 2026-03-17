"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogIn, AlertCircle, Lock, Mail, ChevronRight } from 'lucide-react';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');

            const res = await fetch(`${apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Invalid email or password');
            }

            const data = await res.json();
            localStorage.setItem('access_token', data.access_token);
            router.push('/admin/users');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please verify your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] relative flex items-center justify-center p-6 overflow-hidden">
            {/* Background effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }} />

            <div className="w-full max-w-[440px] relative z-10">
                {/* Logo Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[28px] shadow-[0_0_40px_rgba(37,99,235,0.3)] mb-6 transform hover:scale-105 transition-transform duration-300">
                        <ShieldCheck size={40} className="text-white" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 tracking-tight mb-3">
                        PACE Admin
                    </h1>
                    <p className="text-slate-400 text-lg">Secure Access Portal</p>
                </div>

                {/* Glassmorphism Login Card */}
                <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl shadow-2xl p-8 sm:p-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500" />

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-5 py-4 rounded-2xl mb-8 flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p className="leading-relaxed">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={20} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@pace.edu.vn"
                                    className="w-full bg-[#131B2C] text-white placeholder-slate-500 py-4 pl-12 pr-4 rounded-2xl border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-300 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#131B2C] text-white placeholder-slate-500 py-4 pl-12 pr-4 rounded-2xl border border-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!email || !password || isLoading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 mt-4 group"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer text */}
                <p className="text-center text-slate-500 text-sm mt-8">
                    &copy; {new Date().getFullYear()} PACE Institute of Management. All rights reserved.
                </p>
            </div>
        </div>
    );
}
