const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const schemesRoutes = require("./routes/schemes");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const partnerRoutes = require("./routes/partners");
const copilotRoutes = require("./routes/copilot");

const app = express();

app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174"
    ],
    credentials: true
}));
app.use(express.json({ limit: "100kb" }));

app.use("/api/auth", authRoutes);
app.use("/api/schemes", schemesRoutes);
app.use("/api/partners", partnerRoutes);
app.use("/api/chat", copilotRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, service: "Yojana Setu API" }));

if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log("MongoDB connected"))
        .catch(err => console.error("MongoDB connection failed:", err.message));
} else {
    console.warn("MONGO_URI is not configured; authentication persistence is unavailable.");
}

app.get("/", (req, res) => {
    res.send("Backend is running");
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
