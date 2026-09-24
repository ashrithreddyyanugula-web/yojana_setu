import GoogleTranslate from "./GoogleTranslate";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import brandMark from "./assets/yojana_setu_header_logo.png";
import Home from "./pages/home";
import Profile from "./pages/Profile";
import SchemeResults from "./pages/SchemeResults";
import SchemeDetails from "./pages/SchemeDetails";
import { matchSchemes } from "./utils/schemeMatcher";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
const HAS_VALID_GOOGLE_CLIENT_ID = Boolean(GOOGLE_CLIENT_ID)
    && GOOGLE_CLIENT_ID.trim().length > 0
    && !/YOUR_GOOGLE|example|placeholder/i.test(GOOGLE_CLIENT_ID);
const SESSION_KEYS = {
    currentPage: "yojana-setu-current-page",
    authMode: "yojana-setu-auth-mode",
    profileData: "yojana-setu-profile-data",
    documentAnalysis: "yojana-setu-document-analysis",
    selectedScheme: "yojana-setu-selected-scheme",
};

const ROUTE_PAGES = new Set(["landing", "login", "signup", "profile", "results", "details"]);

const readRoute = () => {
    const hash = window.location.hash.replace(/^#/, "");
    const [page, encodedSchemeId] = hash.split("/");

    if (!ROUTE_PAGES.has(page)) {
        return { page: null, schemeId: null };
    }

    let schemeId = null;
    if (page === "details" && encodedSchemeId) {
        try {
            schemeId = decodeURIComponent(encodedSchemeId);
        } catch {
            schemeId = null;
        }
    }

    return { page, schemeId };
};

const routeHash = (page, scheme) => {
    if (page === "details" && scheme?.id) {
        return `#details/${encodeURIComponent(scheme.id)}`;
    }

    return `#${page}`;
};

const readSessionValue = (key, fallback) => {
    try {
        const value = sessionStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch {
        return fallback;
    }
};

const writeSessionValue = (key, value) => {
    try {
        if (value === null || value === undefined) {
            sessionStorage.removeItem(key);
        } else {
            sessionStorage.setItem(key, JSON.stringify(value));
        }
    } catch {
    }
};

function App() {
    const [currentPage, setCurrentPageState] = useState(() =>
        readRoute().page || readSessionValue(SESSION_KEYS.currentPage, "landing")
    );
    const [profileData, setProfileData] = useState(() => readSessionValue(SESSION_KEYS.profileData, null));
    const [documentAnalysis, setDocumentAnalysis] = useState(() => readSessionValue(SESSION_KEYS.documentAnalysis, null));
    const [selectedScheme, setSelectedScheme] = useState(() => readSessionValue(SESSION_KEYS.selectedScheme, null));
    const [authMode, setAuthMode] = useState(() => readRoute().page === "signup"
        ? "signup"
        : readSessionValue(SESSION_KEYS.authMode, "login"));
    const [showPassword, setShowPassword] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return Boolean(localStorage.getItem("yojana-setu-token"));
    });
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("yojana-setu-user")) || null;
        } catch {
            return null;
        }
    });
    const googleButtonRef = useRef(null);
    const googleInitializedRef = useRef(false);
    const handleGoogleCredentialRef = useRef(null);
    const routeInitializedRef = useRef(false);
    const [conversation, setConversation] = useState([]);
    const [copilotProfile, setCopilotProfile] = useState({});

    const navigate = (page, scheme = selectedScheme) => {
        const nextHash = routeHash(page, scheme);
        if (window.location.hash !== nextHash) {
            window.history.pushState({ page }, "", nextHash);
        }
        setCurrentPageState(page);
    };

    useEffect(() => {
        const applyRoute = () => {
            const route = readRoute();
            let page = route.page;

            if (!page && !routeInitializedRef.current) {
                page = readSessionValue(SESSION_KEYS.currentPage, "landing");
                window.history.replaceState({ page }, "", routeHash(page, selectedScheme));
            }

            page = page || "landing";
            routeInitializedRef.current = true;
            setCurrentPageState(page);

            if (page === "login" || page === "signup") {
                setAuthMode(page);
            }

            if (page === "details" && route.schemeId) {
                setSelectedScheme((currentScheme) => {
                    if (currentScheme?.id === route.schemeId) return currentScheme;
                    return matchSchemes(profileData || {}).find((scheme) => scheme.id === route.schemeId) || currentScheme;
                });
            }
        };

        window.addEventListener("popstate", applyRoute);
        window.addEventListener("hashchange", applyRoute);
        return () => {
            window.removeEventListener("popstate", applyRoute);
            window.removeEventListener("hashchange", applyRoute);
        };
    }, [profileData, selectedScheme]);

    const switchAuthMode = (mode) => {
        setAuthMode(mode);
        setShowPassword(false);
        clearStatus();
        if (mode === "login" || mode === "signup") {
            navigate(mode);
        }
    };

    const openAuth = (mode) => {
        setAuthMode(mode);
        setShowPassword(false);
        clearStatus();
        navigate(mode);
    };

    const handleOpenProfile = () => {
        if (isLoggedIn) {
            navigate("profile");
            return;
        }

        setAuthMode("login");
        navigate("login");
    };

    const handleViewScheme = (scheme) => {
        setSelectedScheme(scheme);
        navigate("details", scheme);
    };

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [status, setStatus] = useState({ type: "", message: "" });
    const [message, setMessage] = useState("");
    const [reply, setReply] = useState("");
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleScriptReady, setGoogleScriptReady] = useState(false);
    const { t } = useTranslation();

    useEffect(() => writeSessionValue(SESSION_KEYS.currentPage, currentPage), [currentPage]);
    useEffect(() => writeSessionValue(SESSION_KEYS.authMode, authMode), [authMode]);
    useEffect(() => writeSessionValue(SESSION_KEYS.profileData, profileData), [profileData]);
    useEffect(() => writeSessionValue(SESSION_KEYS.documentAnalysis, documentAnalysis), [documentAnalysis]);
    useEffect(() => writeSessionValue(SESSION_KEYS.selectedScheme, selectedScheme), [selectedScheme]);

    useEffect(() => {
        if (!isLoggedIn) {
            localStorage.removeItem("yojana-setu-token");
            localStorage.removeItem("yojana-setu-user");
        }
    }, [isLoggedIn]);

    const handleFieldChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const clearStatus = () => setStatus({ type: "", message: "" });

    const handleGoogleCredential = async (credential) => {
        clearStatus();
        setGoogleLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Google sign-in failed.");

            localStorage.setItem("yojana-setu-token", data.token);
            localStorage.setItem("yojana-setu-user", JSON.stringify(data.user));
            setUser(data.user);
            setIsLoggedIn(true);
            navigate("landing");
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        } catch (error) {
            setStatus({ type: "error", message: error.message || "Google sign-in failed. Please try again." });
        } finally {
            setGoogleLoading(false);
        }
    };

    handleGoogleCredentialRef.current = handleGoogleCredential;

    useEffect(() => {
        if (currentPage !== "login" && currentPage !== "signup") {
            setGoogleScriptReady(false);
            if (googleButtonRef.current) {
                googleButtonRef.current.innerHTML = "";
            }
            return undefined;
        }

        if (!HAS_VALID_GOOGLE_CLIENT_ID) {
            setGoogleScriptReady(false);
            setStatus({
                type: "error",
                message: "Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID to your real Google OAuth Web Client ID.",
            });
            return undefined;
        }

        const setupGoogleSignIn = () => {
            if (!window.google?.accounts?.id) {
                setGoogleScriptReady(false);
                return;
            }

            if (!googleInitializedRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: ({ credential }) => {
                        if (credential && handleGoogleCredentialRef.current) {
                            handleGoogleCredentialRef.current(credential);
                        }
                    },
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    context: "signin",
                });
                googleInitializedRef.current = true;
            }

            if (googleButtonRef.current) {
                googleButtonRef.current.innerHTML = "";
                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    type: "standard",
                    theme: "outline",
                    size: "large",
                    text: "continue_with",
                    shape: "rectangular",
                    logo_alignment: "left",
                    width: "100%",
                });
            }

            setGoogleScriptReady(true);
        };

        if (window.google?.accounts?.id) {
            setupGoogleSignIn();
            return undefined;
        }

        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
            existingScript.addEventListener("load", setupGoogleSignIn, { once: true });
            return undefined;
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = setupGoogleSignIn;
        script.onerror = () => {
            setGoogleScriptReady(false);
            setStatus({ type: "error", message: "Google sign-in script failed to load. Please refresh the page and try again." });
        };
        document.head.appendChild(script);
        return undefined;
    }, [currentPage, GOOGLE_CLIENT_ID, HAS_VALID_GOOGLE_CLIENT_ID]);

    const handleLogin = async (event) => {
        event.preventDefault();
        clearStatus();

        if (!formData.email.trim() || !formData.password.trim()) {
            setStatus({ type: "error", message: "Please enter your email and password." });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed.");
            }

            localStorage.setItem("yojana-setu-token", data.token);
            localStorage.setItem("yojana-setu-user", JSON.stringify(data.user));
            setUser(data.user);
            setIsLoggedIn(true);
            navigate("landing");
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        } catch (error) {
            setStatus({ type: "error", message: error.message || "Unable to log in." });
        }
    };

    const handleSignup = async (event) => {
        event.preventDefault();
        clearStatus();

        if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
            setStatus({ type: "error", message: "Please complete all required fields." });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: "error", message: "Passwords do not match." });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Sign up failed.");
            }

            localStorage.setItem("yojana-setu-token", data.token);
            localStorage.setItem("yojana-setu-user", JSON.stringify(data.user));
            setUser(data.user);
            setIsLoggedIn(true);
            navigate("landing");
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        } catch (error) {
            setStatus({ type: "error", message: error.message || "Unable to create account." });
        }
    };

    const handleResetPassword = async (event) => {
        event.preventDefault();
        clearStatus();

        if (!formData.email.trim() || !formData.password.trim()) {
            setStatus({ type: "error", message: "Please enter your email and a new password." });
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setStatus({ type: "error", message: "Passwords do not match." });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Password reset failed.");
            }

            setStatus({ type: "success", message: data.message });
            setAuthMode("login");
            setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        } catch (error) {
            setStatus({ type: "error", message: error.message || "Unable to reset password." });
        }
    };

    const sendMessage = async () => {
        const userMessage = message.trim();

        if (!userMessage || loading) return;

        setLoading(true);
        setReply("");

        // Add the current user message to the existing conversation
        const updatedConversation = [
            ...conversation,
            {
                role: "user",
                content: userMessage,
            },
        ];

        try {
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: userMessage,
                    profile: Profile,
                    conversation: updatedConversation,
                    language: "English",
                }),
            });

            if (!response.ok) {
                throw new Error(`Chat request failed: ${response.status}`);
            }

            const data = await response.json();

            // Save the profile returned by the backend
            if (data.profile) {
                setProfile(data.profile);
            }

            // Save BOTH user message and assistant response
            const finalConversation = [
                ...updatedConversation,
                {
                    role: "assistant",
                    content: data.reply || "",
                },
            ];

            setConversation(finalConversation);

            // Keep your existing reply UI working
            setReply(data.reply || "");

            // Clear input
            setMessage("");

        } catch (error) {
            console.error("Setu Copilot error:", error);

            setReply(
                "Sorry, I couldn't process that request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("yojana-setu-token");
        localStorage.removeItem("yojana-setu-user");
        Object.values(SESSION_KEYS).forEach((key) => sessionStorage.removeItem(key));
        sessionStorage.removeItem("yojana-setu-profile-draft");
        setUser(null);
        setIsLoggedIn(false);
        setAuthMode("login");
        navigate("landing", null);
        setFormData({ name: "", email: "", password: "", confirmPassword: "" });
        setStatus({ type: "", message: "" });
    };

    if (currentPage === "login" || currentPage === "signup") {
        const titleMap = {
            login: { eyebrow: "Welcome back", heading: "Sign in" },
            signup: { eyebrow: "Create account", heading: "Sign up" },
            forgot: { eyebrow: "Reset access", heading: "Forgot password" },
        };

        const current = titleMap[authMode] || titleMap.login;

        return (
            <div className="login-page">
                <div className="login-orb login-orb-one" aria-hidden="true" />
                <div className="login-orb login-orb-two" aria-hidden="true" />
                <div className="login-card">
                    <div className="brand-block">
                        <div className="brand-lockup">
                            <img src={brandMark} alt="Yojana Setu" className="brand-logo" />
                            <span>YOJANA SETU</span>
                        </div>
                        <div className="brand-copy">
                            <span className="brand-badge"><span>✦</span> Government benefits, simplified</span>
                            <h1>Your bridge to<br />every opportunity.</h1>
                            <p>Discover the government schemes that can help your family and business move forward.</p>
                        </div>
                        <div className="trust-list" aria-label="Yojana Setu benefits">
                            <div><span className="trust-icon">✓</span><span>Personalised scheme matches</span></div>
                            <div><span className="trust-icon">✓</span><span>Guidance in your language</span></div>
                            <div><span className="trust-icon">✓</span><span>Private and secure access</span></div>
                        </div>
                        <p className="brand-credit">A digital public service initiative</p>
                    </div>

                    <div className="login-form-wrap">
                        <div className="form-topline">
                            <span>Secure access</span>
                            <span className="secure-pill"><span>●</span> Protected</span>
                        </div>

                        <form
                            className="login-form"
                            onSubmit={
                                authMode === "login"
                                    ? handleLogin
                                    : authMode === "signup"
                                        ? handleSignup
                                        : handleResetPassword
                            }
                        >
                            <div className="form-header">
                                <span className="eyebrow">{current.eyebrow}</span>
                                <h2>{current.heading}</h2>
                                <p>{authMode === "login" ? "Enter your details to access your scheme dashboard." : authMode === "signup" ? "Create your free account to get started." : "Set a new password to regain access to your account."}</p>
                            </div>

                            {authMode === "signup" ? (
                                <label>
                                    Full name
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleFieldChange}
                                        placeholder="Enter your full name"
                                    />
                                </label>
                            ) : null}

                            <label>
                                Email address
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleFieldChange}
                                    placeholder="name@example.com"
                                />
                            </label>

                            <label>
                                {authMode === "forgot" ? "New password" : "Password"}
                                <div className="password-field">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleFieldChange}
                                        placeholder={authMode === "forgot" ? "Enter a new password" : "Enter your password"}
                                    />
                                    <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
                                        {showPassword ? "Hide" : "Show"}
                                    </button>
                                </div>
                            </label>

                            {authMode !== "login" ? (
                                <label>
                                    Confirm password
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleFieldChange}
                                        placeholder="Re-enter your password"
                                    />
                                </label>
                            ) : (
                                <div className="form-row">
                                    <label className="checkbox-row">
                                        <input type="checkbox" />
                                        <span>Remember me</span>
                                    </label>
                                    <button
                                        type="button"
                                        className="link-button"
                                        onClick={() => {
                                            setAuthMode("forgot");
                                            clearStatus();
                                        }}
                                    >
                                        Forgot password?
                                    </button>
                                </div>
                            )}

                            {status.message ? (
                                <div className={`status-box ${status.type}`}>{status.message}</div>
                            ) : null}

                            <button type="submit" className="primary-btn">
                                {authMode === "login"
                                    ? "Sign in"
                                    : authMode === "signup"
                                        ? "Create account"
                                        : "Reset password"}
                            </button>

                            {authMode === "login" || authMode === "signup" ? (
                                <div className="google-auth-section">
                                    <div className="auth-divider"><span>or</span></div>
                                    <div
                                        ref={googleButtonRef}
                                        className="google-auth-button"
                                        aria-label="Continue with Google"
                                    />
                                    {!googleScriptReady && HAS_VALID_GOOGLE_CLIENT_ID ? (
                                        <div className="status-box">Loading Google sign-in...</div>
                                    ) : null}
                                </div>
                            ) : null}

                            {authMode === "login" ? (
                                <div className="auth-footer">
                                    <span>Need an account?</span>
                                    <button type="button" className="text-link" onClick={() => switchAuthMode("signup")}>
                                        Create one here
                                    </button>
                                </div>
                            ) : (
                                <div className="auth-footer">
                                    <span>Already have an account?</span>
                                    <button type="button" className="text-link" onClick={() => switchAuthMode("login")}>
                                        Sign in
                                    </button>
                                </div>
                            )}

                            <p className="terms-note">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
                        </form>
                    </div>
                </div>
            </div>
        );
    }
    if (currentPage === "results") {
        return (
            <SchemeResults
                profile={profileData}
                documentAnalysis={documentAnalysis}
                onDocumentAnalysisChange={setDocumentAnalysis}
                onBack={() => navigate("profile")}
                onViewScheme={handleViewScheme}
            />
        );
    }
    if (currentPage === "details") {
        return (
            <SchemeDetails
                scheme={selectedScheme}
                profile={profileData}
                documentAnalysis={documentAnalysis}
                loanAmount={profileData?.loanAmount}
                onBack={() => {
                    setSelectedScheme(null);
                    navigate("results", null);
                }}
            />
        );
    }
    if (currentPage === "profile") {
        return (
            <Profile
                onBack={() => navigate("landing", null)}
                onFindSchemes={(profile) => {
                    console.log("Entrepreneur Profile:", profile);

                    setProfileData(profile);
                    setDocumentAnalysis(null);
                    navigate("results");
                }}
            />
        );
    }

    if (currentPage === "landing") {
        return (
            <Home
                user={user}
                profileLocation={{ state: profileData?.state || "", district: profileData?.district || "" }}
                onLogin={() => openAuth("login")}
                onSignup={() => openAuth("signup")}
                onOpenProfile={handleOpenProfile}
                onLogout={handleLogout}
            />
        );
    }

    return null;
}

export default App;