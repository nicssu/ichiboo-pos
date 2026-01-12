// pos.js

let currentCart = [];
let activeCategory = 'All';
let currentEmployee = null; 

function findProductById(id) {
    return products.find(p => p.id == id); 
}

function formatMoney(n) { return Number(n || 0).toFixed(2); }

// --- EMPLOYEE LOGIN/STATUS ---

function renderEmployeeStatus() {
    const statusDiv = document.getElementById("employeeStatus");
    if (!statusDiv) return;

    if (currentEmployee) {
        statusDiv.className = 'employee-login';
        statusDiv.innerHTML = `
            <span class="status" style="color: var(--primary-color);">Logged In: ${currentEmployee.name}</span>
            <button class="btn" onclick="employeeLogout()">Logout</button>
        `;
        
    } else {
        // FIX: Added the input field and correct layout for login
        statusDiv.className = 'employee-login';
        statusDiv.innerHTML = `
            <span class="status" style="color: red;">Not Logged In</span>
            <input type="number" id="employeePinInput" placeholder="Enter PIN" maxlength="4" style="max-width: 100px; text-align: center;"/>
            <button class="btn primary" onclick="employeeLogin()">Login</button>
        `;
    }
    updatePaymentAndChange(); 
}

function employeeLogin() {
    const pinInput = document.getElementById("employeePinInput");
    const pin = pinInput.value.trim();
    const employee = employees.find(e => e.pin === pin);

    if (employee) {
        currentEmployee = employee;
        sessionStorage.setItem("currentEmployeeId", employee.id);
        renderEmployeeStatus();
        alert(`Welcome, ${employee.name}!`);
    } else {
        alert("Invalid PIN.");
        pinInput.value = '';
    }
}

function employeeLogout() {
    currentEmployee = null;
    sessionStorage.removeItem("currentEmployeeId");
    renderEmployeeStatus();
    alert("Logged out.");
}

// --- CORE POS FUNCTIONS ---

function buildCategoryTabs() {
    const tabsContainer = document.getElementById("categoryTabs");
    tabsContainer.innerHTML = '';
    
    if (products.length === 0) return; 

    const categories = ['All', ...new Set(products.map(p => p.category || 'Other'))];

    categories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `btn ${category === activeCategory ? 'active-tab' : ''}`;
        btn.textContent = category;
        
        btn.onclick = () => {
            activeCategory = category;
            buildCategoryTabs(); 
            renderPOS(category);
        };
        tabsContainer.appendChild(btn);
    });
}


function renderPOS(categoryFilter = activeCategory) {
    if (typeof products === 'undefined' || products.length === 0) {
        document.getElementById("productGrid").innerHTML = '<p class="muted">No products found. Please go to Inventory to add items.</p>';
        return;
    }

    const container = document.getElementById("productGrid");
    container.innerHTML = "";
    
    const filteredProducts = products.filter(p => {
        const productCategory = p.category || 'Other';
        return categoryFilter === 'All' || productCategory === categoryFilter;
    });

    const threshold = config.lowStockThreshold;

    filteredProducts.forEach((p) => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "card";
        const isOutOfStock = p.qty <= 0;
        const isLowStock = p.qty <= threshold && p.qty > 0;
        
        itemDiv.style.cursor = isOutOfStock ? 'not-allowed' : 'pointer';
        itemDiv.style.backgroundColor = isOutOfStock ? '#fdd' : (isLowStock ? '#fffbe5' : '#fff');
        itemDiv.style.opacity = isOutOfStock ? '0.7' : '1';

        itemDiv.innerHTML = `
            <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${p.name}</div>
            <div style="color: var(--primary-color);">₱${formatMoney(p.price)}</div>
            <div style="font-size: 0.9em; margin-top: 5px; color: ${isOutOfStock ? 'red' : isLowStock ? 'orange' : 'green'};">Stock: ${p.qty}</div>
        `;
        
        if (!isOutOfStock) {
            itemDiv.onclick = () => addProductToCart(p.id, 1);
        } else {
            itemDiv.onclick = () => alert('Out of stock!');
        }

        container.appendChild(itemDiv);
    });

    renderCartSummary();
}

function renderCartSummary() {
    const container = document.getElementById("posListSummary");
    container.innerHTML = '';
    let subtotalTaxBase = 0; // Total of all base prices (price excluding tax)
    let subtotal = 0; // Total of all prices (price including tax)

    if (currentCart.length === 0) {
        document.getElementById("subtotalAmount").innerText = formatMoney(0);
        document.getElementById("taxAmount").innerText = formatMoney(0);
        document.getElementById("totalAmount").innerText = formatMoney(0);
        container.innerHTML = '<p class="muted">Click a product to start an order.</p>';
        updatePaymentAndChange();
        return;
    }
    
    // Calculate totals for tax-inclusive pricing
    const taxRate = config.taxRate;
    const taxFactor = 1 + (taxRate / 100);

    currentCart.forEach((line) => {
        // Line.price is the final price (tax-inclusive)
        const totalTaxInclusive = line.qty * line.price;
        subtotal += totalTaxInclusive; 
        
        // Base Price (price EXCLUDING tax)
        const basePrice = totalTaxInclusive / taxFactor;
        subtotalTaxBase += basePrice;
    });
    
    // Tax is the difference between total price and total base price
    const taxAmount = subtotal - subtotalTaxBase;
    const grandTotal = subtotal; // Grand total is the sum of tax-inclusive prices

    let listHTML = `<table style="width:100%; border-collapse: collapse; margin-bottom: 15px;">
                      <thead>
                        <tr>
                            <th style="text-align: left;">Item</th>
                            <th style="width: 70px;">Qty</th>
                            <th style="width: 80px; text-align: right;">Total</th>
                            <th style="width: 40px;"></th>
                        </tr>
                      </thead>
                      <tbody>`;
    
    currentCart.forEach((line, index) => {
        // Display tax-inclusive total for the line item
        const lineTotal = line.qty * line.price; 
        
        listHTML += `<tr>
                        <td>${line.name}</td>
                        <td>
                            <input type="number" value="${line.qty}" min="1" style="width:50px; padding: 4px;" 
                                onchange="updateCartQty(${index}, this.value)">
                        </td>
                        <td style="text-align: right;">₱${formatMoney(lineTotal)}</td>
                        <td>
                            <button class="btn" style="padding: 4px 8px;" onclick="removeCartItem(${index})">X</button>
                        </td>
                     </tr>`;
    });

    listHTML += `</tbody></table>`;
    container.innerHTML = listHTML;
    
    // Display totals
    document.getElementById("taxRateDisplay").innerText = taxRate.toFixed(2);
    // Subtotal is now the BASE price (pre-tax total)
    document.getElementById("subtotalAmount").innerText = formatMoney(subtotalTaxBase); 
    document.getElementById("taxAmount").innerText = formatMoney(taxAmount);
    document.getElementById("totalAmount").innerText = formatMoney(grandTotal);

    updatePaymentAndChange();
}

function addProductToCart(productId, qty) {
    const p = findProductById(productId);
    if (!p) return alert('Product not found');
    if (p.qty < qty) return alert('Insufficient stock');

    p.qty -= qty;
    saveAll();

    const existing = currentCart.find(c => c.id == p.id);
    if (existing) {
        existing.qty += qty;
    } else {
        // Record costPrice for profit calculation
        currentCart.push({ 
            id: p.id, 
            name: p.name, 
            qty: qty, 
            price: p.price, // This price is tax-inclusive
            costPrice: p.costPrice || 0, 
        });
    }

    renderCartSummary();
    renderPOS();
}

function updateCartQty(index, newQty) {
    newQty = Number(newQty);
    if (newQty <= 0) {
        removeCartItem(index);
        return;
    }
    const line = currentCart[index];
    const prod = findProductById(line.id);
    const diff = newQty - line.qty;

    if (diff > 0) {
        if (prod.qty < diff) {
            alert('Not enough stock to increase');
            // Re-render to fix the input value
            renderCartSummary(); 
            return;
        }
        prod.qty -= diff;
    } else if (diff < 0) {
        prod.qty += Math.abs(diff);
    }
    line.qty = newQty;
    saveAll();
    renderCartSummary();
    renderPOS();
}

function removeCartItem(index) {
    const line = currentCart[index];
    const prod = findProductById(line.id);
    if (prod) prod.qty += line.qty;
    currentCart.splice(index, 1);
    saveAll();
    renderCartSummary();
    renderPOS();
}

function clearOrder() {
    if (currentCart.length === 0) return;
    if (!confirm("Are you sure you want to cancel the entire order?")) return;
    
    currentCart.forEach(line => {
        const prod = findProductById(line.id);
        if (prod) prod.qty += line.qty;
    });
    currentCart = [];
    saveAll();
    
    document.getElementById("paymentReceived").value = '';
    
    renderCartSummary();
    renderPOS();
    document.getElementById("receiptCard").style.display = 'none';
    alert("Order cancelled. Stock restored.");
}

function updatePaymentAndChange() {
    const grandTotal = parseFloat(document.getElementById("totalAmount").innerText); 
    const payment = parseFloat(document.getElementById("paymentReceived").value) || 0;
    
    const change = payment - grandTotal;
    
    document.getElementById("changeAmount").innerText = formatMoney(Math.max(0, change));

    const checkoutBtn = document.getElementById("checkoutBtn");
    
    // Check if employee is logged in and total is paid
    const canCheckout = currentEmployee && payment >= grandTotal && grandTotal > 0; 
    
    checkoutBtn.disabled = !canCheckout;
    
    if (!currentEmployee) {
        checkoutBtn.textContent = 'Login to Checkout';
    } else if (grandTotal === 0) {
        checkoutBtn.textContent = 'Empty Order';
    } else if (payment < grandTotal) {
        checkoutBtn.textContent = 'Insufficient Payment';
    } else {
        checkoutBtn.textContent = 'Complete Transaction';
    }
}

function checkout() {
    if (!currentEmployee) return alert('Please login before checking out.');
    if (currentCart.length === 0) return alert('Cannot checkout an empty order.');

    const subtotalBase = parseFloat(document.getElementById("subtotalAmount").innerText);
    const tax = parseFloat(document.getElementById("taxAmount").innerText);
    const grandTotal = parseFloat(document.getElementById("totalAmount").innerText);
    const payment = parseFloat(document.getElementById("paymentReceived").value);
    const change = payment - grandTotal;

    if (payment < grandTotal) {
        return alert(`Payment (₱${formatMoney(payment)}) is less than the Grand Total (₱${formatMoney(grandTotal)}).`);
    }
    
    // Calculate total cost (COGS) and profit
    const totalCost = currentCart.reduce((sum, item) => sum + (item.costPrice * item.qty), 0);
    // Profit = Base Price Total (Subtotal) - Cost
    const totalProfit = subtotalBase - totalCost; 

    const sale = { 
        id: Date.now(),
        date: new Date().toISOString(), 
        items: JSON.parse(JSON.stringify(currentCart)), 
        subtotal: subtotalBase, // Price before tax
        tax: tax,
        total: grandTotal, // Price with tax
        cost: totalCost, 
        profit: totalProfit, 
        payment: payment,
        change: change,
        employeeId: currentEmployee.id, 
        employeeName: currentEmployee.name 
    };
    sales.push(sale);
    saveAll();

    generateReceipt(sale);

    currentCart = [];
    document.getElementById("paymentReceived").value = '';
    renderCartSummary();
    renderPOS();
}

function generateReceipt(sale) {
    const receiptContent = document.getElementById("receiptContent");
    const receiptCard = document.getElementById("receiptCard");

    receiptCard.style.display = 'block';

    const taxRate = config.taxRate;
    
    // The items list needs to show the Base Price and the Tax Component per item
    const receiptItemsHTML = sale.items.map(item => {
        const lineTotalTaxInclusive = item.qty * item.price;
        const taxFactor = 1 + (taxRate / 100);
        const lineTotalBase = lineTotalTaxInclusive / taxFactor;
        const lineTaxComponent = lineTotalTaxInclusive - lineTotalBase;

        return `
            <tr>
                <td style="width: 15px;">${item.qty}</td>
                <td>${item.name}</td>
                <td style="text-align: right;">₱${formatMoney(lineTotalTaxInclusive)}</td>
            </tr>
            `;
    }).join('');

    let receiptHTML = `
        <h3 style="text-align: center; margin-bottom: 5px;">--- ICHI-BOO TAKOYAKI POS RECEIPT ---</h3>
        <p style="text-align: center; font-size: 0.9em;">Transaction ID: ${sale.id}</p>
        <p style="text-align: center; font-size: 0.9em;">Date: ${new Date(sale.date).toLocaleString()}</p>
        <p style="text-align: center; font-size: 0.9em;">Cashier: ${sale.employeeName || 'N/A'}</p>
        <hr/>
        
        <table style="width: 100%; font-size: 0.9em; table-layout: fixed;">
            ${receiptItemsHTML}
        </table>
        
        <hr/>
        <div style="font-size: 1.0em;">
            <p style="display: flex; justify-content: space-between;">Subtotal (Pre-Tax): <span>₱${formatMoney(sale.subtotal)}</span></p>
            <p style="display: flex; justify-content: space-between;">Tax (${taxRate}%): <span>₱${formatMoney(sale.tax)}</span></p>
            <p style="display: flex; justify-content: space-between;"><strong>TOTAL:</strong> <strong>₱${formatMoney(sale.total)}</strong></p>
            <p style="display: flex; justify-content: space-between;">Paid: <span>₱${formatMoney(sale.payment)}</span></p>
            <p style="display: flex; justify-content: space-between;"><strong>CHANGE:</strong> <strong>₱${formatMoney(sale.change)}</strong></p>
        </div>
        <hr/>
        <p class="muted" style="text-align: center;">Thank you for your business!</p>
    `;

    receiptContent.innerHTML = receiptHTML;
}

window.addEventListener("DOMContentLoaded", () => {
    // Attempt to restore employee session
    const storedEmployeeId = sessionStorage.getItem("currentEmployeeId");
    if (storedEmployeeId) {
        currentEmployee = employees.find(e => e.id == storedEmployeeId);
    }
    renderEmployeeStatus();
    
    if (typeof products !== 'undefined') {
        buildCategoryTabs(); 
        renderPOS(); 
    } else {
        document.getElementById("productGrid").innerHTML = '<p class="muted">No products found. Please go to Inventory to add items.</p>';
    }

    document.getElementById("paymentReceived").addEventListener("input", updatePaymentAndChange);
    document.getElementById("checkoutBtn").addEventListener("click", checkout);
    document.getElementById("cancelOrderBtn").addEventListener("click", clearOrder);
});