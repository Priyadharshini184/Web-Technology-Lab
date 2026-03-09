const user = JSON.parse(localStorage.getItem("user"));
if (!user) location.href = "/";

/* ---------- ELEMENTS ---------- */
const totalEl = document.getElementById("total");
const monthTotalEl = document.getElementById("monthTotal");
const countEl = document.getElementById("count");
const avgExpenseEl = document.getElementById("avgExpense");
const expenseListEl = document.getElementById("expenseList");
const emptyState = document.getElementById("emptyState");
const searchExpenses = document.getElementById("searchExpenses");
const periodFilter = document.getElementById("periodFilter");
const expenseChartEl = document.getElementById("expenseChart");

const budgetInput = document.getElementById("budgetInput");
const budgetSaveBtn = document.getElementById("budgetSaveBtn");
const budgetProgressWrap = document.getElementById("budgetProgressWrap");
const budgetProgressBar = document.getElementById("budgetProgressBar");
const budgetProgressText = document.getElementById("budgetProgressText");
const budgetHint = document.getElementById("budgetHint");
const exportCsvBtn = document.getElementById("exportCsvBtn");

let allExpenses = [];
let chartInstance = null;
let userBudget = null;
const CATEGORY_ICONS = {
  Food: "🍽️",
  Travel: "🚌",
  Shopping: "🛍️",
  Bills: "💡",
  Other: "📦"
};


/* ---------- LOAD ---------- */
async function loadAll() {
  await loadBudget();
  await loadExpenses();
  initPeriodFilter();
  applyFilter();
}

async function loadExpenses() {
  const res = await fetch(`/expenses/${user.user_id}`);
  const data = await res.json();
  allExpenses = data.map(e => ({
    ...e,
    amount: Number(e.amount),
    dateObj: new Date(e.date)
  }));
}

async function loadBudget() {
  const res = await fetch(`/user/budget?userId=${user.user_id}`);
  const data = await res.json();
  userBudget = data.monthly_budget;
  budgetInput.value = userBudget ?? "";
}

/* ---------- FILTER ---------- */
function initPeriodFilter() {
  periodFilter.innerHTML = `<option value="">All Time</option>`;
  const months = new Set();

  allExpenses.forEach(e =>
    months.add(`${e.dateObj.getFullYear()}-${e.dateObj.getMonth()}`)
  );

  [...months].sort().reverse().forEach(k => {
    const [y, m] = k.split("-");
    const opt = document.createElement("option");
    opt.value = k;
    opt.textContent = new Date(y, m).toLocaleString("default", {
      month: "long",
      year: "numeric"
    });
    periodFilter.appendChild(opt);
  });
}

periodFilter.onchange = applyFilter;
searchExpenses.oninput = applyFilter;

/* ---------- APPLY ---------- */
function applyFilter() {
  let list = [...allExpenses];

  if (periodFilter.value) {
    const [y, m] = periodFilter.value.split("-");
    list = list.filter(
      e =>
        e.dateObj.getFullYear() == y &&
        e.dateObj.getMonth() == m
    );
  }

  if (searchExpenses.value) {
    const q = searchExpenses.value.toLowerCase();
    list = list.filter(
      e =>
        e.title.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    );
  }

  renderSummary(list);
  renderChart(list);
  renderList(list);
}

/* ---------- SUMMARY ---------- */
function renderSummary(list) {
  let total = 0, monthTotal = 0;
  const now = new Date();

  list.forEach(e => {
    total += e.amount;
    if (
      e.dateObj.getMonth() === now.getMonth() &&
      e.dateObj.getFullYear() === now.getFullYear()
    ) monthTotal += e.amount;
  });

  totalEl.textContent = `₹${total}`;
  monthTotalEl.textContent = `₹${monthTotal}`;
  countEl.textContent = list.length;
  avgExpenseEl.textContent = list.length
    ? `₹${Math.round(total / list.length)}`
    : "₹0";

  updateBudget(monthTotal);
}

/* ---------- BUDGET ---------- */
function updateBudget(spent) {
  if (!userBudget) {
    budgetProgressWrap.style.display = "none";
    budgetHint.style.display = "block";
    return;
  }

  budgetHint.style.display = "none";
  budgetProgressWrap.style.display = "block";

  const pct = Math.min(100, Math.round((spent / userBudget) * 100));
  budgetProgressBar.style.width = pct + "%";
  budgetProgressBar.className =
    "budget-progress-bar " +
    (pct >= 100 ? "budget-over" : pct >= 70 ? "budget-warning" : "budget-safe");

  budgetProgressText.textContent = `₹${spent} of ₹${userBudget} used (${pct}%)`;
}

budgetSaveBtn.onclick = async () => {
  const val = Number(budgetInput.value);
  if (!val) return;

  await fetch("/user/budget", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId: user.user_id, budget: val })
  });

  userBudget = val;
  applyFilter();
};

/* ---------- CHART ---------- */
function renderChart(list) {
  if (chartInstance) chartInstance.destroy();

  const cat = {};
  list.forEach(e => cat[e.category] = (cat[e.category] || 0) + e.amount);

  chartInstance = new Chart(expenseChartEl, {
    type: "doughnut",
    data: {
      labels: Object.keys(cat),
      datasets: [{
        data: Object.values(cat),
        backgroundColor: ["#1a73e8", "#1e8e3e", "#e37400", "#d93025", "#5f6368"]
      }]
    },
    options: { cutout: "65%", plugins: { legend: { position: "bottom" } } }
  });
}

/* ---------- LIST ---------- */
function renderList(list) {
  expenseListEl.innerHTML = "";

  if (!list.length) {
    emptyState.style.display = "block";
    return;
  }

  emptyState.style.display = "none";

  list.sort((a, b) => b.dateObj - a.dateObj).forEach(e => {
    const li = document.createElement("li");
    li.className = "expense-item";
    li.innerHTML = `
      <div class="expense-info">
        <span class="category-icon">
          ${CATEGORY_ICONS[e.category] || "📦"}
        </span>

        <div>
          <div class="expense-title">${e.title}</div>
          <div class="expense-meta">${e.category} • ${e.dateObj.toDateString()}</div>
        </div>
      </div>
      <div class="expense-actions">
        <span class="expense-amount">₹${e.amount}</span>
        <a href="/edit.html?id=${e.id}" class="btn-icon btn-edit">Edit</a>
        <button class="btn-icon btn-delete" onclick="deleteExpense(${e.id})">Delete</button>
      </div>
    `;
    expenseListEl.appendChild(li);
  });
}

/* ---------- DELETE ---------- */
async function deleteExpense(id) {
  const ok = await showConfirm(
    "You cannot undo this action.",
    "Are you sure?"
  );
  if (!ok) return;

  await fetch(`/delete/${id}`, { method: "DELETE" });
  loadAll();
}

/* ---------- CSV EXPORT (Excel-safe) ---------- */
exportCsvBtn.onclick = () => {
  const rows = allExpenses.map(e => {
    const d = e.dateObj;
    const dateText =
      String(d.getDate()).padStart(2, "0") + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      d.getFullYear();

    // 👇 \t forces Excel to treat it as TEXT
    return `"${e.title}",${e.amount},"${e.category}","\t${dateText}"`;
  });

  const csv = "Title,Amount,Category,Date\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "expenses.csv";
  a.click();
};

loadAll();
