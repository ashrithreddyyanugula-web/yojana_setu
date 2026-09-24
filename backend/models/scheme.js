const mongoose = require("mongoose");

const schemeSchema = new mongoose.Schema(
    {
        scheme_id: {
            type: String,
            required: true,
            unique: true,
        },

        scheme_name: {
            type: String,
            required: true,
        },

        ministry: String,

        applicant_type: String,

        business_type: String,

        business_status: String,

        age_min: String,

        gender: String,

        sc_st: String,

        rural: String,

        loan_support: String,

        benefit: String,

        official_url: String,

        source_url: String,
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Scheme", schemeSchema);