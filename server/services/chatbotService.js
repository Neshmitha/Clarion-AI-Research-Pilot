const { runAIWithPool } = require('./aiManager');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Paper = require('../models/Paper');

/**
 * Classifies a user query into a research domain.
 */
async function classifyQuery(query) {
    const prompt = `Classify the following research query into one of these domains: 
    Agriculture, Climate, Medtech, Artificial Intelligence, Machine Learning, Computer Vision, 
    Natural Language Processing, Cybersecurity, Quantum Physics, Astrophysics, Nanotechnology, 
    Biotechnology, Medical Sciences, Neuroscience, Mathematics, Statistics, Economics, 
    Environmental Science, Other.
    
    Query: "${query}"
    
    Return ONLY the domain name.`;

    try {
        const response = await runAIWithPool(prompt, { maxTokens: 50 });
        return response.trim();
    } catch (error) {
        console.error("Chatbot Classification Error:", error.message);
        return "Other";
    }
}


/**
 * Extracts text from a PDF file.
 */
async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
}

/**
 * Searches for relevant context in papers under a specific domain.
 * If paperId is provided, it ONLY looks at that specific paper.
 */
async function getRelevantContext(userId, domain, query, paperId) {
    try {
        let papers = [];
        if (paperId) {
            const paper = await Paper.findById(paperId);
            if (paper) papers = [paper];
        } else {
            // Find papers in database for this domain
            const queryObj = { userId };
            if (domain !== 'ALL DOMAINS') {
                queryObj.domain = domain;
            }
            papers = await Paper.find(queryObj);
        }

        if (papers.length === 0) return { context: null, sources: [] };

        let combinedContext = "";
        let sources = [];

        for (const paper of papers) {
            let paperContent = "";
            let sourceFound = false;

            // 0. Priority: Use LlamaIndex extracted metadata if available
            if (paper.llamaMetadata) {
                const meta = paper.llamaMetadata;
                paperContent += `\n[EXTRACTED RESEARCH DATA]:\n`;
                if (meta.title) paperContent += `Title: ${meta.title}\n`;
                if (meta.abstract) paperContent += `Abstract: ${meta.abstract}\n`;

                if (meta.methodology) {
                    paperContent += `Methodology: ${JSON.stringify(meta.methodology, null, 2)}\n`;
                }

                if (meta.findings) {
                    paperContent += `Key Findings: ${JSON.stringify(meta.findings, null, 2)}\n`;
                }

                if (meta.keywords) {
                    paperContent += `Keywords: ${meta.keywords.join(', ')}\n`;
                }
                sourceFound = true;
            }

            // 1. Fallback/Supplement: Try local PDF file (only if meta is small or not enough)
            if (paper.filePath && (!paper.llamaMetadata || paperContent.length < 2000)) {
                // NORMALIZE PATH: Replace Windows backslashes with forward slashes for Mac/Linux
                const normalizedPath = paper.filePath.replace(/\\/g, '/');
                const absolutePath = path.join(__dirname, '..', normalizedPath);

                if (fs.existsSync(absolutePath)) {
                    try {
                        const text = await extractTextFromPDF(absolutePath);
                        paperContent += `\n[PDF RAW TEXT EXCERPT]:\n${text.substring(0, 3000)}\n`;
                        sourceFound = true;
                    } catch (e) {
                        console.error(`Error reading PDF ${absolutePath}:`, e);
                    }
                } else {
                    console.error(`File not found at: ${absolutePath}`);
                }
            }

            // 2. Add written content if available
            if (paper.content) {
                const strippedContent = paper.content.replace(/<[^>]*>?/gm, ' ');
                paperContent += `\n[USER WRITTEN CONTENT]:\n${strippedContent.substring(0, 8000)}\n`;
                sourceFound = true;
            }

            // 3. Add abstract if available (fallback)
            if (paper.abstract && !paper.llamaMetadata) {
                paperContent += `\n[ABSTRACT FALLBACK]:\n${paper.abstract}\n`;
                sourceFound = true;
            }

            if (sourceFound) {
                // If a specific paper is selected, bypass keyword check
                let isRelevant = !!paperId;

                if (!isRelevant) {
                    const keywords = query.toLowerCase().split(' ').filter(k => k.length > 3);
                    isRelevant = keywords.length === 0 || keywords.some(k => paperContent.toLowerCase().includes(k));
                }

                if (isRelevant) {
                    combinedContext += `\n--- SOURCE: ${paper.title} ---\n${paperContent}\n`;
                    sources.push(paper.originalName || paper.title);
                }
            }
        }

        return {
            context: combinedContext.trim() || null,
            sources: [...new Set(sources)] // Unique sources
        };
    } catch (error) {
        console.error("Context Retrieval Error:", error);
        return { context: null, sources: [] };
    }
}


/**
 * Generates an answer using Gemini and provided context.
 */
async function generateResponse(query, context, domain) {
    if (!context) {
        return `I couldn't find any relevant PDFs in the **${domain}** domain to answer your question.`;
    }

    const domainContext = domain === 'ALL DOMAINS' ? 'all research papers' : `the "${domain}" domain`;
    const prompt = `You are Clarion AI, an expert research assistant. 
Use the provided excerpts from research papers ${domainContext} to answer the user's question.

Research Context:
${context}

User Question: ${query}

Instructions:
1. Provide a detailed, accurate answer based ONLY on the provided context.
2. If the context doesn't contain the answer, say so.
3. Keep the tone professional and academic.
4. Format with markdown (headers, lists, bold text).`;

    try {
        return await runAIWithPool(prompt);
    } catch (error) {
        console.error("Chatbot Generation Error:", error.message);
        return "I encountered errors with all available AI services. Please try again later.";
    }
}

module.exports = {
    getRelevantContext,
    generateResponse,
    classifyQuery
};
