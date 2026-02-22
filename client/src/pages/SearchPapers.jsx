import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Search, FileText, Upload, Settings, LogOut, Menu, Filter, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import ImportReviewModal from '../components/ImportReviewModal';

const SearchPapers = () => {
    const navigate = useNavigate();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchQuery, setSearchQuery] = useState('agentic ai');

    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedPapers, setSelectedPapers] = useState([]);

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        // setError(null); // Assuming existing error state logic remains
        try {
            const res = await axios.get(`http://localhost:5001/api/arxiv/search?query=${searchQuery}`);
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
            await axios.post('http://localhost:5001/api/papers/import', {
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
        <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
            {/* Sidebar code remains same... */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'lg:flex' : 'lg:hidden'}`}>
                {/* ... Sidebar Content ... */}
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xl tracking-wide">
                        <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><LayoutDashboard size={20} /></span>
                        ResearchPilot
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={18} />} text="Overview" onClick={() => navigate('/home')} />
                    <SidebarItem icon={<Search size={18} />} text="Discover Papers" active />
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
            <main className="flex-1 flex flex-col relative bg-[#121212]">
                {/* Header ... */}
                <header className="z-10 h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition"
                        >
                            <Menu size={20} />
                        </button>
                        <div className="w-6"></div>
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

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 z-10 scrollbar-hide">
                    {/* ... Search UI ... */}
                    <div className="max-w-6xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold mb-2 text-white">Search Research Papers</h1>
                            <p className="text-gray-400 text-sm">Search across millions of research papers and import them to your workspace</p>
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
                                    className="w-full bg-white text-black pl-12 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-8 py-3 rounded-full transition-colors shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? <><Loader2 className="animate-spin" size={20} /> Searching...</> : 'Search'}
                            </button>
                        </div>

                        {/* Import Action Bar */}
                        {selectedPapers.length > 0 && (
                            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 bg-purple-900 border border-purple-500/50 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 animate-fade-in-up">
                                <span className="font-bold">{selectedPapers.length} papers selected</span>
                                <button
                                    onClick={handleImportClick}
                                    className="bg-white text-purple-900 px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors flex items-center gap-2"
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
                                <div key={index} className="bg-white text-black rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
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

const SidebarItem = ({ icon, text, active, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-200 group ${active ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
        <div className={`${active ? 'text-purple-400' : 'text-gray-500 group-hover:text-white'}`}>
            {icon}
        </div>
        <span className="font-medium text-sm">{text}</span>
    </div>
);

export default SearchPapers;
