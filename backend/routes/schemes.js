const express = require("express");
const router = express.Router();

const Scheme = require("../models/scheme");

// GET all schemes
router.get("/", async (req, res) => {
    try {
        const schemes = await Scheme.find().sort({ scheme_name: 1 });

        res.json({
            success: true,
            count: schemes.length,
            schemes,
        });
    } catch (error) {
        console.error("Error fetching schemes:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch schemes",
        });
    }
});

module.exports = router;
