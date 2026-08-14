// OpenRouter-based AI service for CareLink
// Uses DeepSeek Chat model exclusively via the OpenRouter API

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Healthcare system prompt that shapes the AI's behavior
const HEALTHCARE_SYSTEM_PROMPT = `You are CareLink AI, a professional and empathetic healthcare assistant integrated into the CareLink healthcare platform. Your role is to provide helpful, accurate, and caring health-related guidance.

CORE RESPONSIBILITIES:
1. Answer general healthcare and wellness questions
2. Provide information about common medicines, their uses, and side effects
3. Help users understand symptoms and suggest when to see a doctor
4. Offer mental wellness support and stress management tips
5. Explain medical prescriptions and reports in simple language
6. Provide healthy diet and lifestyle recommendations
7. Help users navigate the CareLink platform features
8. Share preventive care tips and health maintenance advice
9. Provide emergency guidance when critical symptoms are mentioned

PLATFORM NAVIGATION HELP:
- Dashboard: Overview of health metrics and quick actions
- Medical Vault: Store and manage medical records securely
- Medications: Track and manage medication schedules
- Scan Pill: Identify pills using camera/image upload
- Family Access: Manage family member access to health records
- Admin Panel: Administrative controls (admin users only)

CRITICAL SAFETY RULES:
1. NEVER provide a final medical diagnosis
2. NEVER prescribe medications
3. NEVER replace professional medical advice
4. ALWAYS recommend consulting a healthcare professional for specific medical concerns
5. For ANY critical symptoms (chest pain, breathing difficulty, suicidal thoughts, severe bleeding, stroke symptoms, allergic reactions), immediately recommend calling emergency services
6. Be empathetic and supportive, especially with mental health topics

RESPONSE FORMATTING:
- Keep your response SHORT — maximum 2 short paragraphs. Never write more than 2 paragraphs.
- Use clear, simple language that's easy to understand
- Use markdown formatting for better readability
- Use bullet points only when listing 3+ items
- Bold important information
- Include relevant emojis sparingly for a friendly tone
- Be concise and direct. Do not over-explain.

DISCLAIMER: Always remember that your responses are informational only. Every response should reflect this understanding without necessarily repeating the disclaimer in every message, but always maintain this boundary.`;

// Keywords that indicate a medical emergency
const EMERGENCY_KEYWORDS = [
    'chest pain', 'heart attack',
    'can\'t breathe', 'cannot breathe', 'breathing difficulty', 'difficulty breathing', 'shortness of breath',
    'suicidal', 'suicide', 'want to die', 'kill myself', 'end my life', 'self harm', 'self-harm',
    'severe bleeding', 'heavy bleeding', 'bleeding profusely', 'won\'t stop bleeding',
    'stroke', 'face drooping', 'arm weakness', 'speech difficulty',
    'unconscious', 'not breathing', 'stopped breathing',
    'anaphylaxis', 'severe allergic reaction', 'throat swelling',
    'overdose', 'poisoning',
    'seizure', 'convulsion'
];

/**
 * Detects if a message contains emergency-related keywords
 * @param {string} message - The user's message
 * @returns {{ isEmergency: boolean, detectedKeywords: string[] }}
 */
function detectEmergency(message) {
    const lowerMessage = message.toLowerCase();
    const detectedKeywords = EMERGENCY_KEYWORDS.filter(keyword =>
        lowerMessage.includes(keyword)
    );

    return {
        isEmergency: detectedKeywords.length > 0,
        detectedKeywords
    };
}

/**
 * Generates a chat response using DeepSeek via OpenRouter
 * Uses deepseek/deepseek-chat exclusively
 * On failure: returns the actual error message to the frontend for debugging (temporary debug mode)
 */
async function generateChatResponse(messageHistory = [], userMessage, userName = 'there') {
    console.log('[DEBUG] generateChatResponse() started');
    console.log('[DEBUG] Incoming user message:', userMessage);

    const modelName = 'deepseek/deepseek-chat';
    console.log('[DEBUG] Selected model:', modelName);

    // Validate environment configuration
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        const configErrorMsg = 'DEBUG ERROR: OPENROUTER_API_KEY environment variable is missing';
        console.error(`[DEBUG] Configuration Error: ${configErrorMsg}`);
        return {
            response: configErrorMsg,
            isEmergency: false,
            detectedKeywords: []
        };
    }

    // Check for emergency keywords
    const emergencyCheck = detectEmergency(userMessage);

    // Build OpenRouter-compatible message array
    const messages = [
        { role: 'system', content: HEALTHCARE_SYSTEM_PROMPT }
    ];

    // Add conversation history
    for (const msg of messageHistory) {
        messages.push({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.content
        });
    }

    // If emergency detected, prepend emergency context to the message
    let messageToSend = userMessage;
    if (emergencyCheck.isEmergency) {
        messageToSend = `[EMERGENCY CONTEXT: The user may be experiencing a critical medical situation involving: ${emergencyCheck.detectedKeywords.join(', ')}. Prioritize their safety, strongly urge them to call emergency services immediately, and provide any immediate safety guidance.]\n\nUser message: ${userMessage}`;
    }

    // Enforce 2 paragraph limit strictly in prompt reminder
    messageToSend += "\n\n(Note: Please keep your response very short and concise. Do not write more than 2 paragraphs.)";

    messages.push({ role: 'user', content: messageToSend });

    try {
        console.log('[DEBUG] Sending request to OpenRouter...');
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelName,
                messages: messages,
                max_tokens: 120,
                temperature: 0.6
            })
        });

        console.log('[DEBUG] OpenRouter response status:', response.status);

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[DEBUG] OpenRouter response error body:', errorBody);
            throw new Error(`OpenRouter API error ${response.status}: ${errorBody}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error('[DEBUG] OpenRouter error structure:', data.error);
            throw new Error(`OpenRouter error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        const responseText = data.choices?.[0]?.message?.content || 'I could not generate a response. Please try again.';
        console.log('[DEBUG] Generated response length:', responseText.length);

        return {
            response: responseText,
            isEmergency: emergencyCheck.isEmergency,
            detectedKeywords: emergencyCheck.detectedKeywords
        };
    } catch (error) {
        console.error('[DEBUG] Catch block error:', error);
        if (error.stack) {
            console.error('[DEBUG] Stack trace:', error.stack);
        }

        // Return actual error message for temporary debug mode
        return {
            response: `DEBUG ERROR: ${error.message}`,
            isEmergency: emergencyCheck.isEmergency,
            detectedKeywords: emergencyCheck.detectedKeywords
        };
    }
}

module.exports = {
    generateChatResponse,
    detectEmergency
};
