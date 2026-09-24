import { useEffect, useMemo, useState } from "react";
import { getReadinessItems } from "../utils/applicationReadiness";
import { getRoadmapConfig } from "../utils/applicationRoadmap";
import { calculateEMI } from "../utils/emiCalculator";

const statusLabels = {
    eligible: {
        label: "Likely Eligible",
        meaning: "All currently supplied information satisfies the matching rules.",
        tone: "eligible",
        icon: "✓",
    },
    needs_verification: {
        label: "Needs Verification",
        meaning: "Some information or documents still need verification.",
        tone: "needs_verification",
        icon: "!",
    },
    not_eligible: {
        label: "Not Eligible",
        meaning: "One or more known mandatory conditions are not currently satisfied.",
        tone: "not_eligible",
        icon: "✕",
    },
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
});
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";

function SchemeDetails({ scheme, profile, documentAnalysis, loanAmount, onBack }) {
    const initialLoanAmount = Number(loanAmount) > 0 ? String(loanAmount) : "";
    const [calculatorInputs, setCalculatorInputs] = useState({
        loanAmount: initialLoanAmount,
        annualInterestRate: "",
        tenureMonths: "",
    });
    const [calculation, setCalculation] = useState(null);
    const [calculationError, setCalculationError] = useState("");
    const [expandedStep, setExpandedStep] = useState("eligibility");
    const [assistanceState, setAssistanceState] = useState({
        status: "idle",
        message: "",
        places: [],
        coordinates: null,
    });

    const roadmapConfig = useMemo(() => scheme ? getRoadmapConfig(scheme) : { steps: [] }, [scheme]);
    const activeEligibility = scheme?.eligible || "needs_verification";

    const roadmapStepStates = useMemo(() => {
        const firstStepStatus = {
            eligible: "completed",
            needs_verification: "next",
            not_eligible: "next",
        }[activeEligibility] || "next";

        return roadmapConfig.steps.map((step, index) => {
            if (step.id === "eligibility") {
                return {
                    ...step,
                    status: index === 0 ? firstStepStatus : "upcoming",
                };
            }

            if (index === 0) return { ...step, status: firstStepStatus };
            return { ...step, status: "upcoming" };
        });
    }, [activeEligibility, roadmapConfig.steps]);

    const completedCount = roadmapStepStates.filter((step) => step.status === "completed").length;
    const progressLabel = `${completedCount} of ${roadmapStepStates.length} steps`;
    const readinessItems = getReadinessItems(profile, documentAnalysis, scheme);
    const completedReadinessItems = readinessItems.filter((item) => item.status === "complete").length;
    const readinessPercentage = readinessItems.length > 0
        ? Math.round((completedReadinessItems / readinessItems.length) * 100)
        : 0;

    useEffect(() => {
        setCalculatorInputs((current) => ({
            ...current,
            loanAmount: initialLoanAmount,
        }));
        setCalculation(null);
        setCalculationError("");
    }, [initialLoanAmount]);

    const handleCalculatorChange = (event) => {
        const { name, value } = event.target;
        const nextInputs = { ...calculatorInputs, [name]: value };
        setCalculatorInputs(nextInputs);

        const principal = Number(nextInputs.loanAmount);
        const annualInterestRate = Number(nextInputs.annualInterestRate);
        const tenureMonths = Number(nextInputs.tenureMonths);
        const hasValidInputs = nextInputs.loanAmount.trim() !== ""
            && nextInputs.annualInterestRate.trim() !== ""
            && nextInputs.tenureMonths.trim() !== ""
            && Number.isFinite(principal)
            && Number.isFinite(annualInterestRate)
            && Number.isFinite(tenureMonths)
            && principal > 0
            && annualInterestRate >= 0
            && tenureMonths > 0;

        setCalculation(hasValidInputs ? calculateEMI(principal, annualInterestRate, tenureMonths) : null);
        setCalculationError("");
    };

    const handleCalculate = (event) => {
        event.preventDefault();

        const principal = Number(calculatorInputs.loanAmount);
        const annualInterestRate = Number(calculatorInputs.annualInterestRate);
        const tenureMonths = Number(calculatorInputs.tenureMonths);
        const hasValidInputs = calculatorInputs.loanAmount.trim() !== ""
            && calculatorInputs.annualInterestRate.trim() !== ""
            && calculatorInputs.tenureMonths.trim() !== ""
            && Number.isFinite(principal)
            && Number.isFinite(annualInterestRate)
            && Number.isFinite(tenureMonths)
            && principal > 0
            && annualInterestRate >= 0
            && tenureMonths > 0;

        if (!hasValidInputs) {
            setCalculation(null);
            setCalculationError("Please enter a valid loan amount, interest rate, and tenure.");
            return;
        }

        setCalculation(calculateEMI(principal, annualInterestRate, tenureMonths));
        setCalculationError("");
    };

    const handleAssistanceClick = () => {
        if (!scheme?.id && !scheme?.name) {
            setAssistanceState({
                status: "error",
                message: "This scheme is unavailable, so assistance cannot be loaded.",
                places: [],
                coordinates: null,
            });
            return;
        }

        if (!navigator.geolocation) {
            setAssistanceState({
                status: "error",
                message: "Location is unavailable in this browser. Please try a browser with location support.",
                places: [],
                coordinates: null,
            });
            return;
        }

        setAssistanceState({
            status: "loading",
            message: "Finding assistance near you...",
            places: [],
            coordinates: null,
        });

        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            const coordinates = {
                latitude: coords.latitude,
                longitude: coords.longitude,
            };
            const params = new URLSearchParams({
                lat: String(coordinates.latitude),
                lng: String(coordinates.longitude),
                schemeId: scheme.id || "",
                schemeName: scheme.name || "",
            });
            const requestUrl = `${API_BASE_URL}/api/partners/nearby?${params.toString()}`;

            console.log("Selected scheme:", scheme);
            console.log("Latitude:", coordinates.latitude);
            console.log("Longitude:", coordinates.longitude);
            console.log("Request URL:", requestUrl);

            try {
                const response = await fetch(requestUrl);
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error || "Unable to load nearby assistance.");

                const places = Array.isArray(data.places) ? data.places : [];
                setAssistanceState({
                    status: places.length > 0 ? "success" : "empty",
                    message: places.length > 0
                        ? `Nearby assistance for ${scheme.name || "this scheme"}`
                        : `No nearby assistance was found for ${scheme.name || "this scheme"} within 25 km of your current location.`,
                    places,
                    coordinates,
                });
            } catch (error) {
                setAssistanceState({
                    status: "error",
                    message: `API request failed: ${error.message || "Unable to load nearby assistance. Please try again."}`,
                    places: [],
                    coordinates,
                });
            }
        }, (error) => {
            const message = error.code === 1
                ? "Location access is required to find nearby assistance."
                : "Your location is unavailable. Please check browser location settings and try again.";
            setAssistanceState({
                status: "error",
                message,
                places: [],
                coordinates: null,
            });
        }, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
        });
    };

    if (!scheme) {
        return (
            <div className="ys-details-page">
                <style>{`
                    .ys-details-page { min-height: 100vh; background: #f8fafc; padding: 40px 20px; font-family: Inter, sans-serif; }
                    .ys-empty-box { max-width: 600px; margin: 60px auto; background: #fff; padding: 40px; border-radius: 20px; border: 1px solid #e2e8f0; text-align: center; }
                    .ys-empty-box h1 { font-size: 1.5rem; color: #0f172a; margin-bottom: 20px; }
                    .ys-back-btn { background: #ea580c; color: #fff; border: 0; padding: 12px 24px; border-radius: 10px; font-weight: 700; cursor: pointer; }
                `}</style>
                <div className="ys-empty-box">
                    <h1>Scheme details are unavailable.</h1>
                    <button className="ys-back-btn" onClick={onBack}>
                        ← Back to Scheme Results
                    </button>
                </div>
            </div>
        );
    }

    const status = statusLabels[scheme.eligible] || statusLabels.needs_verification;
    const reasons = Array.isArray(scheme.reasons) ? scheme.reasons : [];
    const warnings = Array.isArray(scheme.warnings) ? scheme.warnings : [];
    const benefits = Array.isArray(scheme.benefits) ? scheme.benefits : [];

    return (
        <div className="ys-details-page">
            <style>{`
                .ys-details-page {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
                    color: #0f172a;
                    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    padding: 32px 20px 80px;
                    -webkit-font-smoothing: antialiased;
                }

                .ys-details-shell {
                    max-width: 1140px;
                    margin: 0 auto;
                }

                /* Nav */
                .ys-details-nav {
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
                    border: 1px solid #e2e8f0;
                    color: #1e293b;
                    border-radius: 10px;
                    padding: 10px 18px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                    transition: all 0.2s ease;
                }

                .ys-back-btn:hover {
                    background: #f8fafc;
                    border-color: #cbd5e1;
                    transform: translateX(-2px);
                }

                .ys-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    color: #1d4ed8;
                    border-radius: 999px;
                    padding: 6px 14px;
                    font-size: 12px;
                    font-weight: 700;
                    letter-spacing: 0.04em;
                    text-transform: uppercase;
                }

                /* Hero */
                .ys-hero {
                    background: #0f172a;
                    background-image: radial-gradient(at 100% 0%, rgba(234, 88, 12, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, rgba(37, 99, 235, 0.12) 0px, transparent 50%);
                    color: #ffffff;
                    border-radius: 22px;
                    padding: 36px 40px;
                    margin-bottom: 28px;
                    box-shadow: 0 10px 30px -5px rgba(15, 23, 42, 0.18);
                    position: relative;
                    overflow: hidden;
                }

                .ys-hero-eyebrow {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #fb923c;
                    font-size: 12px;
                    font-weight: 800;
                    letter-spacing: 0.12em;
                    text-transform: uppercase;
                    margin-bottom: 12px;
                }

                .ys-hero h1 {
                    margin: 0 0 12px;
                    font-size: clamp(1.85rem, 2.5vw, 2.45rem);
                    font-weight: 800;
                    line-height: 1.2;
                    letter-spacing: -0.02em;
                }

                .ys-hero p {
                    margin: 0 0 28px;
                    color: #94a3b8;
                    font-size: 15px;
                    line-height: 1.6;
                    max-width: 680px;
                }

                /* Step Indicator */
                .ys-step-indicator {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 14px;
                    padding: 12px 20px;
                    width: fit-content;
                    backdrop-filter: blur(8px);
                }

                .ys-step-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #94a3b8;
                }

                .ys-step-badge {
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    display: grid;
                    place-items: center;
                    font-size: 11px;
                    font-weight: 800;
                    background: #334155;
                    color: #cbd5e1;
                }

                .ys-step-badge.done {
                    background: #16a34a;
                    color: #ffffff;
                }

                .ys-step-item.active {
                    color: #ffffff;
                }

                .ys-step-item.active .ys-step-badge {
                    background: #ea580c;
                    color: #ffffff;
                    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.25);
                }

                .ys-step-divider {
                    color: #475569;
                    font-size: 14px;
                }

                /* Master Content Card */
                .ys-card {
                    background: #ffffff;
                    border: 1.5px solid #e2e8f0;
                    border-radius: 22px;
                    box-shadow: 0 4px 25px -3px rgba(15, 23, 42, 0.05);
                    padding: 34px 38px;
                    margin-bottom: 28px;
                }

                .ys-overview-header {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 20px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid #f1f5f9;
                    margin-bottom: 24px;
                }

                .ys-overview-main {
                    flex: 1;
                    min-width: 280px;
                }

                .ys-status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    border-radius: 8px;
                    font-size: 13px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .ys-status-pill.eligible { background: #dcfce7; color: #15803d; }
                .ys-status-pill.needs_verification { background: #fef3c7; color: #b45309; }
                .ys-status-pill.not_eligible { background: #ffe4e6; color: #be123c; }

                .ys-overview-title {
                    margin: 0 0 8px;
                    font-size: 1.6rem;
                    font-weight: 800;
                    color: #0f172a;
                }

                .ys-loan-highlight {
                    font-size: 15px;
                    font-weight: 700;
                    color: #ea580c;
                    margin: 0;
                }

                /* Score Gauge */
                .ys-score-card {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    background: #fffaf5;
                    border: 1px solid #fed7aa;
                    border-radius: 16px;
                    padding: 12px 18px;
                }

                .ys-score-ring {
                    width: 52px;
                    height: 52px;
                    border-radius: 50%;
                    background: conic-gradient(#ea580c var(--progress, 0%), #fed7aa 0deg);
                    display: grid;
                    place-items: center;
                }

                .ys-score-ring-inner {
                    width: 42px;
                    height: 42px;
                    border-radius: 50%;
                    background: #ffffff;
                    display: grid;
                    place-items: center;
                    font-size: 13px;
                    font-weight: 800;
                    color: #9a3412;
                }

                /* Sections inside Card */
                .ys-section-block {
                    margin-bottom: 30px;
                    padding-bottom: 26px;
                    border-bottom: 1px solid #f1f5f9;
                }

                .ys-two-col-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
                    gap: 24px;
                    align-items: start;
                }

                .ys-two-col-layout > .ys-section-block {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: 0;
                }

                .ys-section-block:last-child {
                    margin-bottom: 0;
                    padding-bottom: 0;
                    border-bottom: 0;
                }

                .ys-section-title {
                    font-size: 14px;
                    font-weight: 800;
                    color: #334155;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin: 0 0 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                /* Benefit List */
                .ys-benefit-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 10px;
                }

                .ys-benefit-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 12px 16px;
                    font-size: 13.5px;
                    line-height: 1.5;
                    color: #1e293b;
                }

                .ys-check-icon {
                    color: #16a34a;
                    font-weight: 900;
                    flex-shrink: 0;
                }

                /* Match Reasoning & Warning Panels */
                .ys-callout {
                    border-radius: 12px;
                    padding: 16px 20px;
                    margin-top: 10px;
                }

                .ys-callout.reasons {
                    background: #eff6ff;
                    border: 1px solid #dbeafe;
                    color: #1e3a8a;
                }

                .ys-callout.warnings {
                    background: #fffbeb;
                    border: 1px solid #fef3c7;
                    color: #78350f;
                }

                .ys-callout ul {
                    margin: 8px 0 0;
                    padding-left: 20px;
                    font-size: 13.5px;
                    line-height: 1.6;
                }

                /* Application Roadmap */
                .ys-roadmap-list {
                    display: flex;
                    flex-direction: column;
                    gap: 14px;
                }

                .ys-roadmap-step {
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    background: #ffffff;
                    overflow: hidden;
                    transition: border-color 0.2s;
                }

                .ys-roadmap-step:hover {
                    border-color: #cbd5e1;
                }

                .ys-roadmap-step-header {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 16px 20px;
                    background: transparent;
                    border: 0;
                    cursor: pointer;
                    text-align: left;
                    font-family: inherit;
                }

                .ys-roadmap-step-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .ys-roadmap-num {
                    width: 32px;
                    height: 32px;
                    border-radius: 8px;
                    background: #f1f5f9;
                    color: #0f172a;
                    font-size: 13px;
                    font-weight: 800;
                    display: grid;
                    place-items: center;
                }

                .ys-roadmap-step.completed .ys-roadmap-num {
                    background: #dcfce7;
                    color: #15803d;
                }

                .ys-roadmap-title {
                    font-size: 15px;
                    font-weight: 700;
                    color: #0f172a;
                }

                .ys-step-tag {
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 6px;
                }

                .ys-step-tag.completed { background: #dcfce7; color: #15803d; }
                .ys-step-tag.next { background: #fff7ed; color: #ea580c; }
                .ys-step-tag.upcoming { background: #f1f5f9; color: #64748b; }

                .ys-roadmap-detail {
                    padding: 20px;
                    background: #f8fafc;
                    border-top: 1px solid #f1f5f9;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                }

                .ys-roadmap-cell strong {
                    display: block;
                    font-size: 11.5px;
                    font-weight: 700;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                }

                .ys-roadmap-cell p, .ys-roadmap-cell ul {
                    margin: 0;
                    font-size: 13px;
                    color: #1e293b;
                    line-height: 1.5;
                }

                .ys-roadmap-cell ul {
                    padding-left: 18px;
                }

                .ys-roadmap-cell a {
                    color: #ea580c;
                    font-weight: 700;
                    text-decoration: none;
                }

                .ys-roadmap-cell a:hover {
                    text-decoration: underline;
                }

                /* Financial Calculator */
                .ys-calculator-form {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 20px;
                }

                .ys-field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .ys-label {
                    font-size: 13px;
                    font-weight: 700;
                    color: #334155;
                }

                .ys-input {
                    height: 48px;
                    padding: 0 14px;
                    border: 1px solid #cbd5e1;
                    border-radius: 10px;
                    font-size: 14.5px;
                    font-family: inherit;
                    color: #0f172a;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .ys-input:focus {
                    border-color: #ea580c;
                    box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15);
                }

                .ys-calc-btn {
                    height: 48px;
                    background: #ea580c;
                    color: #ffffff;
                    border: 0;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-top: auto;
                }

                .ys-calc-btn:hover {
                    background: #c2410c;
                    transform: translateY(-1px);
                }

                .ys-calc-results {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
                    gap: 16px;
                    background: #fffaf5;
                    border: 1px solid #fed7aa;
                    border-radius: 14px;
                    padding: 22px;
                    margin-bottom: 14px;
                }

                .ys-emi-headline {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }

                .ys-emi-headline span {
                    font-size: 12px;
                    font-weight: 700;
                    color: #9a3412;
                    text-transform: uppercase;
                }

                .ys-emi-headline strong {
                    font-size: 2rem;
                    font-weight: 900;
                    color: #ea580c;
                    margin: 4px 0;
                }

                .ys-emi-headline small {
                    font-size: 12px;
                    color: #78716c;
                }

                .ys-emi-details dl {
                    margin: 0;
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .ys-emi-details dt {
                    font-size: 12px;
                    color: #78716c;
                }

                .ys-emi-details dd {
                    margin: 0;
                    font-size: 13.5px;
                    font-weight: 700;
                    color: #1c1917;
                }

                /* Assistance handoff */
                .ys-assistance-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 18px;
                    flex-wrap: wrap;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    border-radius: 16px;
                    padding: 20px 24px;
                    margin-bottom: 24px;
                }

                .ys-assistance-card strong {
                    display: block;
                    color: #1e3a8a;
                    font-size: 16px;
                    margin-bottom: 4px;
                }

                .ys-assistance-card p {
                    margin: 0;
                    color: #475569;
                    font-size: 13.5px;
                }

                .ys-assistance-btn {
                    display: inline-flex;
                    align-items: center;
                    background: #2563eb;
                    border: 0;
                    border-radius: 10px;
                    color: #ffffff;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 700;
                    padding: 11px 18px;
                    white-space: nowrap;
                }

                .ys-assistance-btn:hover {
                    background: #1d4ed8;
                }

                .ys-assistance-status {
                    flex-basis: 100%;
                    color: #475569;
                    font-size: 13px;
                    margin: 0;
                }

                .ys-assistance-results {
                    display: grid;
                    flex-basis: 100%;
                    gap: 10px;
                    margin-top: 4px;
                }

                .ys-assistance-result {
                    background: #ffffff;
                    border: 1px solid #dbeafe;
                    border-radius: 10px;
                    padding: 12px 14px;
                }

                .ys-assistance-result-head {
                    align-items: center;
                    display: flex;
                    gap: 12px;
                    justify-content: space-between;
                }

                .ys-assistance-result-name {
                    color: #1e3a8a;
                    font-size: 14px;
                    font-weight: 700;
                }

                .ys-assistance-distance {
                    color: #475569;
                    font-size: 12px;
                    white-space: nowrap;
                }

                .ys-assistance-result p {
                    color: #64748b;
                    font-size: 12.5px;
                    margin: 5px 0 8px;
                }

                .ys-assistance-result a {
                    color: #2563eb;
                    font-size: 12.5px;
                    font-weight: 700;
                    text-decoration: none;
                }

                /* Official Portal Action */
                .ys-official-cta-card {
                    background: #fff7ed;
                    border: 1.5px solid #fed7aa;
                    border-radius: 16px;
                    padding: 24px 28px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    flex-wrap: wrap;
                    gap: 16px;
                    margin-top: 14px;
                }

                .ys-official-cta-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #ea580c;
                    color: #ffffff;
                    padding: 13px 26px;
                    border-radius: 12px;
                    font-size: 15px;
                    font-weight: 800;
                    text-decoration: none;
                    box-shadow: 0 4px 14px rgba(234, 88, 12, 0.3);
                    transition: all 0.2s ease;
                }

                .ys-official-cta-btn:hover {
                    background: #c2410c;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(234, 88, 12, 0.4);
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .ys-hero { padding: 26px 20px; border-radius: 18px; }
                    .ys-card { padding: 24px 20px; border-radius: 18px; }
                    .ys-overview-header { flex-direction: column; align-items: flex-start; }
                    .ys-score-card { width: 100%; box-sizing: border-box; }
                    .ys-two-col-layout { grid-template-columns: 1fr; }
                    .ys-official-cta-card { flex-direction: column; align-items: flex-start; }
                    .ys-official-cta-btn { width: 100%; justify-content: center; }
                }
            `}</style>

            <div className="ys-details-shell">
                {/* Navigation Bar */}
                <nav className="ys-details-nav">
                    <button type="button" className="ys-back-btn" onClick={onBack} aria-label="Back to results">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
                        Back to Scheme Results
                    </button>
                    <div className="ys-badge">
                        Verified Government Scheme
                    </div>
                </nav>

                {/* Hero Banner */}
                <header className="ys-hero">
                    <div className="ys-hero-eyebrow">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                        SCHEME BRIEF &amp; EXECUTION ROADMAP
                    </div>
                    <h1>{scheme.name}</h1>
                    <p>
                        Review scheme-specific eligibility checkpoints, potential grant/subsidy assistance, estimated monthly repayment options, and your guided application roadmap.
                    </p>

                    {/* Step Indicator (Results step active) */}
                    <div className="ys-step-indicator" role="navigation" aria-label="Scheme finding steps">
                        <div className="ys-step-item">
                            <span className="ys-step-badge done">✓</span>
                            <span>Profile</span>
                        </div>
                        <span className="ys-step-divider">→</span>
                        <div className="ys-step-item">
                            <span className="ys-step-badge done">✓</span>
                            <span>Matching</span>
                        </div>
                        <span className="ys-step-divider">→</span>
                        <div className="ys-step-item active">
                            <span className="ys-step-badge">3</span>
                            <span>Results</span>
                        </div>
                    </div>
                </header>

                {/* Master Details Card */}
                <main className="ys-card">
                    {/* Overview Header */}
                    <div className="ys-overview-header">
                        <div className="ys-overview-main">
                            <div className={`ys-status-pill ${status.tone}`}>
                                <span>{status.icon}</span>
                                <span>{status.label}</span>
                            </div>
                            <h2 className="ys-overview-title">{scheme.name}</h2>
                            <p className="ys-loan-highlight">
                                💼 Financial Assistance: {scheme.loanRange || "Verify official scheme details"}
                            </p>
                        </div>

                        <div className="ys-score-card">
                            <div
                                className="ys-score-ring"
                                style={{
                                    "--progress": `${Math.min(100, Number(scheme.score ?? 0))}%`,
                                }}
                            >
                                <div className="ys-score-ring-inner">
                                    {scheme.score ?? 0}%
                                </div>
                            </div>
                            <div>
                                <strong style={{ display: "block", fontSize: "12px", color: "#1c1917" }}>Match Score</strong>
                                <small style={{ color: "#78716c", fontSize: "11px" }}>Profile Alignment</small>
                            </div>
                        </div>
                    </div>

                    {/* Section 1: Potential Benefits */}
                    <section className="ys-section-block">
                        <h3 className="ys-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                            Potential Scheme Benefits
                        </h3>
                        {benefits.length > 0 ? (
                            <ul className="ys-benefit-list">
                                {benefits.map((benefit) => (
                                    <li key={benefit} className="ys-benefit-item">
                                        <span className="ys-check-icon">✓</span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: "#64748b", fontSize: "13.5px" }}>No specific benefits stated in scheme parameters.</p>
                        )}
                    </section>

                    {/* Section 2: Why This Scheme Matched & Verification */}
                    <div className="ys-two-col-layout">
                        <section className="ys-section-block">
                            <h3 className="ys-section-title">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                Eligibility Analysis
                            </h3>

                            {reasons.length > 0 ? (
                                <div className="ys-callout reasons">
                                    <strong>Why this scheme matched your profile:</strong>
                                    <ul>
                                        {reasons.map((reason) => <li key={reason}>{reason}</li>)}
                                    </ul>
                                </div>
                            ) : null}

                            {warnings.length > 0 ? (
                                <div className="ys-callout warnings">
                                    <strong>Key verification checkpoints to satisfy:</strong>
                                    <ul>
                                        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
                                    </ul>
                                </div>
                            ) : null}
                        </section>

                        {/* Section 3: Guided Application Roadmap */}
                        <section className="ys-section-block">
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                <h3 className="ys-section-title" style={{ margin: 0 }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                                    Application Journey
                                </h3>
                                <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                                    {progressLabel}
                                </span>
                            </div>

                            <div className="ys-roadmap-list">
                                {roadmapStepStates.map((step, index) => {
                                    const isExpanded = expandedStep === step.id;
                                    const isCompleted = step.status === "completed";
                                    const isNext = step.status === "next";

                                    return (
                                        <div key={step.id} className={`ys-roadmap-step ${step.status}`}>
                                            <button
                                                type="button"
                                                className="ys-roadmap-step-header"
                                                onClick={() => setExpandedStep(isExpanded ? "" : step.id)}
                                            >
                                                <div className="ys-roadmap-step-info">
                                                    <span className="ys-roadmap-num">{isCompleted ? "✓" : index + 1}</span>
                                                    <span className="ys-roadmap-title">{step.title}</span>
                                                </div>
                                                <span className={`ys-step-tag ${step.status}`}>
                                                    {isCompleted ? "Completed" : isNext ? "Next Step" : "Upcoming"}
                                                </span>
                                            </button>

                                            {isExpanded ? (
                                                <div className="ys-roadmap-detail">
                                                    <div className="ys-roadmap-cell">
                                                        <strong>What you need</strong>
                                                        {Array.isArray(step.whatYouNeed) ? (
                                                            <ul>
                                                                {step.whatYouNeed.map((item) => <li key={item}>{item}</li>)}
                                                            </ul>
                                                        ) : (
                                                            <p>{step.whatYouNeed}</p>
                                                        )}
                                                    </div>

                                                    <div className="ys-roadmap-cell">
                                                        <strong>Who handles it</strong>
                                                        <p>{step.whoHandlesIt}</p>
                                                    </div>

                                                    <div className="ys-roadmap-cell">
                                                        <strong>Expected next step</strong>
                                                        <p>{step.expectedNext}</p>
                                                    </div>

                                                    <div className="ys-roadmap-cell">
                                                        <strong>Official link</strong>
                                                        {scheme.officialUrl ? (
                                                            <a href={scheme.officialUrl} target="_blank" rel="noreferrer">
                                                                {step.officialLabel || "View Portal Info"} →
                                                            </a>
                                                        ) : (
                                                            <p>Link unavailable</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <section
                        className="ys-assistance-card"
                        data-scheme-id={scheme.id || ""}
                        data-scheme-name={scheme.name || ""}
                    >
                        <div>
                            <strong>Need help applying?</strong>
                            <p>Find nearby assistance for this scheme.</p>
                        </div>
                        <button
                            type="button"
                            className="ys-assistance-btn"
                            onClick={handleAssistanceClick}
                            data-scheme-id={scheme.id || ""}
                            data-scheme-name={scheme.name || ""}
                        >
                            Find Assistance Near Me
                        </button>
                        {assistanceState.status !== "idle" ? (
                            <p className="ys-assistance-status" role="status" aria-live="polite">
                                {assistanceState.message}
                            </p>
                        ) : null}
                        {assistanceState.status === "success" ? (
                            <div className="ys-assistance-results" aria-label={`Nearby assistance for ${scheme.name}`}>
                                {assistanceState.places.map((place) => (
                                    <article className="ys-assistance-result" key={place.placeId || `${place.name}-${place.formattedAddress}`}>
                                        <div className="ys-assistance-result-head">
                                            <span className="ys-assistance-result-name">{place.name || "Assistance centre"}</span>
                                            <span className="ys-assistance-distance">
                                                {Number.isFinite(place.distanceKm) ? `${place.distanceKm.toFixed(1)} km away` : "Distance unavailable"}
                                            </span>
                                        </div>
                                        <p>{place.formattedAddress || "Address unavailable"}</p>
                                        <p>{place.schemeSupport || "Scheme-related assistance search"}</p>
                                        {place.googleMapsUri ? (
                                            <a href={place.googleMapsUri} target="_blank" rel="noreferrer">
                                                Open map location →
                                            </a>
                                        ) : null}
                                    </article>
                                ))}
                            </div>
                        ) : null}
                    </section>

                    {/* Section 4: Loan Repayment Calculator (EMI) */}
                    <section className="ys-section-block">
                        <h3 className="ys-section-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5"><rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="12" x2="6" y2="12" /><line x1="10" y1="12" x2="10" y2="12" /><line x1="14" y1="12" x2="14" y2="12" /><line x1="18" y1="12" x2="18" y2="12" /></svg>
                            Loan Repayment Estimator (EMI)
                        </h3>

                        <form className="ys-calculator-form" onSubmit={handleCalculate}>
                            <div className="ys-field">
                                <label className="ys-label">Loan Amount (₹)</label>
                                <input
                                    className="ys-input"
                                    type="number"
                                    name="loanAmount"
                                    min="0"
                                    step="0.01"
                                    value={calculatorInputs.loanAmount}
                                    onChange={handleCalculatorChange}
                                    placeholder="e.g. 500000"
                                />
                            </div>

                            <div className="ys-field">
                                <label className="ys-label">Annual Interest Rate (%)</label>
                                <input
                                    className="ys-input"
                                    type="number"
                                    name="annualInterestRate"
                                    min="0"
                                    step="0.01"
                                    value={calculatorInputs.annualInterestRate}
                                    onChange={handleCalculatorChange}
                                    placeholder="e.g. 8.5"
                                />
                            </div>

                            <div className="ys-field">
                                <label className="ys-label">Tenure (Months)</label>
                                <input
                                    className="ys-input"
                                    type="number"
                                    name="tenureMonths"
                                    min="1"
                                    step="1"
                                    value={calculatorInputs.tenureMonths}
                                    onChange={handleCalculatorChange}
                                    placeholder="e.g. 36"
                                />
                            </div>

                            <button type="submit" className="ys-calc-btn">
                                Calculate Repayment
                            </button>
                        </form>

                        {calculationError ? (
                            <p style={{ color: "#dc2626", fontSize: "13px", margin: "0 0 14px" }}>⚠️ {calculationError}</p>
                        ) : null}

                        {calculation ? (
                            <div className="ys-calc-results">
                                <div className="ys-emi-headline">
                                    <span>Estimated Monthly EMI</span>
                                    <strong>{currencyFormatter.format(calculation.monthlyEMI)}</strong>
                                    <small>≈ {currencyFormatter.format(Math.round(calculation.monthlyEMI / 30))}/day equivalent</small>
                                </div>

                                <div className="ys-emi-details">
                                    <dl>
                                        <div>
                                            <dt>Total Principal</dt>
                                            <dd>{currencyFormatter.format(Number(calculatorInputs.loanAmount))}</dd>
                                        </div>
                                        <div>
                                            <dt>Interest Rate</dt>
                                            <dd>{Number(calculatorInputs.annualInterestRate)}% p.a.</dd>
                                        </div>
                                        <div>
                                            <dt>Total Interest</dt>
                                            <dd>{currencyFormatter.format(calculation.totalInterest)}</dd>
                                        </div>
                                        <div>
                                            <dt>Total Repayment</dt>
                                            <dd>{currencyFormatter.format(calculation.totalPayable)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        ) : null}

                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                            * EMI calculations are illustrative. Actual lending terms, interest subsidies, and repayment moratoriums are governed by the sanctioning bank.
                        </p>
                    </section>

                    {/* Official Scheme Website CTA */}
                    <div className="ys-official-cta-card">
                        <div>
                            <strong style={{ display: "block", fontSize: "16px", color: "#9a3412", marginBottom: 4 }}>
                                Ready to Apply Officially?
                            </strong>
                            <span style={{ fontSize: "13.5px", color: "#78716c" }}>
                                Proceed to the verified government portal to register your official application.
                            </span>
                        </div>

                        {scheme.officialUrl ? (
                            <a
                                className="ys-official-cta-btn"
                                href={scheme.officialUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                Open Official Scheme Portal →
                            </a>
                        ) : (
                            <span style={{ fontSize: "13px", color: "#9a3412" }}>
                                Official portal link not configured
                            </span>
                        )}
                    </div>
                </main>
            </div>

        </div>
    );
}

export default SchemeDetails;
