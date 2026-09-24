const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config({
    path: "./server/.env",
});

const app = express();
const users = new Map();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const createToken = () =>
    `ys_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;

app.get("/api/health", (req, res) => {
    res.json({ ok: true, message: "Yojana Setu API is running" });
});

app.post("/api/signup", (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (users.has(normalizedEmail)) {
        return res.status(409).json({ error: "An account with this email already exists." });
    }

    const user = {
        id: Date.now().toString(),
        name: name.trim(),
        email: normalizedEmail,
        password,
    };

    users.set(normalizedEmail, user);

    return res.status(201).json({
        message: "Account created successfully.",
        user: { name: user.name, email: user.email },
        token: createToken(),
    });
});

app.post("/api/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.get(normalizedEmail);

    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Invalid email or password." });
    }

    return res.json({
        message: "Login successful.",
        user: { name: user.name, email: user.email },
        token: createToken(),
    });
});

app.post("/api/reset-password", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and new password are required." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = users.get(normalizedEmail);

    if (!user) {
        return res.status(404).json({ error: "No account found for this email." });
    }

    user.password = password;

    return res.json({
        message: "Password updated successfully.",
        user: { name: user.name, email: user.email },
    });
});

app.post("/api/chat", async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: "Message is required",
            });
        }

        const response = await client.responses.create({
            model: "gpt-5.6-luna",
            instructions:
                "You are the AI assistant for Yojana Setu. Help users understand government schemes clearly. Give simple, accurate and useful answers.",
            input: message,
        });

        res.json({
            reply: response.output_text,
        });
    } catch (error) {
        console.error("AI ERROR:", error);

        res.status(500).json({
            error: "AI request failed",
        });
    }
});

app.listen(3001, () => {
    console.log("================================");
    console.log("AI SERVER RUNNING");
    console.log("http://localhost:3001");
    console.log("================================");
});