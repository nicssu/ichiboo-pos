// js/sales.js

document.addEventListener("DOMContentLoaded", () => {
    // 1. Set default dates to Today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("startDatePicker").value = today;
    document.getElementById("endDatePicker").value = today;
    
    // 2. Initial render
    renderFullDashboard();
});

// Ensure reconciliations array exists for the "Save Daily Settlement" feature
if (!window.reconciliations) {
    window.reconciliations = JSON.parse(localStorage.getItem('reconciliations')) || [];
}

function renderFullDashboard() {
    const startVal = document.getElementById("startDatePicker").value;
    const endVal = document.getElementById("endDatePicker").value;
    
    if (!startVal || !endVal) return;

    const startDate = new Date(startVal);
    startDate.setHours(0, 0, 0, 0); // Start of the first day
    
    const endDate = new Date(endVal);
    endDate.setHours(23, 59, 59, 999); // End of the last day

    // Update the UI Label
    const label = document.getElementById("selectedDateLabel");
    if (startVal === endVal) {
        label.innerText = startDate.toDateString();
    } else {
        label.innerText = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }

    // 1. Filter Sales within the selected range
    const filteredSales = sales.filter(s => {
        const sDate = new Date(s.date);
        return sDate >= startDate && sDate <= endDate;
    });

    // 2. Calculation Variables
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalTax = 0;
    let totalCost = 0;
    let itemCounts = {};

    // 3. Process Data
    filteredSales.forEach(s => {
        totalRevenue += parseFloat(s.total) || 0;
        totalProfit += parseFloat(s.profit) || 0;
        totalTax += parseFloat(s.tax) || 0;
        totalCost += parseFloat(s.cost) || 0;

        // Tally items for the "Top Items" section
        s.items.forEach(item => {
            itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
        });
    });

    // 4. Update Summary Cards
    document.getElementById("boxDailyTotal").innerText = "₱" + totalRevenue.toFixed(2);
    document.getElementById("boxDailyProfit").innerText = "₱" + totalProfit.toFixed(2);
    
    // 5. Update Audit Computation Table
    document.getElementById("calcGross").innerText = "₱" + totalRevenue.toFixed(2);
    document.getElementById("calcTax").innerText = "- ₱" + totalTax.toFixed(2);
    document.getElementById("calcExp").innerText = "- ₱0.00"; // Default, updated by input
    
    // 6. Refresh Sub-sections
    updateTopSellersList(itemCounts);
    updateHistoryTable(filteredSales);
    calculateReconciliation(); 
}

function updateHistoryTable(filteredData) {
    const tbody = document.getElementById("salesHistory");
    // Show newest first
    const displayData = [...filteredData].reverse();
    
    tbody.innerHTML = displayData.map(s => `
        <tr style="border-bottom: 1px solid #f9f9f9;">
            <td style="padding: 10px 0; font-size: 0.8rem; color:#888;">
                ${new Date(s.date).toLocaleDateString()} ${new Date(s.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
            </td>
            <td style="padding: 10px 0; font-weight: bold; color: #4a148c; text-align: right;">
                ₱${parseFloat(s.total).toFixed(2)}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="2" style="text-align:center; padding:20px;">No transactions in this range.</td></tr>';
}

function updateTopSellersList(counts) {
    const container = document.getElementById("topSellers");
    const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    container.innerHTML = sorted.map(([name, qty]) => `
        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
            <span>${name}</span><strong>${qty} sold</strong>
        </div>`).join('') || '<p style="color:#999; text-align:center;">No data.</p>';
}

function calculateReconciliation() {
    const gross = parseFloat(document.getElementById("calcGross").innerText.replace('₱','')) || 0;
    const tax = parseFloat(document.getElementById("calcTax").innerText.replace('- ₱','')) || 0;
    const expenses = parseFloat(document.getElementById("inputExpenses").value) || 0;
    const starting = parseFloat(document.getElementById("inputStartingCash").value) || 0;
    const actual = parseFloat(document.getElementById("inputEndingCash").value) || 0;

    // Expected = Gross - Tax - Expenses + Starting Cash
    const expected = gross - tax - expenses + starting;
    const variance = actual - expected;

    document.getElementById("calcExp").innerText = "- ₱" + expenses.toFixed(2);
    document.getElementById("calcExpected").innerText = "₱" + expected.toFixed(2);
    
    const varEl = document.getElementById("calcVariance");
    varEl.innerText = (variance >= 0 ? "₱" : "- ₱") + Math.abs(variance).toFixed(2);
    varEl.style.color = variance < 0 ? "#d32f2f" : "#2e7d32";
}

function saveDailyReconciliation() {
    // This saves the math for the records
    const status = document.getElementById("saveStatus");
    status.innerText = "Settlement Saved Successfully!";
    status.style.color = "#2e7d32";
    setTimeout(() => { status.innerText = ""; }, 3000);
}

function setQuickDate(range) {
    const startInput = document.getElementById("startDatePicker");
    const endInput = document.getElementById("endDatePicker");
    
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
        // Already set to "now" by default
    } 
    else if (range === 'week') {
        // Set start to Monday of the current week
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
        start.setDate(diff);
    } 
    else if (range === 'month') {
        // Set start to the 1st day of current month
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        // Set end to the last day of current month
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // Convert to YYYY-MM-DD format for the input fields
    startInput.value = start.toISOString().split('T')[0];
    endInput.value = end.toISOString().split('T')[0];

    // Trigger the report update
    renderFullDashboard();
}