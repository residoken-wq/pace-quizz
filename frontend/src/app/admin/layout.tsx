"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldCheck, Users, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthed, setIsAuthed] = useState(false);

    useEffect(() => {
        // Skip auth check on the login page itself
        if (pathname === '/admin/login') {
            setIsAuthed(true); // Let the login page render
            return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            router.replace('/admin/login');
        } else {
            setIsAuthed(true);
        }
    }, [pathname, router]);

    const handleSignOut = () => {
        localStorage.removeItem('access_token');
        router.push('/admin/login');
    };

    // Don't render layout chrome for login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    if (!isAuthed) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex">
                <div className="p-6 border-b border-slate-800">
                    <Link href="/admin/users" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <ShieldCheck size={32} className="text-blue-500" />
                        <h1 className="text-xl font-bold tracking-tight text-white">Admin Portal</h1>
                    </Link>
                </div>

                <nav className="flex-1 px-4 py-8 space-y-2">
                    <Link href="/admin/dashboard" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/dashboard' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link href="/admin/users" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/users' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Users size={20} /> User Management
                    </Link>
                    <Link href="/admin/settings" className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${pathname === '/admin/settings' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Settings size={20} /> Settings
                    </Link>
                </nav>

                <div className="p-6 border-t border-slate-800">
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
                        <LogOut size={20} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={24} className="text-blue-500" />
                        <h1 className="text-lg font-bold">Admin Portal</h1>
                    </div>
                    <button onClick={handleSignOut} className="p-2 text-red-400"><LogOut size={24} /></button>
                </header>

                {/* Dynamic Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

