import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            console.log("Attempting login with:", email);
            const res = await axios.post('http://localhost:5001/api/auth/login', { email, password });
            console.log("Login success:", res.data);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            navigate('/home');
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.response?.data?.message || err.message || 'Login failed');
            // alert('Login failed: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden">
            {/* Left Side - Visual (Mock User 3D Globe) */}
            <div className="hidden lg:flex w-1/2 items-center justify-center relative bg-black">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-black/50 z-10"></div>
                {/* Abstract Globe Representation */}
                <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-b from-purple-600 to-indigo-900 blur-3xl opacity-40 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                <div className="relative z-20 w-[80%] h-[80%] rounded-full border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl shadow-purple-900/50 block bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-80 mix-blend-overlay">
                </div>
                <div className="absolute z-30 text-center">
                    {/* Text or extra visual elements could go here */}
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">
                <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                    <h2 className="text-3xl font-bold mb-2 text-center text-white">Welcome Back</h2>
                    <p className="text-gray-400 text-center mb-8">Sign in to continue to ResearchHub AI</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/20 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/20 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                                placeholder="........"
                                required
                            />
                        </div>

                        {error && <div className="p-3 mb-4 bg-red-500/10 border border-red-500/50 rounded text-red-500 text-sm text-center">{error}</div>}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400 text-sm">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-purple-400 hover:text-purple-300 font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
