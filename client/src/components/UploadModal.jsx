import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle, ChevronDown, Loader2 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState('Artificial Intelligence');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

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
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="bg-[#0a0a0a] border border-[#38bdf8]/20 w-full max-w-lg rounded-3xl shadow-[0_0_50px_rgba(56,189,248,0.1)] p-8 relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-[#38bdf8] transition">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
                    <div className="p-2 bg-[#38bdf8]/10 rounded-xl border border-[#38bdf8]/30">
                        <Upload className="text-[#38bdf8]" size={24} />
                    </div>
                    Import Research Data
                </h2>
                <p className="text-gray-500 text-sm mb-8">Add new scholarly papers to your premium workspace.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Paper Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#38bdf8]/20 text-white focus:outline-none focus:border-[#38bdf8]/60 transition-all placeholder:text-gray-700"
                            placeholder="e.g. Advancements in Large Language Models"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">Research Domain</label>
                        <div className="relative">
                            <select
                                value={domain}
                                onChange={(e) => setDomain(e.target.value)}
                                className="w-full px-4 py-3.5 rounded-xl bg-black border border-[#38bdf8]/20 text-white focus:outline-none focus:border-[#38bdf8]/60 appearance-none cursor-pointer transition-all"
                            >
                                {domains.map(d => <option key={d} value={d} className="bg-black">{d}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-[#38bdf8] pointer-events-none" size={18} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-2 ml-1">File (PDF)</label>
                        <div className="group border-2 border-dashed border-[#38bdf8]/20 rounded-2xl p-8 flex flex-col items-center justify-center text-gray-500 hover:border-[#38bdf8]/60 hover:bg-[#38bdf8]/5 transition-all cursor-pointer relative shadow-inner">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            {file ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30">
                                        <CheckCircle className="text-green-400" size={32} />
                                    </div>
                                    <span className="font-bold text-white text-sm tracking-wide">{file.name}</span>
                                    <button className="text-xs text-gray-500 hover:text-red-400 transition underline underline-offset-4">Change File</button>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                        <FileText size={40} className="text-gray-600 group-hover:text-[#38bdf8]" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-400 mt-4 group-hover:text-white transition-colors">Click to upload or drag and drop</p>
                                    <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-widest font-black">PDF only • MAX 10MB</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-4 text-white font-black rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                        style={{
                            background: '#0a0a0a',
                            border: '1px solid #38bdf8',
                            boxShadow: '0 0 15px rgba(56,189,248,0.25)',
                            letterSpacing: '0.05em'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 30px rgba(56,189,248,0.5)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 15px rgba(56,189,248,0.25)'}
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
