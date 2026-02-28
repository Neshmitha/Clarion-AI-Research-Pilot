import AppSidebar from '../components/AppSidebar';
import HamburgerButton from '../components/HamburgerButton';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import {
    LayoutDashboard, Search, FileText, Upload, Settings, LogOut,
    Plus, File, Menu, X as CloseIcon, Trash2, Edit2, BookOpen,
    Bot, Filter, Star, Clock, BarChart2, Tag, Grid, Share2,
    Eye, Copy, ChevronDown, CheckCircle2, Circle, Edit3, Zap
    , Compass
, GitPullRequest } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UploadModal from '../components/UploadModal';
import EditPaperModal from '../components/EditPaperModal';
import PaperCompareModal from '../components/PaperCompareModal';
import NotesModal from '../components/NotesModal';

const Library = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [papers, setPapers] = useState([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [editingPaper, setEditingPaper] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'graph'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedFilters, setSelectedFilters] = useState({
        domain: 'All',
        year: 'All',
        citationCount: 'All'
    });
    const [selectedPapers, setSelectedPapers] = useState([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [notesPaper, setNotesPaper] = useState(null);

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    useEffect(() => {
        if (user.id || user._id) {
            fetchPapers();
        }
    }, [user]);

    const fetchPapers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/papers/${user.id || user._id}`);
            // Remove mock data - use real data from DB
            setPapers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const [evaluatingPaperId, setEvaluatingPaperId] = useState(null);

    const handleCalculateImpact = async (paperId) => {
        setEvaluatingPaperId(paperId);
        try {
            const response = await axios.post(`${API_BASE_URL}/impact/calculate/${paperId}`);
            if (response.data.success) {
                await fetchPapers();
                alert('Success: Impact evaluation complete!');
            } else {
                alert(`Evaluation finished but was unsuccessful: ${response.data.error || 'Unknown error'}`);
            }
        } catch (err) {
            console.error('Impact Evaluation Error:', err);
            const errMsg = err.response?.data?.details || err.response?.data?.error || err.message;
            alert(`Failed to calculate impact score: ${errMsg}`);
        } finally {
            setEvaluatingPaperId(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const togglePaperSelection = (id) => {
        setSelectedPapers(prev =>
            prev.includes(id) ? prev.filter(paperId => paperId !== id) : [...prev, id]
        );
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

    const filteredPapers = Array.isArray(papers) ? papers.filter(paper => {
        const title = paper.title || '';
        const domain = paper.domain || 'Other';
        const year = paper.year || '';

        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            domain.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesDomain = selectedFilters.domain === 'All' || domain === selectedFilters.domain;
        const matchesYear = selectedFilters.year === 'All' || year.toString() === selectedFilters.year;

        return matchesSearch && matchesDomain && matchesYear;
    }) : [];

    const domains = ['All', ...new Set(papers.map(p => p.domain).filter(Boolean))];
    const years = ['All', ...new Set(papers.map(p => p.year ? p.year.toString() : null).filter(Boolean))].sort((a, b) => b - a);

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#050505] text-white' : 'bg-[#f8fafc] text-black'}`}>
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} activePage="library" isDark={isDark} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Section */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                {/* Header / Search Bar Area */}
                <div className="px-8 pt-8 pb-4 z-20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                        <div className="flex items-center gap-4">
                            <HamburgerButton isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDark={isDark} />
                            <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-black'}`}>My Library</h2>
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="relative flex-1 md:w-80 group">
                                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-gray-500 group-focus-within:text-[#38bdf8]' : 'text-gray-600 group-focus-within:text-blue-600'}`} size={18} />
                                <input
                                    type="text"
                                    placeholder="Search papers, authors, domains..."
                                    className={`w-full rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none transition-all ${isDark ? 'bg-[#111] border border-white/5 text-white focus:ring-2 focus:ring-[#38bdf8]/20 focus:border-[#38bdf8]/40' : 'bg-white border-2 border-transparent text-black shadow-sm focus:-translate-y-1 focus:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)] placeholder-gray-500 mix-blend-normal'}`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>


                        </div>
                    </div>

                    {/* Smart Collections */}
                    <div className="flex gap-4 mb-10 overflow-x-auto pb-2 scrollbar-hide p-2 -ml-2">
                        <CollectionCard icon={<Star size={18} />} title="Favorites" count={papers.filter(p => p.isFavorite).length} color={isDark ? "text-yellow-400" : "text-yellow-600"} bgColor={isDark ? "bg-yellow-400/10" : "bg-yellow-100"} isDark={isDark} />
                        <CollectionCard icon={<Clock size={18} />} title="Recently Viewed" count={4} color={isDark ? "text-blue-400" : "text-blue-600"} bgColor={isDark ? "bg-blue-400/10" : "bg-blue-100"} isDark={isDark} />
                        <CollectionCard icon={<BarChart2 size={18} />} title="Most Cited" count={8} color={isDark ? "text-emerald-400" : "text-emerald-600"} bgColor={isDark ? "bg-emerald-400/10" : "bg-emerald-100"} isDark={isDark} />
                        <CollectionCard icon={<Tag size={18} />} title="Tagged" count={12} color={isDark ? "text-purple-400" : "text-purple-600"} bgColor={isDark ? "bg-purple-400/10" : "bg-purple-100"} isDark={isDark} />
                    </div>

                    {/* Multi-select Compare Action Bar */}
                    <AnimatePresence>
                        {selectedPapers.length > 0 && (
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 50, opacity: 0 }}
                                className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-8 py-4 rounded-3xl flex items-center gap-6 backdrop-blur-xl border transition-all duration-300 ${isDark ? 'bg-[#38bdf8] text-black shadow-[0_0_40px_rgba(56,189,248,0.4)] border-white/20' : 'bg-white text-black shadow-[0_0_30px_rgba(56,189,248,0.3)] border-gray-100'}`}
                            >
                                <span className={`text-sm font-black uppercase tracking-widest ${!isDark && 'text-gray-700'}`}>{selectedPapers.length} Papers Selected</span>
                                <div className={`h-6 w-px ${isDark ? 'bg-white/20' : 'bg-gray-200'}`}></div>
                                <button
                                    onClick={() => setIsCompareOpen(true)}
                                    disabled={selectedPapers.length < 2}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all text-sm font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed ${isDark ? 'hover:bg-black/20' : 'bg-white border border-[#38bdf8] text-blue-600 shadow-[0_0_15px_rgba(56,189,248,0.6)] hover:-translate-y-0.5 hover:shadow-[0_0_25px_rgba(56,189,248,1)]'}`}
                                >
                                    <BarChart2 size={16} /> Compare {selectedPapers.length < 2 ? '(select ≥2)' : ''}
                                </button>
                                <button onClick={() => setSelectedPapers([])} className={`p-1 rounded-lg transition-all ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100 text-gray-400 hover:text-black'}`}>
                                    <CloseIcon size={20} />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Papers Content Area */}
                <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide relative">
                    <AnimatePresence mode="wait">
                        {viewMode === 'grid' ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.02 }}
                                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                            >
                                {filteredPapers.map((paper, index) => (
                                    <motion.div
                                        key={paper._id || index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <PaperCard
                                            paper={paper}
                                            isSelected={selectedPapers.includes(paper._id)}
                                            onSelect={() => togglePaperSelection(paper._id)}
                                            onEdit={() => setEditingPaper(paper)}
                                            onDelete={() => handleDelete(paper._id)}
                                            onToggleFavorite={() => handleToggleFavorite(paper)}
                                            onOpenNotes={() => setNotesPaper(paper)}
                                            onCalculateImpact={() => handleCalculateImpact(paper._id)}
                                            isEvaluating={evaluatingPaperId === paper._id}
                                            isDark={isDark}
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="graph"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full min-h-[500px] w-full bg-[#111] rounded-3xl border border-white/5 flex items-center justify-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[#080808] opacity-50">
                                    <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                                </div>

                                {/* Placeholder for Graph View - in a real app use react-force-graph */}
                                <div className="z-10 text-center">
                                    <div className="relative w-64 h-64 mx-auto mb-8">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 border-2 border-dashed border-[#38bdf8]/20 rounded-full"
                                        ></motion.div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-20 bg-[#38bdf8] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.5)]">
                                                <Share2 size={32} className="text-black" />
                                            </div>
                                        </div>
                                        {/* Mock Nodes */}
                                        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                                            <motion.div
                                                key={i}
                                                className="absolute w-10 h-10 bg-[#111] border border-[#38bdf8]/20 rounded-full flex items-center justify-center overflow-hidden shadow-xl"
                                                style={{
                                                    top: `${50 + 40 * Math.sin(angle * Math.PI / 180)}%`,
                                                    left: `${50 + 40 * Math.cos(angle * Math.PI / 180)}%`
                                                }}
                                                whileHover={{ scale: 1.2, borderColor: '#38bdf8' }}
                                            >
                                                <div className="w-full h-full bg-[#38bdf8]/5"></div>
                                            </motion.div>
                                        ))}
                                    </div>
                                    <h3 className="text-2xl font-black text-white mb-2">Knowledge Graph View</h3>
                                    <p className="text-gray-500 max-w-sm mx-auto font-medium">Explore semantic relationships between your research papers in 3D space.</p>
                                    <button className="mt-8 px-8 py-3 bg-[#38bdf8] text-black rounded-xl font-black uppercase tracking-widest hover:bg-[#0ea5e9] transition-all shadow-[0_0_25px_rgba(56,189,248,0.3)]">Generate Graph</button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={fetchPapers}
            />

            <EditPaperModal
                isOpen={!!editingPaper}
                onClose={() => setEditingPaper(null)}
                paper={editingPaper}
                onUpdateSuccess={fetchPapers}
            />

            {isCompareOpen && (
                <PaperCompareModal
                    papers={papers.filter(p => selectedPapers.includes(p._id))}
                    onClose={() => setIsCompareOpen(false)}
                    isDark={isDark}
                />
            )}

            <NotesModal
                isOpen={!!notesPaper}
                onClose={() => setNotesPaper(null)}
                paper={notesPaper}
                onUpdateSuccess={fetchPapers}
                isDark={isDark}
            />
        </div>
    );
};


const CollectionCard = ({ icon, title, count, color, bgColor, isDark }) => (
    <div className={`flex items-center gap-4 px-6 py-4 rounded-3xl transition-all cursor-pointer min-w-[200px] group ${isDark ? 'bg-[#111] border border-white/5 hover:border-white/10' : 'bg-white border-2 border-transparent shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${bgColor} ${color} ${!isDark && 'border border-transparent/10'}`}>
            {icon}
        </div>
        <div>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>{title}</p>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{count}</p>
        </div>
    </div>
);

const PaperCard = ({ paper, isSelected, onSelect, onEdit, onDelete, onToggleFavorite, onOpenNotes, onCalculateImpact, isEvaluating, isDark }) => {
    const [showImpactDetails, setShowImpactDetails] = useState(false);
    const navigate = useNavigate();
    const getDomainColor = (domain) => {
        const colorsDark = {
            'Agriculture': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            'Climate': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            'Medtech': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            'Artificial Intelligence': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            'Quantum Physics': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
        };
        const colorsLight = {
            'Agriculture': 'bg-emerald-100 text-emerald-700 border-emerald-500/50',
            'Climate': 'bg-blue-100 text-blue-700 border-blue-500/50',
            'Medtech': 'bg-rose-100 text-rose-700 border-rose-500/50',
            'Artificial Intelligence': 'bg-purple-100 text-purple-700 border-purple-500/50',
            'Quantum Physics': 'bg-indigo-100 text-indigo-700 border-indigo-500/50'
        };
        return isDark ?
            (colorsDark[domain] || 'bg-gray-500/10 text-gray-400 border-gray-500/20') :
            (colorsLight[domain] || 'bg-gray-100 text-gray-600 border-gray-400/50');
    };

    return (
        <div
            className={`relative group rounded-[32px] p-8 transition-all duration-500 ${isDark ? `bg-[#111] border ${isSelected ? 'border-[#38bdf8] ring-4 ring-[#38bdf8]/10 shadow-[0_0_40px_rgba(56,189,248,0.1)]' : 'border-white/5 hover:border-[#38bdf8]/30 hover:shadow-[0_0_40px_rgba(56,189,248,0.1)]'}` : `bg-white border-2 border-transparent ${isSelected ? 'shadow-sm text-blue-600 bg-[#f0f9ff]' : 'shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}`}
        >
            <button
                onClick={onSelect}
                className={`absolute top-6 right-6 z-10 p-2 rounded-xl transition-all ${isSelected ? (isDark ? 'bg-[#38bdf8] border border-[#38bdf8] text-black font-black' : 'bg-white border border-[#38bdf8] text-[#38bdf8] font-black shadow-[0_0_15px_rgba(56,189,248,0.5)]') : (isDark ? 'bg-transparent border border-white/10 text-transparent opacity-0 group-hover:opacity-100 group-hover:text-gray-500 hover:text-[#38bdf8] hover:border-[#38bdf8]/30' : 'bg-transparent border-2 border-transparent text-transparent opacity-0 group-hover:opacity-100 group-hover:text-gray-400 group-hover:border-transparent/10 hover:border-transparent hover:text-black hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(56,189,248,0.8)]')}`}
            >
                <CheckCircle2 size={18} />
            </button>

            <div className="flex items-center gap-3 mb-5">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold border ${getDomainColor(paper.domain)}`}>
                    {paper.domain}
                </span>
                <span className={`text-[10px] font-bold flex items-center gap-1.5 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                    <Clock size={12} /> {paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : 'Recently'}
                </span>
            </div>

            <h3 className={`text-xl font-black mb-6 line-clamp-2 leading-tight transition-colors tracking-tight ${isDark ? 'text-white group-hover:text-[#38bdf8]' : 'text-black group-hover:text-blue-600'}`}>
                {paper.title}
            </h3>

            <div className="grid grid-cols-1 gap-4 mb-6">
                <div className={`rounded-2xl p-4 border ${isDark ? 'bg-white/5 border-white/5' : 'bg-white border-2 border-transparent shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Impact Factor</p>
                        {paper.impactScore ? (
                            <span className={`text-xs font-black tracking-widest ${isDark ? 'text-[#38bdf8]' : 'text-blue-600'}`}>{paper.impactScore}/100</span>
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onCalculateImpact(); }}
                                disabled={isEvaluating}
                                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${isEvaluating ? (isDark ? 'bg-white/5 text-gray-500 cursor-not-allowed border-transparent' : 'bg-gray-100 text-gray-500 border-2 border-gray-300 cursor-not-allowed') : (isDark ? 'bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/20 hover:bg-[#38bdf8]/20' : 'bg-[#e0f2fe] text-blue-700 border-2 border-transparent shadow-sm text-blue-600 hover:-translate-y-0.5 hover:shadow-[2px_2px_15px_rgba(56,189,248,0.8)]')}`}
                            >
                                {isEvaluating ? (
                                    <>
                                        <div className={`w-2 h-2 border-2 border-t-transparent rounded-full animate-spin ${isDark ? 'border-[#38bdf8]' : 'border-blue-600'}`} />
                                        Processing
                                    </>
                                ) : (
                                    <>
                                        <Zap size={10} strokeWidth={3} /> Evaluate
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    {paper.impactScore ? (
                        <div className="space-y-3">
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all duration-1000"
                                    style={{ width: `${paper.impactScore}%` }}
                                ></div>
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); setShowImpactDetails(!showImpactDetails); }}
                                className={`text-[10px] font-black uppercase tracking-widest hover:opacity-70 flex items-center gap-1 mt-2 transition-all ${isDark ? 'text-[#38bdf8]' : 'text-blue-600'}`}
                            >
                                {showImpactDetails ? 'Hide Metrics' : 'View Detailed Metrics'}
                                <ChevronDown size={12} className={`transition-transform duration-300 ${showImpactDetails ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {showImpactDetails && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={`rounded-xl p-4 mt-2 ${isDark ? 'bg-[#0a0a0a] border border-white/10 shadow-inner' : 'bg-white border-2 border-transparent shadow-[inset_2px_2px_10px_rgba(0,0,0,0.05)]'}`}
                                    >
                                        <div className="space-y-2.5 mb-4">
                                            {paper.impactBreakdown && typeof paper.impactBreakdown === 'object' ? (
                                                Object.entries(paper.impactBreakdown).map(([key, val]) => (
                                                    <div key={key} className="flex justify-between items-center text-[10px]">
                                                        <span className="text-gray-500 font-medium">{key}</span>
                                                        <span className="text-purple-300 font-bold">{val}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-[10px] text-gray-500 italic">Breakdown data unavailable.</p>
                                            )}
                                        </div>
                                        {paper.impactJustification && (
                                            <div className={`pt-3 border-t ${isDark ? 'border-white/10' : 'border-transparent/10'}`}>
                                                <p className={`text-[10px] italic leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    "{paper.impactJustification}"
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <p className="text-[10px] text-gray-600 italic">Click evaluate to calculate AI impact score.</p>
                    )}
                </div>


            </div>

            <div className="flex items-center gap-2">
                {paper.source === 'written' ? (
                    <div className="flex-1 flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); navigate('/docspace', { state: { paperId: paper._id } }); }}
                            className={`flex-1 py-3 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 border-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border-transparent' : 'bg-white border-transparent text-black shadow-sm hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}
                        >
                            <Eye size={14} /> View
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex gap-2">
                        <a
                            href={paper.pdfUrl || (paper.filePath ? `http://127.0.0.1:5001/${encodeURI(paper.filePath.replace(/\\/g, '/'))}` : '#')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex-1 py-3 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center gap-2 border-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border-transparent' : 'bg-white border-transparent text-black shadow-sm hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}
                        >
                            <Eye size={14} /> View
                        </a>
                    </div>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
                    className={`p-3 rounded-2xl transition-all border-2 ${paper.isFavorite ? (isDark ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/20' : 'bg-yellow-100 text-yellow-600 border-transparent shadow-sm') : (isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-yellow-400 border-white/10' : 'bg-white border-transparent text-gray-500 hover:text-yellow-500 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(234,179,8,0.5)]')}`}
                    title={paper.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                    <Star size={16} fill={paper.isFavorite ? "currentColor" : "none"} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onOpenNotes(); }}
                    className={`p-3 rounded-2xl transition-all border ${paper.notes ? (isDark ? 'bg-blue-400/10 text-blue-400 border-blue-400/20 hover:bg-blue-400/20' : 'bg-white text-[#38bdf8] border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.4)]') : (isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-blue-400 border-white/10' : 'bg-white border-transparent text-gray-500 hover:text-blue-600 shadow-sm hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]')}`}
                    title="Notes"
                >
                    <Edit3 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    className={`p-3 rounded-2xl transition-all border-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-white/10' : 'bg-white border-transparent text-gray-500 hover:text-black shadow-sm hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(0,0,0,0.1)]'}`}
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className={`p-3 rounded-2xl transition-all border-2 ${isDark ? 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border-red-500/20' : 'bg-red-50 border-transparent text-red-500 hover:text-red-700 hover:bg-red-100 shadow-[2px_2px_0_#e11d48] hover:-translate-y-0.5 hover:shadow-[0_0_10px_rgba(225,29,72,0.4)]'}`}
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>
        </div>
    );
};

export default Library;
