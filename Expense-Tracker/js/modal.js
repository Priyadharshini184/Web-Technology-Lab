/**
 * Custom modal dialogs - replaces browser alert/confirm for a product feel.
 * Usage: showAlert("Message"), showConfirm("Delete this?").then(ok => { if (ok) ... })
 */

function getOrCreateModalContainer() {
  let el = document.getElementById("app-modal-root");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-modal-root";
    document.body.appendChild(el);
  }
  return el;
}

function showAlert(message, title = "Notice") {
  return new Promise(resolve => {
    const root = getOrCreateModalContainer();
    root.innerHTML = `
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-dialog modal-dialog--alert">
          <h3 id="modal-title" class="modal-title">${escapeHtml(title)}</h3>
          <p class="modal-body">${escapeHtml(message)}</p>
          <div class="modal-actions">
            <button type="button" class="modal-btn modal-btn--primary" data-result="ok">OK</button>
          </div>
        </div>
      </div>`;
    const overlay = root.querySelector(".modal-overlay");
    const btn = root.querySelector("[data-result='ok']");
    function close() {
      overlay.remove();
      resolve();
    }
    btn.focus();
    btn.addEventListener("click", close);
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
    overlay.addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  });
}

function showConfirm(message, title = "Confirm") {
  return new Promise(resolve => {
    const root = getOrCreateModalContainer();
    root.innerHTML = `
      <div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-dialog modal-dialog--confirm">
          <h3 id="modal-title" class="modal-title">${escapeHtml(title)}</h3>
          <p class="modal-body">${escapeHtml(message)}</p>
          <div class="modal-actions">
            <button type="button" class="modal-btn modal-btn--secondary" data-result="cancel">Cancel</button>
            <button type="button" class="modal-btn modal-btn--danger" data-result="confirm">Confirm</button>
          </div>
        </div>
      </div>`;
    const overlay = root.querySelector(".modal-overlay");
    function close(result) {
      overlay.remove();
      resolve(result);
    }
    root.querySelectorAll(".modal-btn").forEach(b => {
      b.addEventListener("click", () => close(b.getAttribute("data-result") === "confirm"));
    });
    overlay.addEventListener("click", e => { if (e.target === overlay) close(false); });
    overlay.addEventListener("keydown", e => { if (e.key === "Escape") close(false); });
    root.querySelector("[data-result='confirm']").focus();
  });
}

function escapeHtml(s) {
  const div = document.createElement("div");
  div.textContent = s;
  return div.innerHTML;
}
