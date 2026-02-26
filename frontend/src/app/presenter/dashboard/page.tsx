"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, MoreVertical } from 'lucide-react';

// Mock types
type Session = {
    id: string;
    name: string;
    pin: string;
    status: 'CREATED' | 'ACTIVE' | 'FINISHED';
    createdAt: string;
};

export default function PresenterDashboardList() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // TODO: Fetch real sessions from NestJS GET /sessions API for the logged in user
        setTimeout(() => {
            setSessions([
                { id: 'sess-123', name: 'Q1 All Hands Townhall', pin: '839210', status: 'CREATED', createdAt: new Date().toISOString() },
                { id: 'sess-456', name: 'Marketing Training UX', pin: '221447', status: 'FINISHED', createdAt: new Date(Date.now() - 86400000).toISOString() },
            ]);
            setIsLoading(false);
        }, 600);
    }, []);

    const handleCreateSession = async () => {
        // TODO: Call POST /sessions API
        alert('Create session modal will open here');
    };

    const handleOpenSession = (sessionId: string) => {
        // Navigate to the real-time presenter view
        router.push(`/presenter/${sessionId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600 tracking-tight">Pace Quizz Workspace</h1>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                        NT
                    </div>
                </div>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-bold">My Sessions</h2>
                    <button
                        onClick={handleCreateSession}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
                    >
                        <Plus size={20} /> New Session
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sessions.map((session) => (
                            <div key={session.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${session.status === 'CREATED' ? 'bg-blue-100 text-blue-700' :
                                            session.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-600'
                                        }`}>
                                        {session.status}
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-700">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>

                                <h3 className="text-xl font-bold mb-2 line-clamp-2">{session.name}</h3>
                                <p className="text-sm font-mono text-gray-500 mb-6">PIN: <span className="font-bold text-gray-700">{session.pin}</span></p>

                                <div className="mt-auto pt-4 border-t border-gray-100 space-y-3">
                                    <button
                                        onClick={() => handleOpenSession(session.id)}
                                        className="w-full bg-black hover:bg-gray-800 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Play size={18} /> Present Now
                                    </button>
                                    <button className="w-full bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 py-3 rounded-xl font-bold transition-colors">
                                        Edit Questions
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
