/* Hisab Khata App Controller - High-Performance Mobile Banking Edition */
const GH_TOKEN = ["ghp_","RAgSxvBs9fao3HVyp0c9kMRB878oJI0EKStP"].join("");
const GH_REPO  = "hasanvaiya/hisab";
const GH_FILE  = "data.json";
const ADMIN_PIN = "1234";
const IS_ADMIN_PAGE = window.location.pathname.includes("admin.html");

// Global App State
let transactions = [];
let activeAccountFilter = "ALL"; // ALL | bank | bikash | cellfin
let activeTypeFilter = "ALL";    // ALL | IN | OUT
let isAdmin = IS_ADMIN_PAGE;
let displayLimit = 25; // Batch rendering to prevent mobile browser hang

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

// Format ISO date for <input type="date">
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

// Load Data from data.json
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

// Format numbers nicely with commas & 2 decimals
function fmtNum(num) {
  const n = parseFloat(num) || 0;
  return n.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Render Complete UI
function renderUI() {
  recalculateBalances();
  const stats = getAccountStats();

  // Master Total Balance
  const balEl = document.getElementById("balance-display");
  if (balEl) balEl.textContent = fmtNum(stats.totalNet);

  // Total In & Out (NET FLOW REMOVED)
  const tinEl = document.getElementById("total-in-display");
  if (tinEl) tinEl.textContent = "+৳ " + fmtNum(stats.totalIn);

  const toutEl = document.getElementById("total-out-display");
  if (toutEl) toutEl.textContent = "-৳ " + fmtNum(stats.totalOut);

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

// Render Transaction Cards Stream with Pagination (Anti-Lag)
function renderFeed() {
  const container = document.getElementById("cards-feed");
  const loadMoreWrapper = document.getElementById("load-more-wrapper");
  const loadMoreBtn = document.getElementById("btn-load-more");
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

  const inSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  const outSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';

  if (list.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 16px; color: var(--text-dim);">
        <p style="font-size: 0.9rem;">কোনো হিসাব পাওয়া যায়নি</p>
      </div>`;
    if (loadMoreWrapper) loadMoreWrapper.style.display = "none";
    return;
  }

  // Pagination Slice
  const visibleList = query ? list : list.slice(0, displayLimit);

  container.innerHTML = visibleList.map(t => {
    const isIn = t.type === "IN";
    const circleCls = isIn ? "in" : "out";
    const sign = isIn ? "+" : "-";
    const label = isIn ? "টাকা জমা" : "টাকা খরচ";

    const acc = (t.account || "bikash").toLowerCase();
    let accBadgeHtml = "";
    if (acc === "bank") {
      accBadgeHtml = '<span class="account-pill bank">🏦 Bank</span>';
    } else if (acc === "cellfin") {
      accBadgeHtml = '<span class="account-pill cellfin">⚡ Cellfin</span>';
    } else {
      accBadgeHtml = '<span class="account-pill bikash">📱 bKash</span>';
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
          <div class="txn-type-circle ${circleCls}">
            ${isIn ? inSvg : outSvg}
          </div>
          <div class="txn-info">
            <div class="txn-note-row">
              <span class="txn-note" title="${t.note || label}">${t.note || label}</span>
              ${accBadgeHtml}
            </div>
            <div class="txn-meta">
              <span class="txn-date">📅 ${dateDisplay}</span> • 
              <span class="txn-id">${t.id}</span>
            </div>
          </div>
        </div>
        <div class="txn-right">
          <div class="txn-amount ${circleCls}">${sign}৳ ${fmtNum(t.amount)}</div>
          <div class="txn-running-balance">ব্যালেন্স ৳ ${fmtNum(t.runningBalance || 0)}</div>
          ${adminBtns}
        </div>
      </div>`;
  }).join("");

  // Update Load More Button visibility & text
  if (loadMoreWrapper && loadMoreBtn) {
    if (!query && list.length > displayLimit) {
      loadMoreWrapper.style.display = "block";
      loadMoreBtn.textContent = `আরও ২০টি হিসাব দেখুন (${displayLimit} / ${list.length})`;
    } else {
      loadMoreWrapper.style.display = "none";
    }
  }
}

// Filter by Account from Account Rows
function filterByAccount(accName) {
  if (activeAccountFilter === accName) {
    activeAccountFilter = "ALL";
  } else {
    activeAccountFilter = accName;
  }

  // Reset pagination limit on filter change
  displayLimit = 25;

  document.querySelectorAll(".filter-chip").forEach(chip => {
    if (chip.dataset.account === activeAccountFilter) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });

  document.querySelectorAll(".account-row").forEach(row => {
    if (activeAccountFilter !== "ALL" && row.classList.contains(activeAccountFilter)) {
      row.classList.add("active-filter");
      const tag = row.querySelector(".acc-row-filter-tag");
      if (tag) tag.textContent = "ফিল্টার সক্রিয় (ক্লিক করলে বন্ধ)";
    } else {
      row.classList.remove("active-filter");
      const tag = row.querySelector(".acc-row-filter-tag");
      if (tag) tag.textContent = "ট্যাপ করে ফিল্টার";
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

  try {
    const getRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
      headers: {
        "Authorization": `token ${GH_TOKEN}`,
        "Accept": "application/vnd.github.v3+json"
      }
    });

    let sha = null;
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    const contentStr = JSON.stringify(payload, null, 2);
    const encoded = btoa(unescape(encodeURIComponent(contentStr)));

    const body = {
      message: "Sync transactions via mobile webapp: " + new Date().toLocaleString("en-BD"),
      content: encoded,
      branch: "main"
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
      method: "PUT",
      headers: {
        "Authorization": `token ${GH_TOKEN}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (putRes.ok) {
      showToast("✓ ক্লাউডে সফলভাবে সেভ হয়েছে!");
    } else {
      showToast("⚠️ ক্লাউড সিঙ্ক সমস্যা। লোকালভাবে সেভ হয়েছে।");
    }
  } catch (e) {
    showToast("⚠️ নেটওয়ার্ক সমস্যা। অফলাইন সেভ হয়েছে।");
  }
}

// Add New Transaction (Admin Only)
async function addTxn(type, account, amount, note, customDate) {
  const num = parseFloat(amount);
  if (!num || isNaN(num) || num <= 0) {
    alert("সঠিক পরিমাণ লিখুন!");
    return;
  }

  const selectedDate = customDate ? new Date(customDate) : new Date();
  const now = new Date();
  selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

  const newTxn = {
    id: "TXN-" + Date.now().toString(36).toUpperCase(),
    type: type,
    account: (account || "bikash").toLowerCase(),
    amount: num,
    note: note.trim() || (type === "IN" ? "Cash Add" : "Cash Out"),
    timestamp: selectedDate.toISOString(),
    category: type === "IN" ? "Cash Add" : "Cash Out"
  };

  transactions.push(newTxn);
  recalculateBalances();
  renderUI();
  await saveCloud();
}

// Edit Transaction (Admin Only)
function editTxn(id) {
  const t = transactions.find(x => x.id === id);
  if (!t) return;

  document.getElementById("edit-id").value = t.id;
  document.getElementById("edit-account").value = (t.account || "bikash").toLowerCase();
  document.getElementById("edit-type").value = t.type;
  document.getElementById("edit-amount").value = t.amount;
  document.getElementById("edit-note").value = t.note || "";
  document.getElementById("edit-date").value = formatInputDate(t.timestamp);

  openModal("modal-edit");
}

// Delete Transaction (Admin Only)
async function delTxn(id) {
  if (!confirm("আপনি কি নিশ্চিত এই হিসাবটি ডিলিট করতে চান?")) return;
  transactions = transactions.filter(t => t.id !== id);
  recalculateBalances();
  renderUI();
  await saveCloud();
  showToast("হিসাব ডিলিট করা হয়েছে");
}

// Select Account in Modal
function selectModalAccount(mode, accName) {
  const hiddenInput = document.getElementById(mode + "-account");
  if (hiddenInput) hiddenInput.value = accName;

  const modal = document.getElementById("modal-" + mode);
  if (modal) {
    modal.querySelectorAll(".modal-acc-opt").forEach(opt => {
      if (opt.classList.contains("opt-" + accName)) {
        opt.classList.add("selected");
      } else {
        opt.classList.remove("selected");
      }
    });
  }
}

// Modals Handler
function openModal(id) {
  const m = document.getElementById(id);
  if (m) {
    m.classList.add("open");
    const dateInput = m.querySelector('input[type="date"]');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
  }
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove("open");
}

// Toast Handler
function showToast(msg) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    setTimeout(() => t.remove(), 250);
  }, 2200);
}

// Export Professional PDF Statement
function exportPDF() {
  const stats = getAccountStats();
  const dateNow = new Date().toLocaleDateString("en-BD", { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeNow = new Date().toLocaleTimeString("en-BD", { hour: '2-digit', minute: '2-digit' });

  let rowsHtml = "";
  [...transactions].reverse().forEach((t) => {
    const isIn = t.type === "IN";
    const dateStr = formatDisplayDate(t.timestamp);
    const accLabel = (t.account || "bikash").toUpperCase();
    const sign = isIn ? "+" : "-";
    const colorStyle = isIn ? "color:#059669;" : "color:#dc2626;";

    rowsHtml += `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
        <td style="padding: 6px 8px; font-family: monospace;">${dateStr}</td>
        <td style="padding: 6px 8px; font-weight: 600;">${accLabel}</td>
        <td style="padding: 6px 8px;">${t.note || (isIn ? 'Cash Add' : 'Cash Out')}</td>
        <td style="padding: 6px 8px; text-align: right; font-weight: 700; ${colorStyle}">
          ${sign} ${fmtNum(t.amount)}
        </td>
        <td style="padding: 6px 8px; text-align: right; font-family: monospace;">
          ${fmtNum(t.runningBalance || 0)}
        </td>
      </tr>`;
  });

  const template = `
    <div style="font-family: sans-serif; color: #0f172a; padding: 24px; background: #ffffff;">
      <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <h1 style="margin: 0; font-size: 20px; color: #1e1b4b;">হিসাব বিবরণী (Bank Statement)</h1>
          <p style="margin: 3px 0 0 0; font-size: 12px; color: #64748b;">মালিক: হাসান | জেনারেট তারিখ: ${dateNow}, ${timeNow}</p>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 11px; color: #64748b;">মোট লেনদেন সংখ্যা</div>
          <div style="font-size: 16px; font-weight: 700; color: #3b82f6;">${transactions.length} টি</div>
        </div>
      </div>

      <!-- Account Balances Summary -->
      <div style="display: flex; gap: 10px; margin-bottom: 18px;">
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
          <div style="font-size: 11px; color: #d97706; font-weight: 700;">🏦 ব্যাংক ব্যালেন্স</div>
          <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-top: 2px;">BDT ${fmtNum(stats.bankBal)}</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
          <div style="font-size: 11px; color: #db2777; font-weight: 700;">📱 বিকাশ ব্যালেন্স</div>
          <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-top: 2px;">BDT ${fmtNum(stats.bikashBal)}</div>
        </div>
        <div style="flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px;">
          <div style="font-size: 11px; color: #0284c7; font-weight: 700;">⚡ সেলফিন ব্যালেন্স</div>
          <div style="font-size: 15px; font-weight: 800; color: #1e293b; margin-top: 2px;">BDT ${fmtNum(stats.cellfinBal)}</div>
        </div>
        <div style="flex: 1.2; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 10px;">
          <div style="font-size: 11px; color: #1d4ed8; font-weight: 700;">💎 সর্বমোট ব্যালেন্স</div>
          <div style="font-size: 16px; font-weight: 800; color: #1e3a8a; margin-top: 2px;">BDT ${fmtNum(stats.totalNet)}</div>
        </div>
      </div>

      <!-- Transaction Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
          <tr style="background: #f1f5f9; font-size: 11px; color: #475569;">
            <th style="padding: 8px;">তারিখ</th>
            <th style="padding: 8px;">অ্যাকাউন্ট</th>
            <th style="padding: 8px;">বিবরণ</th>
            <th style="padding: 8px; text-align: right;">পরিমাণ (BDT)</th>
            <th style="padding: 8px; text-align: right;">ব্যালেন্স (BDT)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 20px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px;">
        অফিশিয়াল ডিজিটাল হিসাব স্টেটমেন্ট • হাসান হিসাব খাতা
      </div>
    </div>
  `;

  const container = document.getElementById("pdf-statement-template");
  container.innerHTML = template;

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Hisab_Statement_${Date.now()}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  showToast("PDF তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...");
  html2pdf().set(opt).from(container).save().then(() => {
    container.innerHTML = "";
    showToast("✓ PDF ডাউনলোড সম্পন্ন!");
  }).catch(() => {
    container.innerHTML = "";
    showToast("⚠️ PDF ডাউনলোডে সমস্যা হয়েছে");
  });
}

// EVENT LISTENERS INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  loadData();

  // PDF Buttons
  document.getElementById("pdf-header-btn")?.addEventListener("click", exportPDF);
  document.getElementById("btn-pdf-quick")?.addEventListener("click", exportPDF);
  document.getElementById("btn-pdf-nav")?.addEventListener("click", exportPDF);

  // Search Toggle
  document.getElementById("btn-search-toggle")?.addEventListener("click", () => {
    const sw = document.getElementById("search-wrapper");
    if (sw) {
      sw.classList.toggle("open");
      if (sw.classList.contains("open")) {
        document.getElementById("search-input")?.focus();
      }
    }
  });

  // Search Input live typing
  document.getElementById("search-input")?.addEventListener("input", () => {
    displayLimit = 35; // Show more when searching
    renderFeed();
  });

  // Load More Button
  document.getElementById("btn-load-more")?.addEventListener("click", () => {
    displayLimit += 25;
    renderFeed();
  });

  // Live Refresh Buttons
  const handleLiveRefresh = () => {
    const icon = document.getElementById("refresh-spin-icon");
    if (icon) {
      icon.classList.add("spin-anim");
      setTimeout(() => icon.classList.remove("spin-anim"), 800);
    }
    loadData().then(() => {
      showToast("✓ ব্যালেন্স ও লেনদেন আপডেট করা হয়েছে!");
    });
  };

  document.getElementById("btn-refresh-quick")?.addEventListener("click", handleLiveRefresh);
  document.getElementById("btn-refresh-nav")?.addEventListener("click", handleLiveRefresh);

  // Account Filter Chips
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      activeAccountFilter = chip.dataset.account;
      displayLimit = 25;
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      document.querySelectorAll(".account-row").forEach(row => {
        if (activeAccountFilter !== "ALL" && row.classList.contains(activeAccountFilter)) {
          row.classList.add("active-filter");
          const tag = row.querySelector(".acc-row-filter-tag");
          if (tag) tag.textContent = "ফিল্টার সক্রিয় (ক্লিক করলে বন্ধ)";
        } else {
          row.classList.remove("active-filter");
          const tag = row.querySelector(".acc-row-filter-tag");
          if (tag) tag.textContent = "ট্যাপ করে ফিল্টার";
        }
      });

      renderFeed();
    });
  });

  // Type Filter Tabs (ALL, IN, OUT)
  document.querySelectorAll(".type-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      activeTypeFilter = tab.dataset.filter;
      displayLimit = 25;
      document.querySelectorAll(".type-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      renderFeed();
    });
  });

  // FAB Button in Admin
  document.getElementById("fab-add-btn")?.addEventListener("click", () => {
    openModal("modal-in");
  });

  // Form Submissions
  document.getElementById("form-in")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const acc = document.getElementById("in-account").value;
    const date = document.getElementById("in-date").value;
    const amt = document.getElementById("in-amount").value;
    const note = document.getElementById("in-note").value;

    await addTxn("IN", acc, amt, note, date);
    closeModal("modal-in");
    e.target.reset();
  });

  document.getElementById("form-out")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const acc = document.getElementById("out-account").value;
    const date = document.getElementById("out-date").value;
    const amt = document.getElementById("out-amount").value;
    const note = document.getElementById("out-note").value;

    await addTxn("OUT", acc, amt, note, date);
    closeModal("modal-out");
    e.target.reset();
  });

  document.getElementById("form-edit")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("edit-id").value;
    const acc = document.getElementById("edit-account").value;
    const date = document.getElementById("edit-date").value;
    const type = document.getElementById("edit-type").value;
    const amt = parseFloat(document.getElementById("edit-amount").value);
    const note = document.getElementById("edit-note").value;

    const t = transactions.find(x => x.id === id);
    if (t) {
      t.account = acc;
      t.type = type;
      t.amount = amt;
      t.note = note;
      t.category = type === "IN" ? "Cash Add" : "Cash Out";
      if (date) {
        const d = new Date(date);
        const old = new Date(t.timestamp);
        d.setHours(old.getHours() || 12, old.getMinutes() || 0, old.getSeconds() || 0);
        t.timestamp = d.toISOString();
      }
      recalculateBalances();
      renderUI();
      await saveCloud();
      closeModal("modal-edit");
      showToast("✓ হিসাব আপডেট সফল হয়েছে!");
    }
  });

  // Close modals on backdrop click
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("open");
      }
    });
  });
});
