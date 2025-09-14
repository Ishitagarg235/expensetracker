// Global variables
let expenses = [];
let currentIncome = 0;

// API Base URL
const API_BASE = '';

// DOM Elements
const expenseForm = document.getElementById('expense-form');
const incomeForm = document.getElementById('income-form');
const expensesList = document.getElementById('expenses-list');
const filterBtn = document.getElementById('filter-btn');
const clearFilterBtn = document.getElementById('clear-filter-btn');
const generateReportBtn = document.getElementById('generate-report-btn');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Set today's date as default for expense form
    document.getElementById('expense-date').valueAsDate = new Date();
    
    // Load initial data
    loadIncome();
    loadExpenses();
    updateDashboard();
    
    // Event listeners
    expenseForm.addEventListener('submit', handleAddExpense);
    incomeForm.addEventListener('submit', handleUpdateIncome);
    filterBtn.addEventListener('click', handleFilter);
    clearFilterBtn.addEventListener('click', handleClearFilter);
    generateReportBtn.addEventListener('click', generateReport);
});

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showMessage(message, type = 'success') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type} fade-in`;
    messageDiv.textContent = message;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// API Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        
        if (data) {
            config.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        showMessage(`API call failed: ${error.message}`, 'error');
        throw error;
    }
}

// Income functions
async function loadIncome() {
    try {
        const income = await apiCall('/income');
        currentIncome = income.amount;
        document.getElementById('income-input').value = income.amount;
        updateDashboard();
    } catch (error) {
        console.error('Failed to load income:', error);
    }
}

async function handleUpdateIncome(e) {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('income-input').value);
    
    if (amount < 0) {
        showMessage('Income amount cannot be negative', 'error');
        return;
    }
    
    try {
        await apiCall('/income', 'PUT', { amount });
        currentIncome = amount;
        updateDashboard();
        showMessage('Income updated successfully!');
    } catch (error) {
        showMessage('Failed to update income', 'error');
    }
}

// Expense functions
async function loadExpenses(startDate = null, endDate = null) {
    try {
        let endpoint = '/expenses';
        const params = new URLSearchParams();
        
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);
        
        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }
        
        expenses = await apiCall(endpoint);
        renderExpenses();
        updateDashboard();
    } catch (error) {
        console.error('Failed to load expenses:', error);
    }
}

async function handleAddExpense(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const expense = {
        amount: parseFloat(document.getElementById('expense-amount').value),
        category: document.getElementById('expense-category').value,
        date: document.getElementById('expense-date').value,
        description: document.getElementById('expense-description').value
    };
    
    if (expense.amount <= 0) {
        showMessage('Expense amount must be greater than 0', 'error');
        return;
    }
    
    try {
        await apiCall('/expenses', 'POST', expense);
        showMessage('Expense added successfully!');
        expenseForm.reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        loadExpenses();
    } catch (error) {
        showMessage('Failed to add expense', 'error');
    }
}

async function deleteExpense(expenseId) {
    if (!confirm('Are you sure you want to delete this expense?')) {
        return;
    }
    
    try {
        await apiCall(`/expenses/${expenseId}`, 'DELETE');
        showMessage('Expense deleted successfully!');
        loadExpenses();
    } catch (error) {
        showMessage('Failed to delete expense', 'error');
    }
}

async function editExpense(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Simple inline editing - populate form with existing values
    document.getElementById('expense-amount').value = expense.amount;
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-date').value = expense.date;
    document.getElementById('expense-description').value = expense.description;
    
    // Delete the old expense and let user re-add with changes
    await deleteExpense(expenseId);
    
    // Scroll to form
    document.getElementById('expense-form').scrollIntoView({ behavior: 'smooth' });
    showMessage('Expense loaded for editing. Make your changes and click "Add Expense".', 'success');
}

// Rendering functions
function renderExpenses() {
    if (expenses.length === 0) {
        expensesList.innerHTML = `
            <div class="empty-state">
                <h3>No expenses found</h3>
                <p>Add your first expense using the form above</p>
            </div>
        `;
        return;
    }
    
    expensesList.innerHTML = expenses.map(expense => `
        <div class="expense-item fade-in">
            <div class="expense-details">
                <h4>${expense.description}</h4>
                <p>Category: ${expense.category}</p>
            </div>
            <div class="expense-amount">${formatCurrency(expense.amount)}</div>
            <div class="expense-category">${expense.category}</div>
            <div class="expense-date">${formatDate(expense.date)}</div>
            <div class="expense-actions">
                <button class="btn btn-edit" onclick="editExpense('${expense.id}')">Edit</button>
                <button class="btn btn-danger" onclick="deleteExpense('${expense.id}')">Delete</button>
            </div>
        </div>
    `).join('');
}

function updateDashboard() {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const savings = currentIncome - totalExpenses;
    
    document.getElementById('income-amount').textContent = formatCurrency(currentIncome);
    document.getElementById('expenses-amount').textContent = formatCurrency(totalExpenses);
    document.getElementById('savings-amount').textContent = formatCurrency(savings);
    
    // Update savings color based on positive/negative
    const savingsElement = document.getElementById('savings-amount');
    if (savings < 0) {
        savingsElement.style.color = '#dc3545';
    } else {
        savingsElement.style.color = '#007bff';
    }
}

// Filter functions
function handleFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (startDate && endDate && startDate > endDate) {
        showMessage('Start date cannot be after end date', 'error');
        return;
    }
    
    loadExpenses(startDate || null, endDate || null);
}

function handleClearFilter() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    loadExpenses();
}

// Report functions
async function generateReport() {
    try {
        const report = await apiCall('/report/monthly');
        renderReport(report);
        renderInvestmentSuggestions(report.investment_suggestions);
    } catch (error) {
        showMessage('Failed to generate report', 'error');
    }
}

function renderReport(report) {
    const reportContent = document.getElementById('report-content');
    
    reportContent.innerHTML = `
        <div class="report-summary fade-in">
            <div class="report-item">
                <h4>Month</h4>
                <div class="report-value">${report.month}</div>
            </div>
            <div class="report-item">
                <h4>Total Income</h4>
                <div class="report-value income">${formatCurrency(report.total_income)}</div>
            </div>
            <div class="report-item">
                <h4>Total Expenses</h4>
                <div class="report-value expenses">${formatCurrency(report.total_expenses)}</div>
            </div>
            <div class="report-item">
                <h4>Savings</h4>
                <div class="report-value savings">${formatCurrency(report.savings)}</div>
            </div>
        </div>
        
        ${Object.keys(report.expense_categories).length > 0 ? `
            <div class="categories-breakdown">
                <h4>Expense Breakdown by Category</h4>
                ${Object.entries(report.expense_categories).map(([category, amount]) => `
                    <div class="category-item">
                        <span class="category-name">${category}</span>
                        <span class="category-amount">${formatCurrency(amount)}</span>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;
}

function renderInvestmentSuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('investment-suggestions');
    
    if (!suggestions || suggestions.length === 0) {
        suggestionsContainer.innerHTML = `
            <div class="empty-state">
                <h3>No investment suggestions available</h3>
                <p>Generate a monthly report to see personalized investment advice</p>
            </div>
        `;
        return;
    }
    
    suggestionsContainer.innerHTML = suggestions.map(suggestion => `
        <div class="suggestion-item fade-in">
            ${suggestion}
        </div>
    `).join('');
}

// Auto-refresh dashboard periodically
setInterval(updateDashboard, 30000); // Every 30 seconds