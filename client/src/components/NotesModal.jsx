import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Edit3 } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../config';

const NotesModal = ({ isOpen, onClose, paper, onUpdateSuccess, isDark }) => {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (paper) {
            setNotes(paper.notes || '');
        }
    }, [paper]);

    if (!isOpen || !paper) return null;

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(`${API_BASE_URL}/papers/${paper._id}`, {
                notes: notes
            });
            onUpdateSuccess();
            onClose();
        } catch (err) {
            console.error('Failed to save notes:', err);
            alert('Failed to save notes. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden transition-all duration-300 ${isDark ? 'bg-[#0a0a0a] border border-[#38bdf8]/30 shadow-[#38bdf8]/10' : 'bg-white border-2 border-transparent shadow-xl'}`}
                    >
                        {/* Header */}
                        <div className={`flex items-center justify-between p-8 border-b transition-colors ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50/50'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-colors ${isDark ? 'bg-[#38bdf8]/10' : 'bg-blue-50'}`}>
                                    <Edit3 size={24} className={isDark ? "text-[#38bdf8]" : "text-blue-600"} />
                                </div>
                                <div>
                                    <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>Paper Notes</h2>
                                    <p className={`text-xs font-medium line-clamp-1 mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{paper.title}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`p-2 rounded-xl transition-all ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-400 hover:text-black'}`}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8">
                            <label className={`block text-xs font-black uppercase tracking-[0.2em] mb-4 ml-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Your Insights
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Jot down key takeaways, ideas, or references related to this paper..."
                                className={`w-full h-80 rounded-[24px] p-6 transition-all outline-none font-medium leading-relaxed text-lg resize-none ${isDark ? 'bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:border-[#38bdf8]/40 focus:ring-4 focus:ring-[#38bdf8]/10' : 'bg-gray-50/50 border-2 border-transparent text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500/20 focus:ring-8 focus:ring-blue-100/50'}`}
                            />
                        </div>

                        {/* Footer */}
                        <div className={`flex items-center justify-end gap-4 p-8 border-t transition-colors ${isDark ? 'border-white/5 bg-white/5' : 'border-gray-100 bg-gray-50/50'}`}>
                            <button
                                onClick={onClose}
                                className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-gray-500 hover:text-black hover:bg-gray-100'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-[#38bdf8] text-black hover:bg-[#0ea5e9] shadow-lg shadow-[#38bdf8]/20' : 'bg-white border border-transparent shadow-sm text-blue-600 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(56,189,248,0.8),_0_0_5px_rgba(56,189,248,1)]'}`}
                            >
                                <Save size={16} strokeWidth={3} />
                                {isSaving ? 'Processing...' : 'Save Notes'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default NotesModal;
