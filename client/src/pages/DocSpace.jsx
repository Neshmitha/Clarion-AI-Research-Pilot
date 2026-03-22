import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import {
    FileText, Plus, Trash2, Save, Download, Star, ExternalLink,
    Lock, MessageSquare, Cloud, CloudOff, Command, Share2, MoreVertical,
    Copy, Printer, Search, Link as LinkIcon, Image as ImageIcon,
    Type, Bold, Italic, Underline, Strikethrough, AlignLeft,
    List, Keyboard, LayoutGrid, Info
} from 'lucide-react';
import UploadModal from '../components/UploadModal';
import ReactQuill, { Quill } from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

// Register custom fonts
const Font = Quill.import('attributors/style/font');
const customFonts = ['Arial', 'Comic Sans MS', 'Courier New', 'Georgia', 'Helvetica', 'Impact', 'Times New Roman', 'Trebuchet MS', 'Verdana'];
Font.whitelist = customFonts;
Quill.register(Font, true);

// Register custom sizes
const Size = Quill.import('attributors/style/size');
const customSizes = ['8pt', '9pt', '10pt', '11pt', '12pt', '14pt', '18pt', '24pt', '30pt', '36pt', '48pt', '60pt', '72pt'];
Size.whitelist = customSizes;
Quill.register(Size, true);

// Dynamic CSS generation for labels
const fontCss = customFonts.map(f => `
    .ql-picker.ql-font .ql-picker-label[data-value="${f}"]::before,
    .ql-picker.ql-font .ql-picker-item[data-value="${f}"]::before { content: '${f}' !important; font-family: '${f}', sans-serif; }
`).join('\n');

const sizeCss = customSizes.map(s => `
    .ql-picker.ql-size .ql-picker-label[data-value="${s}"]::before,
    .ql-picker.ql-size .ql-picker-item[data-value="${s}"]::before { content: '${s.replace('pt', '')}' !important; }
`).join('\n');
import API_BASE_URL from '../config';
import AppSidebar from '../components/AppSidebar';

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DOCSPACE COMPONENT — Google Docs-style Editor
// ═══════════════════════════════════════════════════════════════════════════════
const DocSpace = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user')) || { username: 'Researcher', email: 'user@example.com' };
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const paperRef = useRef();

    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    const isDark = theme === 'dark';
    const [autosuggest, setAutosuggest] = useState({ active: false, x: 0, y: 0, query: '', trigger: '' });

    useEffect(() => {
        const handleThemeChange = (e) => setTheme(e.detail);
        window.addEventListener('themeChange', handleThemeChange);
        return () => window.removeEventListener('themeChange', handleThemeChange);
    }, []);

    const location = useLocation();
    const [documents, setDocuments] = useState([]);
    const [activeDocId, setActiveDocId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [editorContent, setEditorContent] = useState('');
    const [activeDocTitle, setActiveDocTitle] = useState('');
    const [activeTemplate, setActiveTemplate] = useState('IEEE Journal');
    const [saveStatus, setSaveStatus] = useState('saved');

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/papers/${user.id || user._id}`);
            const writtenDocs = res.data.filter(p => p.source === 'written');
            setDocuments(writtenDocs);

            if (location.state?.paperId) {
                const targetDoc = writtenDocs.find(d => d._id === location.state.paperId);
                if (targetDoc && activeDocId !== targetDoc._id) handleSelectDoc(targetDoc);
            } else if (writtenDocs.length > 0 && !activeDocId) {
                handleSelectDoc(writtenDocs[0]);
            } else if (writtenDocs.length === 0) {
                handleCreateNewDoc();
            }
        } catch (err) { console.error('Failed to fetch documents', err); }
    };

    useEffect(() => { fetchDocuments(); }, [location.state?.paperId]);

    const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); };
    const handleUploadSuccess = () => { navigate('/workspace'); };

    const quillRef = useRef(null);
    const [activeMenu, setActiveMenu] = useState(null);

    const executeQuillAction = (action, value = true) => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            if (action === 'undo') editor.history.undo();
            else if (action === 'redo') editor.history.redo();
            else if (action === 'clear') {
                const sel = editor.getSelection();
                if (sel) editor.removeFormat(sel.index, sel.length);
            } else {
                editor.format(action, value);
            }
        }
    };

    const handleCreateNewDoc = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/papers/write`, {
                userId: user.id || user._id,
                title: 'Untitled Document',
                domain: 'Other',
                content: '',
                template: 'IEEE Journal'
            });
            setDocuments([res.data.paper, ...documents]);
            handleSelectDoc(res.data.paper);
        } catch (err) { console.error(err); }
    };

    const handleSelectDoc = (doc) => {
        setActiveDocId(doc._id);
        setEditorContent(doc.content || '');
        setActiveDocTitle(doc.title || 'Untitled Document');
        setActiveTemplate(doc.template || 'IEEE Journal');
        setSaveStatus('saved');
    };

    const handleSaveDoc = async () => {
        if (!activeDocId) return;
        setSaveStatus('saving');
        try {
            const res = await axios.post(`${API_BASE_URL}/papers/write`, {
                userId: user.id || user._id,
                paperId: activeDocId,
                title: activeDocTitle,
                domain: 'Other',
                content: editorContent,
                template: activeTemplate
            });
            const updatedDocs = documents.map(doc => doc._id === activeDocId ? res.data.paper : doc);
            setDocuments(updatedDocs);
            setSaveStatus('saved');
        } catch (err) { console.error('Failed to save', err); setSaveStatus('unsaved'); }
    };

    const handleManualSave = async () => {
        await handleSaveDoc();
        window.alert('Document successfully saved to your Workspace!');
    };

    const handleDeleteDoc = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await axios.delete(`${API_BASE_URL}/papers/${id}`);
                const updatedDocs = documents.filter(doc => doc._id !== id);
                setDocuments(updatedDocs);
                if (activeDocId === id) {
                    if (updatedDocs.length > 0) handleSelectDoc(updatedDocs[0]);
                    else handleCreateNewDoc();
                }
            } catch (err) { console.error('Failed to delete', err); }
        }
    };

    const handleDownloadPDF = () => {
        if (!quillRef.current) return;
        
        const htmlContent = quillRef.current.getEditor().root.innerHTML;
        
        // Extract all styles to preserve Quill classes and our custom font styles in the PDF
        let styleTags = '';
        document.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => {
            styleTags += el.outerHTML;
        });
        
        // Build an isolated, scroll-free document string 
        const finalHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                ${styleTags}
                <style>
                    /* Override the editor canvas styles to act just like paper without shadows */
                    html, body { background: white !important; margin: 0; padding: 0; }
                    .docspace-editor .ql-container.ql-snow { border: none !important; box-shadow: none !important; min-height: auto !important; width: 100%; max-width: none; }
                    .docspace-editor .ql-editor { min-height: auto !important; padding: 0 !important; color: black !important; }
                </style>
            </head>
            <body>
                <div class="docspace-editor ql-snow">
                    <div class="ql-container ql-snow">
                        <div class="ql-editor">
                            ${htmlContent}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        html2pdf()
            .set({
                margin: 0.75, // 0.75 inch margin
                filename: `${activeDocTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
                image: { type: 'jpeg', quality: 1 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            })
            .from(finalHtml)
            .save();
    };

    const handlePrint = () => {
        if (!quillRef.current) return;
        const htmlContent = quillRef.current.getEditor().root.innerHTML;
        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html>
                <head>
                    <title>${activeDocTitle}</title>
                    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
                    <style>
                        body { padding: 0.5in; font-family: Arial, sans-serif; font-size: 11pt; color: #000; background: #fff; }
                        .ql-editor { padding: 0 !important; }
                        @media print {
                            body { margin: 0; padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <div class="ql-editor">${htmlContent}</div>
                </body>
            </html>
        `);
        printWin.document.close();
        printWin.focus();
        setTimeout(() => {
            printWin.print();
            printWin.close();
        }, 500);
    };

    const handleDownloadTXT = () => {
        if(!quillRef.current) return;
        const text = quillRef.current.getEditor().getText();
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDocTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadHTML = () => {
        if(!quillRef.current) return;
        const html = quillRef.current.getEditor().root.innerHTML;
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${activeDocTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDuplicateDoc = async () => {
        try {
            const res = await axios.post(`${API_BASE_URL}/papers/write`, {
                userId: user.id || user._id,
                title: `Copy of ${activeDocTitle}`,
                domain: activeDoc?.domain || 'Other',
                content: editorContent,
                template: activeTemplate
            });
            setDocuments([res.data.paper, ...documents]);
            handleSelectDoc(res.data.paper);
        } catch(err) { console.error(err); }
    };

    const SUGGESTIONS = {
        '/': [
            { label: 'Heading 1', desc: 'Large section heading', action: (editor, index) => { editor.formatLine(index, 1, 'header', 1); } },
            { label: 'Heading 2', desc: 'Medium section heading', action: (editor, index) => { editor.formatLine(index, 1, 'header', 2); } },
            { label: 'Bulleted List', desc: 'Create a simple bulleted list', action: (editor, index) => { editor.formatLine(index, 1, 'list', 'bullet'); } },
            { label: 'Numbered List', desc: 'Create a numbered list', action: (editor, index) => { editor.formatLine(index, 1, 'list', 'ordered'); } },
            { label: 'Quote', desc: 'Insert a blockquote', action: (editor, index) => { editor.formatLine(index, 1, 'blockquote', true); } },
            { label: 'Date', desc: 'Insert today\'s date', action: (editor, index) => { editor.insertText(index, new Date().toLocaleDateString()); } },
            { label: 'Divider', desc: 'Insert a horizontal line', action: (editor, index) => { editor.insertText(index, '\n---\n'); } }
        ],
        '@': [
            { label: 'Abstract Template', desc: 'Standard abstract layout', action: (editor, index) => { editor.insertText(index, '\nAbstract: \n\nMethodology: \n\nResults: \n\nConclusion: \n'); } },
            { label: 'Citation Placeholder', desc: '[Authors, Year]', action: (editor, index) => { editor.insertText(index, '[Author, Year]'); } },
            { label: 'Math Formula Block', desc: 'Insert a standard formula marker', action: (editor, index) => { editor.insertText(index, '\nE = mc²\n'); } }
        ]
    };

    const handleSelectSuggestion = (sg) => {
        if (!quillRef.current) return;
        const editor = quillRef.current.getEditor();
        const sel = editor.getSelection();
        if (sel) {
            const deleteLen = 1 + autosuggest.query.length; // trigger length + query length
            editor.deleteText(sel.index - deleteLen, deleteLen);
            sg.action(editor, sel.index - deleteLen);
            setAutosuggest({ active: false, x: 0, y: 0, query: '', trigger: '' });
        }
    };

    const handleEditorChange = (content, delta, source, editor) => {
        setEditorContent(content);
        setSaveStatus('unsaved');
        
        if (source === 'user') {
            const sel = editor.getSelection();
            if (sel && sel.index > 0) {
                const textBefore = editor.getText(0, sel.index);
                const words = textBefore.split(/[\s\n]+/);
                const lastWord = words[words.length - 1];
                
                if (lastWord.startsWith('@') || lastWord.startsWith('/')) {
                    const trigger = lastWord[0];
                    const query = lastWord.substring(1).toLowerCase();
                    const bounds = editor.getBounds(sel.index);
                    setAutosuggest({ active: true, x: bounds.left, y: bounds.top, query, trigger });
                } else {
                    setAutosuggest({ active: false, x: 0, y: 0, query: '', trigger: '' });
                }
            } else {
                setAutosuggest({ active: false, x: 0, y: 0, query: '', trigger: '' });
            }
        }
    };

    useEffect(() => {
        if (activeDocId && saveStatus === 'unsaved') {
            const t = setTimeout(() => handleSaveDoc(), 2000);
            return () => clearTimeout(t);
        }
    }, [editorContent, activeDocTitle]);

    const activeDoc = documents.find(d => d._id === activeDocId);

    const MENUS = {
        File: [
            { label: 'New', icon: <Plus size={14} />, action: handleCreateNewDoc },
            { label: 'Make a copy', icon: <Copy size={14} />, action: handleDuplicateDoc },
            { divider: true },
            { 
                label: 'Download', 
                icon: <Download size={14} />, 
                submenu: [
                    { label: 'PDF Document (.pdf)', action: handleDownloadPDF },
                    { label: 'Plain Text (.txt)', action: handleDownloadTXT },
                    { label: 'Web Page (.html)', action: handleDownloadHTML }
                ] 
            },
            { divider: true },
            { label: 'Rename', action: () => document.getElementById('doc-title-input')?.focus() },
            { label: 'Move to trash', icon: <Trash2 size={14} className="text-red-500"/>, action: (e) => handleDeleteDoc(e, activeDocId) },
            { divider: true },
            { label: 'Print', icon: <Printer size={14} />, shortcut: '⌘P', action: handlePrint }
        ],
        Edit: [
            { label: 'Undo', shortcut: '⌘Z', action: () => executeQuillAction('undo') },
            { label: 'Redo', shortcut: '⌘Y', action: () => executeQuillAction('redo') },
            { divider: true },
            { label: 'Cut', shortcut: '⌘X', action: () => document.execCommand('cut') },
            { label: 'Copy', shortcut: '⌘C', action: () => document.execCommand('copy') },
            { label: 'Paste', shortcut: '⌘V', action: () => document.execCommand('paste') },
            { divider: true },
            { label: 'Select all', shortcut: '⌘A', action: () => { const e = quillRef.current?.getEditor(); e && e.setSelection(0, e.getLength()); } }
        ],
        View: [
            { label: 'Toggle Sidebar', action: () => setIsSidebarOpen(!isSidebarOpen) },
            { label: 'Full screen', action: () => document.documentElement.requestFullscreen() }
        ],
        Insert: [
            { label: 'Image', icon: <ImageIcon size={14}/>, action: () => { const url = window.prompt('Enter Image URL:'); if (url && quillRef.current) { const e = quillRef.current.getEditor(); e.insertEmbed(e.getSelection()?.index || 0, 'image', url); } } },
            { label: 'Link', icon: <LinkIcon size={14}/>, action: () => { const url = window.prompt('Enter Link URL:'); if (url && quillRef.current) quillRef.current.getEditor().format('link', url); } },
            { divider: true },
            { label: 'Horizontal line', action: () => { if (quillRef.current) quillRef.current.getEditor().insertText(quillRef.current.getEditor().getSelection()?.index || 0, '\n---\n'); } }
        ],
        Format: [
            { label: 'Bold', shortcut: '⌘B', icon: <Bold size={14}/>, action: () => executeQuillAction('bold') },
            { label: 'Italic', shortcut: '⌘I', icon: <Italic size={14}/>, action: () => executeQuillAction('italic') },
            { label: 'Underline', shortcut: '⌘U', icon: <Underline size={14}/>, action: () => executeQuillAction('underline') },
            { label: 'Strikethrough', shortcut: '⌘⇧X', icon: <Strikethrough size={14}/>, action: () => executeQuillAction('strike') },
            { divider: true },
            { label: 'Align Left', icon: <AlignLeft size={14}/>, action: () => executeQuillAction('align', '') },
            { label: 'Align Center', action: () => executeQuillAction('align', 'center') },
            { label: 'Align Right', action: () => executeQuillAction('align', 'right') },
            { label: 'Justify', action: () => executeQuillAction('align', 'justify') },
            { divider: true },
            { label: 'Clear formatting', shortcut: '⌘\\', action: () => executeQuillAction('clear') }
        ],
        Tools: [
            { label: 'Word count', shortcut: '⌘⇧C', action: () => { if (quillRef.current) { const txt = quillRef.current.getEditor().getText(); window.alert(`Words: ${txt.trim().split(/\s+/).filter(x=>x).length}\nCharacters: ${txt.trim().length}`); } } }
        ],
        Extensions: [
            { label: 'Explore Add-ons', action: () => window.alert('Extensions marketplace coming soon') }
        ],
        Help: [
            { label: 'Keyboard shortcuts', action: () => window.alert('⌘B: Bold\n⌘I: Italic\n⌘U: Underline\n⌘Z: Undo\n⌘Y: Redo') }
        ]
    };

    useEffect(() => {
        const handleOutsideClick = () => setActiveMenu(null);
        window.addEventListener('click', handleOutsideClick);
        return () => window.removeEventListener('click', handleOutsideClick);
    }, []);

    const quillModules = {
        toolbar: [
            [{ 'font': [false, ...customFonts] }, { 'size': [false, ...customSizes] }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'align': [] }],
            ['link', 'image', 'video', 'formula'],
            ['clean']
        ],
    };

    const quillFormats = [
        'font', 'size',
        'header', 'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script', 'list', 'bullet', 'indent', 'direction', 'align',
        'link', 'image', 'video', 'formula'
    ];

    return (
        <div className={`flex h-screen font-sans overflow-hidden ${isDark ? 'bg-[#0a0a0a] text-white' : 'bg-[#f8fafc] text-black'}`}>
            {/* Editor Styles */}
            <style>{`
                .docspace-editor .ql-toolbar.ql-snow {
                    border: none !important;
                    background: ${isDark ? '#3c4043' : '#edf2fa'} !important;
                    border-radius: 24px;
                    margin: 8px 16px;
                    padding: 6px 16px;
                    display: flex;
                    justify-content: flex-start;
                    align-items: center;
                    flex-wrap: wrap;
                    box-sizing: border-box;
                    box-sizing: border-box;
                    z-index: 10;
                    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); /* very subtle */
                }
                
                /* Custom Font & Size Styles */
                .ql-picker.ql-font { width: 130px !important; }
                .ql-picker.ql-size { width: 70px !important; }
                .ql-picker.ql-font .ql-picker-label:not([data-value])::before,
                .ql-picker.ql-font .ql-picker-item:not([data-value])::before { content: 'Inter' !important; font-family: 'Inter', sans-serif; } 
                .ql-picker.ql-size .ql-picker-label:not([data-value])::before,
                .ql-picker.ql-size .ql-picker-item:not([data-value])::before { content: '11' !important; }
                ${fontCss}
                ${sizeCss}

                .docspace-editor .ql-toolbar.ql-snow button,
                .docspace-editor .ql-toolbar.ql-snow .ql-picker {
                    color: ${isDark ? '#ffffff' : '#1a1a1a'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-stroke {
                    stroke: ${isDark ? '#ffffff' : '#1a1a1a'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-fill {
                    fill: ${isDark ? '#ffffff' : '#1a1a1a'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow button:hover,
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-label:hover {
                    color: ${isDark ? '#a78bfa' : '#0284c7'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow button:hover .ql-stroke,
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-label:hover .ql-stroke {
                    stroke: ${isDark ? '#a78bfa' : '#0284c7'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-options {
                    background: #ffffff !important;
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 8px !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important;
                    color: #1a1a1a !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item {
                    color: #1a1a1a !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-options .ql-picker-item:hover {
                    color: #0284c7 !important;
                    background: #e0f2fe !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-label {
                    color: ${isDark ? '#ffffff' : '#1a1a1a'} !important;
                }
                .docspace-editor .ql-toolbar.ql-snow .ql-picker-label .ql-stroke {
                    stroke: ${isDark ? '#ffffff' : '#1a1a1a'} !important;
                }
                .docspace-editor .ql-container.ql-snow {
                    border: none !important;
                    font-family: 'Inter', sans-serif;
                    width: 100%;
                    max-width: 850px;
                    margin: 0 auto;
                    background: white !important;
                    min-height: calc(100vh - 200px) !important;
                    box-shadow: ${isDark ? '0 10px 30px rgba(0,0,0,0.2)' : '0 10px 30px rgba(0,0,0,0.1)'} !important;
                    box-sizing: border-box;
                    color: #1a1a1a !important;
                    border-radius: 0 0 4px 4px;
                }
                .docspace-editor .ql-editor {
                    min-height: calc(100vh - 200px);
                    padding: 1in !important;
                    line-height: 1.5;
                    color: #000 !important;
                    width: 100%;
                    box-sizing: border-box;
                }
                .docspace-editor .ql-editor * {
                    color: inherit !important;
                }
                .docspace-editor .ql-editor.ql-blank::before {
                    color: #94a3b8 !important;
                    font-style: normal;
                    left: 1in;
                }
                
                /* Template Specific Support */
                .docspace-editor.template-IEEE .ql-editor, .docspace-editor.template-ACM .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                    column-count: 2;
                    column-gap: 0.3in;
                    column-fill: balance;
                    text-align: justify;
                }
                .docspace-editor.template-Springer .ql-editor {
                    font-family: 'Arial', sans-serif !important;
                }
                .docspace-editor.template-APA .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                    line-height: 2.0;
                    font-size: 11pt;
                }
                .docspace-editor.template-Elsevier .ql-editor {
                    font-family: 'Times New Roman', Times, serif !important;
                }
                
                /* Force Column Span for multi-column templates */
                .docspace-editor.template-IEEE .ql-editor h1.paper-title,
                .docspace-editor.template-IEEE .ql-editor .authors-block,
                .docspace-editor.template-IEEE .ql-editor .abstract-section,
                .docspace-editor.template-IEEE .ql-editor .keywords-section,
                .docspace-editor.template-IEEE .ql-editor .contributions-block,
                .docspace-editor.template-IEEE .ql-editor hr,
                .docspace-editor.template-ACM .ql-editor h1.paper-title,
                .docspace-editor.template-ACM .ql-editor .authors-block,
                .docspace-editor.template-ACM .ql-editor .abstract-section,
                .docspace-editor.template-ACM .ql-editor .keywords-section,
                .docspace-editor.template-ACM .ql-editor .contributions-block,
                .docspace-editor.template-ACM .ql-editor hr {
                    column-span: all !important;
                    width: 100%;
                    display: block;
                }
                
                .docspace-editor blockquote {
                    border-left: 4px solid #7c3aed;
                    padding-left: 1rem;
                    margin-left: 0;
                    font-style: italic;
                    color: #4b5563;
                }
                .docspace-editor .ql-editor h1 { font-size: 24pt; font-weight: normal; margin-bottom: 2rem; color: #000 !important; text-align: center; }
                .docspace-editor .ql-editor h2 { font-size: 11pt; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.8rem; color: #000 !important; text-align: center; text-transform: uppercase; }
                .docspace-editor .ql-editor p { margin-bottom: 0.5rem; }
            `}</style>

            <AppSidebar isOpen={isSidebarOpen} activePage="docspace" isDark={isDark} onClose={() => setIsSidebarOpen(false)} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col relative overflow-hidden ${isDark ? 'bg-[#1f1f1f]' : 'bg-[#fdfbfc]'}`}>
                
                {/* Google Docs-style Header */}
                <div className={`z-20 flex flex-col border-b transition-all ${isDark ? 'bg-[#1f1f1f] border-gray-800 text-white' : 'bg-[#fdfbfc] border-gray-200 text-black'}`}>
                    <div className="flex items-center justify-between px-4 py-2">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 flex items-center justify-center cursor-pointer hover:opacity-90">
                                <FileText size={28} className={isDark ? 'text-white' : 'text-gray-900'} />
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 px-1">
                                    <input
                                        id="doc-title-input"
                                        type="text"
                                        value={activeDocTitle}
                                        onChange={(e) => { setActiveDocTitle(e.target.value); setSaveStatus('unsaved'); }}
                                        className={`text-[18px] font-normal bg-transparent border border-transparent outline-none focus:ring-0 px-2 py-0.5 rounded transition-all ${isDark ? 'text-gray-100 hover:border-gray-700 focus:border-blue-500' : 'text-gray-900 hover:border-gray-300 focus:border-blue-500'}`}
                                        style={{ width: `${Math.max((activeDocTitle?.length || 10) * 10, 150)}px` }}
                                        placeholder="Untitled Document"
                                    />
                                </div>
                                {/* Menu Bar */}
                                <div className="flex items-center text-[14px] ml-1 mt-0.5 hidden md:flex" style={{ color: isDark ? '#b0b0b0' : '#444746' }}>
                                    {Object.keys(MENUS).map(menuName => (
                                        <div key={menuName} className="relative">
                                            <div 
                                                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === menuName ? null : menuName); }}
                                                className={`px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === menuName ? (isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-black') : (isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100')}`}
                                            >
                                                {menuName}
                                            </div>
                                            {activeMenu === menuName && (
                                                <div className={`absolute top-full left-0 mt-1 w-64 rounded shadow-xl py-2 z-50 border ${isDark ? 'bg-[#2b2b2b] border-[#444]' : 'bg-white border-gray-200'}`}>
                                                    {MENUS[menuName].map((item, i) => item.divider ? (
                                                        <div key={i} className={`my-1 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                                                    ) : (
                                                        <div key={i} 
                                                            className={`relative group flex items-center justify-between px-4 py-1.5 cursor-pointer text-[13px] ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                if(item.action && !item.submenu) { item.action(); setActiveMenu(null); } 
                                                            }}
                                                        >
                                                           <div className="flex items-center gap-3">
                                                               {item.icon && <span className="opacity-70 w-4">{item.icon}</span>}
                                                               <span>{item.label}</span>
                                                           </div>
                                                           {item.shortcut && <span className="text-[11px] opacity-50 tracking-wider">{item.shortcut}</span>}
                                                           {item.submenu && <span className="text-[11px] opacity-70">►</span>}
                                                           
                                                           {item.submenu && (
                                                               <div className={`absolute top-0 left-full ml-0 w-48 rounded shadow-xl py-2 hidden group-hover:block border z-50 ${isDark ? 'bg-[#2b2b2b] border-[#444]' : 'bg-white border-gray-200'}`}>
                                                                   {item.submenu.map((subItem, j) => (
                                                                       <div key={j} onClick={(e) => { e.stopPropagation(); subItem.action(); setActiveMenu(null); }} className={`flex items-center justify-between px-4 py-1.5 cursor-pointer text-[13px] ${isDark ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-800'}`}>
                                                                           <span>{subItem.label}</span>
                                                                       </div>
                                                                   ))}
                                                               </div>
                                                           )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Top Right Save Button */}
                        <div className="flex items-center gap-4 hidden sm:flex pr-4">
                            <button 
                                onClick={handleManualSave}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold disabled:cursor-not-allowed transition-all duration-300 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]' : 'bg-white text-black border border-transparent hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}
                            >
                                <Save size={16} /> Save to Workspace
                            </button>
                        </div>
                        
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Simplified Recent Papers Sidebar (Only icons on small, full on large) */}
                    <div className={`w-16 lg:w-64 border-r overflow-y-auto hidden md:block transition-all ${isDark ? 'bg-[#1a1a1c] border-gray-800' : 'bg-[#ffffff] border-gray-200'}`}>
                        <div className="p-3">
                            <button
                                onClick={handleCreateNewDoc}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 mb-4 ${isDark ? 'bg-black text-white border border-[#38bdf8] shadow-[0_0_12px_rgba(56,189,248,0.25)] hover:shadow-[0_0_22px_rgba(56,189,248,0.55)]' : 'bg-white text-black border border-transparent hover:-translate-y-1 shadow-sm hover:shadow-[0_0_20px_rgba(56,189,248,0.5)]'}`}
                            >
                                <Plus size={18} /> <span className="hidden lg:inline">New Blank</span>
                            </button>
                            
                            <div className="relative mb-3 hidden lg:block">
                                <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                                <input
                                    type="text"
                                    placeholder="Search docs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-lg outline-none transition-all border ${isDark ? 'bg-[#2b2b2b] border-[#444] text-gray-200 hover:border-[#38bdf8]/50 focus:border-[#38bdf8] focus:ring-2 focus:ring-[#38bdf8]/20' : 'bg-white border-gray-200 text-gray-900 hover:border-[#38bdf8]/60 focus:border-[#38bdf8] focus:ring-4 focus:ring-[#38bdf8]/20 focus:bg-white'}`}
                                />
                            </div>
                            
                            {documents.filter(doc => (doc.title || 'Untitled').toLowerCase().includes(searchQuery.toLowerCase())).map(doc => (
                                <div
                                    key={doc._id}
                                    onClick={() => handleSelectDoc(doc)}
                                    className={`p-2 py-2.5 rounded-lg transition-all cursor-pointer group flex items-center gap-3 mb-1.5 ${activeDocId === doc._id ? (isDark ? 'bg-white/10 text-white border border-[#38bdf8]/40 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white text-gray-900 border border-transparent shadow-[0_0_15px_rgba(56,189,248,0.4)]') : (isDark ? 'hover:bg-white/5 text-gray-400 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-black')}`}
                                >
                                    <FileText size={18} className={`flex-shrink-0 ${activeDocId === doc._id ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-500' : 'text-gray-500')}`} />
                                    <div className="flex-1 truncate hidden lg:block">
                                        <p className="text-sm font-medium truncate">{doc.title || 'Untitled'}</p>
                                    </div>
                                    {activeDocId === doc._id && (
                                        <button onClick={(e) => handleDeleteDoc(e, doc._id)} className="p-1 hover:text-red-500 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hidden lg:block">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor Container (The physical Grey canvas + White page) */}
                    <div className={`flex-1 flex flex-col overflow-y-auto relative ${isDark ? 'bg-[#121212]' : 'bg-[#f8f9fa]'}`} ref={paperRef}>
                        {activeDoc ? (
                            <div className="w-full flex-1 flex justify-center py-6 px-2 md:px-6 z-0" onClick={() => setAutosuggest({active: false, x:0, y:0, query:'', trigger:''})}>
                                <div className={`w-full max-w-[816px] xl:max-w-[900px] docspace-editor relative flex flex-col shadow-xl ring-1 ${isDark ? 'ring-white/10 shadow-black/40' : 'ring-black/5 shadow-gray-300'}`}>
                                    
                                    {autosuggest.active && SUGGESTIONS[autosuggest.trigger] && (
                                        <div 
                                            className={`absolute z-50 w-64 rounded-xl shadow-2xl border ${isDark ? 'bg-[#2d2d2d] border-gray-700 text-white' : 'bg-white border-gray-200 text-black'} overflow-hidden flex flex-col transition-all`}
                                            style={{ top: autosuggest.y + 80, left: autosuggest.x + 90 }}
                                        >
                                            <div className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${isDark ? 'bg-[#222]' : 'bg-gray-100'}`}>
                                                {autosuggest.trigger === '/' ? 'Slash Commands' : 'Templates & Blocks'}
                                            </div>
                                            {SUGGESTIONS[autosuggest.trigger]
                                                .filter(sg => sg.label.toLowerCase().includes(autosuggest.query) || sg.desc.toLowerCase().includes(autosuggest.query))
                                                .length > 0 ? (
                                                SUGGESTIONS[autosuggest.trigger]
                                                    .filter(sg => sg.label.toLowerCase().includes(autosuggest.query) || sg.desc.toLowerCase().includes(autosuggest.query))
                                                    .map((sg, i) => (
                                                    <div 
                                                        key={i} 
                                                        onClick={(e) => { e.stopPropagation(); handleSelectSuggestion(sg); }}
                                                        className={`px-4 py-2 cursor-pointer flex flex-col gap-0.5 transition-colors ${isDark ? 'hover:bg-blue-600/40' : 'hover:bg-blue-50'}`}
                                                    >
                                                        <span className="text-sm font-medium">{sg.label}</span>
                                                        <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{sg.desc}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-3 text-xs text-center opacity-50">No suggestions match "{autosuggest.query}"</div>
                                            )}
                                        </div>
                                    )}

                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={editorContent}
                                        onChange={handleEditorChange}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        placeholder="Type '/' for commands or '@' for templates..."
                                    />
                                </div>
                            </div>
                        ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                                    <FileText size={64} className="mb-4 opacity-20" />
                                    <p className="text-lg font-medium tracking-wide">Select a document to begin</p>
                                </div>
                            )}
                        </div>
                    </div>
            </main>

            <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
        </div>
    );
};


export default DocSpace;
