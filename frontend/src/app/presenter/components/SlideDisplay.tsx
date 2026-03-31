"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
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

type YoutubeOverlay = {
    videoId: string;
    left: number;
    top: number;
    width: number;
    height: number;
};

type VideoOverlay = {
    url: string;
    left: number;
    top: number;
    width: number;
    height: number;
};

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Recursively search canvas JSON for YouTube placeholders
function findYoutubeObjects(canvasJSON: any): YoutubeOverlay[] {
    if (!canvasJSON?.objects) return [];
    const results: YoutubeOverlay[] = [];

    for (const obj of canvasJSON.objects) {
        if (obj.isYoutubePlaceholder && obj.youtubeVideoId) {
            const scaleX = obj.scaleX || 1;
            const scaleY = obj.scaleY || 1;
            const w = (obj.width || 640) * scaleX;
            const h = (obj.height || 360) * scaleY;
            results.push({
                videoId: obj.youtubeVideoId,
                left: obj.left || 0,
                top: obj.top || 0,
                width: w,
                height: h,
            });
        }
    }

    return results;
}

// Search canvas JSON for uploaded video placeholders
function findVideoObjects(canvasJSON: any): VideoOverlay[] {
    if (!canvasJSON?.objects) return [];
    const results: VideoOverlay[] = [];

    for (const obj of canvasJSON.objects) {
        if (obj.isVideoPlaceholder && obj.videoUrl) {
            const scaleX = obj.scaleX || 1;
            const scaleY = obj.scaleY || 1;
            const w = (obj.width || 640) * scaleX;
            const h = (obj.height || 360) * scaleY;
            results.push({
                url: obj.videoUrl,
                left: obj.left || 0,
                top: obj.top || 0,
                width: w,
                height: h,
            });
        }
    }

    return results;
}

export function SlideDisplay({ data, isDark, apiUrl }: SlideDisplayProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [fabricLoaded, setFabricLoaded] = useState(false);
    const [displayScale, setDisplayScale] = useState(1);

    // Extract overlays from canvas JSON
    const youtubeOverlays = useMemo(() => {
        if (!data?.canvasJSON) return [];
        return findYoutubeObjects(data.canvasJSON);
    }, [data?.canvasJSON]);

    const videoOverlays = useMemo(() => {
        if (!data?.canvasJSON) return [];
        return findVideoObjects(data.canvasJSON);
    }, [data?.canvasJSON]);

    // Track container size for responsive scaling
    useEffect(() => {
        if (!containerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const { width } = entries[0].contentRect;
            if (width > 0) {
                setDisplayScale(width / CANVAS_WIDTH);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Render canvas from saved JSON
    useEffect(() => {
        if (!data?.canvasJSON || !canvasRef.current) return;

        let mounted = true;
        (async () => {
            const fabricModule = await import('fabric');
            if (!mounted || !canvasRef.current) return;

            const canvas = new fabricModule.StaticCanvas(canvasRef.current, {
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
            });

            try {
                await canvas.loadFromJSON(data.canvasJSON);
                // Hide YouTube & Video placeholder groups so overlays show cleanly
                canvas.getObjects().forEach((obj: any) => {
                    if (obj.isYoutubePlaceholder || obj.youtubeVideoId || obj.isVideoPlaceholder || obj.videoUrl) {
                        obj.set('opacity', 0);
                    }
                });
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
            {/* Canvas display — scale to fit with video overlays */}
            <div
                ref={containerRef}
                className="relative w-full"
                style={{ paddingBottom: `${(CANVAS_HEIGHT / CANVAS_WIDTH) * 100}%` }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div
                        className="w-full h-full rounded-2xl overflow-hidden shadow-2xl relative"
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

                        {/* YouTube iframe overlays */}
                        {youtubeOverlays.map((yt, idx) => (
                            <iframe
                                key={`yt-${yt.videoId}-${idx}`}
                                src={`https://www.youtube.com/embed/${yt.videoId}?autoplay=0&rel=0`}
                                title={`YouTube Video ${yt.videoId}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{
                                    position: 'absolute',
                                    left: `${(yt.left / CANVAS_WIDTH) * 100}%`,
                                    top: `${(yt.top / CANVAS_HEIGHT) * 100}%`,
                                    width: `${(yt.width / CANVAS_WIDTH) * 100}%`,
                                    height: `${(yt.height / CANVAS_HEIGHT) * 100}%`,
                                    border: 'none',
                                    borderRadius: `${16 * displayScale}px`,
                                    zIndex: 10,
                                }}
                            />
                        ))}

                        {/* MP4 video overlays */}
                        {videoOverlays.map((vid, idx) => {
                            const videoSrc = apiUrl ? `${apiUrl}${vid.url}` : vid.url;
                            return (
                                <video
                                    key={`vid-${vid.url}-${idx}`}
                                    src={videoSrc}
                                    controls
                                    playsInline
                                    style={{
                                        position: 'absolute',
                                        left: `${(vid.left / CANVAS_WIDTH) * 100}%`,
                                        top: `${(vid.top / CANVAS_HEIGHT) * 100}%`,
                                        width: `${(vid.width / CANVAS_WIDTH) * 100}%`,
                                        height: `${(vid.height / CANVAS_HEIGHT) * 100}%`,
                                        border: 'none',
                                        borderRadius: `${16 * displayScale}px`,
                                        zIndex: 10,
                                        objectFit: 'cover',
                                        backgroundColor: '#000',
                                    }}
                                />
                            );
                        })}
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
