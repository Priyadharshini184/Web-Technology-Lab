// ---------- REGISTER ----------
console.log("auth.js loaded");

async function register() {
  alert("Register button clicked");

  const nameEl = document.getElementById("name");
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");

  const nameVal = nameEl.value.trim();
  const emailVal = emailEl.value.trim();
  const passwordVal = passwordEl.value.trim();

  if (!nameVal || !emailVal || !passwordVal) {
    showAlert?.("Please fill all fields", "Registration") ??
      alert("Please fill all fields");
    return;
  }

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameVal,
      email: emailVal,
      password: passwordVal
    })
  });

  const data = await res.json();

  if (!res.ok) {
    showAlert?.(data.error || "Registration failed", "Registration") ??
      alert(data.error || "Registration failed");
    return;
  }

  showAlert?.("Registration successful. Please login.", "Success")
    .then(() => (location.href = "/")) ?? (location.href = "/");
}

// ---------- LOGIN ----------
async function login() {
  const emailEl = document.getElementById("email");
  const passwordEl = document.getElementById("password");

  const emailVal = emailEl.value.trim();
  const passwordVal = passwordEl.value.trim();

  if (!emailVal || !passwordVal) {
    showAlert?.("Please enter email and password", "Login") ??
      alert("Please enter email and password");
    return;
  }

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: emailVal,
      password: passwordVal
    })
  });

  const data = await res.json();

  if (!res.ok) {
    showAlert?.(data.error || "Invalid email or password", "Login") ??
      alert(data.error || "Invalid email or password");
    return;
  }

  localStorage.setItem("user", JSON.stringify(data));

  location.href =
    data.role === "admin"
      ? "/admin-dashboard"
      : "/dashboard.html";
}

// ---------- PASSWORD VISIBILITY ----------
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");

  if (toggle && passwordInput) {
    toggle.onclick = () => {
      const isHidden = passwordInput.type === "password";
      passwordInput.type = isHidden ? "text" : "password";
      toggle.textContent = isHidden ? "🙈" : "👁️";
    };
  }
});
