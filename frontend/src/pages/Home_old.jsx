import GoogleTranslate from "../GoogleTranslate";
import { useTranslation } from "react-i18next";

function Home({ user, onLogout, onOpenProfile }) {
    const { t } = useTranslation();

    return (
        <div className="app-shell">
            <header className="topbar">
                <div>
                    <p className="topbar-label">Government scheme assistant</p>
                    <h2>Yojana Setu</h2>
                </div>

                <div className="topbar-actions">
                    <GoogleTranslate />

                    <button className="primary-btn" onClick={onOpenProfile}>
                        Find My Scheme
                    </button>

                    <button
                        className="logout-btn"
                        onClick={onLogout}
                    >
                        Log out
                    </button>
                </div>
            </header>

            <main className="dashboard-panel">
                <div className="welcome-card">
                    <span className="eyebrow">Welcome</span>
                    <h1>{t("welcome") || "Welcome to Yojana Setu"}</h1>
                    <p>
                        Find government schemes that match your business, understand your eligibility,
                        prepare documents and get application guidance.
                    </p>
                    <button className="primary-btn" onClick={onOpenProfile}>
                        Find My Scheme →
                    </button>
                </div>

                <section className="feature-grid">
                    <div className="feature-card">
                        <span>🔎</span>
                        <h3>AI Scheme Matching</h3>
                        <p>Find schemes based on your personal and business profile.</p>
                    </div>
                    <div className="feature-card">
                        <span>📄</span>
                        <h3>Document Intelligence</h3>
                        <p>Check required documents and extract important information.</p>
                    </div>
                    <div className="feature-card">
                        <span>💰</span>
                        <h3>Financial Guidance</h3>
                        <p>Understand loans, subsidies and estimated EMI.</p>
                    </div>
                    <div className="feature-card">
                        <span>📍</span>
                        <h3>Partner Locator</h3>
                        <p>Find nearby banks, CSCs and application assistance.</p>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Home;    