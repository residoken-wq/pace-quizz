"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Type, Image as ImageIcon, Film, Square, Circle, Minus, ArrowRight,
    Upload, Trash2, Palette, Volume2, VolumeX, Bold, Italic, Underline,
    AlignLeft, AlignCenter, AlignRight, ChevronDown, Undo2, Redo2,
    ZoomIn, ZoomOut, Layers, Move, MousePointer
} from 'lucide-react';

// Fabric.js dynamic import to avoid SSR issues
let fabric: any = null;

type SlideElement = {
    type: 'text' | 'image' | 'video' | 'shape';
    data: any;
};

type SlideData = {
    canvasJSON: any;
    background: {
        type: 'color' | 'image' | 'gradient';
        value: string;
        imageUrl?: string;
    };
    sound?: {
        url: string;
        name: string;
        autoplay: boolean;
    };
};

type SlideCanvasEditorProps = {
    value: SlideData | null;
    onChange: (data: SlideData) => void;
    apiUrl: string;
    token: string;
};

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

const PRESET_BACKGROUNDS = [
    '#0f0f1a', '#1a1a2e', '#16213e', '#0a3d62',
    '#1e3a5f', '#2d3436', '#636e72', '#dfe6e9',
    '#ffeaa7', '#fab1a0', '#a29bfe', '#00b894',
    '#6c5ce7', '#fd79a8', '#e17055', '#00cec9',
];

const SHAPE_PRESETS = [
    { name: 'Hình chữ nhật', icon: Square, type: 'rect' },
    { name: 'Hình tròn', icon: Circle, type: 'circle' },
    { name: 'Đường thẳng', icon: Minus, type: 'line' },
    { name: 'Mũi tên', icon: ArrowRight, type: 'arrow' },
];

export function SlideCanvasEditor({ value, onChange, apiUrl, token }: SlideCanvasEditorProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<any>(null);
    const [isReady, setIsReady] = useState(false);
    const [activeTab, setActiveTab] = useState<'text' | 'image' | 'video' | 'shapes' | 'background' | 'sound' | null>(null);
    const [selectedObject, setSelectedObject] = useState<any>(null);
    const [bgColor, setBgColor] = useState(value?.background?.value || '#1a1a2e');
    const [soundConfig, setSoundConfig] = useState(value?.sound || null);
    const [zoom, setZoom] = useState(1);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIdx, setHistoryIdx] = useState(-1);
    const isUpdatingRef = useRef(false);

    // Initialize Fabric.js
    useEffect(() => {
        let mounted = true;
        (async () => {
            const fabricModule = await import('fabric');
            fabric = fabricModule;
            if (!mounted || !canvasRef.current) return;

            const canvas = new fabric.Canvas(canvasRef.current, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: bgColor,
                selection: true,
                preserveObjectStacking: true,
            });

            fabricCanvasRef.current = canvas;

            // Load existing data
            if (value?.canvasJSON) {
                try {
                    await canvas.loadFromJSON(value.canvasJSON);
                    canvas.renderAll();
                } catch (e) {
                    console.error('Failed to load canvas JSON:', e);
                }
            }

            // Event listeners
            canvas.on('selection:created', (e: any) => setSelectedObject(e.selected?.[0] || null));
            canvas.on('selection:updated', (e: any) => setSelectedObject(e.selected?.[0] || null));
            canvas.on('selection:cleared', () => setSelectedObject(null));

            canvas.on('object:modified', () => saveState());
            canvas.on('object:added', () => saveState());
            canvas.on('object:removed', () => saveState());

            setIsReady(true);
            saveState();
        })();

        return () => {
            mounted = false;
            if (fabricCanvasRef.current) {
                fabricCanvasRef.current.dispose();
                fabricCanvasRef.current = null;
            }
        };
    }, []);

    // Save canvas state for undo/redo and propagate to parent
    const saveState = useCallback(() => {
        if (!fabricCanvasRef.current || isUpdatingRef.current) return;
        const canvas = fabricCanvasRef.current;
        const json = canvas.toJSON();

        const slideData: SlideData = {
            canvasJSON: json,
            background: {
                type: 'color',
                value: bgColor,
            },
            sound: soundConfig || undefined,
        };

        onChange(slideData);
    }, [bgColor, soundConfig, onChange]);

    // Update background color
    const updateBackground = useCallback((color: string) => {
        setBgColor(color);
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.backgroundColor = color;
            fabricCanvasRef.current.renderAll();
            // Propagate change
            const json = fabricCanvasRef.current.toJSON();
            onChange({
                canvasJSON: json,
                background: { type: 'color', value: color },
                sound: soundConfig || undefined,
            });
        }
    }, [soundConfig, onChange]);

    // ─── Add elements ───

    const addText = (preset: 'heading' | 'body' | 'caption') => {
        if (!fabricCanvasRef.current || !fabric) return;
        const canvas = fabricCanvasRef.current;

        const configs = {
            heading: { text: 'Tiêu đề', fontSize: 48, fontWeight: 'bold', fill: '#ffffff', fontStyle: 'normal' },
            body: { text: 'Nội dung văn bản', fontSize: 24, fontWeight: 'normal', fill: '#e0e0e0', fontStyle: 'normal' },
            caption: { text: 'Chú thích', fontSize: 16, fontWeight: 'normal', fill: '#a0a0a0', fontStyle: 'italic' },
        };

        const cfg = configs[preset];
        const text = new fabric.IText(cfg.text, {
            left: CANVAS_WIDTH / 2,
            top: CANVAS_HEIGHT / 2,
            fontSize: cfg.fontSize,
            fontWeight: cfg.fontWeight,
            fill: cfg.fill,
            fontFamily: 'Inter, sans-serif',
            fontStyle: cfg.fontStyle || 'normal',
            originX: 'center',
            originY: 'center',
            textAlign: 'center',
        });

        canvas.add(text);
        canvas.setActiveObject(text);
        canvas.renderAll();
    };

    const addImage = async (file: File) => {
        if (!fabricCanvasRef.current || !fabric) return;
        const canvas = fabricCanvasRef.current;

        // Upload file
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                const imgUrl = `${apiUrl}${data.url}`;

                const imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = reject;
                    img.src = imgUrl;
                });

                const fabricImg = new fabric.Image(imgElement, {
                    left: CANVAS_WIDTH / 2,
                    top: CANVAS_HEIGHT / 2,
                    originX: 'center',
                    originY: 'center',
                });

                // Scale to fit
                const maxW = CANVAS_WIDTH * 0.6;
                const maxH = CANVAS_HEIGHT * 0.6;
                const scale = Math.min(maxW / fabricImg.width!, maxH / fabricImg.height!, 1);
                fabricImg.scale(scale);

                canvas.add(fabricImg);
                canvas.setActiveObject(fabricImg);
                canvas.renderAll();
            }
        } catch (err) {
            console.error('Image upload failed:', err);
        }
    };

    const addShape = (type: string) => {
        if (!fabricCanvasRef.current || !fabric) return;
        const canvas = fabricCanvasRef.current;
        let shape: any;

        switch (type) {
            case 'rect':
                shape = new fabric.Rect({
                    left: CANVAS_WIDTH / 2 - 75,
                    top: CANVAS_HEIGHT / 2 - 50,
                    width: 150,
                    height: 100,
                    fill: 'rgba(99, 102, 241, 0.3)',
                    stroke: '#6366f1',
                    strokeWidth: 2,
                    rx: 12,
                    ry: 12,
                });
                break;
            case 'circle':
                shape = new fabric.Circle({
                    left: CANVAS_WIDTH / 2,
                    top: CANVAS_HEIGHT / 2,
                    radius: 60,
                    fill: 'rgba(16, 185, 129, 0.3)',
                    stroke: '#10b981',
                    strokeWidth: 2,
                    originX: 'center',
                    originY: 'center',
                });
                break;
            case 'line':
                shape = new fabric.Line(
                    [CANVAS_WIDTH / 2 - 100, CANVAS_HEIGHT / 2, CANVAS_WIDTH / 2 + 100, CANVAS_HEIGHT / 2],
                    {
                        stroke: '#f59e0b',
                        strokeWidth: 3,
                        strokeLineCap: 'round',
                    }
                );
                break;
            case 'arrow':
                const arrowGroup = createArrow();
                if (arrowGroup) {
                    canvas.add(arrowGroup);
                    canvas.setActiveObject(arrowGroup);
                    canvas.renderAll();
                }
                return;
        }

        if (shape) {
            canvas.add(shape);
            canvas.setActiveObject(shape);
            canvas.renderAll();
        }
    };

    const createArrow = () => {
        if (!fabric) return null;
        const line = new fabric.Line(
            [0, 25, 150, 25],
            { stroke: '#ef4444', strokeWidth: 3 }
        );
        const triangle = new fabric.Triangle({
            left: 150,
            top: 25,
            width: 20,
            height: 15,
            fill: '#ef4444',
            angle: 90,
            originX: 'center',
            originY: 'center',
        });
        const group = new fabric.Group([line, triangle], {
            left: CANVAS_WIDTH / 2 - 75,
            top: CANVAS_HEIGHT / 2 - 12,
        });
        return group;
    };

    const uploadSound = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                const newSound = { url: data.url, name: file.name, autoplay: false };
                setSoundConfig(newSound);
                // Propagate
                if (fabricCanvasRef.current) {
                    onChange({
                        canvasJSON: fabricCanvasRef.current.toJSON(),
                        background: { type: 'color', value: bgColor },
                        sound: newSound,
                    });
                }
            }
        } catch (err) {
            console.error('Sound upload failed:', err);
        }
    };

    const uploadBackgroundImage = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch(`${apiUrl}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                const imgUrl = `${apiUrl}${data.url}`;
                if (fabricCanvasRef.current && fabric) {
                    const imgElement = await new Promise<HTMLImageElement>((resolve, reject) => {
                        const img = new window.Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => resolve(img);
                        img.onerror = reject;
                        img.src = imgUrl;
                    });
                    const bgImage = new fabric.Image(imgElement);
                    fabricCanvasRef.current.setBackgroundImage(bgImage, () => {
                        fabricCanvasRef.current.renderAll();
                        saveState();
                    }, {
                        scaleX: CANVAS_WIDTH / bgImage.width!,
                        scaleY: CANVAS_HEIGHT / bgImage.height!,
                    });
                }
            }
        } catch (err) {
            console.error('BG image upload failed:', err);
        }
    };

    const deleteSelected = () => {
        if (!fabricCanvasRef.current) return;
        const canvas = fabricCanvasRef.current;
        const active = canvas.getActiveObjects();
        if (active.length) {
            active.forEach((obj: any) => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.renderAll();
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
                deleteSelected();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* ─── Toolbar ─── */}
            <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 px-4 py-3 flex items-center gap-2 flex-wrap">
                {/* Tools */}
                {[
                    { id: 'text' as const, label: 'Văn bản', icon: Type, color: 'text-blue-400' },
                    { id: 'image' as const, label: 'Hình ảnh', icon: ImageIcon, color: 'text-emerald-400' },
                    { id: 'shapes' as const, label: 'Hình dạng', icon: Square, color: 'text-amber-400' },
                    { id: 'background' as const, label: 'Nền', icon: Palette, color: 'text-purple-400' },
                    { id: 'sound' as const, label: 'Âm thanh', icon: Volume2, color: 'text-rose-400' },
                ].map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTab === tool.id;
                    return (
                        <button
                            key={tool.id}
                            onClick={() => setActiveTab(isActive ? null : tool.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${isActive
                                ? 'bg-white/20 text-white shadow-inner'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            <Icon size={14} className={isActive ? tool.color : ''} />
                            {tool.label}
                        </button>
                    );
                })}

                <div className="flex-1" />

                {/* Delete selected */}
                {selectedObject && (
                    <button
                        onClick={deleteSelected}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all"
                    >
                        <Trash2 size={14} />
                        Xoá
                    </button>
                )}
            </div>

            {/* ─── Sub-panel ─── */}
            {activeTab && (
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
                    {activeTab === 'text' && (
                        <div className="flex gap-2">
                            {[
                                { preset: 'heading' as const, label: 'Tiêu đề', desc: 'H1 lớn, đậm' },
                                { preset: 'body' as const, label: 'Nội dung', desc: 'Text bình thường' },
                                { preset: 'caption' as const, label: 'Chú thích', desc: 'Nhỏ, nghiêng' },
                            ].map((item) => (
                                <button
                                    key={item.preset}
                                    onClick={() => addText(item.preset)}
                                    className="flex-1 bg-white border border-slate-200 rounded-xl p-3 text-left hover:border-indigo-400 hover:shadow-md transition-all group"
                                >
                                    <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600">{item.label}</p>
                                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'image' && (
                        <div>
                            <label className="cursor-pointer flex items-center gap-2 bg-white border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center transition-all group">
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) addImage(file);
                                    }}
                                />
                                <Upload size={18} className="text-slate-400 group-hover:text-indigo-500" />
                                <span className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600">
                                    Kéo thả hoặc click để tải ảnh lên
                                </span>
                            </label>
                        </div>
                    )}

                    {activeTab === 'shapes' && (
                        <div className="flex gap-2">
                            {SHAPE_PRESETS.map((shape) => {
                                const Icon = shape.icon;
                                return (
                                    <button
                                        key={shape.type}
                                        onClick={() => addShape(shape.type)}
                                        className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-amber-400 hover:shadow-md transition-all group"
                                    >
                                        <Icon size={16} className="text-slate-400 group-hover:text-amber-600" />
                                        <span className="text-sm font-semibold text-slate-600 group-hover:text-amber-700">{shape.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'background' && (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">Màu có sẵn</p>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESET_BACKGROUNDS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => updateBackground(color)}
                                            className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${bgColor === color ? 'border-indigo-500 ring-2 ring-indigo-200 scale-110' : 'border-slate-200'
                                                }`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={bgColor}
                                            onChange={(e) => updateBackground(e.target.value)}
                                            className="w-8 h-8 rounded-lg border-2 border-slate-200 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 mb-2">Ảnh nền</p>
                                <label className="cursor-pointer flex items-center gap-2 bg-white border border-dashed border-slate-300 hover:border-purple-400 rounded-lg p-2.5 transition-all group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) uploadBackgroundImage(file);
                                        }}
                                    />
                                    <Upload size={14} className="text-slate-400" />
                                    <span className="text-xs font-semibold text-slate-500">Tải ảnh nền lên</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {activeTab === 'sound' && (
                        <div className="space-y-3">
                            {soundConfig ? (
                                <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3">
                                    <Volume2 size={18} className="text-rose-500" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate">{soundConfig.name}</p>
                                        <p className="text-xs text-slate-400">Âm thanh đi kèm slide</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={soundConfig.autoplay}
                                            onChange={(e) => {
                                                const updated = { ...soundConfig, autoplay: e.target.checked };
                                                setSoundConfig(updated);
                                                if (fabricCanvasRef.current) {
                                                    onChange({
                                                        canvasJSON: fabricCanvasRef.current.toJSON(),
                                                        background: { type: 'color', value: bgColor },
                                                        sound: updated,
                                                    });
                                                }
                                            }}
                                            className="w-4 h-4 rounded text-rose-500"
                                        />
                                        <span className="text-xs font-semibold text-slate-500">Tự phát</span>
                                    </label>
                                    <button
                                        onClick={() => {
                                            setSoundConfig(null);
                                            if (fabricCanvasRef.current) {
                                                onChange({
                                                    canvasJSON: fabricCanvasRef.current.toJSON(),
                                                    background: { type: 'color', value: bgColor },
                                                    sound: undefined,
                                                });
                                            }
                                        }}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer flex items-center gap-2 bg-white border-2 border-dashed border-slate-300 hover:border-rose-400 rounded-xl p-4 transition-all group">
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) uploadSound(file);
                                        }}
                                    />
                                    <Upload size={18} className="text-slate-400 group-hover:text-rose-500" />
                                    <span className="text-sm font-semibold text-slate-500 group-hover:text-rose-600">
                                        Tải file âm thanh lên (MP3, WAV...)
                                    </span>
                                </label>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ─── Canvas Area ─── */}
            <div className="bg-slate-100 p-6 flex items-center justify-center" style={{ minHeight: 420 }}>
                <div
                    className="shadow-2xl rounded-lg overflow-hidden"
                    style={{
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                    }}
                >
                    <canvas ref={canvasRef} />
                </div>
            </div>

            {/* ─── Properties bar when object selected ─── */}
            {selectedObject && isReady && (
                <div className="bg-slate-50 border-t border-slate-200 px-4 py-3 flex items-center gap-3 flex-wrap">
                    {selectedObject.type === 'i-text' && (
                        <>
                            <div className="flex items-center gap-1">
                                <label className="text-xs font-bold text-slate-500 mr-1">Màu chữ</label>
                                <input
                                    type="color"
                                    value={selectedObject.fill || '#ffffff'}
                                    onChange={(e) => {
                                        selectedObject.set('fill', e.target.value);
                                        fabricCanvasRef.current?.renderAll();
                                        saveState();
                                    }}
                                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <label className="text-xs font-bold text-slate-500 mr-1">Cỡ chữ</label>
                                <input
                                    type="number"
                                    value={selectedObject.fontSize || 24}
                                    onChange={(e) => {
                                        selectedObject.set('fontSize', parseInt(e.target.value) || 24);
                                        fabricCanvasRef.current?.renderAll();
                                        saveState();
                                    }}
                                    className="w-16 text-xs py-1 px-2 rounded-lg border border-slate-300 text-center font-bold"
                                    min={8}
                                    max={200}
                                />
                            </div>
                            <button
                                onClick={() => {
                                    const current = selectedObject.fontWeight === 'bold';
                                    selectedObject.set('fontWeight', current ? 'normal' : 'bold');
                                    fabricCanvasRef.current?.renderAll();
                                    saveState();
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${selectedObject.fontWeight === 'bold' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-slate-200'}`}
                            >
                                <Bold size={14} />
                            </button>
                            <button
                                onClick={() => {
                                    const current = selectedObject.fontStyle === 'italic';
                                    selectedObject.set('fontStyle', current ? 'normal' : 'italic');
                                    fabricCanvasRef.current?.renderAll();
                                    saveState();
                                }}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${selectedObject.fontStyle === 'italic' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-slate-400 border border-slate-200'}`}
                            >
                                <Italic size={14} />
                            </button>
                        </>
                    )}

                    {(selectedObject.type === 'rect' || selectedObject.type === 'circle') && (
                        <>
                            <div className="flex items-center gap-1">
                                <label className="text-xs font-bold text-slate-500 mr-1">Fill</label>
                                <input
                                    type="color"
                                    value={selectedObject.fill?.replace(/rgba?\([^)]+\)/, '#6366f1') || '#6366f1'}
                                    onChange={(e) => {
                                        selectedObject.set('fill', e.target.value + '4D');
                                        fabricCanvasRef.current?.renderAll();
                                        saveState();
                                    }}
                                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <label className="text-xs font-bold text-slate-500 mr-1">Viền</label>
                                <input
                                    type="color"
                                    value={selectedObject.stroke || '#6366f1'}
                                    onChange={(e) => {
                                        selectedObject.set('stroke', e.target.value);
                                        fabricCanvasRef.current?.renderAll();
                                        saveState();
                                    }}
                                    className="w-7 h-7 rounded border border-slate-300 cursor-pointer"
                                />
                            </div>
                        </>
                    )}

                    <div className="flex items-center gap-1 ml-auto">
                        <label className="text-xs font-bold text-slate-500 mr-1">Opacity</label>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={selectedObject.opacity ?? 1}
                            onChange={(e) => {
                                selectedObject.set('opacity', parseFloat(e.target.value));
                                fabricCanvasRef.current?.renderAll();
                                saveState();
                            }}
                            className="w-20"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
