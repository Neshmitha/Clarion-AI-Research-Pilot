import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Search, FileText, Upload, Settings, LogOut, ArrowRight, User, Sparkles, Menu, X as CloseIcon, BookOpen } from 'lucide-react';
import UploadModal from '../components/UploadModal';

const Home = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUploadSuccess = () => {
        navigate('/workspace');
    };

    return (
        <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'lg:flex' : 'lg:hidden'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xl tracking-wide">
                        <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><LayoutDashboard size={20} /></span>
                        ResearchPilot <span className="text-xs text-gray-500 ml-1">v2.1</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={18} />} text="Overview" active />
                    <SidebarItem icon={<Search size={18} />} text="Discover Papers" onClick={() => navigate('/search')} />
                    <SidebarItem icon={<FileText size={18} />} text="Doc Space" onClick={() => navigate('/doc-space')} />
                    <SidebarItem icon={<BookOpen size={18} />} text="Paper Drafting" onClick={() => navigate('/draft')} />
                    <SidebarItem icon={<FileText size={18} />} text="Workspace" onClick={() => navigate('/workspace')} />
                    <SidebarItem icon={<FileText size={18} />} text="My Library" onClick={() => navigate('/workspace')} />
                    <SidebarItem icon={<Settings size={18} />} text="Settings" />
                    <SidebarItem icon={<Upload size={18} />} text="Import Data" onClick={() => setIsUploadModalOpen(true)} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-400 hover:text-red-400 transition-colors w-full px-4 py-3 rounded-lg hover:bg-white/5">
                        <LogOut size={18} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col relative">
                {/* Background Gradients */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <header className="z-10 h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-200">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white tracking-wide">{user.username}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20 ring-2 ring-white/10">
                            {user.username ? user.username[0].toUpperCase() : 'U'}
                        </div>
                    </div>
                </header>

                {/* Hero / Welcome Section */}
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 z-10 scrollbar-hide">
                    <div className="max-w-5xl mx-auto">
                        <div className="mb-12 animate-fade-in-up">
                            <h1 className="text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{user.username}</span>
                            </h1>
                            <p className="text-gray-400 text-lg max-w-2xl">
                                Your centralized hub for intelligent research. Continue where you left off or start a new discovery session.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <QuickActionCard
                                icon={<Search size={24} />}
                                title="New Search"
                                desc="Find papers relevant to your topic with AI."
                                color="bg-blue-500/10 border-blue-500/20 text-blue-400"
                                onClick={() => navigate('/search')}
                            />
                            <QuickActionCard
                                icon={<Upload size={24} />}
                                title="Upload PDF"
                                desc="Analyze your documents and extract insights."
                                color="bg-purple-500/10 border-purple-500/20 text-purple-400"
                                onClick={() => setIsUploadModalOpen(true)}
                            />
                            <QuickActionCard
                                icon={<BookOpen size={24} />}
                                title="Paper Drafting"
                                desc="Generate IEEE/Springer drafts with Gemini AI."
                                color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                onClick={() => navigate('/draft')}
                            />
                            <QuickActionCard
                                icon={<FileText size={24} />}
                                title="Doc Space"
                                desc="Manage and edit your research documents."
                                color="bg-pink-500/10 border-pink-500/20 text-pink-400"
                                onClick={() => navigate('/doc-space')}
                            />
                        </div>

                        <div className="p-8 rounded-2xl bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-white/10 backdrop-blur-md relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                        <Sparkles className="text-yellow-400" size={24} />
                                        Pro Research Features
                                    </h3>
                                    <p className="text-gray-300 max-w-lg">
                                        Unlock advanced semantic search, collaborative editing, and unlimited storage for your research projects.
                                    </p>
                                </div>
                                <button className="px-6 py-3 bg-white text-purple-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-100 transition-all transform hover:-translate-y-1">
                                    Upgrade Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
};

const SidebarItem = ({ icon, text, active, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${active ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        <div className={`${active ? 'text-purple-400' : 'text-gray-500 group-hover:text-white'}`}>
            {icon}
        </div>
        <span className="font-medium text-sm">{text}</span>
    </div>
);

const QuickActionCard = ({ icon, title, desc, color, onClick }) => (
    <div onClick={onClick} className={`p-6 rounded-2xl border ${color} hover:bg-opacity-20 transition-all cursor-pointer backdrop-blur-sm group hover:-translate-y-1`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
);

export default Home;

