const API_URL = "http://localhost:3000/api";
const LIFE_EXPECTANCY = 75;

// Backup goals, used only if the backend is not running.
// Normally the goals come from the database via the backend.
let goals = [
  { label: "read {n} books", hours_each: 8, emoji: "📚" },
  { label: "reach basic level in {n} new language(s)", hours_each: 500, emoji: "🌍" },
  { label: "learn {n} instrument(s) to a decent level", hours_each: 300, emoji: "🎸" },
  { label: "do {n} workouts", hours_each: 1, emoji: "💪" },
  { label: "watch {n} full-length movies mindfully", hours_each: 2, emoji: "🎬" },
];

const form = document.getElementById("calc-form");
const results = document.getElementById("results");
const perYearEl = document.getElementById("per-year");
const daysPerYearEl = document.getElementById("days-per-year");
const lifetimeYearsEl = document.getElementById("lifetime-years");
const equivalentsEl = document.getElementById("equivalents");
const reduceSlider = document.getElementById("reduce");
const reduceValueEl = document.getElementById("reduce-value");
const reduceResultEl = document.getElementById("reduce-result");

let currentHours = 0;

function round1(num) {
  return Math.round(num * 10) / 10;
}

function formatNumber(num) {
  return num.toLocaleString("en-US");
}

// ---------- Talking to the backend ----------

// Load goals from the database when the page opens
async function loadGoals() {
  try {
    const response = await fetch(`${API_URL}/goals`);
    if (!response.ok) throw new Error("Server error");
    const data = await response.json();
    if (data.length > 0) goals = data;
    console.log("Goals loaded from database:", goals.length);
  } catch (error) {
    console.warn("Backend not reachable, using backup goals.", error.message);
  }
}

// Save the result in the database (page keeps working even if this fails)
async function saveCalculation(hoursPerDay, age) {
  try {
    const response = await fetch(`${API_URL}/calculations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours_per_day: hoursPerDay, age: age }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not save");
    console.log("Saved to database, id:", data.id);
  } catch (error) {
    console.warn("Not saved:", error.message);
  }
}

// ---------- Showing results ----------

function showResults(hoursPerDay, age) {
  const hoursPerYear = hoursPerDay * 365;
  const daysPerYear = hoursPerYear / 24;
  const yearsLeft = Math.max(LIFE_EXPECTANCY - age, 0);
  const lifetimeHours = hoursPerYear * yearsLeft;
  // Convert to waking years (assuming 16 waking hours a day)
  const wakingYearsLost = lifetimeHours / (16 * 365);

  perYearEl.textContent = formatNumber(Math.round(hoursPerYear));
  daysPerYearEl.textContent = round1(daysPerYear);
  lifetimeYearsEl.textContent = round1(wakingYearsLost);

  equivalentsEl.innerHTML = "";
  goals.forEach((goal) => {
    const count = Math.floor(hoursPerYear / goal.hours_each);
    if (count >= 1) {
      const li = document.createElement("li");
      li.textContent = `${goal.emoji} ${goal.label.replace("{n}", formatNumber(count))}`;
      equivalentsEl.appendChild(li);
    }
  });

  updateReduction();
  results.classList.remove("hidden");
  results.scrollIntoView({ behavior: "smooth" });
}

function updateReduction() {
  const cut = parseFloat(reduceSlider.value);
  reduceValueEl.textContent = cut;
  const saved = Math.min(cut, currentHours);
  const savedYear = Math.round(saved * 365);
  reduceResultEl.textContent =
    saved > 0
      ? `That saves ${formatNumber(savedYear)} hours a year, about ${round1(savedYear / 8)} books worth of time.`
      : "Slide to see how much time you could win back.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  currentHours = parseFloat(document.getElementById("hours").value);
  const age = parseInt(document.getElementById("age").value, 10);
  showResults(currentHours, age);
  saveCalculation(currentHours, age);
});

reduceSlider.addEventListener("input", updateReduction);

// Run when the page opens
loadGoals();