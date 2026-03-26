import AppSidebar from '../components/AppSidebar';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import {
    FileText, Sparkles, Loader2,
    LayoutDashboard, Search, LogOut, Menu,
    BookOpen, FileType, CheckCircle2, Printer, RefreshCw,
    ChevronDown, ExternalLink, AlertCircle, CheckCircle, XCircle, Settings, Bot, Star, X
    , Edit3, Save
    , Compass
    , GitPullRequest
} from 'lucide-react';
import API_BASE_URL from '../config';

// ─── Templates ────────────────────────────────────────────────────────────────
const TEMPLATES = ["ieee", "springer", "apa style", "acm", "elsevier"];
const TYPES = ["conference", "journal"];

// ─── Markdown cleaner ─────────────────────────────────────────────────────────
const cleanMd = (text = '') =>
    text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').replace(/^#{1,6}\s+/, '').trim();

// ─── Line type detectors ───────────────────────────────────────────────────────
const isAbstractLine = t => /^(#{1,3}\s*)?(abstract)\b/i.test(t.trim());
const isKeywordsLine = t => /^(#{1,3}\s*)?(keywords?|index terms?)\b/i.test(t.trim());
const isContributionsLine = t => /^(#{1,3}\s*)?(contributions?)\b/i.test(t.trim());
const isSectionHeader = t => /^#{1,3}\s+/.test(t.trim()) || /^[IVX]+\.\s+\S/i.test(t.trim()) || /^\d+\.?\s+[A-Z]/.test(t.trim()) || /^[A-Z]\.\s+[A-Z]/.test(t.trim());
const isListItem = t => /^[-*•]\s+/.test(t.trim());
const isNumberedRef = t => /^\[\d+\]/.test(t.trim()) || /^\[[A-Za-z]\]/.test(t.trim());
const isNumberedRefDot = t => /^\d+\.\s+[A-Z]/.test(t.trim());

// ─── Parse document ───────────────────────────────────────────────────────────
const parseDocument = (rawText, topicFallback) => {
    const lines = rawText.split('\n');
    const title = cleanMd(lines[0] || topicFallback);
    const rest = lines.slice(1);

    let abstractLines = [];
    let keywordsLines = [];
    let contributionLines = [];
    let bodyLines = [];
    let phase = 'pre';

    for (const line of rest) {
        const t = line.trim();
        if (!t && phase === 'pre') continue;

        if (isAbstractLine(t)) {
            phase = 'abstract';
            const inline = t.replace(/^(#{1,3}\s*)?(abstract)[:\s\-–—]*/i, '').trim();
            if (inline) abstractLines.push(inline);
            continue;
        }
        if (isKeywordsLine(t)) {
            phase = 'keywords';
            const inline = t.replace(/^(#{1,3}\s*)?(keywords?|index terms?)[:\s\-–—]*/i, '').trim();
            if (inline) keywordsLines.push(inline);
            continue;
        }
        if (isContributionsLine(t)) {
            phase = 'contributions';
            continue;
        }
        if (isSectionHeader(t) && !isContributionsLine(t)) {
            phase = 'body';
        }

        if (phase === 'abstract') abstractLines.push(line);
        else if (phase === 'keywords') keywordsLines.push(line);
        else if (phase === 'contributions') contributionLines.push(line);
        else bodyLines.push(line);
    }

    return { title, abstractLines, keywordsLines, contributionLines, bodyLines };
};

// ─── Render body lines ────────────────────────────────────────────────────────
const renderBodyLines = (lines, style, onSectionImprove, isDark) => {
    let sectionBuffer = [];
    let sectionHeader = null;
    const result = [];

    const flushSection = (idx) => {
        if (sectionHeader !== null) {
            const sectionText = [sectionHeader, ...sectionBuffer].join('\n');
            result.push(
                <SectionWrapper key={`section-${idx}`} text={sectionText} onImprove={onSectionImprove} style={style} sectionBuffer={sectionBuffer} sectionHeader={sectionHeader} isDark={isDark} />
            );
            sectionHeader = null;
            sectionBuffer = [];
        }
    };

    lines.forEach((line, idx) => {
        const t = line.trim();
        const isH = t && (t.startsWith('## ') || t.startsWith('# ') || /^[IVX]+\.\s+\S/i.test(t) || /^\d+\.?\s+[A-Z][a-z]/i.test(t));

        if (isH) {
            flushSection(idx);
            sectionHeader = t;
        } else {
            sectionBuffer.push(line);
        }
    });
    flushSection(lines.length);

    return result;
};

const IMPROVE_ACTIONS = [
    { key: 'clarity', label: 'Improve Clarity' },
    { key: 'results', label: 'Add Experimental Results' },
    { key: 'math', label: 'Add Mathematical Model' },
    { key: 'metrics', label: 'Add Evaluation Metrics' },
    { key: 'depth', label: 'Increase Technical Depth' },
];

const SectionWrapper = ({ text, sectionHeader, sectionBuffer, onImprove, style, isDark }) => {
    const [hovered, setHovered] = useState(false);
    const [improving, setImproving] = useState(false);
    const [customPromptOpen, setCustomPromptOpen] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    const renderLines = () => {
        const result = [];
        let tableBuffer = [];

        const flushTable = (key) => {
            if (tableBuffer.length > 0) {
                const rows = tableBuffer.filter(line => line.trim() && !line.includes('---|'));
                if (rows.length > 0) {
                    result.push(
                        <div key={`table-${key}`} style={{ overflowX: 'auto', margin: '8pt 0' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: style.refSize || '8pt', border: '1px solid #eee' }}>
                                <tbody>
                                    {rows.map((row, rIdx) => {
                                        const cleanCols = row.split('|').filter(c => c.trim() !== '' || row.indexOf('|' + c + '|') !== -1).map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''));
                                        return (
                                            <tr key={rIdx} style={{ borderBottom: '1px solid #eee', background: rIdx === 0 ? '#f9fafb' : 'transparent' }}>
                                                {cleanCols.map((col, cIdx) => (
                                                    <td key={cIdx} style={{ padding: '6pt 4pt', border: '1px solid #ddd', fontWeight: rIdx === 0 ? 'bold' : 'normal', textAlign: 'center', fontSize: '8pt' }}>
                                                        {cleanMd(col)}
                                                    </td>
                                                ))}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                tableBuffer = [];
            }
        };

        sectionBuffer.forEach((line, idx) => {
            const t = line.trim();
            if (t.startsWith('|') && t.endsWith('|')) {
                tableBuffer.push(line);
            } else {
                flushTable(idx);
                if (!t) return;
                if (t.startsWith('### ')) {
                    result.push(<div key={idx} style={style.h3Style}>{cleanMd(t)}</div>);
                } else if (isListItem(t)) {
                    result.push(
                        <div key={idx} style={{ display: 'flex', gap: '4pt', fontSize: style.bodySize, lineHeight: style.lineHeight, marginBottom: '2pt', paddingLeft: '12pt' }}>
                            <span>•</span><span>{cleanMd(t.replace(/^[-*]\s+/, ''))}</span>
                        </div>
                    );
                } else if (isNumberedRef(t)) {
                    result.push(<div key={idx} style={{ fontSize: style.refSize, lineHeight: 1.25, marginBottom: '2pt', paddingLeft: '16pt', textIndent: '-16pt', textAlign: 'left' }}>{cleanMd(t)}</div>);
                } else if (isNumberedRefDot(t) && t.length > 20) {
                    result.push(<div key={idx} style={{ fontSize: style.refSize, lineHeight: 1.25, marginBottom: '2pt', paddingLeft: '18pt', textIndent: '-18pt', textAlign: 'left' }}>{cleanMd(t)}</div>);
                } else {
                    result.push(<p key={idx} style={{ fontSize: style.bodySize, lineHeight: style.lineHeight, margin: '0 0 4pt 0', textIndent: style.indent }}>{cleanMd(t)}</p>);
                }
            }
        });
        flushTable(sectionBuffer.length);
        return result;
    };

    return (
        <div style={{ position: 'relative' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            {sectionHeader && <div style={style.h2Style}>{cleanMd(sectionHeader)}</div>}
            {renderLines()}
            {hovered && !improving && sectionHeader && !customPromptOpen && (
                <div className={`absolute top-0 right-0 p-1.5 flex flex-col gap-1 z-[100] rounded-2xl shadow-xl border overflow-hidden ${isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/5 shadow-2xl shadow-black/10'}`}>
                    {IMPROVE_ACTIONS.map(a => (
                        <button
                            key={a.key}
                            onClick={() => { setImproving(true); onImprove(text, a.key, setImproving); }}
                            className={`px-3 py-2 rounded-2xl text-[11px] font-bold text-left whitespace-nowrap transition-all duration-300 border border-transparent ${isDark ? 'text-gray-400 hover:text-white hover:bg-white/5 hover:border-white/5' : 'text-gray-600 hover:bg-[#38bdf8]/10 hover:text-[#0284c7] hover:border-[#38bdf8]'}`}
                        >
                            {a.label}
                        </button>
                    ))}
                    <button
                        onClick={() => setCustomPromptOpen(true)}
                        className={`px-3 py-2 rounded-2xl text-[11px] font-bold text-left whitespace-nowrap transition-all duration-300 border border-transparent ${isDark ? 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 hover:border-cyan-500/30' : 'text-[#0284c7] bg-[#e0f2fe] hover:bg-[#38bdf8]/20 hover:border-[#38bdf8]'}`}
                    >
                        ✨ Change with AI...
                    </button>
                </div>


            )}
            {customPromptOpen && !improving && (
                <div className={`absolute top-0 right-0 p-3 z-10 rounded-2xl shadow-2xl flex flex-col gap-3 border ${isDark ? 'bg-black border-white/10' : 'bg-white border-black/5 shadow-2xl shadow-black/10'}`}>
                    <input
                        type="text" autoFocus value={customPrompt} onChange={e => setCustomPrompt(e.target.value)}
                        placeholder="E.g. Make it more formal..."
                        className={`text-[11px] px-3 py-2.5 rounded-2xl outline-none w-56 transition-all duration-300 border ${isDark ? 'bg-white/5 text-white border-white/10 focus:border-cyan-500/50' : 'bg-gray-50 border-gray-200 focus:border-[#38bdf8]'}`}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && customPrompt.trim()) { setImproving(true); onImprove(text, `custom:${customPrompt}`, setImproving); setCustomPromptOpen(false); setCustomPrompt(''); }
                            if (e.key === 'Escape') setCustomPromptOpen(false);
                        }}
                    />
                    <div className="flex gap-2">
                        <button onClick={() => { if (!customPrompt.trim()) return; setImproving(true); onImprove(text, `custom:${customPrompt}`, setImproving); setCustomPromptOpen(false); setCustomPrompt(''); }} className={`flex-1 text-[11px] py-2 rounded-2xl font-bold transition-all duration-300 ${isDark ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-[#e0f2fe] text-[#0284c7] border border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.15)]'}`}>Apply Change</button>
                        <button onClick={() => setCustomPromptOpen(false)} className={`px-3 py-2 rounded-2xl font-bold transition-all duration-300 ${isDark ? 'text-gray-400 bg-white/5 border border-transparent hover:border-white/10' : 'text-gray-500 bg-gray-100 border border-transparent hover:border-gray-200'}`}>✕</button>
                    </div>
                </div>


            )}
            {improving && <div className={`absolute top-1 right-1 text-[10px] px-2 py-1 rounded font-bold ${isDark ? 'text-[#38bdf8] bg-[#1a1a2e]' : 'text-blue-600 bg-white border border-[#38bdf8]'}`}>✨ Improving...</div>}
        </div>
    );
};

const ContributionsBlock = ({ lines, isIEEE }) => {
    const bullets = lines.map(l => l.trim()).filter(l => l.startsWith('- ') || l.startsWith('* '));
    if (!bullets.length) return null;
    return (
        <div style={{ marginBottom: '10pt', fontSize: '9pt', lineHeight: 1.4, padding: isIEEE ? '6pt 0' : '8pt 12pt', background: isIEEE ? 'transparent' : '#f0f7ff', borderLeft: isIEEE ? 'none' : '3px solid #3b82f6' }}>
            <div style={{ fontWeight: 'bold', fontStyle: isIEEE ? 'italic' : 'normal', marginBottom: '3pt', fontSize: '9pt', textTransform: isIEEE ? 'none' : 'uppercase', letterSpacing: isIEEE ? '0' : '0.04em' }}>
                {isIEEE ? 'Contributions of This Work:' : 'Contributions'}
            </div>
            {bullets.map((b, i) => (
                <div key={i} style={{ display: 'flex', gap: '4pt', marginBottom: '1pt', paddingLeft: '4pt' }}>
                    <span>•</span><span>{cleanMd(b.replace(/^[-*]\s+/, ''))}</span>
                </div>
            ))}
        </div>
    );
};

const IEEEPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove, isDark }) => {
    const font = "'Times New Roman', Times, serif";
    const style = {
        bodySize: '10pt', lineHeight: 1.3, indent: '18pt', emptyHeight: '0', refSize: '8pt',
        h2Style: { fontWeight: 'bold', fontSize: '10pt', textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '12pt', marginBottom: '6pt' },
        h3Style: { fontWeight: 'bold', fontStyle: 'italic', fontSize: '10pt', marginTop: '6pt', marginBottom: '2pt' },
    };
    return (
        <div ref={paperRef} style={{ background: 'white', color: 'black', fontFamily: font, fontSize: '10pt', padding: '0.75in', minHeight: '11in', width: '8.5in', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '10pt' }}>
                <div style={{ fontSize: '20pt', fontWeight: 'normal', lineHeight: 1.2, marginBottom: '8pt' }}>{title}</div>
                <div style={{ display: 'grid', gridTemplateColumns: isConference ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0 16pt', marginBottom: '6pt', fontSize: '10pt' }}>
                    {(isConference ? ['Author Name*', 'Author Name†', '3rd Name‡'] : [user.username || 'Author Name', 'Co-Author']).map((a, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontStyle: 'italic' }}>{a}</div>
                            <div style={{ fontSize: '9pt' }}>Clarion AI System</div>
                        </div>
                    ))}
                </div>
            </div>
            {abstractLines.length > 0 && (
                <div style={{ marginBottom: '6pt', fontSize: '9pt', lineHeight: 1.3, textAlign: 'justify' }}>
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Abstract— </span>{abstractLines.join(' ')}
                </div>
            )}
            {keywordsLines.length > 0 && (
                <div style={{ marginBottom: '6pt', fontSize: '9pt', lineHeight: 1.3 }}>
                    <span style={{ fontWeight: 'bold', fontStyle: 'italic' }}>Index Terms— </span>{keywordsLines.join(', ')}
                </div>
            )}
            <ContributionsBlock lines={contributionLines} isIEEE={true} />
            <div style={{ borderBottom: '1px solid #aaa', marginBottom: '8pt' }} />
            <div style={{ columnCount: 2, columnGap: '0.25in', columnFill: 'balance', textAlign: 'justify', hyphens: 'auto' }}>
                {renderBodyLines(bodyLines, style, onSectionImprove, isDark)}
            </div>
        </div>
    );
};

const SpringerPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove, isDark }) => {
    const headFont = "'Arial', 'Helvetica Neue', sans-serif";
    const bodyFont = "'Times New Roman', Times, serif";
    const style = {
        bodySize: '10pt', lineHeight: 1.5, indent: '0', emptyHeight: '0', refSize: '9pt',
        h2Style: { fontFamily: headFont, fontWeight: '700', fontSize: '11pt', color: '#000', marginTop: '14pt', marginBottom: '6pt', borderBottom: '1px solid #ddd', paddingBottom: '2pt' },
        h3Style: { fontFamily: headFont, fontWeight: '600', fontSize: '10pt', fontStyle: 'italic', color: '#222', marginTop: '8pt', marginBottom: '3pt' },
    };
    return (
        <div ref={paperRef} style={{ background: 'white', color: 'black', fontFamily: bodyFont, fontSize: '10pt', padding: '1in', minHeight: '11in', width: '8.5in', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '14pt', borderBottom: '2px solid #000', paddingBottom: '12pt' }}>
                <div style={{ fontFamily: headFont, fontSize: isConference ? '18pt' : '20pt', fontWeight: '700', lineHeight: 1.2, color: '#000', marginBottom: '10pt' }}>{title}</div>
                <div style={{ display: 'flex', gap: '20pt', fontSize: '10pt', marginBottom: '6pt', flexWrap: 'wrap' }}>
                    {[user.username || 'Author Name', 'Co-Author Name'].map((a, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontWeight: '600', fontFamily: headFont }}>{a}</div>
                            <div style={{ fontSize: '9pt', color: '#555' }}>Clarion AI System</div>
                        </div>
                    ))}
                </div>
            </div>
            {abstractLines.length > 0 && (
                <div style={{ marginBottom: '10pt', background: '#f8f8f8', borderLeft: '3px solid #555', padding: '8pt 12pt', textAlign: 'justify' }}>
                    <div style={{ fontFamily: headFont, fontWeight: '700', fontSize: '9pt', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4pt' }}>Abstract</div>
                    <div style={{ fontSize: '9.5pt', lineHeight: 1.4 }}>{abstractLines.join(' ')}</div>
                </div>
            )}
            {keywordsLines.length > 0 && (
                <div style={{ marginBottom: '8pt', fontSize: '9pt' }}>
                    <span style={{ fontFamily: headFont, fontWeight: '700' }}>Keywords: </span>{keywordsLines.join(', ')}
                </div>
            )}
            <ContributionsBlock lines={contributionLines} isIEEE={false} />
            <div style={isConference ? { columnCount: 2, columnGap: '0.3in', columnFill: 'balance', textAlign: 'justify', hyphens: 'auto' } : { textAlign: 'justify' }}>
                {renderBodyLines(bodyLines, style, onSectionImprove, isDark)}
            </div>
        </div>
    );
};

const APAPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove, isDark }) => {
    const font = "'Times New Roman', Times, serif";
    const style = {
        bodySize: '11pt', lineHeight: 2.0, indent: '0.5in', emptyHeight: '0', refSize: '11pt',
        h2Style: { fontWeight: 'bold', fontSize: '11pt', textAlign: 'center', marginTop: '12pt', marginBottom: '12pt' },
        h3Style: { fontWeight: 'bold', fontStyle: 'normal', fontSize: '11pt', textAlign: 'left', marginTop: '12pt', marginBottom: '12pt' },
    };
    return (
        <div ref={paperRef} style={{ background: 'white', color: 'black', fontFamily: font, fontSize: '11pt', padding: '1in', minHeight: '11in', width: '8.5in', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '24pt' }}>
                <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '12pt' }}>{title}</div>
                <div style={{ fontSize: '11pt', marginBottom: '6pt' }}>{user.username || 'Author Name'}, Co-Author Name</div>
                <div style={{ fontSize: '11pt' }}>Department of Research, Clarion AI</div>
            </div>
            {abstractLines.length > 0 && (
                <div style={{ marginBottom: '24pt' }}>
                    <div style={{ fontWeight: 'bold', textAlign: 'center', marginBottom: '12pt' }}>Abstract</div>
                    <div style={{ textAlign: 'left', textIndent: '0' }}>{abstractLines.join(' ')}</div>
                </div>
            )}
            <div style={{ textAlign: 'left', hyphens: 'auto' }}>
                {renderBodyLines(bodyLines, style, onSectionImprove, isDark)}
            </div>
        </div>
    );
};

const ACMPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove, isDark }) => {
    const font = "'Libertine', 'Linux Libertine', 'Times New Roman', serif";
    const headFont = "'Biolinum', 'Linux Biolinum', 'Arial', sans-serif";
    const style = {
        bodySize: '9pt', lineHeight: 1.4, indent: '1em', emptyHeight: '0', refSize: '8pt',
        h2Style: { fontFamily: headFont, fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', marginTop: '10pt', marginBottom: '4pt' },
        h3Style: { fontFamily: headFont, fontWeight: 'bold', fontSize: '9pt', marginTop: '6pt', marginBottom: '2pt' },
    };
    return (
        <div ref={paperRef} style={{ background: 'white', color: 'black', fontFamily: font, fontSize: '9pt', padding: '0.75in', minHeight: '11in', width: '8.5in', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'center', marginBottom: '20pt', borderBottom: '1px solid black', paddingBottom: '10pt' }}>
                <div style={{ fontFamily: headFont, fontSize: '16pt', fontWeight: 'bold', marginBottom: '10pt' }}>{title}</div>
                <div style={{ fontSize: '10pt', marginBottom: '4pt' }}>{user.username || 'Author Name'}, Co-Author</div>
                <div style={{ fontSize: '9pt', fontStyle: 'italic' }}>Clarion AI Institute</div>
            </div>
            <div style={{ columnCount: 2, columnGap: '0.33in', columnFill: 'balance', textAlign: 'justify', hyphens: 'auto' }}>
                {abstractLines.length > 0 && (
                    <div style={{ marginBottom: '8pt' }}>
                        <div style={{ fontFamily: headFont, fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', marginBottom: '4pt' }}>Abstract</div>
                        <div>{abstractLines.join(' ')}</div>
                    </div>
                )}
                {renderBodyLines(bodyLines, style, onSectionImprove, isDark)}
            </div>
        </div>
    );
};

const ElsevierPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove, isDark }) => {
    const font = "'Times New Roman', Times, serif";
    const headFont = "Arial, sans-serif";
    const style = {
        bodySize: '10pt', lineHeight: 1.5, indent: '0', emptyHeight: '0', refSize: '8pt',
        h2Style: { fontFamily: headFont, fontWeight: 'bold', fontSize: '10pt', textTransform: 'uppercase', marginTop: '12pt', marginBottom: '6pt' },
        h3Style: { fontFamily: headFont, fontWeight: 'bold', fontSize: '10pt', fontStyle: 'italic', marginTop: '8pt', marginBottom: '4pt' },
    };
    return (
        <div ref={paperRef} style={{ background: 'white', color: 'black', fontFamily: font, fontSize: '10pt', padding: '1in', minHeight: '11in', width: '8.5in', boxSizing: 'border-box' }}>
            <div style={{ borderBottom: '1px solid #ccc', paddingBottom: '12pt', marginBottom: '12pt' }}>
                <div style={{ fontFamily: headFont, fontSize: '18pt', fontWeight: 'bold', marginBottom: '8pt' }}>{title}</div>
                <div style={{ fontSize: '10pt', marginBottom: '8pt' }}><strong>{user.username || 'Author Name'}</strong>, Co-Author Name</div>
                <div style={{ fontSize: '8pt', fontStyle: 'italic' }}>Clarion Research, AI Division</div>
            </div>
            {abstractLines.length > 0 && (
                <div style={{ marginBottom: '16pt', padding: '10pt', borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc' }}>
                    <div style={{ fontFamily: headFont, fontWeight: 'bold', fontSize: '9pt', textTransform: 'uppercase', marginBottom: '4pt' }}>Abstract</div>
                    <div style={{ fontSize: '9pt', lineHeight: 1.4 }}>{abstractLines.join(' ')}</div>
                </div>
            )}
            <div style={{ textAlign: 'justify', columnCount: isConference ? 2 : 1, columnGap: '0.3in' }}>
                {renderBodyLines(bodyLines, style, onSectionImprove, isDark)}
            </div>
        </div>
    );
};

const CompareModal = ({ onClose, topic, onInsert, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComparison = async () => {
            setLoading(true); setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/compare`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setResult(data);
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        };
        fetchComparison();
    }, [topic]);

    const tableStyles = `
        .markdown-content table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.85rem; }
        .markdown-content th { background: ${isDark ? 'rgba(56,189,248,0.1)' : 'rgba(56,189,248,0.05)'}; padding: 14px 12px; text-align: left; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; font-weight: bold; color: ${isDark ? '#38bdf8' : '#0284c7'}; }
        .markdown-content td { padding: 14px 12px; border: 1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}; vertical-align: top; }
        .markdown-content p { line-height: 1.7; margin-bottom: 1.2rem; }
        .markdown-content h2 { font-size: 1.4rem; font-weight: 800; margin: 2rem 0 1rem; border-bottom: 2px solid rgba(56,189,248,0.3); padding-bottom: 0.6rem; color: ${isDark ? '#38bdf8' : '#1e40af'}; }
        .markdown-content h3 { font-size: 1.1rem; font-weight: 700; margin: 1.5rem 0 0.8rem; color: ${isDark ? '#e2e8f0' : '#1e293b'}; }
        .markdown-content ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1.2rem; }
        .markdown-content li { margin-bottom: 0.6rem; }
        .markdown-content strong { color: ${isDark ? '#fff' : '#000'}; font-weight: 600; }
    `;



    return (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className={`p-8 max-w-[900px] w-full max-h-[85vh] overflow-y-auto rounded-[20px] ${isDark ? 'bg-black border border-[#38bdf8] text-white shadow-lg' : 'bg-white border text-black shadow-xl'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>🔍 Comparative Analysis</h3>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-all duration-300 ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}><X size={20} /></button>

                </div>
                {loading && <div className="text-center p-8"><Loader2 className="animate-spin mx-auto mb-2" size={32} /><p>Comparing papers...</p></div>}
                {error && <div className="bg-red-500/20 text-red-500 p-4 rounded-xl mb-4">❌ {error}</div>}
                {result && (
                    <div className="space-y-6">
                        <div className="grid gap-3">
                            {result.papers.map((p, i) => (
                                <div key={i} className={`p-4 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50'}`}>
                                    <div className="font-bold">{p.title}</div>
                                    <div className="text-xs text-gray-500">{p.authors} · {p.year}</div>
                                    <a href={p.id} target="_blank" rel="noreferrer" className="text-[10px] text-[#38bdf8]">View ArXiv ↗</a>
                                </div>
                            ))}
                        </div>
                        <style>{tableStyles}</style>
                        <div className={`p-8 rounded-xl markdown-content ${isDark ? 'bg-[#0a0a0a] text-gray-300 border border-white/5 shadow-inner' : 'bg-gray-50 text-gray-800'}`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {result.analysis}
                            </ReactMarkdown>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
};

const CitationModal = ({ onClose, references, onFixRefs, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const validate = async () => {
            setLoading(true); setError(null);
            try {
                const res = await fetch(`${API_BASE_URL}/citations/validate`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ references })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error);
                setResults(data.results);
            } catch (e) { setError(e.message); }
            finally { setLoading(false); }
        };
        validate();
    }, [references]);

    return (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className={`p-8 max-w-[900px] w-full max-h-[85vh] overflow-y-auto rounded-[20px] ${isDark ? 'bg-black border border-[#38bdf8] text-white' : 'bg-white border text-black shadow-xl'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className={`text-lg font-bold ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>✔ Citation Validator</h3>
                    <button onClick={onClose} className={`p-2 rounded-xl transition-all duration-300 ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}><X size={20} /></button>

                </div>
                {loading && <div className="text-center p-8"><Loader2 className="animate-spin mx-auto mb-2" size={32} /><p>Validating citations...</p></div>}
                {results && (
                    <div className="space-y-3">
                        {results.map((r, i) => (
                            <div key={i} className={`p-4 rounded-xl border ${r.status === 'verified' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}>
                                <div className="flex gap-3">
                                    <span>{r.status === 'verified' ? '✅' : '❌'}</span>
                                    <div>
                                        <div className="text-[11px] text-gray-500">[{r.index}] {r.original.slice(0, 100)}...</div>
                                        {r.status === 'verified' && <div className="text-sm font-bold mt-1">Verified: {r.formatted}</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button
                            onClick={() => onFixRefs(results.filter(r => r.status === 'verified').map(r => ({ old: r.original, new: `[${r.index}] ${r.formatted}` })))}
                            className={`w-full py-3 rounded-2xl font-bold mt-4 transition-all duration-300 ${isDark ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-[#e0f2fe] text-[#0284c7] border border-[#38bdf8] shadow-[0_0_15px_rgba(56,189,248,0.2)]'}`}
                        >
                            Apply Verified Fixes
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
};

const PaperDrafter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const paperRef = useRef();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [topic, setTopic] = useState(location.state?.topic || '');
    const [template, setTemplate] = useState('ieee');
    const [type, setType] = useState('journal');
    const [instructions, setInstructions] = useState(location.state?.instructions || '');
    const [showCompare, setShowCompare] = useState(false);
    const [showCitations, setShowCitations] = useState(false);
    const [refiningContributions, setRefiningContributions] = useState(false);
    const [showImproveOptions, setShowImproveOptions] = useState(true);
    const [loadingPhase, setLoadingPhase] = useState('');
    const [workflowStep, setWorkflowStep] = useState('idle');

    // Auto-switch type if blocked by template
    useEffect(() => {
        if ((template === 'apa style' || template === 'elsevier') && type === 'journal') {
            setType('conference');
        }
    }, [template, type]);


    // Extraction states for sequential feed
    const [referencesList, setReferencesList] = useState([]);
    const [selectedRefIndices, setSelectedRefIndices] = useState(new Set([0, 1, 2, 3, 4]));
    const [extractedProposedSolution, setExtractedProposedSolution] = useState('');
    const [extractedRelatedWork, setExtractedRelatedWork] = useState('');
    const [extractedAbstract, setExtractedAbstract] = useState('');

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', id: '123' };
    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';
    const isIEEE = template === 'ieee';
    const isConference = type === 'conference';

    const activeBtnClass = isDark
        ? 'bg-cyan-500/20 text-[#38bdf8] border-white/10 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
        : 'bg-white text-[#0284c7] border-black/5 shadow-[0_0_15px_rgba(56,189,248,0.3)]';

    const inactiveBtnClass = isDark
        ? 'bg-white/5 text-gray-400 border border-transparent hover:text-white hover:bg-white/10 hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]'
        : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:text-[#0284c7] hover:shadow-[0_0_20px_rgba(56,189,248,0.3)]';




    const extractReferences = () => {
        if (!generatedDraft) return [];
        return generatedDraft.split('\n').filter(l => /^\[\d+\]/.test(l.trim()) || (/^\d+\.\s/.test(l.trim()) && l.trim().length > 40)).map(l => l.trim());
    };

    const convertToHTML = (draft, topic, template) => {
        const { title, abstractLines, keywordsLines, contributionLines, bodyLines } = parseDocument(draft, topic);
        const authorName = user.username || 'Researcher';
        let html = `<h1 style="text-align: center; font-size: 24pt;">${title}</h1>`;
        html += `<div style="text-align: center; margin-bottom: 20pt;"><p>${authorName}</p><p>Clarion AI System</p></div>`;
        if (abstractLines.length > 0) html += `<p><strong><em>Abstract—</em></strong> ${abstractLines.join(' ')}</p>`;
        if (keywordsLines.length > 0) html += `<p><strong><em>Index Terms—</em></strong> ${keywordsLines.join(', ')}</p>`;
        bodyLines.forEach(line => {
            const t = line.trim();
            if (isSectionHeader(t)) html += `<h2 style="text-align: center; text-transform: uppercase;">${cleanMd(t)}</h2>`;
            else html += `<p style="text-indent: 18pt; text-align: justify;">${cleanMd(t)}</p>`;
        });
        return html;
    };

    const handleGenerate = async (e) => {
        if (e) e.preventDefault();
        if (!topic.trim()) return;
        setLoading(true); setGeneratedDraft('');
        setReferencesList([]); setExtractedProposedSolution(''); setExtractedRelatedWork(''); setExtractedAbstract('');

        try {
            setLoadingPhase('collecting_references');
            setWorkflowStep('selecting_references');

            const refsRes = await fetch(`${API_BASE_URL}/draft/extract-references`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            if (refsRes.ok) {
                const refsData = await refsRes.json();
                const refs = refsData.content || [];
                setReferencesList(refs);
                setSelectedRefIndices(new Set());

            } else {
                throw new Error('Failed to fetch references. Status: ' + refsRes.status);
            }
        } catch (err) { alert('Could not fetch references: ' + err.message); }
        finally { setLoading(false); setLoadingPhase(''); }
    };

    const handleExtractProposedSolution = async () => {
        setLoading(true);
        setWorkflowStep('reviewing_proposed_solution');

        const selectedCitations = referencesList.filter((_, i) => selectedRefIndices.has(i)).join('\n');

        try {
            // STEP 2: Proposed Solution
            setLoadingPhase('getting_proposed_solution');
            let psText = "";
            try {
                const psRes = await fetch(`${API_BASE_URL}/draft/extract-proposed-solution`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, citation: selectedCitations })
                });
                if (psRes.ok) {
                    const psData = await psRes.json();
                    psText = psData.content;
                    setExtractedProposedSolution(psText);
                }
            } catch (err) { console.error("PS extraction failed", err); }
        } catch (err) { alert('Extraction error: ' + err.message); }
        finally { setLoading(false); setLoadingPhase(''); }
    };

    const handleExtractRelatedWorkAndAbstract = async () => {
        setLoading(true);
        setWorkflowStep('reviewing_related_work_abstract');

        const selectedCitations = referencesList.filter((_, i) => selectedRefIndices.has(i)).join('\n');

        try {
            // STEP 3: Related Work Extraction
            setLoadingPhase('getting_related_work');
            let rwText = "";
            try {
                const rwRes = await fetch(`${API_BASE_URL}/draft/extract-related-work`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, citation: selectedCitations })
                });
                if (rwRes.ok) {
                    const rwData = await rwRes.json();
                    rwText = rwData.content;
                    setExtractedRelatedWork(rwText);
                }
            } catch (err) { console.error("RW extraction failed", err); }
            await new Promise(r => setTimeout(r, 1000));

            // STEP 4: Abstract Extraction
            setLoadingPhase('getting_abstract');
            let absText = "";
            try {
                const absRes = await fetch(`${API_BASE_URL}/draft/extract-abstract`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ topic, citation: selectedCitations })
                });
                if (absRes.ok) {
                    const absData = await absRes.json();
                    absText = absData.content;
                    setExtractedAbstract(absText);
                }
            } catch (err) { console.error("Abstract extraction failed", err); }

        } catch (err) { alert('Extraction error: ' + err.message); }
        finally { setLoading(false); setLoadingPhase(''); }
    };

    const handleFinalDraft = async () => {
        setLoading(true);
        setWorkflowStep('drafting');
        setLoadingPhase('drafting');

        const selectedCitations = referencesList.filter((_, i) => selectedRefIndices.has(i)).join('\n');

        try {
            const finalInstructions = `${instructions}\n\nPRIMARY REFERENCES:\n${selectedCitations}\n\nUSE THIS PROPOSED SOLUTION AS BASE:\n${extractedProposedSolution}\n\nUSE THIS EXTRACTED RELATED WORK AS BASE:\n${extractedRelatedWork}\n\nUSE THIS EXTRACTED ABSTRACT AS BASE:\n${extractedAbstract}`;

            const response = await fetch(`${API_BASE_URL}/draft/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, template, type, additionalInstructions: finalInstructions })
            });

            if (!response.ok) throw new Error('Generation failed');
            const reader = response.body.getReader(), decoder = new TextDecoder();
            let fullText = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
                setGeneratedDraft(fullText);
                if (fullText.length > 0) setLoading(false);
            }
        } catch (err) { alert('Generation error: ' + err.message); }
        finally { setLoading(false); setLoadingPhase(''); setWorkflowStep('done'); }
    };

    const handleSectionImprove = async (sectionText, action, setImproving) => {
        try {
            const response = await fetch(`${API_BASE_URL}/improve`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sectionText, action })
            });
            if (!response.ok) throw new Error('Improvement failed');
            const reader = response.body.getReader(), decoder = new TextDecoder();
            let improvedText = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                improvedText += decoder.decode(value, { stream: true });
            }
            setGeneratedDraft(prev => prev.replace(sectionText.trim(), improvedText.trim()));
        } catch (err) { alert(err.message); }
        finally { if (setImproving) setImproving(false); }
    };

    const renderPaper = () => {
        if (!generatedDraft) return null;
        const { title, abstractLines, keywordsLines, contributionLines, bodyLines } = parseDocument(generatedDraft, topic);
        const props = { paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove: showImproveOptions ? handleSectionImprove : null, isDark };
        if (template === 'ieee') return <IEEEPaper {...props} />;
        if (template === 'springer') return <SpringerPaper {...props} />;
        if (template === 'apa style') return <APAPaper {...props} />;
        if (template === 'acm') return <ACMPaper {...props} />;
        return <ElsevierPaper {...props} />;
    };

    const handleDownloadPDF = () => {
        html2pdf().from(paperRef.current).save(`${topic.replace(/\s+/g, '_')}.pdf`);
    };

    const handleSaveToWorkspace = async () => {
        setLoading(true);
        try {
            const content = convertToHTML(generatedDraft, topic, template);
            await fetch(`${API_BASE_URL}/papers/write`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id || user._id, title: topic, domain: 'Research', content, template, source: 'written' })
            });
            alert('Saved to DocSpace!');
            navigate('/docspace');
        } catch (err) { alert(err.message); }
        finally { setLoading(false); }
    };

    const refs = extractReferences();

    return (
        <div className={`flex h-screen overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-black'}`}>
            <AppSidebar activePage="draft" isDark={isDark} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            <main className="flex-1 flex flex-col overflow-hidden">
                <header className={`h-16 flex items-center justify-between px-8 border-b ${isDark ? 'bg-black border-white/5' : 'bg-white border-[#38bdf8]/20'}`}>
                    <h2 className="text-xl font-semibold">Paper Drafter</h2>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Panel: Config */}
                    <div className={`w-[360px] border-r overflow-y-auto p-6 space-y-6 ${isDark ? 'bg-[#0f0f0f] border-white/5' : 'bg-white border-[#38bdf8]/20'}`}>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase">Research Topic</label>
                                <input 
                                    type="text" value={topic} onChange={e => setTopic(e.target.value)} required 
                                    placeholder="e.g. AI in Healthcare" 
                                    className={`w-full h-14 px-4 rounded-2xl outline-none border transition-all duration-300 ${
                                        isDark 
                                        ? 'bg-black/50 border-white/10 text-white focus:border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                                        : 'bg-white border-black/5 text-black focus:border-[#38bdf8]/20 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                                    }`} 
                                />



                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase">Template</label>
                                <select 
                                    value={template} onChange={e => setTemplate(e.target.value)} 
                                    className={`w-full h-14 px-4 rounded-2xl border outline-none transition-all duration-300 ${
                                        isDark 
                                        ? 'bg-black text-white border-white/10 focus:border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                                        : 'bg-white text-black border-black/5 focus:border-[#38bdf8]/20 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                                    }`}
                                >
                                    {TEMPLATES.map(t => (
                                        <option key={t} value={t}>
                                            {t === 'apa style' ? 'APA Style' : t.toUpperCase()}
                                        </option>
                                    ))}
                                </select>



                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase">Type</label>
                                <div className="flex gap-2">
                                    {TYPES.map(t => {
                                        const isBlocked = t === 'journal' && (template === 'apa style' || template === 'elsevier');
                                        const isActive = type === t;
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setType(t)}
                                                disabled={isBlocked}
                                                className={`flex-1 py-3 px-4 rounded-2xl text-xs font-bold transition-all duration-300 border ${isActive ? activeBtnClass : inactiveBtnClass
                                                    } ${isBlocked ? 'opacity-40 cursor-not-allowed grayscale' : ''}`}
                                            >
                                                {t.toUpperCase()}
                                            </button>
                                        );
                                    })}

                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-500 uppercase">Instructions</label>
                                <textarea 
                                    value={instructions} onChange={e => setInstructions(e.target.value)} rows="3" 
                                    className={`w-full p-4 rounded-2xl border outline-none transition-all duration-300 resize-none ${
                                        isDark 
                                        ? 'bg-black/50 border-white/10 text-white focus:border-white/20 shadow-[0_0_15px_rgba(56,189,248,0.2)]' 
                                        : 'bg-white border-black/5 text-black focus:border-[#38bdf8]/20 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                                    }`} 
                                />


                            </div>
                            <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${activeBtnClass}`}>
                                {loading && !generatedDraft ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Synthesize Draft
                            </button>

                        </form>

                        {generatedDraft && (
                            <div className="pt-4 border-t border-white/5 space-y-2">
                                <button onClick={() => setShowCompare(true)} className={`w-full p-3 rounded-2xl text-xs font-bold transition-all duration-300 ${inactiveBtnClass}`}>🔍 Research Comparison</button>
                                <button onClick={() => setShowCitations(true)} className={`w-full p-3 rounded-2xl text-xs font-bold transition-all duration-300 ${inactiveBtnClass}`}>✔ Validate Citations</button>
                                <button onClick={handleDownloadPDF} className={`w-full p-3 rounded-2xl text-xs font-bold transition-all duration-300 ${inactiveBtnClass}`}>Printer Export</button>
                                <button onClick={handleSaveToWorkspace} className={`w-full p-3 rounded-2xl font-bold transition-all duration-300 ${activeBtnClass}`}>Save to Workspace</button>
                            </div>

                        )}
                    </div>

                    {/* Right Panel: Preview/Feed */}
                    <div className={`flex-1 overflow-y-auto p-12 scrollbar-hide ${isDark ? 'bg-[#121212]' : 'bg-gray-100'}`}>
                        {loading && !generatedDraft ? (
                            <div className="max-w-3xl mx-auto flex flex-col items-center justify-center min-h-full space-y-8 animate-in fade-in duration-700">
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full border-4 border-[#38bdf8]/20 border-t-[#38bdf8] animate-spin mx-auto" />
                                    <h4 className="text-2xl font-black bg-gradient-to-r from-[#38bdf8] to-blue-400 bg-clip-text text-transparent italic">RESEARCH SYNTHESIS ENGINE</h4>
                                </div>

                                {loadingPhase && (
                                    <div className="text-center text-[#38bdf8] font-bold uppercase tracking-widest text-sm translate-y-4">
                                        {loadingPhase.replace(/_/g, ' ')}...
                                    </div>
                                )}
                            </div>
                        ) : workflowStep === 'selecting_references' ? (
                            <div className="max-w-3xl mx-auto flex flex-col min-h-full space-y-8 animate-in fade-in duration-700">
                                <div className="text-center space-y-2 mb-4">
                                    <h4 className="text-2xl font-black bg-gradient-to-r from-[#38bdf8] to-blue-400 bg-clip-text text-transparent">SELECT REFERENCES</h4>
                                    <p className="text-gray-400">Select the references to ground your research components upon.</p>
                                </div>
                                <div className="space-y-3">
                                    {referencesList.map((ref, idx) => (
                                        <div key={idx} onClick={() => {
                                            const newSet = new Set(selectedRefIndices);
                                            if (newSet.has(idx)) newSet.delete(idx);
                                            else newSet.add(idx);
                                            setSelectedRefIndices(newSet);
                                        }} className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 flex items-start gap-4 ${
                                            selectedRefIndices.has(idx) 
                                            ? (isDark ? 'bg-[#38bdf8]/10 border-[#38bdf8]/50 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-blue-50 border-blue-400/50 shadow-[0_0_15px_rgba(56,189,248,0.1)]') 
                                            : (isDark ? 'bg-white/5 border-white/10 hover:border-white/20' : 'bg-white border-black/5 shadow-sm hover:border-[#38bdf8]')
                                        }`}>

                                            <div className={`mt-1 flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 ${selectedRefIndices.has(idx) ? 'bg-[#38bdf8] border-[#38bdf8] text-black shadow-[0_0_10px_rgba(56,189,248,0.4)]' : (isDark ? 'border-white/20' : 'border-black/10')}`}>
                                                {selectedRefIndices.has(idx) && <CheckCircle2 size={14} />}
                                            </div>
                                            <p className={`text-sm font-serif italic leading-relaxed transition-colors duration-300 ${isDark ? (selectedRefIndices.has(idx) ? 'text-white' : 'text-gray-400') : (selectedRefIndices.has(idx) ? 'text-blue-900' : 'text-gray-700')}`}>{ref}</p>

                                        </div>
                                    ))}
                                </div>
                                <button onClick={handleExtractProposedSolution} disabled={selectedRefIndices.size === 0} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 transition-all duration-300 ${activeBtnClass} disabled:opacity-50 disabled:cursor-not-allowed`}>
                                    Next Stage: Extract Proposed Solution <ChevronDown className="-rotate-90" size={18} />
                                </button>

                            </div>
                        ) : workflowStep === 'reviewing_proposed_solution' ? (
                            <div className="max-w-4xl mx-auto flex flex-col min-h-full space-y-8 animate-in fade-in duration-700">
                                <div className="text-center space-y-2 mb-4">
                                    <h4 className="text-2xl font-black bg-gradient-to-r from-[#38bdf8] to-blue-400 bg-clip-text text-transparent">PROPOSED SOLUTION</h4>

                                    <p className="text-gray-400">Review the methodology extracted for your paper.</p>
                                </div>
                                <div className="grid gap-6">
                                    {extractedProposedSolution && (
                                        <div className={`border rounded-2xl p-7 shadow-xl transition-all duration-300 ${
                                            isDark ? 'bg-white/5 border-[#38bdf8]/30 shadow-[#38bdf8]/5' : 'bg-white border-blue-100 shadow-blue-500/10'
                                        }`}>
                                            <div className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em] mb-4">Proposed Solution</div>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{extractedProposedSolution}</p>
                                        </div>
                                    )}


                                </div>
                                <button onClick={handleExtractRelatedWorkAndAbstract} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 transition-all duration-300 ${activeBtnClass}`}>
                                    Next Stage: Extract Related Work & Abstract <ChevronDown className="-rotate-90" size={18} />
                                </button>

                            </div>
                        ) : workflowStep === 'reviewing_related_work_abstract' ? (
                            <div className="max-w-4xl mx-auto flex flex-col min-h-full space-y-8 animate-in fade-in duration-700">
                                <div className="text-center space-y-2 mb-4">
                                    <h4 className="text-2xl font-black bg-gradient-to-r from-[#38bdf8] to-blue-400 bg-clip-text text-transparent">RELATED WORK & ABSTRACT</h4>
                                    <p className="text-gray-400">Review the context and summary generated for your paper.</p>
                                </div>


                                <div className="grid gap-6">
                                    {extractedRelatedWork && (
                                        <div className={`border rounded-2xl p-7 shadow-xl transition-all duration-300 ${
                                            isDark ? 'bg-white/5 border-[#38bdf8]/30 shadow-[#38bdf8]/5' : 'bg-white border-blue-100 shadow-blue-500/10'
                                        }`}>
                                            <div className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em] mb-4">Related Work</div>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{extractedRelatedWork}</p>
                                        </div>
                                    )}
                                    {extractedAbstract && (
                                        <div className={`border rounded-2xl p-7 shadow-xl transition-all duration-300 ${
                                            isDark ? 'bg-white/5 border-[#38bdf8]/30 shadow-[#38bdf8]/5' : 'bg-white border-blue-100 shadow-blue-500/10'
                                        }`}>
                                            <div className="text-[10px] font-black text-[#38bdf8] uppercase tracking-[0.2em] mb-4">Abstract</div>
                                            <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{extractedAbstract}</p>
                                        </div>
                                    )}


                                </div>

                                <button onClick={handleFinalDraft} className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 mt-8 transition-all duration-300 ${activeBtnClass}`}>
                                    <Sparkles size={18} /> Draft Final Paper
                                </button>

                            </div>
                        ) : (workflowStep === 'done' || workflowStep === 'drafting') && generatedDraft ? (
                            <div className="max-w-[8.5in] mx-auto animate-in fade-in duration-1000">
                                {renderPaper()}
                            </div>
                        ) : (
                            <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-full text-center space-y-6">
                                <FileText size={48} className="text-gray-500 opacity-20" />
                                <div>
                                    <h4 className="text-xl font-bold mb-2">No Active Manuscript</h4>
                                    <p className="text-gray-500">Enter a topic and synthesize your next publication.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showCompare && <CompareModal onClose={() => setShowCompare(false)} topic={topic} isDark={isDark} />}
            {showCitations && <CitationModal onClose={() => setShowCitations(false)} references={refs} isDark={isDark} onFixRefs={(fixes) => {
                let newDraft = generatedDraft;
                fixes.forEach(f => newDraft = newDraft.replace(f.old, f.new));
                setGeneratedDraft(newDraft);
                setShowCitations(false);
            }} />}
        </div>
    );
};

export default PaperDrafter;
