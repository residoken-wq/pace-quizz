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
    AlertTriangle
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

    const questions = session?.questions || [];
    const currentQ = questions[currentQIdx];
    const currentVotes = currentQ ? (votes[currentQ.id] || {}) : {};

    const chartData = currentQ?.options?.map((opt: any) => ({
        name: opt.text?.substring(0, 30) || 'Option',
        votes: currentVotes[opt.id] || 0,
    })) || [];

    const totalVotes = chartData.reduce((s: number, d: any) => s + d.votes, 0);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
            </div>
        );
    }

    const participantUrl = typeof window !== 'undefined' && session
        ? `${window.location.origin}/participant/${session.pin}`
        : '';

    return (
        <div className="min-h-screen bg-[#0f0f1a] text-white flex flex-col font-sans">
            {/* ═══ HEADER ═══ */}
            <header className="bg-gradient-to-r from-[#0f0f1a] via-[#1a1a2e] to-[#0f0f1a] border-b border-white/5 px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/presenter/dashboard')} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all">
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white">{session?.name}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/20 px-2 py-0.5 rounded">
                                PIN: {session?.pin}
                            </span>
                            <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                                {isConnected ? 'Live' : 'Offline'}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl">
                        <Users size={16} className="text-blue-400" />
                        <span className="font-bold text-lg">{participantsCount}</span>
                    </div>
                    <button onClick={fetchHistory} className="w-9 h-9 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center text-white/50 hover:text-white transition-all" title="Activity Logs">
                        <History size={18} />
                    </button>
                </div>
            </header>

            {/* ═══ LOBBY PHASE ═══ */}
            {phase === 'LOBBY' && (
                <main className="flex-1 flex flex-col items-center justify-center p-8">
                    <div className="text-center mb-8">
                        <h2 className="text-4xl sm:text-5xl font-black mb-3">
                            Tham gia tại <span className="text-indigo-400">{participantUrl.replace('https://', '').replace('http://', '').split('/')[0]}</span>
                        </h2>
                        <p className="text-2xl text-white/60">
                            Mã PIN: <span className="text-white font-black text-4xl bg-white/10 px-4 py-1 rounded-xl ml-2">{session?.pin}</span>
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl p-4 shadow-2xl shadow-indigo-500/10 mb-8">
                        {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />}
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-6 py-3 rounded-2xl mb-10 text-white/60">
                        <Users size={20} className="text-blue-400" />
                        <span className="text-xl font-bold text-white">{participantsCount}</span>
                        <span>người tham gia đã kết nối</span>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handleStart}
                            disabled={questions.length === 0}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-700 disabled:to-gray-800 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.97]"
                        >
                            <Play size={24} /> Bắt đầu trình chiếu
                        </button>
                    </div>
                    {questions.length === 0 && (
                        <p className="text-amber-400 text-sm mt-4 flex items-center gap-2">
                            <AlertTriangle size={16} /> Chưa có câu hỏi nào. Hãy thêm câu hỏi trước.
                        </p>
                    )}
                </main>
            )}

            {/* ═══ LIVE PHASE ═══ */}
            {phase === 'LIVE' && currentQ && (
                <>
                    <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
                        <div className="w-full max-w-5xl">
                            {/* Question number + timer */}
                            <div className="flex items-center justify-between mb-6">
                                <span className="text-sm font-bold text-indigo-400 bg-indigo-500/20 px-3 py-1 rounded-lg">
                                    Câu {currentQIdx + 1} / {questions.length}
                                </span>
                                {timer > 0 && (
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${timer <= 5 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white/70'}`}>
                                        <Clock size={18} />
                                        {timer}s
                                    </div>
                                )}
                                <span className="text-xs text-white/30">
                                    {totalVotes} phiếu
                                </span>
                            </div>

                            {/* Question title */}
                            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 leading-snug text-white/95">
                                {currentQ.title}
                            </h2>

                            {/* Bar chart */}
                            <div className="h-[350px] w-full bg-white/[0.03] rounded-2xl p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                        <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: '#ffffff08' }}
                                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px', fontSize: 14, fontWeight: 600 }}
                                            labelStyle={{ color: '#94a3b8' }}
                                        />
                                        <Bar dataKey="votes" radius={[10, 10, 0, 0]} animationDuration={600} barSize={60}>
                                            {chartData.map((_: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </main>

                    {/* Bottom control bar */}
                    <footer className="h-20 bg-[#1a1a2e] border-t border-white/5 flex items-center justify-between px-8">
                        <span className="text-white/30 font-mono text-sm">
                            Slide {currentQIdx + 1} / {questions.length}
                        </span>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => goToQuestion(currentQIdx - 1)}
                                disabled={currentQIdx === 0}
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/70 hover:text-white transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {currentQIdx === questions.length - 1 ? (
                                <button
                                    onClick={handleEnd}
                                    className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-rose-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-red-500/20 active:scale-[0.97]"
                                >
                                    <Square size={18} /> Kết thúc
                                </button>
                            ) : (
                                <button
                                    onClick={() => goToQuestion(currentQIdx + 1)}
                                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.97]"
                                >
                                    Câu tiếp <ChevronRight size={18} />
                                </button>
                            )}

                            <button
                                onClick={() => goToQuestion(currentQIdx + 1)}
                                disabled={currentQIdx >= questions.length - 1}
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 text-white/70 hover:text-white transition-all"
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
                        <p className="text-lg text-white/50">Session đã được lưu. Bạn có thể xem kết quả hoặc reset.</p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowResetConfirm(true)}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <RotateCcw size={18} /> Reset kết quả
                        </button>
                        <button
                            onClick={fetchHistory}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all"
                        >
                            <History size={18} /> Xem lịch sử
                        </button>
                        <button
                            onClick={() => router.push('/presenter/dashboard')}
                            className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            Về Dashboard
                        </button>
                    </div>
                </main>
            )}

            {/* ═══ RESET CONFIRM MODAL ═══ */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setShowResetConfirm(false)}>
                    <div className="bg-[#1e1e2e] rounded-2xl border border-white/10 w-full max-w-sm p-8 text-center" onClick={(e) => e.stopPropagation()}>
                        <AlertTriangle size={40} className="mx-auto text-amber-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Reset kết quả?</h3>
                        <p className="text-sm text-white/50 mb-6">Tất cả phiếu trả lời và danh sách người tham gia sẽ bị xoá. Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold hover:bg-white/10 transition-all">
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
                    <div className="w-full max-w-md bg-[#1a1a2e] h-full overflow-y-auto border-l border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <History size={20} className="text-indigo-400" /> Lịch sử hoạt động
                            </h3>
                            <button onClick={() => setShowHistory(false)} className="text-white/40 hover:text-white text-sm font-bold">Đóng</button>
                        </div>

                        {activityLogs.length === 0 ? (
                            <p className="text-white/30 text-sm text-center py-12">Chưa có hoạt động nào</p>
                        ) : (
                            <div className="space-y-3">
                                {activityLogs.map((log: any) => (
                                    <div key={log.id} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                        <div className="flex items-center gap-2 mb-1">
                                            <LogActionBadge action={log.action} />
                                        </div>
                                        <p className="text-xs text-white/30 mt-1">
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                        {log.details && (
                                            <p className="text-xs text-white/20 mt-1 font-mono">{JSON.stringify(log.details)}</p>
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

function LogActionBadge({ action }: { action: string }) {
    const map: Record<string, { label: string; color: string }> = {
        SESSION_STARTED: { label: '▶ Session bắt đầu', color: 'text-emerald-400 bg-emerald-500/20' },
        SESSION_ENDED: { label: '⏹ Session kết thúc', color: 'text-red-400 bg-red-500/20' },
        RESULTS_RESET: { label: '🔄 Đã reset kết quả', color: 'text-amber-400 bg-amber-500/20' },
        QUESTION_NAVIGATED: { label: '➡ Chuyển câu hỏi', color: 'text-blue-400 bg-blue-500/20' },
        PARTICIPANT_JOINED: { label: '👤 Người tham gia mới', color: 'text-indigo-400 bg-indigo-500/20' },
    };
    const info = map[action] || { label: action, color: 'text-white/50 bg-white/5' };
    return <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${info.color}`}>{info.label}</span>;
}
