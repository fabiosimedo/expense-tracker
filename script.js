const balance = document.getElementById('balance');
const money_plus = document.getElementById('money-plus');
const money_minus = document.getElementById('money-minus');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const transactionTypeInputs = document.querySelectorAll('input[name="transaction-type"]');
const transactionTypeOptions = document.querySelectorAll('.type-option');
let expenseChart = null;

const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));

let transactions =
  localStorage.getItem('transactions') !== null ? localStorageTransactions : [];

function getSelectedTransactionType() {
  const checkedInput = document.querySelector('input[name="transaction-type"]:checked');
  return checkedInput ? checkedInput.value : 'expense';
}

function updateChart() {
  const ctx = document.getElementById('expense-chart');

  if (!ctx) return;

  const amounts = transactions.map(t => t.amount);

  const income = amounts
    .filter(v => v > 0)
    .reduce((acc, v) => acc + v, 0);

  const expense = amounts
    .filter(v => v < 0)
    .reduce((acc, v) => acc + v, 0) * -1;

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Entradas', 'Saídas'],
      datasets: [{
        data: [income, expense],
        backgroundColor: [
          '#2ecc71',
          '#c0392b'
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function syncTransactionTypeUI() {
  const selectedType = getSelectedTransactionType();

  transactionTypeOptions.forEach(option => {
    const input = option.querySelector('input');
    option.classList.toggle('active', input.checked);
  });

  amount.placeholder = selectedType === 'expense' ? 'Adicione despesa...' : 'Adicione entrada...';
}

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (text.value.trim() === '' || amount.value.trim() === '') {
    alert('Favor adicionar descrição e valor da transação...');
    return;
  }

  const numericAmount = Math.abs(Number(amount.value));

  if (Number.isNaN(numericAmount) || numericAmount === 0) {
    alert('Favor adicione um valor maior que zero');
    return;
  }

  const selectedType = getSelectedTransactionType();
  const finalAmount = selectedType === 'expense' ? -numericAmount : numericAmount;

  const transaction = {
    id: generateID(),
    text: text.value.trim(),

    amount: finalAmount,
    date: new Date().toISOString()
  };

  transactions.push(transaction);

  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();

  text.value = '';
  amount.value = '';
  document.getElementById('type-expense').checked = true;
  syncTransactionTypeUI();
  text.focus();
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

function formatCurrency(value) {
  return `$${Math.abs(value).toFixed(2)}`;
}

function formatTransactionDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';

  const item = document.createElement('li');
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');

  item.innerHTML = `
    <div class="transaction-info">
      <span class="transaction-text">${transaction.text}</span><br>
      <span class="transaction-date">${formatTransactionDate(transaction.date)}</span>
    </div>
    <span class="transaction-amount">${sign}${Math.abs(transaction.amount).toFixed(2)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})" aria-label="Remove ${transaction.text}">×</button>
  `;

  list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const amounts = transactions.map(transaction => Number(transaction.amount) || 0);

  const total = amounts.reduce((acc, item) => acc + item, 0);
  const income = amounts
    .filter(item => item > 0)
    .reduce((acc, item) => acc + item, 0);
  const expense = amounts
    .filter(item => item < 0)
    .reduce((acc, item) => acc + item, 0) * -1;

  balance.innerText = `${total < 0 ? '-' : ''}${formatCurrency(total)}`;
  balance.classList.remove('positive', 'negative');
  balance.classList.add(total < 0 ? 'negative' : 'positive');

  const balanceCard = document.querySelector('.balance-card');
  if (balanceCard) {
    balanceCard.classList.remove('balance-positive', 'balance-negative');
    balanceCard.classList.add(total < 0 ? 'balance-negative' : 'balance-positive');
  }

  money_plus.innerText = `+${formatCurrency(income)}`;
  money_minus.innerText = `-${formatCurrency(expense)}`;
  updateChart();
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);

  updateLocalStorage();
  init();
}

// Update local storage transactions
function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Init app
function init() {
  list.innerHTML = '';

  transactions.forEach(addTransactionDOM);
  updateValues();
  syncTransactionTypeUI();
}

init();

transactionTypeInputs.forEach(input => {
  input.addEventListener('change', syncTransactionTypeUI);
});

form.addEventListener('submit', addTransaction);
