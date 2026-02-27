import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import {
    LayoutDashboard, Search, FileText, Upload, Settings, LogOut, Menu,
    BookOpen, Bot, Edit3, Plus, Trash2, Save, Printer, Download
    , Compass, Star
, GitPullRequest } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import API_BASE_URL from '../config';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DOCSPACE COMPONENT — Google Docs-style Editor
// ═══════════════════════════════════════════════════════════════════════════════
const DocSpace = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const paperRef = useRef();

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    const location = useLocation();
    const [documents, setDocuments] = useState([]);
    const [activeDocId, setActiveDocId] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [activeDocTitle, setActiveDocTitle] = useState('');
    const [activeTemplate, setActiveTemplate] = useState('IEEE Journal');
    const [saveStatus, setSaveStatus] = useState('saved');

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/papers/${user.id || user._id}`);
            const writtenDocs = res.data.filter(p => p.source === 'written');
            setDocuments(writtenDocs);

            if (location.state?.paperId) {
                const targetDoc = writtenDocs.find(d => d._id === location.state.paperId);
                if (targetDoc && activeDocId !== targetDoc._id) handleSelectDoc(targetDoc);
            } else if (writtenDocs.length > 0 && !activeDocId) {
                handleSelectDoc(writtenDocs[0]);
            } else if (writtenDocs.length === 0) {
                handleCreateNewDoc();
            }
        } catch (err) { console.error('Failed to fetch documents', err); }
    };

    useEffect(() => { fetchDocuments(); }, [location.state?.paperId]);

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
    const handleUploadSuccess = () => { navigate('/workspace'); };

    const handleCreateNewDoc = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/papers/write`, {
                userId: user.id || user._id,
                title: 'Untitled Document',
                domain: 'Other',
                content: '',
                template: 'IEEE Journal'
            });
            setDocuments([res.data.paper, ...documents]);
            handleSelectDoc(res.data.paper);
        } catch (err) { console.error(err); }
    };

    const handleSelectDoc = (doc) => {
        setActiveDocId(doc._id);
        setEditorContent(doc.content || '');
        setActiveDocTitle(doc.title || 'Untitled Document');
        setActiveTemplate(doc.template || 'IEEE Journal');
        setSaveStatus('saved');
    };

    const handleSaveDoc = async () => {
        if (!activeDocId) return;
        setSaveStatus('saving');
        try {
            const res = await axios.post(`${API_BASE_URL}/papers/write`, {
                userId: user.id || user._id,
                paperId: activeDocId,
                title: activeDocTitle,
                domain: 'Other',
                content: editorContent,
                template: activeTemplate
            });
            const updatedDocs = documents.map(doc => doc._id === activeDocId ? res.data.paper : doc);
            setDocuments(updatedDocs);
            setSaveStatus('saved');
        } catch (err) { console.error('Failed to save', err); setSaveStatus('unsaved'); }
    };

    const handleDeleteDoc = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await axios.delete(`${API_BASE_URL}/papers/${id}`);
                const updatedDocs = documents.filter(doc => doc._id !== id);
                setDocuments(updatedDocs);
                if (activeDocId === id) {
                    if (updatedDocs.length > 0) handleSelectDoc(updatedDocs[0]);
                    else handleCreateNewDoc();
                }
            } catch (err) { console.error('Failed to delete', err); }
        }
    };

    const handleDownloadPDF = () => {
        if (!paperRef.current) return;
        const editorEl = paperRef.current.querySelector('.ql-editor');
        if (!editorEl) return;
        html2pdf().set({
            margin: [0.75, 0.75, 0.75, 0.75],
            filename: `${activeDocTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(editorEl).save();
    };

    const handleEditorChange = (content) => {
        setEditorContent(content);
        setSaveStatus('unsaved');
    };

    useEffect(() => {
        if (activeDocId && saveStatus === 'unsaved') {
            const t = setTimeout(() => handleSaveDoc(), 2000);
            return () => clearTimeout(t);
        }
    }, [editorContent, activeDocTitle]);

    const activeDoc = documents.find(d => d._id === activeDocId);

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'image'],
            ['clean']
        ],
    };

    const quillFormats = [
        'header', 'bold', 'italic', 'underline', 'strike',
        'list', 'color', 'background', 'link', 'image'
    ];

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-black'}`}>
            {/* Editor Styles */}
            <style>{`
                .docspace-editor .ql-toolbar.ql-snow {
                    border: ${isDark ? '1px solid rgba(255,255,255,0.05)' : '2px solid black'} !important;
                    background: #1a1a1a !important;
                    padding: 8px 16px;
                    border-radius: 12px 12px 0 0;
                    margin: 0 auto;
                    width: 100%;
                    max-width: 850px;
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    box-sizing: border-box;
                    z-index: 10;
                }
                .docspace-editor .ql-toolbar.ql-snow button,
                .docspace-editor .ql-toolbar.ql-snow .ql-picker {
                    color: #ffffff !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-stroke {
                    stroke: #ffffff !important;
                }
                .docspace-editor .ql-toolbar.ql-snow button:hover,
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-label:hover {
                    color: ${isDark ? '#a78bfa' : '#38bdf8'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow button:hover .ql-stroke,
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-label:hover .ql-stroke {
                    stroke: ${isDark ? '#a78bfa' : '#38bdf8'} !important;
                }
                .docspace-editor .ql-container.ql-snow {
                    border: ${isDark ? 'none' : '2px solid black'} !important;
                    border-top: none !important;
                    font-family: 'Inter', sans-serif;
                    width: 100%;
                    max-width: 850px;
                    margin: 0 auto;
                    background: white !important;
                    min-height: calc(100vh - 200px) !important;
                    box-shadow: ${isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.1)'} !important;
                    box-sizing: border-box;
                    color: #1a1a1a !important;
                    border-radius: 0 0 4px 4px;
                }
                .docspace-editor .ql-editor {
                    min-height: calc(100vh - 200px);
                    padding: 1in !important;
                    line-height: 1.5;
                    color: #000 !important;
                    width: 100%;
                    box-sizing: border-box;
                }
                .docspace-editor .ql-editor * {
                    color: inherit !important;
                }
                .docspace-editor .ql-editor.ql-blank::before {
                    color: #94a3b8 !important;
                    font-style: normal;
                    left: 1in;
                }
                
                /* Template Specific Support */
                .docspace-editor.template-IEEE .ql-editor, .docspace-editor.template-ACM .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                    column-count: 2;
                    column-gap: 0.3in;
                    column-fill: balance;
                    text-align: justify;
                }
                .docspace-editor.template-Springer .ql-editor {
                    font-family: 'Arial', sans-serif !important;
                }
                .docspace-editor.template-APA .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                    line-height: 2.0;
                    font-size: 11pt;
                }
                .docspace-editor.template-Elsevier .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                }
                
                /* Force Column Span for multi-column templates */
                .docspace-editor.template-IEEE .ql-editor h1.paper-title,
                .docspace-editor.template-IEEE .ql-editor .authors-block,
                .docspace-editor.template-IEEE .ql-editor .abstract-section,
                .docspace-editor.template-IEEE .ql-editor .keywords-section,
                .docspace-editor.template-IEEE .ql-editor .contributions-block,
                .docspace-editor.template-IEEE .ql-editor hr,
                .docspace-editor.template-ACM .ql-editor h1.paper-title,
                .docspace-editor.template-ACM .ql-editor .authors-block,
                .docspace-editor.template-ACM .ql-editor .abstract-section,
                .docspace-editor.template-ACM .ql-editor .keywords-section,
                .docspace-editor.template-ACM .ql-editor .contributions-block,
                .docspace-editor.template-ACM .ql-editor hr {
                    column-span: all !important;
                    width: 100%;
                    display: block;
                }
                
                .docspace-editor blockquote {
                    border-left: 4px solid #7c3aed;
                    padding-left: 1rem;
                    margin-left: 0;
                    font-style: italic;
                    color: #4b5563;
                }
                .docspace-editor .ql-editor h1 { font-size: 24pt; font-weight: normal; margin-bottom: 2rem; color: #000 !important; text-align: center; }
                .docspace-editor .ql-editor h2 { font-size: 11pt; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.8rem; color: #000 !important; text-align: center; text-transform: uppercase; }
                .docspace-editor .ql-editor p { margin-bottom: 0.5rem; }
            `}</style>

            {/* Navigation Sidebar (Synced with rest of app) */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 ${isSidebarOpen ? 'lg:flex' : 'lg:hidden'} ${isDark ? 'bg-black/80 backdrop-blur-xl border-white/5' : 'bg-white/80 backdrop-blur-xl border-black/5'}`}>
                <div className={`p-8 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <div className="flex items-center gap-3 text-[#38bdf8] font-bold text-2xl tracking-tight">
                        <div className={`p-2 rounded-xl transition-all ${isDark ? 'bg-[#38bdf8]/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}>
                            <LayoutDashboard size={22} className={isDark ? "text-[#38bdf8]" : "text-black"} />
                        </div>
                        <span className="font-black tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: isDark ? 'linear-gradient(90deg, #38bdf8, #FFFFFF, #38bdf8)' : 'linear-gradient(90deg, #0284c7, #000000, #0284c7)' }}>CLARION</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
                    <SidebarItem icon={<LayoutDashboard size={18} />} text="Home" onClick={() => navigate('/home')} isDark={isDark} />
                    <SidebarItem icon={<Search size={18} />} text="Discover Papers" onClick={() => navigate('/search')} isDark={isDark} />
                    <SidebarItem icon={<BookOpen size={18} />} text="Paper Drafting" onClick={() => navigate('/draft')} isDark={isDark} />
                    <SidebarItem icon={<Edit3 size={18} />} text="DocSpace Editor" active={true} onClick={() => { }} isDark={isDark} />
                    <SidebarItem icon={<FileText size={18} />} text="Workspace" onClick={() => navigate('/workspace')} isDark={isDark} />
                    <SidebarItem icon={<Star size={18} />} text="My Library" onClick={() => navigate('/library')} isDark={isDark} />
                    <SidebarItem icon={<Bot size={18} />} text="AI Assistant" onClick={() => navigate('/ai')} isDark={isDark} />
                    <SidebarItem icon={<Compass size={18} />} text="Research Guide" onClick={() => navigate('/guide')} isDark={isDark} />
                    <SidebarItem icon={<GitPullRequest size={18} />} text="Contributions" onClick={() => navigate('/contributions')} isDark={isDark} />
                </nav>
                <div className={`p-4 border-t space-y-2 ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                    <SidebarItem icon={<Settings size={18} />} text="Settings" onClick={() => navigate('/settings')} isDark={isDark} />
                    <button onClick={handleLogout} className={`flex items-center gap-3 transition-all duration-300 w-full px-4 py-3 rounded-2xl border border-transparent ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/5' : 'text-gray-600 hover:bg-red-50 hover:border-transparent hover:text-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                        <LogOut size={18} /><span className="font-medium tracking-wide text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col relative overflow-hidden ${isDark ? 'bg-black' : 'bg-[#f8fafc]'}`}>
                <div className={`z-20 h-16 flex items-center justify-between px-8 border-b backdrop-blur-md ${isDark ? 'bg-black/40 border-white/5 text-white' : 'bg-white/40 border-black/5 text-black'}`}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400' : 'bg-white border border-transparent text-black shadow-[4px_4px_0_#e2e8f0] hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-semibold">DocSpace Editor</h2>
                    </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Toolbar / Actions Header (Neatened) */}
                    <div className={`px-8 py-4 flex items-center justify-between border-b backdrop-blur-sm ${isDark ? 'bg-white/5 border-white/5' : 'bg-white/40 border-black/10'}`}>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleCreateNewDoc}
                                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isDark ? '' : 'bg-white border border-transparent text-black shadow-[4px_4px_0_#e2e8f0] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                                style={isDark ? {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: '1.5px solid #38bdf8',
                                    boxShadow: '0 0 12px rgba(56,189,248,0.25)',
                                } : {}}
                                onMouseEnter={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 22px rgba(56,189,248,0.55)' }}
                                onMouseLeave={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)' }}
                            >
                                <Plus size={16} /> New Doc
                            </button>
                            <input
                                type="text"
                                value={activeDocTitle}
                                onChange={(e) => { setActiveDocTitle(e.target.value); setSaveStatus('unsaved'); }}
                                className={`text-lg font-bold bg-transparent border-none outline-none focus:ring-0 min-w-[200px] ${isDark ? 'text-gray-200' : 'text-black'}`}
                                placeholder="Untitled Document"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSaveDoc}
                                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isDark ? '' : 'bg-white border border-transparent text-black shadow-[4px_4px_0_#e2e8f0] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                                style={isDark ? {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: '1.5px solid #38bdf8',
                                    boxShadow: '0 0 12px rgba(56,189,248,0.25)',
                                } : {}}
                                onMouseEnter={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 22px rgba(56,189,248,0.55)' }}
                                onMouseLeave={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)' }}
                            >
                                <Save size={16} /> Save
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 ${isDark ? '' : 'bg-white border border-transparent text-black shadow-[4px_4px_0_#e2e8f0] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                                style={isDark ? {
                                    background: '#000000',
                                    color: '#ffffff',
                                    border: '1.5px solid #38bdf8',
                                    boxShadow: '0 0 12px rgba(56,189,248,0.25)',
                                } : {}}
                                onMouseEnter={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 22px rgba(56,189,248,0.55)' }}
                                onMouseLeave={e => { if (isDark) e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)' }}
                            >
                                <Download size={16} /> PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden">
                        {/* Doc List Panel */}
                        <div className={`w-64 border-r overflow-y-auto hidden md:block ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/40 border-black/10'}`}>
                            <div className="p-4 space-y-2">
                                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 px-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Recent Papers</h3>
                                {documents.map(doc => (
                                    <div
                                        key={doc._id}
                                        onClick={() => handleSelectDoc(doc)}
                                        className={`p-3 rounded-xl border transition-all cursor-pointer group ${activeDocId === doc._id ? (isDark ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' : 'bg-[#e0f2fe] text-[#0284c7] border-[#38bdf8]') : (isDark ? 'border-transparent hover:bg-white/5 text-gray-400 hover:text-gray-200' : 'bg-transparent text-gray-600 border border-transparent hover:bg-white hover:border-[#38bdf8] hover:text-black hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]')}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${activeDocId === doc._id ? (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-transparent') : (isDark ? 'bg-white/5 text-gray-500 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-black')}`}>
                                                <FileText size={16} />
                                            </div>
                                            <div className="flex-1 truncate">
                                                <p className="text-sm font-bold truncate">{doc.title || 'Untitled'}</p>
                                                <p className="text-[10px] opacity-60">{new Date(doc.updatedAt).toLocaleDateString()}</p>
                                            </div>
                                            {activeDocId === doc._id && (
                                                <button onClick={(e) => handleDeleteDoc(e, doc._id)} className="p-1 hover:text-red-500 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Editor Container (Neatly placed page) */}
                        <div className={`flex-1 p-8 overflow-y-auto ${isDark ? 'bg-[#121212]' : 'bg-[#e8eaed]'}`} ref={paperRef}>
                            {activeDoc ? (
                                <div className={`w-full max-w-[850px] mx-auto shadow-2xl docspace-editor ${isDark ? 'shadow-black/60' : 'shadow-black/20'} ${activeTemplate ? 'template-' + activeTemplate.split(' ')[0] : ''}`}>
                                    <ReactQuill
                                        theme="snow"
                                        value={editorContent}
                                        onChange={handleEditorChange}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Start writing your research paper here..."
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <FileText size={64} className="mb-4 opacity-20" />
                                    <p className="text-lg font-medium tracking-wide">Select a document to begin</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
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

export default DocSpace;
