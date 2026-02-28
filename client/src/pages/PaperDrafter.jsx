import AppSidebar from '../components/AppSidebar';
import HamburgerButton from '../components/HamburgerButton';
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
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
const TEMPLATES = [
    { id: 'IEEE Journal', brand: 'IEEE' },
    { id: 'IEEE Conference', brand: 'IEEE' },
    { id: 'Springer Journal', brand: 'Springer' },
    { id: 'Springer Conference', brand: 'Springer' },
];

// ─── Markdown cleaner ─────────────────────────────────────────────────────────
const cleanMd = (text = '') =>
    text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1').replace(/`(.*?)`/g, '$1').replace(/^#{1,6}\s+/, '').trim();

// ─── Line type detectors ───────────────────────────────────────────────────────
const isAbstractLine = t => /^(#{1,3}\s*)?(abstract)\b/i.test(t.trim());
const isKeywordsLine = t => /^(#{1,3}\s*)?(keywords?|index terms?)\b/i.test(t.trim());
const isContributionsLine = t => /^(#{1,3}\s*)?(contributions?)\b/i.test(t.trim());
const isSectionHeader = t => /^#{1,3}\s+/.test(t.trim()) || /^[IVX]+\.\s+\S/i.test(t.trim()) || /^\d+\.?\s+[A-Z]/.test(t.trim()) || /^[A-Z]\.\s+[A-Z]/.test(t.trim());
const isListItem = t => /^[-*•]\s+/.test(t.trim());
const isNumberedRef = t => /^\[\d+\]/.test(t.trim()) || /^\[[A-Za-z]\]/.test(t.trim()); // Catch alpha just to style them right, even if we prefer numbers
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

// ─── Section Wrapper with hover Improve buttons ───────────────────────────────
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
                                        const cols = row.split('|').map(c => c.trim()).filter((c, i, a) => i > 0 && i < a.length - 1 || (i === 0 && c === '' ? false : true) && (i === a.length - 1 && c === '' ? false : true));
                                        // Simpler robust split:
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
            {/* Section header */}
            {sectionHeader && <div style={style.h2Style}>{cleanMd(sectionHeader)}</div>}

            {/* Rendered lines (including tables) */}
            {renderLines()}

            {/* Hover improve toolbar */}
            {hovered && !improving && sectionHeader && (
                <div className={`absolute top-0 right-0 p-1 flex flex-col gap-0.5 z-10 rounded-lg shadow-lg ${isDark ? 'bg-[#1a1a2e] border border-[#38bdf8] shadow-[0_4px_20px_rgba(56,189,248,0.4)]' : 'bg-white border border-transparent shadow-[0_0_30px_rgba(56,189,248,0.2)]'}`}>
                    {IMPROVE_ACTIONS.map(a => (
                        <button
                            key={a.key}
                            onClick={() => { setImproving(true); onImprove(text, a.key, setImproving); }}
                            className={`px-3 py-1.5 rounded-md text-[11px] font-bold text-left whitespace-nowrap transition-all ${isDark ? 'text-[#d1d5db] hover:bg-[#38bdf8]/10 hover:text-white border border-transparent' : 'bg-white text-black hover:bg-blue-50 hover:text-blue-600 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}`}
                        >
                            {a.label}
                        </button>
                    ))}
                </div>
            )}
            {improving && <div className={`absolute top-1 right-1 text-[10px] px-2 py-1 rounded font-bold ${isDark ? 'text-[#38bdf8] bg-[#1a1a2e]' : 'text-blue-600 bg-white border border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.3)]'}`}>✨ Improving...</div>}
        </div>
    );
};

// ─── Contributions block ───────────────────────────────────────────────────────
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

// ─── IEEE Paper ───────────────────────────────────────────────────────────────
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

// ─── Springer Paper ───────────────────────────────────────────────────────────
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

// ─── APA Paper ───────────────────────────────────────────────────────────
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

// ─── ACM Paper ───────────────────────────────────────────────────────────
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

// ─── Elsevier Paper ───────────────────────────────────────────────────────────
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

// ─── Compare Modal ────────────────────────────────────────────────────────────
const CompareModal = ({ onClose, topic, onInsert, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        fetchComparison();
    }, []);

    const renderMarkdown = (text) => {
        if (!text) return null;

        const lines = text.split('\n');
        const elements = [];
        let tableRows = [];
        let inTable = false;

        const flushTable = () => {
            if (tableRows.length > 0) {
                // Ignore the separator row `|---|---|`
                const contentRows = tableRows.filter(r => !r.includes('---|') && !r.includes('---+') && !r.match(/^\|[-\s|]+\|$/));
                if (contentRows.length > 0) {
                    elements.push(
                        <div key={`table-${elements.length}`} style={{ overflowX: 'auto', margin: '20px 0' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #d1d5db', fontSize: '13px', fontFamily: 'sans-serif' }}>
                                <tbody>
                                    {contentRows.map((rowStr, rIdx) => {
                                        const cols = rowStr.split('|').map(c => c.trim()).filter((c, i, a) => !(i === 0 && c === '') && !(i === a.length - 1 && c === ''));
                                        return (
                                            <tr key={rIdx} style={{ background: rIdx === 0 ? '#f9fafb' : 'white', borderBottom: '1px solid #e5e7eb' }}>
                                                {cols.map((col, cIdx) => {
                                                    const cleanCol = col.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                                    return (
                                                        <td key={cIdx} style={{ padding: '10px 14px', borderRight: '1px solid #e5e7eb', fontWeight: rIdx === 0 ? 'bold' : 'normal', color: '#111827', verticalAlign: 'top' }} dangerouslySetInnerHTML={{ __html: cleanCol }} />
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    );
                }
                tableRows = [];
                inTable = false;
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Basic check for table rows
            if (line.startsWith('|') && line.endsWith('|')) {
                inTable = true;
                tableRows.push(line);
            } else {
                if (inTable) flushTable();
                if (!line) {
                    elements.push(<div key={`br-${i}`} style={{ height: '8px' }} />);
                    continue;
                }

                const processBold = (str) => str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                if (line.startsWith('### ')) {
                    elements.push(<h3 key={`h3-${i}`} style={{ fontSize: '15px', fontWeight: 'bold', margin: '16px 0 8px 0', color: '#111827' }} dangerouslySetInnerHTML={{ __html: processBold(line.replace('### ', '')) }} />);
                } else if (line.startsWith('## ')) {
                    elements.push(<h2 key={`h2-${i}`} style={{ fontSize: '17px', fontWeight: 'bold', margin: '20px 0 10px 0', color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }} dangerouslySetInnerHTML={{ __html: processBold(line.replace('## ', '')) }} />);
                } else if (line.startsWith('# ')) {
                    elements.push(<h1 key={`h1-${i}`} style={{ fontSize: '20px', fontWeight: 'bold', margin: '24px 0 12px 0', color: '#111827' }} dangerouslySetInnerHTML={{ __html: processBold(line.replace('# ', '')) }} />);
                } else if (line.startsWith('- ') || line.startsWith('* ')) {
                    elements.push(
                        <div key={`li-${i}`} style={{ marginLeft: '16px', marginBottom: '6px', display: 'flex', gap: '8px' }}>
                            <span style={{ color: '#4b5563' }}>•</span>
                            <span dangerouslySetInnerHTML={{ __html: processBold(line.substring(2)) }} />
                        </div>
                    );
                } else {
                    elements.push(<p key={`p-${i}`} style={{ margin: '0 0 12px 0', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: processBold(line) }} />);
                }
            }
        }
        if (inTable) flushTable();
        return elements;
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}>
            <div className={`p-8 max-w-[900px] w-full max-h-[85vh] overflow-y-auto rounded-[20px] transition-all ${isDark ? 'bg-[#0a0a0a] border-[1.5px] border-[#38bdf8] text-white shadow-[0_0_40px_rgba(56,189,248,0.15)]' : 'bg-white border border-transparent text-black shadow-[0_0_50px_rgba(56,189,248,0.3)]'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className={`m-0 text-[18px] font-bold tracking-[0.02em] ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>🔍 Comparative Analysis</h3>
                    <button onClick={onClose} className={`cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-[#9ca3af] hover:text-white border-2 border-transparent' : 'bg-white text-gray-400 hover:text-black hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:bg-gray-50'}`}>
                        <X size={20} />
                    </button>
                </div>

                {!result && !loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p className={`mb-4 text-[14px] ${isDark ? 'text-[#9ca3af]' : 'text-gray-600'}`}>
                            Pull 3–5 similar papers from ArXiv and generate a comparison paragraph + table for: <strong className={isDark ? 'text-[#d1d5db]' : 'text-black'}>"{topic}"</strong>
                        </p>
                        <button onClick={fetchComparison} className={`px-6 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer transition-all ${isDark ? 'bg-[#38bdf8] border-none text-black hover:bg-blue-400' : 'bg-white border border-[#38bdf8] text-blue-600 shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] hover:-translate-y-0.5'}`}>
                            Fetch & Compare
                        </button>
                    </div>
                )}

                {loading && (
                    <div className={`text-center p-[30px] ${isDark ? 'text-[#38bdf8]' : 'text-blue-600'}`}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                        <p>Searching ArXiv and generating comparison...</p>
                    </div>
                )}

                {error && <div className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-[#7f1d1d] text-[#fca5a5]' : 'bg-red-50 border-2 border-red-500 text-red-700 font-bold'}`}>❌ {error}</div>}

                {result && (
                    <div>
                        <h4 className={`mb-3 text-[13px] uppercase tracking-[0.05em] font-bold ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>Papers Found ({result.papers.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            {result.papers.map((p, i) => (
                                <div key={i} className={`rounded-lg p-3 ${isDark ? 'bg-[#1f1f2e] border border-[#374151]' : 'bg-white border border-transparent shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.3)]'}`}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{p.title}</div>
                                    <div className={`text-[11px] ${isDark ? 'text-[#9ca3af]' : 'text-gray-600'}`}>{p.authors} · {p.year}</div>
                                    {p.id && <a href={p.id} target="_blank" rel="noreferrer" className={`text-[10px] no-underline ${isDark ? 'text-[#38bdf8]' : 'text-blue-600 font-bold hover:underline'}`}>View on ArXiv ↗</a>}
                                </div>
                            ))}
                        </div>
                        <h4 className={`mb-3 text-[13px] uppercase tracking-[0.05em] font-bold ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>AI-Generated Analysis</h4>
                        <div className={`rounded-lg p-6 text-[14px] font-serif ${isDark ? 'bg-white text-[#111827] border border-[#e5e7eb] shadow-inner' : 'bg-white text-black border border-transparent shadow-inner'}`}>
                            {renderMarkdown(result.analysis)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Citation Modal ────────────────────────────────────────────────────────────
const CitationModal = ({ onClose, references, onFixRefs, isDark }) => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

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

    useEffect(() => {
        validate();
    }, []);

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', backdropFilter: 'blur(8px)' }}>
            <div className={`p-8 max-w-[900px] w-full max-h-[85vh] overflow-y-auto rounded-[20px] transition-all ${isDark ? 'bg-[#0a0a0a] border-[1.5px] border-[#38bdf8] text-white shadow-[0_0_40px_rgba(56,189,248,0.15)]' : 'bg-white border border-transparent text-black shadow-[0_0_50px_rgba(56,189,248,0.3)]'}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 className={`m-0 text-[18px] font-bold tracking-[0.02em] ${isDark ? 'text-[#38bdf8]' : 'text-blue-700'}`}>✔ Citation Validator</h3>
                    <button onClick={onClose} className={`cursor-pointer p-2 rounded-lg flex items-center justify-center transition-all ${isDark ? 'bg-white/5 text-[#9ca3af] hover:text-white border-2 border-transparent' : 'bg-white text-gray-400 hover:text-black hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] hover:bg-gray-50'}`}>
                        <X size={20} />
                    </button>
                </div>

                {!results && !loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p className={`mb-4 text-[14px] ${isDark ? 'text-[#9ca3af]' : 'text-gray-600'}`}>
                            Validate <strong className={isDark ? 'text-[#d1d5db]' : 'text-black'}>{references.length}</strong> references via CrossRef DOI lookup
                        </p>
                        <button onClick={validate} className={`px-6 py-2.5 rounded-xl text-[14px] font-bold cursor-pointer transition-all ${isDark ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] border-none text-white hover:brightness-110' : 'bg-white border border-emerald-500 text-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]'}`}>
                            Validate All Citations
                        </button>
                    </div>
                )}

                {loading && (
                    <div className={`text-center p-[30px] ${isDark ? 'text-[#34d399]' : 'text-emerald-600'}`}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                        <p>Checking CrossRef DOI database...</p>
                    </div>
                )}

                {error && <div className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-[#7f1d1d] text-[#fca5a5]' : 'bg-red-50 border-2 border-red-500 text-red-700 font-bold'}`}>❌ {error}</div>}

                {results && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {results.map((r, i) => (
                            <div key={i} className={`rounded-lg p-3 ${isDark ? (r.status === 'verified' ? 'bg-[#1f1f2e] border border-[#059669]' : 'bg-[#1f1f2e] border border-[#374151]') : (r.status === 'verified' ? 'bg-emerald-50 border border-emerald-500' : 'bg-white border border-transparent shadow-sm')}`}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{r.status === 'verified' ? '✅' : '❌'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <div className={`text-[11px] ${isDark ? 'text-[#9ca3af]' : 'text-gray-700 font-medium'}`}>
                                                [{r.index}] Original: {r.original.slice(0, 60)}{r.original.length > 60 ? '...' : ''}
                                            </div>
                                            {r.scholarStatus && (
                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${isDark ? (r.scholarStatus.includes('Scholar') ? 'bg-[#065f46] text-[#d1d5db]' : 'bg-[#374151] text-[#d1d5db]') : (r.scholarStatus.includes('Scholar') ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-800')}`}>
                                                    {r.scholarStatus}
                                                </span>
                                            )}
                                        </div>
                                        {r.status === 'verified' && (
                                            <>
                                                <div className={`text-[12px] mb-1 ${isDark ? 'text-[#d1d5db]' : 'text-black font-semibold'}`}>
                                                    📋 IEEE Format: {r.formatted.slice(0, 100)}{r.formatted.length > 100 ? '...' : ''}
                                                </div>
                                                {r.doi && (
                                                    <a href={r.doi} target="_blank" rel="noreferrer" className={`text-[11px] no-underline font-bold hover:underline ${isDark ? 'text-[#059669]' : 'text-emerald-700'}`}>
                                                        🔗 DOI: {r.doi}
                                                    </a>
                                                )}
                                            </>
                                        )}
                                        {r.status === 'unverified' && (
                                            <div className="text-[11px] text-red-500 font-bold">Could not verify via CrossRef</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button onClick={validate} className={`flex-1 px-4 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${isDark ? 'bg-transparent border border-[#059669] text-[#34d399] hover:bg-[#059669]/10' : 'bg-white border border-transparent text-black shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}`}>
                                🔄 Re-validate
                            </button>
                            <button onClick={() => onFixRefs(results.filter(r => r.status === 'verified').map(r => ({ old: r.original, new: `[${r.index}] ${r.formatted}` })))} className={`flex-1 px-4 py-2.5 rounded-xl text-[12px] font-bold cursor-pointer transition-all ${isDark ? 'bg-gradient-to-r from-[#059669] to-[#0d9488] border-none text-white hover:brightness-110' : 'bg-white border border-emerald-500 text-emerald-600 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(52,211,153,0.5)]'}`}>
                                🔧 Fix All References
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
const PaperDrafter = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const paperRef = useRef();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [topic, setTopic] = useState(location.state?.topic || '');
    const [template, setTemplate] = useState('IEEE Journal');
    const [instructions, setInstructions] = useState(location.state?.instructions || '');
    const [showCompare, setShowCompare] = useState(false);
    const [showCitations, setShowCitations] = useState(false);
    const [refiningContributions, setRefiningContributions] = useState(false);
    const [showImproveOptions, setShowImproveOptions] = useState(true);

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };

    const theme = localStorage.getItem('theme') || 'dark';
    const isDark = theme === 'dark';

    const isIEEE = template.startsWith('IEEE');
    const isConference = template.includes('Conference');

    // ── Extract references from draft ──────────────────────────────────────
    const extractReferences = () => {
        if (!generatedDraft) return [];
        return generatedDraft.split('\n').filter(l => /^\[\d+\]/.test(l.trim()) || (/^\d+\.\s/.test(l.trim()) && l.trim().length > 40)).map(l => l.trim());
    };
    // ── Convert Draft to HTML for DocSpace ──────────────────────────────────
    const convertToHTML = (draft, topic, template) => {
        const { title, abstractLines, keywordsLines, contributionLines, bodyLines } = parseDocument(draft, topic);
        const authorName = user.username || 'Researcher';
        const isIEEE = template.includes('IEEE');

        let html = `<h1 class="paper-title" style="text-align: center; column-span: all; font-size: 24pt; font-weight: normal; margin-bottom: 15pt;">${title}</h1>`;

        html += `
            <div class="authors-block" style="text-align: center; column-span: all; margin-bottom: 20pt; display: flex; justify-content: center; gap: 40px;">
                <div style="text-align: center;">
                    <p style="font-style: italic; margin-bottom: 0;">${authorName}</p>
                    <p style="font-size: 10pt; margin-top: 0;">Clarion AI System</p>
                </div>
                <div style="text-align: center;">
                    <p style="font-style: italic; margin-bottom: 0;">Co-Author</p>
                    <p style="font-size: 10pt; margin-top: 0;">Clarion AI System</p>
                </div>
            </div>
            `;

        if (abstractLines.length > 0) {
            html += `<p class="abstract-section" style="column-span: all; text-align: justify; font-size: 10pt; line-height: 1.3;">
                <strong><em>Abstract—</em></strong> ${abstractLines.join(' ')}
            </p>`;
        }

        if (keywordsLines.length > 0) {
            html += `<p class="keywords-section" style="column-span: all; text-align: justify; font-size: 10pt; line-height: 1.3; margin-bottom: 12pt;">
                <strong><em>Index Terms—</em></strong> ${keywordsLines.join(', ')}
            </p>`;
        }

        if (contributionLines.length > 0) {
            html += `<div class="contributions-block" style="column-span: all; margin-bottom: 12pt; font-size: 10pt;">
                        <strong>Contributions of This Work:</strong>
                        <ul style="margin-top: 5pt;">
                            ${contributionLines.map(l => {
                const clean = cleanMd(l.replace(/^[-*]\s+/, ''));
                return clean ? `<li style="margin-bottom: 2pt;">${clean}</li>` : '';
            }).join('')}
                        </ul>
                    </div>`;
        }

        html += `<hr style="column-span: all; border: none; border-top: 1px solid #aaa; margin: 15pt 0;" />`;

        bodyLines.forEach(line => {
            const t = line.trim();
            if (!t) return;

            if (isSectionHeader(t)) {
                html += `<h2 style="text-align: center; text-transform: uppercase; font-size: 11pt; margin-top: 15pt; margin-bottom: 8pt;">${cleanMd(t)}</h2>`;
            } else if (t.startsWith('### ')) {
                html += `<h3 style="font-style: italic; font-size: 10pt; margin-top: 10pt; margin-bottom: 4pt;">${cleanMd(t)}</h3>`;
            } else if (isListItem(t)) {
                html += `<ul style="margin-bottom: 6pt;"><li>${cleanMd(t.replace(/^[-*]\s+/, ''))}</li></ul>`;
            } else {
                html += `<p style="text-indent: 18pt; text-align: justify; margin-bottom: 6pt; font-size: 10pt;">${cleanMd(t)}</p>`;
            }
        });

        return html;
    };

    // ── Generate draft ─────────────────────────────────────────────────────
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setLoading(true); setGeneratedDraft('');
        try {
            const response = await fetch(`${API_BASE_URL}/draft/generate`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, template, type: isConference ? 'Conference' : 'Journal', additionalInstructions: instructions })
            });
            if (!response.ok) throw new Error('Failed to start generation');
            const reader = response.body.getReader(), decoder = new TextDecoder();
            let fullText = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
                setGeneratedDraft(fullText);
                if (fullText.length > 0) setLoading(false);
            }
        } catch (err) {
            alert('Failed to generate draft. Please check your connection and API key.');
        } finally { setLoading(false); }
    };

    // ── Improve a section (streaming) ──────────────────────────────────────
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
            // If it's refining contributions, replace the old contributions section
            if (action === 'refineContributions') {
                setGeneratedDraft(prev => {
                    const lines = prev.split('\n');
                    const startIdx = lines.findIndex(l => isContributionsLine(l));
                    if (startIdx !== -1) {
                        // Find the end of keywords/contributions section (next section header or end of list)
                        let endIdx = lines.findIndex((l, i) => i > startIdx && (isSectionHeader(l) || (isAbstractLine(l) && !isKeywordsLine(l))));
                        if (endIdx === -1) endIdx = lines.length;

                        const newLines = [...lines];
                        newLines.splice(startIdx + 1, endIdx - startIdx - 1, improvedText);
                        return newLines.join('\n');
                    } else {
                        // Injection fallback if no header exists
                        const abstractIdx = lines.findLastIndex(l => isAbstractLine(l));
                        if (abstractIdx !== -1) {
                            let endOfAbstract = lines.findIndex((l, i) => i > abstractIdx && (isKeywordsLine(l) || isSectionHeader(l)));
                            if (endOfAbstract === -1) endOfAbstract = abstractIdx + 1;
                            const newLines = [...lines];
                            newLines.splice(endOfAbstract, 0, '\n## CONTRIBUTIONS OF THIS WORK:', improvedText);
                            return newLines.join('\n');
                        }
                    }
                    return prev + '\n\n## CONTRIBUTIONS OF THIS WORK:\n' + improvedText;
                });
            } else {
                // For general sections, try to be more precise than a simple string replace
                setGeneratedDraft(prev => {
                    // Safety check: if the sectionText exactly exists, use it
                    if (prev.includes(sectionText)) {
                        return prev.replace(sectionText, improvedText);
                    }
                    // Otherwise, try to replace based on the header if we can find it
                    return prev.replace(sectionText.trim(), improvedText.trim());
                });
            }
        } catch (err) {
            alert('Section improvement failed: ' + err.message);
        } finally { if (setImproving) setImproving(false); }
    };

    const handleRefineContributions = () => {
        const { abstractLines, contributionLines, bodyLines } = parseDocument(generatedDraft, topic);
        const introText = bodyLines.slice(0, 50).join('\n'); // Take first part of body as intro
        const context = `ABSTRACT:\n${abstractLines.join(' ')}\n\nINTRODUCTION/BODY:\n${introText}`;
        setRefiningContributions(true);
        handleSectionImprove(context, 'refineContributions', setRefiningContributions);
    };

    const handleDownloadPDF = () => {
        html2pdf().set({
            margin: 0, filename: `${topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        }).from(paperRef.current).save();
    };

    const handleSaveToWorkspace = async () => {
        if (!generatedDraft) return;
        setLoading(true);

        try {
            const { title } = parseDocument(generatedDraft, topic);

            // Generate structured HTML that Quill can understand and render nicely
            const contentToSave = convertToHTML(generatedDraft, topic, template);

            const response = await fetch(`${API_BASE_URL}/papers/write`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id || user._id,
                    title: title || topic || 'Untitled Draft',
                    domain: 'Other',
                    content: contentToSave,
                    template: template,
                    source: 'written'
                })
            });

            if (!response.ok) throw new Error('Failed to save paper');
            const data = await response.json();

            alert('Draft converted and sent to DocSpace!');
            navigate('/docspace', { state: { paperId: data.paper._id } });
        } catch (err) {
            alert('Failed to save paper: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    const renderPaper = () => {
        if (!generatedDraft) return null;
        const { title, abstractLines, keywordsLines, contributionLines, bodyLines } = parseDocument(generatedDraft, topic);
        const commonProps = { paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove: showImproveOptions ? handleSectionImprove : null, isDark };
        return isIEEE ? <IEEEPaper {...commonProps} /> : <SpringerPaper {...commonProps} />;
    };

    const refs = extractReferences();

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-black'}`}>
            {/* Sidebar */}
            <AppSidebar isOpen={isSidebarOpen} activePage="draft" isDark={isDark} onClose={() => setIsSidebarOpen(false)} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main */}
            <main className={`flex-1 flex flex-col relative overflow-hidden ${isDark ? 'bg-black' : 'bg-[#f8fafc]'}`}>
                <header className={`z-20 h-16 flex items-center justify-between px-8 border-b ${isDark ? 'bg-black/40 border-white/5 text-white' : 'bg-white/40 border-[#38bdf8]/20 text-black backdrop-blur-md'}`}>
                    <div className="flex items-center gap-4">
                        <HamburgerButton isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} isDark={isDark} />
                        <h2 className="text-xl font-semibold">Paper Drafting</h2>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Config Panel */}
                    <div className={`w-full lg:w-[360px] border-r overflow-y-auto p-6 scrollbar-hide ${isDark ? 'border-white/5 bg-[#0f0f0f]' : 'border-[#38bdf8]/20 bg-white'}`}>
                        <div className="space-y-6">


                            <form onSubmit={handleGenerate} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Research Topic</label>
                                    <input
                                        type="text"
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        placeholder="Enter the core research subject..."
                                        className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all ${isDark ? 'bg-black/50 text-white placeholder-gray-500 border border-[#38bdf8]/30 focus:border-[#38bdf8]' : 'bg-white text-black placeholder-gray-400 border border-transparent shadow-[0_0_10px_rgba(56,189,248,0.1)] focus:shadow-[0_0_20px_rgba(56,189,248,0.4)] focus:outline-none'}`}
                                        style={!isDark ? {} : { border: '1.5px solid rgba(56,189,248,0.25)' }}
                                        required
                                    />
                                </div>

                                {/* ── Template Dropdown ── */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Template</label>
                                    <div className="relative">
                                        <select
                                            value={template.split(' ')[0]}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const type = (val === 'APA' || val === 'Elsevier') ? 'Journal' : (template.includes('Conference') ? 'Conference' : 'Journal');
                                                setTemplate(`${val} ${type}`);
                                            }}
                                            className={`appearance-none w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all cursor-pointer ${isDark ? 'bg-black/50 text-white border border-[#38bdf8]/30 focus:border-[#38bdf8]' : 'bg-white text-black border border-transparent shadow-[0_0_10px_rgba(56,189,248,0.1)] focus:shadow-[0_0_20px_rgba(56,189,248,0.4)]'}`} style={!isDark ? {} : { border: '1.5px solid rgba(56,189,248,0.25)' }}
                                        >
                                            <option value="IEEE">IEEE</option>
                                            <option value="Springer">Springer</option>
                                            <option value="APA">APA Style</option>
                                            <option value="ACM">ACM</option>
                                            <option value="Elsevier">Elsevier</option>
                                        </select>
                                        <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-gray-400' : 'text-[#0284c7]'}`} />
                                    </div>
                                </div>

                                {/* ── Type Row ── */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Type</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['Journal', 'Conference'].map(label => {
                                            const brand = template.split(' ')[0];
                                            const active = template.includes(label);
                                            const isDisabled = label === 'Conference' && (brand === 'APA' || brand === 'Elsevier');

                                            const activeClass = active ? (isDark ? 'bg-black/50 border border-[#38bdf8] text-white' : 'bg-white border-transparent text-black shadow-[0_0_20px_rgba(56,189,248,0.4)]') : (isDark ? 'bg-black/50 border border-[#38bdf8]/30 hover:border-[#38bdf8]/60 text-gray-400' : 'bg-white border-transparent text-gray-500 shadow-[0_0_10px_rgba(56,189,248,0.1)] hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]');

                                            const disabledClass = isDisabled ? 'opacity-30 !cursor-not-allowed grayscale pointer-events-none' : 'cursor-pointer';

                                            return (
                                                <button
                                                    key={label}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => setTemplate(`${brand} ${label}`)}
                                                    className={`relative flex flex-col items-center justify-center gap-1 py-3.5 px-3 rounded-xl transition-all duration-200 border ${activeClass} ${disabledClass}`}>
                                                    <span className="text-[11px] font-bold">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Additional Instructions</label>
                                    <textarea
                                        value={instructions}
                                        onChange={e => setInstructions(e.target.value)}
                                        placeholder="e.g. Focus on experimental results..."
                                        rows="3"
                                        className={`w-full rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none ${isDark ? 'bg-black/50 text-white placeholder-gray-500 border border-[#38bdf8]/30 focus:border-[#38bdf8]' : 'bg-white text-black placeholder-gray-400 border border-transparent shadow-[0_0_10px_rgba(56,189,248,0.1)] focus:shadow-[0_0_20px_rgba(56,189,248,0.4)] focus:outline-none'}`}
                                        style={!isDark ? {} : { border: '1.5px solid rgba(56,189,248,0.25)' }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:cursor-not-allowed transition-all duration-300 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]' : 'bg-white text-black border border-transparent hover:border-[#38bdf8]/50 hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}
                                >
                                    {loading ? <><Loader2 className="animate-spin" size={18} /> GENERATING...</> : <><Sparkles size={18} /> SYNTHESIZE DRAFT</>}
                                </button>
                            </form>

                            {/* Action buttons after generation */}
                            {generatedDraft && (
                                <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-white/5' : 'border-[#38bdf8]/20'}`}>
                                    <button onClick={handleRefineContributions} disabled={refiningContributions} className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 disabled:cursor-not-allowed ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.15)] hover:shadow-[0_0_18px_rgba(56,189,248,0.4)]' : 'bg-white text-black border border-transparent hover:border-[#38bdf8]/50 hover:-translate-y-1 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}`}>
                                        {refiningContributions ? <Loader2 size={14} className="animate-spin" /> : '⚡ Refine Contributions'}
                                    </button>
                                    <button onClick={() => setShowCompare(true)} className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.15)] hover:shadow-[0_0_18px_rgba(56,189,248,0.4)]' : 'bg-white text-black border border-transparent hover:border-[#38bdf8]/50 hover:-translate-y-1 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}`}>
                                        🔍 Compare with Existing Work
                                    </button>
                                    <button onClick={() => setShowCitations(true)} disabled={refs.length === 0} className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 disabled:cursor-not-allowed ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.15)] hover:shadow-[0_0_18px_rgba(56,189,248,0.4)]' : 'bg-white text-black border border-transparent hover:border-[#38bdf8]/50 hover:-translate-y-1 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}`}>
                                        ✔ Validate Citations {refs.length > 0 ? `(${refs.length})` : '(none found)'}
                                    </button>
                                    <button onClick={handleDownloadPDF} className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_8px_rgba(56,189,248,0.15)] hover:shadow-[0_0_18px_rgba(56,189,248,0.4)]' : 'bg-white text-black border border-transparent hover:border-[#38bdf8]/50 hover:-translate-y-1 shadow-sm hover:shadow-[0_0_15px_rgba(56,189,248,0.4)]'}`}>
                                        <Printer size={14} /> PDF Export
                                    </button>
                                    <button onClick={handleSaveToWorkspace} disabled={loading} className={`w-full flex items-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all duration-300 disabled:cursor-not-allowed ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_10px_rgba(56,189,248,0.2)] hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]' : 'bg-white text-black border border-transparent hover:border-[#38bdf8]/50 hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}>
                                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save to Workspace
                                    </button>
                                </div>
                            )}


                        </div>
                    </div>

                    {/* Paper Preview */}
                    <div className={`flex-1 overflow-y-auto p-4 md:p-12 scrollbar-hide ${isDark ? 'bg-[#121212]' : 'bg-[#e2e8f0]'}`}>
                        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Document Workbench</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] text-gray-400">{template} · 1:1 Preview</p>
                                    {loading && generatedDraft && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 bg-[#38bdf8] rounded-full animate-bounce" />
                                            <div className="w-1 h-1 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:-0.2s]" />
                                            <div className="w-1 h-1 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:-0.4s]" />
                                            <span className="text-[8px] text-[#38bdf8] font-bold uppercase tracking-widest">Streaming</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {generatedDraft && (
                                <div className="text-[10px] text-gray-500 italic">✏️ Hover over any section to improve it</div>
                            )}
                        </div>

                        {!generatedDraft && !loading && (
                            <div className={`max-w-[8.5in] aspect-[8.5/11] mx-auto rounded-3xl flex flex-col items-center justify-center text-center p-12 transition-colors ${isDark ? 'bg-white/5 border border-dashed border-white/10 hover:border-white/20' : 'bg-white border border-dashed border-gray-200 hover:border-[#38bdf8] hover:shadow-[0_0_30px_rgba(56,189,248,0.25)] shadow-sm'}`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    <FileType size={32} className={`${isDark ? 'opacity-20' : 'text-gray-400'}`} />
                                </div>
                                <h4 className={`text-lg font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-800'}`}>No Active Manuscript</h4>
                                <p className={`text-sm max-w-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Configure your research scope and click Synthesize Draft.</p>
                            </div>
                        )}

                        {loading && !generatedDraft && (
                            <div className={`max-w-[8.5in] aspect-[8.5/11] mx-auto rounded-3xl p-12 flex flex-col items-center justify-center text-center ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-transparent shadow-[0_0_40px_rgba(56,189,248,0.2)]'}`}>
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-[#38bdf8]/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="w-24 h-24 rounded-full border-4 border-[#38bdf8]/20 border-t-[#38bdf8] animate-spin relative z-10" />
                                </div>
                                <h4 className="text-xl font-bold bg-gradient-to-r from-[#38bdf8] to-blue-400 bg-clip-text text-transparent mb-3">SYNTHESIZING MANUSCRIPT</h4>
                                <p className={`text-sm max-w-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Architecting the {template} structure...</p>
                            </div>
                        )}

                        {generatedDraft && (
                            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {renderPaper()}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showCompare && <CompareModal onClose={() => setShowCompare(false)} topic={topic} isDark={isDark} onInsert={(content) => {
                setGeneratedDraft(prev => {
                    const lines = prev.split('\n');
                    const relatedWorkIdx = lines.findIndex(l => /related work/i.test(l));
                    if (relatedWorkIdx !== -1) {
                        const newLines = [...lines];
                        newLines.splice(relatedWorkIdx + 1, 0, '\n' + content);
                        return newLines.join('\n');
                    }
                    return prev + '\n\n## RELATED WORK\n' + content;
                });
                setShowCompare(false);
            }} />}
            {showCitations && <CitationModal onClose={() => setShowCitations(false)} references={refs} isDark={isDark} onFixRefs={(fixes) => {
                setGeneratedDraft(prev => {
                    let newText = prev;
                    fixes.forEach(f => {
                        newText = newText.replace(f.old, f.new);
                    });
                    return newText;
                });
                setShowCitations(false);
            }} />}
        </div>
    );
};

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


export default PaperDrafter;
