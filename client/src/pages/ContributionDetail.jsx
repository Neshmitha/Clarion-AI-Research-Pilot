import AppSidebar from '../components/AppSidebar';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import {
    ArrowLeft, MessageSquare, CheckCircle2, XCircle, Clock, LayoutDashboard, Search, Settings, LogOut, Menu, BookOpen, Bot, Edit3, Compass,
    Send, GitPullRequest, ExternalLink, Activity, Sparkles, User, Tag, List, ChevronDown,
    Calendar, Upload, Star, AlertCircle, FileText, Mail, Trash2
} from 'lucide-react';
import { formatDistanceToNow, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const ContributionDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';
    const scrollRef = useRef(null);

    const [contribution, setContribution] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Form States
    const [activeIssueIndex, setActiveIssueIndex] = useState(null);
    const [responseAnswers, setResponseAnswers] = useState([]);

    // Task Workflow States
    const [deadlineFormId, setDeadlineFormId] = useState(null);
    const [deadlineValue, setDeadlineValue] = useState('');
    const [instructionValue, setInstructionValue] = useState('');
    const [submissionFile, setSubmissionFile] = useState('');
    const [submissionDesc, setSubmissionDesc] = useState('');
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    // Modal states
    const [selectedResponder, setSelectedResponder] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const fetchDetail = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/contributions/${id}`);
            setContribution(res.data);
            setTimeout(() => {
                if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }, 300);
        } catch (err) {
            console.error('Error fetching details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleAnswerChange = (index, value) => {
        const updated = [...responseAnswers];
        updated[index] = value;
        setResponseAnswers(updated);
    };

    const handleOpenPitchForm = (idx, questions) => {
        setResponseAnswers(new Array(questions.length).fill(''));
        setActiveIssueIndex(idx);
    };

    const handleSubmitResponse = async (issueId, e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/contributions/${id}/issues/${issueId}/responses`, {
                userId: user.id || user._id,
                answers: responseAnswers
            });
            setResponseAnswers([]);
            setActiveIssueIndex(null);
            fetchDetail();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit response');
        }
    };

    const handleUpdateStatus = async (status) => {
        try {
            await axios.put(`${API_BASE_URL}/contributions/${id}`, { userId: user.id || user._id, status });
            fetchDetail();
        } catch (err) {
            alert('Failed to update status');
        }
    };
    const handleDeleteContribution = async () => {
        const currentUserId = (user.id || user._id)?.toString()?.trim();
        if (!currentUserId) {
            alert("Error: User session not found. Please log out and sign in again.");
            return;
        }

        if (!window.confirm('Are you sure you want to delete this research contribution? This action cannot be undone.')) return;

        try {
            await axios.delete(`${API_BASE_URL}/contributions/${id}`, {
                params: { userId: currentUserId }
            });
            navigate('/contributions');
        } catch (err) {
            console.error('Delete error', err);
            const msg = err.response?.data?.message || 'Failed to delete contribution';
            const debug = err.response?.data?.debug;
            alert(`${msg}${debug ? `\n(ID Mismatch: ${debug.received} vs ${debug.expected})` : ''}`);
        }
    };


    const handleAcceptPitch = async (responseId) => {
        try {
            await axios.put(`${API_BASE_URL}/contributions/${id}/responses/${responseId}/accept-pitch`, {
                userId: user.id || user._id,
                deadline: deadlineValue,
                optionalInstructions: instructionValue
            });
            setDeadlineValue('');
            setInstructionValue('');
            fetchDetail();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept pitch');
        }
    };

    const handleSubmitSolution = async (responseId) => {
        try {
            await axios.post(`${API_BASE_URL}/contributions/${id}/responses/${responseId}/submit-solution`, {
                userId: user.id || user._id,
                solutionPDF: submissionFile,
                solutionDescription: submissionDesc
            });
            setSubmissionFile('');
            setSubmissionDesc('');
            fetchDetail();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit solution');
        }
    };

    const handleFinalReview = async (responseId, status) => {
        try {
            await axios.put(`${API_BASE_URL}/contributions/${id}/responses/${responseId}/final-review`, {
                userId: user.id || user._id,
                status
            });
            fetchDetail();
        } catch (err) {
            alert('Failed to update review');
        }
    };

    const handleRate = async (responseId) => {
        try {
            await axios.post(`${API_BASE_URL}/contributions/${id}/responses/${responseId}/rate`, {
                userId: user.id || user._id,
                rating: ratingValue,
                ratingComment
            });
            setRatingComment('');
            fetchDetail();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to rate');
        }
    };

    const openProfileModal = (responder) => {
        setSelectedResponder(responder);
        setIsProfileModalOpen(true);
    };

    if (loading) return <div className={`min-h-screen flex items-center justify-center font-bold text-lg animate-pulse ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>Loading...</div>;
    if (!contribution) return <div className={`min-h-screen flex items-center justify-center font-bold text-lg ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>Not Found</div>;

    const isAuthor = contribution.author?._id === (user.id || user._id);

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-black text-white' : 'bg-white text-black'}`}>
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} activePage="contributions" isDark={isDark} onClose={() => setIsSidebarOpen(false)} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Visual Glows */}
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#38bdf8]/10 rounded-full blur-[120px] pointer-events-none"></div>

                <header className={`h-20 flex-shrink-0 flex items-center px-8 justify-between border-b ${isDark ? 'border-white/5 bg-black/40' : 'border-[#38bdf8]/30 bg-white/60 shadow-[0_4px_30px_rgba(56,189,248,0.05)]'} backdrop-blur-md z-50`}>
                    <div className="flex items-center gap-6">
                        
                        <button onClick={() => navigate('/contributions')} className={`p-2 rounded-xl transition ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-600'}`}>
                            <ArrowLeft size={20} />
                        </button>
                        <div className="flex items-center gap-3 font-bold text-lg tracking-tight text-white uppercase">
                            <span>CONTRIB #{contribution._id.toString().slice(-4).toUpperCase()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isAuthor && (
                            <button
                                onClick={handleDeleteContribution}
                                className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20' : 'border-red-100 bg-red-50 text-red-500 hover:bg-red-100 shadow-sm'}`}
                                title="Delete Contribution"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <div className="hidden md:flex items-center gap-3">
                            {contribution.status === 'active' ? (
                                <span className="bg-green-500/20 text-green-500 border border-green-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"><GitPullRequest size={14} /> Active</span>
                            ) : (
                                <span className="bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2"><XCircle size={14} /> Closed</span>
                            )}
                        </div>
                        {isAuthor && contribution.status === 'active' && (
                            <button onClick={() => handleUpdateStatus('closed')} className={`px-5 py-2.5 rounded-xl font-bold text-sm bg-red-500/20 hover:bg-red-500 text-white transition-all`}>
                                Close
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 min-h-0 lg:overflow-hidden w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 lg:p-8 pt-4">
                    {/* Left Side Meta */}
                    <div className="lg:w-1/2 min-h-0 space-y-6 lg:border-r lg:pr-8 border-dashed border-gray-500/20 lg:overflow-y-auto lg:h-full pr-2">
                        <div className="space-y-4">
                            <h1 className="text-3xl font-black leading-tight">{contribution.title}</h1>
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-[#38bdf8]/10 text-[#38bdf8] border border-[#38bdf8]/30">{contribution.type}</span>
                                <span className="px-4 py-1.5 text-xs font-black uppercase tracking-wider rounded-xl bg-white/5 text-gray-300 border border-white/10">{contribution.domain}</span>
                            </div>
                        </div>

                        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0f0f0f] border-white/10' : 'bg-white border-[#38bdf8]/30 shadow-[0_8px_30px_rgba(56,189,248,0.05)]'}`}>
                            <div className="flex justify-between mb-4"><h3 className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-[#0284c7]/50'}`}>Description</h3><span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-[#0284c7]'}`}><User size={14} className="inline mr-1" /> {contribution.author?.username}</span></div>
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{contribution.description}</p>
                        </div>

                        {contribution.researchPaperFile && (
                            <div className="p-6 rounded-3xl border bg-black/50 border-white/5 text-[#38bdf8] flex items-center justify-between">
                                <h3 className="font-bold flex items-center gap-2"><ExternalLink size={18} /> Research Document</h3>
                                <a href={contribution.researchPaperFile} target="_blank" className="text-sm font-black uppercase hover:underline">Open</a>
                            </div>
                        )}


                        {/* Contributor List */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><CheckCircle2 size={16} /> Verified Contributors</h3>
                            <div className="flex flex-wrap gap-3">
                                {contribution.contributorsList?.map(c => (
                                    <div key={c._id} className={`flex items-center gap-2 p-2 pr-4 rounded-xl border text-xs font-bold ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-[#38bdf8]/30 text-[#0284c7] shadow-sm'}`}>
                                        <div className="w-6 h-6 rounded bg-[#38bdf8] text-white flex items-center justify-center shadow-sm">{c.username[0].toUpperCase()}</div>
                                        {c.fullName || c.username}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Side Workflow */}
                    <div className="lg:w-1/2 flex flex-col min-h-0 space-y-6 overflow-y-auto pr-2 pb-40" ref={scrollRef}>
                        <h2 className="text-xl font-bold flex items-center gap-2"><List size={20} className="text-[#38bdf8]" /> Project Pipeline ({contribution.responses?.length || 0})</h2>

                        {contribution.issues?.map((issue, idx) => {
                            const isIssueResolved = issue.isResolved;
                            const issueResponses = contribution.responses?.filter(r => String(r.issueId) === String(issue._id)) || [];
                            return (
                                <div key={issue._id} className={`p-6 rounded-3xl border transition-all ${isDark ? 'bg-[#080808]' : 'bg-white shadow-[0_8px_30px_rgba(56,189,248,0.05)]'} ${isIssueResolved ? (isDark ? 'border-green-500/20 opacity-90' : 'border-green-500/30 opacity-90') : (isDark ? 'border-white/10' : 'border-[#38bdf8]/30')} space-y-4 relative`}>
                                    {isIssueResolved && (
                                        <div className="absolute top-0 right-0 p-6">
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                                                <CheckCircle2 size={12} /> Resolved
                                            </div>
                                        </div>
                                    )}
                                    <h4 className="text-[#38bdf8] font-black uppercase tracking-widest text-sm">Issue #{idx + 1}: {issue.issueTitle}</h4>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{issue.issueDescription}</p>

                                    <div className="space-y-3">
                                        {issueResponses.map((resp) => {
                                            const isResponder = resp.responder?._id === (user.id || user._id);
                                            const isOverdue = resp.deadline && isAfter(new Date(), new Date(resp.deadline)) && resp.taskStatus !== 'completed';

                                            return (
                                                <div key={resp._id} className={`p-5 rounded-2xl border transition-all ${isDark ? 'bg-black/50 border-white/10' : 'bg-[#f0f9ff] border-[#38bdf8]/20 shadow-sm'} ${resp.taskStatus === 'completed' ? (isDark ? 'border-green-500/30' : 'border-green-500/40') : ''}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <button onClick={() => openProfileModal(resp.responder)} className="flex items-center gap-3 group">
                                                            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-black group-hover:scale-105 transition-all border border-sky-500/20">{resp.responder?.username[0].toUpperCase()}</div>
                                                            <div className="text-left">
                                                                <div className="text-xs font-black uppercase tracking-tight group-hover:text-sky-400 transition-colors">{resp.responder?.username}</div>
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-[10px] text-gray-500 flex items-center gap-1 font-bold"><Star size={10} className="text-yellow-500" /> {resp.responder?.averageRating?.toFixed(1) || '0.0'}</div>
                                                                    <div className="text-[9px] font-black text-sky-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"><ExternalLink size={10} /> View Profile</div>
                                                                </div>
                                                            </div>
                                                        </button>
                                                        <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${resp.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                            resp.taskStatus === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                isOverdue ? 'bg-red-600/10 text-red-600 border-red-600/20' :
                                                                    resp.taskStatus === 'submitted' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                                        resp.status === 'accepted' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                                            'bg-sky-500/10 text-sky-500 border-sky-500/20'
                                                            }`}>
                                                            {resp.status === 'rejected' ? 'rejected' : isOverdue ? 'overdue' : (resp.taskStatus === 'none' ? resp.status : resp.taskStatus)}
                                                        </div>
                                                    </div>

                                                    {/* Researcher's Pitched Answers */}
                                                    <div className="space-y-3 mb-6">
                                                        <div className="text-[10px] font-black uppercase text-gray-500 tracking-[0.15em] mb-2 px-1">Detailed Response</div>
                                                        {issue.questions.map((q, qIdx) => (
                                                            <div key={qIdx} className="space-y-1.5">
                                                                <div className={`text-[9px] font-black uppercase flex items-center gap-2 ${isDark ? 'text-[#38bdf8]/70' : 'text-[#0284c7]/70'}`}>
                                                                    <div className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#38bdf8]' : 'bg-[#0284c7]'}`} />
                                                                    {q}
                                                                </div>
                                                                <div className={`text-[11px] p-3 rounded-xl border leading-relaxed font-medium italic ${isDark ? 'bg-white/5 border-white/5 text-gray-300' : 'bg-white border-[#38bdf8]/20 text-gray-700 shadow-sm'}`}>
                                                                    " {resp.answers[qIdx] || "No response recorded."} "
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Phase 1 Actions: Accept/Reject Pitch */}
                                                    {isAuthor && resp.status === 'pending' && (
                                                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-[#38bdf8]/20'} space-y-4`}>
                                                            <div className={`text-[10px] font-black uppercase mb-2 ${isDark ? 'text-sky-500' : 'text-[#0284c7]'}`}>Review Pitch Answers</div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => setDeadlineFormId(resp._id)}
                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${isDark ? 'bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-600 hover:text-white'}`}
                                                                >
                                                                    <CheckCircle2 size={12} className="inline mr-1" /> Accept Contributor
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateResponseStatus(resp._id, 'rejected')}
                                                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${isDark ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white'}`}
                                                                >
                                                                    <XCircle size={12} className="inline mr-1" /> Reject Pitch
                                                                </button>
                                                            </div>

                                                            {deadlineFormId === resp._id && (
                                                                <div className={`p-4 rounded-2xl border space-y-3 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-black/40 border-white/10' : 'bg-[#f0f9ff] border-[#38bdf8]/30 shadow-inner'}`}>
                                                                    <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-[#0284c7]/70'}`}><Calendar size={12} /> Set Target Deadline (Optional)</div>
                                                                    <input type="date" value={deadlineValue} onChange={e => setDeadlineValue(e.target.value)} className={`w-full border p-2 rounded-xl text-xs outline-none transition-all ${isDark ? 'bg-black border-white/10 text-white focus:border-sky-500' : 'bg-white border-[#38bdf8]/20 text-black focus:border-[#0284c7]'}`} />
                                                                    <textarea value={instructionValue} onChange={e => setInstructionValue(e.target.value)} placeholder="Provide any specific instructions for the solution..." className={`w-full border p-2 rounded-xl text-xs h-20 outline-none transition-all resize-none ${isDark ? 'bg-black border-white/10 text-white focus:border-sky-500' : 'bg-white border-[#38bdf8]/20 text-black focus:border-[#0284c7]'}`} />
                                                                    <div className="flex gap-2">
                                                                        <button onClick={() => setDeadlineFormId(null)} className={`flex-1 py-2 text-[10px] font-black uppercase ${isDark ? 'text-gray-500' : 'text-gray-400 hover:text-[#0284c7]'}`}>Cancel</button>
                                                                        <button onClick={() => { handleAcceptPitch(resp._id); setDeadlineFormId(null); }} className={`flex-[2] py-2 font-black uppercase text-[10px] rounded-xl shadow-lg transition-all active:scale-95 ${isDark ? 'bg-sky-500 text-black shadow-sky-500/20' : 'bg-[#0284c7] text-white shadow-[#0284c7]/20'}`}>Confirm & Authorize</button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Phase 2: Submission Form for Accepted Contributor */}
                                                    {isResponder && resp.status === 'accepted' && resp.taskStatus === 'assigned' && (
                                                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5 bg-sky-500/5' : 'border-[#38bdf8]/20 bg-[#f0f9ff]'} space-y-3 p-4 rounded-2xl border`}>
                                                            <div className={`text-[10px] font-black uppercase flex items-center gap-2 mb-2 ${isDark ? 'text-yellow-500' : 'text-[#0284c7]'}`}><Upload size={14} /> Submit Your Solution</div>
                                                            <div className="space-y-3">
                                                                <div className="space-y-1">
                                                                    <label className={`text-[9px] font-black uppercase ml-1 ${isDark ? 'text-gray-500' : 'text-[#0284c7]/60'}`}>Solution Link (PDF/Document/Repo)</label>
                                                                    <input value={submissionFile} onChange={e => setSubmissionFile(e.target.value)} placeholder="https://..." className={`w-full border p-2.5 rounded-xl text-xs outline-none transition-all ${isDark ? 'bg-black border-white/10 text-white focus:border-yellow-500' : 'bg-white border-[#38bdf8]/20 text-black focus:border-[#0284c7]'}`} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className={`text-[9px] font-black uppercase ml-1 ${isDark ? 'text-gray-500' : 'text-[#0284c7]/60'}`}>Short Description of Work</label>
                                                                    <textarea value={submissionDesc} onChange={e => setSubmissionDesc(e.target.value)} placeholder="Describe the key insights or findings..." className={`w-full border p-2.5 rounded-xl text-xs h-24 outline-none transition-all resize-none ${isDark ? 'bg-black border-white/10 text-white focus:border-yellow-500' : 'bg-white border-[#38bdf8]/20 text-black focus:border-[#0284c7]'}`} />
                                                                </div>
                                                                <button onClick={() => handleSubmitSolution(resp._id)} className={`w-full py-3 font-black uppercase text-xs rounded-xl shadow-lg transition-all active:scale-95 ${isDark ? 'bg-yellow-500 text-black shadow-yellow-500/20' : 'bg-[#0284c7] text-white shadow-[#0284c7]/20'}`}>Upload Deliverables</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Phase 3: Review / View Submitted Solution (Visible to Author and Responder) */}
                                                    {(isAuthor || isResponder) && resp.solutionPDF && (
                                                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-[#38bdf8]/20'} space-y-4`}>
                                                            <div className={`text-[10px] font-black uppercase flex items-center gap-2 ${isDark ? 'text-purple-500' : 'text-[#0284c7]'}`}>
                                                                <FileText size={14} />
                                                                {resp.taskStatus === 'completed' ? 'Final Deliverable' : isAuthor ? 'Final Solution Review' : 'Your Submitted Solution'}
                                                            </div>
                                                            <div className={`p-4 rounded-2xl border space-y-3 ${isDark ? 'bg-black/40 border-white/5' : 'bg-white border-[#38bdf8]/30 shadow-sm'}`}>
                                                                <a href={resp.solutionPDF} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-2 px-4 py-2 font-bold rounded-xl text-xs transition-all ${isDark ? 'bg-sky-500/10 text-sky-400 hover:bg-sky-500 hover:text-black' : 'bg-[#e0f2fe] text-[#0369a1] border border-[#38bdf8]/30 hover:bg-[#38bdf8] hover:text-white'}`}>
                                                                    <ExternalLink size={14} /> Open Solution File
                                                                </a>
                                                                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-[#f0f9ff] border border-[#38bdf8]/10'}`}>
                                                                    <p className={`text-[11px] leading-relaxed italic ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{resp.solutionDescription}</p>
                                                                </div>
                                                            </div>
                                                            {isAuthor && resp.taskStatus === 'submitted' && (
                                                                <div className="flex gap-2">
                                                                    <button onClick={() => handleFinalReview(resp._id, 'approved')} className={`flex-1 py-3 font-black uppercase text-xs rounded-xl shadow-lg transition-all active:scale-95 ${isDark ? 'bg-green-500 text-black shadow-green-500/20' : 'bg-green-600 text-white shadow-green-600/20'}`}>Approve Solution</button>
                                                                    <button onClick={() => handleFinalReview(resp._id, 'rejected')} className={`flex-1 py-3 font-black uppercase text-xs rounded-xl transition-all ${isDark ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-red-50 text-red-600 border border-red-200'}`}>Reject Work</button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Stage 4: Post-Approval Feedback & Ratings */}
                                                    {isAuthor && resp.taskStatus === 'completed' && !resp.rating && (
                                                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/10 bg-black/40' : 'border-[#38bdf8]/20 bg-white shadow-sm'} space-y-4 p-6 rounded-[2rem] border relative overflow-hidden`}>
                                                            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-full blur-2xl pointer-events-none" />
                                                            <div className={`text-[10px] font-black uppercase flex items-center gap-2 ${isDark ? 'text-white/40' : 'text-[#0284c7]'}`}>
                                                                <Star size={14} fill={isDark ? "#fbbf24" : "#0284c7"} className={isDark ? "" : "text-[#0284c7]"} /> Reward Contributor
                                                            </div>

                                                            <div className="flex justify-center gap-3 py-6">
                                                                {[1, 2, 3, 4, 5].map(v => (
                                                                    <button
                                                                        key={v}
                                                                        onClick={() => setRatingValue(v)}
                                                                        className={`relative transition-all duration-300 group/star ${ratingValue >= v ? 'scale-110' : 'scale-100'} hover:scale-115 active:scale-95`}
                                                                    >
                                                                        <Star
                                                                            size={26}
                                                                            fill={ratingValue >= v ? (isDark ? "#fbbf24" : "#eab308") : "transparent"}
                                                                            className={`transition-all duration-700 ${ratingValue >= v
                                                                                ? (isDark
                                                                                    ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse'
                                                                                    : 'text-yellow-500 drop-shadow-[0_0_12px_rgba(234,179,8,0.6)] animate-pulse')
                                                                                : (isDark ? 'text-white/10' : 'text-black/5 group-hover/star:text-yellow-200')
                                                                                }`}
                                                                        />
                                                                        {ratingValue >= v && (
                                                                            <div className="absolute inset-0 bg-yellow-400/15 blur-xl rounded-full animate-ping opacity-30 pointer-events-none" />
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <textarea
                                                                value={ratingComment}
                                                                onChange={e => setRatingComment(e.target.value)}
                                                                placeholder="Type a professional feedback for this researcher..."
                                                                className={`w-full border p-4 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all h-24 resize-none ${isDark
                                                                    ? 'bg-black/60 border-white/10 text-white focus:border-yellow-500'
                                                                    : 'bg-gray-50/50 border-gray-100 text-black focus:border-yellow-500'
                                                                    }`}
                                                            />

                                                            <button
                                                                onClick={() => handleRate(resp._id)}
                                                                className={`w-full py-4 font-black uppercase text-xs rounded-2xl shadow-xl transition-all active:scale-95 ${isDark
                                                                    ? 'bg-[#38bdf8] text-black shadow-[#38bdf8]/10 hover:shadow-[#38bdf8]/20'
                                                                    : 'bg-[#0284c7] text-white shadow-[#0284c7]/20 hover:shadow-[#0284c7]/30'
                                                                    }`}
                                                            >
                                                                Finalize & Issue Reward
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Contributor's View of their own Submission/Rating */}
                                                    {isResponder && resp.taskStatus === 'completed' && (
                                                        <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/5' : 'border-[#38bdf8]/20'} space-y-4`}>
                                                            <div className="text-[10px] font-black uppercase text-green-500 flex items-center gap-2">Project Completed & Verified</div>
                                                            {resp.rating && (
                                                                <div className={`p-6 rounded-[2rem] border space-y-4 ${isDark ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-yellow-50/30 border-yellow-500/10 shadow-sm'}`}>
                                                                    <div className="flex justify-between items-center">
                                                                        <div className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.2em]">Achievement Unlocked</div>
                                                                        <div className="flex gap-1">
                                                                            {[1, 2, 3, 4, 5].map(v => <Star key={v} size={14} fill={resp.rating >= v ? "#eab308" : "none"} className={resp.rating >= v ? "text-yellow-500" : (isDark ? "text-gray-800" : "text-gray-200")} />)}
                                                                        </div>
                                                                    </div>
                                                                    <p className={`text-xs italic leading-relaxed font-semibold p-4 rounded-2xl border ${isDark ? 'text-gray-200 bg-black/60 border-white/5' : 'text-[#854d0e] bg-white border-yellow-500/10'}`}>" {resp.ratingComment} "</p>
                                                                    <div className="text-[8px] text-gray-500 text-right uppercase font-black tracking-widest">— Endorsed by Project Author</div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Form for non-authors to join */}
                                    {!isAuthor && contribution.status === 'active' && !isIssueResolved && !contribution.responses.find(r => String(r.responder?._id) === String(user.id || user._id)) && (
                                        activeIssueIndex === idx ? (
                                            <form onSubmit={(e) => handleSubmitResponse(issue._id, e)} className={`p-4 rounded-2xl border ${isDark ? 'bg-white/5 border-[#38bdf8]/30' : 'bg-[#f0f9ff] border-[#38bdf8]/30 shadow-inner'} space-y-4`}>
                                                {issue.questions.map((q, qIdx) => (
                                                    <div key={qIdx} className="space-y-1.5">
                                                        <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${isDark ? 'text-[#38bdf8]' : 'text-[#0284c7]'}`}>
                                                            Q{qIdx + 1}: {q}
                                                        </label>
                                                        <textarea
                                                            required
                                                            value={responseAnswers[qIdx] || ''}
                                                            onChange={e => handleAnswerChange(qIdx, e.target.value)}
                                                            placeholder="Your detailed answer..."
                                                            className={`w-full border p-3 rounded-xl text-xs outline-none transition-all min-h-[80px] resize-none ${isDark ? 'bg-black border-white/10 text-white focus:border-[#38bdf8]' : 'bg-white border-[#38bdf8]/20 text-black focus:border-[#0284c7]'}`}
                                                        />
                                                    </div>
                                                ))}
                                                <div className="flex justify-end gap-2 pt-2">
                                                    <button type="button" onClick={() => setActiveIssueIndex(null)} className={`text-xs font-bold ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-[#0284c7]/60 hover:text-[#0284c7]'}`}>Cancel</button>
                                                    <button type="submit" className={`px-5 py-2 font-black uppercase text-xs rounded-xl shadow-lg transition-all active:scale-95 ${isDark ? 'bg-[#38bdf8] text-black shadow-[#38bdf8]/20' : 'bg-[#0284c7] text-white shadow-[#0284c7]/20'}`}>Submit Pitch</button>
                                                </div>
                                            </form>
                                        ) : (
                                            <button onClick={() => handleOpenPitchForm(idx, issue.questions)} className={`w-full py-3 font-black uppercase text-[10px] rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${isDark ? 'bg-[#38bdf8] text-black shadow-[#38bdf8]/20' : 'bg-[#0284c7] text-white shadow-[#0284c7]/30'}`}><Send size={14} /> Pitch Contribution</button>
                                        )
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </main>

                <AnimatePresence>
                    {isProfileModalOpen && (
                        <ProfileModal responder={selectedResponder} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} isDark={isDark} />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const ProfileModal = ({ responder, isOpen, onClose, isDark }) => {
    if (!isOpen || !responder) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className={`relative w-full max-w-md rounded-[40px] overflow-hidden border ${isDark ? 'bg-[#0a0a0a] border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-200'}`}>
                <div className="h-32 bg-gradient-to-br from-sky-600/20 via-sky-900/40 to-[#38bdf8]/5 border-b border-white/5" />
                <div className="p-8 -mt-16 space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="w-24 h-24 rounded-3xl bg-black border-2 border-sky-500/30 text-sky-400 flex items-center justify-center font-black text-4xl shadow-2xl relative">
                            {responder.username[0].toUpperCase()}
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0a0a0a] shadow-lg shadow-green-500/20" />
                        </div>
                        <button onClick={onClose} className="mb-12 p-2 rounded-full bg-white/5 text-gray-500 hover:text-white transition-all"><XCircle size={22} /></button>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight">{responder.fullName || responder.username}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 bg-sky-500/10 px-2 py-1 rounded-lg">{responder.role || 'Independent Researcher'}</span>
                            <span className="text-[10px] font-bold text-gray-500 text-sky-400/50">@{responder.username}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 block">About Researcher</span>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium line-clamp-4 italic">
                            {responder.bio || "This researcher hasn't updated their bio yet."}
                        </p>
                    </div>

                    {responder.researchInterests && (
                        <div className="space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-gray-600 block">Expertise Areas</span>
                            <div className="flex flex-wrap gap-2">
                                {responder.researchInterests.split(',').map((interest, i) => (
                                    <span key={i} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300">
                                        {interest.trim()}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4 py-6 border-y border-white/5">
                        <div className="text-center flex-1">
                            <div className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">{responder.averageRating?.toFixed(1) || '0.0'}<Star size={16} fill="#f97316" /></div>
                            <div className="text-[8px] font-black uppercase text-gray-500 tracking-widest mt-1">Trust Score</div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="text-center flex-1">
                            <div className="text-2xl font-black text-white">{responder.completedTasks || 0}</div>
                            <div className="text-[8px] font-black uppercase text-gray-500 tracking-widest mt-1">Projects</div>
                        </div>
                        <div className="w-px h-8 bg-white/5" />
                        <div className="text-center flex-1">
                            <div className="text-2xl font-black text-sky-500 flex items-center justify-center"><Mail size={22} /></div>
                            <div className="text-[8px] font-black uppercase text-gray-500 tracking-widest mt-1">Contact</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};


export default ContributionDetail;
