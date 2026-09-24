const STATUS_ORDER = {
    eligible: 0,
    needs_verification: 1,
    not_eligible: 2,
};

const clampScore = (score) => Math.max(0, Math.min(100, Math.round(score / 5) * 5));

const toAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
};

const addReason = (reasons, reason) => {
    if (!reasons.includes(reason)) reasons.push(reason);
};

const addWarning = (warnings, warning) => {
    if (!warnings.includes(warning)) warnings.push(warning);
};

const isTargetApplicant = (applicantType) =>
    ["entrepreneur", "artisan", "street-vendor", "msme", "shg"].includes(applicantType);

function matchPMEGP(profile) {
    const reasons = [];
    const warnings = [];
    const loanAmount = toAmount(profile.loanAmount);
    const businessType = String(profile.businessType || "").toLowerCase();
    const isManufacturing = /manufactur|production|textile|food|processing|unit/.test(businessType);
    const maximumProjectCost = isManufacturing ? 5000000 : 2000000;
    let score = 45;
    let eligible = "needs_verification";

    if (profile.businessStatus === "existing") {
        eligible = "not_eligible";
        addWarning(warnings, "Existing units are not eligible for a new PMEGP unit.");
    } else if (profile.businessStatus === "new") {
        score += 15;
        addReason(reasons, "Your business status matches PMEGP support for a new enterprise.");
    }

    if (profile.applicantType === "entrepreneur") {
        score += 5;
        addReason(reasons, "You selected entrepreneur as your applicant type.");
    } else if (isTargetApplicant(profile.applicantType)) {
        score += 3;
        addReason(reasons, "Your applicant type is compatible with an enterprise-focused scheme.");
    }

    if (profile.businessType) {
        score += 5;
        addReason(reasons, "You provided a business activity for scheme matching.");
    }

    if (loanAmount > 0 && loanAmount <= maximumProjectCost) {
        score += 15;
        addReason(reasons, "Your requested amount is within the indicative PMEGP project-cost ceiling.");
    } else if (loanAmount > maximumProjectCost) {
        addWarning(warnings, "The requested amount is above the indicative PMEGP project-cost ceiling; project cost and financing structure must be verified.");
    } else {
        addWarning(warnings, "A project cost and financing plan must be verified for PMEGP.");
    }

    if (profile.womanEntrepreneur || profile.scSt || profile.rural) {
        score += 5;
        addReason(reasons, "Your selected category may qualify for special-category consideration; official verification is required.");
    }

    addWarning(warnings, "Applicant age must be verified to confirm the requirement that the individual beneficiary is above 18.");
    addWarning(warnings, "Education qualification and exact project cost are not collected in this profile and require official verification.");

    return {
        id: "pmegp",
        name: "Prime Minister's Employment Generation Programme",
        score: clampScore(score),
        eligible,
        reasons,
        warnings,
        benefits: ["Margin-money subsidy support", "Bank-linked finance for eligible new units"],
        loanRange: isManufacturing ? "Up to Rs 50 lakh project cost for manufacturing" : "Up to Rs 20 lakh project cost for business/service",
        officialUrl: "https://www.kviconline.gov.in/pmegpeportal/pmegphome/index.jsp",
    };
}

function matchMudra(profile) {
    const reasons = [];
    const warnings = [];
    const loanAmount = toAmount(profile.loanAmount);
    const applicantType = profile.applicantType;
    const businessType = String(profile.businessType || "").toLowerCase();
    let score = 45;
    let eligible = "needs_verification";
    let loanRange = "Up to Rs 10 lakh under Shishu, Kishor, and Tarun";

    if (loanAmount === 0) {
        addWarning(warnings, "A requested loan amount is needed to identify the PMMY category.");
    } else if (loanAmount <= 50000) {
        score += 20;
        loanRange = "Shishu: up to Rs 50,000";
        addReason(reasons, "Your requested loan amount fits the Shishu category.");
    } else if (loanAmount <= 500000) {
        score += 20;
        loanRange = "Kishor: above Rs 50,000 to Rs 5 lakh";
        addReason(reasons, "Your requested loan amount fits the Kishor category.");
    } else if (loanAmount <= 1000000) {
        score += 20;
        loanRange = "Tarun: above Rs 5 lakh to Rs 10 lakh";
        addReason(reasons, "Your requested loan amount fits the Tarun category.");
    } else if (loanAmount <= 2000000) {
        score += 15;
        loanRange = "Tarun Plus: above Rs 10 lakh to Rs 20 lakh";
        addReason(reasons, "Your requested loan amount fits the Tarun Plus range.");
        addWarning(warnings, "Previous successful Tarun loan history must be verified for Tarun Plus.");
    } else {
        eligible = "not_eligible";
        addWarning(warnings, "The requested amount is above the documented PMMY loan limit of Rs 20 lakh.");
    }

    if (profile.businessType) {
        score += 10;
        addReason(reasons, "You provided a business activity relevant to micro-enterprise lending.");
    } else {
        addWarning(warnings, "The business activity must be verified for PMMY eligibility.");
    }

    if (profile.businessStatus === "new" || profile.businessStatus === "existing") {
        score += 10;
        addReason(reasons, "Your business status is available for lender-side assessment.");
    }

    if (isTargetApplicant(applicantType)) {
        score += 5;
        addReason(reasons, "Your applicant type matches the micro-enterprise focus of PMMY.");
    }

    if (profile.womanEntrepreneur || profile.scSt || profile.rural) {
        score += 3;
        addReason(reasons, "Your selected category can inform lender-side scheme assessment.");
    }

    addWarning(warnings, "Final borrower, enterprise, documentation, and lender requirements must be verified.");

    if (eligible !== "not_eligible" && loanAmount > 0 && loanAmount <= 1000000) {
        eligible = "eligible";
    }

    return {
        id: "mudra",
        name: "Pradhan Mantri MUDRA Yojana",
        score: clampScore(score),
        eligible,
        reasons,
        warnings,
        benefits: ["Collateral-free micro-enterprise credit, subject to lender assessment", "Working-capital or business expansion support"],
        loanRange,
        officialUrl: "https://www.mudra.org.in/",
    };
}

function matchStandUpIndia(profile) {
    const reasons = [];
    const warnings = [];
    const loanAmount = toAmount(profile.loanAmount);
    const hasTargetCategory = Boolean(profile.womanEntrepreneur || profile.scSt);
    let score = 40;
    let eligible = "needs_verification";

    if (hasTargetCategory) {
        score += 25;
        addReason(reasons, "You selected woman entrepreneur or SC/ST eligibility for this targeted scheme.");
    } else {
        eligible = "not_eligible";
        addWarning(warnings, "Stand-Up India targets women or SC/ST entrepreneurs, and no such category was selected.");
    }

    if (loanAmount >= 1000000 && loanAmount <= 10000000) {
        score += 20;
        addReason(reasons, "Your requested loan amount falls within the Rs 10 lakh to Rs 1 crore range.");
    } else if (loanAmount > 0) {
        eligible = "not_eligible";
        addWarning(warnings, "The requested loan amount is outside the documented Rs 10 lakh to Rs 1 crore range.");
    } else {
        addWarning(warnings, "A requested loan amount is needed to verify the Stand-Up India loan range.");
    }

    if (profile.businessStatus === "new") {
        score += 10;
        addReason(reasons, "Your business status indicates a new enterprise.");
        addWarning(warnings, "Greenfield status must be verified because the profile does not collect a separate greenfield confirmation.");
    } else if (profile.businessStatus === "existing") {
        score += 5;
        addWarning(warnings, "The profile indicates an existing business; greenfield enterprise status must be verified.");
    } else {
        addWarning(warnings, "Greenfield enterprise status must be verified.");
    }

    if (profile.businessType) {
        score += 5;
        addReason(reasons, "You provided a business activity for greenfield-enterprise matching.");
    }

    if (profile.applicantType === "entrepreneur") {
        score += 5;
        addReason(reasons, "You selected entrepreneur as your applicant type.");
    }

    if (eligible !== "not_eligible") {
        eligible = "needs_verification";
    }

    return {
        id: "stand-up-india",
        name: "Stand-Up India",
        score: clampScore(score),
        eligible,
        reasons,
        warnings,
        benefits: ["Composite loan support for eligible greenfield enterprises", "Bank-linked finance subject to scheme and lender conditions"],
        loanRange: "Rs 10 lakh to Rs 1 crore",
        officialUrl: "https://www.standupmitra.in/",
    };
}
function matchDatabaseScheme(profile, scheme) {
    const reasons = [];
    const warnings = [];

    let score = 40;
    let eligible = "needs_verification";

    const applicantType = String(profile.applicantType || "").toLowerCase();
    const businessType = String(profile.businessType || "").toLowerCase();
    const schemeApplicantType = String(scheme.applicant_type || "").toLowerCase();
    const schemeBusinessType = String(scheme.business_type || "").toLowerCase();
    const schemeBusinessStatus = String(scheme.business_status || "").toLowerCase();

    // Applicant type
    if (
        applicantType &&
        (
            schemeApplicantType.includes(applicantType) ||
            schemeApplicantType.includes("entrepreneur") ||
            schemeApplicantType.includes("msme")
        )
    ) {
        score += 15;
        addReason(
            reasons,
            "Your applicant profile matches the target beneficiaries of this scheme."
        );
    }

    // Business type
    if (businessType && schemeBusinessType) {
        const businessWords = businessType
            .split(/\s+/)
            .filter((word) => word.length > 3);

        const businessMatch = businessWords.some((word) =>
            schemeBusinessType.includes(word)
        );

        if (businessMatch) {
            score += 15;
            addReason(
                reasons,
                "Your business activity matches the scheme's supported business area."
            );
        }
    }

    // New / existing business
    if (profile.businessStatus && schemeBusinessStatus) {
        const status = profile.businessStatus.toLowerCase();

        if (schemeBusinessStatus.includes(status)) {
            score += 10;
            addReason(
                reasons,
                "Your business status matches the scheme requirements."
            );
        }
    }

    // Woman entrepreneur
    if (profile.womanEntrepreneur) {
        score += 5;
        addReason(
            reasons,
            "Your women-entrepreneur profile can be considered for this scheme."
        );
    }

    // SC/ST
    if (profile.scSt && scheme.sc_st === "Yes") {
        score += 10;
        addReason(
            reasons,
            "The scheme includes SC/ST applicants among its applicable categories."
        );
    }

    // Rural
    if (profile.rural && scheme.rural === "Yes") {
        score += 10;
        addReason(
            reasons,
            "The scheme supports rural applicants or rural-focused activities."
        );
    }

    if (scheme.age_min && scheme.age_min !== "Not specified") {
        const minimumAge = Number(scheme.age_min);

        if (
            Number.isFinite(minimumAge) &&
            Number(profile.age) >= minimumAge
        ) {
            score += 5;
            addReason(
                reasons,
                `Your age meets the recorded minimum age of ${minimumAge}.`
            );
        }
    }

    // We don't mark database schemes as fully eligible yet.
    // Official eligibility rules need verification.
    if (score >= 70) {
        eligible = "eligible";
    } else if (score >= 50) {
        eligible = "needs_verification";
    } else {
        eligible = "not_eligible";
    }

    addWarning(
        warnings,
        "Final eligibility must be verified against the official scheme guidelines."
    );

    return {
        id: scheme.scheme_id,
        name: scheme.scheme_name,
        score: clampScore(score),
        eligible,
        reasons,
        warnings,
        benefits: scheme.benefit
            ? [scheme.benefit]
            : ["See official scheme guidelines for benefits."],
        loanRange: scheme.loan_support === "Yes"
            ? "Loan support available; amount and conditions require verification."
            : "This scheme is not primarily recorded as a loan-support scheme.",
        officialUrl: scheme.official_url,
        sourceUrl: scheme.source_url,
    };
}
function matchSchemes(profile = {}, databaseSchemes = []) {
    const hardCodedResults = [
        matchPMEGP(profile),
        matchMudra(profile),
        matchStandUpIndia(profile),
    ];

    const databaseResults = databaseSchemes
        .filter((scheme) => {
            // PMEGP, MUDRA and Stand-Up India are already
            // handled by the existing detailed matchers.
            const name = String(scheme.scheme_name || "").toLowerCase();

            return !(
                name.includes("prime minister employment generation") ||
                name.includes("mudra") ||
                name.includes("stand-up india")
            );
        })
        .map((scheme) => matchDatabaseScheme(profile, scheme));

    return [...hardCodedResults, ...databaseResults]
        .sort(
            (first, second) =>
                STATUS_ORDER[first.eligible] - STATUS_ORDER[second.eligible] ||
                second.score - first.score
        );
}
module.exports = { matchSchemes };
