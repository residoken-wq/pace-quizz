"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Plus, Save, Trash2, GripVertical, CheckCircle2, Clock,
    MessageSquare, BarChart3, Cloud, Star, AlertCircle, Loader2, Sparkles, Hash
} from 'lucide-react';

type QuestionType = 'MULTIPLE_CHOICE' | 'WORD_CLOUD' | 'RATING_SCALE';

type Option = {
    id: string;
    text: string;
    isCorrect?: boolean;
};

type Question = {
    id?: string;
    title: string;
    order: number;
    type: QuestionType;
    options: Option[] | any;
    timeLimit?: number;
    _isNew?: boolean;
    _isDirty?: boolean;
};

type Session = {
    id: string;
    name: string;
    pin: string;
    type: 'LIVE' | 'SURVEY';
    status: string;
    questions: Question[];
    bannerUrl?: string;
    thankYouMessage?: string;
};

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
}

function getToken() {
    return localStorage.getItem('access_token');
}

/* ─── Vivid color scheme for question types ─── */
const QUESTION_TYPE_CONFIG: Record<QuestionType, {
    label: string; icon: any; emoji: string;
    color: string; textDark: string; bg: string; bgSolid: string;
    gradient: string; border: string;
}> = {
    MULTIPLE_CHOICE: {
        label: 'Trắc nghiệm', icon: CheckCircle2, emoji: '🎯',
        color: 'text-indigo-600', textDark: 'text-indigo-800',
        bg: 'bg-indigo-50', bgSolid: 'bg-indigo-600',
        gradient: 'from-indigo-500 to-blue-600',
        border: 'border-indigo-200',
    },
    WORD_CLOUD: {
        label: 'Word Cloud', icon: Cloud, emoji: '☁️',
        color: 'text-teal-600', textDark: 'text-teal-800',
        bg: 'bg-teal-50', bgSolid: 'bg-teal-600',
        gradient: 'from-teal-500 to-emerald-600',
        border: 'border-teal-200',
    },
    RATING_SCALE: {
        label: 'Thang đánh giá', icon: Star, emoji: '⭐',
        color: 'text-amber-600', textDark: 'text-amber-800',
        bg: 'bg-amber-50', bgSolid: 'bg-amber-600',
        gradient: 'from-amber-500 to-orange-600',
        border: 'border-amber-200',
    },
};

/* ─── Vivid option colors (A, B, C, D…) ─── */
const OPTION_THEMES = [
    { bg: 'bg-blue-50', border: 'border-blue-300', accent: 'bg-blue-600', label: 'bg-blue-600', letter: 'text-white' },
    { bg: 'bg-red-50', border: 'border-red-300', accent: 'bg-red-500', label: 'bg-red-500', letter: 'text-white' },
    { bg: 'bg-emerald-50', border: 'border-emerald-300', accent: 'bg-emerald-600', label: 'bg-emerald-600', letter: 'text-white' },
    { bg: 'bg-amber-50', border: 'border-amber-300', accent: 'bg-amber-500', label: 'bg-amber-500', letter: 'text-white' },
    { bg: 'bg-purple-50', border: 'border-purple-300', accent: 'bg-purple-600', label: 'bg-purple-600', letter: 'text-white' },
    { bg: 'bg-pink-50', border: 'border-pink-300', accent: 'bg-pink-500', label: 'bg-pink-500', letter: 'text-white' },
];

export default function SessionEditor() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params.id as string;

    const [session, setSession] = useState<Session | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sessionRes, questionsRes] = await Promise.all([
                    fetch(`${getApiUrl()}/sessions/${sessionId}`, {
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                    }),
                    fetch(`${getApiUrl()}/questions/session/${sessionId}`, {
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                    }),
                ]);
                if (sessionRes.ok) setSession(await sessionRes.json());
                if (questionsRes.ok) {
                    const qData = await questionsRes.json();
                    setQuestions(qData.map((q: any) => ({ ...q, _isNew: false, _isDirty: false })));
                }
            } catch (err) {
                console.error('Failed to load session', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [sessionId]);

    const addQuestion = (type: QuestionType) => {
        const newQuestion: Question = {
            title: '',
            order: questions.length + 1,
            type,
            options: type === 'MULTIPLE_CHOICE'
                ? [
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                    { id: crypto.randomUUID(), text: '', isCorrect: false },
                ]
                : type === 'RATING_SCALE'
                    ? { min: 1, max: 5, step: 1 }
                    : [],
            timeLimit: 30,
            _isNew: true,
            _isDirty: true,
        };
        setQuestions([...questions, newQuestion]);
        setSelectedIdx(questions.length);
    };

    const updateQuestion = (idx: number, updates: Partial<Question>) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, ...updates, _isDirty: true } : q));
    };

    const removeQuestion = async (idx: number) => {
        const q = questions[idx];
        if (q.id && !q._isNew) {
            try {
                await fetch(`${getApiUrl()}/questions/${q.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${getToken()}` },
                });
            } catch (err) {
                console.error('Failed to delete question', err);
            }
        }
        const updated = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, order: i + 1 }));
        setQuestions(updated);
        setSelectedIdx(Math.max(0, Math.min(selectedIdx, updated.length - 1)));
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q._isDirty) continue;
                const payload = {
                    sessionId,
                    title: q.title || 'Untitled Question',
                    order: i + 1,
                    type: q.type,
                    options: q.options,
                    timeLimit: q.timeLimit || null,
                };
                if (q._isNew || !q.id) {
                    const res = await fetch(`${getApiUrl()}/questions`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                        body: JSON.stringify(payload),
                    });
                    if (res.ok) {
                        const created = await res.json();
                        questions[i] = { ...questions[i], id: created.id, _isNew: false, _isDirty: false };
                    }
                } else {
                    const res = await fetch(`${getApiUrl()}/questions/${q.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                        body: JSON.stringify(payload),
                    });
                    if (res.ok) questions[i] = { ...questions[i], _isDirty: false };
                }
            }
            setQuestions([...questions]);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2500);
        } catch (err) {
            console.error('Save failed', err);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    const selectedQuestion = questions[selectedIdx];
    const hasDirty = questions.some(q => q._isDirty);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-slate-500 font-medium">Đang tải câu hỏi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col">
            {/* ─── Top Bar ─── */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 px-6 py-4 flex items-center justify-between shrink-0 shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/presenter/dashboard')}
                        className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white/80 hover:text-white transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-white tracking-tight">{session?.name || 'Session Editor'}</h1>
                        <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs font-mono text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-md">
                                PIN: {session?.pin}
                            </span>
                            <span className="text-xs font-bold uppercase text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">
                                {session?.type}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus === 'saved' && (
                        <span className="text-emerald-300 text-sm font-semibold flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1.5 rounded-lg animate-pulse">
                            <CheckCircle2 size={16} /> Đã lưu!
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-300 text-sm font-semibold flex items-center gap-1.5 bg-red-500/20 px-3 py-1.5 rounded-lg">
                            <AlertCircle size={16} /> Lỗi lưu
                        </span>
                    )}
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving || !hasDirty}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-sm shadow-lg shadow-emerald-500/20 active:scale-[0.97]"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Đang lưu...' : 'Lưu tất cả'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* ─── Left: Question List ─── */}
                <aside className="w-80 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Hash size={12} /> Câu hỏi ({questions.length})
                        </h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        {questions.length === 0 && (
                            <div className="text-center py-12 px-4">
                                <Sparkles size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-sm font-medium text-slate-400">Chưa có câu hỏi nào</p>
                                <p className="text-xs text-slate-300 mt-1">Thêm câu hỏi bên dưới ↓</p>
                            </div>
                        )}
                        {questions.map((q, idx) => {
                            const config = QUESTION_TYPE_CONFIG[q.type];
                            const Icon = config.icon;
                            const isSelected = selectedIdx === idx;
                            return (
                                <button
                                    key={q.id || idx}
                                    onClick={() => setSelectedIdx(idx)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 group ${isSelected
                                        ? `${config.bg} ${config.border} shadow-md`
                                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${isSelected
                                            ? `bg-gradient-to-br ${config.gradient} text-white shadow-sm`
                                            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? config.textDark : 'text-slate-700'}`}>
                                                {q.title || 'Chưa có tiêu đề'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className="text-[10px]">{config.emoji}</span>
                                                <span className={`text-[11px] font-medium ${isSelected ? config.color : 'text-slate-400'}`}>{config.label}</span>
                                                {q._isDirty && (
                                                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse ml-1" title="Chưa lưu" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Add Question */}
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Thêm câu hỏi</p>
                        <div className="space-y-1.5">
                            {(Object.keys(QUESTION_TYPE_CONFIG) as QuestionType[]).map((type) => {
                                const config = QUESTION_TYPE_CONFIG[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => addQuestion(type)}
                                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${config.bg} ${config.border} font-semibold text-sm transition-all hover:shadow-md active:scale-[0.97]`}
                                    >
                                        <span className="text-base">{config.emoji}</span>
                                        <span className={config.textDark}>{config.label}</span>
                                        <Plus size={14} className={`${config.color} ml-auto`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Survey Settings */}
                    {session?.type === 'SURVEY' && (
                        <div className="p-4 border-t border-slate-100 bg-emerald-50/30">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                                <Sparkles size={12} /> Cài đặt Khảo sát
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Banner (Tỉ lệ 16:9)</label>
                                    <label className="cursor-pointer block">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const formData = new FormData();
                                                formData.append('file', file);
                                                try {
                                                    const res = await fetch(`${getApiUrl()}/upload`, {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${getToken()}` },
                                                        body: formData,
                                                    });
                                                    if (res.ok) {
                                                        const data = await res.json();
                                                        setSession(prev => prev ? { ...prev, bannerUrl: data.url } : prev);
                                                        // Automatically save the session update
                                                        await fetch(`${getApiUrl()}/sessions/${sessionId}`, {
                                                            method: 'PATCH',
                                                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                                                            body: JSON.stringify({ bannerUrl: data.url }),
                                                        });
                                                    }
                                                } catch (err) { console.error('Upload failed', err); }
                                            }}
                                        />
                                        <div className="w-full h-20 rounded-lg border-2 border-dashed border-emerald-200 bg-white flex flex-col items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-colors overflow-hidden">
                                            {session.bannerUrl ? (
                                                <img src={`${getApiUrl()}${session.bannerUrl}`} alt="Banner" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-semibold">Tải ảnh lên...</span>
                                            )}
                                        </div>
                                    </label>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Lời cảm ơn tuỳ chỉnh</label>
                                    <textarea
                                        value={session?.thankYouMessage || ''}
                                        onChange={(e) => setSession(prev => prev ? { ...prev, thankYouMessage: e.target.value } : prev)}
                                        onBlur={async () => {
                                            if (session?.thankYouMessage !== undefined) {
                                                await fetch(`${getApiUrl()}/sessions/${sessionId}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                                                    body: JSON.stringify({ thankYouMessage: session.thankYouMessage }),
                                                });
                                            }
                                        }}
                                        className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none resize-none"
                                        rows={3}
                                        placeholder="Cảm ơn bạn đã tham gia..."
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* ─── Right: Question Editor ─── */}
                <main className="flex-1 overflow-y-auto">
                    {!selectedQuestion ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-5">
                                <MessageSquare size={36} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-400 mb-2">Chưa chọn câu hỏi</h3>
                            <p className="text-slate-400 text-sm">Thêm hoặc chọn câu hỏi từ menu bên trái</p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto p-8 space-y-5">
                            {/* Question Header Banner */}
                            {(() => {
                                const config = QUESTION_TYPE_CONFIG[selectedQuestion.type];
                                const Icon = config.icon;
                                return (
                                    <div className={`bg-gradient-to-r ${config.gradient} rounded-2xl p-5 flex items-center justify-between shadow-lg`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                                                <Icon size={24} className="text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-white">Câu hỏi {selectedIdx + 1}</h2>
                                                <p className="text-sm text-white/70 font-medium">{config.label}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeQuestion(selectedIdx)}
                                            className="w-10 h-10 bg-white/10 hover:bg-red-500 rounded-xl flex items-center justify-center text-white/60 hover:text-white transition-all"
                                            title="Xoá câu hỏi"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                );
                            })()}

                            {/* Question Title Input */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <label className="block text-sm font-bold text-slate-700 mb-2.5">
                                    📝 Nội dung câu hỏi
                                </label>
                                <textarea
                                    value={selectedQuestion.title}
                                    onChange={(e) => updateQuestion(selectedIdx, { title: e.target.value })}
                                    placeholder="Nhập nội dung câu hỏi tại đây..."
                                    rows={3}
                                    className="w-full text-base text-slate-800 py-3 px-4 rounded-xl border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none resize-none placeholder:text-slate-300 leading-relaxed"
                                />
                            </div>

                            {/* Type Selector */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <label className="block text-sm font-bold text-slate-700 mb-3">🔄 Loại câu hỏi</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(Object.keys(QUESTION_TYPE_CONFIG) as QuestionType[]).map((type) => {
                                        const config = QUESTION_TYPE_CONFIG[type];
                                        const isActive = selectedQuestion.type === type;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    const newOptions = type === 'MULTIPLE_CHOICE'
                                                        ? [
                                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                                        ]
                                                        : type === 'RATING_SCALE'
                                                            ? { min: 1, max: 5, step: 1 }
                                                            : [];
                                                    updateQuestion(selectedIdx, { type, options: newOptions });
                                                }}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-bold text-sm transition-all ${isActive
                                                    ? `${config.border} ${config.bg} shadow-md ring-2 ring-offset-1 ring-${config.border.replace('border-', '')}`
                                                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-400 hover:text-slate-600'
                                                    }`}
                                            >
                                                <span className="text-2xl">{config.emoji}</span>
                                                <span className={isActive ? config.textDark : ''}>{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Type-specific editor */}
                            {selectedQuestion.type === 'MULTIPLE_CHOICE' && (
                                <MultipleChoiceEditor
                                    options={Array.isArray(selectedQuestion.options) ? selectedQuestion.options : []}
                                    onChange={(options) => updateQuestion(selectedIdx, { options })}
                                />
                            )}

                            {selectedQuestion.type === 'RATING_SCALE' && (
                                <RatingScaleEditor
                                    config={selectedQuestion.options || { min: 1, max: 5, step: 1 }}
                                    onChange={(options) => updateQuestion(selectedIdx, { options })}
                                />
                            )}

                            {selectedQuestion.type === 'WORD_CLOUD' && (
                                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2.5 mb-3">
                                        <span className="text-lg">☁️</span>
                                        <label className="text-sm font-bold text-slate-700">Word Cloud</label>
                                    </div>
                                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                                        <p className="text-sm text-teal-800 font-medium leading-relaxed">
                                            Người tham gia sẽ nhập câu trả lời dạng văn bản tự do. Hệ thống sẽ tổng hợp và hiển thị
                                            <strong className="text-teal-900"> Word Cloud theo thời gian thực</strong> từ các từ xuất hiện nhiều nhất.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Time Limit */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-2.5 mb-3">
                                    <span className="text-lg">⏱️</span>
                                    <label className="text-sm font-bold text-slate-700">Thời gian trả lời</label>
                                </div>
                                <div className="flex items-center gap-4 flex-wrap">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min={0}
                                            max={300}
                                            value={selectedQuestion.timeLimit || 0}
                                            onChange={(e) => updateQuestion(selectedIdx, { timeLimit: parseInt(e.target.value) || 0 })}
                                            className="w-24 py-2.5 px-3 rounded-xl border-2 border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all outline-none text-center font-bold text-slate-800 text-lg"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">giây</span>
                                    </div>
                                    <div className="flex gap-2">
                                        {[10, 20, 30, 60, 90].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => updateQuestion(selectedIdx, { timeLimit: t })}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedQuestion.timeLimit === t
                                                    ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md shadow-violet-200'
                                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
                                                    }`}
                                            >
                                                {t}s
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => updateQuestion(selectedIdx, { timeLimit: 0 })}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${(!selectedQuestion.timeLimit || selectedQuestion.timeLimit === 0)
                                            ? 'bg-slate-700 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                            }`}
                                    >
                                        Không giới hạn
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   Multiple Choice Editor
   ═══════════════════════════════════════════════════ */
function MultipleChoiceEditor({ options, onChange }: { options: Option[]; onChange: (opts: Option[]) => void }) {
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

/* ═══════════════════════════════════════════════════
   Rating Scale Editor
   ═══════════════════════════════════════════════════ */
function RatingScaleEditor({ config, onChange }: { config: { min: number; max: number; step: number }; onChange: (cfg: any) => void }) {
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
