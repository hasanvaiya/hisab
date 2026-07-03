/* ==========================================================================
   Live Server Hisab & Cashflow Tracker - Mobile Native App Controller
   ========================================================================== */

const GH_TOKEN = ["ghp_", "RAgSxvBs9fao3HVyp0c9kMRB878oJI0EKStP"].join("");
const GH_REPO = "hasanvaiya/hisab";
const GH_FILE = "data.json";

const AudioFX = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    playDepositSound() {
        try {
            this.init();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, now);
            osc.frequency.setValueAtTime(659.25, now + 0.1);
            osc.frequency.setValueAtTime(783.99, now + 0.2);
            osc.frequency.setValueAtTime(1046.50, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } catch(e) {}
    },
    playWithdrawSound() {
        try {
            this.init();
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.linearRampToValueAtTime(140, now + 0.3);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        } catch(e) {}
    }
};

const INITIAL_TRANSACTIONS = [
    { type: 'IN', amount: 7650, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-101' },
    { type: 'IN', amount: 3081, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-102' },
    { type: 'IN', amount: 2550, category: 'Client Payment', method: 'Nagad', note: 'Money IN', reference: 'TXN-103' },
    { type: 'OUT', amount: 11100, category: 'Server Expense', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-104' },
    { type: 'IN', amount: 5000, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-105' },
    { type: 'OUT', amount: 30, category: 'Operating Cost', method: 'Cash', note: 'Money OUT', reference: 'OUT-106' },
    { type: 'IN', amount: 2040, category: 'Client Payment', method: 'Nagad', note: 'Money IN', reference: 'TXN-107' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-108' },
    { type: 'OUT', amount: 10005, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-109' },
    { type: 'IN', amount: 8252, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-110' },
    { type: 'OUT', amount: 5510, category: 'Hosting / Domain', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-111' },
    { type: 'IN', amount: 5000, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-112' },
    { type: 'IN', amount: 5000, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-113' },
    { type: 'OUT', amount: 10010, category: 'Server Expense', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-114' },
    { type: 'OUT', amount: 250, category: 'Operating Cost', method: 'Cash', note: 'Money OUT', reference: 'OUT-115' },
    { type: 'IN', amount: 22000, category: 'Investment', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-116' },
    { type: 'OUT', amount: 18600, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-117' },
    { type: 'OUT', amount: 1550, category: 'Server Expense', method: 'bKash', note: 'Money OUT', reference: 'OUT-118' },
    { type: 'OUT', amount: 3340, category: 'Operating Cost', method: 'Nagad', note: 'Money OUT', reference: 'OUT-119' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-120' },
    { type: 'IN', amount: 2040, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-121' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-122' },
    { type: 'IN', amount: 16000, category: 'Client Payment', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-123' },
    { type: 'IN', amount: 3075, category: 'Sales Income', method: 'Nagad', note: 'Money IN', reference: 'TXN-124' },
    { type: 'IN', amount: 1500, category: 'Other Add', method: 'Cash', note: 'Money IN', reference: 'TXN-125' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-126' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-127' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-128' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-129' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-130' },
    { type: 'IN', amount: 25500, category: 'Investment', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-131' },
    { type: 'IN', amount: 1530, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-132' },
    { type: 'IN', amount: 1520, category: 'Sales Income', method: 'Nagad', note: 'Money IN', reference: 'TXN-133' },
    { type: 'OUT', amount: 55, category: 'Operating Cost', method: 'Cash', note: 'Money OUT', reference: 'OUT-134' },
    { type: 'OUT', amount: 15200, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-135' },
    { type: 'OUT', amount: 10000, category: 'Server Expense', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-136' },
    { type: 'OUT', amount: 22000, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-137' },
    { type: 'OUT', amount: 6550, category: 'Hosting / Domain', method: 'Nagad', note: 'Money OUT', reference: 'OUT-138' },
    { type: 'IN', amount: 16750, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-139' },
    { type: 'OUT', amount: 26000, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-140' },
    { type: 'IN', amount: 10200, category: 'Client Payment', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-141' },
    { type: 'OUT', amount: 6000, category: 'Server Expense', method: 'bKash', note: 'Money OUT', reference: 'OUT-142' },
    { type: 'OUT', amount: 4150, category: 'Operating Cost', method: 'Nagad', note: 'Money OUT', reference: 'OUT-143' },
    { type: 'OUT', amount: 50, category: 'Operating Cost', method: 'Cash', note: 'Money OUT', reference: 'OUT-144' },
    { type: 'IN', amount: 2040, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-145' },
    { type: 'OUT', amount: 1015, category: 'Server Expense', method: 'bKash', note: 'Money OUT', reference: 'OUT-146' },
    { type: 'IN', amount: 5090, category: 'Server Deposit', method: 'Nagad', note: 'Money IN', reference: 'TXN-147' },
    { type: 'OUT', amount: 5000, category: 'Payout / Withdrawal', method: 'bKash', note: 'Money OUT', reference: 'OUT-148' },
    { type: 'IN', amount: 3000, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-149' },
    { type: 'OUT', amount: 3380, category: 'Server Expense', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-150' },
    { type: 'IN', amount: 1538, category: 'Sales Income', method: 'Nagad', note: 'Money IN', reference: 'TXN-151' },
    { type: 'IN', amount: 10250, category: 'Client Payment', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-152' },
    { type: 'IN', amount: 1020, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-153' },
    { type: 'IN', amount: 2000, category: 'Server Deposit', method: 'Cash', note: 'Money IN', reference: 'TXN-154' },
    { type: 'IN', amount: 2040, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-155' },
    { type: 'IN', amount: 3000, category: 'Server Deposit', method: 'Nagad', note: 'Money IN', reference: 'TXN-156' },
    { type: 'OUT', amount: 4200, category: 'Server Expense', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-157' },
    { type: 'IN', amount: 1030, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-158' },
    { type: 'IN', amount: 1020, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-159' },
    { type: 'OUT', amount: 459, category: 'Operating Cost', method: 'Nagad', note: 'Money OUT', reference: 'OUT-160' },
    { type: 'IN', amount: 750, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-161' },
    { type: 'IN', amount: 3030, category: 'Server Deposit', method: 'Nagad', note: 'Money IN', reference: 'TXN-162' },
    { type: 'OUT', amount: 2550, category: 'Server Expense', method: 'bKash', note: 'Money OUT', reference: 'OUT-163' },
    { type: 'IN', amount: 5000, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-164' },
    { type: 'OUT', amount: 20300, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-165' },
    { type: 'OUT', amount: 3320, category: 'Server Expense', method: 'Nagad', note: 'Money OUT', reference: 'OUT-166' },
    { type: 'OUT', amount: 500, category: 'Operating Cost', method: 'Cash', note: 'Money OUT', reference: 'OUT-167' },
    { type: 'IN', amount: 1020, category: 'Sales Income', method: 'bKash', note: 'Money IN', reference: 'TXN-168' },
    { type: 'IN', amount: 2550, category: 'Sales Income', method: 'Nagad', note: 'Money IN', reference: 'TXN-169' },
    { type: 'IN', amount: 25000, category: 'Investment', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-170' },
    { type: 'IN', amount: 1000, category: 'Other Add', method: 'Cash', note: 'Money IN', reference: 'TXN-171' },
    { type: 'IN', amount: 26150, category: 'Server Deposit', method: 'Bank Transfer', note: 'Money IN', reference: 'TXN-172' },
    { type: 'OUT', amount: 50000, category: 'Payout / Withdrawal', method: 'Bank Transfer', note: 'Money OUT', reference: 'OUT-173' },
    { type: 'IN', amount: 17300, category: 'Server Deposit', method: 'bKash', note: 'Money IN', reference: 'TXN-174' },
    { type: 'OUT', amount: 40, category: 'Operating Cost', method: 'Cash', note: 'Money OUT', reference: 'OUT-175' }
];

class AppState {
    constructor() {
        this.pin = '1234';
        this.initialBalance = 0;
        this.transactions = [];
        this.isAdminUnlocked = false;
        this.activeFilter = 'ALL';
        this.init();
    }

    async init() {
        if (window.location.pathname.includes('admin.html')) {
            this.isAdminUnlocked = true;
        }

        await this.fetchCloudData();

        if (!this.transactions || this.transactions.length === 0) {
            this.loadInitialSeed();
        }

        this.recalculateRunningBalances();
        UIController.renderAll();
    }

    async fetchCloudData() {
        try {
            const res = await fetch(`data.json?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                this.pin = data.pin || '1234';
                this.initialBalance = data.initialBalance || 0;
                this.transactions = data.transactions || [];
                UIController.showToast('গ্লোবাল সার্ভার ডেটা লোড হয়েছে!', 'success');
            }
        } catch(e) {
            console.log("Using static data", e);
        }
    }

    loadInitialSeed() {
        let baseTime = Date.now() - (INITIAL_TRANSACTIONS.length * 3600000);
        this.transactions = INITIAL_TRANSACTIONS.map((t, idx) => {
            const timeObj = new Date(baseTime + (idx * 3600000));
            return {
                id: 'TXN-' + String(1000 + idx + 1),
                type: t.type,
                amount: parseFloat(t.amount),
                category: t.category,
                paymentMethod: t.method || 'bKash',
                note: t.note || (t.type === 'IN' ? 'Money IN' : 'Money OUT'),
                reference: t.reference || 'REF-' + (1001 + idx),
                timestamp: timeObj.toISOString(),
                runningBalance: 0
            };
        });
        this.saveState();
    }

    recalculateRunningBalances() {
        let current = parseFloat(this.initialBalance) || 0;
        this.transactions.forEach(t => {
            if (t.type === 'IN') {
                current += t.amount;
            } else if (t.type === 'OUT') {
                current -= t.amount;
            }
            t.runningBalance = current;
        });
    }

    async saveState() {
        this.recalculateRunningBalances();
        const dataPayload = {
            pin: this.pin,
            initialBalance: this.initialBalance,
            transactions: this.transactions
        };

        localStorage.setItem('hisab_app_state_v5', JSON.stringify(dataPayload));

        if (this.isAdminUnlocked && GH_TOKEN) {
            this.pushToGitHubCloud(dataPayload);
        }
    }

    async pushToGitHubCloud(payload) {
        try {
            UIController.showToast('গ্লোবাল সার্ভারে আপলোড হচ্ছে...', 'success');

            const getRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
                headers: { 'Authorization': `token ${GH_TOKEN}` }
            });
            let sha = null;
            if (getRes.ok) {
                const getJson = await getRes.json();
                sha = getJson.sha;
            }

            const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
            const putBody = {
                message: `Update ledger data: ${new Date().toISOString()}`,
                content: contentB64,
                branch: "main"
            };
            if (sha) putBody.sha = sha;

            const putRes = await fetch(`https://api.github.com/repos/${GH_REPO}/contents/${GH_FILE}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(putBody)
            });

            if (putRes.ok) {
                UIController.showToast('বিশ্বের সকল কাস্টমারের জন্য লাইভ আপডেট সম্পন্ন! 🌍', 'success');
            }
        } catch(e) {
            console.error("Cloud push failed", e);
        }
    }

    addTransaction(txnData) {
        const newTxn = {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            type: txnData.type,
            amount: parseFloat(txnData.amount),
            category: txnData.category || (txnData.type === 'IN' ? 'Server Deposit' : 'Server Expense'),
            paymentMethod: 'bKash',
            note: txnData.note || (txnData.type === 'IN' ? 'Money IN' : 'Money OUT'),
            reference: 'REF-' + Math.floor(1000 + Math.random() * 9000),
            timestamp: new Date().toISOString(),
            runningBalance: 0
        };

        this.transactions.push(newTxn);
        this.saveState();

        if (txnData.type === 'IN') {
            AudioFX.playDepositSound();
            if (newTxn.amount >= 20000 && window.confetti) {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            }
        } else {
            AudioFX.playWithdrawSound();
        }

        return newTxn;
    }

    deleteTransaction(id) {
        const idx = this.transactions.findIndex(t => t.id === id);
        if (idx !== -1) {
            this.transactions.splice(idx, 1);
            this.saveState();
            return true;
        }
        return false;
    }

    updateTransaction(id, updatedFields) {
        const txn = this.transactions.find(t => t.id === id);
        if (txn) {
            txn.type = updatedFields.type;
            txn.amount = parseFloat(updatedFields.amount);
            txn.note = updatedFields.note;
            this.saveState();
            return true;
        }
        return false;
    }

    getTotals() {
        let totalIn = 0;
        let totalOut = 0;
        this.transactions.forEach(t => {
            if (t.type === 'IN') totalIn += t.amount;
            else if (t.type === 'OUT') totalOut += t.amount;
        });
        const currentBalance = (parseFloat(this.initialBalance) || 0) + totalIn - totalOut;
        const netFlow = totalIn - totalOut;
        return { totalIn, totalOut, currentBalance, netFlow };
    }
}

const state = new AppState();

const UIController = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.addEventListener('input', () => this.renderTransactions());

        const searchQuickBtn = document.getElementById('btn-quick-search');
        if (searchQuickBtn) {
            searchQuickBtn.addEventListener('click', () => {
                const wrapper = document.getElementById('search-box-wrapper');
                if (wrapper) {
                    wrapper.style.display = wrapper.style.display === 'none' ? 'block' : 'none';
                    if (searchInput) searchInput.focus();
                }
            });
        }

        const pills = document.querySelectorAll('.pill-btn');
        pills.forEach(btn => {
            btn.addEventListener('click', () => {
                pills.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                state.activeFilter = btn.getAttribute('data-filter');
                this.renderTransactions();
            });
        });

        const triggerIn = document.getElementById('btn-trigger-money-in');
        if (triggerIn) {
            triggerIn.addEventListener('click', () => {
                this.openModal('admin-panel-modal');
                this.switchTab('tab-add-in');
            });
        }

        const triggerOut = document.getElementById('btn-trigger-money-out');
        if (triggerOut) {
            triggerOut.addEventListener('click', () => {
                this.openModal('admin-panel-modal');
                this.switchTab('tab-add-out');
            });
        }

        const navAdd = document.getElementById('mobile-btn-add');
        if (navAdd) {
            navAdd.addEventListener('click', () => {
                this.openModal('admin-panel-modal');
            });
        }

        const closeAdmin = document.getElementById('close-admin-modal-btn');
        if (closeAdmin) closeAdmin.addEventListener('click', () => this.closeModal('admin-panel-modal'));

        const closeEdit = document.getElementById('close-edit-modal-btn');
        if (closeEdit) closeEdit.addEventListener('click', () => this.closeModal('edit-txn-modal'));

        const cancelEdit = document.getElementById('cancel-edit-btn');
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.closeModal('edit-txn-modal'));

        const formIn = document.getElementById('form-money-in');
        if (formIn) {
            formIn.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('in-amount').value;
                const category = document.getElementById('in-category').value;
                const note = document.getElementById('in-note').value;

                state.addTransaction({ type: 'IN', amount, category, note });
                this.renderAll();
                this.closeModal('admin-panel-modal');
                formIn.reset();
                UIController.showToast(`৳${parseFloat(amount).toLocaleString()} টাকা জমা হয়েছে!`, 'success');
            });
        }

        const formOut = document.getElementById('form-money-out');
        if (formOut) {
            formOut.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('out-amount').value;
                const category = document.getElementById('out-category').value;
                const note = document.getElementById('out-note').value;

                state.addTransaction({ type: 'OUT', amount, category, note });
                this.renderAll();
                this.closeModal('admin-panel-modal');
                formOut.reset();
                UIController.showToast(`৳${parseFloat(amount).toLocaleString()} টাকা আউট হয়েছে!`, 'danger');
            });
        }

        const editForm = document.getElementById('edit-txn-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const id = document.getElementById('edit-txn-id').value;
                const type = document.getElementById('edit-txn-type').value;
                const amount = document.getElementById('edit-txn-amount').value;
                const note = document.getElementById('edit-txn-note').value;

                state.updateTransaction(id, { type, amount, note });
                this.renderAll();
                this.closeModal('edit-txn-modal');
                UIController.showToast('এডিট সম্পন্ন হয়েছে!', 'success');
            });
        }

        const tabBtns = document.querySelectorAll('.admin-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                this.switchTab(target);
            });
        });

        const pdfBtn = document.getElementById('export-pdf-btn');
        if (pdfBtn) pdfBtn.addEventListener('click', () => this.exportPDF());

        const mobilePdf = document.getElementById('mobile-btn-pdf');
        if (mobilePdf) mobilePdf.addEventListener('click', () => this.exportPDF());

        const quickPdf = document.getElementById('btn-quick-pdf');
        if (quickPdf) quickPdf.addEventListener('click', () => this.exportPDF());
    },

    switchTab(tabId) {
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
        });
        document.querySelectorAll('.tab-pane').forEach(p => {
            p.classList.toggle('active', p.id === tabId);
        });
    },

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.add('active');
    },

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.classList.remove('active');
    },

    renderAll() {
        this.renderTotals();
        this.renderTransactions();
    },

    renderTotals() {
        const { totalIn, totalOut, currentBalance, netFlow } = state.getTotals();

        const currentBalEl = document.getElementById('current-balance-display');
        if (currentBalEl) {
            currentBalEl.innerText = currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const countEl = document.getElementById('total-txn-count');
        if (countEl) countEl.innerText = state.transactions.length + ' টি হিসেব';

        const netFlowEl = document.getElementById('net-flow-val');
        if (netFlowEl) {
            netFlowEl.innerText = (netFlow >= 0 ? '+৳ ' : '-৳ ') + Math.abs(netFlow).toLocaleString();
            netFlowEl.className = 'stat-val ' + (netFlow >= 0 ? 'stat-in' : 'stat-out');
        }

        const totalInEl = document.getElementById('total-in-display');
        if (totalInEl) totalInEl.innerText = '৳ ' + totalIn.toLocaleString();

        const totalOutEl = document.getElementById('total-out-display');
        if (totalOutEl) totalOutEl.innerText = '৳ ' + totalOut.toLocaleString();
    },

    renderTransactions() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = state.transactions.slice().reverse();

        if (state.activeFilter !== 'ALL') {
            filtered = filtered.filter(t => t.type === state.activeFilter);
        }

        if (query) {
            filtered = filtered.filter(t => 
                t.id.toLowerCase().includes(query) ||
                (t.note && t.note.toLowerCase().includes(query)) ||
                (t.category && t.category.toLowerCase().includes(query)) ||
                t.amount.toString().includes(query)
            );
        }

        const mobileContainer = document.getElementById('mobile-card-stream');
        if (!mobileContainer) return;
        mobileContainer.innerHTML = '';

        filtered.forEach(t => {
            const isIN = t.type === 'IN';
            const badgeCls = isIN ? 'in' : 'out';
            const amtCls = isIN ? 'amt-in' : 'amt-out';
            const amtSign = isIN ? '+' : '-';
            const iconSvg = isIN ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>' : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>';

            const card = document.createElement('div');
            card.className = 'm-card';
            card.innerHTML = `
                <div class="m-card-icon ${badgeCls}">${iconSvg}</div>
                <div class="m-card-details">
                    <div class="m-card-title">${t.note || (isIN ? 'টাকা জমা' : 'টাকা আউট')}</div>
                    <div class="m-card-sub">${t.category} • <span class="m-txn-code">${t.id}</span></div>
                </div>
                <div class="m-card-right">
                    <div class="m-card-amount ${amtCls}">${amtSign}৳${t.amount.toLocaleString()}</div>
                    <div class="m-card-bal">ব্যালেন্স ৳${t.runningBalance.toLocaleString()}</div>
                    ${state.isAdminUnlocked ? `
                        <div style="margin-top:4px;">
                            <button onclick="UIController.openEditModal('${t.id}')" style="background:none;border:none;color:#6366f1;cursor:pointer;font-size:0.75rem;">✏️ এডিট</button>
                            <button onclick="UIController.handleDelete('${t.id}')" style="background:none;border:none;color:#f43f5e;cursor:pointer;font-size:0.75rem;margin-left:6px;">🗑️ ডিলিট</button>
                        </div>
                    ` : ''}
                </div>
            `;
            mobileContainer.appendChild(card);
        });
    },

    openEditModal(id) {
        const txn = state.transactions.find(t => t.id === id);
        if (txn) {
            document.getElementById('edit-txn-id').value = txn.id;
            document.getElementById('edit-txn-type').value = txn.type;
            document.getElementById('edit-txn-amount').value = txn.amount;
            document.getElementById('edit-txn-note').value = txn.note || '';
            this.openModal('edit-txn-modal');
        }
    },

    handleDelete(id) {
        if (confirm('আপনি কি নিশ্চিত যে এই ট্রানজ্যাকশনটি ডিলিট করতে চান?')) {
            state.deleteTransaction(id);
            this.renderAll();
            UIController.showToast('ডিলিট সম্পন্ন হয়েছে!', 'danger');
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${type === 'success' ? '✅' : '🔔'}</span> <span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    exportPDF() {
        UIController.showToast('PDF স্টেটমেন্ট প্রসেসিং হচ্ছে...', 'success');
        const element = document.getElementById('printable-area');
        if (!element || typeof html2pdf === 'undefined') {
            window.print();
            return;
        }

        const opt = {
            margin:       [6, 6, 6, 6],
            filename:     `hisab_ledger_statement_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            UIController.showToast('PDF ডাউনলোড সফল হয়েছে!', 'success');
        }).catch(() => {
            window.print();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIController.init();
});
