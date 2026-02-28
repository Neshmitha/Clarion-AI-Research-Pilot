import AppSidebar from '../components/AppSidebar';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { LayoutDashboard, Search, FileText, Upload, Settings, LogOut, Menu, Filter, ArrowRight, Loader2, BookOpen, Bot, Edit3, Compass, Star, GitPullRequest } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import ImportReviewModal from '../components/ImportReviewModal';

const SearchPapers = () => {
    const navigate = useNavigate();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPapers, setSelectedPapers] = useState([]);

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };

    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        // setError(null); // Assuming existing error state logic remains
        try {
            const res = await axios.get(`${API_BASE_URL}/arxiv/search?query=${searchQuery}`);
            setPapers(res.data);
        } catch (err) {
            console.error(err);
            // setError...
        } finally {
            setLoading(false);
        }
    };

    const handlePaperSelect = (paper) => {
        if (selectedPapers.find(p => p.pdfLink === paper.pdfLink)) {
            setSelectedPapers(selectedPapers.filter(p => p.pdfLink !== paper.pdfLink));
        } else {
            setSelectedPapers([...selectedPapers, paper]);
        }
    };

    // Open the review modal instead of importing directly
    const handleImportClick = () => {
        if (selectedPapers.length === 0) return;
        setIsReviewModalOpen(true);
    };

    // Called when user confirms in the modal
    const handleConfirmImport = async (reviewedPapers) => {
        try {
            await axios.post(`${API_BASE_URL}/papers/import`, {
                userId: user.id || user._id,
                papers: reviewedPapers // These now have user-set domains/titles
            });
            navigate('/workspace');
        } catch (err) {
            console.error(err);
            alert('Failed to import papers. Please try again.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleUploadSuccess = () => {
        navigate('/workspace');
    };

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-neutral-900 text-white' : 'bg-[#ffffff] text-black'}`}>
            {/* Sidebar code remains same... */}
            <AppSidebar isOpen={isSidebarOpen} activePage="search" isDark={isDark} onClose={() => setIsSidebarOpen(false)} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content */}
            <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#121212]' : 'bg-[#f8fafc]'}`}>
                {/* Header ... */}
                <header className={`z-10 h-20 flex items-center justify-between px-8 border-b ${isDark ? 'border-white/5 bg-black/20 text-white' : 'border-black/5 bg-white/40 text-black'} backdrop-blur-md`}>
                    <div className="flex items-center gap-4">
                        
                        <h2 className="text-xl font-semibold">Discover Papers</h2>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 scrollbar-hide">
                    {/* ... Search UI ... */}
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Search Research Papers</h1>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Search across millions of research papers and import them to your workspace</p>
                        </div>

                        {/* Search Bar & Actions */}
                        <div className="flex items-center gap-4 mb-8">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Search papers, topics, authors..."
                                    className={`w-full pl-12 pr-4 py-3 rounded-xl focus:outline-none transition-all duration-300 ${isDark ? 'bg-black text-white border border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/50 placeholder:text-gray-500' : 'bg-white text-black border border-transparent focus:ring-4 focus:ring-blue-100 placeholder:text-gray-400 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)] focus:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold disabled:cursor-not-allowed transition-all duration-300 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]' : 'bg-white text-black border border-transparent hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}
                            >
                                {loading ? <><Loader2 className="animate-spin" size={18} /> Searching...</> : 'Search'}
                            </button>
                        </div>

                        {/* Import Action Bar */}
                        {selectedPapers.length > 0 && (
                            <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-xl px-6 py-4 rounded-xl flex items-center gap-6 animate-fade-in-up ${isDark ? 'bg-black/90 border border-[#38bdf8]/30 text-white shadow-[0_0_30px_rgba(0,0,0,0.5)]' : 'bg-white/90 border border-transparent text-black shadow-[0_10px_30px_rgba(56,189,248,0.3)]'}`}>
                                <span className="font-bold">{selectedPapers.length} papers selected</span>
                                <button
                                    onClick={handleImportClick}
                                    className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]' : 'bg-white text-black border border-transparent hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}
                                >
                                    <Upload size={18} />
                                    Add to Workspace
                                </button>
                            </div>
                        )}

                        {/* Results Count */}
                        {!loading && papers.length > 0 && (
                            <div className="bg-white text-black rounded-lg px-4 py-3 mb-4 font-medium shadow-sm">
                                Found {papers.length} papers
                            </div>
                        )}

                        {/* Results List */}
                        <div className="space-y-4">
                            {papers.map((paper, index) => (
                                <div key={index} className={`rounded-xl p-6 transition-all duration-300 ${isDark ? 'bg-white text-black border border-gray-100 shadow-sm hover:shadow-md' : 'bg-white text-black border border-transparent shadow-[4px_4px_0_#e2e8f0] hover:shadow-[0_0_25px_rgba(56,189,248,0.5)] hover:border-[#38bdf8] hover:-translate-y-1'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="pt-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedPapers.some(p => p.pdfLink === paper.pdfLink)}
                                                onChange={() => handlePaperSelect(paper)}
                                                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{paper.title}</h3>
                                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">{paper.source}</span>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-3 font-medium">
                                                {paper.authors.join(', ')}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                                                {paper.abstract}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">{new Date(paper.published).toLocaleDateString()}</span>
                                                <span className="bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded">Citations: {paper.citations || 0}</span>
                                                <a href={paper.pdfLink} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 font-medium underline decoration-transparent hover:decoration-purple-800 transition-all">View Paper</a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadSuccess={handleUploadSuccess}
            />

            <ImportReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                selectedPapers={selectedPapers}
                onConfirm={handleConfirmImport}
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


export default SearchPapers;
