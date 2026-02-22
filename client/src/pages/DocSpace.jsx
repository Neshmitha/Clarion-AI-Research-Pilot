import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';
import { LayoutDashboard, Search, FileText, LogOut, ArrowLeft, Plus, Sun, Moon, Download, Trash2, Save } from 'lucide-react';

const DocSpace = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const user = JSON.parse(localStorage.getItem('user')) || null;

    // --- State ---
    const [docs, setDocs] = useState([]);
    const [isDocsLoading, setIsDocsLoading] = useState(true);
    const [theme, setTheme] = useState('dark');

    // Editor State
    const [docId, setDocId] = useState(null);
    const [title, setTitle] = useState('Untitled Document');
    const [content, setContent] = useState('');
    const [saveStatus, setSaveStatus] = useState('Saved'); // 'Saved', 'Saving...', 'Unsaved'

    const saveTimeoutRef = useRef(null);

    // --- Effects ---

    // 1. Auth Check & Fetch Docs
    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchDocuments();
    }, [user?.id, navigate]);

    // 2. Load Document Logic
    useEffect(() => {
        if (!id) {
            resetEditor();
            return;
        }

        const localDoc = docs.find(d => d._id === id);
        if (localDoc) {
            setDocId(localDoc._id);
            setTitle(localDoc.title || 'Untitled Document');
            setContent(localDoc.content || '');
        } else if (!isDocsLoading) {
            // Only try to fetch individual doc if we've already loaded the list and it's not there
            fetchSingleDocument(id);
        }
    }, [id, docs, isDocsLoading]);

    // 3. Auto-save
    useEffect(() => {
        if (!docId && !content && title === 'Untitled Document') return;
        if (saveStatus === 'Saving...') return;

        // Debounce auto-save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        if (docId || content || title !== 'Untitled Document') {
            setSaveStatus('Unsaved');
            saveTimeoutRef.current = setTimeout(() => {
                handleSave(true);
            }, 10000); // 10s auto-save
        }

        return () => clearTimeout(saveTimeoutRef.current);
    }, [title, content]);

    // --- API Interactions ---

    const fetchDocuments = async () => {
        try {
            // Safe check for user._id or user.id
            const userId = user.id || user._id;
            if (!userId) return;

            const res = await axios.get(`http://localhost:5001/api/docs/user/${userId}`);
            setDocs(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("Failed to fetch docs:", err);
            // Don't crash, just show empty list
            setDocs([]);
        } finally {
            setIsDocsLoading(false);
        }
    };

    const fetchSingleDocument = async (documentId) => {
        try {
            const res = await axios.get(`http://localhost:5001/api/docs/${documentId}`);
            if (res.data) {
                setDocId(res.data._id);
                setTitle(res.data.title);
                setContent(res.data.content);
                setSaveStatus('Saved');
            }
        } catch (err) {
            console.error("Failed to load doc:", err);
            navigate('/doc-space'); // Redirect to new doc on error
        }
    };

    const handleSave = async (isAuto = false) => {
        if (!user) return;
        if (isAuto) setSaveStatus('Saving...');

        try {
            const payload = {
                userId: user.id || user._id,
                title,
                content,
                // workspaceId: TODO - add when workspace context is available
            };

            let savedDoc;
            if (docId) {
                // Update
                const res = await axios.put(`http://localhost:5001/api/docs/${docId}`, payload);
                savedDoc = res.data;
                // Update local list
                setDocs(prev => prev.map(d => d._id === docId ? savedDoc : d));
            } else {
                // Create
                const res = await axios.post('http://localhost:5001/api/docs', payload);
                savedDoc = res.data;
                setDocs(prev => [savedDoc, ...prev]);
                // If manual save, navigate to new URL
                if (!isAuto) navigate(`/doc-space/${savedDoc._id}`, { replace: true });
                setDocId(savedDoc._id);
            }
            setSaveStatus('Saved');
        } catch (err) {
            console.error("Save failed:", err);
            setSaveStatus('Error');
        }
    };

    const handleDelete = async (e, idToDelete) => {
        e.stopPropagation();
        if (!window.confirm("Delete this document?")) return;

        try {
            await axios.delete(`http://localhost:5001/api/docs/${idToDelete}`);
            setDocs(prev => prev.filter(d => d._id !== idToDelete));
            if (docId === idToDelete) {
                resetEditor();
                navigate('/doc-space');
            }
        } catch (err) {
            console.error("Delete failed:", err);
        }
    };

    // --- Helpers ---

    const resetEditor = () => {
        setDocId(null);
        setTitle('Untitled Document');
        setContent('');
        setSaveStatus('Saved');
    };

    const handleDownload = () => {
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/html' });
        element.href = URL.createObjectURL(file);
        element.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    // --- Render ---

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['blockquote', 'code-block'],
            ['link'],
            ['clean']
        ],
    };

    return (
        <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
            {/* 1. Main Navigation Sidebar */}
            <aside className="w-16 bg-black/40 border-r border-white/5 flex flex-col items-center py-6 z-20 shrink-0">
                <div className="mb-8 p-2 rounded-xl bg-purple-600/20 text-purple-400">
                    <LayoutDashboard size={20} />
                </div>
                <nav className="flex-1 space-y-4 w-full flex flex-col items-center">
                    <SidebarIcon icon={<ArrowLeft size={20} />} text="Back" onClick={() => navigate(-1)} />
                    <SidebarIcon icon={<LayoutDashboard size={20} />} text="Home" onClick={() => navigate('/home')} />
                    <SidebarIcon icon={<Search size={20} />} text="Search" onClick={() => navigate('/search')} />
                    <SidebarIcon icon={<FileText size={20} />} text="Docs" active />
                    <SidebarIcon icon={<FileText size={20} />} text="Library" onClick={() => navigate('/workspace')} />
                </nav>
                <div className="mt-auto">
                    <SidebarIcon icon={<LogOut size={20} />} text="Logout" onClick={handleLogout} />
                </div>
            </aside>

            {/* 2. Documents List Sidebar */}
            <aside className="w-72 bg-[#121212] border-r border-white/5 flex flex-col z-10 shrink-0 hidden md:flex">
                <div className="p-4 border-b border-white/5">
                    <button
                        onClick={() => { resetEditor(); navigate('/doc-space'); }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition shadow-lg shadow-purple-900/20"
                    >
                        <Plus size={18} /> New Document
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isDocsLoading ? (
                        <div className="text-center text-gray-500 py-4 text-xs">Loading...</div>
                    ) : docs.length === 0 ? (
                        <div className="text-center text-gray-600 py-8 text-xs">No documents found.</div>
                    ) : (
                        docs.map(doc => (
                            <div
                                key={doc._id}
                                onClick={() => navigate(`/doc-space/${doc._id}`)}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition border border-transparent ${docId === doc._id ? 'bg-white/10 border-white/5 text-white' : 'text-gray-400 hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText size={16} className={docId === doc._id ? "text-purple-400" : "text-gray-600"} />
                                    <div className="truncate text-sm font-medium">{doc.title || 'Untitled'}</div>
                                </div>
                                <button
                                    onClick={(e) => handleDelete(e, doc._id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </aside>

            {/* 3. Editor Area */}
            <main className="flex-1 flex flex-col relative h-full bg-[#0a0a0a] min-w-0">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-[#0a0a0a] shrink-0">
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled Document"
                            className="bg-transparent text-xl font-bold text-white placeholder-gray-600 focus:outline-none w-full max-w-xl truncate"
                        />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${saveStatus === 'Saved' ? 'bg-green-500/10 text-green-500' :
                                saveStatus === 'Error' ? 'bg-red-500/10 text-red-500' :
                                    'bg-yellow-500/10 text-yellow-500'
                            }`}>
                            {saveStatus}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition" title="Download">
                            <Download size={18} />
                        </button>
                        <div className="h-6 w-px bg-white/10 mx-1"></div>
                        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={() => handleSave(false)} className="ml-2 px-4 py-1.5 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition text-sm">
                            Save
                        </button>
                    </div>
                </header>

                {/* Editor */}
                <div className={`flex-1 overflow-hidden p-0 md:p-6 flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-[#0a0a0a]'}`}>
                    <div className={`flex-1 w-full max-w-4xl mx-auto rounded-xl shadow-sm flex flex-col overflow-hidden transition-colors ${theme === 'light' ? 'quill-light bg-white border border-gray-200 text-black' : 'quill-dark bg-[#1a1a1a] border border-white/10 text-white'
                        }`}>
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            className="flex-1 flex flex-col overflow-hidden"
                            placeholder="Start writing..."
                        />
                    </div>
                </div>
            </main>
        </div>
    );
};

const SidebarIcon = ({ icon, text, active, onClick }) => (
    <div onClick={onClick} className={`flex flex-col items-center justify-center p-3 rounded-xl cursor-pointer transition-all duration-200 group ${active ? 'bg-purple-600 text-purple-100 shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`} title={text}>
        {icon}
    </div>
);

export default DocSpace;
