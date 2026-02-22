import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import {
    FileText, Sparkles, Loader2,
    LayoutDashboard, Search, LogOut, Menu,
    BookOpen, FileType, CheckCircle2, Printer, RefreshCw,
    ChevronDown, ExternalLink, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';

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
const renderBodyLines = (lines, style, onSectionImprove) => {
    let sectionBuffer = [];
    let sectionHeader = null;
    const result = [];

    const flushSection = (idx) => {
        if (sectionHeader !== null) {
            const sectionText = [sectionHeader, ...sectionBuffer].join('\n');
            result.push(
                <SectionWrapper key={`section-${idx}`} text={sectionText} onImprove={onSectionImprove} style={style} sectionBuffer={sectionBuffer} sectionHeader={sectionHeader} />
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
    { key: 'clarity', icon: '✏️', label: 'Improve Clarity' },
    { key: 'results', icon: '📊', label: 'Add Experimental Results' },
    { key: 'math', icon: '🔬', label: 'Add Mathematical Model' },
    { key: 'metrics', icon: '📈', label: 'Add Evaluation Metrics' },
    { key: 'depth', icon: '🧠', label: 'Increase Technical Depth' },
];

const SectionWrapper = ({ text, sectionHeader, sectionBuffer, onImprove, style }) => {
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
                <div style={{
                    position: 'absolute', top: 0, right: 0,
                    background: '#1a1a2e', border: '1px solid #7c3aed', borderRadius: '8px',
                    padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px', zIndex: 10,
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)'
                }}>
                    {IMPROVE_ACTIONS.map(a => (
                        <button
                            key={a.key}
                            onClick={() => { setImproving(true); onImprove(text, a.key, setImproving); }}
                            style={{
                                background: 'transparent', border: 'none', color: '#d1d5db',
                                padding: '4px 8px', borderRadius: '6px', cursor: 'pointer',
                                fontSize: '11px', textAlign: 'left', whiteSpace: 'nowrap',
                                transition: 'background 0.15s'
                            }}
                            onMouseEnter={e => e.target.style.background = '#7c3aed20'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                            {a.icon} {a.label}
                        </button>
                    ))}
                </div>
            )}
            {improving && <div style={{ position: 'absolute', top: 2, right: 2, fontSize: '10px', color: '#7c3aed', background: '#1a1a2e', padding: '2px 6px', borderRadius: '4px' }}>✨ Improving...</div>}
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
const IEEEPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove }) => {
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
                            <div style={{ fontSize: '9pt' }}>ResearchPilot AI System</div>
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
                {renderBodyLines(bodyLines, style, onSectionImprove)}
            </div>
        </div>
    );
};

// ─── Springer Paper ───────────────────────────────────────────────────────────
const SpringerPaper = ({ paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove }) => {
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
                            <div style={{ fontSize: '9pt', color: '#555' }}>ResearchPilot AI System</div>
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
                {renderBodyLines(bodyLines, style, onSectionImprove)}
            </div>
        </div>
    );
};

// ─── Compare Modal ────────────────────────────────────────────────────────────
const CompareModal = ({ onClose, topic, onInsert }) => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const fetchComparison = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch('http://localhost:5001/api/compare', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResult(data);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#111', border: '1px solid #7c3aed', borderRadius: '16px', padding: '24px', maxWidth: '800px', width: '100%', maxHeight: '80vh', overflowY: 'auto', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#a78bfa' }}>🔍 Related Work Comparison</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>

                {!result && !loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p style={{ color: '#9ca3af', marginBottom: '16px', fontSize: '14px' }}>
                            Pull 3–5 similar papers from ArXiv and generate a comparison paragraph + table for: <strong style={{ color: '#d1d5db' }}>"{topic}"</strong>
                        </p>
                        <button onClick={fetchComparison} style={{ background: 'linear-gradient(to right,#7c3aed,#4f46e5)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Fetch & Compare
                        </button>
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#a78bfa' }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                        <p>Searching ArXiv and generating comparison...</p>
                    </div>
                )}

                {error && <div style={{ background: '#7f1d1d', borderRadius: '8px', padding: '12px', color: '#fca5a5', marginBottom: '12px' }}>❌ {error}</div>}

                {result && (
                    <div>
                        <h4 style={{ color: '#a78bfa', marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Papers Found ({result.papers.length})</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                            {result.papers.map((p, i) => (
                                <div key={i} style={{ background: '#1f1f2e', borderRadius: '8px', padding: '10px 12px', border: '1px solid #374151' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>{p.title}</div>
                                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>{p.authors} · {p.year}</div>
                                    {p.id && <a href={p.id} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#7c3aed', textDecoration: 'none' }}>View on ArXiv ↗</a>}
                                </div>
                            ))}
                        </div>
                        <h4 style={{ color: '#a78bfa', marginBottom: '8px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI-Generated Analysis</h4>
                        <div style={{ background: '#1f1f2e', borderRadius: '8px', padding: '16px', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#e5e7eb', border: '1px solid #374151' }}>
                            {result.analysis}
                        </div>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                            <button onClick={fetchComparison} style={{ background: 'transparent', border: '1px solid #7c3aed', color: '#a78bfa', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', flex: 1 }}>
                                🔄 Refresh
                            </button>
                            <button onClick={() => onInsert(result.analysis)} style={{ background: 'linear-gradient(to right, #7c3aed, #4f46e5)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                                📥 Insert into Paper
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Citation Modal ────────────────────────────────────────────────────────────
const CitationModal = ({ onClose, references, onFixRefs }) => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);

    const validate = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch('http://localhost:5001/api/citations/validate', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ references })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setResults(data.results);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#111', border: '1px solid #059669', borderRadius: '16px', padding: '24px', maxWidth: '800px', width: '100%', maxHeight: '80vh', overflowY: 'auto', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '16px', color: '#34d399' }}>✔ Citation Validator</h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '20px' }}>×</button>
                </div>

                {!results && !loading && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <p style={{ color: '#9ca3af', marginBottom: '16px', fontSize: '14px' }}>
                            Validate <strong style={{ color: '#d1d5db' }}>{references.length}</strong> references via CrossRef DOI lookup
                        </p>
                        <button onClick={validate} style={{ background: 'linear-gradient(to right,#059669,#0d9488)', border: 'none', color: 'white', padding: '10px 24px', borderRadius: '10px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Validate All Citations
                        </button>
                    </div>
                )}

                {loading && (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#34d399' }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                        <p>Checking CrossRef DOI database...</p>
                    </div>
                )}

                {error && <div style={{ background: '#7f1d1d', borderRadius: '8px', padding: '12px', color: '#fca5a5' }}>❌ {error}</div>}

                {results && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {results.map((r, i) => (
                            <div key={i} style={{ background: '#1f1f2e', borderRadius: '8px', padding: '10px 12px', border: `1px solid ${r.status === 'verified' ? '#059669' : '#374151'}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{r.status === 'verified' ? '✅' : '❌'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                [{r.index}] Original: {r.original.slice(0, 60)}{r.original.length > 60 ? '...' : ''}
                                            </div>
                                            {r.scholarStatus && (
                                                <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: r.scholarStatus.includes('Scholar') ? '#065f46' : '#374151', color: '#d1d5db', fontWeight: 'bold' }}>
                                                    {r.scholarStatus}
                                                </span>
                                            )}
                                        </div>
                                        {r.status === 'verified' && (
                                            <>
                                                <div style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '4px' }}>
                                                    📋 IEEE Format: {r.formatted.slice(0, 100)}{r.formatted.length > 100 ? '...' : ''}
                                                </div>
                                                {r.doi && (
                                                    <a href={r.doi} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#059669', textDecoration: 'none' }}>
                                                        🔗 DOI: {r.doi}
                                                    </a>
                                                )}
                                            </>
                                        )}
                                        {r.status === 'unverified' && (
                                            <div style={{ fontSize: '11px', color: '#f87171' }}>Could not verify via CrossRef</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button onClick={validate} style={{ background: 'transparent', border: '1px solid #059669', color: '#34d399', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', cursor: 'pointer', flex: 1 }}>
                                🔄 Re-validate
                            </button>
                            <button onClick={() => onFixRefs(results.filter(r => r.status === 'verified').map(r => ({ old: r.original, new: `[${r.index}] ${r.formatted}` })))} style={{ background: 'linear-gradient(to right, #059669, #0d9488)', border: 'none', color: 'white', padding: '10px 16px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
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
    const paperRef = useRef();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [generatedDraft, setGeneratedDraft] = useState('');
    const [topic, setTopic] = useState('');
    const [template, setTemplate] = useState('IEEE Journal');
    const [instructions, setInstructions] = useState('');
    const [showCompare, setShowCompare] = useState(false);
    const [showCitations, setShowCitations] = useState(false);
    const [refiningContributions, setRefiningContributions] = useState(false);
    const [showImproveOptions, setShowImproveOptions] = useState(true);

    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };
    const isIEEE = template.startsWith('IEEE');
    const isConference = template.includes('Conference');

    // ── Extract references from draft ──────────────────────────────────────
    const extractReferences = () => {
        if (!generatedDraft) return [];
        return generatedDraft.split('\n').filter(l => /^\[\d+\]/.test(l.trim()) || (/^\d+\.\s/.test(l.trim()) && l.trim().length > 40)).map(l => l.trim());
    };

    // ── Generate draft ─────────────────────────────────────────────────────
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setLoading(true); setGeneratedDraft('');
        try {
            const response = await fetch('http://localhost:5001/api/draft/generate', {
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
            const response = await fetch('http://localhost:5001/api/improve', {
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
                    const { contributionLines } = parseDocument(prev, topic);
                    const oldText = contributionLines.join('\n');

                    if (oldText) {
                        return prev.replace(oldText, improvedText);
                    } else {
                        const lines = prev.split('\n');
                        const contributionsHeaderIdx = lines.findIndex(l => isContributionsLine(l));
                        if (contributionsHeaderIdx !== -1) {
                            let nextHeaderIdx = lines.findIndex((l, i) => i > contributionsHeaderIdx && (isSectionHeader(l) || isAbstractLine(l) || isKeywordsLine(l)));
                            if (nextHeaderIdx === -1) nextHeaderIdx = lines.length;
                            const newLines = [...lines];
                            newLines.splice(contributionsHeaderIdx + 1, nextHeaderIdx - contributionsHeaderIdx - 1, improvedText);
                            return newLines.join('\n');
                        } else {
                            const abstractIdx = lines.findLastIndex(l => isAbstractLine(l));
                            if (abstractIdx !== -1) {
                                let endOfAbstract = lines.findIndex((l, i) => i > abstractIdx && (isKeywordsLine(l) || isSectionHeader(l)));
                                if (endOfAbstract === -1) endOfAbstract = abstractIdx + 1;
                                const newLines = [...lines];
                                newLines.splice(endOfAbstract, 0, '\n## Contributions of This Work:', improvedText);
                                return newLines.join('\n');
                            }
                        }
                    }
                    return prev;
                });
            } else {
                setGeneratedDraft(prev => prev.replace(sectionText, improvedText));
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

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };

    const renderPaper = () => {
        if (!generatedDraft) return null;
        const { title, abstractLines, keywordsLines, contributionLines, bodyLines } = parseDocument(generatedDraft, topic);
        const commonProps = { paperRef, title, abstractLines, keywordsLines, contributionLines, bodyLines, user, isConference, onSectionImprove: showImproveOptions ? handleSectionImprove : null };
        return isIEEE ? <IEEEPaper {...commonProps} /> : <SpringerPaper {...commonProps} />;
    };

    const refs = extractReferences();

    return (
        <div className="flex h-screen bg-[#0a0a0a] text-white font-sans overflow-hidden">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black/90 border-r border-white/5 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xl tracking-wide">
                        <span className="p-1.5 rounded-lg bg-purple-500/10"><LayoutDashboard size={20} /></span>
                        ResearchPilot
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                    <SidebarItem icon={<LayoutDashboard size={18} />} text="Overview" onClick={() => navigate('/home')} />
                    <SidebarItem icon={<Search size={18} />} text="Discover Papers" onClick={() => navigate('/search')} />
                    <SidebarItem icon={<FileText size={18} />} text="Doc Space" onClick={() => navigate('/doc-space')} />
                    <SidebarItem icon={<BookOpen size={18} />} text="Paper Drafting" active />
                    <SidebarItem icon={<FileText size={18} />} text="Workspace" onClick={() => navigate('/workspace')} />
                </nav>
                <div className="p-4 border-t border-white/5">
                    <button onClick={handleLogout} className="flex items-center gap-3 text-gray-500 hover:text-red-400 transition-colors w-full px-4 py-3 rounded-xl hover:bg-white/5">
                        <LogOut size={18} /><span className="font-medium text-sm">Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 flex flex-col relative overflow-hidden">
                <header className="z-20 h-16 flex items-center justify-between px-8 bg-black/40 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition lg:hidden"><Menu size={20} /></button>
                        <h2 className="text-md font-semibold text-gray-300">Advanced Research Drafter</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-white">{user.username}</p>
                            <p className="text-[10px] text-purple-500 font-medium">Academic Mode</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
                            {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Config Panel */}
                    <div className="w-full lg:w-[360px] border-r border-white/5 bg-[#0f0f0f] overflow-y-auto p-6 scrollbar-hide">
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 animate-pulse"><Sparkles size={16} /></div>
                                <h3 className="text-sm font-bold tracking-tight">CRAFT CONFIGURATION</h3>
                            </div>

                            <form onSubmit={handleGenerate} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Research Topic</label>
                                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Enter the core research subject..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500/50 focus:bg-purple-500/5 outline-none transition" required />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Template</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {TEMPLATES.map(t => (
                                            <button key={t.id} type="button" onClick={() => setTemplate(t.id)}
                                                className={`py-3 px-2 rounded-xl text-[10px] font-bold border transition-all leading-tight ${template === t.id ? (t.brand === 'IEEE' ? 'bg-blue-700 border-blue-500 text-white' : 'bg-red-700 border-red-500 text-white') : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'}`}>
                                                <div className="text-[8px] opacity-60 font-black tracking-widest">{t.brand}</div>
                                                {t.id.replace(`${t.brand} `, '')}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Additional Instructions</label>
                                    <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="e.g. Focus on experimental results..." rows="3" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500/50 outline-none transition resize-none" />
                                </div>

                                <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl text-sm font-black tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-purple-900/30 disabled:opacity-50 transition-all hover:scale-[1.02]">
                                    {loading ? <><Loader2 className="animate-spin" size={18} /> GENERATING...</> : <><Sparkles size={18} /> SYNTHESIZE DRAFT</>}
                                </button>
                            </form>

                            {/* Action buttons after generation */}
                            {generatedDraft && (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <button onClick={handleRefineContributions} disabled={refiningContributions} className="w-full flex items-center gap-2 py-3 px-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 text-xs font-bold transition-all disabled:opacity-40">
                                        {refiningContributions ? <Loader2 size={14} className="animate-spin" /> : '⚡ Refine Contributions'}
                                    </button>
                                    <button onClick={() => setShowCompare(true)} className="w-full flex items-center gap-2 py-3 px-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 text-xs font-bold transition-all">
                                        🔍 Compare with Existing Work
                                    </button>
                                    <button onClick={() => setShowCitations(true)} disabled={refs.length === 0} className="w-full flex items-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all disabled:opacity-40">
                                        ✔ Validate Citations {refs.length > 0 ? `(${refs.length})` : '(none found)'}
                                    </button>
                                    <button onClick={handleDownloadPDF} className="w-full flex items-center gap-2 py-3 px-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 text-xs font-bold transition-all">
                                        <Printer size={14} /> PDF Export
                                    </button>
                                    <div className="flex items-center justify-between px-2 pt-2">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Improve Options</span>
                                        <button onClick={() => setShowImproveOptions(!showImproveOptions)} className={`w-10 h-5 rounded-full transition-colors relative ${showImproveOptions ? 'bg-purple-600' : 'bg-gray-700'}`}>
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${showImproveOptions ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl">
                                <div className="flex gap-2 items-center mb-2">
                                    <CheckCircle2 className="text-purple-500" size={14} />
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">Engine: Ready</span>
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed">Powered by Gemini 2.5 Flash · <span className="text-purple-400">Hover any section to improve it</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Paper Preview */}
                    <div className="flex-1 bg-[#121212] overflow-y-auto p-4 md:p-12 scrollbar-hide">
                        <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Document Workbench</h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <p className="text-[10px] text-gray-400">{template} · 1:1 Preview</p>
                                    {loading && generatedDraft && (
                                        <div className="flex items-center gap-1">
                                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce" />
                                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
                                            <div className="w-1 h-1 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.4s]" />
                                            <span className="text-[8px] text-purple-400 font-bold uppercase tracking-widest">Streaming</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {generatedDraft && (
                                <div className="text-[10px] text-gray-500 italic">✏️ Hover over any section to improve it</div>
                            )}
                        </div>

                        {!generatedDraft && !loading && (
                            <div className="max-w-[8.5in] aspect-[8.5/11] mx-auto bg-white/5 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-center p-12 hover:border-white/20 transition-colors">
                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                    <FileType size={32} className="opacity-20" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-400 mb-2">No Active Manuscript</h4>
                                <p className="text-sm text-gray-500 max-w-sm">Configure your research scope and click Synthesize Draft.</p>
                            </div>
                        )}

                        {loading && !generatedDraft && (
                            <div className="max-w-[8.5in] aspect-[8.5/11] mx-auto bg-white/5 border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                                <div className="relative mb-8">
                                    <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                                    <div className="w-24 h-24 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin relative z-10" />
                                </div>
                                <h4 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent mb-3">SYNTHESIZING MANUSCRIPT</h4>
                                <p className="text-sm text-gray-500 max-w-xs">Architecting the {template} structure...</p>
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
            {showCompare && <CompareModal onClose={() => setShowCompare(false)} topic={topic} onInsert={(content) => {
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
            {showCitations && <CitationModal onClose={() => setShowCitations(false)} references={refs} onFixRefs={(fixes) => {
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

const SidebarItem = ({ icon, text, active, onClick }) => (
    <div onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-300 group ${active ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-900/40' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className={`text-xs tracking-wide ${active ? 'font-black' : 'font-bold'}`}>{text.toUpperCase()}</span>
    </div>
);

export default PaperDrafter;
