"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Users, Play, Square, ChevronRight, ChevronLeft, QrCode, RotateCcw,
    Wifi, WifiOff, Clock, CheckCircle2, History, ArrowLeft, Loader2,
    AlertTriangle, Sun, Moon
} from 'lucide-react';
import QRCode from 'qrcode';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

type Phase = 'LOBBY' | 'LIVE' | 'RESULTS';

type Question = {
    id: string;
    title: string;
    order: number;
    type: string;
    options: any[];
    timeLimit?: number;
};

type Session = {
    id: string;
    name: string;
    pin: string;
    type: string;
    status: string;
    questions: Question[];
    participants: any[];
};

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
}
function getToken() { return localStorage.getItem('access_token'); }
function headers() { return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` }; }

export default function PresenterLiveView() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;
    const { socket, isConnected } = useSocket();

    const [session, setSession] = useState<Session | null>(null);
    const [phase, setPhase] = useState<Phase>('LOBBY');
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [participantsCount, setParticipantsCount] = useState(0);
    const [votes, setVotes] = useState<Record<string, Record<string, number>>>({});
    const [qrDataUrl, setQrDataUrl] = useState('');
    const [timer, setTimer] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [activityLogs, setActivityLogs] = useState<any[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Theme state
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const isDark = theme === 'dark';

    // ─── Fetch session data ───
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${getApiUrl()}/sessions/${sessionId}`, { headers: headers() });
                if (res.ok) {
                    const data = await res.json();
                    setSession(data);
                    setParticipantsCount(data.participants?.length || 0);
                    if (data.status === 'ACTIVE') setPhase('LIVE');
                }
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, [sessionId]);

    // ─── Generate QR code ───
    useEffect(() => {
        if (!session) return;
        const participantUrl = typeof window !== 'undefined'
            ? `${window.location.origin}/participant/${session.pin}`
            : `https://quizz.pace.edu.vn/participant/${session.pin}`;
        QRCode.toDataURL(participantUrl, { width: 280, margin: 2, color: { dark: '#1e293b', light: '#ffffff' } })
            .then(setQrDataUrl);
    }, [session]);

    // ─── Socket listeners ───
    useEffect(() => {
        if (!socket || !isConnected || !session) return;
        socket.emit('join_session', { sessionId: session.pin, role: 'host' });

        socket.on('participant_joined', () => setParticipantsCount(prev => prev + 1));
        socket.on('new_vote', (data: any) => {
            setVotes(prev => {
                const qVotes = { ...(prev[data.questionId] || {}) };
                qVotes[data.answer.optionId] = (qVotes[data.answer.optionId] || 0) + 1;
                return { ...prev, [data.questionId]: qVotes };
            });
        });

        return () => { socket.off('participant_joined'); socket.off('new_vote'); };
    }, [socket, isConnected, session]);

    // ─── Timer ───
    useEffect(() => {
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const startTimer = useCallback((seconds: number) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimer(seconds);
        timerRef.current = setInterval(() => {
            setTimer(prev => {
                if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); return 0; }
                return prev - 1;
            });
        }, 1000);
    }, []);

    // ─── Actions ───
    const handleStart = async () => {
        await fetch(`${getApiUrl()}/sessions/${sessionId}/start`, { method: 'POST', headers: headers() });
        setPhase('LIVE');
        setCurrentQIdx(0);
        broadcastQuestion(0);
    };

    const handleEnd = async () => {
        if (timerRef.current) clearInterval(timerRef.current);
        await fetch(`${getApiUrl()}/sessions/${sessionId}/end`, { method: 'POST', headers: headers() });
        setPhase('RESULTS');
    };

    const handleReset = async () => {
        await fetch(`${getApiUrl()}/sessions/${sessionId}/reset`, { method: 'POST', headers: headers() });
        setVotes({});
        setParticipantsCount(0);
        setPhase('LOBBY');
        setCurrentQIdx(0);
        setShowResetConfirm(false);
    };

    const broadcastQuestion = (idx: number) => {
        if (!socket || !session) return;
        const q = session.questions[idx];
        if (!q) return;
        socket.emit('host_state_update', {
            sessionId: session.pin,
            questionId: q.id,
            title: q.title,
            type: q.type,
            options: q.options,
            status: 'ACTIVE',
        });
        if (q.timeLimit && q.timeLimit > 0) startTimer(q.timeLimit);
        else setTimer(0);
    };

    const goToQuestion = (idx: number) => {
        if (!session || idx < 0 || idx >= session.questions.length) return;
        setCurrentQIdx(idx);
        broadcastQuestion(idx);
    };

    const fetchHistory = async () => {
        const res = await fetch(`${getApiUrl()}/sessions/${sessionId}/logs`, { headers: headers() });
        if (res.ok) setActivityLogs(await res.json());
        setShowHistory(true);
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    const questions = session?.questions || [];
    const currentQ = questions[currentQIdx];
    const currentVotes = currentQ ? (votes[currentQ.id] || {}) : {};

    const chartData = currentQ?.options?.map((opt: any, index: number) => ({
        name: String.fromCharCode(65 + index), // A, B, C, D instead of full text
        fullText: opt.text || 'Option',
        votes: currentVotes[opt.id] || 0,
    })) || [];

    const totalVotes = chartData.reduce((s: number, d: any) => s + d.votes, 0);

    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0f0f1a]' : 'bg-slate-50'}`}>
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    const participantUrl = typeof window !== 'undefined' && session
        ? `${window.location.origin}/participant/${session.pin}`
        : '';

    const bgClass = isDark ? 'bg-[#0f0f1a]' : 'bg-slate-50';
    const textClass = isDark ? 'text-white' : 'text-slate-900';
    const headerBgClass = isDark ? 'bg-gradient-to-r from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] border-white/5' : 'bg-white border-slate-200 shadow-sm';
    const cardBgClass = isDark ? 'bg-white/5' : 'bg-white shadow-sm border border-slate-200';
    const secondaryTextClass = isDark ? 'text-white/60' : 'text-slate-500';

    return (
        <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${bgClass} ${textClass}`}>
            {/* ═══ HEADER ═══ */}
            <header className={`${headerBgClass} border-b px-6 py-4 flex items-center justify-between shrink-0 transition-colors duration-300`}>
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/presenter/dashboard')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`}>
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold">{session?.name}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-500/20 px-2 py-0.5 rounded">
                                PIN: {session?.pin}
                            </span>
                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded ${isConnected ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                                {isConnected ? 'Live' : 'Offline'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                        <Users size={16} className="text-blue-500" />
                        <span className="font-bold text-lg">{participantsCount}</span>
                    </div>

                    <button onClick={toggleTheme} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'}`} title="Toggle Theme">
                        {isDark ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button onClick={fetchHistory} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900'}`} title="Activity Logs">
                        <History size={18} />
                    </button>
                </div>
            </header>

            {/* ═══ LOBBY PHASE ═══ */}
            {phase === 'LOBBY' && (
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl sm:text-5xl font-black mb-3">
                            Tham gia tại <span className="text-indigo-500">{participantUrl.replace('https://', '').replace('http://', '').split('/')[0]}</span>
                        </h2>
                        <p className={`text-2xl ${secondaryTextClass}`}>
                            Mã PIN: <span className={`font-black text-4xl px-4 py-1 rounded-xl ml-2 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-900'}`}>{session?.pin}</span>
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-xl mb-8 border border-slate-200">
                        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 mx-auto" />}
                        <p className="text-slate-500 text-center text-sm font-semibold mt-4 tracking-wide">QUÉT MÃ TRÊN ĐỂ THAM GIA</p>
                    </div>

                    <div className={`flex items-center gap-2 px-6 py-3 rounded-2xl mb-10 ${secondaryTextClass} ${isDark ? 'bg-white/5' : 'bg-slate-200/50'}`}>
                        <Users size={20} className="text-blue-500" />
                        <span className={`text-xl font-bold ${textClass}`}>{participantsCount}</span>
                        <span>người tham gia đã kết nối</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleStart}
                            disabled={questions.length === 0}
                            className={`bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg active:scale-[0.97] ${isDark ? 'disabled:from-gray-700 disabled:to-gray-800' : 'disabled:from-slate-400 disabled:to-slate-500'}`}
                        >
                            <Play size={24} /> Bắt đầu trình chiếu
                        </button>
                    </div>
                    {questions.length === 0 && (
                        <p className="text-amber-500 text-sm mt-4 flex items-center gap-2 font-semibold">
                            <AlertTriangle size={16} /> Chưa có câu hỏi nào. Hãy thêm câu hỏi trước.
                        </p>
                    )}
                </main>
            )}

            {/* ═══ LIVE PHASE ═══ */}
            {phase === 'LIVE' && currentQ && (
                <>
                    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
                        <div className="w-full max-w-5xl">
                            {/* Question number + timer */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20 px-3 py-1 rounded-lg border border-indigo-500/20">
                                    Câu {currentQIdx + 1} / {questions.length}
                                </span>
                                {timer > 0 && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg border ${timer <= 5 ? 'bg-red-500/10 text-red-500 border-red-500/30 animate-pulse' : isDark ? 'bg-white/5 text-white/70 border-white/10' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        <Clock size={18} />
                                        {timer}s
                                    </div>
                                )}
                                <span className={`text-xs font-semibold ${secondaryTextClass}`}>
                                    {totalVotes} phiếu
                                </span>
                            </div>

                            {/* Question title */}
                            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 leading-snug">
                                {currentQ.title}
                            </h2>

                            <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
                                {/* Bar chart */}
                                <div className={`h-[350px] flex-1 rounded-2xl p-4 sm:p-6 ${cardBgClass}`}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#ffffff10" : "#cbd5e1"} />
                                            <XAxis dataKey="name" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 16, fontWeight: 700 }} axisLine={false} tickLine={false} />
                                            <YAxis allowDecimals={false} tick={{ fill: isDark ? '#64748b' : '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={{ fill: isDark ? '#ffffff08' : '#f1f5f9' }}
                                                contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#ffffff', border: isDark ? '1px solid #334155' : '1px solid #e2e8f0', borderRadius: '12px', fontSize: 14, fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}
                                                labelStyle={{ color: isDark ? '#94a3b8' : '#64748b', marginBottom: '4px' }}
                                            />
                                            <Bar dataKey="votes" radius={[10, 10, 0, 0]} animationDuration={600} barSize={60}>
                                                {chartData.map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Answers Legend */}
                                <div className={`flex-[0.8] rounded-2xl p-6 ${cardBgClass} self-stretch flex flex-col justify-center`}>
                                    <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${secondaryTextClass}`}>Các Đáp Án</h3>
                                    <div className="space-y-4">
                                        {chartData.map((data: any, index: number) => (
                                            <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-500/5 transition-colors">
                                                <div
                                                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-lg shadow-sm"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                >
                                                    {data.name}
                                                </div>
                                                <div className="flex-1 mt-0.5 min-w-0">
                                                    <p className="text-base font-semibold break-words leading-relaxed">{data.fullText}</p>
                                                    <p className={`text-sm mt-1 font-medium ${secondaryTextClass}`}>{data.votes} phiếu</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>

                    {/* Bottom control bar */}
                    <footer className={`h-20 border-t flex items-center justify-between px-8 ${isDark ? 'bg-[#1a1a2e] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <span className={`font-mono text-sm font-semibold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                            Slide {currentQIdx + 1} / {questions.length}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => goToQuestion(currentQIdx - 1)}
                                disabled={currentQIdx === 0}
                                className={`p-3 rounded-xl disabled:opacity-30 transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {currentQIdx === questions.length - 1 ? (
                                <button
                                    onClick={handleEnd}
                                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-[0.97]"
                                >
                                    <Square size={18} /> Kết thúc
                                </button>
                            ) : (
                                <button
                                    onClick={() => goToQuestion(currentQIdx + 1)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-[0.97]"
                                >
                                    Câu tiếp <ChevronRight size={18} />
                                </button>
                            )}

                            <button
                                onClick={() => goToQuestion(currentQIdx + 1)}
                                disabled={currentQIdx >= questions.length - 1}
                                className={`p-3 rounded-xl disabled:opacity-30 transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-white/70 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200'}`}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div />
                    </footer>
                </>
            )}

            {/* ═══ RESULTS PHASE ═══ */}
            {phase === 'RESULTS' && (
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center mb-10">
                        <CheckCircle2 size={64} className="mx-auto text-emerald-500 mb-4" />
                        <h2 className="text-4xl font-black mb-2">Đã kết thúc!</h2>
                        <p className={`text-lg ${secondaryTextClass}`}>Session đã được lưu. Bạn có thể xem kết quả hoặc reset.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className={`flex items-center gap-2 border px-6 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-sm'}`}
                        >
                            <RotateCcw size={18} /> Reset kết quả
                        </button>
                        <button
                            onClick={fetchHistory}
                            className={`flex items-center gap-2 border px-6 py-3 rounded-xl font-bold transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 border-white/10' : 'bg-white hover:bg-slate-50 border-slate-300 shadow-sm'}`}
                        >
                            <History size={18} /> Xem lịch sử
                        </button>
                        <button
                            onClick={() => router.push('/presenter/dashboard')}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all"
                        >
                            Về Dashboard
                        </button>
                    </div>
                </main>
            )}

            {/* ═══ RESET CONFIRM MODAL ═══ */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
                    <div className={`${isDark ? 'bg-[#1e1e2e] border-white/10' : 'bg-white border-slate-200'} rounded-2xl border w-full max-w-sm p-8 text-center`} onClick={(e) => e.stopPropagation()}>
                        <AlertTriangle size={40} className="mx-auto text-amber-500 mb-4" />
                        <h3 className={`text-xl font-bold mb-2 ${textClass}`}>Reset kết quả?</h3>
                        <p className={`text-sm mb-6 ${secondaryTextClass}`}>Tất cả phiếu trả lời và danh sách người tham gia sẽ bị xoá. Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${isDark ? 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                                Huỷ
                            </button>
                            <button onClick={handleReset} className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ ACTIVITY LOGS PANEL ═══ */}
            {showHistory && (
                <div className="fixed inset-0 z-50 bg-black/70 flex justify-end" onClick={() => setShowHistory(false)}>
                    <div className={`w-full max-w-md h-full overflow-y-auto border-l p-6 ${isDark ? 'bg-[#1a1a2e] border-white/10' : 'bg-slate-50 border-slate-200'}`} onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <History size={20} className="text-indigo-500" /> Lịch sử hoạt động
                            </h3>
                            <button onClick={() => setShowHistory(false)} className={`text-sm font-bold ${isDark ? 'text-white/40 hover:text-white' : 'text-slate-400 hover:text-slate-900'}`}>Đóng</button>
                        </div>

                        {activityLogs.length === 0 ? (
                            <p className={`text-sm text-center py-12 ${secondaryTextClass}`}>Chưa có hoạt động nào</p>
                        ) : (
                            <div className="space-y-3">
                                {activityLogs.map((log: any) => (
                                    <div key={log.id} className={`rounded-xl p-4 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <LogActionBadge action={log.action} isDark={isDark} />
                                        </div>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                        {log.details && (
                                            <p className={`text-xs mt-1 font-mono break-words ${isDark ? 'text-white/20' : 'text-slate-500'}`}>{JSON.stringify(log.details)}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function LogActionBadge({ action, isDark }: { action: string, isDark: boolean }) {
    const map: Record<string, { label: string; color: string; colorLight: string }> = {
        SESSION_STARTED: { label: '▶ Session bắt đầu', color: 'text-emerald-400 bg-emerald-500/20', colorLight: 'text-emerald-700 bg-emerald-100' },
        SESSION_ENDED: { label: '⏹ Session kết thúc', color: 'text-red-400 bg-red-500/20', colorLight: 'text-red-700 bg-red-100' },
        RESULTS_RESET: { label: '🔄 Đã reset kết quả', color: 'text-amber-400 bg-amber-500/20', colorLight: 'text-amber-700 bg-amber-100' },
        QUESTION_NAVIGATED: { label: '➡ Chuyển câu hỏi', color: 'text-blue-400 bg-blue-500/20', colorLight: 'text-blue-700 bg-blue-100' },
        PARTICIPANT_JOINED: { label: '👤 Người tham gia mới', color: 'text-indigo-400 bg-indigo-500/20', colorLight: 'text-indigo-700 bg-indigo-100' },
    };
    const info = map[action] || { label: action, color: 'text-white/50 bg-white/5', colorLight: 'text-slate-500 bg-slate-100' };
    return <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isDark ? info.color : info.colorLight}`}>{info.label}</span>;
}
