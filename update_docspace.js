const fs = require('fs');
const path = require('path');
const file = './client/src/pages/DocSpace.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add axios import
if (!content.includes('import axios from \'axios\';')) {
    content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate, useLocation } from 'react-router-dom';\nimport axios from 'axios';");
}

// Replace the hook variables and useEffects
content = content.replace(/const \[documents, setDocuments\] = useState\(\[\]\);.*?useEffect\(\(\) => \{[\s\S]*?saveToLocalStorage\(updatedDocs\);\s*\};/m, `const location = useLocation();
    const [documents, setDocuments] = useState([]);
    const [activeDocId, setActiveDocId] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [activeDocTitle, setActiveDocTitle] = useState('');

    const fetchDocuments = async () => {
        try {
            const res = await axios.get(\`http://localhost:5001/api/papers/\${user.id || user._id}\`);
            const writtenDocs = res.data.filter(p => p.source === 'written');
            setDocuments(writtenDocs);
            
            // Auto open if navigated from workspace with paperId
            if (location.state?.paperId) {
                const targetDoc = writtenDocs.find(d => d._id === location.state.paperId);
                if (targetDoc && activeDocId !== targetDoc._id) {
                    handleSelectDoc(targetDoc);
                }
            } else if (writtenDocs.length > 0 && !activeDocId) {
                handleSelectDoc(writtenDocs[0]);
            } else if (writtenDocs.length === 0) {
                handleCreateNewDoc();
            }
        } catch (err) {
            console.error('Failed to fetch documents', err);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, [location.state?.paperId]);

    const handleCreateNewDoc = async () => {
        try {
            const res = await axios.post('http://localhost:5001/api/papers/write', {
                userId: user.id || user._id,
                title: 'Untitled Document',
                domain: 'Other',
                content: ''
            });
            setDocuments([res.data.paper, ...documents]);
            handleSelectDoc(res.data.paper);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelectDoc = (doc) => {
        setActiveDocId(doc._id);
        setEditorContent(doc.content || '');
        setActiveDocTitle(doc.title || 'Untitled Document');
    };

    const handleSaveDoc = async () => {
        if (!activeDocId) return;
        try {
            const res = await axios.post('http://localhost:5001/api/papers/write', {
                userId: user.id || user._id,
                paperId: activeDocId,
                title: activeDocTitle,
                domain: 'Other',
                content: editorContent
            });
            const updatedDocs = documents.map(doc => doc._id === activeDocId ? res.data.paper : doc);
            setDocuments(updatedDocs);
        } catch (err) {
            console.error('Failed to save document', err);
        }
    };

    const handleDeleteDoc = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this document?')) {
            try {
                await axios.delete(\`http://localhost:5001/api/papers/\${id}\`);
                const updatedDocs = documents.filter(doc => doc._id !== id);
                setDocuments(updatedDocs);
                if (activeDocId === id) {
                    if (updatedDocs.length > 0) handleSelectDoc(updatedDocs[0]);
                    else handleCreateNewDoc();
                }
            } catch (err) {
                console.error('Failed to delete', err);
            }
        }
    };`);

// Update references doc.id to doc._id
content = content.replace(/doc\.id/g, 'doc._id');

fs.writeFileSync(file, content, 'utf8');
