// js/inventory.js

let currentCategory = 'all';
let currentSearch = '';
let rawSortDirection = true;
let productSortDirection = true;

function formatMoney(n) {
    return Number(n || 0).toFixed(2);
}

// --- PART 1: FINISHED PRODUCT INVENTORY ---

function renderCategoryTabs() {
    const container = document.getElementById('categoryTabs');
    if (!container) return;
    
    let productCategories = products.map(p => p.category).filter(c => c && c.trim() !== '');
    let categories = ['all', 'Main', 'Drinks', 'Add-ons', ...productCategories];
    categories = [...new Set(categories)]; 

    container.innerHTML = '';
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat === 'all' ? 'All Products' : cat;
        btn.className = `btn ${currentCategory.toLowerCase() === cat.toLowerCase() ? 'active-tab' : ''}`;
        btn.onclick = () => {
            currentCategory = cat;
            renderInventory();
        };
        container.appendChild(btn);
    });
}

function renderInventory() {
    const container = document.getElementById("inventoryList");
    const searchInput = document.getElementById("inventorySearch");
    if (!container) return;

    currentSearch = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    let filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(currentSearch);
        const matchesCat = currentCategory === 'all' || p.category === currentCategory;
        return matchesSearch && matchesCat;
    });

    // START TABLE
    let html = `
        <table style="width:100%; border-collapse: collapse;">
            <thead>
                <tr style="background: var(--primary-color); color: white; position: sticky; top: 0; z-index: 10;">
                    <th style="padding:12px; text-align:left; cursor:pointer;" onclick="sortProducts('name')">Product Name ↕</th>
                    <th style="padding:12px; text-align:left; cursor:pointer;" onclick="sortProducts('category')">Category ↕</th>
                    <th style="padding:12px; text-align:right; cursor:pointer;" onclick="sortProducts('price')">Price ↕</th>
                    <th style="padding:12px; text-align:right; cursor:pointer;" onclick="sortProducts('qty')">Stock ↕</th>
                    <th style="padding:12px; text-align:center;">Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    filteredProducts.forEach((p, index) => {
        html += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding:12px;">${p.name}</td>
                <td style="padding:12px;">${p.category || 'Uncategorized'}</td>
                <td style="padding:12px; text-align:right;">₱${formatMoney(p.price)}</td>
                <td style="padding:12px; text-align:right; font-weight:bold; color: ${p.qty <= 5 ? 'red' : 'inherit'}">
                    ${p.qty}
                </td>
                <td style="padding:12px; text-align:center;">
                    <button class="btn" onclick="editProduct(${index})">Edit</button>
                    <button class="btn" onclick="removeProduct(${index})" style="background:#ff5252; color:white;">Delete</button>
                </td>
            </tr>
        `;
    });

    html += `</tbody></table>`;
    container.innerHTML = html;
    renderCategoryTabs();
}

function addProduct() {
    const name = document.getElementById("productName").value.trim();
    const cat = document.getElementById("productCategory").value.trim();
    const price = parseFloat(document.getElementById("productPrice").value) || 0;
    const cost = parseFloat(document.getElementById("productCostPrice").value) || 0;
    const qty = parseInt(document.getElementById("productQty").value) || 0;

    if (!name) return alert("Product name is required!");

    // Check if the product name already exists in our database
    let index = products.findIndex(p => p.name.toLowerCase() === name.toLowerCase());

    if (index > -1) {
        // UPDATE EXISTING: If it exists, overwrite the data
        products[index].category = cat;
        products[index].price = price;
        products[index].cost = cost;
        products[index].qty = qty;
    } else {
        // ADD NEW: If it's a new name, create a new entry
        products.push({
            id: Date.now(),
            name: name,
            category: cat,
            price: price,
            cost: cost,
            qty: qty
        });
    }

    saveAll();
    renderInventory();
    
    // Clear the form after saving
    document.getElementById("productName").value = '';
    document.getElementById("productCategory").value = '';
    document.getElementById("productPrice").value = '';
    document.getElementById("productCostPrice").value = '';
    document.getElementById("productQty").value = '';
    
    alert("Inventory Updated!");
}

// --- PART 2: RAW MATERIALS & EXPIRY ---

function addRawDelivery() {
    const name = document.getElementById("rawMaterialName").value;
    const delivered = document.getElementById("deliveryDate").value;
    const expiry = document.getElementById("expiryDate").value;
    const qty = document.getElementById("rawQty").value;

    if (!name || !expiry) return alert("Please enter name and expiry date");

    rawMaterials.push({
        id: Date.now(),
        name: name,
        delivered: delivered,
        expiry: expiry,
        qty: qty
    });

    saveAll(); // Uses the function from database.js
    renderRawMaterials();
    
    // Clear inputs
    document.getElementById("rawMaterialName").value = '';
    document.getElementById("rawQty").value = '';
    document.getElementById("rawQty").value = '';
}

function renderRawMaterials() {
    const list = document.getElementById("rawMaterialsList");
    if (!list) return;
    list.innerHTML = '';

    const today = new Date();
    today.setHours(0,0,0,0);

    rawMaterials.forEach((item, index) => {
        const expDate = new Date(item.expiry);
        const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));
        
        let statusHtml = '';
        let rowStyle = "";

        if (diffDays < 0) {
            statusHtml = `<span style="color: white; background: #d32f2f; padding: 2px 8px; border-radius: 4px; font-weight: bold;">EXPIRED</span>`;
            rowStyle = "background-color: #ffebee;";
        } else if (diffDays <= 3) {
            statusHtml = `<span style="color: #000; background: #ffeb3b; padding: 2px 8px; border-radius: 4px; font-weight: bold;">EXPIRING SOON</span>`;
        } else {
            statusHtml = `<span style="color: green;">Fresh</span>`;
        }

        list.innerHTML += `<tr style="border-bottom: 1px solid #eee; ${rowStyle}">
                <td style="padding: 10px;">${item.name} (${item.qty})</td>
                <td style="padding: 10px;">${item.delivered}</td>
                <td style="padding: 10px;">${item.expiry}</td>
                <td style="padding: 10px;">${statusHtml}</td>
                <td style="padding: 10px;"><button class="btn" onclick="deleteRaw(${index})">Delete</button></td>
            </tr>`;
    });
}

function deleteRaw(index) {
    if(confirm("Remove this log?")) {
        rawMaterials.splice(index, 1);
        saveAll();
        renderRawMaterials();
    }
}

function sortRawMaterials(key) {
    rawSortDirection = !rawSortDirection;
    rawMaterials.sort((a, b) => {
        let valA = a[key].toLowerCase();
        let valB = b[key].toLowerCase();
        return rawSortDirection ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    renderRawMaterials();
}

function sortProducts(key) {
    productSortDirection = !productSortDirection;
    
    products.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle string comparison (names/categories)
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
            return productSortDirection ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        
        // Handle number comparison (price/qty)
        return productSortDirection ? valA - valB : valB - valA;
    });

    renderInventory();
}

function removeProduct(index) {
    if (confirm("Are you sure you want to delete this product? This cannot be undone.")) {
        products.splice(index, 1); // Remove from the array
        saveAll();                // Save to localStorage
        renderInventory();        // Refresh the table
    }
}

function editProduct(index) {
    const p = products[index];

    // Fill the form fields with the product data
    document.getElementById("productName").value = p.name;
    document.getElementById("productCategory").value = p.category || "";
    document.getElementById("productPrice").value = p.price;
    document.getElementById("productCostPrice").value = p.cost || 0;
    document.getElementById("productQty").value = p.qty;

    // Optional: Scroll the user to the top of the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Focus on the Name field so they can start typing
    document.getElementById("productName").focus();
}

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    renderInventory();
    renderRawMaterials();
});