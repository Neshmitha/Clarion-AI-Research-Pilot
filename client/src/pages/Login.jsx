import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Moon, Sun, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import API_BASE_URL from '../config';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Theme state
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    const isDark = theme === 'dark';

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/home');
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Moving Light Blue Sparkling Background */}
            <div className={`fixed inset-0 z-0 transition-colors duration-1000 ${isDark ? 'bg-[#020617]' : 'bg-[#f8fafc]'}`}>
                {/* Background Image Layer */}
                <div 
                    className={`absolute inset-0 z-0 transition-opacity duration-1000 ${isDark ? 'opacity-30 brightness-[0.4] grayscale contrast-125' : 'opacity-[0.45] brightness-[1.08] contrast-[1.12] saturate-[1.1]'}`}
                    style={{
                        backgroundImage: 'url("/loginbg.png")',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        filter: isDark ? 'grayscale(100%)' : 'blur(0.4px)'
                    }}
                />
                
                {/* Soft Color Overlay for Pleasant Feel */}
                {!isDark && <div className="absolute inset-0 z-0 bg-blue-500/5 mix-blend-soft-light pointer-events-none" />}
                
                {/* Subtle Gradient Glows */}
                <div className={`absolute inset-0 ${isDark ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.05),transparent_70%)]'}`} />
            </div>

            {/* Theme Toggle Button */}
            <button
                onClick={toggleTheme}
                className={`absolute top-6 right-6 z-50 p-3 rounded-full shadow-lg transition-transform hover:scale-110 ${isDark ? 'bg-white/10 text-yellow-400 hover:bg-white/20' : 'bg-white text-indigo-600 shadow-gray-200/50 hover:bg-gray-100'}`}
            >
                {isDark ? <Sun size={24} /> : <Moon size={24} />}
            </button>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 mb-8 text-center"
            >
                <h1
                    className={`text-6xl font-black transition-colors duration-500 pr-2 ${isDark ? 'text-white' : 'text-black drop-shadow-[0_2px_10px_rgba(59,130,246,0.2)]'}`}
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                    CLARION
                </h1>
                <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-blue-500 to-transparent mx-auto mt-4 opacity-50"></div>
            </motion.div>

            {/* Form Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 w-full max-w-md p-8 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-2xl transition-all duration-500 ${isDark ? 'bg-black/60 border border-white/10' : 'bg-white/90 border border-blue-50 shadow-xl shadow-blue-500/10'}`}
            >
                <div className="text-center mb-8">
                    <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-blue-900'}`}>Welcome Back</h2>
                    <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Sign in to continue your research journey</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300 border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500 placeholder-gray-600' : 'bg-white border-blue-100 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder-gray-400'}`}
                            placeholder="you@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl focus:outline-none transition-all duration-300 border ${isDark ? 'bg-black/40 border-white/10 text-white focus:border-blue-500 placeholder-gray-600' : 'bg-white border-blue-100 text-gray-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 placeholder-gray-400'}`}
                            placeholder="........"
                            required
                        />
                    </div>

                    {error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-medium text-center">{error}</div>}

                    {/* Sparkling Light Blue Button */}
                    <div className="relative group">
                        <motion.div
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.05, 1],
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                            className="absolute -inset-2 bg-blue-500/20 rounded-xl blur-xl group-hover:bg-blue-400/40 transition-all z-0"
                        />
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-500 rounded-xl blur-sm opacity-40 group-hover:opacity-100 transition duration-500 animate-pulse"></div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-black border border-blue-400/30 text-white font-black text-sm rounded-xl shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] hover:border-blue-300 transition-all group overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <Sparkles size={16} className="text-blue-300 animate-pulse" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 uppercase tracking-widest">
                                {loading ? 'Signing In...' : 'Sign In'}
                            </span>
                            {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                        </button>
                    </div>
                </form>

                <p className={`mt-8 text-center text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Don't have an account?{' '}
                    <Link to="/register" className={`hover:underline font-bold ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}>
                        Sign up
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
