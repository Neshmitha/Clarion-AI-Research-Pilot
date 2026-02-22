import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5001/api/auth/register', { username, email, password });
            alert('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            console.error(err);
            alert('Registration failed');
        }
    };

    return (
        <div className="flex h-screen w-full bg-black text-white overflow-hidden">
            {/* Left Side - Visual (Reused style for consistency) */}
            <div className="hidden lg:flex w-1/2 items-center justify-center relative bg-black">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-black/50 z-10"></div>
                <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-t from-purple-700 to-blue-900 blur-3xl opacity-40 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
                <div className="relative z-20 w-[80%] h-[80%] rounded-full border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl shadow-indigo-900/50 block bg-[url('https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80 mix-blend-overlay">
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">
                <div className="w-full max-w-md bg-surface p-8 rounded-2xl border border-white/10 shadow-xl backdrop-blur-sm">
                    <h2 className="text-3xl font-bold mb-2 text-center text-white">Create Account</h2>
                    <p className="text-gray-400 text-center mb-8">Join ResearchHub AI today</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/20 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                                placeholder="johndoe"
                                required
                            />
                        </div>

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

                        <button
                            type="submit"
                            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-purple-900/30"
                        >
                            Sign Up
                        </button>
                    </form>

                    <p className="mt-6 text-center text-gray-400 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-purple-400 hover:text-purple-300 font-medium">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
