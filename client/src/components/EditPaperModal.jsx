import React, { useState, useEffect } from 'react';
import { X, Save, Edit3 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const EditPaperModal = ({ isOpen, onClose, paper, onUpdateSuccess, isDark }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (paper) {
            setTitle(paper.title);
            setDomain(paper.domain);
        }
    }, [paper]);

    if (!isOpen || !paper) return null;

    const domains = [
        'Agriculture', 'Climate', 'Medtech',
        'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
        'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
        'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
        'Environmental Science', 'Other'
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put(`${API_BASE_URL}/papers/${paper._id}`, {
                title,
                domain
            });
            setLoading(false);
            onUpdateSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert('Update failed');
        }
    };

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md ${isDark ? 'bg-black/80' : 'bg-black/40'}`}>
            <div className={`w-full max-w-lg rounded-2xl p-8 relative animate-fade-in-up transition-all ${isDark ? 'bg-[#0a0a0a] border border-[#38bdf8]/30 shadow-[0_0_40px_rgba(56,189,248,0.15)]' : 'bg-white border-2 border-transparent text-black shadow-md'}`}>
                <button onClick={onClose} className={`absolute top-4 right-4 transition-all border-2 border-transparent p-1.5 rounded-lg ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black hover:border-transparent hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(56,189,248,0.8),_0_0_3px_rgba(56,189,248,1)]'}`}>
                    <X size={24} />
                </button>

                <h2 className={`text-2xl font-black mb-8 flex items-center gap-3 ${isDark ? 'text-white' : 'text-blue-700'}`}>
                    <Save className={isDark ? 'text-[#38bdf8]' : 'text-blue-700'} size={26} /> Edit Paper
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Paper Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition font-medium ${isDark ? 'bg-black border-white/10 text-white focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8]/30 placeholder-gray-600' : 'bg-white border-2 border-transparent text-black shadow-sm focus:-translate-y-1 focus:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)] placeholder-gray-400'}`}
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Domain</label>
                        <select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition font-medium cursor-pointer ${isDark ? 'bg-black border-white/10 text-white focus:border-[#38bdf8]' : 'bg-white border-2 border-transparent text-black shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)] focus:-translate-y-1 focus:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                        >
                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    {paper.source === 'written' && (
                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Paper Content</label>
                            <button
                                type="button"
                                onClick={() => { onClose(); navigate('/docspace', { state: { paperId: paper._id } }); }}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all border-2 ${isDark ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border-transparent' : 'bg-[#e0f2fe] border-transparent text-blue-700 shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                            >
                                <Edit3 size={18} /> Edit Content in DocSpace
                            </button>
                        </div>
                    )}

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className={`flex-1 flex items-center justify-center py-3 px-4 font-bold rounded-xl transition-all border-2 ${isDark ? 'bg-white/5 hover:bg-white/10 text-white border-transparent' : 'bg-white border-transparent text-gray-600 hover:text-black shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-[2] flex items-center justify-center py-3 px-8 font-black rounded-xl transition-all disabled:opacity-50 border-2 ${isDark ? 'bg-[#38bdf8] hover:bg-[#0ea5e9] text-black shadow-[0_4px_15px_rgba(58,189,248,0.3)] border-transparent' : 'bg-white border-transparent text-black shadow-sm hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPaperModal;
