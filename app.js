const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();

// Middleware to handle JSON data and static files
app.use(express.json());
app.use(express.static("public"));

// Create or connect to the SQLite database
const db = new sqlite3.Database("database.db", (err) => {
    if (err) {
        console.error("Error opening database", err.message);
    } else {
        console.log("Connected to SQLite database");

        // Create transactions table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER,
            type TEXT
        )`, (err) => {
            if (err) {
                console.error("Error creating transactions table", err.message);
            }
        });

        // Create balance table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS balance (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            amount INTEGER
        )`, (err) => {
            if (err) {
                console.error("Error creating balance table", err.message);
            } else {
                // Insert initial balance of 0 if it doesn't exist
                db.run(`INSERT OR IGNORE INTO balance (id, amount) VALUES (1, 0)`);
            }
        });
    }
});

// Endpoint to add transaction (saving or expense) and update balance
app.post("/api/addTransaction", (req, res) => {
    const { amount, type } = req.body;

    // Insert the transaction into the transactions table
    db.run(`INSERT INTO transactions (amount, type) VALUES (?, ?)`, [amount, type], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Update the balance based on transaction type
        const adjustment = type === "saving" ? amount : -amount;
        db.run(`UPDATE balance SET amount = amount + ? WHERE id = 1`, [adjustment], function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Get updated balance and all transactions to return to the client
            db.get(`SELECT amount FROM balance WHERE id = 1`, (err, row) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                const updatedBalance = row.amount;

                db.all(`SELECT * FROM transactions`, (err, transactions) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    res.json({ balance: updatedBalance, transactions });
                });
            });
        });
    });
});

// Endpoint to fetch current balance and transactions
app.get("/api/getData", (req, res) => {
    db.get(`SELECT amount FROM balance WHERE id = 1`, (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const balance = row.amount;

        db.all(`SELECT * FROM transactions`, (err, transactions) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({ balance, transactions });
        });
    });
});

// Start the server
app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
