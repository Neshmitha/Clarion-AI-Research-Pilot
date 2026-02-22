const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const Paper = require('../models/Paper');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const OpenAI = require("openai");
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});


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
            papers = await Paper.find({ userId, domain });
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
                const absolutePath = path.join(__dirname, '..', paper.filePath);
                if (fs.existsSync(absolutePath)) {
                    try {
                        const text = await extractTextFromPDF(absolutePath);
                        paperContent += `\n[PDF RAW TEXT EXCERPT]:\n${text.substring(0, 3000)}\n`;
                        sourceFound = true;
                    } catch (e) {
                        console.error(`Error reading PDF ${absolutePath}:`, e);
                    }
                }
            }

            // 2. Add written content if available
            if (paper.content) {
                paperContent += `\n[USER WRITTEN CONTENT]:\n${paper.content}\n`;
                sourceFound = true;
            }

            // 3. Add abstract if available (fallback)
            if (paper.abstract && !paper.llamaMetadata) {
                paperContent += `\n[ABSTRACT FALLBACK]:\n${paper.abstract}\n`;
                sourceFound = true;
            }

            if (sourceFound) {
                // Check for relevance
                const keywords = query.toLowerCase().split(' ').filter(k => k.length > 3);
                const containsKeyword = keywords.length === 0 || keywords.some(k => paperContent.toLowerCase().includes(k));

                if (containsKeyword) {
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

    const prompt = `You are ResearchPilot AI, an expert research assistant. 
Use the provided excerpts from research papers in the "${domain}" domain to answer the user's question.

Research Context:
${context}

User Question: ${query}

Instructions:
1. Provide a detailed, accurate answer based ONLY on the provided context.
2. If the context doesn't contain the answer, say so.
3. Keep the tone professional and academic.
4. Format with markdown (headers, lists, bold text).`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (geminiError) {
        console.error("Gemini Generation Error, falling back to Groq:", geminiError.message);

        if (process.env.GROQ_API_KEY) {
            try {
                const completion = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                });
                return completion.choices[0].message.content;
            } catch (groqError) {
                console.error("Groq Generation Error:", groqError.message);
                return "I encountered errors with all available AI services. Please try again later.";
            }
        }

        return "I encountered an error while generating the response (Gemini quota likely exceeded). Please check your configuration.";
    }
}

module.exports = {
    getRelevantContext,
    generateResponse
};
