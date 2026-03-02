"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

type QuestionType = 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE';

type QuestionState = {
    id: string;
    title: string;
    type: QuestionType;
    options: any[];
    status: 'WAITING' | 'ACTIVE' | 'FINISHED';
};

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
}

export default function ParticipantScreen() {
    const params = useParams();
    const pin = params.pin as string;
    const { socket, isConnected } = useSocket();

    const [sessionData, setSessionData] = useState<any>(null);
    const [surveyQuestions, setSurveyQuestions] = useState<any[]>([]);
    const [surveyIdx, setSurveyIdx] = useState(0);
    const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
    const [isSurveyFinished, setIsSurveyFinished] = useState(false);

    // Live mode state
    const [liveState, setLiveState] = useState<QuestionState>({
        id: '', title: 'Đang đợi người chủ trì...', type: 'MULTIPLE_CHOICE', options: [], status: 'WAITING'
    });
    const [selectedLiveOption, setSelectedLiveOption] = useState<string | null>(null);

    // Initial load
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch basic session via PIN
                const res = await fetch(`${getApiUrl()}/sessions/pin/${pin}`);
                if (res.ok) {
                    const session = await res.json();
                    setSessionData(session);

                    if (session.type === 'SURVEY') {
                        // Preload all questions for survey
                        const qRes = await fetch(`${getApiUrl()}/questions/session/${session.id}`);
                        if (qRes.ok) {
                            setSurveyQuestions(await qRes.json());
                        }
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

    // Socket listeners
    useEffect(() => {
        if (!socket || !isConnected) return;
        socket.emit('join_session', { sessionId: pin, role: 'participant' });

        socket.on('state_sync', (data: QuestionState) => {
            if (sessionData?.type === 'SURVEY') {
                if (data.status === 'ACTIVE') {
                    setLiveState(prev => ({ ...prev, status: 'ACTIVE' }));
                } else if (data.status === 'FINISHED') {
                    setLiveState(prev => ({ ...prev, status: 'FINISHED' }));
                }
            } else {
                setLiveState(data);
                setSelectedLiveOption(null); // Reset choice on new slide
            }
        });

        return () => { socket.off('state_sync'); };
    }, [socket, isConnected, pin, sessionData]);

    const handleLiveVote = (optionId: string) => {
        if (!socket || !liveState.id) return;
        setSelectedLiveOption(optionId);
        socket.emit('submit_vote', {
            sessionId: pin,
            questionId: liveState.id,
            answer: { optionId }
        });
    };

    const handleSurveyVote = (optionId: string) => {
        const currentQ = surveyQuestions[surveyIdx];
        if (!currentQ || surveyAnswers[currentQ.id]) return;

        setSurveyAnswers(prev => ({ ...prev, [currentQ.id]: optionId }));

        if (socket) {
            socket.emit('submit_vote', {
                sessionId: pin,
                questionId: currentQ.id,
                answer: { optionId }
            });
        }

        // Auto advance after short delay
        setTimeout(() => {
            if (surveyIdx < surveyQuestions.length - 1) {
                setSurveyIdx(prev => prev + 1);
            } else {
                setIsSurveyFinished(true);
            }
        }, 600);
    };

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
                <div className="w-24 h-24 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg border border-white/30 relative">
                    <div className="absolute inset-0 rounded-full border-t-2 border-white animate-spin"></div>
                    <Loader2 className="w-8 h-8 opacity-0" />
                    <span className="text-3xl">👋</span>
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white drop-shadow-md mb-2">Bạn đã tham gia!</h2>
                    <p className="text-white/80 text-lg font-medium drop-shadow">Đang chờ người chủ trò bắt đầu...</p>
                </div>
            </motion.div>
        );
    };

    const renderFinishedScreen = () => {
        return (
            <motion.div
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
                <div className="w-28 h-28 bg-emerald-500/20 backdrop-blur-xl text-emerald-400 rounded-full flex items-center justify-center shadow-2xl border border-emerald-500/30 mb-8 mx-auto">
                    <CheckCircle2 className="w-14 h-14" />
                </div>
                <h2 className="text-4xl font-black text-white drop-shadow-lg mb-4">Hoàn thành!</h2>
                <p className="text-xl text-white/90 font-medium drop-shadow-md max-w-sm mx-auto leading-relaxed">
                    {sessionData?.thankYouMessage || "Cảm ơn bạn đã tham gia tương tác."}
                </p>
            </motion.div>
        );
    };

    const renderLiveQuestion = () => {
        return (
            <motion.div
                key="live-active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col flex-1 w-full max-w-md mx-auto justify-center pb-12"
            >
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-snug drop-shadow-sm text-center">
                        {liveState.title}
                    </h2>
                    <div className="space-y-4">
                        {liveState.options.map((option, idx) => (
                            <button
                                key={option.id || idx}
                                onClick={() => handleLiveVote(option.id)}
                                disabled={selectedLiveOption !== null}
                                className={`w-full p-4 sm:p-5 text-left rounded-2xl border-2 transition-all duration-300 transform active:scale-[0.98] ${selectedLiveOption === option.id
                                    ? 'border-indigo-400 bg-indigo-500/90 text-white shadow-lg ring-4 ring-indigo-500/30'
                                    : selectedLiveOption !== null
                                        ? 'border-white/10 bg-white/5 text-white/50 cursor-not-allowed'
                                        : 'border-white/20 bg-white/10 text-white hover:bg-white/20 hover:border-white/40'
                                    }`}
                            >
                                <span className="text-lg font-semibold block break-words">{option.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    };

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
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-teal-500/20 rounded-full blur-3xl"></div>

                        <span className="inline-block px-3 py-1 bg-white/10 text-teal-300 text-xs font-black uppercase tracking-widest rounded-full mb-6 border border-white/10 backdrop-blur-md">
                            Câu {surveyIdx + 1} / {surveyQuestions.length}
                        </span>

                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 leading-snug drop-shadow-sm">
                            {currentQ.title}
                        </h2>

                        <div className="space-y-4">
                            {currentQ.options.map((option: any, idx: number) => {
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

    // Determine current view
    let currentView;
    if (sessionData?.type === 'SURVEY') {
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
        } else {
            currentView = renderLiveQuestion();
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col pt-6 sm:pt-12 p-4 relative overflow-hidden font-sans">
            {/* Dynamic ambient background gradients behind the content */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-500/20 blur-[100px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-teal-500/20 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="flex-1 w-full flex flex-col z-10">
                {/* Header Indicator */}
                <div className="flex justify-between items-center mb-8 max-w-md mx-auto w-full">
                    <div className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full shadow-lg text-sm font-bold text-white tracking-widest">
                        PIN: {pin}
                    </div>
                    <div className="flex items-center gap-2.5 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-lg">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className={`text-xs font-black uppercase tracking-wider ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isConnected ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Dynamic State Content */}
                <AnimatePresence mode="wait">
                    {currentView}
                </AnimatePresence>
            </div>
        </div>
    );
}
