const express = require("express");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();
const GEMINI_MODEL = "gemini-3.8-flash";

const getGeminiClient = () => {
    if (!process.env.GEMINI_API_KEY) return null;
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const PROFILE_FIELDS = [
    "applicantType",
    "businessType",
    "businessStatus",
    "state",
    "district",
    "turnover",
    "loanAmount",
    "womanEntrepreneur",
    "scSt",
    "rural",
    "disability",
];

let matcherPromise;

const getMatcher = () => {
    if (!matcherPromise) {
        const matcherPath = path.resolve(__dirname, "../../src/utils/schemeMatcher.js");
        const matcherSource = fs
            .readFileSync(matcherPath, "utf8")
            .replace("export function matchSchemes", "function matchSchemes");
        const moduleSource = `${matcherSource}\nexport { matchSchemes };`;
        const moduleUrl = `data:text/javascript;base64,${Buffer.from(moduleSource).toString("base64")}`;
        matcherPromise = import(moduleUrl).then((module) => module.matchSchemes);
    }

    return matcherPromise;
};

const parseJson = (content) => {
    const cleaned = String(content || "")
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
    return JSON.parse(cleaned);
};

const isGeminiQuotaError = (error) =>
    error?.status === 429
    || error?.statusText === "RESOURCE_EXHAUSTED"
    || error?.error?.status === "RESOURCE_EXHAUSTED";

const generateGeminiContent = async (client, request) => {
    console.log("Setu Saathi: Gemini request started");
    try {
        const response = await client.models.generateContent({
            model: GEMINI_MODEL,
            ...request,
        });
        console.log("Setu Saathi: Gemini response received");
        return response.text || "";
    } catch (error) {
        console.error("Setu Saathi Gemini error:", error);
        throw error;
    }
};

const toIndianAmount = (value, unit) => {
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    const multiplier = /crore/i.test(unit) ? 10000000 : 100000;
    return Math.round(amount * multiplier);
};

const extractAmount = (message, fieldName) => {
    const amountPattern = fieldName === "turnover"
        ? /(?:turnover)[^\d₹]*(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|crore|crores|rupees)?/i
        : /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|crore|crores)\b/i;
    const match = message.match(amountPattern);
    if (!match) return null;

    if (!match[2] || /rupees/i.test(match[2])) return Number(match[1]);
    return toIndianAmount(match[1], match[2]);
};

const extractDeterministicProfile = (message, conversation = []) => {
    const lowerMessage = message.toLowerCase();
    const extracted = {};

    // Collect previous user messages so short replies such as
    // "Hyderabad", "5 lakh", "woman", and "new" retain context.
    const previousUserMessages = conversation
        .filter((entry) => entry?.role === "user" && typeof entry.content === "string")
        .map((entry) => entry.content)
        .join(" ");

    const contextText = `${previousUserMessages} ${message}`.trim();
    const lowerContext = contextText.toLowerCase();

    const previousAssistantMessage = [...conversation]
        .reverse()
        .find((entry) => entry?.role === "assistant")
        ?.content
        ?.toLowerCase() || "";

    if (/\btelangana\b/i.test(contextText)) extracted.state = "Telangana";
    if (/\bhyderabad\b/i.test(contextText)) {
        extracted.state = "Telangana";
        extracted.district = "Hyderabad";
    }

    if (/\b(tailoring|boutique)\b/i.test(contextText)) extracted.businessType = "tailoring";
    else if (/\bclothing\s+(shop|store)\b/i.test(contextText)) extracted.businessType = "retail";
    else if (/\bmanufacturing\s+(unit|business)?\b|\bmanufactur(?:e|ing)\b/i.test(contextText)) extracted.businessType = "manufacturing";
    else if (/\b(food\s+business|restaurant)\b/i.test(contextText)) extracted.businessType = "food";
    else if (/\bdairy\s+business\b|\bdairy\b/i.test(contextText)) extracted.businessType = "dairy";
    else if (/\bhandicraft\s+business\b|\bhandicraft\b/i.test(contextText)) extracted.businessType = "handicraft";

    if (/\b(start|starting|begin|beginning|launch|new)\b/i.test(message)) {
        extracted.businessStatus = "new";
    }
    else if (/\b(already\s+(run|running|operate|operating)|existing|currently\s+(run|running|operate|operating))\b/i.test(message)) {
        extracted.businessStatus = "existing";
    }

    if (/\b(i\s*am|i'?m|as\s+a)\s+(a\s+)?woman\b|\bwoman\s+entrepreneur\b|^\s*woman\s*$/i.test(message)) {
        extracted.womanEntrepreneur = true;
    }
    if (/\b(?:belong\s+to|from)\s+(?:the\s+)?(?:sc|st)\b|\bsc\s*\/\s*st\b/i.test(message)) {
        extracted.scSt = true;
    }
    if (/\brural\s+(?:area|location|region)\b|\b(?:area|location|region)\s+is\s+rural\b/i.test(message)) {
        extracted.rural = true;
    }

    const loanAmount = extractAmount(lowerMessage, "loanAmount");
    if (loanAmount !== null && !/\bturnover\b/i.test(message)) {
        extracted.loanAmount = loanAmount;
    }

    const turnover = extractAmount(lowerMessage, "turnover");
    if (turnover !== null) extracted.turnover = turnover;

    if (/^\s*yes\s*$/i.test(message)) {
        if (/woman|women|female/i.test(previousAssistantMessage)) extracted.womanEntrepreneur = true;
        if (/sc\s*\/\s*st|scheduled caste|scheduled tribe/i.test(previousAssistantMessage)) extracted.scSt = true;
        if (/rural/i.test(previousAssistantMessage)) extracted.rural = true;
        if (/new business|new enterprise|starting/i.test(previousAssistantMessage)) extracted.businessStatus = "new";
    }

    return extracted;
};

const extractProfile = async (client, message, profile, language, conversation) => {
    const content = await generateGeminiContent(client, {
        config: {
            temperature: 0,
            responseMimeType: "application/json",
            systemInstruction: [
                "Extract only facts explicitly stated or unambiguously implied by the user's message.",
                "Return JSON with keys profile, intent, and missingFields.",
                "profile may contain only these keys: applicantType, businessType, businessStatus, state, district, turnover, loanAmount, womanEntrepreneur, scSt, rural, disability.",
                "Use null for values not found. Use booleans for boolean fields and a number in rupees for loanAmount and turnover when stated.",
                "Normalize businessStatus to new or existing when clear. Treat 'start', 'starting', 'new business', or 'new enterprise' as new, and 'already running' as existing. Normalize applicantType to entrepreneur, artisan, street-vendor, msme, or shg when clear.",
                "Do not infer caste, disability, rural location, gender, income, or eligibility from names or places.",
                "Use the previous conversation and existing profile to interpret short answers such as a city, state, amount, yes, woman, new, or already running.",
                `The requested response language is ${language}.`,
            ].join(" "),
        },
        contents: JSON.stringify({ message, existingProfile: profile, conversation }),
    });

    return parseJson(content);
};

const mergeProfile = (profile, extractedProfile) => {
    const merged = { ...profile };

    for (const field of PROFILE_FIELDS) {
        const value = extractedProfile?.[field];
        if (["womanEntrepreneur", "scSt", "rural", "disability"].includes(field) && value !== true) {
            continue;
        }
        if (value !== null && value !== undefined && value !== "") {
            merged[field] = value;
        }
    }

    return merged;
};

const getMissingFields = (profile) => {
    const missing = [];

    // These are the core fields needed for an initial scheme match.
    if (!profile.businessType) missing.push("businessType");
    if (!profile.state) missing.push("state");
    if (!profile.loanAmount) missing.push("loanAmount");

    // Business status is useful, but should not block the conversation
    // if the user has not provided it yet.
    return missing;
};

const createLocalReply = (schemes, missingFields) => {
    const recommendations = schemes
        .slice(0, 3)
        .map((scheme) => scheme.name)
        .join(", ");

    if (missingFields.length > 0) {
        return recommendations
            ? `Based on the information provided, these schemes may be relevant: ${recommendations}. To refine the guidance, please provide: ${missingFields.join(", ")}. Official verification is required.`
            : `Please provide: ${missingFields.join(", ")}. Official scheme verification is required.`;
    }

    return recommendations
        ? `Based on your profile, these schemes may be relevant: ${recommendations}. Review the scheme details and complete official verification before applying.`
        : "No matching schemes were found in the local scheme data. Please review the profile details and official scheme sources.";
};

const getFollowUpQuestion = (missingFields) => {
    const questions = {
        businessType: "What type of business are you planning to run?",
        state: "Which state will your business be located in?",
        loanAmount: "Approximately how much funding do you need?",
        businessStatus: "Are you starting a new business, or are you already running one?",
    };
    const field = missingFields[0];
    return `Sure, I can help with that. ${questions[field] || "What other detail should I know about your business?"}`;
};

const createReply = async (client, { message, profile, schemes, missingFields, language }) => {
    const content = await generateGeminiContent(client, {
        config: {
            temperature: 0.2,
            systemInstruction: [
                "You are Setu Saathi, a careful government-scheme information assistant.",
                "Reply briefly and naturally in the requested language.",

                "Remember that the conversation may contain previous user messages and the profile contains information already collected.",
                "Do not ask the user for information that is already present in the profile.",
                "If the user gives a short answer such as 'Hyderabad', 'Telangana', '5 lakh', 'woman', or 'new', interpret it using the current profile and conversation context.",
                "If the user has provided business type and location, do not ask for them again.",
                "If only one important field is missing, ask only for that field.",
                "If enough information exists to run the scheme matcher, explain the best available match using the supplied scheme results.",
                "Never repeat the same generic question when the user has already answered it.",

                "Use only the supplied profile, missing fields, and scheme results.",
                "Never invent eligibility, subsidy amounts, interest rates, collateral requirements, or government rules.",
                "Explain that scheme matching is indicative and official verification is required.",
                "If important information is missing, ask one short follow-up question instead of making assumptions.",
                "Do not claim approval or predict sanction.",
            ].join(" "),
        },
        contents: JSON.stringify({ message, profile, schemes, missingFields, language }),
    });

    return content.trim() || "Please share a little more about your business and funding need.";
};

router.post("/", async (req, res) => {
    console.log("========== SETU COPILOT REQUEST ==========");
    console.log("BODY:", req.body);
    const message = typeof req.body?.message === "string" ? req.body.message.trim() : "";
    const suppliedProfile = req.body?.profile;
    const conversation = Array.isArray(req.body?.conversation)
        ? req.body.conversation.filter((entry) => entry && ["user", "assistant"].includes(entry.role) && typeof entry.content === "string").slice(-20)
        : [];
    const language = typeof req.body?.language === "string" && req.body.language.trim()
        ? req.body.language.trim()
        : "English";

    if (!message) {
        return res.status(400).json({ error: "message must be a non-empty string" });
    }
    if (message.length > 1200) {
        return res.status(400).json({ error: "message must be 1,200 characters or fewer" });
    }
    if (suppliedProfile !== undefined && (typeof suppliedProfile !== "object" || suppliedProfile === null || Array.isArray(suppliedProfile))) {
        return res.status(400).json({ error: "profile must be an object when provided" });
    }

    try {
        const gemini = getGeminiClient();

        let profile = suppliedProfile
            ? { ...suppliedProfile }
            : {};

        // Local extraction provides a reliable fallback
        const deterministicProfile = extractDeterministicProfile(
            message,
            conversation
        );

        profile = mergeProfile(
            profile,
            deterministicProfile
        );

        let intent = "scheme_search";

        // Gemini understands natural language
        if (gemini) {
            try {
                const extracted = await extractProfile(
                    gemini,
                    message,
                    profile,
                    language,
                    conversation
                );

                profile = mergeProfile(
                    profile,
                    extracted?.profile || {}
                );

                intent = extracted?.intent || intent;

            } catch (geminiError) {
                console.error(
                    "[SETU COPILOT] Gemini profile extraction failed:",
                    geminiError
                );
            }
        }

        const missingFields = getMissingFields(profile);

        let schemes = [];

        // Your existing deterministic matcher
        try {
            const matchSchemes = await getMatcher();

            schemes = matchSchemes(profile);

            console.log(
                "[SETU COPILOT] Matched schemes:",
                schemes
            );

        } catch (error) {
            console.error(
                "Setu Saathi matcher failed:",
                error
            );

            return res.status(500).json({
                error: "Unable to match schemes for this profile"
            });
        }

        // Gemini explains the verified matcher results
        if (gemini) {
            try {
                const reply = await createReply(gemini, {
                    message,
                    profile,
                    schemes,
                    missingFields,
                    language
                });

                return res.json({
                    reply,
                    profile,
                    schemes,
                    missingFields,
                    intent
                });

            } catch (geminiError) {
                console.error(
                    "[SETU COPILOT] Gemini reply failed:",
                    geminiError
                );
            }
        }

        // Fallback if Gemini is unavailable
        return res.json({
            reply: createLocalReply(
                schemes,
                missingFields
            ),
            profile,
            schemes,
            missingFields,
            intent
        });

    } catch (error) {
        console.error(
            "Setu Saathi error:",
            error
        );

        return res.status(502).json({
            error: "Setu Saathi could not process the request"
        });
    }
});

module.exports = router;