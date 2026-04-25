const STORAGE_KEY = "simple-finance-tracker-v1";

const categoryMap = {
  income: ["Salary", "Freelance", "Investment", "Refund", "Other income"],
  expense: ["Housing", "Food", "Transport", "Utilities", "Health", "Leisure", "Other expense"],
};

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  year: "numeric",
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const state = {
  transactions: [],
  monthlyBudget: 2800,
  filters: {
    period: "all",
    type: "all",
    category: "all",
    search: "",
    sort: "date-desc",
  },
  editingId: null,
};

const elements = {
  periodFilter: document.querySelector("#periodFilter"),
  demoButton: document.querySelector("#demoButton"),
  resetButton: document.querySelector("#resetButton"),
  balanceValue: document.querySelector("#balanceValue"),
  balanceMeta: document.querySelector("#balanceMeta"),
  incomeValue: document.querySelector("#incomeValue"),
  expenseValue: document.querySelector("#expenseValue"),
  budgetValue: document.querySelector("#budgetValue"),
  budgetMeta: document.querySelector("#budgetMeta"),
  savingsRateValue: document.querySelector("#savingsRateValue"),
  budgetInput: document.querySelector("#budgetInput"),
  budgetProgressLabel: document.querySelector("#budgetProgressLabel"),
  budgetProgressMeta: document.querySelector("#budgetProgressMeta"),
  budgetProgressBar: document.querySelector("#budgetProgressBar"),
  budgetForm: document.querySelector("#budgetForm"),
  transactionForm: document.querySelector("#transactionForm"),
  typeInput: document.querySelector("#typeInput"),
  dateInput: document.querySelector("#dateInput"),
  descriptionInput: document.querySelector("#descriptionInput"),
  amountInput: document.querySelector("#amountInput"),
  categoryInput: document.querySelector("#categoryInput"),
  noteInput: document.querySelector("#noteInput"),
  formTitle: document.querySelector("#formTitle"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
  saveButton: document.querySelector("#saveButton"),
  formMessage: document.querySelector("#formMessage"),
  typeFilter: document.querySelector("#typeFilter"),
  categoryFilter: document.querySelector("#categoryFilter"),
  searchInput: document.querySelector("#searchInput"),
  sortFilter: document.querySelector("#sortFilter"),
  ledgerCount: document.querySelector("#ledgerCount"),
  transactionList: document.querySelector("#transactionList"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  trendList: document.querySelector("#trendList"),
};

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function generateId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `txn-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function shiftDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

function createDemoTransactions() {
  return [
    {
      id: generateId(),
      type: "income",
      date: shiftDate(-18),
      description: "Product paycheck",
      category: "Salary",
      amount: 4200,
      note: "Main salary deposit",
    },
    {
      id: generateId(),
      type: "expense",
      date: shiftDate(-16),
      description: "Apartment rent",
      category: "Housing",
      amount: 1380,
      note: "May lease payment",
    },
    {
      id: generateId(),
      type: "expense",
      date: shiftDate(-12),
      description: "Supermarket run",
      category: "Food",
      amount: 124.9,
      note: "Weeknight groceries",
    },
    {
      id: generateId(),
      type: "expense",
      date: shiftDate(-9),
      description: "Train card reload",
      category: "Transport",
      amount: 45,
      note: "Commute top-up",
    },
    {
      id: generateId(),
      type: "income",
      date: shiftDate(-6),
      description: "Freelance invoice",
      category: "Freelance",
      amount: 640,
      note: "Landing page sprint",
    },
    {
      id: generateId(),
      type: "expense",
      date: shiftDate(-4),
      description: "Electric bill",
      category: "Utilities",
      amount: 82.5,
      note: "",
    },
    {
      id: generateId(),
      type: "expense",
      date: shiftDate(-2),
      description: "Dinner with friends",
      category: "Leisure",
      amount: 68,
      note: "Friday night",
    },
    {
      id: generateId(),
      type: "expense",
      date: shiftDate(-37),
      description: "Pharmacy",
      category: "Health",
      amount: 24.5,
      note: "",
    },
    {
      id: generateId(),
      type: "income",
      date: shiftDate(-45),
      description: "Tax refund",
      category: "Refund",
      amount: 320,
      note: "",
    },
  ];
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    state.transactions = createDemoTransactions();
    state.monthlyBudget = 2800;
    saveState();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.transactions = Array.isArray(parsed.transactions) ? parsed.transactions : createDemoTransactions();
    state.monthlyBudget = Number.isFinite(parsed.monthlyBudget) ? parsed.monthlyBudget : 2800;
  } catch (error) {
    state.transactions = createDemoTransactions();
    state.monthlyBudget = 2800;
    saveState();
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      transactions: state.transactions,
      monthlyBudget: state.monthlyBudget,
    }),
  );
}

function formatCurrency(value) {
  return currencyFormatter.format(value || 0);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMonthKey(value) {
  const [year, month] = value.split("-");
  return monthFormatter.format(new Date(Number(year), Number(month) - 1, 1));
}

function formatShortDate(value) {
  return shortDateFormatter.format(new Date(`${value}T00:00:00`));
}

function getMonthKey(value) {
  return value.slice(0, 7);
}

function getAvailablePeriods() {
  const keys = new Set(state.transactions.map((transaction) => getMonthKey(transaction.date)));
  const sorted = [...keys].sort((left, right) => right.localeCompare(left));
  return ["all", ...sorted];
}

function matchesPeriod(transaction, period) {
  if (period === "all") {
    return true;
  }

  return getMonthKey(transaction.date) === period;
}

function getPeriodTransactions() {
  return state.transactions.filter((transaction) => matchesPeriod(transaction, state.filters.period));
}

function getFilteredTransactions() {
  const searchNeedle = state.filters.search.trim().toLowerCase();
  const filtered = getPeriodTransactions().filter((transaction) => {
    if (state.filters.type !== "all" && transaction.type !== state.filters.type) {
      return false;
    }

    if (state.filters.category !== "all" && transaction.category !== state.filters.category) {
      return false;
    }

    if (!searchNeedle) {
      return true;
    }

    const haystack = `${transaction.description} ${transaction.note}`.toLowerCase();
    return haystack.includes(searchNeedle);
  });

  const sorters = {
    "date-desc": (left, right) => right.date.localeCompare(left.date) || right.amount - left.amount,
    "date-asc": (left, right) => left.date.localeCompare(right.date) || left.amount - right.amount,
    "amount-desc": (left, right) => right.amount - left.amount || right.date.localeCompare(left.date),
    "amount-asc": (left, right) => left.amount - right.amount || right.date.localeCompare(left.date),
  };

  return filtered.sort(sorters[state.filters.sort]);
}

function setFormMessage(message) {
  elements.formMessage.textContent = message;
}

function resetForm(message = "") {
  state.editingId = null;
  elements.transactionForm.reset();
  elements.typeInput.value = "expense";
  elements.dateInput.value = isoDate(new Date());
  syncCategoryInput();
  elements.formTitle.textContent = "Add transaction";
  elements.saveButton.textContent = "Save transaction";
  elements.cancelEditButton.classList.add("hidden");
  setFormMessage(message);
}

function syncCategoryInput() {
  const categories = categoryMap[elements.typeInput.value] || [];
  elements.categoryInput.innerHTML = categories
    .map((category) => `<option value="${category}">${category}</option>`)
    .join("");
}

function syncCategoryFilter() {
  const categories = [...new Set(state.transactions.map((transaction) => transaction.category))].sort();
  const currentValue = state.filters.category;
  elements.categoryFilter.innerHTML = [
    `<option value="all">All categories</option>`,
    ...categories.map((category) => `<option value="${category}">${category}</option>`),
  ].join("");

  if (categories.includes(currentValue)) {
    elements.categoryFilter.value = currentValue;
  } else {
    state.filters.category = "all";
    elements.categoryFilter.value = "all";
  }
}

function syncPeriodFilter() {
  const periods = getAvailablePeriods();
  const currentValue = periods.includes(state.filters.period) ? state.filters.period : "all";
  state.filters.period = currentValue;
  elements.periodFilter.innerHTML = periods
    .map((period) =>
      period === "all"
        ? `<option value="all">All time</option>`
        : `<option value="${period}">${formatMonthKey(period)}</option>`,
    )
    .join("");
  elements.periodFilter.value = currentValue;
}

function getSummary(periodTransactions) {
  return periodTransactions.reduce(
    (summary, transaction) => {
      if (transaction.type === "income") {
        summary.income += transaction.amount;
      } else {
        summary.expense += transaction.amount;
      }

      return summary;
    },
    { income: 0, expense: 0 },
  );
}

function renderSummary() {
  const periodTransactions = getPeriodTransactions();
  const summary = getSummary(periodTransactions);
  const net = summary.income - summary.expense;
  const savingsRate = summary.income > 0 ? (net / summary.income) * 100 : 0;
  const budgetTargetPeriod =
    state.filters.period === "all" ? getMonthKey(isoDate(new Date())) : state.filters.period;
  const budgetLabel = formatMonthKey(budgetTargetPeriod);
  const budgetExpense = state.transactions
    .filter(
      (transaction) =>
        transaction.type === "expense" && getMonthKey(transaction.date) === budgetTargetPeriod,
    )
    .reduce((total, transaction) => total + transaction.amount, 0);
  const budgetRemaining = state.monthlyBudget - budgetExpense;
  const budgetUsage = state.monthlyBudget > 0 ? (budgetExpense / state.monthlyBudget) * 100 : 0;

  elements.balanceValue.textContent = formatCurrency(net);
  elements.balanceMeta.textContent =
    state.filters.period === "all"
      ? "Across every saved entry"
      : `For ${formatMonthKey(state.filters.period)}`;
  elements.incomeValue.textContent = formatCurrency(summary.income);
  elements.expenseValue.textContent = formatCurrency(summary.expense);
  elements.budgetValue.textContent = formatCurrency(budgetRemaining);
  elements.budgetMeta.textContent =
    state.filters.period === "all" ? `Against ${budgetLabel} plan` : `Against ${budgetLabel} plan`;
  elements.savingsRateValue.textContent = `${Math.round(savingsRate)}%`;
  elements.budgetInput.value = state.monthlyBudget.toFixed(2);
  elements.budgetProgressLabel.textContent = `${formatCurrency(budgetExpense)} used`.replace('$', '₱');
  elements.budgetProgressMeta.textContent = `${Math.round(budgetUsage)}% of ${budgetLabel} plan`;
  elements.budgetProgressBar.style.width = `${Math.min(budgetUsage, 100)}%`;
  elements.budgetProgressBar.style.background =
    budgetUsage > 100
      ? "linear-gradient(90deg, #d48b72, #b05336)"
      : "linear-gradient(90deg, #af812f, #d0a13f)";
}

function renderTransactions() {
  const filteredTransactions = getFilteredTransactions();
  elements.ledgerCount.textContent = `${filteredTransactions.length} ${
    filteredTransactions.length === 1 ? "entry" : "entries"
  }`;

  if (!filteredTransactions.length) {
    elements.transactionList.innerHTML =
      '<p class="empty-state">No transactions match the current filters.</p>';
    return;
  }

  elements.transactionList.innerHTML = filteredTransactions
    .map(
      (transaction) => `
        <article class="transaction-row" data-id="${transaction.id}">
          <div class="transaction-main">
            <div class="transaction-description">${escapeHtml(transaction.description)}</div>
            <div class="transaction-meta">${escapeHtml(transaction.category)} · ${formatShortDate(transaction.date)}</div>
            ${transaction.note ? `<div class="transaction-note">${escapeHtml(transaction.note)}</div>` : ""}
          </div>
          <div class="transaction-amount amount-${transaction.type}">
            ${transaction.type === "income" ? "+" : "-"}${formatCurrency(transaction.amount)}
          </div>
          <div class="inline-actions">
            <button class="inline-button" type="button" data-action="edit">Edit</button>
            <button class="inline-button" type="button" data-action="delete">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderBreakdown() {
  const expenses = getPeriodTransactions().filter((transaction) => transaction.type === "expense");
  const totals = expenses.reduce((map, transaction) => {
    map.set(transaction.category, (map.get(transaction.category) || 0) + transaction.amount);
    return map;
  }, new Map());
  const ordered = [...totals.entries()].sort((left, right) => right[1] - left[1]);
  const largest = ordered[0]?.[1] || 1;

  if (!ordered.length) {
    elements.categoryBreakdown.innerHTML =
      '<p class="empty-state">Expense categories appear here when spending is recorded.</p>';
    return;
  }

  elements.categoryBreakdown.innerHTML = ordered
    .map(
      ([category, amount]) => `
        <div class="breakdown-row">
          <div class="breakdown-copy">
            <strong>${escapeHtml(category)}</strong>
            <span>${formatCurrency(amount)}</span>
          </div>
          <div class="mini-track" aria-hidden="true">
            <div class="mini-fill expense-fill" style="width: ${(amount / largest) * 100}%"></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderTrend() {
  const monthKeys = getAvailablePeriods()
    .filter((period) => period !== "all")
    .slice(0, 6)
    .reverse();
  const rows = monthKeys.map((monthKey) => {
    const monthTransactions = state.transactions.filter(
      (transaction) => getMonthKey(transaction.date) === monthKey,
    );
    const summary = getSummary(monthTransactions);
    return { monthKey, ...summary };
  });

  const maxValue = Math.max(
    1,
    ...rows.flatMap((row) => [row.income, row.expense]),
  );

  if (!rows.length) {
    elements.trendList.innerHTML =
      '<p class="empty-state">Monthly flow will appear after the first saved transactions.</p>';
    return;
  }

  elements.trendList.innerHTML = rows
    .map(
      (row) => `
        <div class="trend-row">
          <div class="trend-copy">
            <strong>${formatMonthKey(row.monthKey)}</strong>
            <span>${formatCurrency(row.income - row.expense)} net</span>
          </div>
          <div class="trend-bars" aria-hidden="true">
            <div class="mini-track"><div class="mini-fill income-fill" style="width: ${(row.income / maxValue) * 100}%"></div></div>
            <div class="mini-track"><div class="mini-fill expense-fill" style="width: ${(row.expense / maxValue) * 100}%"></div></div>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderAll() {
  syncPeriodFilter();
  syncCategoryFilter();
  renderSummary();
  renderTransactions();
  renderBreakdown();
  renderTrend();
}

function handleTransactionSubmit(event) {
  event.preventDefault();

  const payload = {
    type: elements.typeInput.value,
    date: elements.dateInput.value,
    description: elements.descriptionInput.value.trim(),
    category: elements.categoryInput.value,
    amount: Number(elements.amountInput.value),
    note: elements.noteInput.value.trim(),
  };

  if (!payload.description || !payload.date || !payload.category || !(payload.amount > 0)) {
    setFormMessage("Complete the required fields with a valid amount.");
    return;
  }

  if (state.editingId) {
    state.transactions = state.transactions.map((transaction) =>
      transaction.id === state.editingId ? { ...transaction, ...payload } : transaction,
    );
    saveState();
    renderAll();
    resetForm("Transaction updated.");
  } else {
    state.transactions.unshift({
      id: generateId(),
      ...payload,
    });
    saveState();
    renderAll();
    resetForm("Transaction saved.");
  }
}

function handleBudgetSubmit(event) {
  event.preventDefault();
  const value = Number(elements.budgetInput.value);
  state.monthlyBudget = value >= 0 ? value : 0;
  saveState();
  renderSummary();
}

function beginEdit(transactionId) {
  const transaction = state.transactions.find((item) => item.id === transactionId);

  if (!transaction) {
    return;
  }

  state.editingId = transaction.id;
  elements.formTitle.textContent = "Edit transaction";
  elements.saveButton.textContent = "Update transaction";
  elements.cancelEditButton.classList.remove("hidden");
  elements.typeInput.value = transaction.type;
  syncCategoryInput();
  elements.categoryInput.value = transaction.category;
  elements.dateInput.value = transaction.date;
  elements.descriptionInput.value = transaction.description;
  elements.amountInput.value = transaction.amount.toFixed(2);
  elements.noteInput.value = transaction.note || "";
  setFormMessage("Editing selected entry.");
}

function deleteTransaction(transactionId) {
  state.transactions = state.transactions.filter((transaction) => transaction.id !== transactionId);
  saveState();
  renderAll();

  if (state.editingId === transactionId) {
    resetForm();
  }
}

function attachEvents() {
  elements.typeInput.addEventListener("change", () => {
    syncCategoryInput();
  });

  elements.transactionForm.addEventListener("submit", handleTransactionSubmit);
  elements.budgetForm.addEventListener("submit", handleBudgetSubmit);

  elements.periodFilter.addEventListener("change", (event) => {
    state.filters.period = event.target.value;
    renderAll();
  });

  elements.typeFilter.addEventListener("change", (event) => {
    state.filters.type = event.target.value;
    renderTransactions();
  });

  elements.categoryFilter.addEventListener("change", (event) => {
    state.filters.category = event.target.value;
    renderTransactions();
  });

  elements.sortFilter.addEventListener("change", (event) => {
    state.filters.sort = event.target.value;
    renderTransactions();
  });

  elements.searchInput.addEventListener("input", (event) => {
    state.filters.search = event.target.value;
    renderTransactions();
  });

  elements.cancelEditButton.addEventListener("click", () => {
    resetForm();
  });

  elements.transactionList.addEventListener("click", (event) => {
    const action = event.target.dataset.action;

    if (!action) {
      return;
    }

    const transactionId = event.target.closest("[data-id]")?.dataset.id;

    if (!transactionId) {
      return;
    }

    if (action === "edit") {
      beginEdit(transactionId);
    }

    if (action === "delete") {
      deleteTransaction(transactionId);
    }
  });

  elements.demoButton.addEventListener("click", () => {
    state.transactions = createDemoTransactions();
    state.monthlyBudget = 2800;
    saveState();
    renderAll();
    resetForm("Demo data loaded.");
  });

  elements.resetButton.addEventListener("click", () => {
    state.transactions = [];
    saveState();
    renderAll();
    resetForm("All saved transactions cleared.");
  });
}

function init() {
  loadState();
  elements.typeFilter.value = state.filters.type;
  elements.sortFilter.value = state.filters.sort;
  elements.searchInput.value = state.filters.search;
  elements.dateInput.value = isoDate(new Date());
  syncCategoryInput();
  attachEvents();
  renderAll();
}

init();
