import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:5001/api/chat";
const COPILOT_PROFILE_STORAGE_KEY = "yojana-setu-copilot-profile";
const DOCUMENT_STORAGE_KEY = "yojana-setu-home-documents";
const DOCUMENT_DESCRIPTIONS = {
    "Aadhaar Card (UIDAI)": "Upload a clear copy of your Aadhaar card.",
    "PAN Card": "Upload a clear copy of your PAN card.",
    "Udyam Registration Certificate": "Upload your Udyam registration certificate.",
    "Category Certificate (SC/ST/OBC)": "Upload this certificate if it applies to you.",
    "6-Month Bank Statement": "Upload a recent statement covering the last six months.",
};
const SEARCH_PLACEHOLDERS = [
    "Search by name, code, ministry...",
    "Search PMEGP...",
    "Search CGTMSE...",
    "Search MSME schemes...",
    "Search government schemes...",
];
const DOCUMENT_STYLES = `
    #home-hero-section, #scheme-guidance-section, #ai-saathi-section, #document-readiness-section, #application-journey-section { scroll-margin-top: 88px; }
    .home-document-row { cursor: pointer; }
    .home-document-row:focus-visible { outline: 2px solid #4f46e5; outline-offset: 2px; }
    .home-document-panel { margin: 0 0 4px; padding: 12px 16px 14px 56px; border: 1px solid #c7d2fe; border-radius: 8px; background: #f8faff; }
    .home-document-panel-name, .home-document-panel-description, .home-document-filename { margin: 0; }
    .home-document-panel-name { color: #172554; font-size: 13px; font-weight: 700; }
    .home-document-panel-description { margin-top: 3px; color: #64748b; font-size: 12px; }
    .home-document-upload { display: inline-flex; margin-top: 10px; padding: 7px 11px; border-radius: 6px; background: #4f46e5; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; }
    .home-document-upload input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
    .home-document-filename { margin-top: 7px; color: #047857; font-size: 12px; font-weight: 600; overflow-wrap: anywhere; }
    .home-document-provided { background: #d1fae5 !important; color: #047857 !important; }
    @media (max-width: 640px) {
        .home-document-row { grid-template-columns: 32px minmax(0, 1fr) auto 16px !important; }
        .home-document-row > div:nth-child(3) { font-size: 10px; }
        .home-document-panel { padding-left: 16px; }
    }
`;
const SEARCH_STYLES = `
    html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
    header { width: 100%; }
    header > div:first-child > div, header > div.h-20 { width: 100%; max-width: 1320px; box-sizing: border-box; }
    header > div.h-20 { min-width: 0; flex-wrap: wrap; }
    header > div.h-20 > div:first-child { min-width: 0; flex: 1 1 auto; }
    header > div.h-20 > div:last-child { min-width: 0; max-width: 100%; flex-wrap: wrap; }
    .home-nav-search-mount { position: relative; display: flex; align-items: center; flex: 1 1 220px; min-width: 0; max-width: 300px; margin-left: 12px; z-index: 60; }
    .home-nav-search { position: relative; width: 100%; max-width: 300px; min-width: 0; font-family: inherit; }
    .home-nav-search-input-wrap { position: relative; }
    .home-nav-search-input { width: 100%; height: 40px; box-sizing: border-box; padding: 0 38px 0 14px; border: 1px solid #cbd5e1; border-radius: 999px; background: rgba(255, 255, 255, 0.92); color: #18213a; font: inherit; font-size: 12px; outline: none; }
    .home-nav-search-input::placeholder { color: #64748b; opacity: 1; }
    .home-nav-search-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.14); }
    .home-nav-search-icon { position: absolute; top: 50%; right: 13px; width: 16px; height: 16px; color: #4f46e5; transform: translateY(-50%); pointer-events: none; }
    .home-nav-search-popover { position: absolute; top: calc(100% + 8px); left: 0; width: min(360px, 80vw); max-height: 360px; overflow-y: auto; padding: 8px; border: 1px solid #dbe3f0; border-radius: 12px; background: #fff; box-shadow: 0 14px 28px rgba(30, 41, 59, 0.18); color: #18213a; }
    .home-nav-search-status, .home-nav-search-count { margin: 6px 8px; color: #64748b; font-size: 12px; line-height: 1.45; }
    .home-nav-search-error { color: #b91c1c; }
    .home-nav-search-result { padding: 10px; border-radius: 8px; }
    .home-nav-search-result + .home-nav-search-result { border-top: 1px solid #eef2f7; border-radius: 0; }
    .home-nav-search-result h3 { margin: 0 0 4px; color: #18213a; font-size: 13px; line-height: 1.35; }
    .home-nav-search-result p { margin: 3px 0; color: #64748b; font-size: 11px; line-height: 1.4; }
    .home-nav-search-result button { margin-top: 7px; padding: 6px 10px; border: 0; border-radius: 6px; background: #4f46e5; color: #fff; font: inherit; font-size: 11px; font-weight: 700; cursor: pointer; }
    .home-nav-search-result button:hover { background: #4338ca; }
    @media (max-width: 1200px) {
        header > div.h-20 { display: grid; grid-template-columns: minmax(0, 1fr) auto auto; align-items: center; gap: 12px; padding-left: 24px !important; padding-right: 24px !important; }
        header > div.h-20 > div:first-child { display: flex; align-items: center; gap: 12px; }
        header > div.h-20 > div:nth-child(2) { position: static; order: 1; min-width: 0; }
        header > div.h-20 > div:first-child { order: 0; }
        header > div.h-20 > div:last-child { order: 2; }
        header > div.h-20 > div:nth-child(2) img { height: 64px; }
        header > div.h-20 > div:nth-child(2) > div > span:first-child { font-size: 24px; }
        header > div.h-20 > div:nth-child(2) > div > span:last-child { font-size: 11px; }
        .home-nav-search-mount { max-width: 220px; }
    }
    @media (max-width: 992px) {
        header > div.h-20 { gap: 8px; padding-left: 16px !important; padding-right: 16px !important; }
        header > div.h-20 > div:nth-child(2) > div > span:first-child { font-size: 20px; }
        header > div.h-20 > div:nth-child(2) > div > span:last-child { display: none; }
        .home-nav-search-mount { max-width: 180px; }
    }
    @media (max-width: 768px) {
        header > div.h-20 { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; row-gap: 8px; padding: 8px 16px !important; }
        header > div.h-20 > div:first-child { display: contents; }
        header > div.h-20 > div:first-child > div:first-child { grid-column: 1; grid-row: 1; }
        header > div.h-20 > div:nth-child(2) { grid-column: 2; grid-row: 1; justify-self: center; }
        header > div.h-20 > div:last-child { grid-column: 3; grid-row: 1; justify-self: end; }
        .home-nav-search-mount { grid-column: 1 / -1; grid-row: 2; width: 100%; max-width: none; margin: 0; }
        .home-nav-search { width: 100%; max-width: none; }
        .home-nav-search-popover { width: 100%; box-sizing: border-box; }
    }
    @media (max-width: 480px) {
        header > div.h-20 { grid-template-columns: auto minmax(0, 1fr) auto; padding-left: 12px !important; padding-right: 12px !important; }
        header > div.h-20 > div:nth-child(2) > div > span:last-child { display: none; }
        header > div.h-20 > div:nth-child(2) > div > span:first-child { font-size: 18px; }
        header > div.h-20 > div:nth-child(2) img { height: 52px; }
    }
`;
const MOBILE_STYLES = `
    @media (max-width: 768px) {
        html, body { width: 100%; max-width: 100%; overflow-x: hidden; }
        header > div:first-child { height: 26px; overflow: hidden; }
        header > div:first-child > div { max-width: 100%; padding: 0 16px !important; gap: 8px; }
        header > div:first-child .ticker-track { gap: 8px; font-size: 10px; animation-duration: 48s; }
        header > div:first-child .ticker-track > div:nth-child(2) { display: none; }
        header > div:first-child .ticker-track > div:first-child > span:nth-child(n + 3) { display: none; }
        header > div:first-child > div:last-child { gap: 6px; padding-left: 6px; }
        header > div:first-child > div:last-child > div:first-child { display: none; }
        header > div:first-child > div:last-child button { min-width: 28px; min-height: 28px; }
        header > div:nth-child(2) > div:first-child > div > button { min-height: 40px; padding: 8px 10px !important; gap: 5px; font-size: 12px; }
        header > div:nth-child(2) > div:first-child > div > button > span:first-child { font-size: 18px; }
        header > div:nth-child(2) > div:first-child > div > button > span:nth-child(3),
        header > div:nth-child(2) > div:first-child > div > button > span:nth-child(4) { display: none; }
        header > div:nth-child(2) > div:nth-child(2) { max-width: 100%; gap: 3px; }
        header > div:nth-child(2) > div:nth-child(2) > img { width: 30px; height: 38px; object-fit: contain; }
        header > div:nth-child(2) > div:nth-child(2) > div > span:first-child { font-size: 18px !important; line-height: 1.1; white-space: nowrap; }
        header > div:nth-child(2) > div:nth-child(2) > div > span:last-child { display: none; }
        header > div:nth-child(2) > div:last-child { gap: 4px; }
        header > div:nth-child(2) > div:last-child > button { min-height: 40px; padding: 7px 6px !important; font-size: 10px; white-space: nowrap; }
        header > div:nth-child(2) > div:last-child > button:first-child > span:nth-child(2),
        header > div:nth-child(2) > div:last-child > button:first-child > span:nth-child(3) { display: none; }
        header > div:nth-child(2) > div:last-child > div img { width: 30px; height: 30px; }
        header > div:nth-child(2) > div:last-child > div > div { display: none !important; }
        main { width: 100%; max-width: 100%; overflow-x: hidden; }
        main > div > section:first-child { padding: 34px 16px 42px !important; }
        main > div > section:first-child > div[class*="max-w"] { width: 100%; max-width: 100%; }
        main > div > section:first-child > div[class*="max-w"] > div:first-child { max-width: 100%; padding: 6px 10px; gap: 6px; flex-wrap: wrap; justify-content: center; margin-bottom: 18px !important; }
        main > div > section:first-child > div[class*="max-w"] > div:first-child span { font-size: 10px; line-height: 1.35; }
        main > div > section:first-child h1 { max-width: 100%; font-size: clamp(36px, 9vw, 44px) !important; line-height: 1.08; overflow-wrap: anywhere; }
        main > div > section:first-child h1 + p { max-width: 100%; margin-top: 12px !important; font-size: clamp(20px, 5.5vw, 24px) !important; line-height: 1.25; }
        main > div > section:first-child h1 + p + p { max-width: 100%; margin-top: 12px !important; font-size: clamp(15px, 4vw, 17px) !important; line-height: 1.5; }
        main > div > section:first-child > div[class*="max-w"] > .grid.grid-cols-2 { grid-template-columns: 1fr; gap: 10px; margin-top: 24px !important; }
        main > div > section:first-child > div[class*="max-w"] > .grid.grid-cols-2 > div { width: 100%; min-width: 0; padding: 14px !important; }
        main > div > section:first-child > div[class*="max-w"] > .grid.grid-cols-2 > div span { overflow-wrap: anywhere; }
        main > div > section:first-child > div[class*="max-w"] > div:last-child { width: 100%; max-width: 100%; margin-top: 24px !important; }
        main > div > section:first-child > div[class*="max-w"] > div:last-child > button { width: min(90%, 360px); min-height: 46px; margin: 0 auto; padding: 11px 14px !important; font-size: 14px; line-height: 1.25; }
        main > div > section:not(:first-child) { max-width: 100%; padding-left: 16px !important; padding-right: 16px !important; }
    }
    @media (max-width: 480px) {
        header > div:first-child > div { padding: 0 12px !important; }
        header > div:first-child .ticker-track { font-size: 9px; }
        header > div:nth-child(2) > div:first-child > div > button { padding: 8px !important; }
        header > div:nth-child(2) > div:first-child > div > button > span:nth-child(2) { font-size: 0; }
        header > div:nth-child(2) > div:first-child > div > button > span:nth-child(2)::after { content: "Menu"; font-size: 12px; }
        header > div:nth-child(2) > div:nth-child(2) { max-width: 100%; }
        header > div:nth-child(2) > div:nth-child(2) > img { display: none; }
        header > div:nth-child(2) > div:nth-child(2) > div > span:first-child { font-size: 16px !important; }
        header > div:nth-child(2) > div:last-child > button:not(:first-child) { font-size: 0; min-width: 30px; }
        header > div:nth-child(2) > div:last-child > button:nth-child(2)::after { content: "Log in"; font-size: 10px; }
        header > div:nth-child(2) > div:last-child > button:nth-child(3)::after { content: "Sign up"; font-size: 10px; }
        main > div > section:first-child { padding-top: 28px !important; }
    }
    @media (max-width: 768px) {
        #nav-column-toggle { min-height: 40px !important; padding: 8px 10px !important; gap: 5px !important; font-size: 12px !important; }
        #nav-column-toggle > span:first-child { font-size: 18px !important; }
        #nav-column-toggle > span:nth-child(3), #nav-column-toggle > span:nth-child(4) { display: none !important; }
        img[alt="Yojana Setu Official Logo"] { width: 60px !important; height: 60px !important; object-fit: contain !important; }
        img[alt="Yojana Setu Official Logo"] + div > span:first-child { font-size: 18px !important; line-height: 1.1 !important; white-space: nowrap; }
        img[alt="Yojana Setu Official Logo"] + div > span:last-child { display: none !important; }
        #language-menu-button, #login-trigger-btn, #signup-trigger-btn { min-height: 40px !important; padding: 7px 6px !important; font-size: 10px !important; white-space: nowrap; }
        #language-menu-button > span:nth-child(2), #language-menu-button > span:nth-child(3) { display: none; }
        header img[alt="Profile"] { width: 30px !important; height: 30px !important; }
        header img[alt="Profile"] + div { display: none !important; }
    }
    @media (max-width: 480px) {
        #nav-column-toggle { padding: 8px !important; }
        #nav-column-toggle > span:nth-child(2) { font-size: 0 !important; }
        #nav-column-toggle > span:nth-child(2)::after { content: "Menu"; font-size: 12px; }
        img[alt="Yojana Setu Official Logo"] { width: 52px !important; height: 52px !important; display: block !important; object-fit: contain !important; }
        img[alt="Yojana Setu Official Logo"] + div { display: none !important; }
        #login-trigger-btn, #signup-trigger-btn { font-size: 0 !important; min-width: 30px !important; }
        #login-trigger-btn::after { content: "Log in"; font-size: 10px; }
        #signup-trigger-btn::after { content: "Sign up"; font-size: 10px; }
    }
`;

const readStoredDocuments = () => {
    try {
        return JSON.parse(localStorage.getItem(DOCUMENT_STORAGE_KEY)) || {};
    } catch {
        return {};
    }
};

const getUserAvatarLetter = (userData) => {
    const name = (userData?.name || "").trim();
    if (name) return name.charAt(0).toUpperCase();

    const email = (userData?.email || "").trim();
    if (email) return email.charAt(0).toUpperCase();

    return "U";
};

const getAliasValues = (aliases) => {
    if (Array.isArray(aliases)) return aliases;
    if (typeof aliases === "string") return aliases.split(",");
    return aliases === null || aliases === undefined ? [] : [aliases];
};

const getSearchText = (scheme) => [
    scheme?.scheme_name,
    scheme?.scheme_id,
    scheme?.scheme_code,
    scheme?.ministry,
    scheme?.description,
    ...getAliasValues(scheme?.aliases),
]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).trim().toLowerCase())
    .join(" ");

const normalizeSchemeForDetails = (scheme) => ({
    ...scheme,
    id: scheme?.id || scheme?.scheme_id || scheme?.scheme_code,
    name: scheme?.name || scheme?.scheme_name || scheme?.scheme_code || scheme?.scheme_id,
    score: scheme?.score,
    eligible: scheme?.eligible || scheme?.eligibility,
    reasons: Array.isArray(scheme?.reasons) ? scheme.reasons : [],
    warnings: Array.isArray(scheme?.warnings) ? scheme.warnings : [],
    benefits: Array.isArray(scheme?.benefits)
        ? scheme.benefits
        : scheme?.benefits
            ? [scheme.benefits]
            : scheme?.benefit
                ? [scheme.benefit]
                : [],
    loanRange: scheme?.loanRange || scheme?.loan_support || scheme?.loan_range,
    officialUrl: scheme?.officialUrl || scheme?.official_url,
    sourceUrl: scheme?.sourceUrl || scheme?.source_url,
});

const renderMatchedScheme = (frameDocument, scheme) => {
    const setText = (selector, value, fallback) => {
        const element = frameDocument.querySelector(selector);
        if (element) element.textContent = value || fallback;
    };

    if (!scheme) {
        setText("#recommendation-title", "More information needed", "More information needed");
        setText("#recommendation-description", "I need a little more information to identify suitable schemes.", "I need a little more information to identify suitable schemes.");
        setText("#recommendation-loan", "", "Not available in current scheme data");
        setText("#recommendation-subsidy", "", "Not available in current scheme data");
        setText("#recommendation-collateral", "", "Not available in current scheme data");
        setText("#recommendation-rate", "", "Not available in current scheme data");
        setText("#recommendation-note", "Please answer the Copilot's follow-up question to continue.", "Please answer the Copilot's follow-up question to continue.");
        return;
    }

    const recommendation = normalizeSchemeForDetails(scheme);
    const score = recommendation.score === undefined || recommendation.score === null
        ? "Not available"
        : `${recommendation.score}`;
    const status = recommendation.eligible || "Needs verification";
    const reasons = recommendation.reasons?.length ? recommendation.reasons.join(" ") : "No specific matching reason provided.";
    const benefits = recommendation.benefits?.length ? recommendation.benefits.join(" ") : "Not available in current scheme data";
    const warnings = recommendation.warnings?.length ? recommendation.warnings.join(" ") : "None recorded in current scheme data.";

    setText("#recommendation-title", recommendation.name, "Scheme recommendation");
    setText("#recommendation-description", `Match score: ${score} | Status: ${status}. ${reasons}`, "See the official scheme information for details.");
    setText("#recommendation-loan", recommendation.loanRange, "Not available in current scheme data");
    setText("#recommendation-subsidy", benefits, "Not available in current scheme data");
    setText("#recommendation-collateral", "", "Not available in current scheme data");
    setText("#recommendation-rate", "", "Not available in current scheme data");
    setText("#recommendation-note", `Benefits: ${benefits} Reasons: ${reasons} Warnings: ${warnings}`, "Matched from the current scheme data.");
};

const readCopilotProfile = () => {
    try {
        const savedProfile = JSON.parse(localStorage.getItem(COPILOT_PROFILE_STORAGE_KEY) || "null");
        const sessionProfile = JSON.parse(sessionStorage.getItem("yojana-setu-profile-data") || "null");
        return { ...(sessionProfile || {}), ...(savedProfile || {}) };
    } catch {
        return {};
    }
};

function Home({ user, profileLocation, onLogin, onSignup, onOpenProfile, onLogout }) {
    const frameRef = useRef(null);
    const schemesCacheRef = useRef(null);
    const schemesRequestRef = useRef(null);
    const [schemeQuery, setSchemeQuery] = useState("");
    const [matchedSchemes, setMatchedSchemes] = useState([]);
    const [hasCopilotResponse, setHasCopilotResponse] = useState(false);
    const [conversation, setConversation] = useState([]);
    const conversationRef = useRef([]);
    const [schemeSearchMount, setSchemeSearchMount] = useState(null);
    const [searchPlaceholder, setSearchPlaceholder] = useState("");
    const [schemeSearchState, setSchemeSearchState] = useState({
        status: "idle",
        schemes: [],
        message: "",
    });

    useEffect(() => {
        let phraseIndex = 0;
        let characterIndex = 0;
        let isDeleting = false;
        let timeoutId;

        const typeNextCharacter = () => {
            const phrase = SEARCH_PLACEHOLDERS[phraseIndex];
            characterIndex += isDeleting ? -1 : 1;
            setSearchPlaceholder(phrase.slice(0, characterIndex));

            if (!isDeleting && characterIndex === phrase.length) {
                isDeleting = true;
                timeoutId = window.setTimeout(typeNextCharacter, 1500);
                return;
            }

            if (isDeleting && characterIndex === 0) {
                isDeleting = false;
                phraseIndex = (phraseIndex + 1) % SEARCH_PLACEHOLDERS.length;
                timeoutId = window.setTimeout(typeNextCharacter, 350);
                return;
            }

            timeoutId = window.setTimeout(typeNextCharacter, isDeleting ? 34 : 62);
        };

        timeoutId = window.setTimeout(typeNextCharacter, 300);
        return () => window.clearTimeout(timeoutId);
    }, []);

    const findSchemes = async () => {
        if (!schemesRequestRef.current) {
            schemesRequestRef.current = fetch("http://localhost:5001/api/schemes")
                .then(async (response) => {
                    if (!response.ok) throw new Error("Unable to load schemes");
                    const data = await response.json();
                    const schemes = Array.isArray(data) ? data : data?.schemes;
                    if (!Array.isArray(schemes)) throw new Error("Invalid schemes response");
                    schemesCacheRef.current = schemes;
                    return schemes;
                })
                .finally(() => {
                    schemesRequestRef.current = null;
                });
        }

        return schemesCacheRef.current || schemesRequestRef.current;
    };

    useEffect(() => {
        const query = schemeQuery.trim().toLowerCase();
        if (!query) {
            setSchemeSearchState({ status: "idle", schemes: [], message: "" });
            return undefined;
        }

        let isCurrent = true;
        setSchemeSearchState((current) => ({ ...current, status: "loading", message: "" }));

        findSchemes()
            .then((schemes) => {
                if (!isCurrent) return;
                const matchingSchemes = schemes.filter((scheme) => getSearchText(scheme).includes(query));
                setSchemeSearchState({ status: "success", schemes: matchingSchemes, message: "" });
            })
            .catch(() => {
                if (isCurrent) {
                    setSchemeSearchState({
                        status: "error",
                        schemes: [],
                        message: "Unable to load schemes right now. Please try again.",
                    });
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [schemeQuery]);

    const openSearchedScheme = (scheme) => {
        const selectedScheme = normalizeSchemeForDetails(scheme);
        sessionStorage.setItem("yojana-setu-selected-scheme", JSON.stringify(selectedScheme));
        const parentLocation = window.parent.location;
        parentLocation.href = `${parentLocation.pathname}${parentLocation.search}#details/${encodeURIComponent(selectedScheme.id)}`;
        parentLocation.reload();
    };

    useEffect(() => {
        const frame = frameRef.current;
        const frameDocument = frame?.contentDocument;
        if (!frameDocument || !hasCopilotResponse) return undefined;

        const topScheme = matchedSchemes[0];
        renderMatchedScheme(frameDocument, topScheme);

        const officialButton = frameDocument.querySelector("#recommendation-action")?.closest("button");
        const secondaryButton = frameDocument.querySelector("#recommendation-secondary-action");
        const normalizedScheme = topScheme ? normalizeSchemeForDetails(topScheme) : null;
        const officialHandler = normalizedScheme?.officialUrl
            ? () => window.open(normalizedScheme.officialUrl, "_blank", "noopener,noreferrer")
            : null;
        const secondaryHandler = normalizedScheme
            ? () => openSearchedScheme(normalizedScheme)
            : null;

        if (officialButton) {
            officialButton.onclick = officialHandler;
            officialButton.disabled = !officialHandler;
        }
        if (secondaryButton) {
            secondaryButton.onclick = secondaryHandler;
            secondaryButton.disabled = !secondaryHandler;
        }

        return () => {
            if (officialButton) {
                officialButton.onclick = null;
                officialButton.disabled = false;
            }
            if (secondaryButton) {
                secondaryButton.onclick = null;
                secondaryButton.disabled = false;
            }
        };
    }, [matchedSchemes, hasCopilotResponse]);

    useEffect(() => {
        const frame = frameRef.current;
        if (!frame) return undefined;

        const handleLoad = () => {
            const frameDocument = frame.contentDocument;
            if (!frameDocument) return;

            frame.__authCleanup?.();

            const loginTargets = [...frameDocument.querySelectorAll("button, a")].filter((element) =>
                /^(log\s*in|login)$/i.test(element.textContent.trim())
            );
            const signupTargets = [...frameDocument.querySelectorAll("button, a")].filter((element) =>
                /^sign\s*up$/i.test(element.textContent.trim())
            );
            const schemeTargets = frameDocument.querySelectorAll("#hero-ai-search-btn");
            const menuToggle = frameDocument.querySelector("#nav-column-toggle");
            const searchMount = frameDocument.createElement("div");
            searchMount.className = "home-nav-search-mount";
            menuToggle?.parentElement?.after(searchMount);
            const searchStyle = frameDocument.createElement("style");
            searchStyle.textContent = SEARCH_STYLES;
            frameDocument.head.appendChild(searchStyle);
            const mobileStyle = frameDocument.createElement("style");
            mobileStyle.textContent = MOBILE_STYLES;
            frameDocument.body.appendChild(mobileStyle);
            setSchemeSearchMount(menuToggle ? searchMount : null);
            const header = menuToggle?.closest("header");
            const navbar = header?.children[1];
            const logo = frameDocument.querySelector('img[alt="Yojana Setu Official Logo"]');
            const logoText = logo?.nextElementSibling;
            const languageButton = frameDocument.querySelector("#language-menu-button");
            const loginButton = frameDocument.querySelector("#login-trigger-btn");
            const signupButton = frameDocument.querySelector("#signup-trigger-btn");
            const headerActions = languageButton?.parentElement;
            const mobileProfileImage = frameDocument.querySelector('img[alt="Profile"]');
            const setMobileStyle = (element, property, value, enabled) => {
                if (!element) return;
                element.style.setProperty(property, enabled ? value : "", "important");
            };
            const applyMobileHeaderLayout = () => {
                const viewportWidth = frameDocument.documentElement.clientWidth;
                const isMobile = viewportWidth <= 768;
                const isPhone = viewportWidth <= 480;
                setMobileStyle(header, "height", "", isMobile);
                setMobileStyle(navbar, "height", "", isMobile);
                setMobileStyle(navbar, "padding", isMobile ? "0 16px" : "", isMobile);
                setMobileStyle(menuToggle, "min-height", "40px", isMobile);
                setMobileStyle(menuToggle, "padding", isMobile ? "8px 10px" : "", isMobile);
                setMobileStyle(menuToggle?.children[2], "display", "none", isMobile);
                setMobileStyle(menuToggle?.children[3], "display", "none", isMobile);
                setMobileStyle(logo, "width", isPhone ? "52px" : "60px", isMobile);
                setMobileStyle(logo, "height", isPhone ? "52px" : "60px", isMobile);
                setMobileStyle(logo, "display", "block", isMobile);
                setMobileStyle(logoText, "max-width", isMobile ? "31vw" : "", isMobile);
                setMobileStyle(logoText, "gap", isMobile ? "4px" : "", isMobile);
                setMobileStyle(logoText?.children[0], "font-size", isPhone ? "14px" : "18px", isMobile);
                setMobileStyle(logoText, "display", "none", isPhone);
                setMobileStyle(logoText?.children[1], "display", "none", isMobile);
                setMobileStyle(languageButton?.children[1], "display", "none", isMobile);
                setMobileStyle(languageButton?.children[2], "display", "none", isMobile);
                setMobileStyle(languageButton, "min-height", "40px", isMobile);
                setMobileStyle(headerActions, "gap", isMobile ? "2px" : "", isMobile);
                setMobileStyle(languageButton, "width", isPhone ? "30px" : "", isPhone);
                setMobileStyle(loginButton, "min-height", "40px", isMobile);
                setMobileStyle(signupButton, "min-height", "40px", isMobile);
                setMobileStyle(loginButton, "width", isPhone ? "40px" : "", isPhone);
                setMobileStyle(signupButton, "width", isPhone ? "50px" : "", isPhone);
                setMobileStyle(loginButton, "font-size", "10px", isPhone);
                setMobileStyle(signupButton, "font-size", "10px", isPhone);
                setMobileStyle(mobileProfileImage, "width", "30px", isMobile);
                setMobileStyle(mobileProfileImage, "height", "30px", isMobile);
                setMobileStyle(mobileProfileImage?.nextElementSibling, "display", "none", isMobile);
            };
            applyMobileHeaderLayout();
            frameDocument.defaultView?.addEventListener("resize", applyMobileHeaderLayout);
            const navigationTargets = {
                home: frameDocument.querySelector('[data-path="home"]'),
                schemes: frameDocument.querySelector('[data-path="schemes-and-eligibility"]'),
                copilot: frameDocument.querySelector('[data-path="ai-saathi-copilot"]'),
                documents: frameDocument.querySelector('[data-path="document-intelligence"]'),
                journey: frameDocument.querySelector('[data-path="application-journey"]'),
            };
            const navigationMenu = navigationTargets.home?.closest("nav");
            const navigationGroup = navigationMenu?.parentElement;
            const readinessHeading = [...frameDocument.querySelectorAll("h4")].find((element) =>
                element.textContent.trim() === "Document Readiness"
            );
            const journeyHeading = [...frameDocument.querySelectorAll("h4")].find((element) =>
                element.textContent.trim() === "Application Journey"
            );
            const heroSection = frameDocument.querySelector("main > div > section");
            const schemeSection = [...frameDocument.querySelectorAll("h2")].find((element) =>
                element.textContent.trim() === "Smart Capital & Eligibility Suite"
            )?.closest("section");
            const copilotSection = frameDocument.querySelector("#copilot-title")?.closest("[class*='md:col-span-7']");
            const documentSection = readinessHeading?.closest("[class*='md:col-span-5']");
            const journeySection = journeyHeading?.closest("[class*='md:col-span-7']");
            const navigationSections = [
                [heroSection, "home-hero-section"],
                [schemeSection, "scheme-guidance-section"],
                [copilotSection, "ai-saathi-section"],
                [documentSection, "document-readiness-section"],
                [journeySection, "application-journey-section"],
            ];
            navigationSections.forEach(([section, id]) => {
                if (section) section.id = id;
            });
            const documentRows = readinessHeading?.parentElement?.querySelectorAll(":scope > div.flex.flex-col.gap-space-xs > div") || [];
            const storedDocuments = readStoredDocuments();
            const documentCleanups = [];
            const documentStyle = frameDocument.createElement("style");
            documentStyle.textContent = DOCUMENT_STYLES;
            frameDocument.head.appendChild(documentStyle);

            if (documentRows.length === 5) {
                const counter = readinessHeading.parentElement.parentElement.querySelector("svg + span");
                const counterDescription = counter?.closest(".flex.items-center")?.querySelector("div:last-child p");
                const progressCircle = readinessHeading.parentElement.parentElement.querySelector('circle[stroke="#10b981"]');
                const documentNames = [...documentRows].map((row) => row.querySelector("p")?.textContent.trim());

                const updateCounter = () => {
                    const providedCount = documentNames.filter((name, index) =>
                        index < 2 || Boolean(storedDocuments[name])
                    ).length;
                    if (counter) counter.textContent = `${providedCount}/5`;
                    if (counterDescription) counterDescription.textContent = `${providedCount} of 5 documents available`;
                    if (progressCircle) progressCircle.setAttribute("stroke-dasharray", `${providedCount * 20} ${100 - providedCount * 20}`);
                    if (counter?.parentElement) counter.parentElement.previousElementSibling?.setAttribute("aria-label", `${providedCount} of 5 documents available`);
                };

                documentRows.forEach((row, index) => {
                    const name = documentNames[index];
                    const description = DOCUMENT_DESCRIPTIONS[name];
                    if (!name || !description) return;

                    row.setAttribute("role", "button");
                    row.setAttribute("tabindex", "0");
                    row.setAttribute("aria-expanded", "false");
                    row.classList.add("home-document-row");

                    const status = row.querySelector(":scope > span:nth-child(3)");
                    const panel = frameDocument.createElement("div");
                    panel.className = "home-document-panel";
                    panel.hidden = true;
                    panel.innerHTML = `
                        <p class="home-document-panel-name">${name}</p>
                        <p class="home-document-panel-description">${description}</p>
                        <label class="home-document-upload">
                            <span>Choose File</span>
                            <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" />
                        </label>
                        <p class="home-document-filename" aria-live="polite"></p>
                    `;
                    row.after(panel);

                    const fileInput = panel.querySelector("input");
                    const filename = panel.querySelector(".home-document-filename");
                    const savedFilename = storedDocuments[name];
                    if (savedFilename) {
                        filename.textContent = `Selected: ${savedFilename}`;
                        if (status) {
                            status.textContent = "✓ Provided";
                            status.classList.add("home-document-provided");
                        }
                    }

                    const togglePanel = () => {
                        panel.hidden = !panel.hidden;
                        row.setAttribute("aria-expanded", String(!panel.hidden));
                    };
                    const handleKeydown = (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            togglePanel();
                        }
                    };
                    const handleFile = () => {
                        const file = fileInput.files?.[0];
                        if (!file) return;
                        storedDocuments[name] = file.name;
                        localStorage.setItem(DOCUMENT_STORAGE_KEY, JSON.stringify(storedDocuments));
                        filename.textContent = `Selected: ${file.name}`;
                        if (status) {
                            status.textContent = "✓ Provided";
                            status.classList.add("home-document-provided");
                        }
                        updateCounter();
                    };

                    row.addEventListener("click", togglePanel);
                    row.addEventListener("keydown", handleKeydown);
                    fileInput.addEventListener("change", handleFile);
                    documentCleanups.push(() => {
                        row.removeEventListener("click", togglePanel);
                        row.removeEventListener("keydown", handleKeydown);
                        fileInput.removeEventListener("change", handleFile);
                        panel.remove();
                    });
                });
                updateCounter();
            }

            const preventDefaultAndRun = (callback) => (event) => {
                event.preventDefault();
                callback();
            };

            let chatInput = frameDocument.querySelector("#chat-input-field");
            const chatOutput = frameDocument.querySelector("#chat-output");
            let sendButton = frameDocument.querySelector("#send-query-btn");
            let chatInProgress = false;

            const appendConversation = (entry) => {
                const nextConversation = [...conversationRef.current, entry];
                conversationRef.current = nextConversation;
                setConversation(nextConversation);
                return nextConversation;
            };

            const renderConversation = (pendingText = "") => {
                if (!chatOutput) return;
                chatOutput.style.whiteSpace = "pre-line";
                const transcript = conversationRef.current
                    .map((entry) => `${entry.role === "user" ? "You" : "Setu Saathi"}: ${entry.content}`)
                    .join("\n\n");
                chatOutput.textContent = pendingText ? `${transcript}\n\n${pendingText}` : transcript;
            };

            if (chatInput) {
                const cleanInput = chatInput.cloneNode(true);
                chatInput.replaceWith(cleanInput);
                chatInput = cleanInput;
            }
            if (sendButton) {
                const cleanSendButton = sendButton.cloneNode(true);
                sendButton.replaceWith(cleanSendButton);
                sendButton = cleanSendButton;
            }

            const sendCopilotMessage = async () => {
                const message = chatInput?.value?.trim();
                if (!message || chatInProgress) return;

                chatInProgress = true;
                const conversationForRequest = appendConversation({ role: "user", content: message });
                if (sendButton) {
                    sendButton.disabled = true;
                    sendButton.setAttribute("aria-busy", "true");
                }
                renderConversation("Setu Saathi is analysing your request...");

                try {
                    const response = await fetch(CHAT_API_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message,
                            profile: readCopilotProfile(),
                            language: frameDocument.documentElement.lang || "English",
                            conversation: conversationForRequest,
                        }),
                    });
                    const data = await response.json();
                    if (!response.ok) throw new Error(data.error || "Setu Saathi is unavailable right now.");

                    const reply = data.reply || "Please share more about your business or funding need.";
                    appendConversation({ role: "assistant", content: reply });
                    renderConversation();
                    if (data.profile && typeof data.profile === "object") {
                        localStorage.setItem(COPILOT_PROFILE_STORAGE_KEY, JSON.stringify(data.profile));
                    }
                    if (Array.isArray(data.schemes) && data.schemes.length > 0) {
                        setMatchedSchemes(data.schemes);
                        setHasCopilotResponse(true);
                    }
                } catch (error) {
                    console.error("Setu Saathi request failed:", error);
                    const errorMessage = error.message || "Unable to connect to Setu Saathi. Please try again.";
                    appendConversation({ role: "assistant", content: errorMessage });
                    renderConversation();
                } finally {
                    chatInProgress = false;
                    if (sendButton) {
                        sendButton.disabled = false;
                        sendButton.removeAttribute("aria-busy");
                    }
                }
            };

            sendButton?.addEventListener("click", sendCopilotMessage);
            const chatKeydownHandler = (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    sendCopilotMessage();
                }
            };
            chatInput?.addEventListener("keydown", chatKeydownHandler);

            const loginHandler = preventDefaultAndRun(onLogin);
            const signupHandler = preventDefaultAndRun(onSignup);
            const schemeHandler = preventDefaultAndRun(onOpenProfile);
            const scrollTargets = {
                home: heroSection,
                schemes: schemeSection,
                copilot: copilotSection,
                documents: documentSection,
                journey: journeySection,
            };
            const closeNavigationMenu = () => {
                if (navigationMenu) navigationMenu.style.display = "none";
            };
            const restoreNavigationMenu = () => {
                if (navigationMenu) navigationMenu.style.display = "";
            };
            const scrollToSection = (section) => (event) => {
                event.preventDefault();
                section?.scrollIntoView({ behavior: "smooth", block: "start" });

                if (section && frame.contentWindow && window.parent) {
                    const headerOffset = 88;
                    const frameTop = frame.getBoundingClientRect().top;
                    const sectionTop = section.getBoundingClientRect().top;
                    window.parent.scrollTo({
                        top: window.parent.scrollY + frameTop + sectionTop - headerOffset,
                        behavior: "smooth",
                    });
                }
                closeNavigationMenu();
            };
            const navigationCleanups = Object.entries(navigationTargets).map(([key, target]) => {
                const handler = scrollToSection(scrollTargets[key]);
                target?.addEventListener("click", handler);
                return () => target?.removeEventListener("click", handler);
            });
            navigationGroup?.addEventListener("mouseenter", restoreNavigationMenu);
            navigationGroup?.addEventListener("mouseleave", restoreNavigationMenu);

            frame.contentWindow?.postMessage({
                type: "profile-location",
                location: profileLocation || { state: "", district: "" },
            }, "*");

            const profileImage = frameDocument.querySelector('img[alt="Profile"]');
            const profileContainer = profileImage?.parentElement;
            let profileMenu;
            let profileClickHandler;

            loginTargets.forEach((element) => { element.style.display = user ? "none" : ""; });
            signupTargets.forEach((element) => { element.style.display = user ? "none" : ""; });
            if (profileContainer) profileContainer.style.display = user ? "flex" : "none";

            if (profileContainer) {
                profileContainer.style.cursor = "pointer";
                const nameElement = profileContainer.querySelector("div.hidden");
                const name = user?.name || "User Profile";
                const email = user?.email || "";
                const avatarLetter = getUserAvatarLetter(user);

                if (profileImage) {
                    const avatarElement = frameDocument.createElement("div");
                    avatarElement.className = profileImage.className;
                    avatarElement.classList.add("flex", "items-center", "justify-center", "font-bold", "text-[12px]", "bg-surface-container-high", "text-on-surface", "select-none");
                    avatarElement.textContent = avatarLetter;
                    avatarElement.setAttribute("aria-label", "Profile avatar");
                    avatarElement.style.borderRadius = "9999px";
                    avatarElement.style.display = "flex";
                    avatarElement.style.alignItems = "center";
                    avatarElement.style.justifyContent = "center";
                    avatarElement.style.fontWeight = "700";
                    avatarElement.style.fontSize = "0.75rem";
                    avatarElement.style.lineHeight = "1";
                    avatarElement.style.background = "#e5e7eb";
                    avatarElement.style.color = "#1f2937";
                    profileImage.replaceWith(avatarElement);
                }

                if (nameElement) {
                    nameElement.classList.remove("hidden");
                    nameElement.classList.add("flex");
                    const labels = nameElement.querySelectorAll("span");
                    if (labels[0]) labels[0].textContent = name;
                    if (labels[1]) labels[1].textContent = email;
                }

                profileMenu = frameDocument.createElement("div");
                profileMenu.style.cssText = "display:none;position:absolute;right:1rem;top:4.5rem;z-index:50;min-width:220px;padding:12px;background:white;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.14);color:#1f2937";
                const menuName = frameDocument.createElement("strong");
                menuName.textContent = name;
                const menuEmail = frameDocument.createElement("small");
                menuEmail.textContent = email;
                menuEmail.style.cssText = "display:block;margin-top:4px;color:#6b7280";
                const profileButton = frameDocument.createElement("button");
                profileButton.textContent = "Profile";
                profileButton.style.cssText = "display:block;width:100%;margin-top:12px;padding:8px;text-align:left;background:transparent;border:0;cursor:pointer";
                profileButton.addEventListener("click", onOpenProfile);
                const logoutButton = frameDocument.createElement("button");
                logoutButton.textContent = "Logout";
                logoutButton.style.cssText = "display:block;width:100%;padding:8px;text-align:left;background:transparent;border:0;cursor:pointer;color:#b91c1c";
                logoutButton.addEventListener("click", onLogout);
                profileMenu.append(menuName, menuEmail, profileButton, logoutButton);
                profileContainer.parentElement?.appendChild(profileMenu);
                profileClickHandler = (event) => {
                    event.stopPropagation();
                    profileMenu.style.display = profileMenu.style.display === "none" ? "block" : "none";
                };
                profileContainer.addEventListener("click", profileClickHandler);
            }



















            loginTargets.forEach((element) => element.addEventListener("click", loginHandler));
            signupTargets.forEach((element) => element.addEventListener("click", signupHandler));
            schemeTargets.forEach((element) => element.addEventListener("click", schemeHandler));
            schemeTargets.forEach((element) => element.addEventListener("click", schemeHandler));

            frame.__authCleanup = () => {
                frame.contentWindow?.stopSetuCopilotVoice?.();
                loginTargets.forEach((element) => element.removeEventListener("click", loginHandler));
                signupTargets.forEach((element) => element.removeEventListener("click", signupHandler));
                schemeTargets.forEach((element) => element.removeEventListener("click", schemeHandler));
                navigationCleanups.forEach((cleanup) => cleanup());
                navigationGroup?.removeEventListener("mouseenter", restoreNavigationMenu);
                navigationGroup?.removeEventListener("mouseleave", restoreNavigationMenu);
                profileContainer?.removeEventListener("click", profileClickHandler);
                profileMenu?.remove();
                documentCleanups.forEach((cleanup) => cleanup());
                setSchemeSearchMount(null);
                searchMount.remove();
                searchStyle.remove();
                mobileStyle.remove();
                frameDocument.defaultView?.removeEventListener("resize", applyMobileHeaderLayout);
                documentStyle.remove();
                sendButton?.removeEventListener("click", sendCopilotMessage);
                chatInput?.removeEventListener("keydown", chatKeydownHandler);
            };
        };

        frame.addEventListener("load", handleLoad);
        if (frame.contentDocument?.readyState === "complete") {
            handleLoad();
        }
        return () => {
            frame.removeEventListener("load", handleLoad);
            frame.__authCleanup?.();
        };
    }, [user, profileLocation, onLogin, onSignup, onOpenProfile, onLogout]);

    return (
        <main className="stitch-home-shell">
            {schemeSearchMount ? createPortal(
                <div className="home-nav-search" role="search">
                    <div className="home-nav-search-input-wrap">
                        <input
                            className="home-nav-search-input"
                            type="search"
                            value={schemeQuery}
                            onChange={(event) => setSchemeQuery(event.target.value)}
                            placeholder={schemeQuery ? "" : searchPlaceholder}
                            aria-label="Search government schemes"
                        />
                        <svg className="home-nav-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                            <circle cx="11" cy="11" r="7" />
                            <path d="m20 20-4-4" />
                        </svg>
                    </div>
                    {schemeQuery.trim() ? (
                        <div className="home-nav-search-popover">
                            {schemeSearchState.status === "loading" ? (
                                <p className="home-nav-search-status">Loading schemes...</p>
                            ) : schemeSearchState.status === "error" ? (
                                <p className="home-nav-search-status home-nav-search-error" role="alert">{schemeSearchState.message}</p>
                            ) : schemeSearchState.schemes.length === 0 ? (
                                <p className="home-nav-search-status"><strong>No schemes found</strong></p>
                            ) : (
                                <>
                                    {schemeSearchState.schemes.length > 1 ? (
                                        <p className="home-nav-search-count">{schemeSearchState.schemes.length} schemes found</p>
                                    ) : null}
                                    {schemeSearchState.schemes.map((scheme, index) => {
                                        const schemeId = scheme.scheme_id || scheme.scheme_code || scheme.id;
                                        const schemeName = scheme.scheme_name || scheme.name || schemeId || "Government scheme";
                                        const description = scheme.description || scheme.details;
                                        return (
                                            <article className="home-nav-search-result" key={schemeId || `${schemeName}-${index}`}>
                                                <h3>{schemeName}</h3>
                                                {schemeId ? <p>Code: {schemeId}</p> : null}
                                                {scheme.ministry ? <p>Ministry: {scheme.ministry}</p> : null}
                                                {description ? <p>{description}</p> : null}
                                                <button type="button" onClick={() => openSearchedScheme(scheme)}>
                                                    View Scheme →
                                                </button>
                                            </article>
                                        );
                                    })}
                                </>
                            )}
                        </div>
                    ) : null}
                </div>,
                schemeSearchMount
            ) : null}
            <iframe
                ref={frameRef}
                className="stitch-home-frame"
                src={`/stitch-index-backup.html?mapsKey=${encodeURIComponent(import.meta.env.VITE_GOOGLE_MAPS_BROWSER_KEY || "")}`}
                title="Yojana Setu main interface"
                allow="geolocation"
            />
        </main>
    );
}

export default Home;

