import React from 'react';
import { motion } from 'framer-motion';

export function WordCloudDisplay({
    data,
    isDark,
    cardBgClass
}: {
    data: any[];
    isDark: boolean;
    cardBgClass: string;
}) {
    if (!data || data.length === 0) {
        return (
            <div className={`h-[350px] flex items-center justify-center rounded-2xl p-6 ${cardBgClass}`}>
                <p className="text-slate-400 font-medium text-lg">Chưa có câu trả lời nào được gửi.</p>
            </div>
        );
    }

    const maxVotes = Math.max(...data.map(d => d.value));

    // Vibrant colors for the word cloud
    const colors = isDark
        ? ['text-indigo-400', 'text-emerald-400', 'text-amber-400', 'text-rose-400', 'text-cyan-400', 'text-fuchsia-400']
        : ['text-indigo-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500', 'text-cyan-500', 'text-fuchsia-500'];

    return (
        <div className={`min-h-[350px] flex flex-wrap items-center justify-center gap-4 rounded-2xl p-8 ${cardBgClass} overflow-hidden shadow-inner`}>
            {data.map((item, index) => {
                // Calculate font size relative to max votes (min: 1.5rem, max: 4rem)
                const sizeRatio = item.value / maxVotes;
                const baseSize = 1.5;
                const maxSize = 4.5;
                const fontSize = `${baseSize + (maxSize - baseSize) * sizeRatio}rem`;

                const color = colors[index % colors.length];

                return (
                    <motion.div
                        key={item.text}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        style={{ fontSize }}
                        className={`font-black ${color} relative group`}
                    >
                        <span className="drop-shadow-sm transition-all duration-300 hover:scale-110 cursor-default">
                            {item.text}
                        </span>

                        {/* Vote count tooltip on hover */}
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap z-10 shadow-lg pointer-events-none">
                            {item.value} phiếu
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
