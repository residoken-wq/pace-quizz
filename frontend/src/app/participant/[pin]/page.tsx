"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';

type QuestionType = 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE' | 'POLL';

interface QuestionState {
    id: string;
    title: string;
    type: QuestionType;
    options: any[];
    status: 'WAITING' | 'ACTIVE' | 'FINISHED' | 'CREATED';
    showCorrectAnswer?: boolean;
    showLeaderboard?: boolean;
    leaderboard?: any[];
    timeLimit?: number;
};

const MASCOTS = ['🐶', '🐱', '🦊', '🐼', '🐨', '🐯', '🐰', '🐸', '🦄', '🦖', '🐙', '👾'];

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
}

export default function ParticipantScreen() {
    const params = useParams();
    const pin = params.pin as string;
    const { socket, isConnected } = useSocket();

    // Session states
    const [sessionData, setSessionData] = useState<any>(null);
    const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);

    // Join & Identity states
    const [hasJoined, setHasJoined] = useState(false);
    const [participantId, setParticipantId] = useState<string | null>(null);
    const [nickname, setNickname] = useState('');
    const [mascot, setMascot] = useState('🐶');
    const [isJoining, setIsJoining] = useState(false);

    // Live mode state
    const [liveState, setLiveState] = useState<QuestionState>({
        id: '', title: 'Đang đợi người chủ trì...', type: 'MULTIPLE_CHOICE', options: [], status: 'WAITING'
    });
    const [selectedLiveOption, setSelectedLiveOption] = useState<string | null>(null);
    const [liveTextAnswer, setLiveTextAnswer] = useState<string>('');

    // Survey mode state
    const [surveyIdx, setSurveyIdx] = useState(0);
    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
    const [isSurveyFinished, setIsSurveyFinished] = useState(false);

    // Timing
    const [qStartTime, setQStartTime] = useState<number>(Date.now());
    const [timer, setTimer] = useState<number>(0);

    // Timer countdown effect
    useEffect(() => {
        if (liveState.status === 'ACTIVE' && liveState.timeLimit && liveState.timeLimit > 0 && timer > 0) {
            const interval = setInterval(() => {
                setTimer(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [liveState.status, liveState.timeLimit, timer]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const res = await fetch(`${getApiUrl()}/sessions/pin/${pin}`);
                if (res.ok) {
                    const session = await res.json();
                    setSessionData(session);

                    if (session.type === 'SURVEY') {
                        const qRes = await fetch(`${getApiUrl()}/questions/session/${session.id}`);
                        if (qRes.ok) setSurveyQuestions(await qRes.json());
                        if (session.status === 'ACTIVE') {
                            setLiveState(prev => ({ ...prev, status: 'ACTIVE' }));
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load session:", err);
            }
        };
        fetchInitialData();
    }, [pin]);

    useEffect(() => {
        if (!hasJoined || !socket || !isConnected) return;
        socket.emit('join_session', { sessionId: pin, role: 'participant' });

        socket.on('state_sync', (data: any) => {
            if (data.status === 'CREATED') {
                // Return to join screen
                setHasJoined(false);
                if (sessionData?.type === 'SURVEY') {
                    setSurveyAnswers({});
                    setSurveyIdx(0);
                    setIsSurveyFinished(false);
                } else {
                    setSelectedLiveOption(null);
                }
                return;
            }

            if (sessionData?.type === 'SURVEY') {
                if (data.status === 'ACTIVE') setLiveState(prev => ({ ...prev, status: 'ACTIVE' }));
                else if (data.status === 'FINISHED') setLiveState(prev => ({ ...prev, status: 'FINISHED' }));
            } else {
                setLiveState(prev => {
                    const newId = data.questionId || data.id;
                    if (prev.id !== newId) {
                        setSelectedLiveOption(null);
                        setLiveTextAnswer('');
                        setQStartTime(Date.now()); // reset timer for new question
                        if (data.timeLimit && data.timeLimit > 0) {
                            setTimer(data.timeLimit);
                        } else {
                            setTimer(0);
                        }
                    }
                    return { ...prev, ...data, id: newId };
                });
            }
        });

        return () => { socket.off('state_sync'); };
    }, [hasJoined, socket, isConnected, pin, sessionData]);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nickname.trim()) return;
        setIsJoining(true);

        try {
            const res = await fetch(`${getApiUrl()}/sessions/pin/${pin}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nickname, mascot })
            });

            if (res.ok) {
                const data = await res.json();
                setParticipantId(data.id);
                setHasJoined(true);
                setQStartTime(Date.now()); // For the first question if it's already active
            }
        } catch (err) {
            console.error('Failed to join:', err);
        } finally {
            setIsJoining(false);
        }
    };

    const submitAnswerToBackend = async (questionId: string, payload: { optionId?: string, text?: string }) => {
        if (!participantId) return;

        const timeTaken = Math.max(0, Date.now() - qStartTime);

        try {
            await fetch(`${getApiUrl()}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    participantId,
                    questionId,
                    answer: payload,
                    timeTaken
                })
            });
        } catch (e) { console.error('Error recording response', e); }
    };

    const handleLiveVote = async (optionId?: string, text?: string) => {
        if (!socket || !liveState.id) return;

        if (optionId) setSelectedLiveOption(optionId);

        const payload = optionId ? { optionId } : { text };

        // Broadcast over socket and save concurrently
        socket.emit('submit_vote', {
            sessionId: pin,
            questionId: liveState.id,  // fixed bug
            answer: payload
        });

        await submitAnswerToBackend(liveState.id, payload);
    };

    const handleSurveyVote = async (optionId?: string, text?: string) => {
        const currentQ = surveyQuestions[surveyIdx];
        if (!currentQ || surveyAnswers[currentQ.id]) return;

        const payload = optionId ? { optionId } : { text };
        setSurveyAnswers(prev => ({ ...prev, [currentQ.id]: optionId || text || '' }));

        if (socket) {
            socket.emit('submit_vote', {
                sessionId: pin,
                questionId: currentQ.id,
                answer: payload
            });
        }

        await submitAnswerToBackend(currentQ.id, payload);

        setTimeout(() => {
            if (surveyIdx < surveyQuestions.length - 1) {
                setSurveyIdx(prev => prev + 1);
                setQStartTime(Date.now());
            } else {
                setIsSurveyFinished(true);
            }
        }, 600);
    };

    // ─── RENDERS ───

    const renderJoinScreen = () => (
        <motion.div
            key="join"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-md mx-auto"
        >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 w-full text-center">
                <h2 className="text-3xl font-black text-white mb-2">Pace Quizz</h2>
                <p className="text-white/70 mb-8 font-medium">Chọn một ngoại hình và tên để tham gia</p>

                <form onSubmit={handleJoin} className="space-y-6">
                    <div>
                        <div className="text-6xl mb-6 bg-white/10 w-28 h-28 mx-auto rounded-full flex items-center justify-center shadow-inner border border-white/20">
                            {mascot}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-6 p-4 bg-black/20 rounded-2xl">
                            {MASCOTS.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMascot(m)}
                                    className={`text-3xl p-2 rounded-xl transition-all ${mascot === m ? 'bg-white/20 scale-110 shadow-lg' : 'hover:bg-white/10 opacity-70 hover:opacity-100'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <input
                        required
                        type="text"
                        placeholder="Nhập tên của bạn..."
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        className="w-full bg-white/20 border-2 border-white/30 text-white placeholder-white/50 rounded-xl px-4 py-4 text-xl font-bold text-center focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/50 transition-all"
                    />

                    <button
                        type="submit"
                        disabled={!nickname.trim() || isJoining}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black text-xl py-4 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
                    >
                        {isJoining ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : "Vào ngay!"}
                    </button>
                </form>
            </div>
        </motion.div>
    );

    const renderWaitingScreen = () => {
        const hasBanner = sessionData?.type === 'SURVEY' && sessionData?.bannerUrl;
        return (
            <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
            >
                {hasBanner && (
                    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-white/20 mb-6">
                        <img src={`${getApiUrl()}${sessionData.bannerUrl}`} alt="Survey Banner" className="w-full h-auto object-cover" />
                    </motion.div>
                )}
                <div className="text-6xl bg-white/10 w-32 h-32 rounded-full flex items-center justify-center shadow-lg border border-white/30 relative">
                    <div className="absolute inset-0 rounded-full border-t-2 border-white/50 animate-spin"></div>
                    {mascot}
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">Xin chào {nickname}!</h2>
                    <p className="text-white/80 text-lg font-medium drop-shadow">Đang chờ người chủ trò bắt đầu...</p>
                </div>
            </motion.div>
        );
    };

    const renderFinishedScreen = () => (
        <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-8"
        >
            <div className="text-6xl bg-emerald-500/20 backdrop-blur-xl text-emerald-400 w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border border-emerald-500/30 mb-8 mx-auto relative overflow-hidden">
                {mascot}
                <CheckCircle2 className="absolute bottom-1 right-1 w-8 h-8 text-emerald-400 bg-slate-900 rounded-full" />
            </div>
            <h2 className="text-4xl font-black text-white drop-shadow-lg mb-4">Hoàn thành!</h2>
            <p className="text-xl text-white/90 font-medium drop-shadow-md max-w-sm mx-auto leading-relaxed">
                {sessionData?.thankYouMessage || "Tuyệt vời! Cảm ơn bạn đã tham gia tương tác."}
            </p>
        </motion.div>
    );

    const renderLiveQuestion = () => (
        <motion.div
            key="live-active"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col flex-1 w-full max-w-md mx-auto py-4 sm:py-6"
        >
            {/* Timer Bar */}
            {liveState.timeLimit && liveState.timeLimit > 0 ? (
                <div className="w-full bg-white/10 rounded-full h-3 mb-6 relative overflow-hidden backdrop-blur-sm self-start shadow-sm border border-white/10">
                    <div
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-linear ${timer <= 5 ? 'bg-red-500' : timer <= 10 ? 'bg-amber-400' : 'bg-indigo-400'}`}
                        style={{ width: `${(timer / liveState.timeLimit) * 100}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mix-blend-difference drop-shadow-md">
                        {timer}s
                    </div>
                </div>
            ) : null}

            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 flex-1 flex flex-col justify-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-snug drop-shadow-sm text-center">
                    {liveState.title}
                </h2>
                {liveState.type === 'WORD_CLOUD' ? (
                    <div className="space-y-4 flex flex-col items-center w-full">
                        <input
                            type="text"
                            value={liveTextAnswer}
                            onChange={(e) => setLiveTextAnswer(e.target.value)}
                            disabled={selectedLiveOption !== null || liveState.showCorrectAnswer}
                            placeholder="Nhập câu trả lời của bạn..."
                            className="w-full text-lg p-5 rounded-2xl border-2 border-white/20 bg-white/10 text-white placeholder-white/50 focus:border-indigo-400 focus:bg-white/20 outline-none transition-all text-center font-semibold"
                            maxLength={30}
                        />
                        <button
                            onClick={() => {
                                if (liveTextAnswer.trim()) {
                                    setSelectedLiveOption('submitted'); // hack to freeze input
                                    handleLiveVote(undefined, liveTextAnswer);
                                }
                            }}
                            disabled={!liveTextAnswer.trim() || selectedLiveOption !== null || liveState.showCorrectAnswer}
                            className="w-full py-4 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-95"
                        >
                            {selectedLiveOption !== null ? 'Đã gửi' : 'Gửi đáp án'}
                        </button>
                    </div>
                ) : liveState.type === 'RATING_SCALE' ? (
                    <div className="space-y-4 flex flex-col items-center w-full">
                        {(() => {
                            const cfg = (liveState.options as any) || { min: 1, max: 5, step: 1 };
                            const values: number[] = [];
                            for (let v = cfg.min; v <= cfg.max; v += cfg.step) values.push(v);
                            return (
                                <div className="flex items-center gap-3 flex-wrap justify-center">
                                    {values.map((val) => {
                                        const isSelected = selectedLiveOption === String(val);
                                        return (
                                            <button
                                                key={val}
                                                onClick={() => {
                                                    setSelectedLiveOption(String(val));
                                                    handleLiveVote(undefined, String(val));
                                                }}
                                                disabled={selectedLiveOption !== null}
                                                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-300 transform active:scale-[0.9] ${isSelected
                                                        ? 'bg-amber-500 text-white shadow-lg ring-4 ring-amber-500/30 scale-110'
                                                        : selectedLiveOption !== null
                                                            ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                                            : 'bg-white/10 text-white border-2 border-white/20 hover:bg-amber-500/20 hover:border-amber-400/50 hover:scale-110'
                                                    }`}
                                            >
                                                {val}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                        {selectedLiveOption !== null && (
                            <p className="text-amber-400 font-bold text-sm mt-2">⭐ Bạn đã chọn: {selectedLiveOption}</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {liveState.options.map((option, idx) => {
                            const isCorrect = option.isCorrect;
                            const reveal = liveState.showCorrectAnswer;
                            const isSelected = selectedLiveOption === option.id;

                            let btnClass = isSelected
                                ? 'border-indigo-400 bg-indigo-500/90 text-white shadow-lg ring-4 ring-indigo-500/30'
                                : selectedLiveOption !== null
                                    ? 'border-white/10 bg-white/5 text-white/50 cursor-not-allowed'
                                    : 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40';

                            if (reveal) {
                                if (liveState.type === 'POLL') {
                                    // For polls, just highlight the user's pick slightly if revealed, but no right/wrong coloring
                                    btnClass = isSelected
                                        ? 'border-indigo-400 bg-indigo-500/90 text-white shadow-lg ring-4 ring-indigo-500/30 scale-[1.02]'
                                        : 'border-white/10 bg-white/5 text-white/50 cursor-not-allowed opacity-50';
                                } else {
                                    if (isCorrect) {
                                        btnClass = 'border-emerald-400 bg-emerald-500/90 text-white shadow-lg ring-4 ring-emerald-500/30 scale-[1.02]';
                                        if (isSelected) btnClass += ' ring-offset-2 ring-offset-slate-900 border-dashed border-white'; // you got it right!
                                    } else {
                                        btnClass = 'border-white/5 bg-white/5 text-white/30 cursor-not-allowed opacity-50';
                                        if (isSelected) btnClass = 'border-red-500/50 bg-red-500/20 text-red-200/50 cursor-not-allowed border-dashed'; // you picked this wrong
                                    }
                                }
                            }

                            return (
                                <button
                                    key={option.id || idx}
                                    onClick={() => handleLiveVote(option.id)}
                                    disabled={selectedLiveOption !== null || reveal}
                                    className={`w-full p-4 sm:p-5 text-left rounded-2xl border-2 transition-all duration-300 transform active:scale-[0.98] ${btnClass}`}
                                >
                                    <div className="flex justify-between items-center relative">
                                        <span className="text-lg font-semibold block break-words pr-8">{option.text}</span>
                                        {reveal && isCorrect && liveState.type !== 'POLL' && <CheckCircle2 className="text-white shrink-0 absolute right-0" size={24} />}
                                        {reveal && !isCorrect && isSelected && liveState.type !== 'POLL' && <span className="text-red-400 text-sm font-bold absolute right-0">Bạn chọn</span>}
                                        {reveal && isSelected && liveState.type === 'POLL' && <span className="text-white text-sm font-bold absolute right-0">Bạn chọn</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderSurveyQuestion = () => {
        const currentQ = surveyQuestions[surveyIdx];
        if (!currentQ) return renderWaitingScreen();

        const answeredOptionId = surveyAnswers[currentQ.id];
        const progress = ((surveyIdx) / surveyQuestions.length) * 100;

        return (
            <motion.div
                key={`survey-q-${currentQ.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1 w-full max-w-md mx-auto pt-4 pb-12"
            >
                {/* Progress Bar */}
                <div className="w-full bg-white/10 rounded-full h-2.5 mb-8 overflow-hidden backdrop-blur-sm">
                    <div className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>

                <div className="flex-1 flex flex-col justify-center">
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl"></div>

                        <span className="inline-block px-3 py-1 bg-white/10 text-teal-300 text-xs font-black uppercase tracking-widest rounded-full mb-6 border border-white/10 backdrop-blur-md">
                            Câu {surveyIdx + 1} / {surveyQuestions.length}
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-snug drop-shadow-sm">
                            {currentQ.title}
                        </h2>

                        <div className="space-y-4">
                            {currentQ.type === 'RATING_SCALE' ? (() => {
                                const cfg = (currentQ.options as any) || { min: 1, max: 5, step: 1 };
                                const values: number[] = [];
                                for (let v = cfg.min; v <= cfg.max; v += cfg.step) values.push(v);
                                const answeredVal = surveyAnswers[currentQ.id];
                                return (
                                    <div className="flex items-center gap-3 flex-wrap justify-center">
                                        {values.map((val) => {
                                            const isSelected = answeredVal === String(val);
                                            const isDisabled = answeredVal !== undefined;
                                            return (
                                                <button
                                                    key={val}
                                                    onClick={() => handleSurveyVote(undefined, String(val))}
                                                    disabled={isDisabled}
                                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black transition-all duration-300 transform active:scale-[0.9] ${isSelected
                                                            ? 'bg-amber-500 text-white shadow-lg ring-4 ring-amber-500/30 scale-110'
                                                            : isDisabled
                                                                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                                                                : 'bg-white/10 text-white border-2 border-white/20 hover:bg-amber-500/20 hover:border-amber-400/50 hover:scale-110'
                                                        }`}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            })() : currentQ.options.map((option: any, idx: number) => {
                                const isSelected = answeredOptionId === option.id;
                                const isDisabled = answeredOptionId !== undefined;
                                return (
                                    <button
                                        key={option.id || idx}
                                        onClick={() => handleSurveyVote(option.id)}
                                        disabled={isDisabled}
                                        className={`w-full p-4 sm:p-5 text-left rounded-2xl border-2 transition-all duration-300 transform ${isSelected
                                            ? 'border-emerald-400 bg-emerald-500/90 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] ring-2 ring-emerald-400/50 scale-[1.02]'
                                            : isDisabled
                                                ? 'border-white/5 bg-white/5 text-white/40 cursor-not-allowed'
                                                : 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40 active:scale-[0.98]'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-lg font-semibold block break-words pr-4">{option.text}</span>
                                            {isSelected && <CheckCircle2 className="text-white shrink-0" size={20} />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderLeaderboard = () => (
        <motion.div
            key="leaderboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center pb-12"
        >
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 text-center">
                <h2 className="text-3xl font-black text-amber-400 mb-6 drop-shadow-sm">Bảng Xếp Hạng</h2>
                <div className="space-y-3">
                    {liveState.leaderboard?.map((player: any, idx: number) => (
                        <div key={player.id} className={`flex items-center gap-4 p-4 rounded-2xl ${idx === 0 ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-black/20'} transition-all`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-400 text-white' : 'bg-white/10 text-white/50'}`}>
                                {idx + 1}
                            </div>
                            <div className="text-3xl shrink-0">{player.mascot}</div>
                            <div className="flex-1 text-left min-w-0">
                                <h3 className={`text-xl font-bold truncate ${idx === 0 ? 'text-amber-400' : 'text-white'}`}>{player.nickname}</h3>
                                <p className="text-xs text-white/60">
                                    {player.correctAnswers} đúng • {(player.totalTimeTaken / 1000).toFixed(1)}s
                                </p>
                            </div>
                            <div className={`font-black shrink-0 ${idx === 0 ? 'text-amber-400 text-2xl' : 'text-white/80 text-xl'}`}>
                                {player.correctAnswers * 1000 - Math.round(player.totalTimeTaken / 100)} <span className="text-xs">pts</span>
                            </div>
                        </div>
                    ))}
                    {!liveState.leaderboard?.length && <p className="text-white/50 font-bold">Chưa có dữ liệu</p>}
                </div>
            </div>
        </motion.div>
    );

    let currentView;
    if (!hasJoined) {
        currentView = renderJoinScreen();
    } else if (sessionData?.type === 'SURVEY') {
        if (liveState.status === 'FINISHED' || isSurveyFinished) {
            currentView = renderFinishedScreen();
        } else if (liveState.status === 'ACTIVE') {
            currentView = renderSurveyQuestion();
        } else {
            currentView = renderWaitingScreen();
        }
    } else {
        if (liveState.status === 'FINISHED') {
            currentView = renderFinishedScreen();
        } else if (liveState.status === 'WAITING') {
            currentView = renderWaitingScreen();
        } else if (liveState.showLeaderboard) {
            currentView = renderLeaderboard();
        } else {
            currentView = renderLiveQuestion();
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col pt-6 sm:pt-12 p-4 relative overflow-hidden font-sans">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="flex-1 w-full flex flex-col z-10">
                {/* Header Indicator */}
                <div className="flex justify-between items-center mb-4 max-w-md mx-auto w-full">
                    <div className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg text-sm font-bold text-white tracking-widest flex items-center gap-2">
                        <span>PIN: {pin}</span>
                    </div>
                    {hasJoined && (
                        <div className="flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            </span>
                            <span className={`text-xs font-black uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isConnected ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    )}
                </div>

                {hasJoined && nickname && (
                    <div className="max-w-md mx-auto w-full mb-8 text-center text-white/50 text-sm font-bold bg-white/5 rounded-full py-1">
                        {mascot} {nickname}
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {currentView}
                </AnimatePresence>
            </div>
        </div>
    );
}
