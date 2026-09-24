const express = require("express");
const router = express.Router();

const { matchSchemes } = require("../utils/schemeMatcher");

router.post("/", async (req, res) => {
    try {
        const profile = req.body || {};

        const schemes = matchSchemes(profile);

        res.json({
            success: true,
            schemes
        });
    } catch (error) {
        console.error("Scheme matching error:", error);

        res.status(500).json({
            success: false,
            error: "Unable to match schemes"
        });
    }
});

module.exports = router;