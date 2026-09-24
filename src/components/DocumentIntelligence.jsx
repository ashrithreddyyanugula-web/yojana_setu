import { useMemo, useState } from "react";
import {
    analyzeDocument,
    comparisonStatusLabels,
    formatDocumentField,
    statuses,
} from "../utils/documentService";

const documentTypeLabels = {
    aadhaar: "Aadhaar Card",
    pan: "PAN Card",
    udyam: "Udyam Registration",
    bank: "Bank Statement",
    category: "Category Certificate",
};

function DocumentIntelligence({ profile, onAnalysisChange }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStage, setProcessingStage] = useState("Awaiting upload");
    const [errorMessage, setErrorMessage] = useState("");

    const overallStatus = useMemo(() => {
        if (!analysis) return null;
        return statuses[analysis.overallStatus] || statuses.needs_review;
    }, [analysis]);

    const processFile = async (file) => {
        if (!file) return;

        const result = analyzeDocument(file, profile || {});

        if (result.error) {
            setErrorMessage(result.error);
            setAnalysis(null);
            onAnalysisChange?.(null);
            setIsProcessing(false);
            return;
        }

        setIsProcessing(false);
        setErrorMessage("");
        setAnalysis(result);
        onAnalysisChange?.(result);
    };

    const handleFileSelection = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setErrorMessage("");
        setAnalysis(null);
        setIsProcessing(true);
        setProcessingStage("Uploading document...");

        await new Promise((resolve) => setTimeout(resolve, 450));
        setProcessingStage("Reading document...");

        await new Promise((resolve) => setTimeout(resolve, 450));
        setProcessingStage("Extracting information...");

        await new Promise((resolve) => setTimeout(resolve, 450));
        setProcessingStage("Comparing with profile...");

        await processFile(file);
    };

    const handleDrop = async (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (!file) return;

        const input = document.getElementById("document-upload-input");
        if (input) input.files = event.dataTransfer.files;

        await handleFileSelection({ target: { files: event.dataTransfer.files } });
    };

    const extractedEntries = analysis ? Object.entries(analysis.extractedFields || {}) : [];

    return (
        <section className="document-intelligence-card">
            <div className="document-intelligence-header">
                <div>
                    <span className="eyebrow">Document Intelligence</span>
                    <h3>Upload a supporting document</h3>
                </div>
            </div>

            <div
                className="document-upload-zone"
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
            >
                <div className="document-upload-icon">📄</div>
                <div className="document-upload-copy">
                    <strong>Upload Document</strong>
                    <p>Upload Aadhaar, PAN, Udyam Registration, Bank Statement, Category Certificate, or other supporting documents.</p>
                </div>
                <label className="primary-btn document-upload-button">
                    <input
                        id="document-upload-input"
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,image/png,image/jpeg,application/pdf"
                        onChange={handleFileSelection}
                    />
                    Choose File
                </label>
            </div>

            {errorMessage ? (
                <div className="status-box error">{errorMessage}</div>
            ) : null}

            {isProcessing ? (
                <div className="processing-state" aria-live="polite">
                    <div className="processing-spinner" aria-hidden="true" />
                    <div>
                        <strong>{processingStage}</strong>
                        <p>Document analysis runs in the browser using a local service abstraction for future OCR integration.</p>
                    </div>
                </div>
            ) : null}

            {selectedFile && !isProcessing && !analysis ? (
                <div className="status-box">Document selected: {selectedFile.name}</div>
            ) : null}

            {analysis ? (
                <>
                    <div className="document-analysis-summary">
                        <div className="document-type-box">
                            <span className="document-type-label">Document detected</span>
                            <strong>{analysis.documentType}</strong>
                        </div>

                        {analysis.ocrStatus === "not_configured" ? (
                            <div className="document-type-box muted">
                                <span className="document-type-label">Processing status</span>
                                <strong>OCR service not configured</strong>
                            </div>
                        ) : null}
                    </div>

                    <div className="extracted-fields-panel">
                        <h4>Extracted Information</h4>
                        <div className="fields-grid">
                            {extractedEntries.length > 0 ? (
                                extractedEntries.map(([key, value]) => (
                                    <div className="field-card" key={key}>
                                        <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (char) => char.toUpperCase())}</span>
                                        <strong>{formatDocumentField(key, value)}</strong>
                                    </div>
                                ))
                            ) : (
                                <p className="empty-meta">No extracted fields were returned for this document type.</p>
                            )}
                        </div>
                    </div>

                    <div className="comparison-panel">
                        <h4>Profile ↔ Document Cross-check</h4>
                        <div className="comparison-table-wrap">
                            <table className="comparison-table">
                                <thead>
                                    <tr>
                                        <th>Field</th>
                                        <th>Profile</th>
                                        <th>Document</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.comparisonRows.map((row) => (
                                        <tr key={row.label}>
                                            <td>{row.label}</td>
                                            <td>{row.profileValue}</td>
                                            <td>{row.documentValue}</td>
                                            <td>
                                                <span className={`comparison-status ${row.status}`}>
                                                    {comparisonStatusLabels[row.status]}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {overallStatus ? (
                        <div className={`document-overall-status ${overallStatus.className}`}>
                            <span className="status-icon" aria-hidden="true">{overallStatus.className === "consistent" ? "✓" : overallStatus.className === "needs_review" ? "!" : "✕"}</span>
                            {overallStatus.label}
                        </div>
                    ) : null}

                    <p className="privacy-note">Documents are processed only for eligibility assistance. Sensitive information is masked where appropriate.</p>
                    <p className="status-box">{analysis.note}</p>
                </>
            ) : null}
        </section>
    );
}

export default DocumentIntelligence;
