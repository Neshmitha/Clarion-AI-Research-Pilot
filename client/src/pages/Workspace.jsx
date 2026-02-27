import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { LayoutDashboard, Search, FileText, Upload, Settings, LogOut, Plus, File, Menu, X as CloseIcon, Trash2, Edit2, BookOpen, Bot, Star, Edit3, Compass, ChevronDown , GitPullRequest } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import EditPaperModal from '../components/EditPaperModal';

const Workspace = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [papers, setPapers] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editingPaper, setEditingPaper] = useState(null);
    const [selectedDomain, setSelectedDomain] = useState('All');

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    const filteredPapers = selectedDomain === 'All'
        ? papers
        : papers.filter(p => p.domain === selectedDomain);

    useEffect(() => {
        if (user.id || user._id) {
            fetchPapers();
        }
    }, [user]);

    const fetchPapers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/papers/${user.id || user._id}`);
            setPapers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this paper?')) {
            try {
                await axios.delete(`${API_BASE_URL}/papers/${id}`);
                fetchPapers();
            } catch (err) {
                console.error(err);
                alert('Failed to delete paper');
            }
        }
    };

    const handleToggleFavorite = async (paper) => {
        try {
            await axios.put(`${API_BASE_URL}/papers/${paper._id}`, {
                isFavorite: !paper.isFavorite
            });
            fetchPapers();
        } catch (err) {
            console.error(err);
            alert('Failed to update favorite status');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-black'}`}>
            {/* Sidebar (Synced) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'lg:flex' : 'lg:hidden'} ${isDark ? 'bg-black/80 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-transparent/10'}`}>
                <div className={`p-8 border-b ${isDark ? 'border-white/5' : 'border-transparent/5'}`}>
                    <div className="flex items-center gap-3 text-[#38bdf8] font-bold text-2xl tracking-tight">
                        <div className={`p-2 rounded-xl transition-all ${isDark ? 'bg-[#38bdf8]/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}>
                            <LayoutDashboard size={22} className={isDark ? "text-[#38bdf8]" : "text-black"} />
                        </div>
                        <span className="font-black tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: isDark ? 'linear-gradient(90deg, #38bdf8, #FFFFFF, #38bdf8)' : 'linear-gradient(90deg, #0284c7, #000000, #0284c7)' }}>CLARION</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={18} />} text="Home" onClick={() => navigate('/home')} isDark={isDark} />
                    <SidebarItem icon={<Search size={18} />} text="Discover Papers" onClick={() => navigate('/search')} isDark={isDark} />
                    <SidebarItem icon={<BookOpen size={18} />} text="Paper Drafting" onClick={() => navigate('/draft')} isDark={isDark} />
                    <SidebarItem icon={<Edit3 size={18} />} text="DocSpace Editor" onClick={() => navigate('/docspace')} isDark={isDark} />
                    <SidebarItem icon={<FileText size={18} />} text="Workspace" active isDark={isDark} />
                    <SidebarItem icon={<Star size={18} />} text="My Library" onClick={() => navigate('/library')} isDark={isDark} />
                    <SidebarItem icon={<Bot size={18} />} text="AI Assistant" onClick={() => navigate('/ai')} isDark={isDark} />
                    <SidebarItem icon={<Compass size={18} />} text="Research Guide" onClick={() => navigate('/guide')} isDark={isDark} />
                    <SidebarItem icon={<GitPullRequest size={18} />} text="Contributions" onClick={() => navigate('/contributions')} isDark={isDark} />
                </nav>

                <div className={`p-4 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-transparent/10'}`}>
                    <SidebarItem icon={<Settings size={18} />} text="Settings" onClick={() => navigate('/settings')} isDark={isDark} />
                    <button onClick={handleLogout} className={`flex items-center gap-3 transition-all duration-300 w-full px-4 py-3 rounded-2xl border border-transparent ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/5' : 'text-gray-600 hover:bg-red-50 hover:border-transparent hover:text-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                        <LogOut size={18} />
                        <span className="font-medium">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-black' : 'bg-[#f8fafc]'}`}>
                {/* Header */}
                <header className={`z-10 h-20 flex items-center justify-between px-8 border-b backdrop-blur-md ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/40 border-transparent/10'}`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-white border-2 border-transparent text-black shadow-sm hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-black'}`}>Workspace</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <select
                                value={selectedDomain}
                                onChange={(e) => setSelectedDomain(e.target.value)}
                                className={`appearance-none border px-4 py-2 pr-10 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/50 transition-all cursor-pointer ${isDark ? 'bg-black border-[#38bdf8]/30 text-white shadow-[0_0_12px_rgba(56,189,248,0.15)] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]' : 'bg-white border-transparent text-black shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                            >
                                {['All', 'Agriculture', 'Climate', 'Medtech',
                                    'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
                                    'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
                                    'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
                                    'Environmental Science', 'Other'].map(domain => (
                                        <option key={domain} value={domain} className={isDark ? 'bg-black text-white' : 'bg-white text-black'}>{domain}</option>
                                    ))}
                            </select>
                            <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-70 ${isDark ? 'text-[#38bdf8]' : 'text-blue-600'}`}>
                                <ChevronDown size={14} />
                            </div>
                        </div>

                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isDark ? '' : 'bg-white border-2 border-transparent text-black shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                            style={isDark ? {
                                background: '#000000',
                                color: '#ffffff',
                                border: '1.5px solid #38bdf8',
                                boxShadow: '0 0 12px rgba(56,189,248,0.25)',
                            } : {}}
                            onMouseEnter={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 22px rgba(56,189,248,0.55)' }}
                            onMouseLeave={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)' }}
                        >
                            <Plus size={18} /> Upload PDF
                        </button>
                    </div>
                </header>

                {/* content */}
                <div className="flex-1 overflow-hidden flex z-10">


                    {/* Papers Grid */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {filteredPapers.length === 0 ? (
                            <div className={`h-full flex flex-col items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <FileText size={64} className="mb-4 opacity-50" />
                                <p className="text-lg font-medium">No papers found.</p>
                                <p className="text-sm">{selectedDomain === 'All' ? 'Upload a PDF to get started.' : `No papers in ${selectedDomain}.`}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredPapers.map(paper => (
                                    <PaperCard
                                        key={paper._id}
                                        paper={paper}
                                        onEdit={() => setEditingPaper(paper)}
                                        onDelete={() => handleDelete(paper._id)}
                                        onToggleFavorite={() => handleToggleFavorite(paper)}
                                        isDark={isDark}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchPapers}
                isDark={isDark}
            />

            <EditPaperModal
                isOpen={!!editingPaper}
                onClose={() => setEditingPaper(null)}
                paper={editingPaper}
                onUpdateSuccess={fetchPapers}
                isDark={isDark}
            />
        </div>
    );
};

const SidebarItem = ({ icon, text, active, onClick, isDark }) => (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${active
        ? isDark 
            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' 
            : 'bg-[#e0f2fe] text-[#0284c7] border border-[#38bdf8]'
        : isDark 
            ? 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent' 
            : 'bg-transparent text-gray-600 border border-transparent hover:bg-white hover:border-[#38bdf8] hover:text-black hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'
        }`}>
        <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="font-medium text-sm tracking-wide">{text}</span>
    </div>
);


const PaperCard = ({ paper, onEdit, onDelete, onToggleFavorite, isDark }) => {
    const navigate = useNavigate();
    const getDomainColor = (domain) => {
        // Simple consistent hashing for colors or just cycling through a few styles
        const stylesDark = [
            'text-green-400 bg-green-900/20 border-green-500/20',
            'text-blue-400 bg-blue-900/20 border-blue-500/20',
            'text-purple-400 bg-purple-900/20 border-purple-500/20',
            'text-red-400 bg-red-900/20 border-red-500/20',
            'text-yellow-400 bg-yellow-900/20 border-yellow-500/20',
            'text-pink-400 bg-pink-900/20 border-pink-500/20',
            'text-cyan-400 bg-cyan-900/20 border-cyan-500/20',
            'text-orange-400 bg-orange-900/20 border-orange-500/20',
        ];
        const stylesLight = [
            'text-green-700 bg-green-100 border-green-500/50',
            'text-blue-700 bg-blue-100 border-blue-500/50',
            'text-purple-700 bg-purple-100 border-purple-500/50',
            'text-red-700 bg-red-100 border-red-500/50',
            'text-yellow-700 bg-yellow-100 border-yellow-500/50',
            'text-pink-700 bg-pink-100 border-pink-500/50',
            'text-cyan-700 bg-[#e0f2fe] border-cyan-500/50',
            'text-orange-700 bg-orange-100 border-orange-500/50',
        ];

        let hash = 0;
        for (let i = 0; i < domain.length; i++) {
            hash = domain.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % stylesDark.length;
        return isDark ? stylesDark[index] : stylesLight[index];
    };

    return (
        <div className={`border rounded-xl p-5 transition-all group relative overflow-hidden ${isDark ? 'bg-[#151515] border-white/5 hover:border-cyan-500/30 hover:-translate-y-1' : 'bg-white border-2 border-transparent hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}>
            {/* Glossy overlay on hover */}
            <div className={`absolute inset-0 transition-opacity pointer-events-none ${isDark ? 'bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100' : 'bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100'}`} />
            <div className="flex items-start justify-between mb-4">
                <div className={`px-2 py-1 rounded text-xs font-bold border ${getDomainColor(paper.domain)}`}>
                    {paper.domain}
                </div>
                <div className={`text-xs flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                    <span className="mr-1 font-medium">{new Date(paper.createdAt).toLocaleDateString()}</span>
                    <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }} className={`p-2 rounded-lg transition ${paper.isFavorite ? 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-400/10' : 'hover:text-yellow-500 hover:bg-yellow-400/10'}`} title={paper.isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
                        <Star size={16} fill={paper.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className={`p-2 rounded-lg transition ${isDark ? 'hover:text-cyan-400 hover:bg-cyan-400/10' : 'hover:text-blue-600 hover:bg-blue-600/10'}`} title="Edit">
                        <Edit2 size={16} />
                    </button>
                </div>
            </div>

            <h3 className={`text-lg font-bold mb-2 line-clamp-2 leading-tight transition-colors relative z-10 ${isDark ? 'text-white group-hover:text-cyan-400' : 'text-black group-hover:text-blue-600'}`}>
                {paper.title}
            </h3>

            <div className={`flex items-center gap-4 text-xs mb-4 font-medium ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                <div className="flex items-center gap-1.5">
                    <File size={14} />
                    <span className="truncate max-w-[200px]">{paper.originalName}</span>
                </div>
            </div>

            {paper.source === 'written' ? (
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/docspace', { state: { paperId: paper._id } })}
                        className={`flex-1 text-center py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 border-2 ${isDark ? 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300' : 'bg-white border-transparent text-black hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}
                    >
                        View
                    </button>
                    <button
                        onClick={() => navigate('/ai', { state: { paperId: paper._id, domain: paper.domain } })}
                        className={`flex-1 text-center py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 border-2 ${isDark ? 'bg-blue-600/20 border-transparent hover:bg-blue-600/30 text-blue-300' : 'bg-[#e0f2fe] border-transparent text-blue-700 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}
                    >
                        <Bot size={14} /> Ask AI
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 border-2 ${isDark ? 'bg-red-600/10 border-transparent hover:bg-red-600/30 text-red-400' : 'bg-red-50 border-transparent text-red-600 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                        title="Delete this paper"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            ) : (
                <div className="flex gap-2">
                    <a
                        href={paper.pdfUrl || (paper.filePath ? `http://127.0.0.1:5001/${encodeURI(paper.filePath.replace(/\\/g, '/'))}` : '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 text-center py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 border-2 ${isDark ? 'bg-white/5 border-transparent hover:bg-white/10 text-gray-300' : 'bg-white border-transparent text-black hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}
                    >
                        View
                    </a>
                    <button
                        onClick={() => navigate('/ai', { state: { paperId: paper._id, domain: paper.domain } })}
                        className={`flex-1 text-center py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 border-2 ${isDark ? 'bg-blue-600/20 border-transparent hover:bg-blue-600/30 text-blue-300' : 'bg-[#e0f2fe] border-transparent text-blue-700 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}
                    >
                        <Bot size={14} /> Ask AI
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1 border-2 ${isDark ? 'bg-red-600/10 border-transparent hover:bg-red-600/30 text-red-400' : 'bg-red-50 border-transparent text-red-600 hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
                        title="Delete this paper"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default Workspace;
