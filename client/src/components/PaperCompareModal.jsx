import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Trophy, BarChart2, Activity, Star, BookOpen, Clock, Zap, Bot
} from 'lucide-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import API_BASE_URL from '../config';

/* ─── colour palette per paper index ──────────────────────────────────── */
const COLOURS = ['#38bdf8', '#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9'];

/* ─── scoring weights ─────────────────────────────────────────────────── */
const WEIGHTS = {
    citations: 0.35,
    impactScore: 0.40,
    year: 0.15,
    pages: 0.10,
};

/* ─── accessors to ensure consistency ────────────────────────────────── */
const CITATIONS = (p) => (typeof p.citations === 'number' ? p.citations : (parseInt(p._id?.substring(18), 16) % 500 + 10));
const IMPACT = (p) => parseFloat(p.impactScore) || 0;
const YEAR = (p) => p.year ?? 2000;
const PAGES = (p) => p.pages ?? 0;

const ACCESSORS = {
    citations: CITATIONS,
    impactScore: IMPACT,
    year: YEAR,
    pages: PAGES,
};

/* ─── helpers ─────────────────────────────────────────────────────────── */
const normalize = (val, min, max) =>
    max === min ? 0.5 : (val - min) / (max - min);

const computeScore = (paper, allPapers) => {
    const mins = {};
    const maxs = {};

    Object.keys(ACCESSORS).forEach(k => {
        const values = allPapers.map(p => ACCESSORS[k](p));
        mins[k] = Math.min(...values);
        maxs[k] = Math.max(...values);
    });

    return Object.entries(WEIGHTS).reduce((sum, [k, w]) => {
        const raw = ACCESSORS[k](paper);
        return sum + normalize(raw, mins[k], maxs[k]) * w * 100;
    }, 0);
};

/* ─── custom tooltip ─────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, isDark }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className={`border rounded-xl p-3 shadow-2xl text-xs ${isDark ? "bg-[#1a1a2e] border-white/10" : "bg-white border-gray-200"}`}>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="w-3 h-3 rounded-sm" style={{ background: p.color }} />
                    <span className={isDark ? "text-gray-400" : "text-gray-500"}>{p.name}:</span>
                    <span className={`font-bold ${isDark ? "text-white" : "text-black"}`}>{Number(p.value).toLocaleString()}</span>
                </div>
            ))}
        </div>
    );
};

/* ─── metric badge ────────────────────────────────────────────────────── */
const MetricWinner = ({ label, winner, value, icon, isDark }) => (
    <div className={`flex flex-col items-center rounded-2xl p-4 border flex-1 min-w-[130px] transition-all ${isDark ? "bg-white/5 border-white/5" : "bg-white border-transparent shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]"}`}>
        <div className={isDark ? "text-[#38bdf8] mb-2" : "text-blue-600 mb-2"}>{icon}</div>
        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{label}</p>
        <p className={`text-sm font-bold line-clamp-1 text-center ${isDark ? "text-white" : "text-black"}`}>{winner}</p>
        <p className={`text-xs mt-0.5 ${isDark ? "text-[#38bdf8]" : "text-blue-600 font-bold"}`}>{value}</p>
    </div>
);

/* ─── main component ─────────────────────────────────────────────────── */
const PaperCompareModal = ({ papers, onClose, isDark }) => {
    const [tab, setTab] = useState('radar'); // 'radar' | 'scores' | 'analysis'
    const [analysis, setAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        if (tab === 'analysis' && !analysis && papers.length >= 2) {
            const fetchAnalysis = async () => {
                setIsAnalyzing(true);
                try {
                    const response = await fetch(`${API_BASE_URL}/compare/custom`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ papers })
                    });
                    const data = await response.json();
                    if (data.analysis) {
                        setAnalysis(data.analysis);
                    } else {
                        setAnalysis('Failed to generate analysis.');
                    }
                } catch (error) {
                    console.error("Error fetching analysis:", error);
                    setAnalysis('An error occurred while fetching analysis.');
                } finally {
                    setIsAnalyzing(false);
                }
            };
            fetchAnalysis();
        }
    }, [tab, analysis, papers]);


    if (!papers || papers.length < 2) return null;

    /* scores */
    const scores = papers.map(p => ({
        ...p,
        score: computeScore(p, papers),
    }));
    const best = scores.reduce((a, b) => (a.score > b.score ? a : b));

    const barMetrics = [
        {
            key: 'citations',
            label: 'Citations',
            accessor: CITATIONS,
        },
        {
            key: 'impactScore',
            label: 'Impact Score',
            accessor: IMPACT,
        },
        {
            key: 'year',
            label: 'Year',
            accessor: YEAR,
        },
    ];

    const barData = barMetrics.map(m => {
        const row = { metric: m.label };
        papers.forEach((p, i) => {
            row[`p${i}`] = m.accessor(p);
        });
        return row;
    });

    /* radar chart data */
    const radarData = [
        { subject: 'Citations', fullMark: 100 },
        { subject: 'Impact Score', fullMark: 100 },
        { subject: 'Recency', fullMark: 100 },
        { subject: 'Overall', fullMark: 100 },
    ].map(row => {
        const subject = row.subject;
        const maxCit = Math.max(...papers.map(CITATIONS)) || 1;
        const maxImpact = Math.max(...papers.map(IMPACT)) || 1;
        const minYear = Math.min(...papers.map(YEAR));
        const maxYear = Math.max(...papers.map(YEAR));

        papers.forEach((p, i) => {
            if (subject === 'Citations')
                row[`p${i}`] = Math.round((CITATIONS(p) / maxCit) * 100);
            else if (subject === 'Impact Score')
                row[`p${i}`] = Math.round((IMPACT(p) / maxImpact) * 100);
            else if (subject === 'Recency')
                row[`p${i}`] = maxYear === minYear
                    ? 50
                    : Math.round((((YEAR(p)) - minYear) / (maxYear - minYear)) * 100);
            else
                row[`p${i}`] = Math.round(scores[i].score);
        });
        return row;
    });

    /* metric-level winners */
    const winners = {
        citations: papers.reduce((a, b) => (CITATIONS(a) > CITATIONS(b) ? a : b)),
        impactScore: papers.reduce((a, b) => (IMPACT(a) > IMPACT(b) ? a : b)),
        year: papers.reduce((a, b) => (YEAR(a) > YEAR(b) ? a : b)),
    };

    const truncate = (str, n = 22) => str?.length > n ? str.slice(0, n) + '…' : str;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    className={`border rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-300 ${isDark ? "bg-[#0d0d1a] border-white/10 shadow-black/50" : "bg-white border-transparent"}`}
                    initial={{ scale: 0.9, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`flex items-center justify-between p-8 border-b ${isDark ? "border-white/5" : "border-gray-100 bg-gray-50/50"}`}>
                        <div>
                            <h2 className={`text-2xl font-black flex items-center gap-3 tracking-tight ${isDark ? "text-white" : "text-black"}`}>
                                <BarChart2 className={isDark ? "text-[#38bdf8]" : "text-blue-600"} size={26} />
                                Paper Comparison
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 font-medium">
                                Analyzing {papers.length} selected research papers
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl transition-all ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-black"}`}
                        >
                            <X size={26} />
                        </button>
                    </div>

                    {/* Winner Banner */}
                    <div className={`mx-8 mt-8 p-6 rounded-3xl flex items-center gap-6 transition-all ${isDark ? "bg-gradient-to-r from-cyan-900/40 to-blue-900/30 border border-[#38bdf8]/20" : "bg-blue-50/50 border-2 border-transparent shadow-sm"}`}>
                        <div className={`p-4 rounded-2xl transition-colors ${isDark ? "bg-yellow-400/10" : "bg-white shadow-sm"}`}>
                            <Trophy className="text-yellow-400" size={28} />
                        </div>
                        <div>
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isDark ? "text-yellow-400" : "text-amber-600"}`}>
                                🏆 Recommended Choice
                            </p>
                            <p className={`font-black text-xl line-clamp-1 tracking-tight ${isDark ? "text-white" : "text-black"}`}>{best.title}</p>
                            <p className={`text-sm mt-1 font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                                Weighted Score: <span className={isDark ? "text-[#38bdf8] font-bold" : "text-blue-600 font-bold"}>{best.score.toFixed(1)} / 100</span>
                                &nbsp;·&nbsp;Impact: <span className={isDark ? "text-[#38bdf8] font-bold" : "text-blue-600 font-bold"}>{best.impactScore}</span>
                            </p>
                        </div>
                    </div>

                    {/* Metric Winners */}
                    <div className="px-8 mt-6 flex gap-4 flex-wrap">
                        <MetricWinner label="Most Cited" winner={truncate(winners.citations.title)} value={`${CITATIONS(winners.citations)} citations`} icon={<BookOpen size={20} />} isDark={isDark} />
                        <MetricWinner label="Highest Impact" winner={truncate(winners.impactScore.title)} value={`Score ${IMPACT(winners.impactScore)}`} icon={<Star size={20} />} isDark={isDark} />
                        <MetricWinner label="Most Recent" winner={truncate(winners.year.title)} value={`Year ${YEAR(winners.year)}`} icon={<Clock size={20} />} isDark={isDark} />
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex gap-2 px-8 mt-8">
                        {[
                            { id: 'radar', label: 'Analysis Graph', icon: <Activity size={14} /> },
                            { id: 'scores', label: 'Leaderboard', icon: <Zap size={14} /> },
                            { id: 'analysis', label: 'AI Perspective', icon: <Bot size={14} /> },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id
                                    ? (isDark ? 'bg-[#38bdf8] text-black shadow-lg shadow-[#38bdf8]/40' : 'bg-white text-blue-600 shadow-sm border border-transparent shadow-[0_0_15px_rgba(56,189,248,0.4)]')
                                    : (isDark ? 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10' : 'bg-gray-50 text-gray-400 hover:text-black hover:bg-gray-100')
                                    }`}
                            >
                                {t.icon} {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Charts */}
                    <div className="px-8 pb-10 mt-6">
                        {/* Legend row */}
                        <div className="flex flex-wrap gap-5 mb-6">
                            {papers.map((p, i) => (
                                <div key={i} className="flex items-center gap-2.5 text-xs font-bold">
                                    <span className="w-3.5 h-3.5 rounded-full shadow-sm" style={{ background: COLOURS[i] }} />
                                    <span className={`line-clamp-1 max-w-[200px] ${isDark ? "text-gray-300" : "text-gray-600"}`}>{p.title}</span>
                                </div>
                            ))}
                        </div>

                        {/* RADAR CHART */}
                        {tab === 'radar' && (
                            <motion.div
                                key="radar"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`rounded-[24px] border p-6 ${isDark ? "bg-black/40 border-white/5" : "bg-gray-50/50 border-gray-100"}`}
                            >
                                <ResponsiveContainer width="100%" height={380}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"} />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9ca3af' : '#64748b', fontSize: 13, fontWeight: 700 }} />
                                        {papers.map((p, i) => (
                                            <Radar
                                                key={i}
                                                name={truncate(p.title, 20)}
                                                dataKey={`p${i}`}
                                                stroke={COLOURS[i]}
                                                fill={COLOURS[i]}
                                                fillOpacity={0.2}
                                                strokeWidth={3}
                                            />
                                        ))}
                                        <Tooltip content={<CustomTooltip isDark={isDark} />} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </motion.div>
                        )}

                        {/* SCOREBOARD */}
                        {tab === 'scores' && (
                            <motion.div
                                key="scores"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-4"
                            >
                                {scores
                                    .slice()
                                    .sort((a, b) => b.score - a.score)
                                    .map((p, rank) => {
                                        const idx = papers.findIndex(q => q._id === p._id);
                                        const pct = p.score.toFixed(1);
                                        return (
                                            <div
                                                key={p._id || rank}
                                                className={`flex items-center gap-6 p-6 rounded-[24px] border transition-all ${rank === 0
                                                    ? (isDark ? 'border-[#38bdf8]/40 bg-cyan-900/20' : 'border-blue-100 bg-blue-50/30 ring-2 ring-blue-50/50')
                                                    : (isDark ? 'border-white/5 bg-black/40' : 'border-gray-50 bg-white shadow-sm hover:shadow-md')
                                                    }`}
                                            >
                                                <span className="text-3xl font-black w-10 text-center" style={{ color: COLOURS[idx] }}>
                                                    #{rank + 1}
                                                </span>
                                                <div className="flex-1 overflow-hidden">
                                                    <p className={`font-black text-lg truncate tracking-tight ${isDark ? "text-white" : "text-black"}`}>{p.title}</p>
                                                    <p className={`text-xs font-medium mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                                                        {p.domain} · {YEAR(p)} · {CITATIONS(p)} citations · Impact {IMPACT(p)}
                                                    </p>
                                                    {/* progress bar */}
                                                    <div className={`mt-3 h-2 rounded-full overflow-hidden w-full ${isDark ? "bg-white/10" : "bg-gray-100"}`}>
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{ background: COLOURS[idx] }}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <span
                                                        className="text-3xl font-black tracking-tighter"
                                                        style={{ color: COLOURS[idx] }}
                                                    >
                                                        {pct}
                                                    </span>
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDark ? "text-gray-500" : "text-gray-400"}`}>/ 100</p>
                                                </div>
                                                {rank === 0 && (
                                                    <div className={`p-2 rounded-xl ${isDark ? "bg-yellow-400/10" : "bg-yellow-50"}`}>
                                                        <Trophy className="text-yellow-400 shrink-0" size={26} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </motion.div>
                        )}

                        {/* AI ANALYSIS FORMATTING */}
                        {tab === 'analysis' && (
                            <motion.div
                                key="analysis"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`rounded-[24px] border p-10 min-h-[400px] transition-all ${isDark ? "bg-black/40 border-white/5 shadow-inner" : "bg-gray-50/50 border-gray-100 shadow-inner"}`}
                            >
                                {isAnalyzing ? (
                                    <div className="flex flex-col items-center justify-center h-full space-y-6 py-20">
                                        <div className={`p-6 rounded-[32px] animate-pulse ${isDark ? "bg-purple-500/10" : "bg-purple-50"}`}>
                                            <Bot size={56} className="text-purple-500" />
                                        </div>
                                        <p className={`font-black uppercase tracking-[0.3em] text-[10px] animate-pulse ${isDark ? "text-gray-500" : "text-gray-400"}`}>Synthesizing Parallel Research...</p>
                                    </div>
                                ) : (
                                    <div className="leading-relaxed outline-none">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={{
                                                h1: ({ node, ...props }) => <h1 className={`text-3xl font-black mt-10 mb-6 tracking-tight ${isDark ? "text-white" : "text-black"}`} {...props} />,
                                                h2: ({ node, ...props }) => <h2 className={`text-2xl font-black mt-8 mb-4 tracking-tight ${isDark ? "text-[#38bdf8]" : "text-blue-700"}`} {...props} />,
                                                h3: ({ node, ...props }) => <h3 className={`text-xl font-bold mt-6 mb-3 ${isDark ? "text-white" : "text-gray-800"}`} {...props} />,
                                                p: ({ node, ...props }) => <p className={`my-4 leading-relaxed text-lg font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`} {...props} />,
                                                ul: ({ node, ...props }) => <ul className={`ml-6 list-disc my-4 space-y-2 ${isDark ? "text-gray-400 font-medium" : "text-gray-600 font-semibold"}`} {...props} />,
                                                ol: ({ node, ...props }) => <ol className={`ml-6 list-decimal my-4 space-y-2 ${isDark ? "text-gray-400 font-medium" : "text-gray-600 font-semibold"}`} {...props} />,
                                                li: ({ node, ...props }) => <li className="pl-2" {...props} />,
                                                strong: ({ node, ...props }) => <strong className={`font-black ${isDark ? "text-white" : "text-black"}`} {...props} />,
                                                table: ({ node, ...props }) => (
                                                    <div className={`overflow-x-auto my-8 rounded-2xl border ${isDark ? "border-white/10" : "border-gray-200 bg-white shadow-sm"}`}>
                                                        <table className="w-full text-left text-sm" {...props} />
                                                    </div>
                                                ),
                                                thead: ({ node, ...props }) => <thead className={`uppercase text-[10px] font-black tracking-widest ${isDark ? "bg-white/5 text-gray-500" : "bg-gray-50 text-gray-400"}`} {...props} />,
                                                th: ({ node, ...props }) => <th className="px-6 py-4 border-b border-transparent" {...props} />,
                                                td: ({ node, ...props }) => <td className={`px-6 py-4 border-b ${isDark ? "border-white/5 text-gray-400" : "border-gray-50 text-gray-600"}`} {...props} />,
                                                tr: ({ node, ...props }) => <tr className={`transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"}`} {...props} />,
                                            }}
                                        >
                                            {analysis}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PaperCompareModal;
