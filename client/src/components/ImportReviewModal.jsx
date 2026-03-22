import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import API_BASE_URL from '../config';

const ImportReviewModal = ({ isOpen, onClose, selectedPapers, onConfirm }) => {
    const [reviewedPapers, setReviewedPapers] = useState([]);
    const [loading, setLoading] = useState(false);

    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    const domains = [
        'Agriculture', 'Climate', 'Medtech',
        'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
        'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
        'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
        'Environmental Science', 'Other'
    ];

    useEffect(() => {
        if (isOpen && selectedPapers) {
            // Initialize with default values
            setReviewedPapers(selectedPapers.map(p => ({
                ...p,
                customTitle: p.title,
                domain: 'Other' // Default domain
            })));
        }
    }, [isOpen, selectedPapers]);

    const handleChange = (index, field, value) => {
        const newPapers = [...reviewedPapers];
        newPapers[index][field] = value;
        setReviewedPapers(newPapers);
    };

    const handleMagicExtract = async (index) => {
        const paper = reviewedPapers[index];
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/llama/extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfUrl: paper.pdfLink,
                    filePath: paper.filePath,
                    paperId: paper._id
                })
            });
            const result = await response.json();
            if (result.success && result.data) {
                const extracted = result.data;
                const newPapers = [...reviewedPapers];
                newPapers[index] = {
                    ...newPapers[index],
                    customTitle: extracted.title || newPapers[index].customTitle,
                    abstract: extracted.abstract || newPapers[index].abstract,
                    authors: extracted.authors ? extracted.authors.map(a => typeof a === 'object' ? a.name : a) : newPapers[index].authors
                };
                setReviewedPapers(newPapers);
            }
        } catch (err) {
            console.error('Extraction failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm(reviewedPapers);
        setLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[120] flex items-center justify-center backdrop-blur-md p-4 ${isDark ? "bg-black/85" : "bg-white/50"}`}>
            <div className={`rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-fade-in-up ${isDark ? "bg-[#0a0a0a] border border-[#38bdf8]/20 shadow-[0_0_80px_rgba(56,189,248,0.15)]" : "bg-white border border-[#38bdf8] shadow-[0_0_40px_rgba(56,189,248,0.25)]"}`}>

                <div className={`flex items-center justify-between p-8 border-b ${isDark ? "border-white/5 bg-black/20" : "border-black/5 bg-[#f8fafc] rounded-t-3xl"}`}>
                    <div>
                        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-black"}`}>Review & Synchronize</h2>
                        <p className="text-gray-500 text-sm mt-1">Refine metadata and assign domains before final integration.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[#38bdf8]/10 rounded-xl transition text-gray-500 hover:text-[#38bdf8]">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {reviewedPapers.map((paper, index) => (
                        <div key={index} className={`rounded-xl p-4 flex flex-col gap-4 border ${isDark ? "bg-black/20 border-white/5" : "bg-white border-black/10 shadow-sm"}`}>
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Paper Title</label>
                                    <input
                                        type="text"
                                        value={paper.customTitle}
                                        onChange={(e) => handleChange(index, 'customTitle', e.target.value)}
                                        className={`w-full rounded-lg px-3 py-2 transition-all font-medium border focus:outline-none focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/30 ${isDark ? "bg-[#0a0a0a] border-[#38bdf8]/20 text-white" : "bg-white border-black/10 text-black shadow-[0_0_10px_rgba(56,189,248,0.05)] focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]"}`}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 truncate">{paper.authors.join(', ')}</p>
                                </div>
                                <div className="w-48 relative">
                                    <label className="block text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider ml-1">Domain</label>
                                    <select
                                        value={paper.domain}
                                        onChange={(e) => handleChange(index, 'domain', e.target.value)}
                                        className={`w-full rounded-xl px-4 py-2.5 text-xs focus:outline-none border transition-all appearance-none font-bold cursor-pointer ${isDark ? "bg-[#000000] text-white border-[#38bdf8]/20 focus:border-[#38bdf8]/60" : "bg-white text-black border-black/10 focus:border-[#38bdf8] focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]"}`}
                                    >
                                        {domains.map(d => <option key={d} value={d} className={isDark ? "bg-black" : "bg-white"}>{d}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-[38px] text-[#38bdf8] pointer-events-none" size={14} />
                                </div>
                                <div className="w-12 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => handleMagicExtract(index)}
                                        disabled={loading}
                                        title="Magic Extract with LlamaIndex"
                                        className="p-2.5 rounded-lg text-white transition-all duration-300 disabled:opacity-50"
                                        style={{
                                            background: isDark ? '#0a0a0a' : '#ffffff',
                                            border: '1px solid #38bdf8',
                                            boxShadow: '0 0 10px rgba(56,189,248,0.2)',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(56,189,248,0.5)'}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 10px rgba(56,189,248,0.2)'}
                                    >
                                        <Sparkles size={18} className={isDark ? 'text-white' : 'text-[#0284c7]'} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-1">{paper.abstract}</div>
                        </div>
                    ))}
                </div>

                <div className={`p-8 border-t flex rationalize justify-end items-center gap-4 rounded-b-3xl ${isDark ? "border-white/5 bg-black/40" : "border-black/5 bg-[#f8fafc]"}`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2.5 rounded-xl font-bold text-[13px] transition-all uppercase tracking-widest ${isDark ? "text-gray-500 hover:text-white hover:bg-white/5" : "text-gray-600 hover:text-black hover:bg-black/5"}`}
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className={`px-10 py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 disabled:cursor-not-allowed ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]' : 'bg-white text-black border border-transparent shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)] hover:-translate-y-1'}`}
                    >
                        {loading ? <><Loader2 className="animate-spin" size={18} /> SYNCING...</> : <><Check size={18} /> CONFIRM IMPORT</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ImportReviewModal;
