const fs = require("fs");
const path = require("path");
const db = require("./database");

const seedPath = path.join(__dirname, "seed.sql");

const seedSQL = fs.readFileSync(seedPath, "utf8");

db.exec(seedSQL, (err) => {
    if (err) {
        console.error("Error seeding database:", err.message);
    } else {
        console.log("Database seeded successfully.");
    }

    db.close();
});