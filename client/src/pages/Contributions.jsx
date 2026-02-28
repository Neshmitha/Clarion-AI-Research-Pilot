import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import {
    Plus, MessageSquare,
    GitPullRequest, CheckCircle2, Filter, ArrowLeft, Trash2, Search
} from 'lucide-react';
import AppSidebar from '../components/AppSidebar';

const Contributions = () => {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('active'); // active tab filter
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('my_contributions');

    // Auth and Theme
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Guest' };
    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    const fetchContributions = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE_URL}/contributions?status=${filterStatus}`;
            if (searchQuery) url += `&domain=${encodeURIComponent(searchQuery)}`;
            console.log("Fetching contributions from:", url); // Debug log
            const res = await axios.get(url);
            console.log("Received contributions:", res.data.length); // Debug log
            setContributions(res.data);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchContributions();
        }, 500);

        return () => clearTimeout(timer);
    }, [filterStatus, searchQuery]);

    const handleDeleteContribution = async (e, id) => {
        e.stopPropagation();

        const currentUserId = (user.id || user._id)?.toString()?.trim();
        if (!currentUserId) {
            alert("Error: User session not found. Please log out and sign in again.");
            return;
        }

        if (!window.confirm('Are you sure you want to delete this contribution? This action is irreversible.')) return;

        try {
            await axios.delete(`${API_BASE_URL}/contributions/${id}`, {
                params: { userId: currentUserId }
            });
            fetchContributions();
        } catch (err) {
            console.error('Delete error', err);
            const msg = err.response?.data?.message || 'Failed to delete contribution';
            const debug = err.response?.data?.debug;
            alert(`${msg}${debug ? `\n(ID Mismatch: ${debug.received} vs ${debug.expected})` : ''}`);
        }
    };
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };


    const displayedContributions = contributions.filter(c => {
        const currentUserId = (user.id || user._id)?.toString();
        const authorId = (c.author?._id || c.author)?.toString();
        const isMine = authorId === currentUserId;

        // If there's a search query, show all matches regardless of which tab is active
        if (searchQuery) return true;

        if (activeTab === 'my_contributions') return isMine;
        return !isMine;
    });

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#000000] text-white' : 'bg-[#f8fafc] text-black'}`}>
            <AppSidebar isOpen={isSidebarOpen} activePage="contributions" isDark={isDark} onClose={() => setIsSidebarOpen(false)} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content */}
            <main className={`flex-1 flex flex-col relative overflow-hidden ${isDark ? 'bg-black' : 'bg-[#fcfcfc]'}`}>
                {/* Clean Background - Glows Removed */}

                <header className={`h-20 flex items-center justify-between px-8 border-b ${isDark ? 'border-white/5 bg-black/40 text-white' : 'border-[#38bdf8]/30 bg-white/60 text-black'} backdrop-blur-md z-10 shadow-[0_4px_30px_rgba(56,189,248,0.05)]`}>
                    <div className="flex items-center gap-4">
                        
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <GitPullRequest size={20} className="text-[#38bdf8]" />
                            {activeTab === 'my_contributions' ? 'My Contributions' : 'Community Contributions'}
                        </h2>
                    </div>
                    {activeTab === 'my_contributions' && (
                        <button onClick={() => navigate('/contributions/new')} className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isDark ? 'bg-[#38bdf8] text-black shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)]' : 'bg-black text-white hover:shadow-lg'}`}>
                            <Plus size={16} /> New Contribution
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 scrollbar-hide">
                    <div className="max-w-5xl mx-auto space-y-6">

                        {/* Top Level Tabs */}
                        <div className={`p-1.5 rounded-2xl flex flex-wrap gap-2 items-center mb-4 inline-flex ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <button
                                onClick={() => setActiveTab('my_contributions')}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${activeTab === 'my_contributions'
                                    ? `border-[#38bdf8] text-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.6)] ${isDark ? 'bg-[#38bdf8]/10' : 'bg-white'}`
                                    : `border-[#38bdf8]/20 text-gray-500 hover:border-[#38bdf8]/50 hover:text-[#38bdf8] hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] bg-transparent`}`}
                            >
                                My Contributions
                            </button>
                            <button
                                onClick={() => setActiveTab('community')}
                                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 border ${activeTab === 'community'
                                    ? `border-[#38bdf8] text-[#38bdf8] shadow-[0_0_25px_rgba(56,189,248,0.6)] ${isDark ? 'bg-[#38bdf8]/10' : 'bg-white'}`
                                    : `border-[#38bdf8]/20 text-gray-500 hover:border-[#38bdf8]/50 hover:text-[#38bdf8] hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] bg-transparent`}`}
                            >
                                Contribute to Others Work
                            </button>
                        </div>

                        {/* Filters */}
                        <div className={`p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border ${isDark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-[#38bdf8]/20 shadow-sm'}`}>
                            <div className={`flex p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                {['active', 'closed'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => setFilterStatus(status)}
                                        className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === status
                                            ? (isDark ? 'bg-[#38bdf8] text-black shadow-md' : 'bg-white text-[#0284c7] shadow-sm')
                                            : (isDark ? 'text-gray-500 hover:text-gray-300' : 'text-[#0284c7]/60 hover:text-[#0284c7]')}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>

                            <div className="relative group/search">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-500 group-focus-within/search:text-[#38bdf8]' : 'text-gray-400 group-focus-within/search:text-[#0284c7]'}`} size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    placeholder="Search by research field..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`pl-11 pr-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all border min-w-[280px] shadow-sm ${isDark ? 'bg-black text-white border-white/10 focus:border-[#38bdf8] focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-gray-50 text-black border-transparent focus:border-[#38bdf8] focus:bg-white focus:shadow-[0_4px_20px_rgba(56,189,248,0.1)]'}`}
                                />
                            </div>
                        </div>

                        {/* List */}
                        <div className="space-y-4 pt-2">
                            {loading ? (
                                <div className="text-center py-20">
                                    <div className="w-12 h-12 border-4 border-[#38bdf8]/30 border-t-[#38bdf8] rounded-full animate-spin mx-auto mb-4"></div>
                                    <div className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing Pipeline...</div>
                                </div>
                            ) : displayedContributions.length === 0 ? (
                                <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                                    <GitPullRequest size={48} className="mx-auto mb-4 text-[#38bdf8] opacity-20" />
                                    <h3 className={`text-xl font-black mb-2 ${isDark ? 'text-white' : 'text-black'}`}>No Researchers Found</h3>
                                    <p className="text-gray-500 text-sm">Be the first to initiate a {filterStatus} research contribution.</p>
                                </div>
                            ) : (
                                displayedContributions.map(contrib => (
                                    <div
                                        key={contrib._id}
                                        onClick={() => navigate(`/contributions/${contrib._id}`)}
                                        className={`group p-8 rounded-[32px] cursor-pointer transition-all duration-500 border relative overflow-hidden ${isDark
                                            ? 'bg-[#0a0a0a] border-white/5 hover:border-[#38bdf8]/40 hover:shadow-[0_20px_40px_-15px_rgba(56,189,248,0.15)] hover:-translate-y-1'
                                            : 'bg-white border-[#38bdf8]/20 shadow-[0_4px_20px_-4px_rgba(56,189,248,0.1)] hover:border-[#38bdf8] hover:shadow-[0_20px_40px_-15px_rgba(56,189,248,0.2)] hover:-translate-y-1'}`}
                                    >
                                        {/* Hover Accent Glow */}
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#38bdf8]/5 rounded-full blur-3xl group-hover:bg-[#38bdf8]/10 transition-colors" />

                                        <div className="flex gap-6 items-start relative z-10">
                                            <div className={`p-4 rounded-2xl flex-shrink-0 transition-transform duration-500 group-hover:scale-110 ${isDark ? 'bg-white/5 text-[#38bdf8]' : 'bg-[#38bdf8]/10 text-[#0284c7]'}`}>
                                                {contrib.status === 'active' ? <GitPullRequest size={28} /> : <CheckCircle2 size={28} />}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-start justify-between gap-4 mb-3">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md ${isDark ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'bg-[#0284c7] text-white shadow-sm'}`}>
                                                                {contrib.type}
                                                            </span>
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">#{contrib._id?.toString().slice(-4).toUpperCase()}</span>
                                                        </div>
                                                        <h3 className={`text-2xl font-black leading-tight tracking-tight ${isDark ? 'text-white group-hover:text-[#38bdf8]' : 'text-black group-hover:text-[#0284c7]'} transition-colors`}>
                                                            {contrib.title}
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isDark ? 'bg-black/50 text-gray-400 border-white/10' : 'bg-[#f0f9ff] text-[#0369a1] border-[#38bdf8]/30'}`}>
                                                            {contrib.domain}
                                                        </div>
                                                        {(contrib.author?._id === (user.id || user._id) || contrib.author === (user.id || user._id)) && (
                                                            <button
                                                                onClick={(e) => handleDeleteContribution(e, contrib._id)}
                                                                className={`p-2 rounded-xl border transition-all hover:scale-110 active:scale-95 ${isDark ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20' : 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100 shadow-sm'}`}
                                                                title="Delete Contribution"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <p className={`text-sm mb-6 line-clamp-2 leading-relaxed font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {contrib.description || "An advanced research framework exploring the boundaries of modern science and technology collaborations."}
                                                </p>

                                                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5 dark:border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#38bdf8] to-blue-600 flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                                                                {contrib.author?.username?.[0].toUpperCase() || 'A'}
                                                            </div>
                                                            <span className={`text-[11px] font-bold ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                                                {contrib.author?.username || 'Researcher'}
                                                            </span>
                                                        </div>
                                                        <div className={`h-1 w-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8] flex items-center gap-1.5">
                                                            <MessageSquare size={12} /> {contrib.responses?.length || 0} Pitches
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#38bdf8]">Explore Case</span>
                                                        <ArrowLeft size={14} className="rotate-180 text-[#38bdf8]" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
};



export default Contributions;
