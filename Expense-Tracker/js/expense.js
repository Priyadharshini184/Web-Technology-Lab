const user = JSON.parse(localStorage.getItem("user"));
if (!user) location.href = "/";

const params = new URLSearchParams(window.location.search);
const expenseId = params.get("id");

const titleEl = document.getElementById("title");
const amountEl = document.getElementById("amount");
const categoryEl = document.getElementById("category");
const dateEl = document.getElementById("date");

/* ---------- ADD ---------- */
async function addExpense() {
  const title = titleEl.value.trim();
  const amount = amountEl.value;
  const category = categoryEl.value;
  const date = dateEl.value;

  if (!title || !amount || !date) {
    showAlert("Please fill all fields", "Missing data");
    return;
  }

  await fetch("/add-expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: user.user_id,
      title,
      amount,
      category,
      date
    })
  });

  location.href = "/dashboard.html";
}

/* ---------- LOAD FOR EDIT ---------- */
async function loadExpense() {
  if (!expenseId) return;

  const res = await fetch(`/expense/${expenseId}`);
  const e = await res.json();

  titleEl.value = e.title;
  amountEl.value = e.amount;
  categoryEl.value = e.category;
  dateEl.value = e.date;
}

/* ---------- UPDATE ---------- */
async function updateExpense() {
  const title = titleEl.value.trim();
  const amount = amountEl.value;
  const category = categoryEl.value;
  const date = dateEl.value;

  if (!title || !amount || !date) {
    showAlert("Please fill all fields", "Missing data");
    return;
  }

  await fetch(`/expense/${expenseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, amount, category, date })
  });

  location.href = "/dashboard.html";
}

if (expenseId) loadExpense();
