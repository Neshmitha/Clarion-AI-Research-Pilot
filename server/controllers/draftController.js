const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

const OpenAI = require("openai");
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});



exports.generateDraft = async (req, res) => {
    try {
        const { topic, template, type, additionalInstructions } = req.body;

        if (!topic || !template || !type) {
            return res.status(400).json({ message: "Topic, template, and type are required." });
        }

        console.log(`Generating Gemini draft for: ${topic} using template: ${template}`);

        let templateGuide = "";
        const templateKey = template || 'IEEE Journal';

        if (templateKey === 'IEEE Journal') {
            templateGuide = `
            FORMAT: IEEE Journal Paper
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract  (Write the abstract text immediately after the word "Abstract" on the same line, e.g. "Abstract: The paper explores...")
            2. Index Terms (3-6 technical keywords, comma-separated on one line after "Index Terms:")
            3. ## I. INTRODUCTION
            4. ## II. RELATED WORK
            5. ## III. PROPOSED METHODOLOGY
            6. ## IV. EXPERIMENTAL RESULTS
            7. ## V. DISCUSSION
            8. ## VI. CONCLUSION
            9. ## REFERENCES  (use [1] Author, Title, Journal... format)
            STYLE: Times New Roman, 10pt. Formal academic English. Single-spaced.`;
        } else if (templateKey === 'IEEE Conference') {
            templateGuide = `
            FORMAT: IEEE Conference Paper (max 6–8 pages equivalent)
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract  (Write abstract text immediately after "Abstract:" on the same line)
            2. Index Terms (3-5 keywords on one line after "Index Terms:")
            3. ## I. INTRODUCTION
            4. ## II. RELATED WORK
            5. ## III. METHODOLOGY
            6. ## IV. RESULTS AND EVALUATION
            7. ## V. CONCLUSION
            8. ## REFERENCES  (use [1] Author, Title, Proc. Conference... format)
            STYLE: Concise, highlighting technical novelty. Times New Roman 10pt.`;
        } else if (templateKey === 'Springer Journal') {
            templateGuide = `
            FORMAT: Springer Nature Journal Article
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract  (Write abstract text immediately after "Abstract:" on the same line)
            2. Keywords  (3-6 keywords on one line after "Keywords:")
            3. ## 1 Introduction
            4. ## 2 Background and Related Work
            5. ## 3 Materials and Methods
            6. ## 4 Results
            7. ## 5 Discussion
            8. ## 6 Conclusion
            9. ## References  (use numbered 1. Author, "Title", Journal, Year format)
            STYLE: Springer standard. Single column, comprehensive background and analysis.`;
        } else if (templateKey === 'Springer Conference') {
            templateGuide = `
            FORMAT: Springer Nature Conference Paper (CCIS/LNCS style)
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract  (Write abstract text immediately after "Abstract:" on the same line)
            2. Keywords  (3-5 keywords on one line after "Keywords:")
            3. ## 1 Introduction
            4. ## 2 Related Work
            5. ## 3 Proposed Approach
            6. ## 4 Experimental Evaluation
            7. ## 5 Conclusion
            8. ## References  (use numbered 1. Author, "Title", In: Proc. Conference, Year format)
            STYLE: Springer LNCS style. Two-column body. Concise and focused on results.`;
        }

        const prompt = `Write a full, technically sound research paper draft.
        Topic: "${topic}"
        Additional Instructions: ${additionalInstructions || "Follow standard academic guidelines."}
        
        ${templateGuide}

        STRICT RULES:
        - Output in clean Markdown only. Do not add extra empty lines between blocks unless necessary.
        - Start IMMEDIATELY with the paper title on the very first line (no preamble).
        - Use EXACTLY the section headings shown above, in that order.
        - Write "Abstract: [text]" as a single line.
        - Write "Keywords: [term1, term2, ...]" or "Index Terms: [term1, term2]" as a single line.
        - After the Abstract and Keywords/Index Terms line, add a "## Contributions of This Work:" section with 3-5 technical bullet points. Format:
            ## Contributions of This Work:
            - We propose [detailed technical contribution]
            - We design [architectural or system-level contribution]
            - We evaluate [evaluation strategy with specific metrics]
        - **STRICTLY EXCLUSIVE**: Use ONLY numerical citation markers (e.g., [1], [2]). NEVER use alphabetic markers like [A], [B] or [Author, Year].
        - Ensure NO empty blocks or purely placeholder sections. 
        - Provide high-quality technical content with realistic methodology and quantitative results.`;



        try {
            const result = await model.generateContentStream(prompt);

            // Set headers for streaming
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');

            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                if (chunkText) {
                    res.write(chunkText);
                }
            }
            res.end();
        } catch (geminiErr) {
            console.error("Gemini Error, falling back to Groq:", geminiErr.message);

            if (process.env.GROQ_API_KEY) {
                const stream = await groq.chat.completions.create({
                    messages: [{ role: "user", content: prompt }],
                    model: "llama-3.3-70b-versatile",
                    stream: true,
                });

                res.setHeader('Content-Type', 'text/plain; charset=utf-8');
                res.setHeader('Transfer-Encoding', 'chunked');

                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || "";
                    if (content) res.write(content);
                }
                res.end();
            } else {
                throw geminiErr; // Re-throw if no Groq key
            }
        }

    } catch (err) {
        console.error("Generation Failed:", err.message);
        // If headers haven't been sent, we can send a proper JSON error
        if (!res.headersSent) {
            res.status(500).json({
                error: "Generation Failed",
                details: err.message,
                suggestion: "Check your GEMINI_API_KEY and network connection."
            });
        } else {
            // If headers are already SENT, we just end the stream to avoid hanging
            res.end();
        }
    }
};
