import React from 'react';
import { Plus, CheckCircle2, Trash2, AlertCircle } from 'lucide-react';

export type Option = {
    id: string;
    text: string;
    isCorrect?: boolean;
};

const OPTION_THEMES = [
    { bg: 'bg-blue-50', border: 'border-blue-300', accent: 'bg-blue-600', label: 'bg-blue-600', letter: 'text-white' },
    { bg: 'bg-red-50', border: 'border-red-300', accent: 'bg-red-500', label: 'bg-red-500', letter: 'text-white' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', accent: 'bg-emerald-600', label: 'bg-emerald-600', letter: 'text-white' },
    { bg: 'bg-amber-50', border: 'border-amber-300', accent: 'bg-amber-500', label: 'bg-amber-500', letter: 'text-white' },
    { bg: 'bg-purple-50', border: 'border-purple-300', accent: 'bg-purple-600', label: 'bg-purple-600', letter: 'text-white' },
    { bg: 'bg-pink-50', border: 'border-pink-300', accent: 'bg-pink-500', label: 'bg-pink-500', letter: 'text-white' },
];

export function MultipleChoiceEditor({ options, onChange }: { options: Option[]; onChange: (opts: Option[]) => void }) {
    const addOption = () => {
        onChange([...options, { id: crypto.randomUUID(), text: '', isCorrect: false }]);
    };

    const removeOption = (idx: number) => {
        if (options.length <= 2) return;
        onChange(options.filter((_, i) => i !== idx));
    };

    const updateOption = (idx: number, updates: Partial<Option>) => {
        onChange(options.map((o, i) => i === idx ? { ...o, ...updates } : o));
    };

    const toggleCorrect = (idx: number) => {
        onChange(options.map((o, i) => ({ ...o, isCorrect: i === idx })));
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                    <span className="text-lg">🎯</span>
                    <label className="text-sm font-bold text-slate-700">Các đáp án</label>
                    <span className="text-[11px] text-slate-400 font-medium">(nhấn ● để chọn đáp án đúng)</span>
                </div>
                <button
                    onClick={addOption}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border border-indigo-200"
                >
                    <Plus size={14} /> Thêm
                </button>
            </div>

            <div className="space-y-3">
                {options.map((opt, idx) => {
                    const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
                    const letter = String.fromCharCode(65 + idx);
                    return (
                        <div
                            key={opt.id}
                            className={`flex items-start gap-3 p-3.5 rounded-xl border-2 transition-all ${opt.isCorrect
                                ? 'border-emerald-400 bg-emerald-50 shadow-md shadow-emerald-100'
                                : `${theme.border} ${theme.bg} hover:shadow-sm`
                                }`}
                        >
                            {/* Letter Badge  */}
                            <div className={`mt-0.5 w-9 h-9 rounded-lg ${opt.isCorrect ? 'bg-emerald-500' : theme.label} flex items-center justify-center shrink-0 shadow-sm`}>
                                <span className="text-white text-sm font-black">{letter}</span>
                            </div>

                            {/* Correct toggle */}
                            <button
                                onClick={() => toggleCorrect(idx)}
                                className={`mt-1.5 shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${opt.isCorrect
                                    ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                                    : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'
                                    }`}
                                title="Đánh dấu đáp án đúng"
                            >
                                {opt.isCorrect && <CheckCircle2 size={15} />}
                            </button>

                            {/* Text input */}
                            <textarea
                                value={opt.text}
                                onChange={(e) => {
                                    e.target.style.height = 'auto';
                                    e.target.style.height = e.target.scrollHeight + 'px';
                                    updateOption(idx, { text: e.target.value });
                                }}
                                placeholder={`Nhập đáp án ${letter}...`}
                                rows={1}
                                className={`flex-1 py-1.5 px-3 rounded-lg border-none bg-transparent outline-none text-sm font-medium resize-none leading-relaxed min-h-[40px] overflow-hidden ${opt.isCorrect ? 'text-emerald-900 placeholder:text-emerald-300' : 'text-slate-800 placeholder:text-slate-300'}`}
                            />

                            {/* Delete button */}
                            {options.length > 2 && (
                                <button
                                    onClick={() => removeOption(idx)}
                                    className="mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                    title="Xoá đáp án"
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Correct answer reminder */}
            {!options.some(o => o.isCorrect) && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">Bạn chưa chọn đáp án đúng. Nhấn vào nút tròn ● bên cạnh đáp án để đánh dấu.</p>
                </div>
            )}
        </div>
    );
}
