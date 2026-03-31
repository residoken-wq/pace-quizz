"use client";

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';

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

type SlideDisplayProps = {
    data: SlideData | null;
    isDark: boolean;
    apiUrl?: string;
};

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export function SlideDisplay({ data, isDark, apiUrl }: SlideDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fabricLoaded, setFabricLoaded] = useState(false);

    // Render canvas from saved JSON
    useEffect(() => {
        if (!data?.canvasJSON || !canvasRef.current) return;

        let mounted = true;
        (async () => {
            const fabricModule = await import('fabric');
            if (!mounted || !canvasRef.current) return;

            // Create a static canvas (no interaction) for display
            const canvas = new fabricModule.StaticCanvas(canvasRef.current, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
            });

            try {
                await canvas.loadFromJSON(data.canvasJSON);
                canvas.renderAll();
            } catch (e) {
                console.error('Failed to render slide:', e);
            }

            setFabricLoaded(true);

            return () => {
                canvas.dispose();
            };
        })();

        return () => {
            mounted = false;
        };
    }, [data?.canvasJSON]);

    // Handle audio
    useEffect(() => {
        if (data?.sound?.url && data.sound.autoplay) {
            const soundUrl = apiUrl ? `${apiUrl}${data.sound.url}` : data.sound.url;
            const audio = new Audio(soundUrl);
            audioRef.current = audio;
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [data?.sound, apiUrl]);

    const toggleAudio = () => {
        if (!data?.sound?.url) return;
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        } else {
            const soundUrl = apiUrl ? `${apiUrl}${data.sound.url}` : data.sound.url;
            const audio = new Audio(soundUrl);
            audioRef.current = audio;
            audio.play().then(() => setIsPlaying(true)).catch(() => {});
            audio.onended = () => setIsPlaying(false);
        }
    };

    if (!data) {
        return (
            <div className={`flex items-center justify-center h-96 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <p className={`text-lg font-semibold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    Slide trống
                </p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Canvas display — scale to fit */}
            <div className="relative w-full" style={{ paddingBottom: `${(CANVAS_HEIGHT / CANVAS_WIDTH) * 100}%` }}>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
                        style={{
                            maxWidth: CANVAS_WIDTH,
                            maxHeight: CANVAS_HEIGHT,
                        }}
                    >
                        <canvas
                            ref={canvasRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sound control */}
            {data.sound?.url && (
                <div className="flex items-center justify-center mt-4">
                    <button
                        onClick={toggleAudio}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${isPlaying
                            ? isDark
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-rose-50 text-rose-600 border border-rose-200'
                            : isDark
                                ? 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                    >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        {isPlaying ? 'Tạm dừng âm thanh' : 'Phát âm thanh'}
                        <span className="text-xs opacity-60">({data.sound.name})</span>
                    </button>
                </div>
            )}
        </div>
    );
}
