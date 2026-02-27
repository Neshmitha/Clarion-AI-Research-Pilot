import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const UploadModal = ({ isOpen, onClose, onUploadSuccess, isDark }) => {
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState('Artificial Intelligence');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDarkInternal = theme === 'dark';
    const activeIsDark = isDark !== undefined ? isDark : isDarkInternal;
    React.useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    if (!isOpen) return null;

    const domains = [
        'Agriculture', 'Climate', 'Medtech',
        'Artificial Intelligence', 'Machine Learning', 'Computer Vision', 'Natural Language Processing',
        'Cybersecurity', 'Quantum Physics', 'Astrophysics', 'Nanotechnology', 'Biotechnology',
        'Medical Sciences', 'Neuroscience', 'Mathematics', 'Statistics', 'Economics',
        'Environmental Science', 'Other'
    ];

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return alert('Please select a file');

        const formData = new FormData();
        const user = JSON.parse(localStorage.getItem('user'));
        formData.append('userId', user.id || user._id);
        formData.append('title', title);
        formData.append('domain', domain);
        formData.append('file', file);
        formData.append('originalName', file.name);

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/papers/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setLoading(false);
            onUploadSuccess();
            onClose();
            setTitle('');
            setFile(null);
            alert('Paper uploaded successfully!');
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert('Upload failed');
        }
    };

    return (
        <div className={`fixed inset-0 z-[110] flex items-center justify-center backdrop-blur-md ${activeIsDark ? 'bg-black/80' : 'bg-black/50'}`}>
            <div className={`w-full max-w-lg rounded-3xl p-8 relative animate-fade-in-up ${activeIsDark ? 'bg-[#0a0a0a] border border-[#38bdf8]/20 shadow-[0_0_50px_rgba(56,189,248,0.1)]' : 'bg-white border border-blue-100 shadow-[0_10px_40px_rgba(0,0,0,0.08)]'}`}>
                <button onClick={onClose} className={`absolute top-6 right-6 transition ${activeIsDark ? 'text-gray-400 hover:text-[#38bdf8]' : 'text-gray-500 hover:text-blue-600'}`}>
                    <X size={24} />
                </button>

                <h2 className={`text-2xl font-bold mb-1 flex items-center gap-3 ${activeIsDark ? 'text-white' : 'text-gray-800'}`}>
                    <div className={`p-2 rounded-xl border ${activeIsDark ? 'bg-[#38bdf8]/10 border-[#38bdf8]/30' : 'bg-blue-50 border-blue-200'}`}>
                        <Upload className={activeIsDark ? "text-[#38bdf8]" : "text-blue-600"} size={24} />
                    </div>
                    Import Research Data
                </h2>
                <p className={`text-sm mb-8 ${activeIsDark ? 'text-gray-500' : 'text-gray-500'}`}>Add new scholarly papers to your premium workspace.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-[10px] font-bold uppercase mb-2 ml-1 ${activeIsDark ? 'text-gray-500' : 'text-gray-500'}`}>Paper Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={`w-full px-4 py-3.5 rounded-xl focus:outline-none transition-all ${activeIsDark ? 'bg-black border border-[#38bdf8]/20 text-white focus:border-[#38bdf8]/60 placeholder:text-gray-700' : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400 focus:bg-white placeholder:text-gray-400'}`}
                            placeholder="e.g. Advancements in Large Language Models"
                            required
                        />
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold uppercase mb-2 ml-1 ${activeIsDark ? 'text-gray-500' : 'text-gray-500'}`}>Research Domain</label>
                        <div className="relative">
                            <select
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className={`w-full px-4 py-3.5 rounded-xl focus:outline-none appearance-none cursor-pointer transition-all ${activeIsDark ? 'bg-black border border-[#38bdf8]/20 text-white focus:border-[#38bdf8]/60' : 'bg-gray-50 border border-gray-200 text-gray-800 focus:border-blue-400 focus:bg-white'}`}
                            >
                                {domains.map(d => <option key={d} value={d} className={activeIsDark ? "bg-black text-white" : "bg-white text-black"}>{d}</option>)}
                            </select>
                            <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${activeIsDark ? 'text-[#38bdf8]' : 'text-blue-500'}`} size={18} />
                        </div>
                    </div>

                    <div>
                        <label className={`block text-[10px] font-bold uppercase mb-2 ml-1 ${activeIsDark ? 'text-gray-500' : 'text-gray-500'}`}>File (PDF)</label>
                        <div className={`group border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative ${activeIsDark ? 'border-[#38bdf8]/20 text-gray-500 hover:border-[#38bdf8]/60 hover:bg-[#38bdf8]/5 shadow-inner' : 'border-blue-200 text-gray-500 hover:border-blue-400 hover:bg-blue-50 bg-gray-50/50'}`}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className={`p-3 rounded-full border ${activeIsDark ? 'bg-green-500/10 border-green-500/30' : 'bg-green-100 border-green-200'}`}>
                                        <CheckCircle className={activeIsDark ? "text-green-400" : "text-green-500"} size={32} />
                                    </div>
                                    <span className={`font-bold text-sm tracking-wide ${activeIsDark ? 'text-white' : 'text-gray-800'}`}>{file.name}</span>
                                    <button className={`text-xs transition underline underline-offset-4 ${activeIsDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}>Change File</button>
                                </div>
                            ) : (
                                <>
                                    <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform duration-300 ${activeIsDark ? 'bg-white/5' : 'bg-blue-100/50'}`}>
                                        <FileText size={40} className={`transition-colors ${activeIsDark ? 'text-gray-600 group-hover:text-[#38bdf8]' : 'text-blue-300 group-hover:text-blue-500'}`} />
                                    </div>
                                    <p className={`text-sm font-bold mt-4 transition-colors ${activeIsDark ? 'text-gray-400 group-hover:text-white' : 'text-gray-500 group-hover:text-blue-600'}`}>Click to upload or drag and drop</p>
                                    <span className={`text-[10px] mt-1 uppercase tracking-widest font-black ${activeIsDark ? 'text-gray-600' : 'text-gray-500'}`}>PDF only • MAX 10MB</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 px-4 font-black rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2 ${activeIsDark ? 'text-white' : 'text-black bg-white hover:-translate-y-0.5'}`}
                        style={activeIsDark ? {
                            background: '#0a0a0a',
                            border: '1px solid #38bdf8',
                            boxShadow: '0 0 15px rgba(56,189,248,0.25)',
                            letterSpacing: '0.05em'
                        } : {
                            border: '2px solid #38bdf8',
                            boxShadow: '0 0 12px rgba(56,189,248,0.3)',
                            letterSpacing: '0.05em'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.boxShadow = activeIsDark ? '0 0 30px rgba(56,189,248,0.5)' : '0 0 25px rgba(56,189,248,0.7), 0 0 6px rgba(56,189,248,0.9)' }}
                        onMouseLeave={e => { e.currentTarget.style.boxShadow = activeIsDark ? '0 0 15px rgba(56,189,248,0.25)' : '0 0 12px rgba(56,189,248,0.3)' }}
                    >
                        {loading ? (
                            <><Loader2 className="animate-spin" size={20} /> SYNCING...</>
                        ) : (
                            'UPLOAD TO WORKSPACE'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
