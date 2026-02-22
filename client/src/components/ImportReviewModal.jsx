import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';

const ImportReviewModal = ({ isOpen, onClose, selectedPapers, onConfirm }) => {
    const [reviewedPapers, setReviewedPapers] = useState([]);
    const [loading, setLoading] = useState(false);

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
            const response = await fetch('http://localhost:5001/api/llama/extract', {
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#181818] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">

                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-white">Review & Import Papers</h2>
                        <p className="text-gray-400 text-sm mt-1">Set the specific domain and title for your workspace.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {reviewedPapers.map((paper, index) => (
                        <div key={index} className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
                            <div className="flex gap-4 items-start">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Paper Title</label>
                                    <input
                                        type="text"
                                        value={paper.customTitle}
                                        onChange={(e) => handleChange(index, 'customTitle', e.target.value)}
                                        className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition"
                                    />
                                    <p className="text-xs text-gray-500 mt-1 truncate">{paper.authors.join(', ')}</p>
                                </div>
                                <div className="w-48">
                                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Domain</label>
                                    <select
                                        value={paper.domain}
                                        onChange={(e) => handleChange(index, 'domain', e.target.value)}
                                        className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 transition appearance-none"
                                    >
                                        {domains.map(d => <option key={d} value={d} className="bg-[#121212]">{d}</option>)}
                                    </select>
                                </div>
                                <div className="w-12 pt-6">
                                    <button
                                        type="button"
                                        onClick={() => handleMagicExtract(index)}
                                        disabled={loading}
                                        title="Magic Extract with LlamaIndex"
                                        className="p-2.5 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg text-white hover:opacity-90 transition disabled:opacity-50"
                                    >
                                        <Sparkles size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-600 line-clamp-1">{paper.abstract}</div>
                        </div>
                    ))}
                </div>

                <div className="p-6 border-t border-white/5 flex rationalize justify-end gap-3 bg-[#181818] rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg font-medium text-gray-300 hover:text-white hover:bg-white/5 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="px-8 py-2.5 rounded-lg font-bold bg-purple-600 hover:bg-purple-700 text-white transition shadow-lg shadow-purple-900/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Importing...' : <><Check size={18} /> Import {reviewedPapers.length} Papers</>}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ImportReviewModal;
