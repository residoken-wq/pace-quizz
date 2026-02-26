"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 6) return;

    setIsLoading(true);
    // In a real app, verify PIN from API before routing
    setTimeout(() => {
      router.push(`/participant/${pin}`);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-blue-600 mb-2">Pace Quizz</h1>
            <p className="text-gray-500 font-medium">Join the session now</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} // only numbers
                placeholder="Game PIN"
                className="w-full text-center text-4xl font-bold tracking-[0.5em] py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={pin.length !== 6 || isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold text-xl py-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] min-h-[64px]"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Enter <LogIn size={24} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-gray-50 p-4 text-center border-t border-gray-100 flex flex-col gap-2">
          <button
            onClick={() => router.push('/presenter/login')}
            className="text-sm text-gray-500 font-medium hover:text-gray-900 transition-colors"
          >
            I am a Speaker (Presenter Login)
          </button>
          <button
            onClick={() => router.push('/admin/users')}
            className="text-xs text-blue-500 font-medium hover:text-blue-700 transition-colors"
          >
            Open Admin Portal
          </button>
        </div>
      </motion.div>
    </div>
  );
}
