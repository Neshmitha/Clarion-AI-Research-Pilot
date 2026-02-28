import AppSidebar from '../components/AppSidebar';
import HamburgerButton from '../components/HamburgerButton';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { LayoutDashboard, Search, FileText, Upload, Settings, LogOut, Plus, File, Menu, Trash2, Edit2, BookOpen, Bot, Star, Edit3, Compass, Send, Loader2, X, ChevronDown, Eye, EyeOff , GitPullRequest } from 'lucide-react';
import UploadModal from '../components/UploadModal';
import EditPaperModal from '../components/EditPaperModal';

const AiAssistant = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user] = useState(JSON.parse(localStorage.getItem('user')) || {});
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    // Chatbot States
    const [query, setQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('ALL DOMAINS');
    const [availablePapers, setAvailablePapers] = useState([]);
    const [selectedPaperId, setSelectedPaperId] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hi! I'm your Clarion AI. Select a domain and a specific paper for deep research analysis!" }
    ]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [showJsonView, setShowJsonView] = useState(false);
    const [showPaperView, setShowPaperView] = useState(false);
    const [extractedJson, setExtractedJson] = useState(null);
    const messagesEndRef = useRef(null);

    const domains = [
        'ALL DOMAINS', 'Agriculture', 'Climate', 'Medtech',
        'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
        'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
        'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
        'Environmental Science', 'Other'
    ];

    useEffect(() => {
        fetchPapers();
    }, [selectedDomain]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (location.state?.paperId) {
            const paperId = location.state.paperId;
            const domain = location.state.domain;

            setSelectedPaperId(paperId);
            if (domain) setSelectedDomain(domain);

            // Add a welcome message
            setMessages(prev => {
                if (prev.length > 1) return prev; // Avoid duplicate welcome
                return [
                    ...prev,
                    { role: 'bot', content: `I've loaded your selected research paper. How can I assist with your analysis?` }
                ];
            });
        }
    }, [location.state]);

    // Automatically load metadata when a paper is selected (via state or manual)
    useEffect(() => {
        if (selectedPaperId && availablePapers.length > 0) {
            const paper = availablePapers.find(p => p._id === selectedPaperId);
            if (paper?.llamaMetadata) {
                setExtractedJson(paper.llamaMetadata);
            }
        }
    }, [selectedPaperId, availablePapers]);

    const fetchPapers = async () => {
        try {
            const userId = user.id || user._id;
            if (!userId) return;
            const url = selectedDomain === 'ALL DOMAINS'
                ? `${API_BASE_URL}/papers/${userId}`
                : `${API_BASE_URL}/papers/domain/${userId}/${selectedDomain}`;
            const res = await axios.get(url);
            setAvailablePapers(res.data);
            if (selectedPaperId && !res.data.find(p => p._id === selectedPaperId)) {
                setSelectedPaperId('');
                setExtractedJson(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleMagicAnalyze = async () => {
        if (!selectedPaperId || analyzing) return;
        const paper = availablePapers.find(p => p._id === selectedPaperId);
        if (!paper) return;

        setAnalyzing(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/llama/extract`, {
                paperId: paper._id,
                pdfUrl: paper.pdfUrl,
                filePath: paper.filePath
            });

            if (res.data.success) {
                setExtractedJson(res.data.data);
                setShowJsonView(true);
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: `Analysis complete for "${paper.title}"! I've extracted the research parameters. You can view the structured JSON below.`
                }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: "Analysis failed. Ensure the paper is a valid PDF." }]);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery('');
        setLoading(true);

        try {
            const res = await axios.post(`${API_BASE_URL}/chatbot/ask`, {
                userId: user.id || user._id,
                query: query,
                domain: selectedDomain,
                paperId: selectedPaperId
            });
            setMessages(prev => [...prev, { role: 'bot', content: res.data.answer, sources: res.data.sources }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting right now." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className={`flex h-screen font-sans overflow-hidden transition-all ${isDark ? 'bg-neutral-900 text-white' : 'bg-[#f8fafc] text-black'}`}>
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} activePage="ai" isDark={isDark} onClose={() => setIsSidebarOpen(false)} />

            {/* Main Content (AI Assistant Interface) */}
            <main className={`flex-1 flex flex-col relative ${isDark ? 'bg-[#121212]' : 'bg-transparent'}`}>
                <header className={`z-10 h-20 flex items-center justify-between px-8 border-b backdrop-blur-md ${isDark ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white/40'}`}>
                    <div className="flex items-center gap-4">
                        <HamburgerButton isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDark={isDark} />
                        <h2 className={`text-xl font-semibold ${isDark ? 'text-gray-200' : 'text-black'}`}>AI Assistant</h2>
                    </div>
                </header>

                <div className={`flex-1 overflow-hidden flex flex-col w-full p-4 lg:p-8 transition-all duration-500 ${showPaperView ? 'max-w-none' : 'max-w-5xl mx-auto'}`}>
                    <div className={`flex-1 flex gap-6 overflow-hidden ${showPaperView ? 'flex-row' : 'flex-col'}`}>
                        {/* Chat Area */}
                        <div className={`flex flex-col overflow-hidden transition-all duration-500 ${showPaperView ? 'w-1/2' : 'w-full flex-1'}`}>
                            <div className={`flex-1 rounded-3xl border overflow-hidden flex flex-col mb-6 ${isDark ? 'bg-black/40 border-white/5' : 'bg-white/80 border-gray-200 shadow-sm'}`}>
                                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                                    {messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                                                ? (isDark ? 'bg-[#000000] text-white border border-[#38bdf8]/40 shadow-[0_0_20px_rgba(56,189,248,0.1)]' : 'bg-[#f0f9ff] text-blue-900 border border-transparent shadow-sm')
                                                : (isDark ? 'bg-white/5 text-gray-200 border border-white/10' : 'bg-white border border-gray-100 text-gray-800 shadow-sm')}`}>
                                                <div className={`prose prose-sm whitespace-pre-wrap leading-relaxed ${isDark ? 'prose-invert' : ''}`}>
                                                    {msg.content}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className={`rounded-2xl p-4 flex items-center gap-3 border shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-transparent'}`}>
                                                <Loader2 size={16} className={`animate-spin ${isDark ? 'text-[#38bdf8]' : 'text-blue-600'}`} />
                                                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Synthesizing research...</span>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className={`p-6 border-t ${isDark ? 'border-white/5 bg-black/20' : 'border-black/5 bg-white/50'}`}>
                                    {/* Selectors moved down */}
                                    <div className="flex flex-wrap gap-3 mb-4">
                                        <div className="flex-1 min-w-[140px] relative">
                                            <label className={`text-[9px] font-bold uppercase block mb-1.5 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Domain</label>
                                            <select
                                                value={selectedDomain}
                                                onChange={(e) => setSelectedDomain(e.target.value)}
                                                className={`w-full rounded-lg py-2 px-3 text-xs focus:outline-none appearance-none cursor-pointer transition-all ${isDark ? 'bg-black border border-[#38bdf8]/20 text-white focus:border-[#38bdf8]/50' : 'bg-white border-transparent text-gray-800 shadow-sm focus:border-blue-300 hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]'}`}
                                            >
                                                {domains.map(d => <option key={d} value={d} className={isDark ? "bg-black text-[12px]" : "bg-white text-[12px]"}>{d}</option>)}
                                            </select>
                                            <ChevronDown className={`absolute right-3 bottom-2.5 pointer-events-none ${isDark ? 'text-[#38bdf8]/60' : 'text-blue-500'}`} size={12} />
                                        </div>
                                        <div className="flex-[2] min-w-[200px] relative">
                                            <label className={`text-[9px] font-bold uppercase block mb-1.5 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Research Paper</label>
                                            <select
                                                value={selectedPaperId}
                                                onChange={(e) => setSelectedPaperId(e.target.value)}
                                                className={`w-full rounded-lg py-2 px-3 text-xs focus:outline-none appearance-none cursor-pointer transition-all ${isDark ? 'bg-black border border-[#38bdf8]/20 text-white focus:border-[#38bdf8]/50' : 'bg-white border-transparent text-gray-800 shadow-sm focus:border-blue-300 hover:shadow-[0_0_15px_rgba(56,189,248,0.5)]'}`}
                                            >
                                                <option value="" className={isDark ? "bg-black text-[12px]" : "bg-white text-[12px]"}>All Papers Workspace</option>
                                                {availablePapers.map(p => <option key={p._id} value={p._id} className={isDark ? "bg-black text-[12px]" : "bg-white text-[12px]"}>{p.title}</option>)}
                                            </select>
                                            <ChevronDown className={`absolute right-3 bottom-2.5 pointer-events-none ${isDark ? 'text-[#38bdf8]/60' : 'text-blue-500'}`} size={12} />
                                        </div>

                                        {selectedPaperId && (
                                            <div className="flex items-end gap-2">
                                                <button
                                                    onClick={() => setShowPaperView(!showPaperView)}
                                                    title={showPaperView ? "Hide Paper" : "View Paper PDF"}
                                                    className={`p-2 rounded-lg transition-all duration-300 ${isDark ? 'text-white border' : 'bg-white border text-gray-600 shadow-sm hover:text-blue-600'}`}
                                                    style={isDark ? {
                                                        background: '#000000',
                                                        borderColor: showPaperView ? '#38bdf8' : 'rgba(56,189,248,0.4)',
                                                        boxShadow: showPaperView ? '0 0 15px rgba(56,189,248,0.4)' : '0 0 10px rgba(56,189,248,0.15)'
                                                    } : {
                                                        borderColor: 'transparent'
                                                    }}
                                                    onMouseEnter={!isDark && (e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.6)'; e.currentTarget.style.transform = 'translateY(-2px)' })}
                                                    onMouseLeave={!isDark && (e => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; e.currentTarget.style.transform = 'translateY(0)' })}
                                                >
                                                    {showPaperView ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                                <button
                                                    onClick={handleMagicAnalyze}
                                                    disabled={analyzing}
                                                    title="Magic Analyze with LlamaIndex"
                                                    className={`p-2 rounded-lg transition-all duration-300 disabled:opacity-50 ${isDark ? 'text-white border' : 'bg-white border text-gray-600 shadow-sm hover:text-blue-600'}`}
                                                    style={isDark ? {
                                                        background: '#000000',
                                                        borderColor: 'rgba(56,189,248,0.4)',
                                                        boxShadow: '0 0 10px rgba(56,189,248,0.15)',
                                                    } : {
                                                        borderColor: 'transparent'
                                                    }}
                                                    onMouseEnter={isDark ? (e => e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.4)') : (e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.6)'; e.currentTarget.style.transform = 'translateY(-2px)' })}
                                                    onMouseLeave={isDark ? (e => e.currentTarget.style.boxShadow = '0 0 10px rgba(56,189,248,0.15)') : (e => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; e.currentTarget.style.transform = 'translateY(0)' })}
                                                >
                                                    {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                                                </button>
                                                {extractedJson && (
                                                    <button
                                                        onClick={() => setShowJsonView(!showJsonView)}
                                                        className={`px-3 py-2 text-[10px] font-bold rounded-lg transition-all ${isDark ? 'bg-white/5 border border-white/10 text-gray-400 hover:text-white' : 'bg-[#f0f9ff] text-blue-700 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:-translate-y-0.5'}`}
                                                    >
                                                        {showJsonView ? 'HIDE JSON' : 'VIEW JSON'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {showJsonView && extractedJson && (
                                        <div className={`mb-4 rounded-xl p-4 max-h-[250px] overflow-y-auto font-mono text-[11px] animate-slide-up scrollbar-hide ${isDark ? 'bg-black/60 border border-[#38bdf8]/30 text-cyan-400' : 'bg-gray-50 border border-transparent shadow-inner text-blue-900'}`}>
                                            <div className={`flex justify-between items-center mb-3 pb-2 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                                <span className={`font-bold uppercase tracking-widest text-[10px] ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>Extracted Metadata</span>
                                                <button onClick={() => setShowJsonView(false)} className={`hover:text-black transition ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400'}`}><X size={14} /></button>
                                            </div>
                                            <pre className="whitespace-pre-wrap">{JSON.stringify(extractedJson, null, 2)}</pre>
                                        </div>
                                    )}

                                    <form onSubmit={handleSend} className="relative mt-2">
                                        <input
                                            type="text"
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Inquire about methodology, results, or technical details..."
                                            className={`w-full rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:ring-2 transition-all ${isDark ? 'bg-black border border-[#38bdf8]/30 text-white focus:ring-[#38bdf8]/50 placeholder:text-gray-600' : 'bg-white border border-transparent text-gray-800 shadow-sm focus:ring-blue-300 placeholder:text-gray-400 hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!query.trim() || loading}
                                            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all duration-200 disabled:opacity-50 ${isDark ? 'text-white border' : 'bg-[#e0f2fe] text-blue-700 shadow-sm'}`}
                                            style={isDark ? {
                                                background: '#000000',
                                                borderColor: 'rgba(56,189,248,0.4)',
                                                boxShadow: '0 0 12px rgba(56,189,248,0.25)',
                                            } : {}}
                                            onMouseEnter={isDark ? (e => e.currentTarget.style.boxShadow = '0 0 22px rgba(56,189,248,0.55)') : (e => { e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.6)'; e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)' })}
                                            onMouseLeave={isDark ? (e => e.currentTarget.style.boxShadow = '0 0 12px rgba(56,189,248,0.25)') : (e => { e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; e.currentTarget.style.transform = 'translateY(-50%)' })}
                                        >
                                            <Send size={20} />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Paper Viewer Side Pane */}
                        {showPaperView && (
                            <div className={`w-1/2 flex flex-col h-full rounded-3xl border overflow-hidden animate-slide-left ${isDark ? 'bg-black/40 border-[#38bdf8]/20' : 'bg-white border-transparent shadow-sm'}`}>
                                <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/5 bg-black/20' : 'border-black/5 bg-gray-50'}`}>
                                    <div className="flex items-center gap-2">
                                        <FileText size={18} className={isDark ? "text-[#38bdf8]" : "text-blue-600"} />
                                        <span className={`text-sm font-bold truncate max-w-[300px] ${isDark ? 'text-white' : 'text-gray-800'}`}>
                                            {availablePapers.find(p => p._id === selectedPaperId)?.title || 'Research Paper'}
                                        </span>
                                    </div>
                                    <button onClick={() => setShowPaperView(false)} className={`transition ${isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-black'}`}>
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className={`flex-1 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    {selectedPaperId ? (
                                        <iframe
                                            src={(() => {
                                                const paper = availablePapers.find(p => p._id === selectedPaperId);
                                                if (!paper) return '';
                                                return paper.pdfUrl || (paper.filePath ? `http://127.0.0.1:5001/${encodeURI(paper.filePath.replace(/\\/g, '/'))}` : '');
                                            })()}
                                            className="w-full h-full border-none"
                                            title="Paper Viewer"
                                        />
                                    ) : (
                                        <div className={`h-full flex items-center justify-center ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Select a paper to view PDF
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={() => { }} />
            </main>
        </div>
    );
};


export default AiAssistant;
