"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, AlertCircle, Mail, Lock, Presentation, Sparkles } from 'lucide-react';

export default function PresenterLogin() {
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
            router.push('/presenter/dashboard');
        } catch (err: any) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Left Column - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900" />
                <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" />

                <div className="relative z-10 text-white max-w-xl">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 w-fit text-sm font-semibold shadow-lg">
                        <Sparkles size={16} className="text-yellow-300" />
                        <span>PACE Quizz Platform</span>
                    </div>
                    <h1 className="text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                        Engage Your <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-100">Audience Instantly</span>
                    </h1>
                    <p className="text-blue-100 text-xl leading-relaxed opacity-90 font-medium mb-12">
                        Create interactive presentations, host live quizzes, and gather real-time feedback with our powerful host portal.
                    </p>

                    <div className="flex items-center gap-4 text-sm font-medium text-blue-200">
                        <div className="flex -space-x-3">
                            <div className="w-10 h-10 rounded-full border-2 border-blue-700 bg-blue-400" />
                            <div className="w-10 h-10 rounded-full border-2 border-blue-700 bg-cyan-400" />
                            <div className="w-10 h-10 rounded-full border-2 border-blue-700 bg-indigo-400" />
                            <div className="w-10 h-10 rounded-full border-2 border-blue-700 bg-blue-500 flex items-center justify-center text-xs text-white shadow-inner">
                                +1k
                            </div>
                        </div>
                        <p>Trusted by thousands of presenters</p>
                    </div>
                </div>
            </div>

            {/* Right Column - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white">
                <div className="w-full max-w-[420px]">

                    {/* Mobile Only Header */}
                    <div className="lg:hidden text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                            <Presentation size={32} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Host Portal</h1>
                        <p className="text-gray-500 font-medium">Sign in to manage your sessions</p>
                    </div>

                    <div className="hidden lg:block mb-10">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                        <p className="text-gray-500 text-lg">Sign in to your presenter account.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4">
                            <AlertCircle size={20} className="shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={20} className="text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full text-gray-900 bg-white shadow-sm py-3.5 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full text-gray-900 bg-white shadow-sm py-3.5 pl-11 pr-4 rounded-xl border border-gray-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!email || !password || isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow-[0_8px_30px_rgb(37,99,235,0.3)] shadow-sm hover:-translate-y-0.5 active:scale-95 mt-4"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-3 border-white/40 border-t-white rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Sign In to Dashboard</span>
                                    <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-500 font-medium">
                            Don't have an account? <a href="#" className="text-blue-600 hover:text-blue-700 font-bold hover:underline">Contact Administrator</a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

