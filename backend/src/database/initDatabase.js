const fs = require("fs");
const path = require("path");

const db = require("./database");

//read sql file
const schemaPath = path.join(__dirname, "schema.sql");

const schema = fs.readFileSync(schemaPath, "utf8");

db.exec(schema, (err) => {
    if (err) {
        console.error("Failed to initialize database:", err.message);
    } else {
        console.log("Database initialized successfully.");
    }

    db.close();
})