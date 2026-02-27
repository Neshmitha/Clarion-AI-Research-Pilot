import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { ArrowLeft, Send, Upload, FileText, CheckCircle2, ChevronDown, List, PlusCircle, Trash2 } from 'lucide-react';

const NewContribution = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        domain: '',
        type: 'idea',
        description: '',
        tags: '',
        researchPaperFile: '' // Mock URL for now
    });

    // Issues Array State
    const [issues, setIssues] = useState([]);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Issue Modifiers
    const handleAddIssue = () => {
        setIssues([...issues, { issueTitle: '', issueDescription: '', questions: ['', '', ''] }]);
    };

    const handleRemoveIssue = (index) => {
        setIssues(issues.filter((_, i) => i !== index));
    };

    const handleIssueChange = (index, field, value) => {
        const updated = [...issues];
        updated[index][field] = value;
        setIssues(updated);
    };

    const handleQuestionChange = (issueIndex, qIndex, value) => {
        const updated = [...issues];
        updated[issueIndex].questions[qIndex] = value;
        setIssues(updated);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Final Validation for Questions
        for (let i = 0; i < issues.length; i++) {
            if (issues[i].questions.some(q => q.trim() === '')) {
                alert('All exactly 3 questions in every issue must be filled out.');
                return;
            }
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                issues,
                userId: user.id || user._id,
                tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : []
            };
            await axios.post(`${API_BASE_URL}/contributions`, payload);
            navigate('/contributions');
        } catch (err) {
            console.error('Error submitting contribution:', err);
            alert(err.response?.data?.message || 'Failed to submit contribution');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`min-h-screen font-sans ${isDark ? 'bg-black text-white' : 'bg-[#f8fafc] text-black'}`}>
            <header className={`h-20 flex items-center px-8 border-b ${isDark ? 'border-white/5 bg-black/40' : 'border-[#38bdf8]/20 bg-white/40'} backdrop-blur-md sticky top-0 z-50`}>
                <button onClick={() => navigate('/contributions')} className={`flex items-center gap-2 font-bold transition-all ${isDark ? 'text-gray-400 hover:text-[#38bdf8]' : 'text-gray-500 hover:text-[#0284c7]'}`}>
                    <ArrowLeft size={20} /> Back to Contributions
                </button>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-black mb-4 tracking-tight">Start My Contribution</h1>
                    <p className={`text-lg font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Share your research, insights, or replication studies with the Clarion community.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Details Block */}
                    <div className={`p-8 rounded-3xl border shadow-xl ${isDark ? 'bg-[#0f0f0f] border-white/10 shadow-black/50' : 'bg-white border-[#38bdf8]/20 shadow-[0_10px_40px_rgba(56,189,248,0.1)]'}`}>
                        <div className="space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2 mb-4 border-b pb-4 dark:border-white/10 border-gray-200">
                                <FileText size={20} className="text-[#38bdf8]" /> Basic Details
                            </h2>
                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Contribution Title</label>
                                <input
                                    required
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="E.g. Novel approach to Transformer architecture..."
                                    className={`w-full rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-600' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8] placeholder:text-gray-400 focus:bg-white focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Domain</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="text"
                                            name="domain"
                                            value={formData.domain}
                                            onChange={handleChange}
                                            placeholder="e.g. Artificial Intelligence, Neuroscience..."
                                            className={`w-full rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8]' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8] focus:bg-white focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Contribution Type</label>
                                    <div className="relative">
                                        <select
                                            required
                                            name="type"
                                            value={formData.type}
                                            onChange={handleChange}
                                            className={`w-full rounded-2xl py-4 pl-5 pr-10 text-sm font-bold outline-none appearance-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8]' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8] focus:bg-white focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                        >
                                            <option value="idea">Hypothesis / Idea</option>
                                            <option value="replication">Replication Study</option>
                                            <option value="improvement">Algorithm Improvement</option>
                                            <option value="insight">Data Insight</option>
                                            <option value="summary">Literature Summary</option>
                                            <option value="survey">Field Survey</option>
                                        </select>
                                        <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-[#38bdf8]'}`} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Description</label>
                                <textarea
                                    required
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="5"
                                    placeholder="Clearly explain your findings, hypothesis, or summary..."
                                    className={`w-full rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all resize-none shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-600' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8] placeholder:text-gray-400 focus:bg-white focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tags (comma separated)</label>
                                <input
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleChange}
                                    placeholder="E.g. NLP, LLMs, Optimization"
                                    className={`w-full rounded-xl py-3 px-4 text-sm font-semibold outline-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-white focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-700' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8] placeholder:text-gray-400 focus:bg-white focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                />
                            </div>

                            <div className="space-y-2 pb-4">
                                <label className={`text-[10px] font-black uppercase tracking-widest pl-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Attach Document Link (Optional)</label>
                                <div className="relative">
                                    <FileText size={18} className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                                    <input
                                        name="researchPaperFile"
                                        value={formData.researchPaperFile}
                                        onChange={handleChange}
                                        placeholder="https://colab.research.google.com/..."
                                        className={`w-full rounded-xl py-3 pl-12 pr-4 text-sm font-semibold outline-none transition-all shadow-inner ${isDark ? 'bg-black/50 border border-white/5 text-[#38bdf8] focus:border-[#38bdf8] focus:bg-black placeholder:text-gray-700' : 'bg-gray-50 border text-[#0284c7] border-gray-200 focus:border-[#38bdf8] placeholder:text-gray-400 focus:bg-white focus:shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Important: Issues Section Container */}
                    <div className={`p-8 rounded-3xl border shadow-xl ${isDark ? 'bg-black/80 border-[#38bdf8]/30 shadow-[#38bdf8]/10' : 'bg-blue-50/50 border-[#38bdf8]/40 shadow-[0_10px_40px_rgba(56,189,248,0.2)]'}`}>
                        <div className="flex justify-between items-center mb-6 pb-4 border-b dark:border-white/10 border-gray-300">
                            <div>
                                <h2 className={`text-xl font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    <List size={20} className="text-[#38bdf8]" /> Track Specific Issues
                                </h2>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Pinpoint challenges or limitations and ask community for feedback natively.</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddIssue}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${isDark ? 'bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8] hover:text-black border border-[#38bdf8]/30' : 'bg-blue-100 text-[#0284c7] hover:bg-[#0284c7] hover:text-white border border-[#38bdf8]/50'}`}
                            >
                                <PlusCircle size={14} /> Add Issue
                            </button>
                        </div>

                        {issues.length === 0 ? (
                            <div className={`text-center py-10 font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                No issues added yet. Click 'Add Issue' to create one!
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {issues.map((issue, issueIdx) => (
                                    <div key={issueIdx} className={`p-6 rounded-2xl border relative ${isDark ? 'bg-[#111111] border-white/10' : 'bg-white border-blue-200'}`}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveIssue(issueIdx)}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-400 p-2 opacity-50 hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <h4 className={`text-sm font-black uppercase tracking-widest mb-4 flex gap-2 items-center ${isDark ? 'text-gray-500' : 'text-blue-400'}`}>
                                            Issue #{issueIdx + 1}
                                        </h4>

                                        <div className="space-y-4 mb-6">
                                            <input
                                                required
                                                value={issue.issueTitle}
                                                onChange={(e) => handleIssueChange(issueIdx, 'issueTitle', e.target.value)}
                                                placeholder="What is the title of the issue? e.g. Data Distribution Bias"
                                                className={`w-full rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all ${isDark ? 'bg-black border border-white/10 text-white focus:border-[#38bdf8]' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8]'}`}
                                            />
                                            <textarea
                                                required
                                                value={issue.issueDescription}
                                                onChange={(e) => handleIssueChange(issueIdx, 'issueDescription', e.target.value)}
                                                rows={2}
                                                placeholder="Describe what exactly went wrong or needs insight..."
                                                className={`w-full rounded-xl py-3 px-4 text-sm font-bold outline-none transition-all resize-none ${isDark ? 'bg-black border border-white/10 text-white focus:border-[#38bdf8]' : 'bg-gray-50 border text-black border-gray-200 focus:border-[#38bdf8]'}`}
                                            />
                                        </div>

                                        <div className={`p-4 rounded-xl border border-dashed ${isDark ? 'border-white/20 bg-black/40' : 'border-[#38bdf8]/40 bg-blue-50/50'}`}>
                                            <h5 className={`text-[10px] font-black uppercase tracking-widest pl-1 mb-3 ${isDark ? 'text-gray-400' : 'text-[#0284c7]'}`}>Required: Exactly 3 Questions for Community</h5>
                                            <div className="space-y-2">
                                                {issue.questions.map((q, qIndex) => (
                                                    <div key={qIndex} className="flex items-center gap-3">
                                                        <span className="font-black text-xs text-gray-500 w-4 text-right">{qIndex + 1}.</span>
                                                        <input
                                                            required
                                                            value={q}
                                                            onChange={(e) => handleQuestionChange(issueIdx, qIndex, e.target.value)}
                                                            placeholder={`Question ${qIndex + 1}...`}
                                                            className={`flex-1 rounded-lg py-2 px-3 text-sm font-semibold outline-none transition-all ${isDark ? 'bg-[#0f0f0f] border border-white/10 text-gray-300 focus:border-[#38bdf8]' : 'bg-white border text-gray-600 border-gray-200 focus:border-[#38bdf8]'}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-6 flex items-center justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-10 py-5 w-full md:w-auto rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 border ${isDark ? 'bg-[#38bdf8] text-black shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:shadow-[0_0_40px_rgba(56,189,248,0.6)]' : 'bg-black text-white hover:shadow-2xl'}`}
                        >
                            {loading ? 'Submitting...' : 'Submit Contribution'} <Send size={18} />
                        </button>
                    </div>

                </form>
            </main>
        </div>
    );
};

export default NewContribution;
