// Initialize Date and Estimate Number
document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    generateEstimateNumber();
    
    // Load data from LocalStorage if it exists
    if (!loadBillData()) {
        addRow(); // Add one initial row if no saved data
    }
    
    // Load images
    const savedLogo = localStorage.getItem('bhumi_logo');
    if (savedLogo) {
        document.getElementById('logo-permanent').src = savedLogo;
    }
    
    const savedSig = localStorage.getItem('bhumi_sig');
    if (savedSig) {
        const sigPreview = document.getElementById('sig-preview');
        sigPreview.src = savedSig;
        sigPreview.style.display = 'block';
    }
});

function toggleSettings() {
    document.querySelector('.settings-panel').classList.toggle('active');
}

function toggleTheme() {
    const body = document.body;
    const btn = document.getElementById('theme-btn');
    if (body.classList.contains('light-theme')) {
        body.classList.replace('light-theme', 'dark-theme');
        btn.innerText = 'Switch to Light';
    } else {
        body.classList.replace('dark-theme', 'light-theme');
        btn.innerText = 'Switch to Dark';
    }
}

function handleFileUpload(input, type) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        localStorage.setItem(`bhumi_${type}`, base64);
        if (type === 'logo') {
            document.getElementById('logo-permanent').src = base64;
        } else {
            const preview = document.getElementById(`${type}-preview`);
            preview.src = base64;
            preview.style.display = 'block';
        }
    };
    reader.readAsDataURL(file);
}

function clearImage(type) {
    localStorage.removeItem(`bhumi_${type}`);
    if (type === 'logo') {
        document.getElementById('logo-permanent').src = 'logo.png';
    } else {
        const preview = document.getElementById(`${type}-preview`);
        preview.src = '';
        preview.style.display = 'none';
    }
    document.getElementById(`${type}-upload`).value = '';
}

function setCurrentDate() {
    const today = new Date();
    const dateString = today.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const dateEl = document.getElementById('current-date');
    if (dateEl) dateEl.innerText = dateString;
}

function generateEstimateNumber() {
    const now = new Date();
    const estNo = 'EST-' + now.getFullYear() + (now.getMonth() + 1).toString().padStart(2, '0') + now.getDate().toString().padStart(2, '0') + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const estEl = document.getElementById('est-number');
    if (estEl) estEl.innerText = estNo;
}

function addRow(data = null) {
    const tableBody = document.getElementById('bill-body');
    if (!tableBody) return;
    
    const rowCount = tableBody.rows.length + 1;
    const row = document.createElement('tr');

    row.innerHTML = `
        <td>${rowCount}</td>
        <td>
            <input list="products" class="particular-input" placeholder="Enter product details" value="${data ? data.particular : ''}" oninput="saveBillData()">
            <datalist id="products">
                <option value="Super Gray">
                <option value="Multi Brown">
                <option value="Plywood 18mm">
                <option value="Plywood 12mm">
                <option value="Laminate">
            </datalist>
        </td>
        <td><input type="text" class="size-input" placeholder="L x W" value="${data ? data.size : ''}" oninput="calculateRow(this)"></td>
        <td><input type="number" class="qty-input" value="${data ? data.qty : '1'}" oninput="calculateRow(this)"></td>
        <td><input type="number" step="0.01" class="sqft-input" placeholder="0.0" value="${data ? data.sqft : ''}" oninput="calculateRow(this)"></td>
        <td><input type="number" class="rate-input" placeholder="0.00" value="${data ? data.rate : ''}" oninput="calculateRow(this)"></td>
        <td class="col-amt amount-cell">${data ? data.amount : '0.00'}</td>
        <td class="no-print"><button class="delete-btn" onclick="deleteRow(this)">×</button></td>
    `;
    tableBody.appendChild(row);
    updateSerialNumbers();
    if (!data) row.querySelector('input').focus();
    saveBillData();
}

document.getElementById('bill-table').addEventListener('keydown', function(e) {
    const active = document.activeElement;
    if (active.tagName !== 'INPUT') return;

    const cell = active.closest('td');
    const row = cell.closest('tr');
    const cellIndex = cell.cellIndex;

    if (e.key === 'Enter') {
        e.preventDefault();
        const isLastRow = row.parentElement.lastElementChild === row;
        const isParticularField = active.classList.contains('particular-input');
        const isLastField = active.classList.contains('rate-input');
        
        if (isLastRow && (isLastField || isParticularField)) {
            addRow();
        } else {
            const nextRow = row.nextElementSibling;
            if (nextRow) {
                const nextInput = nextRow.cells[cellIndex].querySelector('input');
                if (nextInput) nextInput.focus();
            }
        }
    }

    if (e.key === 'ArrowDown') {
        const nextRow = row.nextElementSibling;
        if (nextRow) {
            const nextInput = nextRow.cells[cellIndex].querySelector('input');
            if (nextInput) nextInput.focus();
        }
    } else if (e.key === 'ArrowUp') {
        const prevRow = row.previousElementSibling;
        if (prevRow && prevRow.rowIndex > 0) {
            const prevInput = prevRow.cells[cellIndex].querySelector('input');
            if (prevInput) prevInput.focus();
        }
    } else if (e.key === 'ArrowRight' && active.selectionStart === active.value.length) {
        let nextCell = cell.nextElementSibling;
        while (nextCell) {
            const input = nextCell.querySelector('input');
            if (input) {
                input.focus();
                break;
            }
            nextCell = nextCell.nextElementSibling;
        }
    } else if (e.key === 'ArrowLeft' && active.selectionStart === 0) {
        let prevCell = cell.previousElementSibling;
        while (prevCell) {
            const input = prevCell.querySelector('input');
            if (input) {
                input.focus();
                break;
            }
            prevCell = prevCell.previousElementSibling;
        }
    }
});

function deleteRow(button) {
    const row = button.parentNode.parentNode;
    row.parentNode.removeChild(row);
    updateSerialNumbers();
    calculateGrandTotal();
    saveBillData();
}

function updateSerialNumbers() {
    const rows = document.querySelectorAll('#bill-body tr');
    rows.forEach((row, index) => {
        row.cells[0].innerText = index + 1;
    });
}

function roundSqFt(value) {
    if (!value || isNaN(value)) return 0;
    
    let integerPart = Math.floor(value);
    let decimalPart = Math.round((value - integerPart) * 100) / 100;

    if (decimalPart === 0) {
        return integerPart;
    } else if (decimalPart > 0 && decimalPart <= 0.25) {
        return integerPart + 0.25;
    } else if (decimalPart > 0.25 && decimalPart <= 0.50) {
        return integerPart + 0.50;
    } else if (decimalPart > 0.50 && decimalPart <= 0.75) {
        return integerPart + 0.75;
    } else {
        return integerPart + 1.00;
    }
}

function calculateSqFtFormula(length, width, quantity) {
    // Rule: If width is decimal, round it UP to next whole number
    const effectiveWidth = Math.ceil(width);
    
    // Formula: (Length * RoundedWidth * Quantity) / 144
    const rawSqFt = (length * effectiveWidth * quantity) / 144;
    
    return roundSqFt(rawSqFt);
}

function parseSize(sizeStr) {
    if (!sizeStr) return null;
    const parts = sizeStr.toLowerCase().split(/[x\*]/); 
    if (parts.length >= 2) {
        const l = parseFloat(parts[0].trim());
        const w = parseFloat(parts[1].trim());
        if (!isNaN(l) && !isNaN(w)) return { l, w };
    }
    return null;
}

function calculateRow(input) {
    const row = input.parentNode.parentNode;
    const sizeStr = row.querySelector('.size-input').value;
    const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
    const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
    let sqftField = row.querySelector('.sqft-input');

    const size = parseSize(sizeStr);
    if (size) {
        const roundedTotalSqFt = calculateSqFtFormula(size.l, size.w, qty);
        sqftField.value = roundedTotalSqFt.toFixed(2);
    }

    let sqft = parseFloat(sqftField.value) || 0;
    sqft = roundSqFt(sqft);

    const amount = sqft * rate;
    row.querySelector('.amount-cell').innerText = amount.toFixed(2);

    calculateGrandTotal();
    saveBillData();
}

function calculateGrandTotal() {
    const amounts = document.querySelectorAll('.amount-cell');
    let subTotal = 0;
    amounts.forEach(cell => { subTotal += parseFloat(cell.innerText) || 0; });

    const gstType = document.getElementById('gst-type').value;
    const gstRate = parseFloat(document.getElementById('gst-rate').value);
    
    let gstTotal = 0;
    const gstRows = document.getElementById('gst-rows');
    const sgstRow = document.getElementById('sgst-row');
    const cgstRow = document.getElementById('cgst-row');
    const igstRow = document.getElementById('igst-row');

    if (gstType === 'none') {
        gstRows.style.display = 'none';
    } else {
        gstRows.style.display = 'block';
        gstTotal = (subTotal * gstRate) / 100;
        
        if (gstType === 'sgst_cgst') {
            sgstRow.style.display = 'flex';
            cgstRow.style.display = 'flex';
            igstRow.style.display = 'none';
            const halfGst = gstTotal / 2;
            document.getElementById('sgst-percent').innerText = gstRate / 2;
            document.getElementById('cgst-percent').innerText = gstRate / 2;
            document.getElementById('sgst-amount').innerText = halfGst.toFixed(2);
            document.getElementById('cgst-amount').innerText = halfGst.toFixed(2);
        } else {
            sgstRow.style.display = 'none';
            cgstRow.style.display = 'none';
            igstRow.style.display = 'flex';
            document.getElementById('igst-percent').innerText = gstRate;
            document.getElementById('igst-amount').innerText = gstTotal.toFixed(2);
        }
    }

    const discount = parseFloat(document.getElementById('discount-amount').value) || 0;
    const paidAmount = parseFloat(document.getElementById('paid-amount').value) || 0;
    
    const grandTotalRaw = subTotal + gstTotal - discount;
    const grandTotal = Math.round(grandTotalRaw);
    const balance = grandTotal - paidAmount;

    document.getElementById('sub-total').innerText = subTotal.toFixed(2);
    document.getElementById('grand-total').innerText = grandTotal.toFixed(2);
    document.getElementById('balance-amount').innerText = balance.toFixed(2);
    document.getElementById('amount-words').innerText = numberToWords(grandTotal) + " Rupees Only";
    saveBillData();
}

function numberToWords(amount) {
    if (amount === 0) return "Zero";
    const words = {
        0: '', 1: 'One', 2: 'Two', 3: 'Three', 4: 'Four', 5: 'Five', 6: 'Six', 7: 'Seven', 8: 'Eight', 9: 'Nine',
        10: 'Ten', 11: 'Eleven', 12: 'Twelve', 13: 'Thirteen', 14: 'Fourteen', 15: 'Fifteen', 16: 'Sixteen', 17: 'Seventeen', 18: 'Eighteen', 19: 'Nineteen',
        20: 'Twenty', 30: 'Thirty', 40: 'Forty', 50: 'Five', 60: 'Sixty', 70: 'Seventy', 80: 'Eighty', 90: 'Ninety'
    };
    function convert(n) {
        if (n < 20) return words[n];
        if (n < 100) return words[Math.floor(n / 10) * 10] + (n % 10 !== 0 ? " " + words[n % 10] : "");
        if (n < 1000) return words[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + convert(n % 100) : "");
        if (n < 100000) return convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + convert(n % 1000) : "");
        if (n < 10000000) return convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + convert(n % 100000) : "");
        return convert(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + convert(n % 10000000) : "");
    }
    return convert(Math.round(amount));
}

function shareToWhatsApp() {
    const name = document.getElementById('customer-name').value || 'Customer';
    const total = document.getElementById('grand-total').innerText;
    const balance = document.getElementById('balance-amount').innerText;
    const estNo = document.getElementById('est-number').innerText;
    
    let text = `*Estimate from Bhumika Plywood*\n`;
    text += `Est No: ${estNo}\n`;
    text += `Customer: ${name}\n`;
    text += `Total Amount: ₹${total}\n`;
    text += `Balance: ₹${balance}\n`;
    text += `Thank you for your business!`;
    
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

function saveBillData() {
    const data = {
        customerName: document.getElementById('customer-name').value,
        mobileNumber: document.getElementById('mobile-number').value,
        discount: document.getElementById('discount-amount').value,
        paidAmount: document.getElementById('paid-amount').value,
        gstType: document.getElementById('gst-type').value,
        gstRate: document.getElementById('gst-rate').value,
        items: []
    };
    document.querySelectorAll('#bill-body tr').forEach(row => {
        data.items.push({
            particular: row.querySelector('.particular-input').value,
            size: row.querySelector('.size-input').value,
            qty: row.querySelector('.qty-input').value,
            sqft: row.querySelector('.sqft-input').value,
            rate: row.querySelector('.rate-input').value,
            amount: row.querySelector('.amount-cell').innerText
        });
    });
    localStorage.setItem('bhumi_bill_data_v3', JSON.stringify(data));
}

function loadBillData() {
    const saved = localStorage.getItem('bhumi_bill_data_v3');
    if (!saved) return false;
    const data = JSON.parse(saved);
    document.getElementById('customer-name').value = data.customerName || '';
    document.getElementById('mobile-number').value = data.mobileNumber || '';
    document.getElementById('discount-amount').value = data.discount || 0;
    document.getElementById('paid-amount').value = data.paidAmount || 0;
    if (data.gstType) document.getElementById('gst-type').value = data.gstType;
    if (data.gstRate) document.getElementById('gst-rate').value = data.gstRate;

    const tableBody = document.getElementById('bill-body');
    tableBody.innerHTML = '';
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => addRow(item));
        calculateGrandTotal();
        return true;
    }
    return false;
}

function clearBill() {
    if (confirm('Clear entire bill?')) {
        localStorage.removeItem('bhumi_bill_data_v3');
        location.reload();
    }
}

document.getElementById('bill-table').addEventListener('blur', function(e) {
    if (e.target.classList.contains('sqft-input')) {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
            e.target.value = roundSqFt(value).toFixed(2);
            calculateRow(e.target);
        }
    }
}, true);
