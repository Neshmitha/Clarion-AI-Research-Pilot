const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/auth');
const paperRoutes = require('./routes/papers');
const arxivRoutes = require('./routes/arxivRoutes');
const documentRoutes = require('./routes/documents');
const chatbotRoutes = require('./routes/chatbotRoutes');
const draftRoutes = require('./routes/draftRoutes');
const compareRoutes = require('./routes/compareRoutes');
const citationRoutes = require('./routes/citationRoutes');
const improveRoutes = require('./routes/improveRoutes');
const llamaRoutes = require('./routes/llamaRoutes');
const path = require('path');


const app = express();
const PORT = process.env.PORT || 5000; // Restart trigger


// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/user_workspace', express.static(path.join(__dirname, 'user_workspace')));

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/arxiv', arxivRoutes);
app.use('/api/docs', documentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/draft', draftRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/citations', citationRoutes);
app.use('/api/improve', improveRoutes);
app.use('/api/llama', llamaRoutes);



app.get('/', (req, res) => {
    res.send('Research Pilot API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
