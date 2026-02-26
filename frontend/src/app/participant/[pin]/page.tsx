"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { motion, AnimatePresence } from 'framer-motion';

// Mock types
type QuestionState = {
    id: string;
    title: string;
    type: 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE';
    options: any[];
    status: 'WAITING' | 'ACTIVE' | 'FINISHED';
};

export default function ParticipantScreen() {
    const params = useParams();
    const pin = params.pin as string;
    const { socket, isConnected } = useSocket();

    const [sessionState, setSessionState] = useState<QuestionState>({
        id: '', title: 'Waiting for presenter to start...', type: 'MULTIPLE_CHOICE', options: [], status: 'WAITING'
    });

    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Join the room upon connecting
        socket.emit('join_session', { sessionId: pin, role: 'participant' });

        // Listen to presenter transitions
        socket.on('state_sync', (data: QuestionState) => {
            setSessionState(data);
            setSelectedOption(null); // Reset choice on new slide
        });

        return () => {
            socket.off('state_sync');
        };
    }, [socket, isConnected, pin]);

    const handleVote = (optionId: string) => {
        setSelectedOption(optionId);
        if (socket) {
            socket.emit('submit_vote', {
                sessionId: pin,
                questionId: sessionState.id,
                answer: { optionId }
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-12 p-4">
            <div className="flex-1 w-full max-w-lg mx-auto flex flex-col">
                {/* Header Indicator */}
                <div className="flex justify-between items-center mb-8">
                    <div className="px-4 py-2 bg-white rounded-full shadow-sm text-sm font-bold text-gray-500">
                        PIN: {pin}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        </span>
                        <span className="text-xs font-semibold text-gray-400">Live</span>
                    </div>
                </div>

                {/* Dynamic State Content */}
                <AnimatePresence mode="popLayout">
                    {sessionState.status === 'WAITING' ? (
                        <motion.div
                            key="waiting"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex-1 flex flex-col items-center justify-center text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">You're in!</h2>
                            <p className="text-gray-500 text-lg">See your nickname on screen. Waiting for the host to start...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="active"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col"
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8">{sessionState.title}</h2>

                            <div className="space-y-4">
                                {sessionState.options.map((option, idx) => (
                                    <button
                                        key={option.id || idx}
                                        onClick={() => handleVote(option.id)}
                                        disabled={selectedOption !== null}
                                        className={`w-full p-6 text-left rounded-2xl shadow-sm border-2 transition-all active:scale-[0.98]
                      ${selectedOption === option.id
                                                ? 'border-blue-500 bg-blue-50 ring-4 ring-blue-100'
                                                : selectedOption !== null
                                                    ? 'border-gray-200 bg-gray-50 opacity-60'
                                                    : 'border-white bg-white hover:border-blue-200 hover:shadow-md'
                                            }
                    `}
                                    >
                                        <span className="text-xl font-semibold text-gray-800">{option.text}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
