import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

export function PodiumLeaderboard({
    leaderboard,
    isDark,
    secondaryTextClass
}: {
    leaderboard: any[];
    isDark: boolean;
    secondaryTextClass: string;
}) {
    return (
        <motion.div
            key="leaderboard"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-4xl"
        >
            <div className={`text-center mb-10`}>
                <Trophy size={64} className="mx-auto text-amber-500 mb-4" />
                <h2 className="text-4xl sm:text-5xl font-black text-amber-500 tracking-tight">Bảng Xếp Hạng</h2>
            </div>
            <div className="flex flex-col gap-4">
                {leaderboard.length === 0 ? (
                    <p className={`text-center ${secondaryTextClass}`}>Chưa có dữ liệu</p>
                ) : (
                    leaderboard.map((player, idx) => (
                        <div key={player.id} className={`flex items-center gap-6 p-6 rounded-2xl ${idx === 0 ? 'bg-amber-500/20 border-2 border-amber-500/50 transform scale-105 shadow-xl' : isDark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-md border border-slate-200'} transition-all`}>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xl ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-orange-400 text-white' : isDark ? 'bg-white/10 text-white/50' : 'bg-slate-100 text-slate-400'}`}>
                                {idx + 1}
                            </div>
                            <div className="text-5xl">{player.mascot}</div>
                            <div className="flex-1">
                                <h3 className={`text-2xl font-black ${idx === 0 ? 'text-amber-500' : ''}`}>{player.nickname}</h3>
                                <p className={`text-sm font-semibold mt-1 ${secondaryTextClass}`}>
                                    {player.correctAnswers} câu đúng • {(player.totalTimeTaken / 1000).toFixed(1)}s
                                </p>
                            </div>
                            <div className={`text-4xl font-black ${idx === 0 ? 'text-amber-500' : secondaryTextClass}`}>
                                {player.correctAnswers * 1000 - Math.round(player.totalTimeTaken / 100)} <span className="text-xl font-bold opacity-50">pts</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );
}
