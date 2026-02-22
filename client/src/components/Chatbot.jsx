import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Loader2, Bot, User, FileText, ChevronDown } from 'lucide-react';
import axios from 'axios';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('Artificial Intelligence');
    const [availablePapers, setAvailablePapers] = useState([]);
    const [selectedPaperId, setSelectedPaperId] = useState('');
    const [showJsonView, setShowJsonView] = useState(false);
    const [extractedJson, setExtractedJson] = useState(null);
    const [messages, setMessages] = useState([
        { role: 'bot', content: "Hi! I'm your ResearchPilot AI. Select a domain and a specific paper to start deep analysis!" }
    ]);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const messagesEndRef = useRef(null);

    const domains = [
        'Agriculture', 'Climate', 'Medtech',
        'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
        'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
        'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
        'Environmental Science', 'Other'
    ];

    useEffect(() => {
        fetchPapers();
    }, [selectedDomain, isOpen]);

    const fetchPapers = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const userId = user.id || user._id;
            const res = await axios.get(`http://localhost:5001/api/papers/domain/${userId}/${selectedDomain}`);
            setAvailablePapers(res.data);
            if (res.data.length > 0) {
                // Keep current selection if valid, else pick first
                if (!res.data.find(p => p._id === selectedPaperId)) {
                    setSelectedPaperId(res.data[0]._id);
                    setExtractedJson(res.data[0].llamaMetadata || null);
                }
            } else {
                setSelectedPaperId('');
                setExtractedJson(null);
            }
        } catch (err) {
            console.error("Error fetching papers:", err);
        }
    };

    const handleMagicAnalyze = async () => {
        if (!selectedPaperId || analyzing) return;

        const paper = availablePapers.find(p => p._id === selectedPaperId);
        if (!paper) return;

        setAnalyzing(true);
        try {
            const res = await axios.post('http://localhost:5001/api/llama/extract', {
                paperId: paper._id,
                pdfUrl: paper.pdfUrl,
                filePath: paper.filePath
            });

            if (res.data.success) {
                setExtractedJson(res.data.data);
                setShowJsonView(true);
                setMessages(prev => [...prev, {
                    role: 'bot',
                    content: `Analysis complete for "${paper.title}"! I've extracted the research parameters. You can view the structured JSON or ask me questions about it.`
                }]);
            }
        } catch (err) {
            console.error("LlamaIndex Error:", err);
            setMessages(prev => [...prev, { role: 'bot', content: "Analysis failed. Please ensure the paper is a valid PDF and the agent is running." }]);
        } finally {
            setAnalyzing(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userMessage = { role: 'user', content: query };
        setMessages(prev => [...prev, userMessage]);
        setQuery('');
        setLoading(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const res = await axios.post('http://localhost:5001/api/chatbot/ask', {
                userId: user.id || user._id,
                query: query,
                domain: selectedDomain,
                paperId: selectedPaperId
            });


            const botMessage = {
                role: 'bot',
                content: res.data.answer,
                domain: res.data.domain,
                sources: res.data.sources
            };

            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting to the brain. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] font-sans">
            {/* Chat Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-16 h-16 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:scale-110 transition-transform duration-300 group"
                >
                    <MessageSquare size={28} className="group-hover:rotate-12 transition-transform" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></div>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="w-[400px] h-[600px] bg-neutral-900 border border-white/10 rounded-2xl shadow-3xl flex flex-col overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">
                                <Bot size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Research Assistant</h3>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white p-1">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20'
                                    : 'bg-white/5 text-gray-200 border border-white/10 shadow-xl'
                                    }`}>
                                    {msg.role === 'bot' && (
                                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-purple-400">
                                            <Bot size={12} />
                                            <span>AI Assistant</span>
                                            {msg.domain && (
                                                <>
                                                    <span className="text-gray-600">•</span>
                                                    <span className="text-blue-400">{msg.domain}</span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                    <div className="prose prose-invert prose-sm whitespace-pre-wrap leading-relaxed">
                                        {msg.content}
                                    </div>
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase mb-2">Sources:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {msg.sources.map((src, sIdx) => (
                                                    <div key={sIdx} className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md text-[10px] text-gray-400 border border-white/5 truncate max-w-full">
                                                        <FileText size={10} className="text-purple-400 shrink-0" />
                                                        <span className="truncate">{src}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                    <Loader2 size={16} className="text-purple-400 animate-spin" />
                                    <span className="text-xs text-gray-400 italic">Analyzing papers and thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-md">
                        {/* Selectors and Actions */}
                        <div className="space-y-3 mb-3">
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 ml-1">Domain</label>
                                    <select
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-gray-300 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                                    >
                                        {domains.map(d => <option key={d} value={d} className="bg-neutral-900">{d}</option>)}
                                    </select>
                                </div>
                                <div className="flex-[1.5]">
                                    <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1.5 ml-1">Research Paper</label>
                                    <select
                                        value={selectedPaperId}
                                        onChange={(e) => {
                                            setSelectedPaperId(e.target.value);
                                            const p = availablePapers.find(x => x._id === e.target.value);
                                            setExtractedJson(p?.llamaMetadata || null);
                                        }}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-[11px] text-gray-300 focus:outline-none focus:border-purple-500/50 transition-all cursor-pointer"
                                    >
                                        {availablePapers.length > 0 ? (
                                            availablePapers.map(p => <option key={p._id} value={p._id} className="bg-neutral-900">{p.title}</option>)
                                        ) : (
                                            <option value="" className="bg-neutral-900">No papers found</option>
                                        )}
                                    </select>
                                </div>
                            </div>

                            {selectedPaperId && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleMagicAnalyze}
                                        disabled={analyzing}
                                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg py-1.5 px-3 text-[11px] font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {analyzing ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                                        {analyzing ? 'Analyzing...' : 'Magic Analyze'}
                                    </button>
                                    {extractedJson && (
                                        <button
                                            onClick={() => setShowJsonView(!showJsonView)}
                                            className="bg-white/5 border border-white/10 text-gray-400 rounded-lg py-1.5 px-3 text-[11px] font-bold hover:bg-white/10 transition-all"
                                        >
                                            {showJsonView ? 'Hide JSON' : 'View JSON'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {showJsonView && extractedJson && (
                            <div className="mb-4 bg-black/60 border border-purple-500/30 rounded-xl p-3 max-h-[200px] overflow-y-auto font-mono text-[10px] text-green-400 scrollbar-hide animate-slide-down">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10">
                                    <span className="text-purple-400 font-bold uppercase tracking-wider">Extracted Metadata</span>
                                    <button onClick={() => setShowJsonView(false)} className="text-gray-500 hover:text-white">
                                        <X size={12} />
                                    </button>
                                </div>
                                <pre className="whitespace-pre-wrap">
                                    {JSON.stringify(extractedJson, null, 2)}
                                </pre>
                            </div>
                        )}

                        <form onSubmit={handleSend} className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Ask about your research..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                            />
                            <button
                                type="submit"
                                disabled={!query.trim() || loading}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:bg-gray-600"
                            >
                                <Send size={16} />
                            </button>
                        </form>
                        <p className="text-[10px] text-center text-gray-500 mt-2">
                            Powered by **Gemini AI** & ResearchPilot RAG
                        </p>
                    </div>

                </div>
            )}
        </div>
    );
};

export default Chatbot;
