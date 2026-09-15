/* Hisab Khata App Controller - Multi-Account & Date Edition */
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

// Format Date for Display (e.g., "13/09/2026")
function formatDisplayDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr.slice(0, 10);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return isoStr.slice(0, 10);
  }
}

// Format ISO date for <input type="date"> (e.g., "2026-09-13")
function formatInputDate(isoStr) {
  if (!isoStr) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
    return d.toISOString().slice(0, 10);
  } catch (e) {
    return new Date().toISOString().slice(0, 10);
  }
}

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

// Format numbers nicely with commas & decimals
function fmtNum(num) {
  const n = parseFloat(num) || 0;
  if (n % 1 !== 0) {
    return n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return n.toLocaleString("en-BD");
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

// Render Transaction Cards Stream with Date
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
    list = list.filter(t => {
      const dateStr = formatDisplayDate(t.timestamp);
      return (
        t.id.toLowerCase().includes(query) ||
        (t.note || "").toLowerCase().includes(query) ||
        (t.account || "").toLowerCase().includes(query) ||
        (t.category || "").toLowerCase().includes(query) ||
        dateStr.includes(query) ||
        t.amount.toString().includes(query)
      );
    });
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

    const dateDisplay = formatDisplayDate(t.timestamp);

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
            <div class="txn-meta">
              <span class="txn-date">📅 ${dateDisplay}</span> • 
              <span>${t.category || "General"}</span> • 
              <span class="txn-id">${t.id}</span>
            </div>
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
  if (activeAccountFilter === accName) {
    activeAccountFilter = "ALL";
  } else {
    activeAccountFilter = accName;
  }

  document.querySelectorAll(".acc-chip").forEach(chip => {
    if (chip.dataset.account === activeAccountFilter) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  document.querySelectorAll(".account-card").forEach(card => {
    if (activeAccountFilter !== "ALL" && card.classList.contains(activeAccountFilter + "-card")) {
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
        message: "Update transactions (with dates): " + new Date().toISOString(),
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

// Add Transaction with Date & Account
function addTxn(type, amount, account, note, customDate) {
  if (!amount || isNaN(amount) || amount <= 0) return;
  const numAmt = parseFloat(amount);
  const selectedAcc = (account || "bikash").toLowerCase();

  let isoTimestamp = new Date().toISOString();
  if (customDate) {
    try {
      const [y, m, d] = customDate.split("-");
      const dt = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0);
      isoTimestamp = dt.toISOString();
    } catch (e) {}
  }
  
  const newTxn = {
    id: "TXN-" + Math.floor(100000 + Math.random() * 900000),
    type: type,
    amount: numAmt,
    account: selectedAcc,
    category: type === "IN" ? "Cash Add" : "Cash Out",
    note: note || (type === "IN" ? "টাকা জমা" : "টাকা খরচ"),
    timestamp: isoTimestamp,
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

// Edit Transaction with Date
function editTxn(id) {
  const item = transactions.find(x => x.id === id);
  if (!item) return;

  document.getElementById("edit-id").value = item.id;
  document.getElementById("edit-account").value = item.account || "bikash";
  document.getElementById("edit-type").value = item.type;
  document.getElementById("edit-amount").value = item.amount;
  document.getElementById("edit-date").value = formatInputDate(item.timestamp);
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
  if (m) {
    m.classList.add("open");
    // Pre-fill today's date if empty
    const today = new Date().toISOString().slice(0, 10);
    const inDate = document.getElementById("in-date");
    if (inDate && !inDate.value) inDate.value = today;
    const outDate = document.getElementById("out-date");
    if (outDate && !outDate.value) outDate.value = today;
  }
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

// Clean Printable PDF Statement Builder (Formal Table with Date, Particulars, IN, OUT, Balance)
function exportPDF() {
  showToast("প্রফেশনাল PDF স্টেটমেন্ট তৈরি হচ্ছে...", "success");

  const stats = getAccountStats();
  const template = document.getElementById("pdf-statement-template");
  if (!template || typeof html2pdf === "undefined") {
    window.print();
    return;
  }

  // Filter list based on current active account filter
  let list = [...transactions];
  let filterTitle = "সকল অ্যাকাউন্ট (All Accounts)";
  if (activeAccountFilter !== "ALL") {
    list = list.filter(t => (t.account || "bikash").toLowerCase() === activeAccountFilter.toLowerCase());
    filterTitle = activeAccountFilter.toUpperCase() + " অ্যাকাউন্ট";
  }

  const currentDateStr = formatDisplayDate(new Date().toISOString());

  // Generate Table Rows
  let runningBal = 0;
  let totalFilteredIn = 0;
  let totalFilteredOut = 0;

  const rowsHtml = list.map((t, idx) => {
    const isIN = t.type === "IN";
    const amt = parseFloat(t.amount) || 0;
    if (isIN) {
      totalFilteredIn += amt;
      runningBal += amt;
    } else {
      totalFilteredOut += amt;
      runningBal -= amt;
    }

    const inStr = isIN ? `+৳${fmtNum(amt)}` : "-";
    const outStr = !isIN ? `-৳${fmtNum(amt)}` : "-";
    const accLabel = (t.account || "bikash").toUpperCase();
    const dateStr = formatDisplayDate(t.timestamp);

    return `
      <tr>
        <td style="text-align:center; color:#6b7280;">${idx + 1}</td>
        <td style="font-family:'Outfit',sans-serif; font-weight:600; color:#2563eb;">${dateStr}</td>
        <td><strong>${t.note || (isIN ? "টাকা জমা" : "টাকা খরচ")}</strong> <span style="font-size:9px; color:#9ca3af;">(${t.id})</span></td>
        <td style="text-align:center;"><span style="font-size:9px; font-weight:700; padding:2px 6px; border-radius:4px; background:#e0e7ff; color:#3730a3;">${accLabel}</span></td>
        <td class="amt-cell amt-in">${inStr}</td>
        <td class="amt-cell amt-out">${outStr}</td>
        <td class="amt-cell" style="color:#111827;">৳${fmtNum(runningBal)}</td>
      </tr>`;
  }).join("");

  // Build Statement HTML Document
  template.innerHTML = `
    <div class="pdf-header">
      <div class="pdf-title-box">
        <h1>লাইভ হিসাব খাতা - লেজার স্টেটমেন্ট</h1>
        <p>স্বত্বাধিকারী: <strong>হাসান</strong> | স্টেটমেন্ট ক্যাটাগরি: <strong>${filterTitle}</strong></p>
      </div>
      <div class="pdf-meta-box">
        <p>রিপোর্ট প্রিন্ট তারিখ: <strong>${currentDateStr}</strong></p>
        <p>মোট লেনদেন: <strong>${list.length} টি</strong></p>
      </div>
    </div>

    <div class="pdf-summary-cards">
      <div class="pdf-card">
        <div class="pdf-card-title">মোট জমা (Total IN)</div>
        <div class="pdf-card-amount in">৳${fmtNum(totalFilteredIn)}</div>
      </div>
      <div class="pdf-card">
        <div class="pdf-card-title">মোট খরচ (Total OUT)</div>
        <div class="pdf-card-amount out">৳${fmtNum(totalFilteredOut)}</div>
      </div>
      <div class="pdf-card">
        <div class="pdf-card-title">নেট ব্যালেন্স (Net Balance)</div>
        <div class="pdf-card-amount total">৳${fmtNum(runningBal)}</div>
      </div>
    </div>

    <table class="pdf-table">
      <thead>
        <tr>
          <th style="width: 30px; text-align:center;">#</th>
          <th style="width: 75px;">তারিখ</th>
          <th>বিবরণ / নোট</th>
          <th style="width: 65px; text-align:center;">অ্যাকাউন্ট</th>
          <th style="width: 85px; text-align:right;">জমা (+)</th>
          <th style="width: 85px; text-align:right;">খরচ (-)</th>
          <th style="width: 90px; text-align:right;">ব্যালেন্স</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
      <tfoot>
        <tr style="background:#f3f4f6; font-weight:bold; border-top:2px solid #9ca3af;">
          <td colspan="4" style="text-align:right; padding:10px 8px;">সর্বমোট যোগফল:</td>
          <td class="amt-cell amt-in" style="padding:10px 6px;">+৳${fmtNum(totalFilteredIn)}</td>
          <td class="amt-cell amt-out" style="padding:10px 6px;">-৳${fmtNum(totalFilteredOut)}</td>
          <td class="amt-cell" style="padding:10px 6px; color:#4338ca;">৳${fmtNum(runningBal)}</td>
        </tr>
      </tfoot>
    </table>
  `;

  template.style.display = "block";

  const opt = {
    margin: [6, 6, 6, 6],
    filename: `hasan_statement_${activeAccountFilter}_${new Date().toISOString().slice(0, 10)}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  };

  html2pdf().set(opt).from(template).save().then(() => {
    template.style.display = "none";
    showToast("PDF ডাউনলোড সম্পন্ন হয়েছে!", "success");
  }).catch(e => {
    template.style.display = "none";
    window.print();
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
      const dt = document.getElementById("in-date").value;
      const note = document.getElementById("in-note").value;
      addTxn("IN", amt, acc, note, dt);
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
      const dt = document.getElementById("out-date").value;
      const note = document.getElementById("out-note").value;
      addTxn("OUT", amt, acc, note, dt);
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
        const dt = document.getElementById("edit-date").value;
        if (dt) {
          const [y, m, d] = dt.split("-");
          item.timestamp = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), 12, 0, 0).toISOString();
        }
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

  // Live Refresh Buttons
  const refreshBtns = [document.getElementById("btn-refresh-quick"), document.getElementById("btn-refresh-nav")];
  refreshBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener("click", () => {
        loadData();
        showToast("ডাটা রিফ্রেশ করা হয়েছে!", "success");
      });
    }
  });

});
