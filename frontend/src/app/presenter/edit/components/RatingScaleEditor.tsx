import React from 'react';

export function RatingScaleEditor({ config, onChange }: { config: { min: number; max: number; step: number }; onChange: (cfg: any) => void }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5 mb-4">
                <span className="text-lg">⭐</span>
                <label className="text-sm font-bold text-slate-700">Cấu hình thang đánh giá</label>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Giá trị nhỏ nhất</label>
                    <input
                        type="number"
                        value={config.min}
                        onChange={(e) => onChange({ ...config, min: parseInt(e.target.value) || 0 })}
                        className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-center font-bold text-slate-800 text-lg"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Giá trị lớn nhất</label>
                    <input
                        type="number"
                        value={config.max}
                        onChange={(e) => onChange({ ...config, max: parseInt(e.target.value) || 5 })}
                        className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-center font-bold text-slate-800 text-lg"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Bước nhảy</label>
                    <input
                        type="number"
                        value={config.step}
                        onChange={(e) => onChange({ ...config, step: parseInt(e.target.value) || 1 })}
                        className="w-full py-2.5 px-3 rounded-xl border-2 border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-center font-bold text-slate-800 text-lg"
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Xem trước</p>
                <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: Math.ceil((config.max - config.min) / config.step) + 1 }, (_, i) => config.min + i * config.step)
                        .filter(v => v <= config.max)
                        .map((val, i, arr) => (
                            <div
                                key={val}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black transition-all hover:scale-110 cursor-default shadow-sm ${i === arr.length - 1
                                    ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200'
                                    : 'bg-amber-50 border-2 border-amber-200 text-amber-700'
                                    }`}
                            >
                                {val}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
