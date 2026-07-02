"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Play, Trash2, Edit, LogOut, BarChart3, AlertCircle, Search, LayoutGrid, List as ListIcon, Clock, Type } from 'lucide-react';

type Session = {
    id: string;
    name: string;
    pin: string;
    type: 'LIVE' | 'SURVEY';
    status: 'CREATED' | 'ACTIVE' | 'FINISHED';
    questions: any[];
    createdAt: string;
};

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
}

function getToken() {
    return localStorage.getItem('access_token');
}

export default function PresenterDashboard() {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSessionName, setNewSessionName] = useState('');
    const [newSessionType, setNewSessionType] = useState<'LIVE' | 'SURVEY'>('LIVE');
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const router = useRouter();

    const fetchSessions = async () => {
        try {
            const res = await fetch(`${getApiUrl()}/sessions/my`, {
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            if (res.status === 401) {
                router.replace('/presenter/login');
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setSessions(data);
            }
        } catch (err) {
            console.error('Failed to fetch sessions', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace('/presenter/login');
            return;
        }
        fetchSessions();
    }, []);

    const handleCreateSession = async () => {
        if (!newSessionName.trim()) return;
        setCreating(true);
        setError('');
        try {
            const res = await fetch(`${getApiUrl()}/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify({ name: newSessionName, type: newSessionType }),
            });
            if (!res.ok) throw new Error('Failed to create session');
            const session = await res.json();
            setShowCreateModal(false);
            setNewSessionName('');
            router.push(`/presenter/edit/${session.id}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteSession = async (id: string) => {
        if (!confirm('Are you sure you want to delete this session?')) return;
        try {
            await fetch(`${getApiUrl()}/sessions/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            setSessions(sessions.filter(s => s.id !== id));
        } catch (err) {
            console.error('Failed to delete session', err);
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem('access_token');
        router.push('/presenter/login');
    };

    const statusColors: Record<string, string> = {
        CREATED: 'bg-blue-100 text-blue-700',
        ACTIVE: 'bg-green-100 text-green-700',
        FINISHED: 'bg-gray-100 text-gray-600',
    };

    const filteredSessions = sessions
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
            if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
            return 0;
        });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-600 tracking-tight flex items-center gap-2">
                    <BarChart3 size={24} /> PACE Quizz Workspace
                </h1>
                <button onClick={handleSignOut} className="text-gray-400 hover:text-red-500 transition-colors flex items-center gap-2 text-sm font-medium">
                    <LogOut size={18} /> Sign Out
                </button>
            </header>

            <main className="flex-1 w-full max-w-5xl mx-auto p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h2 className="text-3xl font-bold">My Sessions</h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
                    >
                        <Plus size={20} /> New Session
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm kiếm session..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="block w-full pl-3 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all cursor-pointer"
                        >
                            <option value="newest">Mới nhất trước</option>
                            <option value="oldest">Cũ nhất trước</option>
                            <option value="name_asc">Tên (A-Z)</option>
                            <option value="name_desc">Tên (Z-A)</option>
                        </select>
                        <div className="flex bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                title="List View"
                            >
                                <ListIcon size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-20">
                        <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">No sessions yet</h3>
                        <p className="text-gray-400 mb-6">Create your first Poll, Quiz, or Survey session</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold"
                        >
                            <Plus size={18} className="inline mr-2" /> Create Session
                        </button>
                    </div>
                ) : filteredSessions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <Search size={48} className="mx-auto text-gray-200 mb-4" />
                        <h3 className="text-xl font-bold text-gray-400 mb-2">Không tìm thấy session nào</h3>
                        <p className="text-gray-400 mb-6">Thử thay đổi từ khóa tìm kiếm</p>
                    </div>
                ) : (
                    <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
                        {filteredSessions.map((session) => (
                            <div key={session.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow group ${viewMode === 'list' ? 'flex flex-row items-center p-4 gap-6' : 'flex flex-col p-6'}`}>
                                <div className={viewMode === 'list' ? 'flex-1 min-w-0 flex items-center gap-6' : 'flex justify-between items-start mb-4'}>
                                    <div className={`px-3 py-1 text-xs font-bold rounded-full whitespace-nowrap ${statusColors[session.status] || 'bg-gray-100 text-gray-600'}`}>
                                        {session.status}
                                    </div>
                                    <span className={`text-xs font-medium text-gray-400 uppercase whitespace-nowrap ${viewMode === 'list' ? '' : ''}`}>{session.type}</span>
                                    
                                    {viewMode === 'list' && (
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold line-clamp-1">{session.name}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <p className="text-sm font-mono text-gray-500">PIN: <span className="font-bold text-gray-700">{session.pin}</span></p>
                                                <p className="text-xs text-gray-400">{session.questions?.length || 0} questions</p>
                                                <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12}/> {new Date(session.createdAt).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {viewMode === 'grid' && (
                                    <>
                                        <h3 className="text-xl font-bold mb-2 line-clamp-2">{session.name}</h3>
                                        <p className="text-sm font-mono text-gray-500 mb-1">PIN: <span className="font-bold text-gray-700">{session.pin}</span></p>
                                        <p className="text-xs text-gray-400 mb-4">{session.questions?.length || 0} questions • <span className="inline-flex items-center gap-1"><Clock size={10}/> {new Date(session.createdAt).toLocaleDateString('vi-VN')}</span></p>
                                    </>
                                )}

                                <div className={viewMode === 'list' ? 'flex items-center gap-2' : 'mt-auto pt-4 border-t border-gray-100 space-y-2'}>
                                    <button
                                        onClick={() => router.push(`/presenter/${session.id}`)}
                                        className={`${viewMode === 'list' ? 'px-4 py-2' : 'w-full py-3'} bg-black hover:bg-gray-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors`}
                                    >
                                        <Play size={16} /> {viewMode === 'list' ? 'Present' : 'Present Now'}
                                    </button>
                                    <div className={`flex gap-2 ${viewMode === 'list' ? '' : 'w-full'}`}>
                                        <button
                                            onClick={() => router.push(`/presenter/edit/${session.id}`)}
                                            className={`${viewMode === 'list' ? 'px-4 py-2' : 'flex-1 py-2.5'} bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-200 rounded-xl font-bold transition-colors flex items-center justify-center gap-2`}
                                        >
                                            <Edit size={16} /> {viewMode === 'grid' && 'Edit'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className={`${viewMode === 'list' ? 'px-3 py-2' : 'px-4 py-2.5'} bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border-2 border-gray-200 hover:border-red-200 rounded-xl font-bold transition-colors flex items-center justify-center`}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Create Session Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-6">Create New Session</h3>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Name</label>
                                <input
                                    type="text"
                                    value={newSessionName}
                                    onChange={(e) => setNewSessionName(e.target.value)}
                                    placeholder="e.g. Q1 All Hands Townhall"
                                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Session Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewSessionType('LIVE')}
                                        className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${newSessionType === 'LIVE' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        🎯 Live Poll/Quiz
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewSessionType('SURVEY')}
                                        className={`py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${newSessionType === 'SURVEY' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
                                    >
                                        📋 Survey
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl border-2 border-gray-200 font-bold text-gray-500 hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateSession}
                                disabled={!newSessionName.trim() || creating}
                                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold transition-colors"
                            >
                                {creating ? 'Creating...' : 'Create & Edit'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

