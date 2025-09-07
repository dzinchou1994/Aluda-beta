// Global variables
let currentSection = 'cv';
let workExperienceCount = 1;
let educationCount = 1;
let invoiceItemCount = 1;
let selectedCVTemplate = 'professional';
let selectedPortfolioDesign = 'modern';
let uploadedPhoto = null;
let uploadedLogo = null;
let selectedCurrency = 'GEL';
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let signatureData = null;
let signatureCanvasModal = null;
let signatureCtxModal = null;
let isDrawingModal = false;
let savedDocuments = JSON.parse(localStorage.getItem('savedDocuments')) || { cvs: [], invoices: [] };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupInvoiceCalculations();
    // Respect initial hash for deep linking: #cv, #invoice, #templates, #saved
    const initialHash = (typeof window !== 'undefined' && window.location.hash) ? window.location.hash.substring(1) : '';
    if (initialHash) {
        showSection(initialHash);
    }
});

// Initialize the application
function initializeApp() {
    // Set current date for invoice
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('invoiceDate').value = today;
    
    // Set due date to 30 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('dueDate').value = dueDate.toISOString().split('T')[0];
    
    // Generate invoice number
    generateInvoiceNumber();
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('href').substring(1);
            showSection(section);
        });
    });

    // Form submissions
    document.getElementById('cvForm').addEventListener('submit', handleCVSubmit);
    document.getElementById('invoiceForm').addEventListener('submit', handleInvoiceSubmit);

    // Hero buttons
    document.querySelectorAll('.hero-buttons .btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const section = this.textContent.includes('CV') ? 'cv' : 'invoice';
            showSection(section);
        });
    });

    // CV Template selection
    document.querySelectorAll('.template-option').forEach(option => {
        option.addEventListener('click', function() {
            selectCVTemplate(this);
        });
    });

    // Portfolio Design selection
    document.querySelectorAll('.design-option').forEach(option => {
        option.addEventListener('click', function() {
            selectPortfolioDesign(this);
        });
    });

    // Photo upload
    document.getElementById('photoUpload').addEventListener('change', handlePhotoUpload);

    // Logo upload
    document.getElementById('logoUpload').addEventListener('change', handleLogoUpload);

    // Currency selection
    document.getElementById('currency').addEventListener('change', handleCurrencyChange);

    // Initialize signature canvas
    initializeSignatureCanvas();

    // Load saved documents when saved section is shown
    document.getElementById('saved').addEventListener('click', loadSavedDocuments);

    // Add scroll effect to header
    window.addEventListener('scroll', handleScroll);
}

// Show specific section
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.style.display = 'block';
        currentSection = sectionName;
        
        // Add active class to corresponding nav link
        const activeLink = document.querySelector(`[href="#${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
        
        // Add animation to section
        targetSection.style.opacity = '0';
        targetSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            targetSection.style.transition = 'all 0.6s ease';
            targetSection.style.opacity = '1';
            targetSection.style.transform = 'translateY(0)';
        }, 50);
        
        // Scroll to section
        targetSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// Select CV template
function selectCVTemplate(option) {
    // Remove active class from all options
    document.querySelectorAll('.template-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Add active class to selected option
    option.classList.add('active');
    
    // Get template type
    selectedCVTemplate = option.getAttribute('data-template');
    
    // Add selection animation
    option.style.transform = 'scale(0.95)';
    setTimeout(() => {
        option.style.transform = 'scale(1)';
    }, 150);
    
    // Update form based on template
    updateFormForTemplate(selectedCVTemplate);
}

// Update form based on selected template
function updateFormForTemplate(template) {
    const form = document.getElementById('cvForm');
    
    // Add template-specific classes
    form.className = `cv-form template-${template}`;
    
    // Show/hide portfolio design options
    const portfolioDesigns = document.getElementById('portfolio-designs');
    if (template === 'portfolio') {
        portfolioDesigns.style.display = 'block';
        portfolioDesigns.style.animation = 'fadeInUp 0.6s ease-out';
    } else {
        portfolioDesigns.style.display = 'none';
    }
    
    // Show template-specific instructions
    showTemplateInstructions(template);
}

// Select portfolio design
function selectPortfolioDesign(option) {
    // Remove active class from all design options
    document.querySelectorAll('.design-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Add active class to selected option
    option.classList.add('active');
    
    // Get design type
    selectedPortfolioDesign = option.getAttribute('data-design');
    
    // Add selection animation
    option.style.transform = 'scale(0.95)';
    setTimeout(() => {
        option.style.transform = 'scale(1)';
    }, 150);
}

// Handle photo upload
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedPhoto = e.target.result;
            displayPhoto(uploadedPhoto);
        };
        reader.readAsDataURL(file);
    }
}

// Display uploaded photo
function displayPhoto(photoData) {
    const photoPreview = document.getElementById('photoPreview');
    const removeButton = document.getElementById('removePhoto');
    
    photoPreview.innerHTML = `<img src="${photoData}" alt="Profile Photo">`;
    removeButton.style.display = 'inline-flex';
}

// Remove photo
function removePhoto() {
    const photoPreview = document.getElementById('photoPreview');
    const removeButton = document.getElementById('removePhoto');
    const photoUpload = document.getElementById('photoUpload');
    
    photoPreview.innerHTML = `
        <i class="fas fa-camera"></i>
        <span>ფოტოს ატვირთვა</span>
    `;
    removeButton.style.display = 'none';
    photoUpload.value = '';
    uploadedPhoto = null;
}

// Handle logo upload
function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedLogo = e.target.result;
            displayLogo(uploadedLogo);
        };
        reader.readAsDataURL(file);
    }
}

// Display uploaded logo
function displayLogo(logoData) {
    const logoPreview = document.getElementById('logoPreview');
    const removeButton = document.getElementById('removeLogo');
    
    logoPreview.innerHTML = `<img src="${logoData}" alt="Company Logo">`;
    removeButton.style.display = 'inline-flex';
}

// Remove logo
function removeLogo() {
    const logoPreview = document.getElementById('logoPreview');
    const removeButton = document.getElementById('removeLogo');
    const logoUpload = document.getElementById('logoUpload');
    
    logoPreview.innerHTML = `
        <i class="fas fa-building"></i>
        <span>ლოგოს ატვირთვა</span>
    `;
    removeButton.style.display = 'none';
    logoUpload.value = '';
    uploadedLogo = null;
}

// Show template-specific instructions
function showTemplateInstructions(template) {
    const instructions = {
        professional: 'პროფესიონალური CV-ისთვის ყურადღება მიაქციეთ სამუშაო გამოცდილებასა და უნარებს',
        portfolio: 'პორტფოლიო CV-ისთვის ჩართეთ თქვენი პროექტები და კრეატიული ნამუშევრები',
        executive: 'ექსეკუტიური CV-ისთვის ხაზი გაუსვით ლიდერულ უნარებსა და მიღწევებს',
        creative: 'კრეატიული CV-ისთვის ჩართეთ თქვენი კრეატიული პროექტები და ინოვაციები'
    };
    
    // Create or update instruction element
    let instructionEl = document.getElementById('template-instructions');
    if (!instructionEl) {
        instructionEl = document.createElement('div');
        instructionEl.id = 'template-instructions';
        instructionEl.className = 'template-instructions';
        document.querySelector('.cv-template-selection').appendChild(instructionEl);
    }
    
    instructionEl.innerHTML = `
        <div class="instruction-content">
            <i class="fas fa-lightbulb"></i>
            <span>${instructions[template]}</span>
        </div>
    `;
    
    // Animate instruction appearance
    instructionEl.style.opacity = '0';
    instructionEl.style.transform = 'translateY(10px)';
    
    setTimeout(() => {
        instructionEl.style.transition = 'all 0.4s ease';
        instructionEl.style.opacity = '1';
        instructionEl.style.transform = 'translateY(0)';
    }, 100);
}

// Handle scroll effects
function handleScroll() {
    const header = document.querySelector('.header');
    const scrolled = window.scrollY > 50;
    
    if (scrolled) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
    
    // Add parallax effect to hero
    const hero = document.querySelector('.hero');
    if (hero) {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
    }
}

// Add work experience section
function addWorkExperience() {
    workExperienceCount++;
    const container = document.getElementById('workExperience');
    const newWorkItem = document.createElement('div');
    newWorkItem.className = 'work-item';
    newWorkItem.innerHTML = `
        <div class="form-grid">
            <div class="form-group">
                <label>თანამდებობა *</label>
                <input type="text" name="workPosition[]" required>
            </div>
            <div class="form-group">
                <label>კომპანია *</label>
                <input type="text" name="workCompany[]" required>
            </div>
            <div class="form-group">
                <label>დაწყების თარიღი</label>
                <input type="date" name="workStartDate[]">
            </div>
            <div class="form-group">
                <label>დასრულების თარიღი</label>
                <input type="date" name="workEndDate[]">
            </div>
        </div>
        <div class="form-group">
            <label>აღწერა</label>
            <textarea name="workDescription[]" rows="3" placeholder="მოკლე აღწერა თქვენი მოვალეობებისა და მიღწევებისა"></textarea>
        </div>
        <button type="button" class="btn btn-outline" onclick="removeWorkExperience(this)" style="margin-top: 1rem;">
            <i class="fas fa-trash"></i> წაშლა
        </button>
    `;
    container.appendChild(newWorkItem);
}

// Remove work experience section
function removeWorkExperience(button) {
    if (workExperienceCount > 1) {
        button.parentElement.remove();
        workExperienceCount--;
    }
}

// Add education section
function addEducation() {
    educationCount++;
    const container = document.getElementById('education');
    const newEducationItem = document.createElement('div');
    newEducationItem.className = 'education-item';
    newEducationItem.innerHTML = `
        <div class="form-grid">
            <div class="form-group">
                <label>საგანი/სპეციალობა *</label>
                <input type="text" name="educationDegree[]" required>
            </div>
            <div class="form-group">
                <label>საგანმანათლებლო დაწესებულება *</label>
                <input type="text" name="educationInstitution[]" required>
            </div>
            <div class="form-group">
                <label>დაწყების წელი</label>
                <input type="number" name="educationStartYear[]" min="1950" max="2030">
            </div>
            <div class="form-group">
                <label>დასრულების წელი</label>
                <input type="number" name="educationEndYear[]" min="1950" max="2030">
            </div>
        </div>
        <button type="button" class="btn btn-outline" onclick="removeEducation(this)" style="margin-top: 1rem;">
            <i class="fas fa-trash"></i> წაშლა
        </button>
    `;
    container.appendChild(newEducationItem);
}

// Remove education section
function removeEducation(button) {
    if (educationCount > 1) {
        button.parentElement.remove();
        educationCount--;
    }
}

// Add invoice item
function addInvoiceItem() {
    invoiceItemCount++;
    const container = document.getElementById('invoiceItems');
    const currencySymbol = getCurrencySymbol(selectedCurrency);
    const newInvoiceItem = document.createElement('div');
    newInvoiceItem.className = 'invoice-item';
    newInvoiceItem.innerHTML = `
        <div class="form-grid">
            <div class="form-group">
                <label>აღწერა *</label>
                <input type="text" name="itemDescription[]" required>
            </div>
            <div class="form-group">
                <label>რაოდენობა</label>
                <input type="number" name="itemQuantity[]" min="1" value="1" onchange="calculateItemTotal(this)">
            </div>
            <div class="form-group">
                <label>ფასი (${currencySymbol}) *</label>
                <input type="number" name="itemPrice[]" min="0" step="0.01" required onchange="calculateItemTotal(this)">
            </div>
            <div class="form-group">
                <label>ჯამი (${currencySymbol})</label>
                <input type="number" name="itemTotal[]" readonly>
            </div>
        </div>
        <button type="button" class="btn btn-outline" onclick="removeInvoiceItem(this)" style="margin-top: 1rem;">
            <i class="fas fa-trash"></i> წაშლა
        </button>
    `;
    container.appendChild(newInvoiceItem);
}

// Remove invoice item
function removeInvoiceItem(button) {
    if (invoiceItemCount > 1) {
        button.parentElement.remove();
        invoiceItemCount--;
        calculateInvoiceTotal();
    }
}

// Setup invoice calculations
function setupInvoiceCalculations() {
    // Add event listeners to existing invoice items
    document.querySelectorAll('input[name="itemQuantity[]"], input[name="itemPrice[]"]').forEach(input => {
        input.addEventListener('change', function() {
            calculateItemTotal(this);
        });
    });
}

// Calculate item total
function calculateItemTotal(input) {
    const item = input.closest('.invoice-item');
    const quantity = parseFloat(item.querySelector('input[name="itemQuantity[]"]').value) || 0;
    const price = parseFloat(item.querySelector('input[name="itemPrice[]"]').value) || 0;
    const total = quantity * price;
    
    item.querySelector('input[name="itemTotal[]"]').value = total.toFixed(2);
    calculateInvoiceTotal();
}

// Calculate invoice total
function calculateInvoiceTotal() {
    const totals = document.querySelectorAll('input[name="itemTotal[]"]');
    let grandTotal = 0;
    
    totals.forEach(total => {
        grandTotal += parseFloat(total.value) || 0;
    });
    
    // Update total display if it exists
    const totalDisplay = document.getElementById('invoiceTotal');
    if (totalDisplay) {
        totalDisplay.textContent = grandTotal.toFixed(2);
    }
}

// Generate invoice number
function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const invoiceNumber = `INV-${year}${month}${day}-${random}`;
    document.getElementById('invoiceNumber').value = invoiceNumber;
}

// Handle CV form submission
function handleCVSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateCVForm()) {
        return;
    }
    
    // Generate CV preview
    generateCVPreview();
    
    // Show preview modal
    showPreviewModal();
}

// Handle invoice form submission
function handleInvoiceSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateInvoiceForm()) {
        return;
    }
    
    // Generate invoice preview
    generateInvoicePreview();
    
    // Show preview modal
    showPreviewModal();
}

// Validate CV form
function validateCVForm() {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    
    for (let field of requiredFields) {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
            alert(`გთხოვთ შეავსოთ ${input.previousElementSibling.textContent}`);
            input.focus();
            return false;
        }
    }
    
    return true;
}

// Validate invoice form
function validateInvoiceForm() {
    const requiredFields = ['companyName', 'clientName', 'invoiceNumber', 'invoiceDate'];
    
    for (let field of requiredFields) {
        const input = document.getElementById(field);
        if (!input.value.trim()) {
            alert(`გთხოვთ შეავსოთ ${input.previousElementSibling.textContent}`);
            input.focus();
            return false;
        }
    }
    
    // Check if at least one item is added
    const items = document.querySelectorAll('.invoice-item');
    if (items.length === 0) {
        alert('გთხოვთ დაამატოთ მინიმუმ ერთი ნივთი');
        return false;
    }
    
    return true;
}

// Generate CV preview
function generateCVPreview() {
    const formData = new FormData(document.getElementById('cvForm'));
    const data = Object.fromEntries(formData.entries());
    
    // Get arrays for work experience and education
    const workPositions = formData.getAll('workPosition[]');
    const workCompanies = formData.getAll('workCompany[]');
    const workStartDates = formData.getAll('workStartDate[]');
    const workEndDates = formData.getAll('workEndDate[]');
    const workDescriptions = formData.getAll('workDescription[]');
    
    const educationDegrees = formData.getAll('educationDegree[]');
    const educationInstitutions = formData.getAll('educationInstitution[]');
    const educationStartYears = formData.getAll('educationStartYear[]');
    const educationEndYears = formData.getAll('educationEndYear[]');
    
    // Build work experience HTML
    let workExperienceHTML = '';
    for (let i = 0; i < workPositions.length; i++) {
        if (workPositions[i] && workCompanies[i]) {
            workExperienceHTML += `
                <div class="cv-experience-item">
                    <div class="cv-item-header">
                        <div>
                            <div class="cv-item-title">${workPositions[i]}</div>
                            <div class="cv-item-company">${workCompanies[i]}</div>
                        </div>
                        <div class="cv-item-date">
                            ${workStartDates[i] ? formatDate(workStartDates[i]) : ''} - 
                            ${workEndDates[i] ? formatDate(workEndDates[i]) : 'დღემდე'}
                        </div>
                    </div>
                    ${workDescriptions[i] ? `<div class="cv-item-description">${workDescriptions[i]}</div>` : ''}
                </div>
            `;
        }
    }
    
    // Build education HTML
    let educationHTML = '';
    for (let i = 0; i < educationDegrees.length; i++) {
        if (educationDegrees[i] && educationInstitutions[i]) {
            educationHTML += `
                <div class="cv-education-item">
                    <div class="cv-item-header">
                        <div>
                            <div class="cv-item-title">${educationDegrees[i]}</div>
                            <div class="cv-item-company">${educationInstitutions[i]}</div>
                        </div>
                        <div class="cv-item-date">
                            ${educationStartYears[i] || ''} - ${educationEndYears[i] || ''}
                        </div>
                    </div>
                </div>
            `;
        }
    }
    
    // Build skills HTML
    let skillsHTML = '';
    if (data.skills) {
        const skills = data.skills.split(',').map(skill => skill.trim()).filter(skill => skill);
        skillsHTML = `
            <div class="cv-skills">
                ${skills.map(skill => `<span class="cv-skill">${skill}</span>`).join('')}
            </div>
        `;
    }
    
    // Build languages HTML
    let languagesHTML = '';
    if (data.languages) {
        const languages = data.languages.split(',').map(lang => lang.trim()).filter(lang => lang);
        languagesHTML = `
            <div class="cv-languages">
                ${languages.map(lang => `<span class="cv-skill">${lang}</span>`).join('')}
            </div>
        `;
    }
    
    // Generate template-specific CV HTML
    const cvHTML = generateTemplateCV(selectedCVTemplate, data, workExperienceHTML, educationHTML, skillsHTML, languagesHTML, uploadedPhoto, selectedPortfolioDesign);
    
    document.getElementById('previewContent').innerHTML = cvHTML;
}

// Generate template-specific CV
function generateTemplateCV(template, data, workExperienceHTML, educationHTML, skillsHTML, languagesHTML, photo, portfolioDesign) {
    // Generate photo HTML if available
    const photoHTML = photo ? `<div class="cv-photo"><img src="${photo}" alt="Profile Photo"></div>` : '';
    
    // Generate header based on template
    let headerHTML = '';
    if (template === 'portfolio') {
        headerHTML = `
            <div class="cv-header portfolio-header design-${portfolioDesign}">
                ${photoHTML}
                <div class="cv-info">
                    <h1 class="cv-name">${data.firstName} ${data.lastName}</h1>
                    <div class="cv-contact">
                        ${data.email} | ${data.phone}
                        ${data.address ? ` | ${data.address}` : ''}
                    </div>
                </div>
            </div>
        `;
    } else {
        headerHTML = `
            <div class="cv-header">
                ${photoHTML}
                <h1 class="cv-name">${data.firstName} ${data.lastName}</h1>
                <div class="cv-contact">
                    ${data.email} | ${data.phone}
                    ${data.address ? ` | ${data.address}` : ''}
                </div>
            </div>
        `;
    }
    
    const baseHTML = `
        <div class="cv-preview template-${template}">
            ${headerHTML}
            
            ${data.summary ? `
                <div class="cv-section">
                    <h3>პროფესიონალური შეჯამება</h3>
                    <div class="cv-summary">${data.summary}</div>
                </div>
            ` : ''}
            
            ${workExperienceHTML ? `
                <div class="cv-section">
                    <h3>სამუშაო გამოცდილება</h3>
                    ${workExperienceHTML}
                </div>
            ` : ''}
            
            ${educationHTML ? `
                <div class="cv-section">
                    <h3>განათლება</h3>
                    ${educationHTML}
                </div>
            ` : ''}
            
            ${skillsHTML ? `
                <div class="cv-section">
                    <h3>უნარები</h3>
                    ${skillsHTML}
                </div>
            ` : ''}
            
            ${languagesHTML ? `
                <div class="cv-section">
                    <h3>ენები</h3>
                    ${languagesHTML}
                </div>
            ` : ''}
        </div>
    `;
    
    // Add template-specific styling and content
    switch(template) {
        case 'portfolio':
            return baseHTML.replace('cv-preview', 'cv-preview portfolio-cv');
        case 'executive':
            return baseHTML.replace('cv-preview', 'cv-preview executive-cv');
        case 'creative':
            return baseHTML.replace('cv-preview', 'cv-preview creative-cv');
        default:
            return baseHTML;
    }
}

// Generate invoice preview
function generateInvoicePreview() {
    const formData = new FormData(document.getElementById('invoiceForm'));
    const data = Object.fromEntries(formData.entries());
    
    // Get invoice items
    const descriptions = formData.getAll('itemDescription[]');
    const quantities = formData.getAll('itemQuantity[]');
    const prices = formData.getAll('itemPrice[]');
    const totals = formData.getAll('itemTotal[]');
    
    // Build items table
    let itemsHTML = '';
    let grandTotal = 0;
    
    for (let i = 0; i < descriptions.length; i++) {
        if (descriptions[i]) {
            const total = parseFloat(totals[i]) || 0;
            grandTotal += total;
            
            itemsHTML += `
                <tr>
                    <td>${descriptions[i]}</td>
                    <td>${quantities[i] || 1}</td>
                    <td>${formatCurrency(parseFloat(prices[i] || 0))}</td>
                    <td>${formatCurrency(total)}</td>
                </tr>
            `;
        }
    }
    
    // Generate logo HTML if available
    const logoHTML = uploadedLogo ? `<div class="invoice-logo"><img src="${uploadedLogo}" alt="Company Logo"></div>` : '';
    
    // Generate full invoice HTML
    const invoiceHTML = `
        <div class="invoice-preview">
            <div class="invoice-header">
                <div class="invoice-company">
                    ${logoHTML}
                    <div class="company-info">
                        <h2>${data.companyName}</h2>
                        ${data.companyAddress ? `<p>${data.companyAddress}</p>` : ''}
                        ${data.companyPhone ? `<p>ტელ: ${data.companyPhone}</p>` : ''}
                        ${data.companyEmail ? `<p>ელ.ფოსტა: ${data.companyEmail}</p>` : ''}
                    </div>
                </div>
                <div class="invoice-details">
                    <h3>ინვოისი #${data.invoiceNumber}</h3>
                    <p>თარიღი: ${formatDate(data.invoiceDate)}</p>
                    ${data.dueDate ? `<p>გადახდის ვადა: ${formatDate(data.dueDate)}</p>` : ''}
                </div>
            </div>
            
            <div class="invoice-client">
                <h3>კლიენტი:</h3>
                <p><strong>${data.clientName}</strong></p>
                ${data.clientAddress ? `<p>${data.clientAddress}</p>` : ''}
            </div>
            
            <div class="invoice-items">
                <table class="invoice-items-table">
                    <thead>
                        <tr>
                            <th>აღწერა</th>
                            <th>რაოდენობა</th>
                            <th>ფასი</th>
                            <th>ჯამი</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>
                <div class="invoice-total">
                    <strong>სულ: ${formatCurrency(grandTotal, selectedCurrency)}</strong>
                </div>
            </div>
            
            ${getSignatureHTML()}
        </div>
    `;
    
    document.getElementById('previewContent').innerHTML = invoiceHTML;
}

// Show preview modal
function showPreviewModal() {
    document.getElementById('previewModal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Close preview modal
function closePreview() {
    document.getElementById('previewModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Preview CV
function previewCV() {
    if (validateCVForm()) {
        generateCVPreview();
        showPreviewModal();
    }
}

// Preview invoice
function previewInvoice() {
    if (validateInvoiceForm()) {
        generateInvoicePreview();
        showPreviewModal();
    }
}

// Download PDF
function downloadPDF() {
    // This is a simplified version - in a real application, you would use a library like jsPDF
    const content = document.getElementById('previewContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>ALUDA AI - ${currentSection === 'cv' ? 'CV' : 'ინვოისი'}</title>
                <style>
                    body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; }
                    .cv-preview, .invoice-preview { max-width: none; box-shadow: none; }
                    @media print { body { margin: 0; padding: 0; } }
                </style>
            </head>
            <body>
                ${content}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ka-GE');
}

// Handle currency change
function handleCurrencyChange(event) {
    selectedCurrency = event.target.value;
    // Update all price labels in the form
    updatePriceLabels();
}

// Update price labels based on selected currency
function updatePriceLabels() {
    const currencySymbol = getCurrencySymbol(selectedCurrency);
    
    // Update all price and total labels
    document.querySelectorAll('label').forEach(label => {
        if (label.textContent.includes('ფასი') || label.textContent.includes('ჯამი')) {
            label.textContent = label.textContent.replace(/\([₾$€]\)/, `(${currencySymbol})`);
        }
    });
}

// Get currency symbol
function getCurrencySymbol(currency) {
    const symbols = {
        'GEL': '₾',
        'USD': '$',
        'EUR': '€'
    };
    return symbols[currency] || '₾';
}

// Format number with comma separators and currency
function formatNumber(number, currency = selectedCurrency) {
    if (typeof number === 'string') {
        number = parseFloat(number);
    }
    const formatted = number.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    return formatted;
}

// Format currency amount
function formatCurrency(amount, currency = selectedCurrency) {
    const symbol = getCurrencySymbol(currency);
    const formatted = formatNumber(amount, currency);
    return `${formatted} ${symbol}`;
}

// Initialize signature canvas
function initializeSignatureCanvas() {
    signatureCanvas = document.getElementById('signatureCanvas');
    if (signatureCanvas) {
        signatureCtx = signatureCanvas.getContext('2d');
        setupSignatureEvents();
    }
}

// Setup signature canvas events
function setupSignatureEvents() {
    if (!signatureCanvas || !signatureCtx) return;

    // Mouse events
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);

    // Touch events for mobile
    signatureCanvas.addEventListener('touchstart', handleTouch);
    signatureCanvas.addEventListener('touchmove', handleTouch);
    signatureCanvas.addEventListener('touchend', stopDrawing);

    // Set canvas properties
    signatureCtx.strokeStyle = '#2d3748';
    signatureCtx.lineWidth = 2;
    signatureCtx.lineCap = 'round';
    signatureCtx.lineJoin = 'round';
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtx.beginPath();
    signatureCtx.moveTo(x, y);
}

// Draw
function draw(e) {
    if (!isDrawing) return;
    
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
}

// Stop drawing
function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        signatureCtx.beginPath();
        // Save signature data
        signatureData = signatureCanvas.toDataURL();
    }
}

// Handle touch events
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                    e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
}

// Toggle signature section
function toggleSignature() {
    const checkbox = document.getElementById('enableSignature');
    const signatureSection = document.getElementById('signatureSection');
    const signatureDate = document.getElementById('signatureDate');
    
    if (checkbox.checked) {
        signatureSection.style.display = 'block';
        signatureSection.style.animation = 'fadeInUp 0.5s ease-out';
        
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        signatureDate.value = today;
    } else {
        signatureSection.style.display = 'none';
        // Clear signature data when disabled
        clearSignature();
    }
}

// Clear signature
function clearSignature() {
    if (signatureCanvas && signatureCtx) {
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureData = null;
    }
}

// Get signature HTML for preview
function getSignatureHTML() {
    const enableSignature = document.getElementById('enableSignature');
    const signatureDate = document.getElementById('signatureDate');
    
    // Only show signature if it's enabled AND there's actual signature data
    if (enableSignature && enableSignature.checked && signatureData) {
        return `
            <div class="digital-signature">
                <div class="signature-preview">
                    <div class="signature-canvas-preview">
                        <img src="${signatureData}" alt="Digital Signature" style="width: 100%; height: 100%; object-fit: contain;">
                    </div>
                    <p>ხელმოწერა</p>
                </div>
                <div class="signature-preview">
                    <div class="signature-canvas-preview" style="display: flex; align-items: center; justify-content: center; font-size: 0.9rem; color: #4a5568;">
                        ${signatureDate ? formatDate(signatureDate.value) : formatDate(new Date().toISOString().split('T')[0])}
                    </div>
                    <p>თარიღი</p>
                </div>
            </div>
        `;
    } else {
        // Return empty string - no signature section at all
        return '';
    }
}

// Save CV
function saveCV() {
    if (!validateCVForm()) {
        return;
    }
    
    const formData = new FormData(document.getElementById('cvForm'));
    const data = Object.fromEntries(formData.entries());
    
    const cvData = {
        id: Date.now().toString(),
        type: 'cv',
        title: `${data.firstName} ${data.lastName} - CV`,
        template: selectedCVTemplate,
        portfolioDesign: selectedPortfolioDesign,
        data: data,
        photo: uploadedPhoto,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    savedDocuments.cvs.push(cvData);
    localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments));
    
    showNotification('CV წარმატებით შენახულია!', 'success');
}

// Save Invoice
function saveInvoice() {
    if (!validateInvoiceForm()) {
        return;
    }
    
    const formData = new FormData(document.getElementById('invoiceForm'));
    const data = Object.fromEntries(formData.entries());
    
    const invoiceData = {
        id: Date.now().toString(),
        type: 'invoice',
        title: `${data.companyName} - ინვოისი #${data.invoiceNumber}`,
        currency: selectedCurrency,
        data: data,
        logo: uploadedLogo,
        signature: signatureData,
        signatureEnabled: document.getElementById('enableSignature')?.checked || false,
        signatureDate: document.getElementById('signatureDate')?.value || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    savedDocuments.invoices.push(invoiceData);
    localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments));
    
    showNotification('ინვოისი წარმატებით შენახულია!', 'success');
}

// Load saved documents
function loadSavedDocuments() {
    loadSavedCVs();
    loadSavedInvoices();
}

// Load saved CVs
function loadSavedCVs() {
    const grid = document.getElementById('savedCVsGrid');
    if (savedDocuments.cvs.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <h3>შენახული CV-ები არ არის</h3>
                <p>შექმენით და შეინახეთ თქვენი პირველი CV</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = savedDocuments.cvs.map(cv => `
        <div class="saved-document">
            <div class="document-header">
                <div class="document-type">
                    <i class="fas fa-file-alt"></i>
                    CV
                </div>
                <div class="document-actions">
                    <button onclick="editDocument('${cv.id}', 'cv')" title="რედაქტირება">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDocument('${cv.id}', 'cv')" class="delete-btn" title="წაშლა">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="document-title">${cv.title}</div>
            <div class="document-meta">
                შაბლონი: ${getTemplateName(cv.template)}${cv.portfolioDesign ? ` (${cv.portfolioDesign})` : ''}
            </div>
            <div class="document-preview">
                ${cv.photo ? `<img src="${cv.photo}" alt="CV Preview">` : '<div class="preview-placeholder">CV პრევიუ</div>'}
            </div>
            <div class="document-footer">
                <div class="document-date">${formatDate(cv.updatedAt)}</div>
                <div class="document-actions-main">
                    <button class="btn btn-outline btn-sm" onclick="editDocument('${cv.id}', 'cv')">
                        <i class="fas fa-edit"></i> რედაქტირება
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="downloadDocument('${cv.id}', 'cv')">
                        <i class="fas fa-download"></i> გადმოწერა
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load saved invoices
function loadSavedInvoices() {
    const grid = document.getElementById('savedInvoicesGrid');
    if (savedDocuments.invoices.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>შენახული ინვოისები არ არის</h3>
                <p>შექმენით და შეინახეთ თქვენი პირველი ინვოისი</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = savedDocuments.invoices.map(invoice => `
        <div class="saved-document">
            <div class="document-header">
                <div class="document-type">
                    <i class="fas fa-receipt"></i>
                    ინვოისი
                </div>
                <div class="document-actions">
                    <button onclick="editDocument('${invoice.id}', 'invoice')" title="რედაქტირება">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteDocument('${invoice.id}', 'invoice')" class="delete-btn" title="წაშლა">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="document-title">${invoice.title}</div>
            <div class="document-meta">
                ვალუტა: ${getCurrencySymbol(invoice.currency)} | თარიღი: ${formatDate(invoice.data.invoiceDate)}
            </div>
            <div class="document-preview">
                ${invoice.logo ? `<img src="${invoice.logo}" alt="Invoice Preview">` : '<div class="preview-placeholder">ინვოისის პრევიუ</div>'}
            </div>
            <div class="document-footer">
                <div class="document-date">${formatDate(invoice.updatedAt)}</div>
                <div class="document-actions-main">
                    <button class="btn btn-outline btn-sm" onclick="editDocument('${invoice.id}', 'invoice')">
                        <i class="fas fa-edit"></i> რედაქტირება
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="downloadDocument('${invoice.id}', 'invoice')">
                        <i class="fas fa-download"></i> გადმოწერა
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show saved tab
function showSavedTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.saved-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide content
    document.getElementById('savedCVs').style.display = tab === 'cvs' ? 'block' : 'none';
    document.getElementById('savedInvoices').style.display = tab === 'invoices' ? 'block' : 'none';
}

// Edit document
function editDocument(id, type) {
    const documents = type === 'cv' ? savedDocuments.cvs : savedDocuments.invoices;
    const doc = documents.find(d => d.id === id);
    
    if (!doc) return;
    
    if (type === 'cv') {
        loadCVForEdit(doc);
        showSection('cv');
    } else {
        loadInvoiceForEdit(doc);
        showSection('invoice');
    }
}

// Load CV for editing
function loadCVForEdit(cvData) {
    // Set template
    selectedCVTemplate = cvData.template;
    selectedPortfolioDesign = cvData.portfolioDesign || 'modern';
    
    // Update template selection
    document.querySelectorAll('.template-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.getAttribute('data-template') === cvData.template) {
            opt.classList.add('active');
        }
    });
    
    // Show portfolio designs if needed
    updateFormForTemplate(cvData.template);
    
    // Load form data
    Object.keys(cvData.data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = cvData.data[key];
        }
    });
    
    // Load photo
    if (cvData.photo) {
        uploadedPhoto = cvData.photo;
        displayPhoto(cvData.photo);
    }
    
    showNotification('CV ჩაიტვირთა რედაქტირებისთვის', 'info');
}

// Load invoice for editing
function loadInvoiceForEdit(invoiceData) {
    // Set currency
    selectedCurrency = invoiceData.currency;
    document.getElementById('currency').value = invoiceData.currency;
    updatePriceLabels();
    
    // Load form data
    Object.keys(invoiceData.data).forEach(key => {
        const input = document.getElementById(key);
        if (input) {
            input.value = invoiceData.data[key];
        }
    });
    
    // Load logo
    if (invoiceData.logo) {
        uploadedLogo = invoiceData.logo;
        displayLogo(invoiceData.logo);
    }
    
    // Load signature
    if (invoiceData.signatureEnabled && invoiceData.signature) {
        document.getElementById('enableSignature').checked = true;
        toggleSignature();
        signatureData = invoiceData.signature;
        // Redraw signature on canvas
        if (signatureCanvas && signatureCtx) {
            const img = new Image();
            img.onload = function() {
                signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
                signatureCtx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
            };
            img.src = invoiceData.signature;
        }
    }
    
    showNotification('ინვოისი ჩაიტვირთა რედაქტირებისთვის', 'info');
}

// Delete document
function deleteDocument(id, type) {
    if (!confirm('ნამდვილად გსურთ ამ დოკუმენტის წაშლა?')) {
        return;
    }
    
    if (type === 'cv') {
        savedDocuments.cvs = savedDocuments.cvs.filter(cv => cv.id !== id);
    } else {
        savedDocuments.invoices = savedDocuments.invoices.filter(invoice => invoice.id !== id);
    }
    
    localStorage.setItem('savedDocuments', JSON.stringify(savedDocuments));
    loadSavedDocuments();
    showNotification('დოკუმენტი წაიშალა', 'success');
}

// Download document
function downloadDocument(id, type) {
    const documents = type === 'cv' ? savedDocuments.cvs : savedDocuments.invoices;
    const doc = documents.find(d => d.id === id);
    
    if (!doc) return;
    
    if (type === 'cv') {
        // Generate CV preview and download
        generateCVPreviewFromData(doc);
        downloadPDF();
    } else {
        // Generate invoice preview and download
        generateInvoicePreviewFromData(doc);
        downloadPDF();
    }
}

// Generate CV preview from saved data
function generateCVPreviewFromData(cvData) {
    // Set global variables
    selectedCVTemplate = cvData.template;
    selectedPortfolioDesign = cvData.portfolioDesign || 'modern';
    uploadedPhoto = cvData.photo;
    
    // Generate preview
    generateCVPreview();
}

// Generate invoice preview from saved data
function generateInvoicePreviewFromData(invoiceData) {
    // Set global variables
    selectedCurrency = invoiceData.currency;
    uploadedLogo = invoiceData.logo;
    signatureData = invoiceData.signature;
    
    // Generate preview
    generateInvoicePreview();
}

// Get template name
function getTemplateName(template) {
    const names = {
        'professional': 'პროფესიონალური',
        'portfolio': 'პორტფოლიო',
        'executive': 'ექსეკუტიური',
        'creative': 'კრეატიული'
    };
    return names[template] || template;
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Mobile Signature Modal Functions
function openSignatureModal() {
    const modal = document.getElementById('signatureModal');
    modal.style.display = 'block';
    
    // Initialize modal canvas
    signatureCanvasModal = document.getElementById('signatureCanvasModal');
    signatureCtxModal = signatureCanvasModal.getContext('2d');
    
    // Set up modal canvas
    signatureCtxModal.strokeStyle = '#2d3748';
    signatureCtxModal.lineWidth = 2;
    signatureCtxModal.lineCap = 'round';
    signatureCtxModal.lineJoin = 'round';
    
    // Setup modal canvas events
    setupSignatureModalEvents();
}

function closeSignatureModal() {
    const modal = document.getElementById('signatureModal');
    modal.style.display = 'none';
}

function setupSignatureModalEvents() {
    // Mouse events
    signatureCanvasModal.addEventListener('mousedown', startDrawingModal);
    signatureCanvasModal.addEventListener('mousemove', drawModal);
    signatureCanvasModal.addEventListener('mouseup', stopDrawingModal);
    signatureCanvasModal.addEventListener('mouseout', stopDrawingModal);
    
    // Touch events
    signatureCanvasModal.addEventListener('touchstart', handleTouchModal);
    signatureCanvasModal.addEventListener('touchmove', handleTouchModal);
    signatureCanvasModal.addEventListener('touchend', stopDrawingModal);
}

function startDrawingModal(e) {
    isDrawingModal = true;
    const rect = signatureCanvasModal.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtxModal.beginPath();
    signatureCtxModal.moveTo(x, y);
}

function drawModal(e) {
    if (!isDrawingModal) return;
    
    const rect = signatureCanvasModal.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    signatureCtxModal.lineTo(x, y);
    signatureCtxModal.stroke();
}

function stopDrawingModal() {
    if (isDrawingModal) {
        isDrawingModal = false;
        signatureCtxModal.beginPath();
    }
}

function handleTouchModal(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                    e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    signatureCanvasModal.dispatchEvent(mouseEvent);
}

function clearSignatureModal() {
    signatureCtxModal.clearRect(0, 0, signatureCanvasModal.width, signatureCanvasModal.height);
}

function saveSignatureModal() {
    // Save signature data
    signatureData = signatureCanvasModal.toDataURL();
    
    // Update main canvas if it exists
    if (signatureCanvas && signatureCtx) {
        const img = new Image();
        img.onload = function() {
            signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            signatureCtx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
        };
        img.src = signatureData;
    }
    
    // Close modal
    closeSignatureModal();
    
    // Show notification
    showNotification('ხელმოწერა შენახულია!', 'success');
}

// Update signature toggle to open modal on mobile
function toggleSignature() {
    const enableSignature = document.getElementById('enableSignature');
    const signatureSection = document.querySelector('.signature-section');
    
    if (enableSignature.checked) {
        // Check if mobile
        if (window.innerWidth <= 768) {
            openSignatureModal();
        } else {
            signatureSection.style.display = 'block';
            // Set default date
            const signatureDate = document.getElementById('signatureDate');
            if (signatureDate && !signatureDate.value) {
                signatureDate.value = new Date().toISOString().split('T')[0];
            }
        }
    } else {
        signatureSection.style.display = 'none';
        // Clear signature if disabled
        if (signatureCanvas && signatureCtx) {
            signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
            signatureData = null;
        }
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('previewModal');
    if (event.target === modal) {
        closePreview();
    }
}

// Add smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation for form submissions
function showLoading(button) {
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> მუშაობა...';
    button.disabled = true;
    
    setTimeout(() => {
        button.innerHTML = originalText;
        button.disabled = false;
    }, 2000);
}

// Add form validation feedback
function addValidationFeedback(input, isValid, message) {
    // Remove existing feedback
    const existingFeedback = input.parentNode.querySelector('.validation-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // Add new feedback
    if (!isValid) {
        const feedback = document.createElement('div');
        feedback.className = 'validation-feedback';
        feedback.style.color = '#e53e3e';
        feedback.style.fontSize = '0.875rem';
        feedback.style.marginTop = '0.25rem';
        feedback.textContent = message;
        input.parentNode.appendChild(feedback);
        input.style.borderColor = '#e53e3e';
    } else {
        input.style.borderColor = '#e2e8f0';
    }
}

// Real-time form validation
document.addEventListener('input', function(e) {
    if (e.target.matches('input[required], textarea[required]')) {
        const isValid = e.target.value.trim().length > 0;
        addValidationFeedback(e.target, isValid, 'ეს ველი სავალდებულოა');
    }
    
    if (e.target.matches('input[type="email"]')) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(e.target.value);
        addValidationFeedback(e.target, isValid, 'გთხოვთ შეიყვანოთ სწორი ელ.ფოსტის მისამართი');
    }
    
    if (e.target.matches('input[type="tel"]')) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{9,}$/;
        const isValid = phoneRegex.test(e.target.value);
        addValidationFeedback(e.target, isValid, 'გთხოვთ შეიყვანოთ სწორი ტელეფონის ნომერი');
    }
});
