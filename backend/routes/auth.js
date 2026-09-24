const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user");

const router = express.Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const publicUser = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || "",
    authProvider: user.authProvider || "local",
});

const signToken = (user) => jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || "development-secret",
    { expiresIn: "7d" }
);

// REGISTER
router.post("/register", async (req, res) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if (!name || !email || !password || password.length < 8) {
            return res.status(400).json({ error: "Name, a valid email, and a password of at least 8 characters are required." });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({ error: "An account with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            authProvider: "local",
        });

        await user.save();

        res.status(201).json({ message: "Registration successful.", token: signToken(user), user: publicUser(user) });

    } catch (error) {
        res.status(500).json({
            message: "Server error"
        });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password) return res.status(400).json({ error: "Email and password are required." });

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || "development-secret",
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token: signToken(user),
            user: publicUser(user)
        });

    } catch (error) {
        res.status(500).json({ error: "Unable to sign in right now." });
    }
});

router.post("/google", async (req, res) => {
    console.log("[GOOGLE AUTH] route reached");
    console.log("[GOOGLE AUTH] credential received:", Boolean(req.body?.credential));

    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.log("[GOOGLE AUTH] returning 503: Google sign-in is not configured");
            return res.status(503).json({ error: "Google sign-in is not configured." });
        }

        const credential = req.body?.credential;
        if (!credential) {
            console.log("[GOOGLE AUTH] returning 400: Google credential is required");
            return res.status(400).json({ error: "Google credential is required." });
        }

        console.log("[GOOGLE AUTH] verifying Google token");
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        console.log("[GOOGLE AUTH] Google token verified");
        const payload = ticket.getPayload();
        const allowedIssuers = new Set(["accounts.google.com", "https://accounts.google.com"]);

        if (!payload?.sub || !payload.email || !payload.name || payload.email_verified !== true) {
            console.log("[GOOGLE AUTH] returning 401: Google account verification failed");
            return res.status(401).json({ error: "Google account verification failed." });
        }

        if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
            console.log("[GOOGLE AUTH] returning 401: Google client ID mismatch");
            return res.status(401).json({ error: "Google client ID mismatch." });
        }

        if (!allowedIssuers.has(payload.iss)) {
            console.log("[GOOGLE AUTH] returning 401: Google issuer verification failed");
            return res.status(401).json({ error: "Google issuer verification failed." });
        }

        if (payload.exp && Number(payload.exp) < Math.floor(Date.now() / 1000)) {
            console.log("[GOOGLE AUTH] returning 401: Google token has expired");
            return res.status(401).json({ error: "Google token has expired." });
        }

        let user = await User.findOne({ googleId: payload.sub });
        if (!user) user = await User.findOne({ email: payload.email.toLowerCase() });

        if (user) {
            const updates = {};
            if (!user.googleId) updates.googleId = payload.sub;
            if (payload.picture && (!user.profileImage || user.profileImage !== payload.picture)) {
                updates.profileImage = payload.picture;
            }
            if (!user.authProvider || user.authProvider === "local") {
                updates.authProvider = "google";
            }
            if (Object.keys(updates).length > 0) {
                Object.assign(user, updates);
                await user.save();
            }
        } else {
            user = await User.create({
                name: payload.name || payload.email.split("@")[0],
                email: payload.email.toLowerCase(),
                googleId: payload.sub,
                profileImage: payload.picture || "",
                authProvider: "google",
            });
        }

        console.log("[GOOGLE AUTH] login successful");
        return res.json({
            message: "Google sign-in successful",
            token: signToken(user),
            user: publicUser(user),
        });
    } catch (error) {
        console.error("Google sign-in verification error:", error);
        return res.status(401).json({ error: "Google sign-in failed. Please try again." });
    }
});

router.post("/reset-password", async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;
        if (!email || !password || password.length < 8) return res.status(400).json({ error: "Enter your email and a password of at least 8 characters." });
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "No account was found for this email." });
        user.password = await bcrypt.hash(password, 10);
        await user.save();
        res.json({ message: "Password updated. You can now sign in." });
    } catch (error) {
        res.status(500).json({ error: "Unable to reset your password right now." });
    }
});

module.exports = router;
