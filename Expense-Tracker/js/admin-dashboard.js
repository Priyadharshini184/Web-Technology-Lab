/**
 * Admin dashboard: read-only system stats.
 * Requires user.role === 'admin'. Backend: GET /admin/stats?userId=...
 */

const user = JSON.parse(localStorage.getItem("user"));
if (!user || user.role !== "admin") {
  localStorage.removeItem("user");
  location.href = "/";
}

const CATEGORY_COLORS = {
  Food: "#1e8e3e", Travel: "#1a73e8", Shopping: "#e37400",
  Bills: "#d93025", Other: "#5f6368"
};

let adminChartInstance = null;

function loadAdminStats() {
  fetch(`/admin/stats?userId=${user.user_id}`)
    .then(res => {
      if (!res.ok) throw new Error("Forbidden");
      return res.json();
    })
    .then(data => {
      document.getElementById("adminTotalUsers").textContent = data.totalUsers ?? "—";
      document.getElementById("adminTotalExpenses").textContent = data.totalExpenses ?? "—";
      document.getElementById("adminTotalAmount").textContent = "₹" + formatNum(data.totalAmount ?? 0);

      const byCat = data.byCategory || {};
      const labels = Object.keys(byCat);
      const values = Object.values(byCat);
      const colors = labels.map(l => CATEGORY_COLORS[l] || "#5f6368");

      if (labels.length === 0) {
        labels.push("No data");
        values.push(1);
      }

      updateAdminChart(labels, values, colors);

      const listEl = document.getElementById("adminCategoryList");
      listEl.innerHTML = Object.entries(byCat)
        .filter(([k]) => k !== "No data")
        .sort((a, b) => b[1] - a[1])
        .map(([cat, amt]) =>
          `<div class="admin-category-row">
            <span class="admin-category-name">${escapeHtml(cat)}</span>
            <span class="admin-category-amount">₹${formatNum(amt)}</span>
          </div>`
        )
        .join("") || "<p class=\"admin-empty\">No category data yet.</p>";
    })
    .catch(() => {
      document.getElementById("adminTotalUsers").textContent = "Error";
      document.getElementById("adminTotalExpenses").textContent = "Error";
      document.getElementById("adminTotalAmount").textContent = "—";
    });
}

function formatNum(n) {
  return Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}

function updateAdminChart(labels, data, colors) {
  const canvas = document.getElementById("adminChart");
  if (!canvas) return;
  if (adminChartInstance) {
    adminChartInstance.data.labels = labels;
    adminChartInstance.data.datasets[0].data = data;
    adminChartInstance.data.datasets[0].backgroundColor = colors;
    adminChartInstance.update("none");
    return;
  }
  adminChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Amount (₹)",
        data,
        backgroundColor: colors,
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `₹${formatNum(ctx.raw)}` } }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

loadAdminStats();
