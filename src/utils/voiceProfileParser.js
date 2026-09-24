const numberWords = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
};

const stateNames = [
    "andhra pradesh",
    "arunachal pradesh",
    "assam",
    "bihar",
    "chhattisgarh",
    "goa",
    "gujarat",
    "haryana",
    "himachal pradesh",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "odisha",
    "punjab",
    "rajasthan",
    "sikkim",
    "tamil nadu",
    "telangana",
    "tripura",
    "uttar pradesh",
    "uttarakhand",
    "west bengal",
    "delhi",
    "jammu and kashmir",
    "ladakh",
    "andaman and nicobar",
    "puducherry",
    "lakshadweep",
    "dadra and nagar haveli and daman and diu",
];

const titleCase = (value) => {
    if (!value) return "";
    return String(value)
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const parseWordNumber = (value = "") => {
    const cleaned = String(value).trim().toLowerCase();
    if (!cleaned) return null;

    if (/^\d+(?:\.\d+)?$/.test(cleaned)) {
        return Number(cleaned.replace(/,/g, ""));
    }

    if (numberWords[cleaned] !== undefined) {
        return Number(numberWords[cleaned]);
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    let total = 0;
    for (const part of parts) {
        if (numberWords[part] !== undefined) {
            total += Number(numberWords[part]);
        }
    }

    return total > 0 ? total : null;
};

const parseAmountValue = (text) => {
    const normalized = String(text || "").toLowerCase();

    if (!normalized) return null;

    const croreMatch = normalized.match(/(?:rs\.?\s*)?(\d[\d,]*(?:\.\d+)?|[a-z]+(?:\s+[a-z]+)?)\s*(crore|crores)/i);
    if (croreMatch) {
        const value = parseWordNumber(croreMatch[1]);
        if (value !== null) return value * 10000000;
    }

    const lakhMatch = normalized.match(/(?:rs\.?\s*)?(\d[\d,]*(?:\.\d+)?|[a-z]+(?:\s+[a-z]+)?)\s*(lakh|lakhs|lac|lacs)/i);
    if (lakhMatch) {
        const value = parseWordNumber(lakhMatch[1]);
        if (value !== null) return value * 100000;
    }

    const numericMatch = normalized.match(/(?:rs\.?\s*)?(\d[\d,]*(?:\.\d+)?)/i);
    if (numericMatch) {
        const value = Number(numericMatch[1].replace(/,/g, ""));
        if (Number.isFinite(value)) return value;
    }

    return null;
};

const detectBusinessType = (text) => {
    const normalized = String(text || "").toLowerCase();

    if (/tailor|tailoring/.test(normalized)) return "tailoring";
    if (/textile|weaving|embroidery/.test(normalized)) return "textile";
    if (/food|restaurant|catering|snacks|eatery/.test(normalized)) return "food";
    if (/grocery|retail|shop|store/.test(normalized)) return "retail";
    if (/manufactur|production|processing|fabrication/.test(normalized)) return "manufacturing";
    if (/artisan|handicraft|handloom/.test(normalized)) return "artisan";
    if (/service|repair|salon|beauty/.test(normalized)) return "service";

    const directMatch = normalized.match(/(?:start(?:ing)?|run(?:ning)?|open(?:ing)?|expand(?:ing)?|want to start|planning to start)\s+(?:a|an|my)?\s*([a-z]+(?:\s+[a-z]+){0,3})\s+(?:business|shop|unit|enterprise|venture|firm)/i);
    if (directMatch) {
        const candidate = directMatch[1].trim();
        if (candidate) return candidate.toLowerCase();
    }

    return "";
};

const detectBusinessStatus = (text) => {
    const normalized = String(text || "").toLowerCase();

    if (/expand|expansion|already running|existing business|run a business|running a business|currently running|currently operating|have a business/.test(normalized)) {
        return "existing";
    }

    if (/start|starting|launch|new business|planning to start|want to start|set up|begin/.test(normalized)) {
        return "new";
    }

    return "";
};

const detectWomanEntrepreneur = (text) => {
    const normalized = String(text || "").toLowerCase();
    return /\b(woman|female|she|her)\b/.test(normalized) && /\b(entrepreneur|business owner|owner)\b/.test(normalized)
        || /\bwoman entrepreneur\b/.test(normalized)
        || /\bfemale entrepreneur\b/.test(normalized)
        || /\bi am a woman\b/.test(normalized)
        || /\bi'm a woman\b/.test(normalized)
        || /\bi am a female\b/.test(normalized)
        || /\bi'm a female\b/.test(normalized);
};

const detectState = (text) => {
    const normalized = String(text || "").toLowerCase();

    for (const state of stateNames) {
        if (normalized.includes(state)) {
            return titleCase(state);
        }
    }

    return "";
};

const detectApplicantType = (text) => {
    const normalized = String(text || "").toLowerCase();

    if (/street vendor|street-vendor|hawker/.test(normalized)) return "street-vendor";
    if (/artisan|weaver|tailor|handloom/.test(normalized)) return "artisan";
    if (/shg|self help group/.test(normalized)) return "shg";
    if (/msme|micro small medium/.test(normalized)) return "msme";
    if (/entrepreneur|business owner|start.*business|new business/.test(normalized)) return "entrepreneur";

    return "";
};

export function extractProfileFromVoiceText(rawText = "") {
    const text = String(rawText || "").trim();
    if (!text) {
        return {
            profile: {},
            summary: [],
            transcript: "",
            warnings: ["No voice text was captured yet."],
        };
    }

    const businessType = detectBusinessType(text);
    const businessStatus = detectBusinessStatus(text);
    const loanAmount = parseAmountValue(text);
    const state = detectState(text);
    const womanEntrepreneur = detectWomanEntrepreneur(text);
    const applicantType = detectApplicantType(text);

    const profile = {
        applicantType: applicantType || "",
        businessType: businessType ? titleCase(businessType) : "",
        businessStatus: businessStatus || "",
        state: state || "",
        district: "",
        turnover: "",
        loanAmount: loanAmount || "",
        womanEntrepreneur: Boolean(womanEntrepreneur),
        scSt: false,
        rural: false,
        disability: false,
    };

    const summary = [
        { key: "businessType", label: "Business", value: profile.businessType || "Not mentioned" },
        { key: "businessStatus", label: "Purpose", value: profile.businessStatus ? (profile.businessStatus === "new" ? "New Business" : "Existing Business") : "Not mentioned" },
        { key: "loanAmount", label: "Loan required", value: profile.loanAmount ? `₹${new Intl.NumberFormat("en-IN").format(profile.loanAmount)}` : "Not mentioned" },
        { key: "womanEntrepreneur", label: "Woman entrepreneur", value: profile.womanEntrepreneur ? "Yes" : "Not mentioned" },
        { key: "state", label: "State", value: profile.state || "Not mentioned" },
    ];

    const warnings = [];
    if (!profile.businessType) warnings.push("Business type not identified from the spoken input.");
    if (!profile.businessStatus) warnings.push("Business purpose is not clear; please confirm whether it is a new or existing business.");
    if (!profile.loanAmount) warnings.push("Loan amount was not identified. You can add it manually.");
    if (!profile.state) warnings.push("State was not mentioned.");

    return {
        profile,
        summary,
        transcript: text,
        warnings,
    };
}
