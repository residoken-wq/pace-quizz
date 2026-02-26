"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Users, Play, Pause, ChevronRight } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PresenterDashboard() {
    const params = useParams();
    const sessionId = params.id as string;
    const { socket, isConnected } = useSocket();

    const [participantsCount, setParticipantsCount] = useState(0);
    const [votes, setVotes] = useState<Record<string, number>>({});

    // Mock current question
    const currentQuestion = {
        id: 'q1',
        title: 'What is the biggest challenge in your B2B sales process?',
        options: [
            { id: 'opt1', text: 'Lead Generation' },
            { id: 'opt2', text: 'Closing Deals' },
            { id: 'opt3', text: 'Customer Retention' },
        ]
    };

    useEffect(() => {
        if (!socket || !isConnected) return;

        // Presenter joins the room to receive votes
        socket.emit('join_session', { sessionId, role: 'host' });

        socket.on('participant_joined', () => {
            setParticipantsCount(prev => prev + 1);
        });

        socket.on('new_vote', (data: { clientId: string, questionId: string, answer: { optionId: string } }) => {
            if (data.questionId === currentQuestion.id) {
                setVotes(prev => ({
                    ...prev,
                    [data.answer.optionId]: (prev[data.answer.optionId] || 0) + 1
                }));
            }
        });

        return () => {
            socket.off('participant_joined');
            socket.off('new_vote');
        };
    }, [socket, isConnected, sessionId]);

    const handleNextSlide = () => {
        if (!socket) return;
        // Broadcast state to all users
        socket.emit('host_state_update', {
            sessionId,
            questionId: currentQuestion.id,
            title: currentQuestion.title,
            type: 'MULTIPLE_CHOICE',
            options: currentQuestion.options,
            status: 'ACTIVE'
        });
    };

    // Prepare chart data
    const chartData = currentQuestion.options.map(opt => ({
        name: opt.text,
        votes: votes[opt.id] || 0,
    }));

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col font-sans">
            {/* Top Header */}
            <header className="px-8 py-6 flex justify-between items-center border-b border-gray-800">
                <div>
                    <h1 className="text-xl font-bold text-gray-400">Pace Quizz Presenter</h1>
                    <p className="text-3xl font-black mt-1">Join at <span className="text-blue-500">pace-quizz.com</span> with PIN: <span className="bg-white text-black px-4 py-1 rounded-lg ml-2">{sessionId.substring(0, 6)}</span></p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
                        <Users size={20} className="text-blue-400" />
                        <span className="font-bold text-xl">{participantsCount}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-bold ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="w-full max-w-6xl">
                    <h2 className="text-4xl sm:text-5xl font-bold text-center mb-16 leading-tight">
                        {currentQuestion.title}
                    </h2>

                    <div className="h-[400px] w-full mt-8">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                                <XAxis dataKey="name" tick={{ fill: '#aaa', fontSize: 16 }} axisLine={false} tickLine={false} />
                                <YAxis allowDecimals={false} tick={{ fill: '#aaa' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#222' }} contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }} />
                                <Bar dataKey="votes" radius={[8, 8, 0, 0]} animationDuration={1000}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>

            {/* Bottom Control Bar */}
            <footer className="h-20 bg-gray-900 border-t border-gray-800 flex items-center justify-center px-8 relative">
                <div className="absolute left-8 text-gray-500 font-mono text-sm">
                    Slide 1 of 12
                </div>

                <div className="flex items-center gap-4">
                    <button className="p-4 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white">
                        <Pause size={24} />
                    </button>
                    <button
                        onClick={handleNextSlide}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-transform active:scale-95"
                    >
                        Start & Sync Screen <ChevronRight size={20} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
