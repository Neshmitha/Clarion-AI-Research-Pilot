import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle } from 'lucide-react';
import axios from 'axios';

const UploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
    const [title, setTitle] = useState('');
    const [domain, setDomain] = useState('Agriculture');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const domains = ['Agriculture', 'Climate', 'AIML', 'Medtech'];

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
            await axios.post('http://localhost:5001/api/papers/upload', formData, {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition">
                    <X size={24} />
                </button>

                <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                    <Upload className="text-purple-500" size={24} /> Upload Research Paper
                </h2>
                <p className="text-gray-400 text-sm mb-6">Add a new paper to your workspace.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Paper Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition placeholder-gray-600"
                            placeholder="e.g. AI in Healthcare"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Domain</label>
                        <select
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/10 text-white focus:outline-none focus:border-purple-500 transition"
                        >
                            {domains.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">File (PDF)</label>
                        <div className="border-2 border-dashed border-white/10 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:border-purple-500/50 hover:bg-white/5 transition cursor-pointer relative">
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            {file ? (
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle size={20} />
                                    <span className="font-medium text-sm">{file.name}</span>
                                </div>
                            ) : (
                                <>
                                    <FileText size={32} className="mb-2 text-gray-500" />
                                    <span className="text-sm">Click to upload or drag and drop</span>
                                    <span className="text-xs text-gray-600 mt-1">PDF only (max 10MB)</span>
                                </>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg transition shadow-lg shadow-purple-900/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                    >
                        {loading ? 'Uploading...' : 'Upload to Workspace'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;
