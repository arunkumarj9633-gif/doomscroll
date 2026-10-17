require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();
const PORT = process.env.PORT || 3000;
const LIFE_EXPECTANCY = 75;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "doomscroll_db",
  waitForConnections: true,
  connectionLimit: 10,
});

function round1(num) {
  return Math.round(num * 10) / 10;
}

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: "error", database: "not connected" });
  }
});

app.get("/api/goals", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, label, hours_each, emoji FROM goals WHERE is_active = 1 ORDER BY id"
    );
    const goals = rows.map((g) => ({ ...g, hours_each: Number(g.hours_each) }));
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load goals" });
  }
});

app.post("/api/calculations", async (req, res) => {
  const hours = Number(req.body.hours_per_day);
  const age = Number(req.body.age);

  if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
    return res.status(400).json({ error: "hours_per_day must be between 0 and 24" });
  }
  if (!Number.isInteger(age) || age < 10 || age > 100) {
    return res.status(400).json({ error: "age must be a whole number between 10 and 100" });
  }

  const hoursPerYear = hours * 365;
  const daysPerYear = hoursPerYear / 24;
  const yearsLeft = Math.max(LIFE_EXPECTANCY - age, 0);
  const wakingYearsLost = (hoursPerYear * yearsLeft) / (16 * 365);

  try {
    const [result] = await pool.query(
      `INSERT INTO calculations
         (hours_per_day, age, hours_per_year, days_per_year, waking_years_lost)
       VALUES (?, ?, ?, ?, ?)`,
      [hours, age, round1(hoursPerYear), round1(daysPerYear), round1(wakingYearsLost)]
    );
    res.status(201).json({
      id: result.insertId,
      hours_per_day: hours,
      age,
      hours_per_year: round1(hoursPerYear),
      days_per_year: round1(daysPerYear),
      waking_years_lost: round1(wakingYearsLost),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save calculation" });
  }
});

app.get("/api/calculations", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, hours_per_day, age, hours_per_year, days_per_year,
              waking_years_lost, created_at
       FROM calculations
       ORDER BY created_at DESC, id DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load history" });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
  console.log(`Test it: http://localhost:${PORT}/api/health`);
});