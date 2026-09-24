const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

const Scheme = require("./models/scheme");

require("dotenv").config();

const csvPath = path.join(
    __dirname,
    "..",
    "datasets",
    "yojana_setu_50.csv"
);

async function importSchemes() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const schemes = [];

        fs.createReadStream(csvPath)
            .pipe(csv())
            .on("data", (row) => {
                schemes.push(row);
            })
            .on("end", async () => {
                try {
                    await Scheme.deleteMany({});

                    await Scheme.insertMany(schemes);

                    console.log(`${schemes.length} schemes imported successfully`);

                    await mongoose.connection.close();
                } catch (error) {
                    console.error("Import error:", error);
                    process.exit(1);
                }
            });
    } catch (error) {
        console.error("MongoDB connection error:", error);
        process.exit(1);
    }
}

importSchemes();