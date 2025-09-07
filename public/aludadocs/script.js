// CV and Invoice Generator Script
let currentTemplate = 'modern';
let savedDocuments = JSON.parse(localStorage.getItem('savedDocuments')) || [];

// Initialize the application
function initializeApp() {
    loadSavedDocuments();
    setupTemplateSelection();
    setupFormValidation();
    setupAutoSave();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    // CV Form
    const cvForm = document.getElementById('cvForm');
    if (cvForm) {
        cvForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateCV();
        });
    }

    // Invoice Form
    const invoiceForm = document.getElementById('invoiceForm');
    if (invoiceForm) {
        invoiceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            generateInvoice();
        });
    }

    // Add item button
    const addItemBtn = document.getElementById('addItem');
    if (addItemBtn) {
        addItemBtn.addEventListener('click', addInvoiceItem);
    }

    // Save document buttons
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('save-document')) {
            saveDocument(e.target.dataset.type);
        }
        if (e.target.classList.contains('download-document')) {
            downloadDocument(e.target.dataset.id);
        }
        if (e.target.classList.contains('delete-document')) {
            deleteDocument(e.target.dataset.id);
        }
    });
}

// Setup template selection
function setupTemplateSelection() {
    document.querySelectorAll('.cv-template').forEach(template => {
        template.addEventListener('click', function() {
            document.querySelectorAll('.cv-template').forEach(t => t.classList.remove('selected'));
            this.classList.add('selected');
            currentTemplate = this.dataset.template;
        });
    });
}

// Setup form validation
function setupFormValidation() {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearValidation);
    });
}

// Setup auto-save functionality
function setupAutoSave() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', debounce(autoSave, 1000));
        });
    });
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });

    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    // Add active class to corresponding nav link
    const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Update URL hash
    if (typeof window !== 'undefined') {
        window.location.hash = sectionName;
    }
}

// Generate CV
function generateCV() {
    const formData = new FormData(document.getElementById('cvForm'));
    const cvData = Object.fromEntries(formData.entries());

    // Validate required fields
    if (!cvData.fullName || !cvData.email || !cvData.phone) {
        showMessage('გთხოვთ შეავსოთ ყველა სავალდებულო ველი', 'error');
        return;
    }

    // Show loading
    const generateBtn = document.querySelector('#cvForm .btn-primary');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="loading"></span> გენერირება...';
    generateBtn.disabled = true;

    // Simulate generation process
    setTimeout(() => {
        const cvHTML = createCVHTML(cvData, currentTemplate);
        displayGeneratedDocument(cvHTML, 'CV');
        
        // Reset button
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
        
        showMessage('CV წარმატებით გენერირებულია!', 'success');
    }, 2000);
}

// Generate Invoice
function generateInvoice() {
    const formData = new FormData(document.getElementById('invoiceForm'));
    const invoiceData = Object.fromEntries(formData.entries());

    // Validate required fields
    if (!invoiceData.billerName || !invoiceData.clientName || !invoiceData.invoiceNumber) {
        showMessage('გთხოვთ შეავსოთ ყველა სავალდებულო ველი', 'error');
        return;
    }

    // Collect items
    const items = [];
    document.querySelectorAll('.item-row').forEach(row => {
        const item = {
            description: row.querySelector('input[name="itemDescription"]')?.value,
            quantity: row.querySelector('input[name="itemQuantity"]')?.value,
            price: row.querySelector('input[name="itemPrice"]')?.value,
            total: row.querySelector('input[name="itemTotal"]')?.value
        };
        if (item.description && item.quantity && item.price) {
            items.push(item);
        }
    });

    if (items.length === 0) {
        showMessage('გთხოვთ დაამატოთ მინიმუმ ერთი ნივთი', 'error');
        return;
    }

    // Show loading
    const generateBtn = document.querySelector('#invoiceForm .btn-primary');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="loading"></span> გენერირება...';
    generateBtn.disabled = true;

    // Simulate generation process
    setTimeout(() => {
        const invoiceHTML = createInvoiceHTML(invoiceData, items);
        displayGeneratedDocument(invoiceHTML, 'Invoice');
        
        // Reset button
        generateBtn.innerHTML = originalText;
        generateBtn.disabled = false;
        
        showMessage('ინვოისი წარმატებით გენერირებულია!', 'success');
    }, 2000);
}

// Create CV HTML
function createCVHTML(data, template) {
    const templates = {
        modern: `
            <div class="cv-modern">
                <header class="cv-header">
                    <h1>${data.fullName || ''}</h1>
                    <div class="contact-info">
                        <p>📧 ${data.email || ''}</p>
                        <p>📱 ${data.phone || ''}</p>
                        <p>📍 ${data.address || ''}</p>
                        ${data.linkedin ? `<p>🔗 ${data.linkedin}</p>` : ''}
                    </div>
                </header>
                
                ${data.summary ? `
                <section class="cv-section">
                    <h2>შესახებ</h2>
                    <p>${data.summary}</p>
                </section>
                ` : ''}
                
                ${data.experience ? `
                <section class="cv-section">
                    <h2>გამოცდილება</h2>
                    <div class="experience-item">
                        <p>${data.experience}</p>
                    </div>
                </section>
                ` : ''}
                
                ${data.education ? `
                <section class="cv-section">
                    <h2>განათლება</h2>
                    <div class="education-item">
                        <p>${data.education}</p>
                    </div>
                </section>
                ` : ''}
                
                ${data.skills ? `
                <section class="cv-section">
                    <h2>უნარები</h2>
                    <p>${data.skills}</p>
                </section>
                ` : ''}
            </div>
        `,
        classic: `
            <div class="cv-classic">
                <header class="cv-header">
                    <h1>${data.fullName || ''}</h1>
                    <div class="contact-info">
                        <p>Email: ${data.email || ''}</p>
                        <p>Phone: ${data.phone || ''}</p>
                        <p>Address: ${data.address || ''}</p>
                    </div>
                </header>
                
                ${data.summary ? `
                <section class="cv-section">
                    <h2>Professional Summary</h2>
                    <p>${data.summary}</p>
                </section>
                ` : ''}
                
                ${data.experience ? `
                <section class="cv-section">
                    <h2>Work Experience</h2>
                    <div class="experience-item">
                        <p>${data.experience}</p>
                    </div>
                </section>
                ` : ''}
                
                ${data.education ? `
                <section class="cv-section">
                    <h2>Education</h2>
                    <div class="education-item">
                        <p>${data.education}</p>
                    </div>
                </section>
                ` : ''}
                
                ${data.skills ? `
                <section class="cv-section">
                    <h2>Skills</h2>
                    <p>${data.skills}</p>
                </section>
                ` : ''}
            </div>
        `,
        creative: `
            <div class="cv-creative">
                <div class="cv-sidebar">
                    <div class="profile-section">
                        <h1>${data.fullName || ''}</h1>
                        <div class="contact-info">
                            <p>📧 ${data.email || ''}</p>
                            <p>📱 ${data.phone || ''}</p>
                            <p>📍 ${data.address || ''}</p>
                        </div>
                    </div>
                </div>
                
                <div class="cv-main">
                    ${data.summary ? `
                    <section class="cv-section">
                        <h2>შესახებ</h2>
                        <p>${data.summary}</p>
                    </section>
                    ` : ''}
                    
                    ${data.experience ? `
                    <section class="cv-section">
                        <h2>გამოცდილება</h2>
                        <div class="experience-item">
                            <p>${data.experience}</p>
                        </div>
                    </section>
                    ` : ''}
                    
                    ${data.education ? `
                    <section class="cv-section">
                        <h2>განათლება</h2>
                        <div class="education-item">
                            <p>${data.education}</p>
                        </div>
                    </section>
                    ` : ''}
                    
                    ${data.skills ? `
                    <section class="cv-section">
                        <h2>უნარები</h2>
                        <p>${data.skills}</p>
                    </section>
                    ` : ''}
                </div>
            </div>
        `
    };

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>CV - ${data.fullName || 'Document'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
                .cv-modern, .cv-classic, .cv-creative { max-width: 800px; margin: 0 auto; }
                .cv-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
                .cv-header h1 { color: #333; margin-bottom: 15px; }
                .contact-info p { margin: 5px 0; color: #666; }
                .cv-section { margin-bottom: 25px; }
                .cv-section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .cv-creative { display: flex; }
                .cv-sidebar { width: 250px; background: #f5f5f5; padding: 20px; margin-right: 20px; }
                .cv-main { flex: 1; }
                .profile-section { text-align: center; }
            </style>
        </head>
        <body>
            ${templates[template] || templates.modern}
        </body>
        </html>
    `;
}

// Create Invoice HTML
function createInvoiceHTML(data, items) {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const taxRate = parseFloat(data.taxRate) || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Invoice - ${data.invoiceNumber || 'Document'}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
                .invoice { max-width: 800px; margin: 0 auto; }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-logo { font-size: 24px; font-weight: bold; color: #333; }
                .invoice-details { text-align: right; }
                .invoice-parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .party-info { flex: 1; margin: 0 10px; }
                .party-title { font-weight: bold; margin-bottom: 10px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                .items-table th, .items-table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                .items-table th { background: #f5f5f5; font-weight: bold; }
                .totals { text-align: right; }
                .total-row { font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="invoice">
                <div class="invoice-header">
                    <div class="invoice-logo">${data.billerName || 'Company'}</div>
                    <div class="invoice-details">
                        <div>Invoice #${data.invoiceNumber || ''}</div>
                        <div>Date: ${data.invoiceDate || new Date().toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="invoice-parties">
                    <div class="party-info">
                        <div class="party-title">From:</div>
                        <div>${data.billerName || ''}</div>
                        <div>${data.billerAddress || ''}</div>
                        <div>${data.billerEmail || ''}</div>
                        <div>${data.billerPhone || ''}</div>
                    </div>
                    <div class="party-info">
                        <div class="party-title">To:</div>
                        <div>${data.clientName || ''}</div>
                        <div>${data.clientAddress || ''}</div>
                        <div>${data.clientEmail || ''}</div>
                        <div>${data.clientPhone || ''}</div>
                    </div>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                            <tr>
                                <td>${item.description || ''}</td>
                                <td>${item.quantity || ''}</td>
                                <td>$${parseFloat(item.price || 0).toFixed(2)}</td>
                                <td>$${parseFloat(item.total || 0).toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div>Subtotal: $${subtotal.toFixed(2)}</div>
                    ${tax > 0 ? `<div>Tax (${taxRate}%): $${tax.toFixed(2)}</div>` : ''}
                    <div class="total-row">Total: $${total.toFixed(2)}</div>
                </div>
                
                ${data.notes ? `
                <div style="margin-top: 30px;">
                    <strong>Notes:</strong>
                    <p>${data.notes}</p>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;
}

// Display generated document
function displayGeneratedDocument(html, type) {
    const newWindow = window.open('', '_blank');
    newWindow.document.write(html);
    newWindow.document.close();
    
    // Add save button to the new window
    const saveBtn = newWindow.document.createElement('button');
    saveBtn.innerHTML = '💾 Save Document';
    saveBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer; z-index: 1000;';
    saveBtn.onclick = () => {
        const docData = {
            id: Date.now().toString(),
            type: type,
            name: `${type} - ${new Date().toLocaleDateString()}`,
            content: html,
            date: new Date().toISOString()
        };
        saveDocumentToStorage(docData);
        newWindow.close();
    };
    newWindow.document.body.appendChild(saveBtn);
}

// Save document to storage
function saveDocumentToStorage(docData) {
    savedDocuments.push(docData);
    localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments));
    loadSavedDocuments();
    showMessage('დოკუმენტი წარმატებით შენახულია!', 'success');
}

// Load saved documents
function loadSavedDocuments() {
    const savedSection = document.getElementById('saved');
    if (!savedSection) return;

    const documentsContainer = savedSection.querySelector('.saved-documents');
    if (!documentsContainer) return;

    if (savedDocuments.length === 0) {
        documentsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">შენახული დოკუმენტები არ არის</p>';
        return;
    }

    documentsContainer.innerHTML = savedDocuments.map(doc => `
        <div class="saved-doc">
            <div class="doc-icon">${doc.type === 'CV' ? '📄' : '🧾'}</div>
            <div class="doc-name">${doc.name}</div>
            <div class="doc-type">${doc.type}</div>
            <div class="doc-date">${new Date(doc.date).toLocaleDateString()}</div>
            <div class="doc-actions">
                <button class="btn btn-secondary download-document" data-id="${doc.id}">Download</button>
                <button class="btn btn-danger delete-document" data-id="${doc.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

// Download document
function downloadDocument(docId) {
    const doc = savedDocuments.find(d => d.id === docId);
    if (!doc) return;

    const blob = new Blob([doc.content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.name}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Delete document
function deleteDocument(docId) {
    if (confirm('ნამდვილად გსურთ ამ დოკუმენტის წაშლა?')) {
        savedDocuments = savedDocuments.filter(d => d.id !== docId);
        localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments));
        loadSavedDocuments();
        showMessage('დოკუმენტი წარმატებით წაიშალა!', 'success');
    }
}

// Add invoice item
function addInvoiceItem() {
    const itemsContainer = document.getElementById('invoiceItems');
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.innerHTML = `
        <input type="text" name="itemDescription" placeholder="Item Description" required>
        <input type="number" name="itemQuantity" placeholder="Quantity" min="1" step="1" required>
        <input type="number" name="itemPrice" placeholder="Price" min="0" step="0.01" required>
        <input type="number" name="itemTotal" placeholder="Total" readonly>
        <button type="button" class="remove-item" onclick="this.parentElement.remove()">×</button>
    `;
    
    itemsContainer.appendChild(itemRow);
    
    // Setup calculation for new row
    setupItemCalculation(itemRow);
}

// Setup invoice calculations
function setupInvoiceCalculations() {
    document.querySelectorAll('.item-row').forEach(setupItemCalculation);
}

// Setup item calculation
function setupItemCalculation(row) {
    const quantityInput = row.querySelector('input[name="itemQuantity"]');
    const priceInput = row.querySelector('input[name="itemPrice"]');
    const totalInput = row.querySelector('input[name="itemTotal"]');
    
    function calculateTotal() {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = quantity * price;
        totalInput.value = total.toFixed(2);
    }
    
    quantityInput.addEventListener('input', calculateTotal);
    priceInput.addEventListener('input', calculateTotal);
}

// Validate field
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    // Remove existing validation
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Check if required field is empty
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'ეს ველი სავალდებულოა');
        return false;
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showFieldError(field, 'გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა');
            return false;
        }
    }
    
    // Phone validation
    if (field.type === 'tel' && value) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(value)) {
            showFieldError(field, 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი');
            return false;
        }
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = 'color: #ef4444; font-size: 0.8rem; margin-top: 0.25rem;';
    field.parentNode.appendChild(errorDiv);
}

// Clear validation
function clearValidation(e) {
    const field = e.target;
    field.classList.remove('error');
    const errorMessage = field.parentNode.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// Show message
function showMessage(text, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = text;
    
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Auto save
function autoSave() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        localStorage.setItem(`autoSave_${form.id}`, JSON.stringify(data));
    });
}

// Load auto saved data
function loadAutoSavedData() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const savedData = localStorage.getItem(`autoSave_${form.id}`);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.keys(data).forEach(key => {
                    const field = form.querySelector(`[name="${key}"]`);
                    if (field && data[key]) {
                        field.value = data[key];
                    }
                });
            } catch (e) {
                console.error('Error loading auto-saved data:', e);
            }
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupInvoiceCalculations();
    loadAutoSavedData();
    
    // Respect initial hash for deep linking: #cv, #invoice, #templates, #saved
    const initialHash = (typeof window !== 'undefined' && window.location.hash) ? window.location.hash.substring(1) : '';
    if (initialHash) {
        showSection(initialHash);
    }
});
