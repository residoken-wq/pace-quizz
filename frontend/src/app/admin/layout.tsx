import { ShieldCheck, Users, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
                    <Link href="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
                        <LayoutDashboard size={20} /> Dashboard
                    </Link>
                    <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                        <Users size={20} /> User Management
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
                        <Settings size={20} /> Settings
                    </Link>
                </nav>

                <div className="p-6 border-t border-slate-800">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors">
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
                    <button className="p-2"><Users size={24} /></button>
                </header>

                {/* Dynamic Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
