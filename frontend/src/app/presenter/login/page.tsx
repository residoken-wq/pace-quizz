"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';

export default function PresenterLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // TODO: Connect to real NestJS Auth login API
        // For now, mock a successful login delay
        setTimeout(() => {
            // Upon successful login, typically save JWT token, then redirect
            router.push('/presenter/dashboard');
        }, 800);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-blue-600 mb-2">Host Portal</h1>
                        <p className="text-gray-500 font-medium">Log in to manage your sessions</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.com"
                                className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!email || !password || isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[60px]"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Sign In <LogIn size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
