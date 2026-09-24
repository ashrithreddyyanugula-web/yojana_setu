const REVIEW_STORAGE_KEY = "yojana-setu-scheme-reviews";

const getStorage = () => {
    try {
        return JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "{}");
    } catch {
        return {};
    }
};

const setStorage = (reviewsByScheme) => {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(reviewsByScheme));
};

export const getSchemeReviewKey = (scheme) => String(scheme?.id || scheme?.name || "unknown-scheme");

export const loadSchemeReviews = (scheme) => {
    const reviewsByScheme = getStorage();
    const reviews = reviewsByScheme[getSchemeReviewKey(scheme)];
    return Array.isArray(reviews) ? reviews : [];
};

export const saveSchemeReview = (scheme, review) => {
    const reviewsByScheme = getStorage();
    const schemeKey = getSchemeReviewKey(scheme);
    const nextReview = {
        id: `${schemeKey}-${Date.now()}`,
        rating: review.rating,
        text: review.text.trim(),
        location: review.location.trim(),
        submittedAt: new Date().toISOString(),
        source: "local",
    };

    reviewsByScheme[schemeKey] = [nextReview, ...(reviewsByScheme[schemeKey] || [])];
    setStorage(reviewsByScheme);
    return nextReview;
};