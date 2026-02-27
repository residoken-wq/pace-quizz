"use client";

import { useState, useEffect } from 'react';
import { Search, Plus, UserCog, User, Shield, Trash2, Edit } from 'lucide-react';
import UserModal from './components/UserModal';

type UserAdminView = {
    id: string;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'HOST';
    createdAt: string;
};

export default function AdminUsersManagement() {
    const [users, setUsers] = useState<UserAdminView[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<UserAdminView | null>(null);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
            const res = await fetch(`${apiUrl}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreateUser = () => {
        setUserToEdit(null);
        setIsModalOpen(true);
    };

    const handleEditUser = (user: UserAdminView) => {
        setUserToEdit(user);
        setIsModalOpen(true);
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('access_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
            const res = await fetch(`${apiUrl}/users/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            } else {
                alert('Failed to delete user.');
            }
        } catch (error) {
            console.error('Failed to delete user', error);
        }
    };

    const handleSaveUser = async (userId: string | null, data: any) => {
        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3001` : 'http://localhost:3001');
        const url = userId ? `${apiUrl}/users/${userId}` : `${apiUrl}/users`;
        const method = userId ? 'PATCH' : 'POST';

        const res = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || 'Failed to save user');
        }

        await fetchUsers();
    };

    return (
        <div className="w-full max-w-6xl mx-auto space-y-6">

            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3 text-gray-900">
                        <UserCog className="text-blue-600" /> User Management
                    </h2>
                    <p className="text-gray-500 mt-1">Manage presenters, hosts, and admin access</p>
                </div>

                <button
                    onClick={handleCreateUser}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
                >
                    <Plus size={20} /> Add New User
                </button>
            </div>

            {/* Toolbar */}
            <div className="flex justify-between items-center gap-4 bg-gray-100 p-2 rounded-xl">
                <div className="relative flex-1 max-w-md">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by email or name..."
                        className="w-full pl-10 pr-4 py-2 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                    />
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-sm font-semibold border-b border-gray-100">
                                <th className="p-4 rounded-tl-xl whitespace-nowrap">User Name / Email</th>
                                <th className="p-4 whitespace-nowrap">Role</th>
                                <th className="p-4 whitespace-nowrap hidden md:table-cell">Joined Date</th>
                                <th className="p-4 rounded-tr-xl text-center whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">Loading users...</td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500 font-medium">No users found.</td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {user.name ? user.name.charAt(0).toUpperCase() : <User size={18} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-gray-900 truncate">{user.name || 'Unnamed User'}</p>
                                                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="p-4">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${user.role === 'ADMIN'
                                                ? 'border-purple-200 bg-purple-50 text-purple-700'
                                                : 'border-blue-200 bg-blue-50 text-blue-700'
                                                }`}>
                                                {user.role === 'ADMIN' ? <Shield size={12} /> : <User size={12} />}
                                                {user.role}
                                            </div>
                                        </td>

                                        <td className="p-4 text-gray-500 text-sm hidden md:table-cell">
                                            {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>

                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditUser(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit User">
                                                    <Edit size={18} />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete User">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveUser}
                userToEdit={userToEdit}
            />
        </div>
    );
}
