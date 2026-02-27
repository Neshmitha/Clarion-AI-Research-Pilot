import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE_URL from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Search, FileText, Settings, LogOut,
    BookOpen, Bot, Star, Edit3, Compass, ChevronRight,
    Loader2, CheckCircle2, ArrowRight, ExternalLink,
    Bookmark, BookMarked, Microscope, Target, FlaskConical,
    BarChart3, PenLine, Clock, Trophy, Zap, RefreshCw, Plus, Trash2, Menu, GitPullRequest
} from 'lucide-react';

// ─── Particle Canvas ──────────────────────────────────────────────────────────
const ParticleCanvas = () => {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d'); let animId;
        const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
        resize(); window.addEventListener('resize', resize);
        const pts = Array.from({ length: 70 }, () => ({
            x: Math.random(), y: Math.random(), r: Math.random() * 1.2 + 0.3,
            speed: Math.random() * 0.12 + 0.03, alpha: Math.random() * 0.5 + 0.1,
            flicker: Math.random() * Math.PI * 2, fs: Math.random() * 0.03 + 0.01,
        }));
        const draw = () => {
            const w = canvas.width, h = canvas.height;
            ctx.clearRect(0, 0, w, h);
            pts.forEach(p => {
                p.flicker += p.fs;
                const a = p.alpha * (0.6 + 0.4 * Math.sin(p.flicker));
                const g = ctx.createRadialGradient(p.x * w, p.y * h, 0, p.x * w, p.y * h, p.r * 3);
                g.addColorStop(0, `rgba(56,189,248,${a})`); g.addColorStop(1, 'rgba(56,189,248,0)');
                ctx.beginPath(); ctx.arc(p.x * w, p.y * h, p.r * 3, 0, Math.PI * 2);
                ctx.fillStyle = g; ctx.fill();
                p.y -= p.speed * 0.0003; if (p.y < 0) { p.y = 1; p.x = Math.random(); }
            });
            animId = requestAnimationFrame(draw);
        };
        draw();
        return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40" />;
};

// ─── Sidebar Item ─────────────────────────────────────────────────────────────
const SidebarItem = ({ icon, text, active, onClick, isDark }) => (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-300 group ${active
        ? isDark
            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
            : 'bg-[#e0f2fe] text-[#0284c7] border border-[#38bdf8]'
        : isDark
            ? 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
            : 'bg-transparent text-gray-600 border border-transparent hover:bg-white hover:border-[#38bdf8] hover:text-black hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'
        }`}>
        <div className={`transition-transform ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className="font-medium text-sm tracking-wide">{text}</span>
    </div>
);

// ─── Stage config ─────────────────────────────────────────────────────────────
const STAGES = [
    { n: 1, label: 'Domain', icon: Compass },
    { n: 2, label: 'Papers', icon: BookOpen },
    { n: 3, label: 'Problem', icon: Target },
    { n: 4, label: 'Methodology', icon: Microscope },
    { n: 5, label: 'Experiments', icon: FlaskConical },
    { n: 6, label: 'Gap Analysis', icon: BarChart3 },
    { n: 7, label: 'Score', icon: Trophy },
];

const DOMAINS = [
    { id: 'Artificial Intelligence' },
    { id: 'Machine Learning' },
    { id: 'Cybersecurity' },
    { id: 'IoT' },
    { id: 'Quantum Computing' },
    { id: 'Data Science' },
    { id: 'Computer Vision' },
    { id: 'Natural Language Processing' },
    { id: 'Robotics' },
    { id: 'Blockchain' },
    { id: 'Healthcare AI' },
    { id: 'Edge Computing' },
];

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const Guide = () => {
    const navigate = useNavigate();
    const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // View: 'history' | 'builder'
    const [view, setView] = useState('history');
    const [builds, setBuilds] = useState([]);
    const [activeBuild, setActiveBuild] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stageLoading, setStageLoading] = useState(false);
    const [error, setError] = useState('');

    // Stage data
    const [papers, setPapers] = useState([]);
    const [problems, setProblems] = useState([]);
    const [methodologies, setMethodologies] = useState([]);
    const [experiments, setExperiments] = useState(null);
    const [gaps, setGaps] = useState([]);
    const [score, setScore] = useState(null);
    const [customDomain, setCustomDomain] = useState('');

    const RB = `${API_BASE_URL}/research-builder`;
    const uid = user?.id || user?._id || 'guest';

    // ── Load builds on mount ─────────────────────────────────────────────
    useEffect(() => { loadBuilds(); }, []);

    const loadBuilds = async () => {
        setLoading(true);
        try { const r = await axios.get(`${RB}/builds/${uid}`); setBuilds(r.data); }
        catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // ── Save build to DB ─────────────────────────────────────────────────
    const saveBuild = async (patch) => {
        if (!activeBuild) return;
        try {
            const r = await axios.put(`${RB}/build/${activeBuild._id}`, patch);
            setActiveBuild(r.data);
        } catch (e) { console.error('Save error:', e); }
    };

    // ── Create new build ─────────────────────────────────────────────────
    const createBuild = async () => {
        setLoading(true);
        try {
            const r = await axios.post(`${RB}/build`, { userId: uid });
            setActiveBuild(r.data);
            setPapers([]); setProblems([]); setMethodologies([]);
            setExperiments(null); setGaps([]); setScore(null);
            setView('builder');
        } catch (e) { setError('Failed to create build.'); }
        finally { setLoading(false); }
    };

    // ── Resume build ─────────────────────────────────────────────────────
    const resumeBuild = async (build) => {
        setActiveBuild(build);
        setView('builder');
        // Reload stage data if available
        if (build.domain && build.currentStage >= 2) {
            fetchPapers(build.domain, false);
        }
        if (build.domain && build.currentStage >= 3) {
            fetchProblems(build.domain, false);
        }
    };

    const deleteBuild = async (id) => {
        await axios.delete(`${RB}/build/${id}`);
        setBuilds(builds.filter(b => b._id !== id));
    };

    // ── Stage navigation ─────────────────────────────────────────────────
    const goTo = async (stage) => {
        await saveBuild({ currentStage: stage });
    };

    const currentStage = activeBuild?.currentStage || 1;
    const pct = Math.round(((currentStage - 1) / 6) * 100);

    // ── Stage 1→2: Domain select → fetch papers ──────────────────────────
    const fetchPapers = async (domain, go = true) => {
        setStageLoading(true); setError('');
        try {
            const r = await axios.get(`${RB}/arxiv/${encodeURIComponent(domain)}`);
            setPapers(r.data);
            if (go) {
                const patch = { domain, currentStage: 2, title: `${domain} Research` };
                const r2 = await axios.put(`${RB}/build/${activeBuild._id}`, patch);
                setActiveBuild(r2.data);
            }
        } catch (e) { setError('Failed to fetch papers from arXiv.'); }
        finally { setStageLoading(false); }
    };

    // ── Stage 2→3: Generate problems ─────────────────────────────────────
    const fetchProblems = async (domain, go = true) => {
        setStageLoading(true); setError('');
        try {
            const r = await axios.post(`${RB}/generate/problems`, { domain });
            setProblems(r.data.problems || []);
            if (go) {
                const r2 = await axios.put(`${RB}/build/${activeBuild._id}`, {
                    selectedPapers: activeBuild.selectedPapers,
                    currentStage: 3,
                });
                setActiveBuild(r2.data);
            }
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Failed to generate problem statements.');
        } finally { setStageLoading(false); }
    };

    // ── Stage 3→4: Select problem → generate methodologies ───────────────
    const selectProblem = async (problem) => {
        setStageLoading(true); setError('');
        try {
            const r = await axios.post(`${RB}/generate/methodologies`, {
                domain: activeBuild.domain,
                problem: problem.title,
            });
            setMethodologies(r.data.methodologies || []);
            const r2 = await axios.put(`${RB}/build/${activeBuild._id}`, {
                problemStatement: problem, currentStage: 4,
            });
            setActiveBuild(r2.data);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Failed to generate methodologies.');
        } finally { setStageLoading(false); }
    };

    // ── Stage 4→5: Select methodology → generate experiments ─────────────
    const selectMethodology = async (method) => {
        setStageLoading(true); setError('');
        try {
            const r = await axios.post(`${RB}/generate/experiments`, {
                domain: activeBuild.domain,
                problem: activeBuild.problemStatement?.title,
                methodology: method.name,
            });
            setExperiments(r.data);
            const r2 = await axios.put(`${RB}/build/${activeBuild._id}`, {
                methodology: [method], currentStage: 5,
            });
            setActiveBuild(r2.data);
        } catch (e) {
            console.error(e);
            setError(e.response?.data?.error || 'Failed to generate experiment design.');
        } finally { setStageLoading(false); }
    };

    // ── Stage 5→6: Confirm experiments → generate gaps ───────────────────
    const confirmExperiments = async () => {
        setStageLoading(true); setError('');
        try {
            const r = await axios.post(`${RB}/generate/gaps`, {
                domain: activeBuild.domain,
                problem: activeBuild.problemStatement?.title,
                methodology: activeBuild.methodology?.[0]?.name,
                experiments,
            });
            setGaps(r.data.gaps || []);
            const r2 = await axios.put(`${RB}/build/${activeBuild._id}`, {
                experiments, currentStage: 6,
            });
            setActiveBuild(r2.data);
        } catch (e) { setError('Failed to generate research gaps.'); }
        finally { setStageLoading(false); }
    };

    // ── Stage 6→7: Select gap → calculate score ───────────────────────────
    const selectGap = async (gap) => {
        setStageLoading(true); setError('');
        try {
            const r = await axios.post(`${RB}/generate/score`, {
                domain: activeBuild.domain,
                problem: activeBuild.problemStatement?.title,
                methodology: activeBuild.methodology?.[0]?.name,
                gap: gap.title,
            });
            setScore(r.data);
            const r2 = await axios.put(`${RB}/build/${activeBuild._id}`, {
                researchGap: gap, score: r.data, currentStage: 7, completed: true,
            });
            setActiveBuild(r2.data);
            loadBuilds();
        } catch (e) { setError('Failed to calculate score.'); }
        finally { setStageLoading(false); }
    };

    const handleLogout = () => { localStorage.clear(); navigate('/login'); };

    // ─────────────────────────────────────────────────────────────────────
    return (
        <div className={`flex h-screen overflow-hidden transition-all ${isDark ? "text-white bg-[#000]" : "text-black bg-[#f8fafc]"}`} style={{ fontFamily: "'Inter','Segoe UI',sans-serif" }}>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col transition-transform duration-300 transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 ${isSidebarOpen ? "lg:flex" : "lg:hidden"} ${isDark ? "bg-black/80 backdrop-blur-xl border-white/10" : "bg-white/80 backdrop-blur-xl border-black/10"}`}>
                <div className={`p-8 border-b ${isDark ? "border-white/5" : "border-black/5"}`}>
                    <div className="flex items-center gap-3 text-[#38bdf8] font-bold text-2xl tracking-tight">
                        <div className={`p-2 rounded-xl transition-all ${isDark ? 'bg-[#38bdf8]/10 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}>
                            <LayoutDashboard size={22} className={isDark ? "text-[#38bdf8]" : "text-black"} />
                        </div>
                        <span className="font-black tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: isDark ? "linear-gradient(90deg, #38bdf8, #FFFFFF, #38bdf8)" : "linear-gradient(90deg, #0284c7, #000000, #0284c7)" }}>CLARION</span>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <SidebarItem icon={<LayoutDashboard size={17} />} text="Home" onClick={() => navigate("/home")} isDark={isDark} />
                    <SidebarItem icon={<Search size={17} />} text="Discover Papers" onClick={() => navigate("/search")} isDark={isDark} />
                    <SidebarItem icon={<BookOpen size={17} />} text="Paper Drafting" onClick={() => navigate("/draft")} isDark={isDark} />
                    <SidebarItem icon={<Edit3 size={17} />} text="DocSpace Editor" onClick={() => navigate("/docspace")} isDark={isDark} />
                    <SidebarItem icon={<FileText size={17} />} text="Workspace" onClick={() => navigate("/workspace")} isDark={isDark} />
                    <SidebarItem icon={<Star size={17} />} text="My Library" onClick={() => navigate("/library")} isDark={isDark} />
                    <SidebarItem icon={<Bot size={17} />} text="AI Assistant" onClick={() => navigate("/ai")} isDark={isDark} />
                    <SidebarItem icon={<Compass size={17} />} text="Research Guide" active isDark={isDark} />
                    <SidebarItem icon={<GitPullRequest size={17} />} text="Contributions" onClick={() => navigate("/contributions")} isDark={isDark} />
                </nav>
                <div className={`p-4 border-t space-y-2 ${isDark ? "border-white/5" : "border-black/5"}`}>
                    <SidebarItem icon={<Settings size={17} />} text="Settings" onClick={() => navigate("/settings")} isDark={isDark} />
                    <button onClick={handleLogout} className={`flex items-center gap-3 transition-all duration-300 w-full px-4 py-3 rounded-2xl border border-transparent ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/5' : 'text-gray-600 hover:bg-red-50 hover:border-transparent hover:text-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]'}`}>
                        <LogOut size={16} /><span className="text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                <ParticleCanvas />

                {/* Header */}
                <header className="relative z-20 flex items-center justify-between px-8 py-4 border-b flex-shrink-0" style={isDark ? { background: "rgba(0,0,0,0.8)", backdropFilter: "blur(20px)", borderColor: "rgba(56,189,248,0.12)" } : { background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", borderColor: "rgba(0,0,0,0.05)" }}>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className={`text-xl font-semibold ${isDark ? "text-gray-200" : "text-black"}`}>Research Guide</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setView('history'); loadBuilds(); }}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={view === "history" ? (isDark ? { background: "#000", border: "1px solid #38bdf8", color: "#38bdf8" } : { background: "#f0f9ff", border: "1px solid transparent", color: "#0284c7" }) : (isDark ? { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(56,189,248,0.2)", color: "#6b7280" } : { background: "white", border: "1px solid transparent", color: "#6b7280" })}>
                            <Clock size={12} className="inline mr-1" />History
                        </button>
                        <button onClick={createBuild} disabled={loading}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isDark ? "" : "bg-white text-blue-700 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]"}`} style={isDark ? { background: "#000", border: "1px solid #38bdf8", color: "#fff", boxShadow: "0 0 12px rgba(56,189,248,0.3)" } : { border: "1px solid transparent" }}>
                            <Plus size={14} />New Build
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto relative z-10 p-6">
                    <AnimatePresence mode="wait">
                        {/* ── HISTORY VIEW ── */}
                        {view === 'history' && (
                            <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto">
                                <div className="mb-6">
                                    <h2 className={`text-2xl font-black mb-1 ${isDark ? "text-white" : "text-black"}`}>Research History</h2>
                                    <p className="text-gray-500 text-sm">Resume a previous build or start a new one</p>
                                </div>
                                {loading && <div className="flex justify-center py-12"><Loader2 className="animate-spin text-cyan-400" size={32} /></div>}
                                {!loading && builds.length === 0 && (
                                    <div className="text-center py-20 rounded-2xl border border-dashed" style={isDark ? { borderColor: "rgba(56,189,248,0.2)", background: "rgba(0,0,0,0.4)" } : { borderColor: "rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.6)" }}>
                                        <Compass size={40} className="mx-auto mb-4 text-gray-600" />
                                        <p className="text-gray-400 font-semibold mb-2">No research builds yet</p>
                                        <p className="text-gray-600 text-sm mb-6">Start your first AI-guided research pipeline</p>
                                        <button onClick={createBuild} className="px-6 py-2.5 rounded-xl text-sm font-bold" style={isDark ? { background: "#000", border: "1px solid #38bdf8", color: "#fff", boxShadow: "0 0 16px rgba(56,189,248,0.3)" } : {}}>
                                            <Plus size={16} className="inline mr-2" />Create First Build
                                        </button>
                                    </div>
                                )}
                                <div className="grid gap-4">
                                    {builds.map(b => (
                                        <motion.div key={b._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                            className={`p-5 rounded-2xl border flex items-center justify-between group ${isDark ? "" : "shadow-sm bg-white"}`} style={isDark ? { background: "rgba(0,0,0,0.6)", borderColor: "rgba(56,189,248,0.15)", backdropFilter: "blur(10px)" } : { borderColor: "transparent" }}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                                                    {b.completed ? <CheckCircle2 className="text-[#38bdf8]" size={20} /> : <Compass className="text-gray-400" size={20} />}
                                                </div>
                                                <div>
                                                    <div className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{b.title || 'Untitled Build'}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{b.domain || 'No domain yet'} · Stage {b.currentStage}/7 · {new Date(b.updatedAt).toLocaleDateString()}</div>
                                                    {b.score?.overall && (
                                                        <div className="mt-1 text-xs font-bold" style={{ color: '#38bdf8' }}>Score: {b.score.overall}/100</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 rounded-full bg-gray-800 overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${Math.round(((b.currentStage - 1) / 6) * 100)}%`, background: 'linear-gradient(90deg,#38bdf8,#a78bfa)' }} />
                                                </div>
                                                <button onClick={() => resumeBuild(b)} className="px-4 py-2 rounded-lg text-xs font-bold transition-all" style={isDark ? { background: "#000", border: "1px solid #38bdf8", color: "#38bdf8" } : { background: "#f0f9ff", border: "1px solid transparent", color: "#0284c7" }}>
                                                    {b.completed ? 'View' : 'Resume'}
                                                </button>
                                                <button onClick={() => deleteBuild(b._id)} className="p-2 rounded-lg text-gray-600 hover:text-red-400 transition-all hover:bg-red-500/5">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ── BUILDER VIEW ── */}
                        {view === 'builder' && activeBuild && (
                            <motion.div key="builder" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto">

                                {/* Top Stepper */}
                                <div className={`mb-8 p-4 rounded-2xl border ${isDark ? "" : "shadow-sm bg-white"}`} style={isDark ? { background: "rgba(0,0,0,0.6)", borderColor: "rgba(56,189,248,0.15)", backdropFilter: "blur(10px)" } : { borderColor: "transparent" }}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-xs font-bold" style={{ color: '#38bdf8' }}>{pct}% Complete</span>
                                    </div>
                                    <div className="w-full h-1 bg-gray-800 rounded-full mb-4 overflow-hidden">
                                        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#38bdf8,#a78bfa)' }}
                                            animate={{ width: `${pct}%` }} transition={{ duration: 0.5 }} />
                                    </div>
                                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                                        {STAGES.map((s, i) => {
                                            const done = currentStage > s.n;
                                            const active = currentStage === s.n;
                                            const Icon = s.icon;
                                            return (
                                                <React.Fragment key={s.n}>
                                                    <div className={`flex flex-col items-center min-w-[60px] cursor-default`}>
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all"
                                                            style={done ? { background: '#38bdf8', color: '#000' } : active ? { background: '#000', border: '2px solid #38bdf8', color: '#38bdf8', boxShadow: '0 0 12px rgba(56,189,248,0.5)' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#4b5563' }}>
                                                            {done ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                                                        </div>
                                                        <span className="text-[9px] mt-1 font-bold text-center" style={{ color: done || active ? '#fff' : '#4b5563' }}>{s.label}</span>
                                                    </div>
                                                    {i < STAGES.length - 1 && <div className="flex-1 h-px min-w-[16px]" style={{ background: done ? '#38bdf8' : 'rgba(255,255,255,0.1)' }} />}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </div>

                                {error && (
                                    <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium text-red-400 border" style={{ background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)' }}>
                                        ⚠️ {error}
                                    </div>
                                )}

                                {/* Loading overlay */}
                                {stageLoading && (
                                    <div className="flex flex-col items-center justify-center py-16 gap-4">
                                        <div className="relative">
                                            <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
                                        </div>
                                        <p className="text-cyan-400 text-sm font-bold animate-pulse">AI is thinking...</p>
                                    </div>
                                )}

                                {/* ── STAGE 1: Domain ── */}
                                {!stageLoading && currentStage === 1 && (
                                    <StageCard isDark={isDark} title="Enter Your Research Domain" subtitle="Define the specific field or topic you want to explore today">
                                        <div className="max-w-xl mx-auto space-y-6 pt-4">
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Compass className="text-[#38bdf8]/50 group-focus-within:text-[#38bdf8] transition-colors" size={20} />
                                                </div>
                                                <input
                                                    type="text"
                                                    value={customDomain}
                                                    onChange={(e) => setCustomDomain(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && customDomain.trim() && fetchPapers(customDomain.trim())}
                                                    placeholder="e.g. Distributed Consensus in Blockchain, Quantum Machine Learning..."
                                                    className={`w-full rounded-2xl py-4 pl-12 pr-4 transition-all outline-none font-medium text-lg ${isDark ? "bg-black/40 border border-[#38bdf8]/20 focus:border-[#38bdf8] focus:ring-4 focus:ring-[#38bdf8]/10 text-white placeholder-gray-600" : "bg-white shadow-sm border border-transparent text-gray-800 placeholder-gray-400 focus:ring-4 focus:ring-blue-100 focus:shadow-[0_0_20px_rgba(56,189,248,0.6)]"}`}
                                                />
                                            </div>

                                            <button
                                                onClick={() => customDomain.trim() && fetchPapers(customDomain.trim())}
                                                disabled={!customDomain.trim()}
                                                className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed group ${isDark ? "" : "bg-white text-blue-700 shadow-sm hover:shadow-[0_0_28px_rgba(56,189,248,0.6)]"}`} style={isDark ? { background: "#38bdf8", color: "#000", boxShadow: "0 0 20px rgba(56,189,248,0.3)" } : {}}
                                            >
                                                Start Research Pipeline
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </button>

                                            <div className="pt-4">
                                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 text-center">Or try a trending domain</p>
                                                <div className="flex flex-wrap justify-center gap-2">
                                                    {DOMAINS.slice(0, 5).map(d => (
                                                        <button
                                                            key={d.id}
                                                            onClick={() => fetchPapers(d.id)}
                                                            className={`px-4 py-2 rounded-xl border transition-all text-xs font-semibold ${isDark ? "border-white/5 bg-white/5 hover:bg-[#38bdf8]/10 hover:border-[#38bdf8]/30 text-gray-400 hover:text-[#38bdf8]" : "bg-white text-gray-600 shadow-sm border-transparent hover:text-blue-600 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]"}`}
                                                        >
                                                            {d.id}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </StageCard>
                                )}

                                {/* ── STAGE 2: Papers ── */}
                                {!stageLoading && currentStage === 2 && (
                                    <StageCard isDark={isDark} title={`Papers in ${activeBuild.domain}`} subtitle="Review relevant papers. Select ones you want to bookmark. Then proceed.">
                                        <div className="space-y-3 mb-6">
                                            {papers.map((p, i) => {
                                                const sel = activeBuild.selectedPapers?.some(sp => sp.id === p.id);
                                                return (
                                                    <div key={i} style={isDark ? { background: "rgba(0,0,0,0.5)", borderColor: sel ? "#38bdf8" : "rgba(56,189,248,0.15)" } : { background: "white", borderColor: sel ? "#0ea5e9" : "transparent" }} className={`p-4 rounded-xl border transition-all ${isDark ? "" : "shadow-sm " + (sel ? "shadow-md ring-2 ring-blue-100" : "hover:shadow-md hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]")}`}>
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="font-semibold text-white text-sm mb-1">{p.title}</div>
                                                                <div className="text-xs text-gray-500 mb-2">{p.authors} · {p.published}</div>
                                                                <p className="text-xs text-gray-400 leading-relaxed">{p.abstract}</p>
                                                            </div>
                                                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                                <button onClick={async () => {
                                                                    const cur = activeBuild.selectedPapers || [];
                                                                    const next = sel ? cur.filter(sp => sp.id !== p.id) : [...cur, p];
                                                                    const r = await axios.put(`${RB}/build/${activeBuild._id}`, { selectedPapers: next });
                                                                    setActiveBuild(r.data);
                                                                }} className="p-2 rounded-lg transition-all"
                                                                    style={sel ? { background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid #38bdf8' } : { background: 'rgba(255,255,255,0.05)', color: '#6b7280', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    {sel ? <BookMarked size={14} /> : <Bookmark size={14} />}
                                                                </button>
                                                                {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-gray-600 hover:text-cyan-400 transition-all" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}><ExternalLink size={14} /></a>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <NextButton isDark={isDark} onClick={() => fetchProblems(activeBuild.domain)} label="Generate Problem Statements →" />
                                    </StageCard>
                                )}

                                {/* ── STAGE 3: Problem ── */}
                                {!stageLoading && currentStage === 3 && (
                                    <StageCard isDark={isDark} title="Select a Problem Statement" subtitle="Click a problem to explore it and proceed">
                                        <div className="space-y-4">
                                            {problems.map((p, i) => (
                                                <div key={i} style={isDark ? { background: "rgba(0,0,0,0.5)", borderColor: "rgba(56,189,248,0.2)" } : { background: "white", borderColor: "transparent" }} onClick={() => selectProblem(p)} onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? "#38bdf8" : "transparent"; if (!isDark) { e.currentTarget.style.boxShadow = "0 0 20px rgba(56,189,248,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; } }} onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(56,189,248,0.2)" : "transparent"; if (!isDark) { e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; } }} className={`p-5 rounded-xl border cursor-pointer transition-all group ${isDark ? "" : "shadow-sm"}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-bold text-white">{p.title}</h4>
                                                        <ArrowRight size={16} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-3">{p.description}</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {p.objectives?.map((o, j) => (
                                                            <span key={j} className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#94d9f9' }}>{o}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </StageCard>
                                )}

                                {/* ── STAGE 4: Methodology ── */}
                                {!stageLoading && currentStage === 4 && (
                                    <StageCard isDark={isDark} title="Select Methodology" subtitle={`For: "${activeBuild.problemStatement?.title}"`}>
                                        <div className="grid grid-cols-2 gap-4">
                                            {methodologies.map((m, i) => (
                                                <div key={i} style={isDark ? { background: "rgba(0,0,0,0.5)", borderColor: "rgba(56,189,248,0.2)" } : { background: "white", borderColor: "transparent" }} onClick={() => selectMethodology(m)} onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? "#38bdf8" : "transparent"; if (!isDark) { e.currentTarget.style.boxShadow = "0 0 20px rgba(56,189,248,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; } }} onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(56,189,248,0.2)" : "transparent"; if (!isDark) { e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; } }} className={`p-5 rounded-xl border cursor-pointer transition-all group ${isDark ? "" : "shadow-sm"}`}>
                                                    <h4 className="font-bold text-white mb-2 flex items-center justify-between">{m.name}<ChevronRight size={14} className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" /></h4>
                                                    <p className="text-xs text-gray-400 mb-3">{m.description}</p>
                                                    <div className="space-y-1.5">
                                                        <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Tools</div>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {m.tools?.map((t, j) => <span key={j} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34d399' }}>{t}</span>)}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </StageCard>
                                )}

                                {/* ── STAGE 5: Experiments ── */}
                                {!stageLoading && currentStage === 5 && experiments && (
                                    <StageCard isDark={isDark} title="Experiment Design" subtitle="Your AI-suggested experiment configuration">
                                        <div className="grid grid-cols-2 gap-6 mb-6">
                                            <div>
                                                <SectionLabel>Datasets</SectionLabel>
                                                {experiments.datasets?.map((d, i) => (
                                                    <div key={i} style={isDark ? { background: "rgba(0,0,0,0.5)", borderColor: "rgba(56,189,248,0.15)" } : { background: "white", borderColor: "transparent" }} className={`p-3 rounded-xl border mb-2 ${isDark ? "" : "shadow-sm"}`}>
                                                        <div className="font-semibold text-sm text-white">{d.name}</div>
                                                        <div className="text-xs text-gray-500">{d.description} · {d.size}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <SectionLabel>Evaluation Metrics</SectionLabel>
                                                {experiments.metrics?.map((m, i) => (
                                                    <div key={i} style={isDark ? { background: "rgba(0,0,0,0.5)", borderColor: "rgba(56,189,248,0.15)" } : { background: "white", borderColor: "transparent" }} className={`p-3 rounded-xl border mb-2 ${isDark ? "" : "shadow-sm"}`}>
                                                        <div className="font-semibold text-sm text-white">{m.name}</div>
                                                        <div className="text-xs text-gray-500">{m.description}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <SectionLabel>Tools & Frameworks</SectionLabel>
                                                <div className="flex flex-wrap gap-2">
                                                    {experiments.tools?.map((t, i) => <span key={i} className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)', color: '#38bdf8' }}>{t}</span>)}
                                                </div>
                                            </div>
                                            <div>
                                                <SectionLabel>Baselines</SectionLabel>
                                                {experiments.baselines?.map((b, i) => (
                                                    <div key={i} className="text-xs text-gray-400 mb-1">• <span className="font-semibold text-gray-300">{b.name}</span>: {b.description}</div>
                                                ))}
                                            </div>
                                        </div>
                                        <NextButton isDark={isDark} onClick={confirmExperiments} label="Analyse Research Gaps →" />
                                    </StageCard>
                                )}

                                {/* ── STAGE 6: Gap Analysis ── */}
                                {!stageLoading && currentStage === 6 && (
                                    <StageCard isDark={isDark} title="Research Gap Analysis" subtitle="Select the gap that best matches your research direction">
                                        <div className="space-y-4">
                                            {gaps.map((g, i) => (
                                                <div key={i} style={isDark ? { background: "rgba(0,0,0,0.5)", borderColor: "rgba(56,189,248,0.2)" } : { background: "white", borderColor: "transparent" }} onClick={() => selectGap(g)} onMouseEnter={e => { e.currentTarget.style.borderColor = isDark ? "#38bdf8" : "transparent"; if (!isDark) { e.currentTarget.style.boxShadow = "0 0 20px rgba(56,189,248,0.6)"; e.currentTarget.style.transform = "translateY(-2px)"; } }} onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? "rgba(56,189,248,0.2)" : "transparent"; if (!isDark) { e.currentTarget.style.boxShadow = "0 1px 2px 0 rgba(0,0,0,0.05)"; e.currentTarget.style.transform = "translateY(0)"; } }} className={`p-5 rounded-xl border cursor-pointer transition-all group ${isDark ? "" : "shadow-sm"}`}>
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-bold text-white">{g.title}</h4>
                                                        <span className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>Select →</span>
                                                    </div>
                                                    <p className="text-sm text-gray-400 mb-3">{g.description}</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div><div className="text-[10px] font-bold text-cyan-400 mb-1 uppercase">Novelty</div><p className="text-xs text-gray-500">{g.novelty}</p></div>
                                                        <div><div className="text-[10px] font-bold text-purple-400 mb-1 uppercase">Impact</div><p className="text-xs text-gray-500">{g.impact}</p></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </StageCard>
                                )}

                                {/* ── STAGE 7: Score ── */}
                                {!stageLoading && currentStage === 7 && (score || activeBuild.score) && (
                                    <StageCard isDark={isDark} title="Research Strength Score" subtitle="Your research plan has been evaluated by AI">
                                        {(() => {
                                            const s = score || activeBuild.score;
                                            const dims = [
                                                { key: 'novelty', label: 'Novelty', color: '#38bdf8' },
                                                { key: 'feasibility', label: 'Feasibility', color: '#34d399' },
                                                { key: 'impact', label: 'Impact', color: '#a78bfa' },
                                                { key: 'technicalDepth', label: 'Technical Depth', color: '#fb923c' },
                                            ];
                                            return (
                                                <>
                                                    <div className="text-center mb-8">
                                                        <div className="inline-flex items-center justify-center w-28 h-28 rounded-full border-4 mb-4" style={{ borderColor: '#38bdf8', background: 'rgba(56,189,248,0.08)', boxShadow: '0 0 40px rgba(56,189,248,0.25)' }}>
                                                            <span className="text-4xl font-black" style={{ color: '#38bdf8' }}>{s.overall}</span>
                                                        </div>
                                                        <p className="text-gray-300 text-sm max-w-lg mx-auto">{s.summary}</p>
                                                    </div>
                                                    <div className="space-y-4 mb-8">
                                                        {dims.map(d => {
                                                            const dim = s[d.key];
                                                            if (!dim) return null;
                                                            return (
                                                                <div key={d.key}>
                                                                    <div className="flex justify-between items-center mb-1.5">
                                                                        <span className="text-xs font-bold text-gray-400">{d.label}</span>
                                                                        <span className="text-xs font-bold" style={{ color: d.color }}>{dim.score}/100</span>
                                                                    </div>
                                                                    <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                                                                        <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                                                                            animate={{ width: `${dim.score}%` }} transition={{ duration: 0.8, delay: 0.1 }}
                                                                            style={{ background: d.color }} />
                                                                    </div>
                                                                    <p className="text-[10px] text-gray-600 mt-1">{dim.reason}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button onClick={() => {
                                                            const exp = activeBuild.experiments;
                                                            const datasets = exp?.datasets?.map(d => d.name).join(', ') || 'N/A';
                                                            const metrics = exp?.metrics?.map(m => m.name).join(', ') || 'N/A';
                                                            const baselines = exp?.baselines?.map(b => b.name).join(', ') || 'N/A';
                                                            const tools = exp?.tools?.join(', ') || 'N/A';
                                                            const meths = activeBuild.methodology?.map(m => m.name).join(', ') || 'N/A';

                                                            const inst = [
                                                                `Problem Statement: ${activeBuild.problemStatement?.title || ''}`,
                                                                `Methodology: ${meths}`,
                                                                `Targeted Gap: ${activeBuild.researchGap?.title || ''}`,
                                                                `Gap Description: ${activeBuild.researchGap?.description || ''}`,
                                                                exp ? `Experiments:\n- Datasets: ${datasets}\n- Metrics: ${metrics}\n- Baselines: ${baselines}\n- Tools: ${tools}` : null
                                                            ].filter(Boolean).join('\n\n');

                                                            navigate('/draft', {
                                                                state: {
                                                                    topic: activeBuild.domain || 'Untitled Research',
                                                                    instructions: inst
                                                                }
                                                            });
                                                        }} style={isDark ? { background: '#000', border: '1.5px solid #38bdf8', color: '#fff', boxShadow: '0 0 20px rgba(56,189,248,0.3)' } : {}} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] ${isDark ? '' : 'bg-white text-blue-700 shadow-sm border border-transparent hover:shadow-[0_0_20px_rgba(56,189,248,0.6)]'}`}>
                                                            <PenLine size={18} /> Draft Paper →
                                                        </button>
                                                        <button onClick={() => { setView('history'); loadBuilds(); }} className={`flex-1 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${isDark ? '' : 'bg-white text-gray-500 shadow-sm border border-transparent hover:shadow-[0_0_20px_rgba(56,189,248,0.6)] hover:text-blue-600 hover:-translate-y-0.5'}`} style={isDark ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' } : {}}>
                                                            <Clock size={18} /> View History
                                                        </button>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </StageCard>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

// ─── Helper sub-components ────────────────────────────────────────────────────
const StageCard = ({ title, subtitle, children, isDark }) => (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className={`p-6 rounded-2xl border ${isDark ? "" : "shadow-sm"}`} style={isDark ? { background: "rgba(0,0,0,0.65)", borderColor: "rgba(56,189,248,0.18)", backdropFilter: "blur(12px)" } : { background: "white", borderColor: "transparent" }}>
        <div className="mb-6">
            <h2 className={`text-xl font-black ${isDark ? "text-white" : "text-black"}`}>{title}</h2>
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {children}
    </motion.div>
);

const SectionLabel = ({ children }) => (
    <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{children}</div>
);

const NextButton = ({ onClick, label = "Next Stage →", disabled = false, isDark }) => (
    <button onClick={onClick} disabled={disabled}
        className={`w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] disabled:opacity-40 ${isDark ? "" : "bg-white text-gray-700 shadow-sm border border-transparent"}`}
        style={{ background: '#000', border: '1px solid #38bdf8', color: '#fff', boxShadow: '0 0 16px rgba(56,189,248,0.3)' }}
        onMouseEnter={e => !disabled && (e.currentTarget.style.boxShadow = isDark ? "0 0 28px rgba(56,189,248,0.55)" : "0 0 28px rgba(56,189,248,0.6)")}
        onMouseLeave={e => !disabled && (e.currentTarget.style.boxShadow = isDark ? "0 0 16px rgba(56,189,248,0.3)" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)")}>
        {label}
    </button>
);

export default Guide;
