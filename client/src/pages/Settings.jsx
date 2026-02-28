import AppSidebar from '../components/AppSidebar';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Search, FileText, Upload, Settings as SettingsIcon, LogOut,
    User, Mail, Building, Target, Fingerprint, Camera, Sparkles,
    Zap, Brain, Database, Sliders, CheckSquare, List, Quote,
    Share2, Download, Trash2, ShieldAlert, ChevronRight, BookOpen, Star, Bot,
    Edit3, Shield, Key, Compass, Menu, Sun, Moon, GitPullRequest, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import API_BASE_URL from '../config';

const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {
        username: 'Guest',
        email: 'guest@example.edu',
        fullName: '',
        role: '',
        bio: '',
        researchInterests: ''
    });

    // Profile Fields State
    const [profileData, setProfileData] = useState({
        fullName: user.fullName || '',
        role: user.role || '',
        bio: user.bio || '',
        researchInterests: user.researchInterests || ''
    });
    const [profileLoading, setProfileLoading] = useState(false);

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';

    // Password State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    const handleUpdatePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            alert("Please fill all password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        setPasswordLoading(true);
        try {
            const userId = user.id || user._id;
            const res = await axios.post(`${API_BASE_URL}/auth/update-password`, {
                userId,
                currentPassword,
                newPassword
            });

            alert(res.data.message);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update password');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleProfileChange = (field, value) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdateProfile = async () => {
        setProfileLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/update-profile`, {
                userId: user.id || user._id,
                ...profileData
            });

            const updatedUser = res.data.user;
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            alert('Profile updated successfully!');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    const toggleTheme = () => {
        const newTheme = isDark ? 'light' : 'dark';
        localStorage.setItem('theme', newTheme);
        setTheme(newTheme);
        window.dispatchEvent(new CustomEvent('themeChange', { detail: newTheme }));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("CRITICAL ACTION: Are you absolutely sure you want to PERMANENTLY delete your account? This will erase all your papers, drafts, and research data. This cannot be undone.")) {
            return;
        }

        try {
            const userId = user.id || user._id;
            console.log("Attempting to delete account for ID:", userId);

            if (!userId) {
                alert("Error: User ID not found. Please log out and log in again.");
                return;
            }

            const response = await axios.delete(`${API_BASE_URL}/auth/${userId}`);
            console.log("Delete response:", response.data);

            alert('Your account has been permanently deleted. We are sorry to see you go.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/register');
        } catch (err) {
            console.error("Delete account error details:", err);
            const errorMsg = err.response?.data?.message || err.message || 'Failed to delete account';
            alert(`Error deleting account: ${errorMsg}`);
        }
    };

    return (
        <div className={`flex h-screen font-sans overflow-hidden transition-all ${isDark ? 'bg-[#000000] text-white' : 'bg-[#ffffff] text-black'}`}>
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} activePage="settings" isDark={isDark} onClose={() => setIsSidebarOpen(false)} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="flex-1 overflow-y-auto px-8 py-10 scrollbar-hide z-10">
                    <div className="max-w-3xl mx-auto">
                        <header className="mb-12 flex items-center gap-4">
                            
                            <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Settings</h2>
                        </header>

                        <div className="space-y-12 pb-24">
                            {/* Profile & Identity */}
                            <section>
                                <div className={`flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <User size={16} />
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Profile & Identity</h2>
                                </div>

                                <div className={`rounded-[32px] p-8 backdrop-blur-md ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200 shadow-xl shadow-blue-900/5'}`}>
                                    <div className="flex items-center gap-6 mb-8">
                                        <div className="relative group">
                                            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-black text-3xl shadow-xl ${isDark ? 'bg-black border border-[#38bdf8]/30 text-[#38bdf8] shadow-[#38bdf8]/20' : 'bg-white text-black border-2 border-[#38bdf8]/20 shadow-[#38bdf8]/40'} `}>
                                                {user.username ? user.username[0].toUpperCase() : 'U'}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-black'}`}>{user.username}</h3>
                                            <p className={`text-sm font-medium mt-1 ${isDark ? 'text-[#38bdf8]' : 'text-[#0284c7]'}`}>{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <InputField label="Username (Display)" value={user.username} isDark={isDark} readOnly />
                                        <InputField label="Email Address" value={user.email} isDark={isDark} readOnly />

                                        <InputField
                                            label="Full Name"
                                            value={profileData.fullName}
                                            onChange={(val) => handleProfileChange('fullName', val)}
                                            placeholder="Your full name"
                                            isDark={isDark}
                                        />

                                        <div className="space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Role</label>
                                            <div className="relative">
                                                <select
                                                    value={profileData.role}
                                                    onChange={(e) => handleProfileChange('role', e.target.value)}
                                                    className={`w-full rounded-2xl py-4 px-5 text-sm font-bold outline-none appearance-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-700' : 'bg-white border text-black border-gray-200 focus:border-[#38bdf8] focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                                >
                                                    <option value="" disabled>Select your role</option>
                                                    <option value="Student">Student</option>
                                                    <option value="Researcher">Researcher</option>
                                                    <option value="Professor">Professor</option>
                                                    <option value="Industry">Industry</option>
                                                </select>
                                                <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-[#38bdf8]'}`} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 space-y-6">
                                        <div className="space-y-2">
                                            <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Short Bio</label>
                                            <textarea
                                                value={profileData.bio}
                                                onChange={(e) => handleProfileChange('bio', e.target.value)}
                                                placeholder="A brief introduction about yourself..."
                                                rows="3"
                                                className={`w-full rounded-2xl py-4 px-5 text-sm font-bold outline-none resize-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-700' : 'bg-white border text-black border-gray-200 focus:border-[#38bdf8] focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                            />
                                        </div>

                                        <InputField
                                            label="Research Interests"
                                            value={profileData.researchInterests}
                                            onChange={(val) => handleProfileChange('researchInterests', val)}
                                            placeholder="e.g. AI, ML, NLP, Computer Vision (comma separated)"
                                            isDark={isDark}
                                        />
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button
                                            onClick={handleUpdateProfile}
                                            disabled={profileLoading}
                                            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl hover:-translate-y-1 disabled:opacity-50 ${isDark ? 'bg-[#38bdf8] text-black shadow-[#38bdf8]/20 hover:shadow-[#38bdf8]/40' : 'bg-black text-white shadow-black/20 hover:shadow-black/40'}`}>
                                            {profileLoading ? 'Saving...' : 'Save Profile'}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Appearance */}
                            <section>
                                <div className={`flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Sparkles size={16} />
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Appearance</h2>
                                </div>

                                <div className={`rounded-[32px] p-8 backdrop-blur-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border border-gray-200 shadow-xl shadow-blue-900/5'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-black'}`}>Application Theme</h3>
                                            <p className={`text-sm mt-1 font-medium max-w-[250px] md:max-w-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Switch between the Bright and Dark visual layers globally.</p>
                                        </div>

                                        <button
                                            onClick={toggleTheme}
                                            className={`relative flex items-center justify-between w-24 h-12 rounded-full cursor-pointer transition-colors duration-300 p-1 flex-shrink-0 ${isDark ? 'bg-[#121212] border-2 border-white/10' : 'bg-blue-50 border border-blue-200 shadow-inner'}`}
                                        >
                                            <Sun size={18} className={`ml-2 z-10 transition-colors ${!isDark ? 'text-amber-500' : 'text-gray-600'}`} />
                                            <Moon size={18} className={`mr-2 z-10 transition-colors ${isDark ? 'text-white' : 'text-gray-400'}`} />

                                            <motion.div
                                                className={`absolute w-10 h-10 rounded-full shadow-lg ${isDark ? 'bg-[#38bdf8]' : 'bg-white border border-gray-100'}`}
                                                animate={{
                                                    x: isDark ? 46 : 0
                                                }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Security & Password */}
                            <section>
                                <div className={`flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Key size={16} />
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em]">Authentication Details</h2>
                                </div>

                                <div className={`rounded-[32px] p-8 backdrop-blur-md border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border border-gray-200 shadow-xl shadow-blue-900/5'}`}>
                                    <div>
                                        <h3 className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Change Password</h3>
                                        <p className={`text-sm font-medium mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ensure your account is using a long, random password to stay secure.</p>

                                        <div className="grid grid-cols-1 gap-6">
                                            <InputField label="Current Password" type="password" placeholder="••••••••" isDark={isDark} value={currentPassword} onChange={setCurrentPassword} />
                                            <InputField label="New Password" type="password" placeholder="••••••••" isDark={isDark} value={newPassword} onChange={setNewPassword} />
                                            <InputField label="Confirm New Password" type="password" placeholder="••••••••" isDark={isDark} value={confirmPassword} onChange={setConfirmPassword} />
                                        </div>
                                        <div className="mt-8 flex justify-end">
                                            <button
                                                onClick={handleUpdatePassword}
                                                disabled={passwordLoading}
                                                className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 border ${isDark ? 'bg-black text-white border-white/20 shadow-black/50 hover:bg-white/5 hover:text-[#38bdf8]' : 'bg-white text-black border-gray-200 shadow-gray-200/50 hover:bg-gray-50 hover:text-[#0284c7]'}`}>
                                                {passwordLoading ? 'Updating...' : 'Update Password'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Danger Zone */}
                            <section>
                                <div className={`flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <ShieldAlert size={16} />
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-red-500">Danger Zone</h2>
                                </div>

                                <div className={`rounded-[32px] p-8 border ${isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-200'} flex flex-col md:flex-row md:items-center justify-between gap-6`}>
                                    <div>
                                        <h3 className="text-xl font-black text-red-500 flex items-center gap-2">
                                            Delete Account
                                        </h3>
                                        <p className={`text-sm mt-2 font-medium leading-relaxed ${isDark ? 'text-red-400/70 max-w-lg' : 'text-red-600/70 max-w-lg'}`}>
                                            Permanently delete your account, saved papers, and all drafted documents. This action is instantaneous and cannot be undone.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className={`whitespace-nowrap flex-shrink-0 px-8 py-4 rounded-2xl text-sm font-black transition-all border shadow-lg hover:shadow-xl hover:-translate-y-1 active:scale-95 ${isDark ? 'bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border-red-500/20 shadow-red-500/10' : 'bg-red-100/50 text-red-600 hover:bg-red-500 hover:text-white border-red-300 shadow-red-200/50'}`}>
                                        Delete My Account
                                    </button>
                                </div>
                            </section>
                        </div>

                        <footer className="mt-20 text-center opacity-20">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] pb-12">Clarion Research Environment</p>
                        </footer>
                    </div>
                </div>
            </main>
        </div>
    );
};


const InputField = ({ label, value, type = "text", placeholder, isDark, onChange, readOnly }) => (
    <div className="space-y-2">
        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</label>
        <div className="relative">
            <input
                type={type}
                {...(onChange ? { value, onChange: e => onChange(e.target.value) } : { defaultValue: value })}
                placeholder={placeholder}
                readOnly={readOnly}
                className={`w-full rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all shadow-inner ${readOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-700' : 'bg-white border text-black border-gray-200 focus:border-[#38bdf8] placeholder:text-gray-400 focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
            />
        </div>
    </div>
);

export default Settings;
