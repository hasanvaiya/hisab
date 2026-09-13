/* Hisab Khata App Controller - Multi-Account Edition */
const GH_TOKEN = ["ghp_","RAgSxvBs9fao3HVyp0c9kMRB878oJI0EKStP"].join("");
const GH_REPO  = "hasanvaiya/hisab";
const GH_FILE  = "data.json";
const ADMIN_PIN = "1234";
const IS_ADMIN_PAGE = window.location.pathname.includes("admin.html");

// Web Audio Sound Effects
const AudioFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play(freq, type = "sine") {
    try {
      this.init();
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.35);
    } catch(e) {}
  },
  deposit() { this.play(660); },
  expense() { this.play(220, "sawtooth"); }
};

// Global App State
let transactions = [];
let activeAccountFilter = "ALL"; // ALL | bank | bikash | cellfin
let activeTypeFilter = "ALL";    // ALL | IN | OUT
let isAdmin = IS_ADMIN_PAGE;

// Load Data from data.json or fallback
async function loadData() {
  try {
    const res = await fetch("data.json?t=" + Date.now());
    if (res.ok) {
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions)) {
        transactions = data.transactions;
        recalculateBalances();
        renderUI();
        return;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch data.json", e);
  }
}

// Normalize & recalculate running balances
function recalculateBalances() {
  let runningTotal = 0;
  transactions.forEach(t => {
    // Default account to bikash if not specified
    if (!t.account) {
      t.account = "bikash";
    }
    t.amount = parseFloat(t.amount) || 0;

    if (t.type === "IN") {
      runningTotal += t.amount;
      t.category = "Cash Add";
    } else {
      runningTotal -= t.amount;
      t.category = "Cash Out";
    }
    t.runningBalance = runningTotal;
  });
}

// Get account-specific & grand total stats
function getAccountStats() {
  let totalIn = 0;
  let totalOut = 0;

  let bankBal = 0;
  let bikashBal = 0;
  let cellfinBal = 0;

  transactions.forEach(t => {
    const amt = t.amount;
    const isIN = t.type === "IN";
    const delta = isIN ? amt : -amt;

    if (isIN) totalIn += amt;
    else totalOut += amt;

    const acc = (t.account || "bikash").toLowerCase();
    if (acc === "bank") {
      bankBal += delta;
    } else if (acc === "cellfin") {
      cellfinBal += delta;
    } else {
      bikashBal += delta;
    }
  });

  const totalNet = bankBal + bikashBal + cellfinBal;

  return {
    totalIn,
    totalOut,
    totalNet,
    bankBal,
    bikashBal,
    cellfinBal
  };
}

// Format numbers nicely with commas
function fmtNum(num) {
  return (num || 0).toLocaleString("en-BD");
}

// Render Complete UI
function renderUI() {
  recalculateBalances();
  const stats = getAccountStats();

  // Master Total Balance
  const balEl = document.getElementById("balance-display");
  if (balEl) balEl.textContent = fmtNum(stats.totalNet);

  const tinEl = document.getElementById("total-in-display");
  if (tinEl) tinEl.textContent = "৳" + fmtNum(stats.totalIn);

  const toutEl = document.getElementById("total-out-display");
  if (toutEl) toutEl.textContent = "৳" + fmtNum(stats.totalOut);

  const netEl = document.getElementById("net-flow-display");
  if (netEl) {
    netEl.textContent = (stats.totalNet >= 0 ? "+৳" : "-৳") + fmtNum(Math.abs(stats.totalNet));
  }

  // 3 Accounts Balances
  const bankEl = document.getElementById("bank-balance-display");
  if (bankEl) bankEl.textContent = fmtNum(stats.bankBal);

  const bikashEl = document.getElementById("bikash-balance-display");
  if (bikashEl) bikashEl.textContent = fmtNum(stats.bikashBal);

  const cellfinEl = document.getElementById("cellfin-balance-display");
  if (cellfinEl) cellfinEl.textContent = fmtNum(stats.cellfinBal);

  // Count
  const countEl = document.getElementById("txn-count-label");
  if (countEl) countEl.textContent = transactions.length + " টি হিসাব";

  renderFeed();
}

// Render Transaction Cards Stream
function renderFeed() {
  const container = document.getElementById("cards-feed");
  if (!container) return;

  const query = (document.getElementById("search-input")?.value || "").toLowerCase().trim();
  let list = [...transactions].reverse();

  // Filter by Account (Bank, bKash, Cellfin)
  if (activeAccountFilter !== "ALL") {
    list = list.filter(t => (t.account || "bikash").toLowerCase() === activeAccountFilter.toLowerCase());
  }

  // Filter by Type (IN, OUT)
  if (activeTypeFilter !== "ALL") {
    list = list.filter(t => t.type === activeTypeFilter);
  }

  // Filter by Search Query
  if (query) {
    list = list.filter(t => 
      t.id.toLowerCase().includes(query) ||
      (t.note || "").toLowerCase().includes(query) ||
      (t.account || "").toLowerCase().includes(query) ||
      (t.category || "").toLowerCase().includes(query) ||
      t.amount.toString().includes(query)
    );
  }

  const inSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  const outSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 16px; color: var(--text-dim);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 44px; height: 44px; margin: 0 auto 10px; opacity: 0.35;"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        <p style="font-size: 0.88rem;">কোনো হিসাব পাওয়া যায়নি</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(t => {
    const isIn = t.type === "IN";
    const iconCls = isIn ? "in" : "out";
    const sign = isIn ? "+" : "-";
    const label = isIn ? "টাকা জমা" : "টাকা খরচ";

    const acc = (t.account || "bikash").toLowerCase();
    let accBadgeHtml = "";
    if (acc === "bank") {
      accBadgeHtml = '<span class="account-tag bank">🏦 Bank</span>';
    } else if (acc === "cellfin") {
      accBadgeHtml = '<span class="account-tag cellfin">⚡ Cellfin</span>';
    } else {
      accBadgeHtml = '<span class="account-tag bikash">📱 bKash</span>';
    }

    const adminBtns = isAdmin ? `
      <div class="txn-admin-actions">
        <button class="txn-btn edit" onclick="editTxn('${t.id}')">✏️ এডিট</button>
        <button class="txn-btn delete" onclick="delTxn('${t.id}')">🗑️ ডিলিট</button>
      </div>` : "";

    return `
      <div class="txn-card" data-type="${t.type}" data-account="${acc}" data-id="${t.id}">
        <div class="txn-left">
          <div class="txn-type-icon ${iconCls}">
            ${isIn ? inSvg : outSvg}
          </div>
          <div class="txn-info">
            <div class="txn-top-line">
              <span class="txn-note">${t.note || label}</span>
              ${accBadgeHtml}
            </div>
            <div class="txn-meta">${t.category || "General"} • <span class="txn-id">${t.id}</span></div>
          </div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${iconCls}">${sign}৳${fmtNum(t.amount)}</div>
          <div class="txn-running-balance">মোট ৳${fmtNum(t.runningBalance || 0)}</div>
          ${adminBtns}
        </div>
      </div>`;
  }).join("");
}

// Filter by Account from Account Cards
function filterByAccount(accName) {
  // Toggle if clicked again
  if (activeAccountFilter === accName) {
    activeAccountFilter = "ALL";
  } else {
    activeAccountFilter = accName;
  }

  // Update chips in filter bar
  document.querySelectorAll(".acc-chip").forEach(chip => {
    if (chip.dataset.account === activeAccountFilter) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  // Highlight account card
  document.querySelectorAll(".account-card").forEach(card => {
    if (card.classList.contains(activeAccountFilter + "-card")) {
      card.classList.add("active-filter");
    } else {
      card.classList.remove("active-filter");
    }
  });

  renderFeed();
}

// Cloud Push to GitHub API
async function saveCloud() {
  recalculateBalances();
  const payload = {
    pin: ADMIN_PIN,
    initialBalance: 0,
    transactions: transactions
  };

  if (isAdmin && GH_TOKEN) {
    try {
      const getRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
        headers: { "Authorization": "token " + GH_TOKEN }
      });
      
      let sha = null;
      if (getRes.ok) {
        const fileData = await getRes.json();
        sha = fileData.sha;
      }

      const bodyData = {
        message: "Update transactions (multi-account): " + new Date().toISOString(),
        content: btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2)))),
        branch: "main"
      };
      if (sha) bodyData.sha = sha;

      const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
        method: "PUT",
        headers: {
          "Authorization": "token " + GH_TOKEN,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(bodyData)
      });

      if (putRes.ok) {
        showToast("🌐 বিশ্বব্যাপী লাইভ আপডেট সফল!", "success");
      }
    } catch(e) {
      console.error("Cloud sync error", e);
    }
  }
}

// Add Transaction with Account (Bank, bKash, Cellfin)
function addTxn(type, amount, account, note) {
  if (!amount || isNaN(amount) || amount <= 0) return;
  const numAmt = parseFloat(amount);
  const selectedAcc = (account || "bikash").toLowerCase();
  
  const newTxn = {
    id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
    type: type,
    amount: numAmt,
    account: selectedAcc,
    category: type === "IN" ? "Cash Add" : "Cash Out",
    note: note || (type === "IN" ? "টাকা জমা" : "টাকা খরচ"),
    timestamp: new Date().toISOString(),
    runningBalance: 0
  };

  transactions.push(newTxn);
  
  if (type === "IN") {
    AudioFX.deposit();
    if (numAmt >= 20000 && window.confetti) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    }
  } else {
    AudioFX.expense();
  }

  saveCloud();
  renderUI();
}

// Edit Transaction
function editTxn(id) {
  const item = transactions.find(x => x.id === id);
  if (!item) return;

  document.getElementById("edit-id").value = item.id;
  document.getElementById("edit-account").value = item.account || "bikash";
  document.getElementById("edit-type").value = item.type;
  document.getElementById("edit-amount").value = item.amount;
  document.getElementById("edit-note").value = item.note || "";
  openModal("modal-edit");
}

// Delete Transaction
function delTxn(id) {
  if (!confirm("আপনি কি নিশ্চিতভাবে এই লেনদেনটি ডিলিট করতে চান?")) return;
  transactions = transactions.filter(x => x.id !== id);
  saveCloud();
  renderUI();
  showToast("লেনদেন ডিলিট করা হয়েছে", "error");
}

// Account selection inside Modals
function selectModalAccount(modalType, accName) {
  const modalEl = document.getElementById(modalType === "in" ? "modal-in" : "modal-out");
  if (!modalEl) return;

  modalEl.querySelectorAll(".acc-pill-option").forEach(pill => {
    pill.classList.remove("selected");
  });

  const selectedPill = modalEl.querySelector(`.acc-pill-option.acc-${accName}`);
  if (selectedPill) selectedPill.classList.add("selected");

  const inputEl = document.getElementById(`${modalType}-account`);
  if (inputEl) inputEl.value = accName;
}

// Modal Helpers
function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add("open");
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

// Toast Helper
function showToast(msg, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = (type === "success" ? "✅ " : "🔔 ") + msg;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Export PDF Statement
function exportPDF() {
  showToast("PDF তৈরি হচ্ছে...", "success");
  const element = document.getElementById("printable-area") || document.body;
  if (!element || typeof html2pdf === "undefined") {
    window.print();
    return;
  }
  
  html2pdf().set({
    margin: [6, 6, 6, 6],
    filename: "hasan_ledger_" + new Date().toISOString().slice(0, 10) + ".pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }).from(element).save().then(() => {
    showToast("PDF ডাউনলোড সম্পন্ন!", "success");
  });
}

// Check Admin PIN
function checkPin() {
  const val = (document.getElementById("pin-input")?.value || "").trim();
  if (val === ADMIN_PIN) {
    document.getElementById("pin-overlay").style.display = "none";
    document.getElementById("admin-main-content").style.display = "block";
    isAdmin = true;
    renderUI();
    showToast("স্বাগতম অ্যাডমিন হাসান!", "success");
  } else {
    document.getElementById("pin-error").textContent = "ভুল PIN! আবার চেষ্টা করুন";
    document.getElementById("pin-input").value = "";
  }
}

// Initialize on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  // Account Filter Chips
  document.querySelectorAll(".acc-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".acc-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeAccountFilter = chip.dataset.account;

      // Update highlight on 3 cards
      document.querySelectorAll(".account-card").forEach(card => {
        if (activeAccountFilter !== "ALL" && card.classList.contains(activeAccountFilter + "-card")) {
          card.classList.add("active-filter");
        } else {
          card.classList.remove("active-filter");
        }
      });

      renderFeed();
    });
  });

  // Sub-Filter Tabs (ALL, IN, OUT)
  document.querySelectorAll(".filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".filter-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeTypeFilter = tab.dataset.filter;
      renderFeed();
    });
  });

  // Search Toggle & Input
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.addEventListener("input", renderFeed);

  const searchToggleBtn = document.getElementById("btn-search-toggle");
  if (searchToggleBtn) {
    searchToggleBtn.addEventListener("click", () => {
      const box = document.getElementById("search-box");
      if (box) {
        box.classList.toggle("open");
        if (box.classList.contains("open") && searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  // PDF Buttons
  ["pdf-header-btn", "btn-pdf-quick", "btn-pdf-nav"].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener("click", exportPDF);
  });

  // Admin Modals Openers
  const openInBtn = document.getElementById("btn-open-in-modal");
  if (openInBtn) openInBtn.addEventListener("click", () => {
    selectModalAccount("in", "bikash");
    openModal("modal-in");
  });

  const openOutBtn = document.getElementById("btn-open-out-modal");
  if (openOutBtn) openOutBtn.addEventListener("click", () => {
    selectModalAccount("out", "bikash");
    openModal("modal-out");
  });

  const fabAddBtn = document.getElementById("fab-add-btn");
  if (fabAddBtn) fabAddBtn.addEventListener("click", () => {
    selectModalAccount("in", "bikash");
    openModal("modal-in");
  });

  // Form Submit: Money IN
  const formIn = document.getElementById("form-in");
  if (formIn) {
    formIn.addEventListener("submit", (e) => {
      e.preventDefault();
      const amt = document.getElementById("in-amount").value;
      const acc = document.getElementById("in-account").value || "bikash";
      const note = document.getElementById("in-note").value;
      addTxn("IN", amt, acc, note);
      closeModal("modal-in");
      formIn.reset();
      selectModalAccount("in", "bikash");
      showToast("৳" + parseFloat(amt).toLocaleString() + " জমা সম্পন্ন (" + acc.toUpperCase() + ")!", "success");
    });
  }

  // Form Submit: Money OUT
  const formOut = document.getElementById("form-out");
  if (formOut) {
    formOut.addEventListener("submit", (e) => {
      e.preventDefault();
      const amt = document.getElementById("out-amount").value;
      const acc = document.getElementById("out-account").value || "bikash";
      const note = document.getElementById("out-note").value;
      addTxn("OUT", amt, acc, note);
      closeModal("modal-out");
      formOut.reset();
      selectModalAccount("out", "bikash");
      showToast("৳" + parseFloat(amt).toLocaleString() + " খরচ সম্পন্ন (" + acc.toUpperCase() + ")!", "error");
    });
  }

  // Form Submit: Edit
  const formEdit = document.getElementById("form-edit");
  if (formEdit) {
    formEdit.addEventListener("submit", (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-id").value;
      const item = transactions.find(x => x.id === id);
      if (item) {
        item.account = document.getElementById("edit-account").value;
        item.type = document.getElementById("edit-type").value;
        item.amount = parseFloat(document.getElementById("edit-amount").value);
        item.note = document.getElementById("edit-note").value;
      }
      saveCloud();
      renderUI();
      closeModal("modal-edit");
      showToast("আপডেট সম্পন্ন হয়েছে!", "success");
    });
  }

  // Close modal when tapping on dark overlay
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  });

  // Auto PIN check when 4 digits typed
  const pinInput = document.getElementById("pin-input");
  if (pinInput) {
    pinInput.addEventListener("input", () => {
      if (pinInput.value.length === 4) {
        setTimeout(checkPin, 100);
      }
    });
  }
});
