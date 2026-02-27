const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const geminiKeys = (process.env.GEMINI_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);
const groqKeys = (process.env.GROQ_API_KEY || '').split(',').map(k => k.trim()).filter(Boolean);

let geminiPointer = 0;
let groqPointer = 0;

const getGenAIInstance = () => {
    if (!geminiKeys.length) return null;
    const key = geminiKeys[geminiPointer];
    geminiPointer = (geminiPointer + 1) % geminiKeys.length;
    return new GoogleGenerativeAI(key);
};

const getGroqInstance = () => {
    if (!groqKeys.length) return null;
    const key = groqKeys[groqPointer];
    groqPointer = (groqPointer + 1) % groqKeys.length;
    return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
};

/**
 * Robust AI Interface with Key Rotation & Fallback
 */
const runAIWithPool = async (prompt, options = {}) => {
    const {
        geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'], // Prioritize fastest models
        groqModel = 'llama-3.3-70b-versatile',
        jsonMode = false,
        maxTokens = 2048,
        temperature = 0.8
    } = options;

    let lastError = null;

    // Phase 1: Try Gemini Pool
    for (let k = 0; k < geminiKeys.length; k++) {
        const genAI = getGenAIInstance();
        if (!genAI) break;

        const currentKeyIndex = geminiPointer === 0 ? geminiKeys.length - 1 : geminiPointer - 1;

        for (const modelName of geminiModels) {
            try {
                console.log(`[AI POOL] Running Gemini (${modelName}) | Key #${currentKeyIndex + 1}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: { maxOutputTokens: maxTokens, temperature }
                });
                const text = result.response.text();
                if (text) return text;
            } catch (e) {
                lastError = e;
                const status = e.status || (e.message.includes('429') ? 429 : 500);
                console.warn(`[AI POOL] Gemini (${modelName}) failed [${status}]:`, e.message);

                if (status === 429) {
                    console.log(`[AI POOL] Key #${currentKeyIndex + 1} rate limited. Skipping models and moving to next key.`);
                    break; // EXIT model loop for this key, go to next key
                }
            }
        }
    }

    // Phase 2: Try Groq Pool
    console.warn('[AI POOL] Gemini pool exhausted or limited. Switching to Groq...');
    for (let g = 0; g < groqKeys.length; g++) {
        const groq = getGroqInstance();
        if (!groq) break;

        const currentGroqIndex = groqPointer === 0 ? groqKeys.length - 1 : groqPointer - 1;

        try {
            console.log(`[AI POOL] Running Groq (${groqModel}) | Key #${currentGroqIndex + 1}`);
            const chatParams = {
                messages: [{ role: 'user', content: prompt + (jsonMode ? ' Return ONLY the JSON object.' : '') }],
                model: groqModel,
                temperature
            };
            if (jsonMode) chatParams.response_format = { type: "json_object" };

            const chat = await groq.chat.completions.create(chatParams);
            const text = chat.choices[0]?.message?.content;
            if (text) return text;
        } catch (e) {
            lastError = e;
            console.error(`[AI POOL] Groq failure [${e.status || 'ERR'}]:`, e.message);
            if (e.message.includes('429')) break; // Next groq key
        }
    }

    throw new Error(`AI Pool Connection Failed: ${lastError?.message || 'Services Unavailable'}`);
};

/**
 * Robust AI Interface with Key Rotation & Fallback (Streaming Support)
 */
const runAIStreamWithPool = async (prompt, onChunk, options = {}) => {
    const {
        geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash'],
        groqModel = 'llama-3.3-70b-versatile',
    } = options;

    let lastError = null;

    // Phase 1: Try Gemini Pool
    for (let k = 0; k < geminiKeys.length; k++) {
        const genAI = getGenAIInstance();
        if (!genAI) break;

        const currentKeyIndex = geminiPointer === 0 ? geminiKeys.length - 1 : geminiPointer - 1;

        for (const modelName of geminiModels) {
            try {
                console.log(`[AI POOL] Streaming Gemini (${modelName}) | Key #${currentKeyIndex + 1}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContentStream({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });

                for await (const chunk of result.stream) {
                    const text = chunk.text();
                    if (text) onChunk(text);
                }
                return; // Success
            } catch (e) {
                lastError = e;
                const status = e.status || (e.message.includes('429') ? 429 : 500);
                console.warn(`[AI POOL] Stream Gemini (${modelName}) failed [${status}]:`, e.message);

                if (status === 429) {
                    console.log(`[AI POOL] Key #${currentKeyIndex + 1} rate limited. Skipping models and moving to next key.`);
                    break;
                }
            }
        }
    }

    // Phase 2: Try Groq Pool
    console.warn('[AI POOL] Gemini Stream pool exhausted. Switching to Groq...');
    for (let g = 0; g < groqKeys.length; g++) {
        const groq = getGroqInstance();
        if (!groq) break;

        const currentGroqIndex = groqPointer === 0 ? groqKeys.length - 1 : groqPointer - 1;

        try {
            console.log(`[AI POOL] Streaming Groq (${groqModel}) | Key #${currentGroqIndex + 1}`);
            const stream = await groq.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: groqModel,
                stream: true,
            });

            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content || '';
                if (content) onChunk(content);
            }
            return; // Success
        } catch (e) {
            lastError = e;
            console.error(`[AI POOL] Groq Stream failure [${e.status || 'ERR'}]:`, e.message);
            if (e.message.includes('429')) break;
        }
    }

    throw new Error(`AI Pool Stream Failed: ${lastError?.message || 'Services Unavailable'}`);
};

module.exports = {
    runAIWithPool,
    runAIStreamWithPool,
    getGenAIInstance,
    getGroqInstance
};
