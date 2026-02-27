"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft, Plus, Save, Trash2, GripVertical, CheckCircle2, Clock,
    MessageSquare, BarChart3, Cloud, Star, AlertCircle, Loader2
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
};

function getApiUrl() {
    return process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
}

function getToken() {
    return localStorage.getItem('access_token');
}

const QUESTION_TYPE_CONFIG: Record<QuestionType, { label: string; icon: any; color: string; bg: string }> = {
    MULTIPLE_CHOICE: { label: 'Multiple Choice', icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    WORD_CLOUD: { label: 'Word Cloud', icon: Cloud, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-200' },
    RATING_SCALE: { label: 'Rating Scale', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
};

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

    // Fetch session + questions
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

                if (sessionRes.ok) {
                    const sData = await sessionRes.json();
                    setSession(sData);
                }
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
        setSelectedIdx(Math.min(selectedIdx, updated.length - 1));
    };

    // Save all dirty questions
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
                    // Create
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
                    // Update
                    const res = await fetch(`${getApiUrl()}/questions/${q.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                        body: JSON.stringify(payload),
                    });
                    if (res.ok) {
                        questions[i] = { ...questions[i], _isDirty: false };
                    }
                }
            }
            setQuestions([...questions]);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Top Bar */}
            <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/presenter/dashboard')} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">{session?.name || 'Session Editor'}</h1>
                        <p className="text-xs text-gray-400 font-mono">PIN: {session?.pin} · {session?.type}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {saveStatus === 'saved' && (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1">
                            <CheckCircle2 size={16} /> Saved!
                        </span>
                    )}
                    {saveStatus === 'error' && (
                        <span className="text-red-600 text-sm font-medium flex items-center gap-1">
                            <AlertCircle size={16} /> Error
                        </span>
                    )}
                    <button
                        onClick={handleSaveAll}
                        disabled={isSaving || !hasDirty}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {isSaving ? 'Saving...' : 'Save All'}
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Question List Panel (Left) */}
                <aside className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Questions ({questions.length})</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {questions.map((q, idx) => {
                            const config = QUESTION_TYPE_CONFIG[q.type];
                            const Icon = config.icon;
                            return (
                                <button
                                    key={q.id || idx}
                                    onClick={() => setSelectedIdx(idx)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedIdx === idx
                                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                                        : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <GripVertical size={14} className="text-gray-300 shrink-0" />
                                        <span className={`text-sm font-bold ${config.color}`}>{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {q.title || 'Untitled Question'}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <Icon size={12} className={config.color} />
                                                <span className="text-xs text-gray-400">{config.label}</span>
                                                {q._isDirty && <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" />}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Add Question Buttons */}
                    <div className="p-4 border-t border-gray-100 space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase mb-2">Add Question</p>
                        <div className="grid grid-cols-1 gap-2">
                            {(Object.keys(QUESTION_TYPE_CONFIG) as QuestionType[]).map((type) => {
                                const config = QUESTION_TYPE_CONFIG[type];
                                const Icon = config.icon;
                                return (
                                    <button
                                        key={type}
                                        onClick={() => addQuestion(type)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${config.bg} font-semibold text-sm transition-all hover:shadow-sm active:scale-[0.98]`}
                                    >
                                        <Icon size={16} className={config.color} />
                                        <span className={config.color}>{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </aside>

                {/* Question Editor Panel (Right) */}
                <main className="flex-1 overflow-y-auto p-8">
                    {!selectedQuestion ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <MessageSquare size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-400 mb-2">No question selected</h3>
                            <p className="text-gray-400 mb-6">Add a question from the sidebar to get started</p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-6">
                            {/* Question Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {(() => {
                                        const config = QUESTION_TYPE_CONFIG[selectedQuestion.type];
                                        const Icon = config.icon;
                                        return (
                                            <div className={`p-2 rounded-lg ${config.bg}`}>
                                                <Icon size={20} className={config.color} />
                                            </div>
                                        );
                                    })()}
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">Question {selectedIdx + 1}</h2>
                                        <p className="text-xs text-gray-400">{QUESTION_TYPE_CONFIG[selectedQuestion.type].label}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => removeQuestion(selectedIdx)}
                                    className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            {/* Question Title */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Question Title</label>
                                <input
                                    type="text"
                                    value={selectedQuestion.title}
                                    onChange={(e) => updateQuestion(selectedIdx, { title: e.target.value })}
                                    placeholder="Enter your question here..."
                                    className="w-full text-lg py-3 px-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                                />
                            </div>

                            {/* Type Selector */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Question Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {(Object.keys(QUESTION_TYPE_CONFIG) as QuestionType[]).map((type) => {
                                        const config = QUESTION_TYPE_CONFIG[type];
                                        const Icon = config.icon;
                                        const isActive = selectedQuestion.type === type;
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => {
                                                    const newOptions = type === 'MULTIPLE_CHOICE'
                                                        ? [
                                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                                            { id: crypto.randomUUID(), text: '', isCorrect: false },
                                                        ]
                                                        : type === 'RATING_SCALE'
                                                            ? { min: 1, max: 5, step: 1 }
                                                            : [];
                                                    updateQuestion(selectedIdx, { type, options: newOptions });
                                                }}
                                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 font-semibold text-sm transition-all ${isActive
                                                    ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                                                    }`}
                                            >
                                                <Icon size={24} className={isActive ? config.color : 'text-gray-400'} />
                                                <span className={isActive ? config.color : ''}>{config.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Options Editor (per type) */}
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
                                <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Cloud size={18} className="text-teal-600" />
                                        <label className="text-sm font-semibold text-gray-700">Word Cloud</label>
                                    </div>
                                    <p className="text-sm text-gray-500">
                                        Participants will type free-text responses. A word cloud will be generated in real-time from the most frequent words.
                                    </p>
                                </div>
                            )}

                            {/* Time Limit */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock size={18} className="text-purple-600" />
                                    <label className="text-sm font-semibold text-gray-700">Time Limit (seconds)</label>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min={0}
                                        max={300}
                                        value={selectedQuestion.timeLimit || 0}
                                        onChange={(e) => updateQuestion(selectedIdx, { timeLimit: parseInt(e.target.value) || 0 })}
                                        className="w-24 py-2 px-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-center font-bold"
                                    />
                                    <div className="flex gap-2">
                                        {[10, 20, 30, 60].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => updateQuestion(selectedIdx, { timeLimit: t })}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${selectedQuestion.timeLimit === t
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {t}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

// ---------- Sub-components ----------

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

    const optionColors = ['border-l-blue-500', 'border-l-red-500', 'border-l-green-500', 'border-l-amber-500', 'border-l-purple-500', 'border-l-pink-500'];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-blue-600" />
                    <label className="text-sm font-semibold text-gray-700">Answer Options</label>
                </div>
                <button
                    onClick={addOption}
                    className="text-blue-600 hover:text-blue-700 text-sm font-bold flex items-center gap-1 transition-colors"
                >
                    <Plus size={16} /> Add Option
                </button>
            </div>

            <div className="space-y-3">
                {options.map((opt, idx) => (
                    <div
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 border-l-4 transition-all ${optionColors[idx % optionColors.length]} ${opt.isCorrect
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-200 bg-white'
                            }`}
                    >
                        <button
                            onClick={() => toggleCorrect(idx)}
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${opt.isCorrect
                                ? 'border-green-500 bg-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                                }`}
                            title="Mark as correct answer"
                        >
                            {opt.isCorrect && <CheckCircle2 size={14} />}
                        </button>

                        <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => updateOption(idx, { text: e.target.value })}
                            placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 py-2 px-3 rounded-lg border-none bg-transparent outline-none text-sm font-medium"
                        />

                        {options.length > 2 && (
                            <button
                                onClick={() => removeOption(idx)}
                                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function RatingScaleEditor({ config, onChange }: { config: { min: number; max: number; step: number }; onChange: (cfg: any) => void }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-amber-600" />
                <label className="text-sm font-semibold text-gray-700">Rating Scale Configuration</label>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Min Value</label>
                    <input
                        type="number"
                        value={config.min}
                        onChange={(e) => onChange({ ...config, min: parseInt(e.target.value) || 0 })}
                        className="w-full py-2 px-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-center font-bold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Max Value</label>
                    <input
                        type="number"
                        value={config.max}
                        onChange={(e) => onChange({ ...config, max: parseInt(e.target.value) || 5 })}
                        className="w-full py-2 px-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-center font-bold"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Step</label>
                    <input
                        type="number"
                        value={config.step}
                        onChange={(e) => onChange({ ...config, step: parseInt(e.target.value) || 1 })}
                        className="w-full py-2 px-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all outline-none text-center font-bold"
                    />
                </div>
            </div>

            {/* Preview */}
            <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-400 mb-2">Preview</p>
                <div className="flex items-center gap-2 flex-wrap">
                    {Array.from({ length: Math.ceil((config.max - config.min) / config.step) + 1 }, (_, i) => config.min + i * config.step)
                        .filter(v => v <= config.max)
                        .map((val) => (
                            <div
                                key={val}
                                className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-sm font-bold text-amber-700"
                            >
                                {val}
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}
