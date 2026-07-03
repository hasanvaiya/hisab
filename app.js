/* ==========================================================================
   Live Server Hisab & Cashflow Tracker - Core JavaScript Controller
   Features:
   - 75 Pre-loaded Seed Transactions (Guaranteed Auto-Seeding)
   - Real-time Multi-Tab Sync via BroadcastChannel API
   - Web Audio API Sound Synthesizer
   - Mobile-First & Desktop Dual Rendering
   - Admin PIN Authentication (Default PIN: 1234)
   - Statement CSV Exporter
   ========================================================================== */

// 1. Web Audio Synthesizer
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

// 2. Initial Preloaded 75 Transactions List
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

// 3. Application State Store
class AppState {
    constructor() {
        this.pin = '1234';
        this.initialBalance = 0;
        this.transactions = [];
        this.activityLogs = [];
        this.isAdminUnlocked = false;
        this.broadcastChannel = null;
        this.init();
    }

    init() {
        const savedData = localStorage.getItem('hisab_app_state_v2');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                this.pin = parsed.pin || '1234';
                this.initialBalance = parsed.initialBalance || 0;
                this.transactions = (parsed.transactions && parsed.transactions.length > 0) ? parsed.transactions : null;
                this.activityLogs = parsed.activityLogs || [];
            } catch(e) {
                this.transactions = null;
            }
        }

        if (!this.transactions || this.transactions.length === 0) {
            this.loadInitialSeed();
        }

        if ('BroadcastChannel' in window) {
            this.broadcastChannel = new BroadcastChannel('hisab_ledger_channel');
            this.broadcastChannel.onmessage = (event) => {
                if (event.data && event.data.type === 'STATE_UPDATED') {
                    this.reloadFromStorage();
                    UIController.renderAll();
                    UIController.showToast('লাইভ সিঙ্ক: সার্ভার ডাটা আপডেট হয়েছে!', 'success');
                }
            };
        }

        this.recalculateRunningBalances();
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
                paymentMethod: t.method,
                note: t.note,
                reference: t.reference,
                timestamp: timeObj.toISOString(),
                runningBalance: 0
            };
        });
        this.logActivity('৭৫টি প্রিলোডেড লেনদেন সফলভাবে লোড হয়েছে');
        this.saveState();
    }

    reloadFromStorage() {
        const savedData = localStorage.getItem('hisab_app_state_v2');
        if (savedData) {
            const parsed = JSON.parse(savedData);
            this.pin = parsed.pin || '1234';
            this.initialBalance = parsed.initialBalance || 0;
            this.transactions = parsed.transactions || [];
            this.activityLogs = parsed.activityLogs || [];
            this.recalculateRunningBalances();
        }
    }

    saveState() {
        this.recalculateRunningBalances();
        const data = {
            pin: this.pin,
            initialBalance: this.initialBalance,
            transactions: this.transactions,
            activityLogs: this.activityLogs
        };
        localStorage.setItem('hisab_app_state_v2', JSON.stringify(data));
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({ type: 'STATE_UPDATED' });
        }
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

    addTransaction(txnData) {
        const newTxn = {
            id: 'TXN-' + Math.floor(100000 + Math.random() * 900000),
            type: txnData.type,
            amount: parseFloat(txnData.amount),
            category: txnData.category || (txnData.type === 'IN' ? 'Server Deposit' : 'Server Expense'),
            paymentMethod: txnData.paymentMethod || 'bKash',
            note: txnData.note || (txnData.type === 'IN' ? 'Money IN' : 'Money OUT'),
            reference: txnData.reference || 'REF-' + Math.floor(1000 + Math.random() * 9000),
            timestamp: new Date().toISOString(),
            runningBalance: 0
        };

        this.transactions.push(newTxn);
        this.logActivity(`${txnData.type === 'IN' ? 'টাকা জমা' : 'টাকা আউট'}: ৳${newTxn.amount.toLocaleString()} (${newTxn.note})`);
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
            const deleted = this.transactions.splice(idx, 1)[0];
            this.logActivity(`ডিলিট করা হয়েছে: ${deleted.id} (৳${deleted.amount})`);
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
            this.logActivity(`এডিট করা হয়েছে: ${id}`);
            this.saveState();
            return true;
        }
        return false;
    }

    logActivity(msg) {
        const timeStr = new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.activityLogs.unshift({ time: timeStr, text: msg });
        if (this.activityLogs.length > 30) this.activityLogs.pop();
    }

    getTotals() {
        let totalIn = 0;
        let totalOut = 0;
        let inCount = 0;
        let outCount = 0;

        this.transactions.forEach(t => {
            if (t.type === 'IN') {
                totalIn += t.amount;
                inCount++;
            } else if (t.type === 'OUT') {
                totalOut += t.amount;
                outCount++;
            }
        });

        const currentBalance = (parseFloat(this.initialBalance) || 0) + totalIn - totalOut;
        const netFlow = totalIn - totalOut;

        return { totalIn, totalOut, inCount, outCount, currentBalance, netFlow };
    }
}

const state = new AppState();

const UIController = {
    init() {
        this.bindEvents();
        this.renderAll();
    },

    bindEvents() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.addEventListener('input', () => this.renderTransactions());

        const typeFilter = document.getElementById('type-filter');
        if (typeFilter) typeFilter.addEventListener('change', () => this.renderTransactions());

        const adminBtn = document.getElementById('admin-toggle-btn');
        if (adminBtn) adminBtn.addEventListener('click', () => this.handleAdminBtnClick());

        const closePin = document.getElementById('close-pin-modal-btn');
        if (closePin) closePin.addEventListener('click', () => this.closeModal('admin-pin-modal'));

        const closeAdmin = document.getElementById('close-admin-modal-btn');
        if (closeAdmin) closeAdmin.addEventListener('click', () => this.closeModal('admin-panel-modal'));

        const closeEdit = document.getElementById('close-edit-modal-btn');
        if (closeEdit) closeEdit.addEventListener('click', () => this.closeModal('edit-txn-modal'));

        const cancelEdit = document.getElementById('cancel-edit-btn');
        if (cancelEdit) cancelEdit.addEventListener('click', () => this.closeModal('edit-txn-modal'));

        const pinForm = document.getElementById('admin-pin-form');
        if (pinForm) {
            pinForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const pinVal = document.getElementById('pin-input').value.trim();
                if (pinVal === state.pin) {
                    state.isAdminUnlocked = true;
                    document.getElementById('pin-error-msg').style.display = 'none';
                    this.closeModal('admin-pin-modal');
                    document.getElementById('pin-input').value = '';
                    this.openModal('admin-panel-modal');
                    this.renderAll();
                    UIController.showToast('এডমিন অ্যাকসেস আনলক হয়েছে!', 'success');
                } else {
                    document.getElementById('pin-error-msg').style.display = 'block';
                }
            });
        }

        const tabBtns = document.querySelectorAll('.admin-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const targetTab = btn.getAttribute('data-tab');
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                const paneEl = document.getElementById(targetTab);
                if (paneEl) paneEl.classList.add('active');
            });
        });

        const formIn = document.getElementById('form-money-in');
        if (formIn) {
            formIn.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('in-amount').value;
                const category = document.getElementById('in-category').value;
                const method = document.getElementById('in-method').value;
                const note = document.getElementById('in-note').value;
                const ref = document.getElementById('in-ref').value;

                state.addTransaction({ type: 'IN', amount, category, paymentMethod: method, note, reference: ref });
                this.renderAll();
                this.closeModal('admin-panel-modal');
                formIn.reset();
                UIController.showToast(`৳${parseFloat(amount).toLocaleString()} টাকা সফলভাবে জমা হয়েছে!`, 'success');
            });
        }

        const formOut = document.getElementById('form-money-out');
        if (formOut) {
            formOut.addEventListener('submit', (e) => {
                e.preventDefault();
                const amount = document.getElementById('out-amount').value;
                const category = document.getElementById('out-category').value;
                const method = document.getElementById('out-method').value;
                const note = document.getElementById('out-note').value;
                const ref = document.getElementById('out-ref').value;

                state.addTransaction({ type: 'OUT', amount, category, paymentMethod: method, note, reference: ref });
                this.renderAll();
                this.closeModal('admin-panel-modal');
                formOut.reset();
                UIController.showToast(`৳${parseFloat(amount).toLocaleString()} টাকা সফলভাবে আউট হয়েছে!`, 'danger');
            });
        }

        const simBtn = document.getElementById('btn-run-sim-push');
        if (simBtn) {
            simBtn.addEventListener('click', () => {
                const amount = document.getElementById('sim-amount').value || 5000;
                const type = document.getElementById('sim-type').value || 'IN';

                state.addTransaction({
                    type: type,
                    amount: amount,
                    category: 'External Push API',
                    paymentMethod: 'External API',
                    note: 'Simulated Push Call from cURL / Script',
                    reference: 'EXT-PUSH-' + Math.floor(1000 + Math.random() * 9000)
                });

                this.renderAll();
                UIController.showToast(`External Push Call Success: ৳${parseFloat(amount).toLocaleString()} (${type})`, 'success');
            });
        }

        const copyBtn = document.getElementById('copy-curl-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                const text = document.getElementById('curl-code-snippet').innerText;
                navigator.clipboard.writeText(text);
                UIController.showToast('cURL কমান্ড কপি হয়েছে!', 'success');
            });
        }

        const saveBalBtn = document.getElementById('btn-save-initial-bal');
        if (saveBalBtn) {
            saveBalBtn.addEventListener('click', () => {
                const val = parseFloat(document.getElementById('setting-initial-balance').value) || 0;
                state.initialBalance = val;
                state.saveState();
                this.renderAll();
                UIController.showToast('প্রারম্ভিক ব্যালেন্স সেভ করা হয়েছে!', 'success');
            });
        }

        const changePinBtn = document.getElementById('btn-change-pin');
        if (changePinBtn) {
            changePinBtn.addEventListener('click', () => {
                const newPin = document.getElementById('setting-new-pin').value.trim();
                if (newPin.length >= 4) {
                    state.pin = newPin;
                    state.saveState();
                    document.getElementById('setting-new-pin').value = '';
                    UIController.showToast('এডমিন PIN পরিবর্তন সফল হয়েছে!', 'success');
                } else {
                    alert('PIN কোড অন্তত ৪ ডিজিটের হতে হবে!');
                }
            });
        }

        const resetBtn = document.getElementById('btn-reset-data');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('আপনি কি নিশ্চিত যে সকল ডাটা মুছে প্রিলোডেড ৭৫টি লেনদেনে ফিরিয়ে আনবেন?')) {
                    state.loadInitialSeed();
                    this.renderAll();
                    this.closeModal('admin-panel-modal');
                    UIController.showToast('৭৫টি লেনদেনে রিসেট করা হয়েছে!', 'danger');
                }
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
                UIController.showToast('লেনদেন এডিট করা হয়েছে!', 'success');
            });
        }

        const csvBtn = document.getElementById('export-csv-btn');
        if (csvBtn) csvBtn.addEventListener('click', () => this.exportCSV());

        const mobileCsv = document.getElementById('mobile-btn-csv');
        if (mobileCsv) mobileCsv.addEventListener('click', () => this.exportCSV());
    },

    handleAdminBtnClick() {
        if (!state.isAdminUnlocked) {
            this.openModal('admin-pin-modal');
        } else {
            this.openModal('admin-panel-modal');
        }
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
        this.renderActivityLogs();
        this.updateAdminUIElements();
    },

    renderTotals() {
        const { totalIn, totalOut, inCount, outCount, currentBalance, netFlow } = state.getTotals();

        const currentBalEl = document.getElementById('current-balance-display');
        if (currentBalEl) {
            currentBalEl.innerText = currentBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }

        const countEl = document.getElementById('total-txn-count');
        if (countEl) countEl.innerText = state.transactions.length + ' টি';

        const initBalEl = document.getElementById('initial-balance-val');
        if (initBalEl) initBalEl.innerText = '৳ ' + (state.initialBalance || 0).toLocaleString();

        const netFlowEl = document.getElementById('net-flow-val');
        if (netFlowEl) {
            if (netFlow >= 0) {
                netFlowEl.innerText = '+৳ ' + netFlow.toLocaleString();
                netFlowEl.className = 'val net-positive';
            } else {
                netFlowEl.innerText = '-৳ ' + Math.abs(netFlow).toLocaleString();
                netFlowEl.className = 'val net-negative';
            }
        }

        const totalInEl = document.getElementById('total-in-display');
        if (totalInEl) totalInEl.innerText = '৳ ' + totalIn.toLocaleString();

        const inCountEl = document.getElementById('in-count-badge');
        if (inCountEl) inCountEl.innerText = inCount + ' টি জমা';

        const totalOutEl = document.getElementById('total-out-display');
        if (totalOutEl) totalOutEl.innerText = '৳ ' + totalOut.toLocaleString();

        const outCountEl = document.getElementById('out-count-badge');
        if (outCountEl) outCountEl.innerText = outCount + ' টি আউট';

        const setInitInput = document.getElementById('setting-initial-balance');
        if (setInitInput) setInitInput.value = state.initialBalance || 0;

        const lastUpTag = document.getElementById('last-updated-tag');
        if (lastUpTag) lastUpTag.innerText = 'সর্বশেষ আপডেট: ' + new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
    },

    renderTransactions() {
        const searchInput = document.getElementById('search-input');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        const typeFilterEl = document.getElementById('type-filter');
        const typeFilter = typeFilterEl ? typeFilterEl.value : 'ALL';

        let filtered = state.transactions.slice().reverse();

        if (typeFilter !== 'ALL') {
            filtered = filtered.filter(t => t.type === typeFilter);
        }

        if (query) {
            filtered = filtered.filter(t => 
                t.id.toLowerCase().includes(query) ||
                (t.note && t.note.toLowerCase().includes(query)) ||
                (t.category && t.category.toLowerCase().includes(query)) ||
                (t.reference && t.reference.toLowerCase().includes(query)) ||
                t.amount.toString().includes(query)
            );
        }

        const tbody = document.getElementById('transaction-table-body');
        const mobileContainer = document.getElementById('mobile-card-stream');
        const emptyState = document.getElementById('empty-state');

        if (tbody) tbody.innerHTML = '';
        if (mobileContainer) mobileContainer.innerHTML = '';

        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }

        filtered.forEach(t => {
            const dateObj = new Date(t.timestamp);
            const formattedDate = dateObj.toLocaleDateString('bn-BD', { day: '2-digit', month: 'short' }) + ' ' + dateObj.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });

            const isIN = t.type === 'IN';
            const typeBadge = isIN ? '<span class="badge-type in">Money IN</span>' : '<span class="badge-type out">Money OUT</span>';
            const amtClass = isIN ? 'amt-in' : 'amt-out';
            const amtSign = isIN ? '+' : '-';

            if (tbody) {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><code style="font-family:var(--font-code);font-size:0.8rem;color:var(--text-muted);">${t.id}</code></td>
                    <td style="white-space:nowrap;font-size:0.8rem;color:var(--text-muted);">${formattedDate}</td>
                    <td>${typeBadge}</td>
                    <td>
                        <div style="font-weight:600;">${t.note || 'N/A'}</div>
                        <div style="font-size:0.75rem;color:var(--text-dim);">${t.category} • ${t.paymentMethod}</div>
                    </td>
                    <td class="${amtClass}">${amtSign}৳${t.amount.toLocaleString()}</td>
                    <td class="running-bal">৳${t.runningBalance.toLocaleString()}</td>
                    ${state.isAdminUnlocked ? `
                        <td class="admin-only-col">
                            <button class="btn-icon-sm" onclick="UIController.openEditModal('${t.id}')">✏️</button>
                            <button class="btn-icon-sm delete" onclick="UIController.handleDelete('${t.id}')">🗑️</button>
                        </td>
                    ` : ''}
                `;
                tbody.appendChild(tr);
            }

            if (mobileContainer) {
                const card = document.createElement('div');
                card.className = 'mobile-txn-card';
                card.innerHTML = `
                    <div class="mobile-card-left">
                        <div class="mobile-card-title">${t.note || t.category}</div>
                        <div class="mobile-card-date">${formattedDate} • ${t.paymentMethod}</div>
                        <div>${typeBadge}</div>
                    </div>
                    <div class="mobile-card-right">
                        <div class="mobile-card-amount ${amtClass}">${amtSign}৳${t.amount.toLocaleString()}</div>
                        <div class="mobile-card-balance">ব্যালেন্স: ৳${t.runningBalance.toLocaleString()}</div>
                        ${state.isAdminUnlocked ? `
                            <div style="margin-top:4px;">
                                <button class="btn-icon-sm" onclick="UIController.openEditModal('${t.id}')">✏️</button>
                                <button class="btn-icon-sm delete" onclick="UIController.handleDelete('${t.id}')">🗑️</button>
                            </div>
                        ` : ''}
                    </div>
                `;
                mobileContainer.appendChild(card);
            }
        });
    },

    renderActivityLogs() {
        const container = document.getElementById('activity-stream');
        if (!container) return;
        container.innerHTML = '';
        state.activityLogs.forEach(log => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `<span>[${log.time}]</span> <strong>${log.text}</strong>`;
            container.appendChild(item);
        });
    },

    updateAdminUIElements() {
        const adminBtnText = document.getElementById('admin-btn-text');
        if (adminBtnText) {
            adminBtnText.innerText = state.isAdminUnlocked ? 'সার্ভার এডমিন প্যানেল' : 'এডমিন ব্যাকএন্ড';
        }
        document.querySelectorAll('.admin-only-col').forEach(el => {
            el.style.display = state.isAdminUnlocked ? '' : 'none';
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
            UIController.showToast('ট্রানজ্যাকশন ডিলিট করা হয়েছে!', 'danger');
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

    exportCSV() {
        let csvContent = "data:text/csv;charset=utf-8,ID,Date,Type,Category,Payment Method,Note,Reference,Amount,Running Balance\n";
        state.transactions.forEach(t => {
            const dateStr = new Date(t.timestamp).toLocaleString();
            const row = `"${t.id}","${dateStr}","${t.type}","${t.category}","${t.paymentMethod}","${t.note || ''}","${t.reference || ''}",${t.amount},${t.runningBalance}`;
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `hisab_ledger_statement_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        UIController.showToast('CSV স্টেটমেন্ট ডাউনলোড শুরু হয়েছে!', 'success');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    UIController.init();
});
