"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, Zap, Users, BarChart3, Presentation } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newPin = [...pin];
    newPin[index] = digit;
    setPin(newPin);

    // Auto-focus next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newPin = [...pin];
    text.split('').forEach((char, i) => { newPin[i] = char; });
    setPin(newPin);
    const nextEmpty = Math.min(text.length, 5);
    inputRefs.current[nextEmpty]?.focus();
  };

  const fullPin = pin.join('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullPin.length !== 6) return;
    setIsLoading(true);
    setTimeout(() => {
      router.push(`/participant/${fullPin}`);
    }, 500);
  };

  const features = [
    { icon: Zap, label: 'Thời gian thực', color: 'from-amber-400 to-orange-500' },
    { icon: Users, label: 'Không giới hạn', color: 'from-emerald-400 to-teal-500' },
    { icon: BarChart3, label: 'Biểu đồ trực tiếp', color: 'from-violet-400 to-purple-500' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* ─── Animated gradient background ─── */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900" />
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]" />

      {/* Floating orbs */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-500/20 blur-[120px] animate-pulse" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/15 blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="fixed top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px] animate-pulse" style={{ animationDelay: '4s' }} />

      {/* ─── Main content ─── */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">

        {/* Logo + Branding */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/10 mb-5 text-sm font-semibold text-indigo-300">
            <Sparkles size={14} className="text-amber-400" />
            <span>Interactive Quiz Platform</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight mb-2">
            PACE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400">Quizz</span>
          </h1>
          <p className="text-white/50 font-medium text-lg">Nhập mã PIN để tham gia ngay</p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="w-full"
        >
          <div className="bg-white/[0.07] backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/20 p-8 sm:p-10">
            <form onSubmit={handleJoin} className="space-y-8">
              {/* PIN Input - Individual digit boxes */}
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-[0.2em] mb-4 text-center">
                  Game PIN
                </label>
                <div className="flex justify-center gap-2.5 sm:gap-3">
                  {pin.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl sm:text-3xl font-black rounded-xl border-2 outline-none transition-all duration-200 bg-white/[0.06] text-white placeholder-white/20 ${digit
                          ? 'border-indigo-500/60 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.15)]'
                          : 'border-white/10 hover:border-white/20 focus:border-indigo-400 focus:bg-white/10 focus:shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                        }`}
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={fullPin.length !== 6 || isLoading}
                className="w-full relative group bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 hover:from-indigo-600 hover:via-violet-600 hover:to-purple-600 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all duration-300 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Tham gia ngay</span>
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Feature badges */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex items-center justify-center gap-3 mt-8 flex-wrap"
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 bg-white/[0.06] backdrop-blur-md border border-white/[0.08] px-3.5 py-2 rounded-full"
            >
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${f.color} flex items-center justify-center`}>
                <f.icon size={12} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-white/60">{f.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Presenter login link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-10"
        >
          <button
            onClick={() => router.push('/presenter/login')}
            className="group flex items-center gap-2 text-sm font-semibold text-white/30 hover:text-white/70 transition-all duration-300"
          >
            <Presentation size={16} />
            <span>Tôi là người trình bày (Presenter Login)</span>
            <ArrowRight size={14} className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        </motion.div>
      </div>

      {/* Footer brand */}
      <div className="fixed bottom-6 text-center z-10">
        <p className="text-[11px] font-medium text-white/15 tracking-widest uppercase">Powered by PACE Institute of Management</p>
      </div>
    </div>
  );
}
