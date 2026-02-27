import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save } from 'lucide-react';

type UserRole = 'ADMIN' | 'HOST';

interface UserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userId: string | null, data: any) => Promise<void>;
    userToEdit?: { id: string; email: string; name: string | null; role: UserRole } | null;
}

export default function UserModal({ isOpen, onClose, onSave, userToEdit }: UserModalProps) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('HOST');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (userToEdit) {
            setEmail(userToEdit.email);
            setName(userToEdit.name || '');
            setRole(userToEdit.role);
            setPassword(''); // Don't show existing password
        } else {
            setEmail('');
            setName('');
            setPassword('');
            setRole('HOST');
        }
        setError('');
    }, [userToEdit, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!userToEdit && password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setIsSaving(true);
        try {
            const data: any = { email, name, role };
            if (password) data.password = password; // Only send password if provided (for edits)

            await onSave(userToEdit ? userToEdit.id : null, data);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save user.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                    />

                    {/* Modal Content */}
                    <div className="fixed inset-0 overflow-y-auto z-50 flex items-center justify-center p-4 py-10 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden pointer-events-auto"
                        >
                            <div className="flex justify-between items-center p-6 border-b border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900">
                                    {userToEdit ? 'Edit User' : 'Create New User'}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-full"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6">
                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 font-medium border border-red-100">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            placeholder="user@pace.edu.vn"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            placeholder="Nguyen Thanh Nhan"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">
                                            Password {userToEdit ? '(Leave blank to keep unchanged)' : <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type="password"
                                            required={!userToEdit}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1">Role <span className="text-red-500">*</span></label>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setRole('HOST')}
                                                className={`py-2 px-4 rounded-xl border-2 font-bold text-sm transition-all focus:outline-none ${role === 'HOST'
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                Host
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setRole('ADMIN')}
                                                className={`py-2 px-4 rounded-xl border-2 font-bold text-sm transition-all focus:outline-none ${role === 'ADMIN'
                                                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                                    }`}
                                            >
                                                Admin
                                            </button>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            disabled={isSaving}
                                            className="px-5 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-70"
                                        >
                                            {isSaving ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <><Save size={18} /> Save User</>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
