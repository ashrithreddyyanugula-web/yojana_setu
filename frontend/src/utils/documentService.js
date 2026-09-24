const SUPPORTED_MIME_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
];

const SUPPORTED_EXTENSIONS = new Set(["pdf", "png", "jpg", "jpeg"]);

const normalizeString = (value) => String(value ?? "").trim();

const toDisplayValue = (value, fallback = "Not detected") => {
    const formatted = normalizeString(value);
    return formatted ? formatted : fallback;
};

const titleCase = (value) => {
    const text = normalizeString(value);
    if (!text) return "";

    return text
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

const compareValues = (profileValue, documentValue) => {
    const normalizedProfile = normalizeString(profileValue).toLowerCase();
    const normalizedDocument = normalizeString(documentValue).toLowerCase();

    if (!normalizedProfile && !normalizedDocument) return "not_available";
    if (!normalizedProfile || !normalizedDocument) return "needs_review";
    if (normalizedProfile === normalizedDocument) return "match";
    return "mismatch";
};

const maskAadhaar = (value) => {
    const digits = normalizeString(value).replace(/\D/g, "");
    if (!digits) return "Not detected";
    return `XXXX XXXX ${digits.slice(-4)}`;
};

export function detectDocumentType(fileName = "") {
    const normalizedName = normalizeString(fileName).toLowerCase();

    if (/aadhaar|aadhar/.test(normalizedName)) return "Aadhaar Card";
    if (/pan/.test(normalizedName)) return "PAN Card";
    if (/udyam/.test(normalizedName)) return "Udyam Registration";
    if (/bank|statement|passbook/.test(normalizedName)) return "Bank Statement";
    if (/category|certificate|caste|tribe|income|minority/.test(normalizedName)) return "Category Certificate";

    return "Other / Unknown";
}

export function buildExtractionFromFileType(documentType, profile = {}) {
    const baseProfileName = normalizeString(profile.name);
    const baseBusinessType = normalizeString(profile.businessType);
    const baseApplicantType = normalizeString(profile.applicantType);
    const baseState = normalizeString(profile.state);
    const baseBusinessStatus = normalizeString(profile.businessStatus);

    const commonName = baseProfileName || "Not detected";

    if (documentType === "Aadhaar Card") {
        return {
            name: commonName,
            aadhaarNumber: "Not detected",
            address: baseState || "Not detected",
        };
    }

    if (documentType === "PAN Card") {
        return {
            name: commonName,
            panNumber: "Not detected",
            category: baseApplicantType ? titleCase(baseApplicantType) : "Not detected",
        };
    }

    if (documentType === "Udyam Registration") {
        return {
            enterpriseName: baseBusinessType ? titleCase(baseBusinessType) : "Not detected",
            enterpriseType: baseApplicantType ? titleCase(baseApplicantType) : "Not detected",
            registrationNumber: "Not detected",
            businessActivity: baseBusinessType ? titleCase(baseBusinessType) : "Not detected",
            state: baseState ? titleCase(baseState) : "Not detected",
        };
    }

    if (documentType === "Bank Statement") {
        return {
            accountHolderName: commonName,
            bankName: "Not detected",
            statementPeriod: "Not detected",
            accountType: baseBusinessStatus ? titleCase(baseBusinessStatus) : "Not detected",
        };
    }

    if (documentType === "Category Certificate") {
        return {
            name: commonName,
            category: baseApplicantType ? titleCase(baseApplicantType) : "Not detected",
            certificateNumber: "Not detected",
            issuingAuthority: "Not detected",
        };
    }

    return {
        documentName: commonName,
        documentType: documentType,
        businessActivity: baseBusinessType ? titleCase(baseBusinessType) : "Not detected",
        applicantType: baseApplicantType ? titleCase(baseApplicantType) : "Not detected",
        state: baseState ? titleCase(baseState) : "Not detected",
    };
}

export function compareWithProfile(extractedFields = {}, profile = {}) {
    const profileBusinessType = normalizeString(profile.businessType);
    const profileApplicantType = normalizeString(profile.applicantType);
    const profileState = normalizeString(profile.state);
    const profileName = normalizeString(profile.name);

    const rows = [
        {
            label: "Business Type",
            profileValue: profileBusinessType ? titleCase(profileBusinessType) : "—",
            documentValue: extractedFields.businessActivity || extractedFields.enterpriseType || extractedFields.documentType || "Not detected",
        },
        {
            label: "Applicant Type",
            profileValue: profileApplicantType ? titleCase(profileApplicantType) : "—",
            documentValue: extractedFields.applicantType || extractedFields.enterpriseType || "Not detected",
        },
        {
            label: "Business Name / Owner",
            profileValue: profileName ? titleCase(profileName) : "—",
            documentValue: extractedFields.enterpriseName || extractedFields.name || extractedFields.documentName || "Not detected",
        },
        {
            label: "Location",
            profileValue: profileState ? titleCase(profileState) : "—",
            documentValue: extractedFields.state || "Not detected",
        },
        {
            label: "Registration Number",
            profileValue: "—",
            documentValue: extractedFields.registrationNumber || extractedFields.panNumber || extractedFields.certificateNumber || extractedFields.aadhaarNumber || "Not detected",
        },
    ];

    return rows.map((row) => ({
        ...row,
        status: compareValues(row.profileValue, row.documentValue),
    }));
}

export function analyzeDocument(file, profile = {}) {
    if (!file) {
        return {
            error: "Please select a document to upload.",
            overallStatus: "needs_review",
            documentType: "Other / Unknown",
            extractedFields: {},
            comparisonRows: [],
        };
    }

    const mimeType = normalizeString(file.type).toLowerCase();
    const extension = normalizeString(file.name).split(".").pop()?.toLowerCase() || "";
    const isSupported = SUPPORTED_MIME_TYPES.includes(mimeType) || SUPPORTED_EXTENSIONS.has(extension);

    if (!isSupported) {
        return {
            error: "Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG file.",
            overallStatus: "needs_review",
            documentType: "Other / Unknown",
            extractedFields: {},
            comparisonRows: [],
        };
    }

    const documentType = detectDocumentType(file.name);
    const extractedFields = buildExtractionFromFileType(documentType, profile);
    const comparisonRows = compareWithProfile(extractedFields, profile);

    const mismatchCount = comparisonRows.filter((row) => row.status === "mismatch").length;
    const needsReviewCount = comparisonRows.filter((row) => row.status === "needs_review").length;

    let overallStatus = "consistent";
    if (mismatchCount > 0) {
        overallStatus = "mismatch";
    } else if (needsReviewCount > 0) {
        overallStatus = "needs_review";
    }

    return {
        fileName: file.name,
        documentType,
        extractedFields,
        comparisonRows,
        overallStatus,
        ocrStatus: "not_configured",
        note: "OCR service not configured. File metadata was processed and the document was matched against the current profile for a manual review workflow.",
    };
}

export const statuses = {
    consistent: {
        label: "Consistent with Profile",
        className: "consistent",
    },
    needs_review: {
        label: "Needs Review",
        className: "needs_review",
    },
    mismatch: {
        label: "Information Mismatch",
        className: "mismatch",
    },
};

export const comparisonStatusLabels = {
    match: "✓ Match",
    needs_review: "⚠ Needs Review",
    mismatch: "✕ Mismatch",
    not_available: "— Not Available",
};

export const formatDocumentField = (key, value) => {
    if (key.toLowerCase().includes("number") && value === "Not detected") {
        return "Not detected";
    }

    if (key.toLowerCase().includes("aadhaar") && value !== "Not detected") {
        return maskAadhaar(value);
    }

    return toDisplayValue(value, "Not detected");
};
