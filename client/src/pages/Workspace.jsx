import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutDashboard, Search, FileText, Upload, Settings, LogOut, Plus, File, Menu, X as CloseIcon, Trash2, Edit2, BookOpen } from 'lucide-react';
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
            const res = await axios.get(`http://localhost:5001/api/papers/${user.id || user._id}`);
            setPapers(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this paper?')) {
            try {
                await axios.delete(`http://localhost:5001/api/papers/${id}`);
                fetchPapers();
            } catch (err) {
                console.error(err);
                alert('Failed to delete paper');
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
            {/* Sidebar (Synced) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'lg:flex' : 'lg:hidden'}`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xl tracking-wide">
                        <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400"><LayoutDashboard size={20} /></span>
                        ResearchPilot
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <SidebarItem icon={<LayoutDashboard size={18} />} text="Overview" onClick={() => navigate('/home')} />
                    <SidebarItem icon={<Search size={18} />} text="Discover Papers" onClick={() => navigate('/search')} />
                    <SidebarItem icon={<FileText size={18} />} text="Doc Space" onClick={() => navigate('/doc-space')} />
                    <SidebarItem icon={<BookOpen size={18} />} text="Paper Drafting" onClick={() => navigate('/draft')} />
                    <SidebarItem icon={<FileText size={18} />} text="Workspace" active />
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
                {/* Header */}
                <header className="z-10 h-20 flex items-center justify-between px-8 border-b border-white/5 bg-black/20 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-semibold text-gray-200">My Workspace</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-700 transition flex items-center gap-2 shadow-lg shadow-purple-900/20"
                        >
                            <Plus size={18} /> Upload PDF
                        </button>
                    </div>
                </header>

                {/* content */}
                <div className="flex-1 overflow-hidden flex z-10">
                    {/* Domain Filter Sidebar */}
                    <div className="w-64 bg-[#121212] border-r border-white/5 overflow-y-auto p-4 hidden md:block">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">Domains</h3>
                        <div className="space-y-1">
                            {['All', 'Agriculture', 'Climate', 'Medtech',
                                'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
                                'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
                                'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
                                'Environmental Science', 'Other'].map(domain => (
                                    <button
                                        key={domain}
                                        onClick={() => setSelectedDomain(domain)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedDomain === domain ? 'bg-purple-600/20 text-purple-300 border border-purple-500/20 font-medium' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        {domain}
                                    </button>
                                ))}
                        </div>
                    </div>

                    {/* Papers Grid */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {filteredPapers.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                <FileText size={64} className="mb-4 opacity-50" />
                                <p className="text-lg">No papers found.</p>
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
            />

            <EditPaperModal
                isOpen={!!editingPaper}
                onClose={() => setEditingPaper(null)}
                paper={editingPaper}
                onUpdateSuccess={fetchPapers}
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

const PaperCard = ({ paper, onEdit, onDelete }) => {
    const getDomainColor = (domain) => {
        // Simple consistent hashing for colors or just cycling through a few styles
        const styles = [
            'text-green-400 bg-green-900/20 border-green-500/20',
            'text-blue-400 bg-blue-900/20 border-blue-500/20',
            'text-purple-400 bg-purple-900/20 border-purple-500/20',
            'text-red-400 bg-red-900/20 border-red-500/20',
            'text-yellow-400 bg-yellow-900/20 border-yellow-500/20',
            'text-pink-400 bg-pink-900/20 border-pink-500/20',
            'text-cyan-400 bg-cyan-900/20 border-cyan-500/20',
            'text-orange-400 bg-orange-900/20 border-orange-500/20',
        ];

        let hash = 0;
        for (let i = 0; i < domain.length; i++) {
            hash = domain.charCodeAt(i) + ((hash << 5) - hash);
        }

        const index = Math.abs(hash) % styles.length;
        return styles[index];
    };

    return (
        <div className="bg-[#151515] border border-white/5 rounded-xl p-5 hover:border-purple-500/30 transition-all hover:-translate-y-1 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`px-2 py-1 rounded text-xs font-bold border ${getDomainColor(paper.domain)}`}>
                    {paper.domain}
                </div>
                <div className="text-gray-500 text-xs flex items-center gap-2">
                    <span>{new Date(paper.createdAt).toLocaleDateString()}</span>
                    <button onClick={onEdit} className="p-1 hover:text-purple-400 transition" title="Edit">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={onDelete} className="p-1 hover:text-red-400 transition" title="Delete">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors">
                {paper.title}
            </h3>

            <div className="flex items-center gap-2 text-gray-500 text-xs mb-4">
                <File size={14} />
                <span className="truncate max-w-[200px]">{paper.originalName}</span>
            </div>

            {paper.source === 'written' ? (
                <button
                    onClick={() => window.location.href = `/doc-space/${paper._id}`}
                    className="block w-full text-center py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-lg text-sm font-medium transition"
                >
                    Edit Document
                </button>
            ) : (
                <a
                    href={paper.pdfUrl || `http://localhost:5001/${paper.filePath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
                >
                    View PDF
                </a>
            )}
        </div>
    );
};

export default Workspace;
