import { useEffect, useState } from "react";
import DocumentIntelligence from "../components/DocumentIntelligence";
import { matchSchemes } from "../utils/schemeMatcher";

const statusLabels = {
    eligible: {
        label: "Likely Eligible",
        meaning: "All currently supplied information satisfies the matching criteria.",
        badgeClass: "ys-status-eligible",
    },
    needs_verification: {
        label: "Needs Verification",
        meaning: "Some information or supporting documents need verification.",
        badgeClass: "ys-status-verification",
    },
    not_eligible: {
        label: "Not Eligible",
        meaning: "One or more mandatory scheme conditions are not currently satisfied.",
        badgeClass: "ys-status-not-eligible",
    },
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const amount = Number(value);
    if (!Number.isFinite(amount) || amount <= 0) return "";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
};

const titleCase = (value) => {
    if (!value) return "";
    return String(value)
        .replace(/[-_]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (character) => character.toUpperCase());
};

function SchemeResults({ profile, documentAnalysis, onDocumentAnalysisChange, onBack, onViewScheme }) {
    const [schemes, setSchemes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [schemeError, setSchemeError] = useState("");

    useEffect(() => {
        let isMounted = true;

        const loadSchemes = async () => {
            setIsLoading(true);
            setSchemeError("");

            try {
                const API_BASE_URL =
                    import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
                const response = await fetch(`${API_BASE_URL}/api/schemes`)

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch schemes (${response.status})`
                    );
                }

                const data = await response.json();

                if (!data.success || !Array.isArray(data.schemes)) {
                    throw new Error("Invalid schemes response from server");
                }

                // ============================================
                // YOJANA SETU MATCHING DEBUG
                // ============================================

                console.group("🔎 Yojana Setu Scheme Matching");

                console.log("👤 PROFILE BEING MATCHED:");
                console.table(profile || {});

                console.log("📦 MONGODB SCHEMES:");
                console.log(data.schemes);

                console.log(
                    `📊 TOTAL MONGODB SCHEMES: ${data.schemes.length}`
                );

                console.table(
                    data.schemes.map((scheme) => ({
                        scheme_id: scheme.scheme_id,
                        scheme_name: scheme.scheme_name,
                        applicant_type: scheme.applicant_type,
                        business_type: scheme.business_type,
                        business_status: scheme.business_status,
                        age_min: scheme.age_min,
                        gender: scheme.gender,
                        sc_st: scheme.sc_st,
                        rural: scheme.rural,
                        loan_support: scheme.loan_support,
                    }))
                );
                // Send profile + MongoDB schemes into matcher
                const results = matchSchemes(
                    profile || {},
                    data.schemes
                );

                console.log("🎯 FINAL SCORED RESULTS:");
                console.log(results);

                console.table(
                    results.map((scheme) => ({
                        id: scheme.id,
                        name: scheme.name,
                        score: scheme.score,
                        eligibility: scheme.eligible,
                        reasons: scheme.reasons?.length || 0,
                        warnings: scheme.warnings?.length || 0,
                    }))
                );

                console.groupEnd();

                // Store results for the UI
                setSchemes(results);
            } catch (error) {
                console.error("Scheme loading error:", error);

                if (!isMounted) return;

                setSchemes([]);
                setSchemeError(
                    "Unable to load government schemes. Please make sure the backend server is running."
                );
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        loadSchemes();

        return () => {
            isMounted = false;
        };
    }, [profile]);

    const applicantTypeDisplay = profile?.applicantType ? titleCase(profile.applicantType) : "Not specified";
    const businessTypeDisplay = profile?.businessType ? titleCase(profile.businessType) : "Not specified";
    const locationDisplay = profile?.state
        ? `${profile.state}${profile?.district ? `, ${profile.district}` : ""}`
        : "Not specified";
    const loanAmountDisplay = profile?.loanAmount ? formatCurrency(profile.loanAmount) : "Not specified";

    return (
        <div className="ys-results-page">
            <style>{`
                .ys-results-page {
                    min-height: 100vh;
                    background-color: #f8fafc;
                    color: #0f172a;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    padding: 28px 20px 88px;
                    -webkit-font-smoothing: antialiased;
                }

                .ys-container {
                    max-width: 920px;
                    margin: 0 auto;
                }

                /* Top Navigation */
                .ys-topbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                }

                .ys-back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #ffffff;
                    border: 1px solid #d1d5db;
                    color: #374151;
                    border-radius: 8px;
                    padding: 8px 16px;
                    font-size: 13.5px;
                    font-weight: 600;
                    cursor: pointer;
                    text-decoration: none;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
                    transition: all 0.15s ease;
                }

                .ys-back-btn:hover {
                    background: #f9fafb;
                    border-color: #9ca3af;
                }

                .ys-back-btn:focus-visible {
                    outline: 2px solid #ea580c;
                    outline-offset: 2px;
                }

                .ys-portal-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 12px;
                    font-weight: 600;
                    color: #475569;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    padding: 5px 12px;
                    border-radius: 6px;
                }

                .ys-portal-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background-color: #ea580c;
                }

                /* Header Card */
                .ys-header-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 28px 34px;
                    margin-bottom: 24px;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                }

                .ys-header-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 14px;
                }

                .ys-header-card h1 {
                    margin: 0 0 6px;
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #0f172a;
                    letter-spacing: -0.02em;
                }

                .ys-header-card p {
                    margin: 0;
                    font-size: 14.5px;
                    line-height: 1.55;
                    color: #475569;
                }

                .ys-matches-count-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #fff7ed;
                    border: 1px solid #fed7aa;
                    color: #ea580c;
                    font-size: 13px;
                    font-weight: 700;
                    padding: 6px 14px;
                    border-radius: 6px;
                }

                /* Profile Summary Card */
                .ys-profile-summary {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 20px 24px;
                    margin-bottom: 28px;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                }

                .ys-summary-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 14px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .ys-summary-title {
                    margin: 0;
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #0f172a;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }

                .ys-edit-profile-btn {
                    border: 1px solid #cbd5e1;
                    background: #ffffff;
                    color: #ea580c;
                    font-size: 12.5px;
                    font-weight: 600;
                    padding: 5px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }

                .ys-edit-profile-btn:hover {
                    background: #fff7ed;
                    border-color: #fed7aa;
                }

                .ys-summary-grid {
                    display: grid;
                    grid-template-columns: repeat(4, minmax(0, 1fr));
                    gap: 14px;
                }

                .ys-summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                }

                .ys-summary-label {
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #64748b;
                    text-transform: uppercase;
                }

                .ys-summary-value {
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #1e293b;
                }

                /* Loading Box */
                .ys-loader-box {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 48px 24px;
                    text-align: center;
                    color: #475569;
                    font-size: 14.5px;
                    font-weight: 600;
                }

                /* Scheme Card */
                .ys-schemes-list {
                    display: flex;
                    flex-direction: column;
                    gap: 22px;
                }

                .ys-scheme-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 28px 32px;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                    transition: border-color 0.15s ease;
                }

                .ys-scheme-card:hover {
                    border-color: #cbd5e1;
                }

                .ys-card-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 18px;
                    margin-bottom: 12px;
                }

                .ys-card-title-group {
                    flex: 1;
                }

                .ys-card-title-group h2 {
                    margin: 0 0 6px;
                    font-size: 1.35rem;
                    font-weight: 800;
                    color: #0f172a;
                    line-height: 1.3;
                    letter-spacing: -0.01em;
                }

                .ys-loan-range {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #475569;
                }

                .ys-loan-range strong {
                    color: #0f172a;
                    font-weight: 700;
                }

                /* Score Badge */
                .ys-score-box {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                    flex-shrink: 0;
                }

                .ys-score-value {
                    font-size: 1.45rem;
                    font-weight: 800;
                    color: #ea580c;
                    line-height: 1;
                }

                .ys-score-caption {
                    font-size: 11.5px;
                    font-weight: 600;
                    color: #64748b;
                    margin-top: 3px;
                }

                /* Status Row */
                .ys-status-row {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .ys-status-pill {
                    display: inline-flex;
                    align-items: center;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                }

                .ys-status-eligible {
                    background: #dcfce7;
                    color: #15803d;
                }

                .ys-status-verification {
                    background: #fef3c7;
                    color: #b45309;
                }

                .ys-status-not-eligible {
                    background: #fee2e2;
                    color: #b91c1c;
                }

                .ys-status-explanation {
                    font-size: 13px;
                    color: #64748b;
                }

                /* Content Sections */
                .ys-scheme-section {
                    margin-bottom: 18px;
                }

                .ys-scheme-section-title {
                    font-size: 12.5px;
                    font-weight: 700;
                    color: #334155;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    margin: 0 0 8px;
                }

                .ys-reasons-list,
                .ys-benefits-list,
                .ys-warnings-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .ys-reasons-list li,
                .ys-benefits-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    font-size: 13.5px;
                    color: #1e293b;
                    line-height: 1.45;
                }

                .ys-check-icon {
                    color: #16a34a;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .ys-bullet-icon {
                    color: #ea580c;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                .ys-warnings-box {
                    background: #fffbeb;
                    border: 1px solid #fef3c7;
                    border-radius: 8px;
                    padding: 14px 16px;
                    margin-bottom: 18px;
                }

                .ys-warnings-box .ys-scheme-section-title {
                    color: #92400e;
                    margin-bottom: 6px;
                }

                .ys-warnings-list li {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    font-size: 13px;
                    color: #78350f;
                    line-height: 1.45;
                }

                .ys-warn-icon {
                    color: #b45309;
                    font-weight: 700;
                    flex-shrink: 0;
                }

                /* Card Actions */
                .ys-card-footer {
                    display: flex;
                    align-items: center;
                    justify-content: flex-end;
                    padding-top: 18px;
                    border-top: 1px solid #f1f5f9;
                    margin-top: 20px;
                }

                .ys-view-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #ea580c;
                    color: #ffffff;
                    border: 0;
                    border-radius: 8px;
                    padding: 11px 22px;
                    font-size: 14px;
                    font-weight: 700;
                    cursor: pointer;
                    box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
                    transition: background 0.15s, box-shadow 0.15s;
                }

                .ys-view-btn:hover {
                    background: #c2410c;
                    box-shadow: 0 4px 8px rgba(234, 88, 12, 0.25);
                }

                .ys-view-btn:focus-visible {
                    outline: 2px solid #ea580c;
                    outline-offset: 2px;
                }

                /* Empty State Card */
                .ys-empty-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 48px 32px;
                    text-align: center;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.04);
                }

                .ys-empty-card h2 {
                    margin: 0 0 8px;
                    font-size: 1.35rem;
                    font-weight: 700;
                    color: #0f172a;
                }

                .ys-empty-card p {
                    margin: 0 0 22px;
                    font-size: 14px;
                    color: #64748b;
                }

                /* Trust Note */
                .ys-trust-footer {
                    margin-top: 36px;
                    padding: 16px 20px;
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 10px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    font-size: 12.5px;
                    color: #64748b;
                    line-height: 1.5;
                }

                .ys-trust-icon {
                    color: #16a34a;
                    flex-shrink: 0;
                    margin-top: 1px;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .ys-results-page {
                        padding: 20px 14px 64px;
                    }

                    .ys-header-card {
                        padding: 22px 18px;
                    }

                    .ys-header-card h1 {
                        font-size: 1.45rem;
                    }

                    .ys-summary-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 12px;
                    }

                    .ys-scheme-card {
                        padding: 22px 18px;
                    }

                    .ys-card-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .ys-score-box {
                        align-items: flex-start;
                    }

                    .ys-status-row {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 6px;
                    }

                    .ys-card-footer {
                        justify-content: stretch;
                    }

                    .ys-view-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>

            <div className="ys-container">
                {/* Top Navigation Bar */}
                <div className="ys-topbar">
                    <button type="button" className="ys-back-btn" onClick={onBack} aria-label="Return to Profile Form">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Edit Profile
                    </button>
                    <div className="ys-portal-badge">
                        <span className="ys-portal-dot"></span>
                        Yojana Setu Scheme Finder
                    </div>
                </div>

                {/* Page Header */}
                <header className="ys-header-card">
                    <div className="ys-header-top">
                        <div>
                            <h1>Your Scheme Matches</h1>
                            <p>Based on the information you provided, these schemes may fit your business.</p>
                        </div>
                        {!isLoading && schemes.length > 0 ? (
                            <div className="ys-matches-count-badge">
                                {schemes.length} Matched Scheme{schemes.length === 1 ? "" : "s"}
                            </div>
                        ) : null}
                    </div>
                </header>

                {/* Profile Summary Card */}
                <section className="ys-profile-summary" aria-label="Your Profile Summary">
                    <div className="ys-summary-header">
                        <span className="ys-summary-title">Your Profile</span>
                        <button type="button" className="ys-edit-profile-btn" onClick={onBack}>
                            Edit Profile
                        </button>
                    </div>
                    <div className="ys-summary-grid">
                        <div className="ys-summary-item">
                            <span className="ys-summary-label">Applicant Type</span>
                            <span className="ys-summary-value">{applicantTypeDisplay}</span>
                        </div>
                        <div className="ys-summary-item">
                            <span className="ys-summary-label">Business Type</span>
                            <span className="ys-summary-value">{businessTypeDisplay}</span>
                        </div>
                        <div className="ys-summary-item">
                            <span className="ys-summary-label">Location</span>
                            <span className="ys-summary-value">{locationDisplay}</span>
                        </div>
                        <div className="ys-summary-item">
                            <span className="ys-summary-label">Loan Requirement</span>
                            <span className="ys-summary-value">{loanAmountDisplay}</span>
                        </div>
                    </div>
                </section>

                {/* Document Intelligence */}
                {documentAnalysis !== undefined ? (
                    <DocumentIntelligence profile={profile} onAnalysisChange={onDocumentAnalysisChange} />
                ) : null}

                {/* Results List */}
                <main>
                    {isLoading ? (
                        <div
                            className="ys-loader-box">
                            Loading government schemes and matching your profile...
                        </div>
                    ) : schemeError ? (
                        <div className="ys-empty-card">
                            <h2>Unable to load schemes</h2>

                            <p>{schemeError}</p>

                            <button
                                type="button"
                                className="ys-view-btn"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : schemes.length === 0 ? (
                        <div className="ys-empty-card">
                            <h2>No matching schemes found</h2>

                            <p>
                                We couldn't find a scheme that matches the information provided.
                            </p>

                            <button
                                type="button"
                                className="ys-view-btn"
                                onClick={onBack}
                            >
                                Edit Profile
                            </button>
                        </div>
                    ) : (
                        <div className="ys-schemes-list">
                            {schemes.map((scheme) => {
                                const status =
                                    statusLabels[scheme.eligible] ||
                                    statusLabels.needs_verification;

                                const reasons = Array.isArray(scheme.reasons)
                                    ? scheme.reasons
                                    : [];

                                const benefits = Array.isArray(scheme.benefits)
                                    ? scheme.benefits
                                    : [];

                                const warnings = Array.isArray(scheme.warnings)
                                    ? scheme.warnings
                                    : [];
                                return (
                                    <article
                                        className="ys-scheme-card"
                                        key={scheme.id}
                                    >
                                        <div className="ys-card-header">
                                            <div className="ys-card-title-group">
                                                <h2>{scheme.name}</h2>

                                                {scheme.loanRange ? (
                                                    <p className="ys-loan-range">
                                                        Assistance Range:{" "}
                                                        <strong>{scheme.loanRange}</strong>
                                                    </p>
                                                ) : null}
                                            </div>

                                            <div className="ys-score-box">
                                                <span className="ys-score-value">
                                                    {scheme.score ?? 0}%
                                                </span>

                                                <span className="ys-score-caption">
                                                    Scheme Match Score
                                                </span>
                                            </div>
                                        </div>

                                        <div className="ys-status-row">
                                            <span
                                                className={`ys-status-pill ${status.badgeClass}`}
                                            >
                                                {status.label}
                                            </span>

                                            <span className="ys-status-explanation">
                                                {status.meaning}
                                            </span>
                                        </div>

                                        {reasons.length > 0 ? (
                                            <div className="ys-scheme-section">
                                                <h3 className="ys-scheme-section-title">
                                                    Why this scheme appears
                                                </h3>

                                                <ul className="ys-reasons-list">
                                                    {reasons.map((reason) => (
                                                        <li key={reason}>
                                                            <span className="ys-check-icon">
                                                                ✓
                                                            </span>
                                                            <span>{reason}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}

                                        {benefits.length > 0 ? (
                                            <div className="ys-scheme-section">
                                                <h3 className="ys-scheme-section-title">
                                                    What the scheme offers
                                                </h3>

                                                <ul className="ys-benefits-list">
                                                    {benefits.map((benefit) => (
                                                        <li key={benefit}>
                                                            <span className="ys-bullet-icon">
                                                                •
                                                            </span>
                                                            <span>{benefit}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}

                                        {warnings.length > 0 ? (
                                            <div className="ys-warnings-box">
                                                <h3 className="ys-scheme-section-title">
                                                    Things to Check
                                                </h3>

                                                <ul className="ys-warnings-list">
                                                    {warnings.map((warning) => (
                                                        <li key={warning}>
                                                            <span className="ys-warn-icon">
                                                                !
                                                            </span>
                                                            <span>{warning}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ) : null}

                                        <div className="ys-card-footer">
                                            <button
                                                type="button"
                                                className="ys-view-btn"
                                                onClick={() => onViewScheme(scheme)}
                                            >
                                                View Scheme →
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}

                    {/* Trust / Product Guidance */}
                    <div className="ys-trust-footer">
                        <svg className="ys-trust-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        <div>
                            Scheme matching is calculated from configured rules and provided profile parameters. Official eligibility and credit sanction are subject to direct verification by the respective ministry, agency, or lending institution.
                        </div>
                    </div>
                </main>
            </div >
        </div >
    );
}

export default SchemeResults;