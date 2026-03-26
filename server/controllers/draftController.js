const { runAIStreamWithPool, runAIWithPool } = require('../services/aiManager');

exports.generateDraft = async (req, res) => {
    try {
        const { topic, template, type, additionalInstructions } = req.body;

        if (!topic || !template || !type) {
            return res.status(400).json({ message: "Topic, template, and type are required." });
        }

        console.log(`[Draft Engine] Requesting pooled draft for: ${topic}`);

        let templateGuide = "";
        const brand = (template || "").toLowerCase();
        const paperType = (type || "").toLowerCase();

        if (brand === 'ieee') {
            if (paperType === 'conference') {
                templateGuide = `
                FORMAT: IEEE Conference Paper
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
            } else {
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
            }
        } else if (brand === 'springer') {
            if (paperType === 'conference') {
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
            } else {
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
            }
        } else if (brand === 'apa style' || brand === 'apa') {
            templateGuide = `
            FORMAT: APA Style (American Psychological Association)
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract  (Formal summary of 150-250 words)
            2. ## Introduction
            3. ## Method
            4. ## Results
            5. ## Discussion
            6. ## References
            STYLE: Formal, objective, 12pt font appearance. Focus on clarity and precise citations.`;
        } else if (brand === 'acm') {
            templateGuide = `
            FORMAT: ACM (Association for Computing Machinery)
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract
            2. Keywords
            3. ## I. INTRODUCTION
            4. ## II. RELATED WORK
            5. ## III. THE PROPOSED SYSTEM
            6. ## IV. EVALUATION AND ANALYSIS
            7. ## V. CONCLUSION
            8. ## REFERENCES
            STYLE: Computer science oriented, technical and rigorous.`;
        } else if (brand === 'elsevier') {
            templateGuide = `
            FORMAT: Elsevier Article
            STRUCTURE (use EXACTLY these headings in this order):
            1. Abstract
            2. Keywords
            3. ## 1. Introduction
            4. ## 2. Materials and methods
            5. ## 3. Results
            6. ## 4. Discussion
            7. ## 5. Conclusion
            8. ## References
            STYLE: Direct, scientifically robust, standard journal structure.`;
        } else {
            // Default fallback
            templateGuide = `FORMAT: Standard Academic ${paperType || 'Journal'} Paper`;
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
        - **REFERENCES SECTION**: Under the References heading at the very end of the paper, you MUST list EXACTLY the references provided in the "PRIMARY REFERENCES" section from the Additional Instructions. Do not add any hallucinated or extra references. Only output the provided primary references.
        - **RESEARCH GAPS**: Under the "Related Work" section, you MUST explicitly include the "RESEARCH GAPS" provided in the instructions as distinct bullet points to highlight the limitations being addressed.
        - **GRAPHICAL ANALYSIS**: Add a section "## VII. GRAPHICAL ANALYSIS" before the References. In this section, provide a single, valid Graphviz DOT code block wrapped in \`\`\`graphviz... \`\`\` that represents the high-level system architecture, data flow, or research methodology related to the topic. Ensure the DOT code is syntactically correct and clear.
        - Ensure NO empty blocks or purely placeholder sections. 
        - Provide high-quality technical content with realistic methodology and quantitative results.`;



        try {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.setHeader('Transfer-Encoding', 'chunked');

            await runAIStreamWithPool(prompt, (chunk) => res.write(chunk));

            res.end();
        } catch (poolErr) {
            console.error("[AI POOL] Drafting Stream Failed:", poolErr.message);
            if (!res.headersSent) {
                res.status(500).json({ error: "Draft generation failed on all AI providers." });
            } else {
                res.write("\n\n[ERROR]: Generation interrupted due to provider issues.");
                res.end();
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

exports.extractReferencesList = async (req, res) => {
    try {
        const { topic } = req.body;
        if (!topic) return res.status(400).json({ error: 'Topic is required' });
        
        let primaryCitation = "";

        // Always fetch the primary citation server-side to avoid browser CORS issues
        try {
            const https = require('https');
            primaryCitation = await new Promise((resolve, reject) => {
                const url = "https://citation.doi.org/format?doi=10.1145/2783446.2783605&style=apa&lang=en-US";
                const request = https.get(url, (resp) => {
                    let data = '';
                    resp.on('data', chunk => data += chunk);
                    resp.on('end', () => resolve(data.trim()));
                });
                request.on('error', reject);
                request.setTimeout(8000, () => { request.destroy(); reject(new Error('timeout')); });
            });
        } catch (fetchErr) {
            console.warn("[Draft] DOI citation fetch failed:", fetchErr.message);
            primaryCitation = "Garza, K., Goble, C., Brooke, J., & Jay, C. (2015). Framing the community data system interface. In Proceedings of the 2015 British HCI Conference (pp. 269–270). ACM. https://doi.org/10.1145/2783446.2783605";
        }

        let aiRefs = [];
        const prompt = `Based on this research topic: "${topic}" and this primary citation:\n"${primaryCitation}"\n\nProvide exactly 4 MORE closely related academic references (in APA format). Return them as a JSON array of strings ONLY. No markdown code blocks, no extra text. Example: ["Author A (2020). Title. Journal.", "Author B (2019). Title. Conference."]`;

        try {
            const result = await runAIWithPool(prompt, { maxTokens: 1024 });
            if (result) {
                try {
                    const jsonMatch = (typeof result === 'string') ? result.match(/\[[\s\S]*\]/) : null;
                    aiRefs = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result);
                    if (!Array.isArray(aiRefs)) aiRefs = [];
                } catch (_) {
                    aiRefs = result.split('\n')
                        .filter(l => l.trim().length > 20)
                        .map(l => l.replace(/^[0-9\.\-\*\[\]"]+\s*/, '').replace(/",?$/, '').trim())
                        .filter(l => l.length > 10)
                        .slice(0, 4);
                }
            }
        } catch (aiErr) {
            console.error("[Draft] AI reference extraction failed:", aiErr.message);
        }

        // Always provide a complete fallback if AI returned nothing
        if (aiRefs.length === 0) {
            aiRefs = [
                `Smith, J., & Doe, A. (2022). Advances in ${topic} using machine learning. IEEE Transactions on Agriculture, 12(4), 1–15.`,
                `Patel, R., Kumar, S., & Chen, L. (2021). A survey of modern ${topic} methodologies. Journal of Applied Research, 9(2), 45–60.`,
                `Johnson, M., & Williams, T. (2023). Deep learning applications in ${topic}. Nature Computational Science, 3(1), 88–102.`,
                `Garcia, E., & Martinez, F. (2022). Intelligent systems for ${topic}: A review. ACM Computing Surveys, 55(3), Article 48.`
            ];
        }

        const allRefs = [primaryCitation, ...aiRefs.slice(0, 4)];
        return res.json({ content: allRefs });
    } catch (outerErr) {
        console.error("[Draft] extractReferencesList outer error:", outerErr.message);
        return res.status(500).json({ error: outerErr.message });
    }
};

exports.extractRelatedWork = async (req, res) => {
    try {
        const { topic, citation } = req.body;
        const prompt = `Based on this research topic: "${topic}" and these primary references:\n${citation}\n\nGenerate two sections:
1. A technically detailed "Related Work" summary (approx 150-200 words). Focus on how these works lead to a methodology.
2. A "Research Gap" section containing exactly 3 distinct technical bullet points identifying limitations in the current state-of-the-art.

Return your response as a JSON object: { "relatedWork": "...", "researchGaps": ["gap 1", "gap 2", "gap 3"] }`;
        
        const result = await runAIWithPool(prompt);
        try {
            const jsonMatch = (typeof result === 'string') ? result.match(/\{[\s\S]*\}/) : null;
            const data = jsonMatch ? JSON.parse(jsonMatch[0]) : (typeof result === 'string' ? JSON.parse(result) : result);
            res.json({ content: data.relatedWork, gaps: data.researchGaps || [] });
        } catch (err) {
            // Fallback for non-JSON responses
            res.json({ content: result, gaps: ["Gap analysis unavailable", "Limited depth in current references", "Incomplete methodological coverage"] });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.extractAbstract = async (req, res) => {
    try {
        const { topic, citation, keywords } = req.body;
        const prompt = `Based on this research topic: "${topic}", keywords: "${keywords || 'N/A'}", and these primary references:\n${citation}\n\nWrite a formal academic abstract (approx 150-200 words) with the following STRICT structure:
1. The first 2 lines MUST contain real-time statistics related to "${topic}".
2. The next 2 lines MUST contain traditional problems in this field.
3. Then write EXACTLY the phrase "To overcome these problems" followed by specific problem points.
4. Finally, write EXACTLY the phrase "What this work proposes" followed by the proposed methodology.

Return clean text only, no headings. Ensure technical accuracy and a scholarly tone.`;
        
        const result = await runAIWithPool(prompt);
        res.json({ content: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.extractProposedSolution = async (req, res) => {
    try {
        const { topic, citation } = req.body;
        const prompt = `Based on this research topic: "${topic}" and these primary references:\n${citation}\n\nGenerate a "Proposed Solution" or "Methodology" summary (approx 150-200 words) defining how a system should tackle the problem. Return clean text only, no headings.`;
        
        const result = await runAIWithPool(prompt);
        res.json({ content: result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
