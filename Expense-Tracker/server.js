const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

/* ---------- DB (IMPORTANT FIX) ---------- */
const dbPath = path.join(__dirname, "expense.db");
const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error("DB ERROR:", err.message);
  else console.log("Connected to SQLite database");
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use("/css", express.static("css"));
app.use("/js", express.static("js"));
app.use(express.static("public"));

/* ---------- TABLES ---------- */
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      monthly_budget REAL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      amount REAL,
      category TEXT,
      date TEXT
    )
  `);
});

/* ---------- REGISTER (FIXED) ---------- */
app.post("/register", (req, res) => {
  console.log("REGISTER HIT:", req.body);

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  db.run(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, password],
    function (err) {
      if (err) {
        console.error("REGISTER ERROR:", err.message);
        return res.status(400).json({ error: "Email already exists" });
      }

      return res.json({ success: true });
    }
  );
});

/* ---------- LOGIN ---------- */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT id, name FROM users WHERE email=? AND password=?",
    [email, password],
    (err, user) => {
      if (err) {
        console.error("LOGIN ERROR:", err.message);
        return res.status(500).json({ error: "Server error" });
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      res.json({ user_id: user.id, name: user.name });
    }
  );
});

/* ---------- EXPENSE CRUD ---------- */
app.post("/add-expense", (req, res) => {
  const { user_id, title, amount, category, date } = req.body;

  db.run(
    "INSERT INTO expenses (user_id,title,amount,category,date) VALUES (?,?,?,?,?)",
    [user_id, title, amount, category, date],
    () => res.json({ success: true })
  );
});

app.get("/expenses/:userId", (req, res) => {
  db.all(
    "SELECT * FROM expenses WHERE user_id=?",
    [req.params.userId],
    (err, rows) => res.json(rows)
  );
});

app.get("/expense/:id", (req, res) => {
  db.get(
    "SELECT * FROM expenses WHERE id=?",
    [req.params.id],
    (err, row) => {
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    }
  );
});

app.put("/expense/:id", (req, res) => {
  const { title, amount, category, date } = req.body;
  db.run(
    "UPDATE expenses SET title=?, amount=?, category=?, date=? WHERE id=?",
    [title, amount, category, date, req.params.id],
    () => res.json({ success: true })
  );
});

app.delete("/delete/:id", (req, res) => {
  db.run("DELETE FROM expenses WHERE id=?", [req.params.id], () =>
    res.json({ success: true })
  );
});

/* ---------- BUDGET ---------- */
app.get("/user/budget", (req, res) => {
  db.get(
    "SELECT monthly_budget FROM users WHERE id=?",
    [req.query.userId],
    (err, row) => res.json(row || { monthly_budget: null })
  );
});

app.put("/user/budget", (req, res) => {
  db.run(
    "UPDATE users SET monthly_budget=? WHERE id=?",
    [req.body.budget, req.body.userId],
    () => res.json({ success: true })
  );
});

/* ---------- ROOT ---------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ---------- START ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
