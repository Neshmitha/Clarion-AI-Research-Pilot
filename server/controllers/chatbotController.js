const chatbotService = require('../services/chatbotService');

/**
 * Endpoint to ask a question to the chatbot.
 */
exports.askQuestion = async (req, res) => {
    try {
        const { userId, query, domain, paperId } = req.body;

        if (!userId || !query || !domain) {
            return res.status(400).json({ message: "userId, query, and domain are required." });
        }

        // 1. Fetch context (optionally focused on a specific paperId)
        const { context, sources } = await chatbotService.getRelevantContext(userId, domain, query, paperId);

        // 2. If no PDFs found in that domain, return specific message as per requirements
        if (!context) {
            return res.json({
                answer: "No relevant PDFs found in this domain.",
                domain: domain,
                sources: []
            });
        }

        // 3. Generate response using Gemini
        const answer = await chatbotService.generateResponse(query, context, domain);

        res.json({
            answer,
            domain,
            sources
        });


    } catch (err) {
        console.error("Chatbot Controller Error:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
