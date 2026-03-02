import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2 } from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function LiveQuestionChart({
    chartData,
    showCorrectAnswer,
    isDark,
    cardBgClass,
    secondaryTextClass
}: {
    chartData: any[];
    showCorrectAnswer: boolean;
    isDark: boolean;
    cardBgClass: string;
    secondaryTextClass: string;
}) {
    return (
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            {/* Bar chart */}
            <div className={`h-[350px] flex-1 rounded-2xl p-4 sm:p-6 ${cardBgClass} ${showCorrectAnswer ? 'opacity-60' : ''}`}>
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
                            {chartData.map((d: any, index: number) => {
                                let barColor = COLORS[index % COLORS.length];
                                if (showCorrectAnswer) {
                                    barColor = d.isCorrect ? '#10b981' : (isDark ? '#334155' : '#cbd5e1'); // Highlight correct, dim others
                                }
                                return <Cell key={`cell-${index}`} fill={barColor} />;
                            })}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Answers Legend */}
            <div className={`flex-[0.8] rounded-2xl p-6 ${cardBgClass} self-stretch flex flex-col justify-center`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider mb-5 ${secondaryTextClass}`}>Các Đáp Án</h3>
                <div className="space-y-4">
                    {chartData.map((data: any, index: number) => {
                        const isActiveHighlight = showCorrectAnswer && data.isCorrect;
                        const isDimmed = showCorrectAnswer && !data.isCorrect;

                        return (
                            <div key={index} className={`flex items-start gap-4 p-3 rounded-xl transition-all ${isActiveHighlight ? 'bg-emerald-500/20 ring-2 ring-emerald-500 scale-[1.02]' : isDimmed ? 'opacity-30' : 'hover:bg-slate-500/5'}`}>
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-white font-black text-lg shadow-sm ${isActiveHighlight ? 'bg-emerald-500' : ''}`}
                                    style={!isActiveHighlight ? { backgroundColor: COLORS[index % COLORS.length] } : {}}
                                >
                                    {data.name}
                                </div>
                                <div className="flex-1 mt-0.5 min-w-0">
                                    <p className={`text-base break-words leading-relaxed ${isActiveHighlight ? 'font-black text-emerald-500' : 'font-semibold'}`}>
                                        {data.fullText}
                                    </p>
                                    <p className={`text-sm mt-1 font-bold ${isActiveHighlight ? 'text-emerald-600/70' : secondaryTextClass}`}>{data.votes} phiếu</p>
                                </div>
                                {isActiveHighlight && <CheckCircle2 className="text-emerald-500 mt-2" size={24} />}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
