$(document).ready(function() {
    // Mobile Navigation Functionality
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const closeMobileNav = document.getElementById('closeMobileNav');
    
    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener('click', function() {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        });
        
        if (closeMobileNav) {
            closeMobileNav.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            });
        }
        
        // Close mobile nav when clicking on links
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            });
        });
        
        // Close mobile nav when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        });
        
        // Close mobile nav with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        });
    }

    // Modal Functions
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            if (!document.querySelector('.modal[style*="display: flex"]')) {
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        }
    }

    // Logout Modal Handling
    const logoutModal = document.getElementById('logout-modal');
    const logoutTrigger = document.getElementById('logout-trigger');
    const mobileLogoutTrigger = document.getElementById('mobile-logout-trigger');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    const closeLogoutModal = document.getElementById('close-logout-modal');

    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('logout-modal');
        });
    }

    if (mobileLogoutTrigger) {
        mobileLogoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (mobileNav) {
                mobileNav.classList.remove('active');
            }
            setTimeout(() => {
                openModal('logout-modal');
            }, 10);
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const logoutUrl = document.body.getAttribute('data-logout-url');
            if (logoutUrl) {
                window.location.href = logoutUrl;
            } else {
                window.location.href = "/logout";
            }
        });
    }

    // Initialize Requirements Page Functionality
    initializeRequirementsPage();
});

// Requirements Page Specific Functionality
function initializeRequirementsPage() {
    console.log('Initializing Requirements Page...');

    const form = document.getElementById("requirementsForm");
    const submitBtn = document.getElementById("submitBtn");
    const maritalStatusSelect = document.getElementById("maritalStatus");
    const marriageCertificateField = document.getElementById("marriageCertificateField");
    const marriageCertificateInput = document.getElementById("marriageCertificateInput");

    // Get user gender from data attribute or variable
    const userGender = document.body.getAttribute('data-user-gender') || '';

    // Check if elements exist
    if (!form) {
        console.error('Form not found');
        return;
    }

    // Auto-hide flash messages after 5 seconds (if any exist)
    document.querySelectorAll('.alert-message').forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 500);
        }, 5000);
    });

    // Marital Status Change Handler - Only show marriage certificate for females
    if (maritalStatusSelect) {
        // Set initial state based on existing value and user gender
        const initialMaritalStatus = maritalStatusSelect.value;
        const isFemale = userGender === 'female';
        
        if (initialMaritalStatus === 'married' && isFemale) {
            if (marriageCertificateField) {
                marriageCertificateField.style.display = 'block';
            }
            if (marriageCertificateInput) {
                marriageCertificateInput.required = true;
            }
        } else {
            if (marriageCertificateField) {
                marriageCertificateField.style.display = 'none';
            }
            if (marriageCertificateInput) {
                marriageCertificateInput.required = false;
            }
        }

        maritalStatusSelect.addEventListener('change', function() {
            const isMarried = this.value === 'married';
            const isFemale = userGender === 'female';
            
            if (isMarried && isFemale) {
                if (marriageCertificateField) {
                    marriageCertificateField.style.display = 'block';
                }
                if (marriageCertificateInput) {
                    marriageCertificateInput.required = true;
                }
            } else {
                if (marriageCertificateField) {
                    marriageCertificateField.style.display = 'none';
                }
                if (marriageCertificateInput) {
                    marriageCertificateInput.required = false;
                    marriageCertificateInput.value = '';
                    
                    // Reset the file input overlay
                    const overlay = marriageCertificateInput.nextElementSibling;
                    if (overlay) {
                        overlay.querySelector('span').textContent = 'Choose marriage certificate';
                        overlay.classList.remove('has-file');
                    }
                    
                    // Reset upload status for marriage certificate
                    resetUploadStatus(marriageCertificateInput);
                }
            }
            
            validateForm();
        });
    }

    // File input styling and validation
    document.querySelectorAll('.file-input').forEach(input => {
        // Set initial state for file inputs that might have existing values
        if (input.files.length > 0) {
            const overlay = input.nextElementSibling;
            if (overlay) {
                overlay.querySelector('span').textContent = input.files[0].name;
                overlay.classList.add('has-file');
                updateUploadStatus(input);
            }
        }

        input.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'Choose file';
            const overlay = this.nextElementSibling;
            
            if (overlay) {
                overlay.querySelector('span').textContent = fileName;
                
                if (this.files[0]) {
                    overlay.classList.add('has-file');
                    
                    // Validate file type
                    const file = this.files[0];
                    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
                    const fileExtension = file.name.split('.').pop().toLowerCase();
                    
                    if (!allowedTypes.includes(fileExtension)) {
                        alert('Invalid file type. Please upload PDF, JPG, PNG, DOC, or DOCX files only.');
                        this.value = '';
                        overlay.querySelector('span').textContent = this.name === 'marriage_certificate' ? 'Choose marriage certificate' : 'Choose file';
                        overlay.classList.remove('has-file');
                        resetUploadStatus(this);
                        validateForm();
                        return;
                    }
                    
                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        alert('File size too large. Please upload files smaller than 10MB.');
                        this.value = '';
                        overlay.querySelector('span').textContent = this.name === 'marriage_certificate' ? 'Choose marriage certificate' : 'Choose file';
                        overlay.classList.remove('has-file');
                        resetUploadStatus(this);
                        validateForm();
                        return;
                    }
                    
                    // Update the upload status to show selected file
                    updateUploadStatus(this);
                } else {
                    overlay.classList.remove('has-file');
                    // Reset to "Not uploaded yet"
                    resetUploadStatus(this);
                }
                
                validateForm();
            }
        });
    });

    // Function to update upload status when file is selected
    function updateUploadStatus(fileInput) {
        const fileName = fileInput.files[0] ? fileInput.files[0].name : null;
        const fieldName = fileInput.name;
        
        // Get elements using IDs
        const statusBox = document.getElementById(`status-box-${fieldName}`);
        const statusIcon = document.getElementById(`status-icon-${fieldName}`);
        const statusText = document.getElementById(`status-text-${fieldName}`);
        const previewBtn = document.getElementById(`preview-btn-${fieldName}`);
        
        if (!statusBox || !previewBtn) {
            console.log('Elements not found for field:', fieldName);
            return;
        }
        
        if (fileName) {
            // Update status box to success style
            statusBox.className = 'status-success';
            
            // Update icon
            if (statusIcon) {
                statusIcon.className = 'fas fa-check-circle';
            }
            
            // Update text
            if (statusText) {
                statusText.innerHTML = `Selected: <span class="file-link">${fileName}</span>`;
            }
            
            // Update preview button
            previewBtn.classList.remove('preview-btn-disabled');
            previewBtn.disabled = false;
            previewBtn.setAttribute('data-filename', fileName);
            previewBtn.setAttribute('data-uploaded', 'true');
            
            // Get label text from the field label
            const formField = fileInput.closest('.form-field');
            if (formField) {
                const fieldLabel = formField.querySelector('.field-label');
                if (fieldLabel) {
                    const labelClone = fieldLabel.cloneNode(true);
                    const icon = labelClone.querySelector('i');
                    const requiredStar = labelClone.querySelector('.required-star');
                    if (icon) icon.remove();
                    if (requiredStar) requiredStar.remove();
                    const labelText = labelClone.textContent.trim();
                    previewBtn.setAttribute('data-label', labelText);
                }
            }
            
            console.log(`Updated ${fieldName} preview button:`, {
                disabled: previewBtn.disabled,
                dataUploaded: previewBtn.getAttribute('data-uploaded'),
                className: previewBtn.className
            });
        }
    }
    
    // Function to reset upload status when no file is selected
    function resetUploadStatus(fileInput) {
        const fieldName = fileInput.name;
        
        // Get elements using IDs
        const statusBox = document.getElementById(`status-box-${fieldName}`);
        const statusIcon = document.getElementById(`status-icon-${fieldName}`);
        const statusText = document.getElementById(`status-text-${fieldName}`);
        const previewBtn = document.getElementById(`preview-btn-${fieldName}`);
        
        if (!statusBox || !previewBtn) return;
        
        // Reset to pending style
        statusBox.className = 'status-pending';
        
        // Reset icon
        if (statusIcon) {
            statusIcon.className = 'fas fa-clock';
        }
        
        // Reset text - check if this is a server-uploaded file or not
        if (statusText) {
            // Check if we have an existing server-uploaded file
            const existingUpload = statusText.innerHTML.includes('Uploaded:');
            if (existingUpload) {
                // Keep the server-uploaded file display
                // Do nothing - the server data is already in the HTML
            } else {
                // Reset to default text
                if (fieldName === 'marriage_certificate') {
                    statusText.textContent = 'Required for married female applicants';
                } else {
                    statusText.textContent = 'Not uploaded yet';
                }
            }
        }
        
        // Reset preview button if no server file exists
        const hasServerFile = previewBtn.getAttribute('data-filename') && 
                             previewBtn.getAttribute('data-filename').includes('static/');
        
        if (!hasServerFile) {
            previewBtn.classList.add('preview-btn-disabled');
            previewBtn.disabled = true;
            previewBtn.setAttribute('data-uploaded', 'false');
            previewBtn.setAttribute('data-filename', '');
        }
    }

    // Form validation function
    function validateForm() {
        if (!form || !submitBtn) return false;
        
        let isValid = true;
        const requiredInputs = form.querySelectorAll('input[required]');
        const maritalStatus = maritalStatusSelect ? maritalStatusSelect.value : '';
        const isFemale = userGender === 'female';
        
        // Check marital status
        if (!maritalStatus) {
            isValid = false;
        }
        
        // Check required file inputs
        requiredInputs.forEach(input => {
            if (!input.files || input.files.length === 0) {
                isValid = false;
            }
        });
        
        // Special validation for marriage certificate - only if female and married
        if (isFemale && maritalStatus === 'married' && marriageCertificateInput) {
            if (!marriageCertificateInput.files || marriageCertificateInput.files.length === 0) {
                isValid = false;
            }
        }
        
        submitBtn.disabled = !isValid;
        return isValid;
    }

    // Initial form validation
    validateForm();

    // Form submission with validation
    form.addEventListener("submit", function(e) {
        if (!validateForm()) {
            e.preventDefault();
            
            // Get specific validation errors
            const errors = [];
            const maritalStatus = maritalStatusSelect ? maritalStatusSelect.value : '';
            const isFemale = userGender === 'female';
            const requiredInputs = form.querySelectorAll('input[required]');
            
            if (!maritalStatus) {
                errors.push("Marital status");
            }
            
            requiredInputs.forEach(input => {
                if (!input.files || input.files.length === 0) {
                    const fieldName = input.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                    errors.push(fieldName);
                }
            });
            
            // Special check for marriage certificate - only if female and married
            if (isFemale && maritalStatus === 'married' && marriageCertificateInput && 
                (!marriageCertificateInput.files || marriageCertificateInput.files.length === 0)) {
                errors.push("Marriage Certificate");
            }
            
            if (errors.length > 0) {
                alert(`Please complete the following required fields:\n\n• ${errors.join('\n• ')}`);
            }
            
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        // Additional validation for required fields
        const missingFields = [];
        const requiredInputs = form.querySelectorAll('input[required]');
        const maritalStatus = maritalStatusSelect ? maritalStatusSelect.value : '';
        const isFemale = userGender === 'female';
        
        if (!maritalStatus) {
            missingFields.push("Marital Status");
        }
        
        requiredInputs.forEach(input => {
            if (!input.files || input.files.length === 0) {
                const fieldName = input.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                missingFields.push(fieldName);
            }
        });

        // Special check for marriage certificate - only if female and married
        if (isFemale && maritalStatus === 'married' && marriageCertificateInput && 
            (!marriageCertificateInput.files || marriageCertificateInput.files.length === 0)) {
            missingFields.push("Marriage Certificate");
        }

        if (missingFields.length > 0) {
            e.preventDefault();
            alert(`Please complete the following required fields:\n\n• ${missingFields.join('\n• ')}`);
            
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    console.log('Requirements Page initialized successfully');
    console.log('User gender:', userGender);
}

// Store object URLs for cleanup
const objectURLs = new Map();

// Event delegation for preview buttons (works for dynamically added buttons)
document.addEventListener('click', function(e) {
    // Handle preview button clicks
    if (e.target.closest('.preview-btn')) {
        const previewBtn = e.target.closest('.preview-btn');
        
        // Don't handle disabled buttons
        if (previewBtn.disabled || previewBtn.classList.contains('preview-btn-disabled')) {
            console.log('Preview button disabled, ignoring click');
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        const filename = previewBtn.getAttribute('data-filename');
        const label = previewBtn.getAttribute('data-label');
        const fieldName = previewBtn.getAttribute('data-field');
        const isUploaded = previewBtn.getAttribute('data-uploaded') === 'true';
        
        console.log('Preview clicked:', {
            filename: filename,
            label: label,
            isUploaded: isUploaded,
            fieldName: fieldName
        });
        
        if (!isUploaded || !filename) {
            alert('No file available for preview.');
            return;
        }
        
        const previewModal = document.getElementById('previewModal');
        const previewContainer = document.querySelector('.preview-container');
        
        if (!previewModal || !previewContainer) {
            console.error('Preview modal elements not found');
            return;
        }
        
        // Set modal title
        const modalTitle = previewModal.querySelector('.modal-header h3');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-eye"></i> ${label}`;
        }
        
        // Determine file type and create appropriate preview
        let previewHtml = '';
        const fileExt = filename.split('.').pop().toLowerCase();
        
        // Check if this is a newly selected file (not yet uploaded to server)
        const fileInput = document.querySelector(`input[name="${fieldName}"]`);
        let fileUrl = '';
        
        if (fileInput && fileInput.files && fileInput.files[0]) {
            // This is a local file (not yet uploaded to server)
            const file = fileInput.files[0];
            
            // Create object URL for local file preview
            const objectURL = URL.createObjectURL(file);
            objectURLs.set(fieldName, objectURL);
            fileUrl = objectURL;
            
            console.log('Using local file preview with object URL:', fileUrl);
        } else if (filename.includes('/static/')) {
            // This is an already uploaded file with full path
            fileUrl = filename;
            console.log('Using server file with full path');
        } else {
            // This is an already uploaded file (has server path)
            fileUrl = "/static/uploads/requirements/" + filename;
            console.log('Using server file with relative path');
        }
        
        // Create preview based on file type
        if (fileExt === 'pdf') {
            previewHtml = `<iframe src="${fileUrl}#toolbar=0" class="preview-iframe" frameborder="0"></iframe>`;
        } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
            previewHtml = `<img src="${fileUrl}" alt="Preview" class="preview-image">`;
        } else if (['doc', 'docx'].includes(fileExt)) {
            // For DOC/DOCX files, show download option since they can't be previewed
            previewHtml = `
                <div class="file-placeholder">
                    <i class="fas fa-file-word"></i>
                    <h4>Document Preview Not Available</h4>
                    <p>Word documents (.doc/.docx) cannot be previewed in the browser.</p>
                    <p>Please download the file to view it.</p>
                    <a href="${fileUrl}" download class="download-btn">
                        <i class="fas fa-download"></i> Download File
                    </a>
                </div>
            `;
        } else {
            previewHtml = `
                <div class="file-placeholder">
                    <i class="fas fa-file"></i>
                    <h4>Preview Not Available</h4>
                    <p>This file type cannot be previewed in the browser.</p>
                    <a href="${fileUrl}" download class="download-btn">
                        <i class="fas fa-download"></i> Download File
                    </a>
                </div>
            `;
        }
        
        previewContainer.innerHTML = previewHtml;
        
        // Open the modal
        previewModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
        
        // Clean up object URLs when modal closes
        const cleanUpObjectURLs = function() {
            objectURLs.forEach((url, key) => {
                URL.revokeObjectURL(url);
                objectURLs.delete(key);
            });
        };
        
        // Attach cleanup to modal close button
        const modalCloseBtn = previewModal.querySelector('.modal-close');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', function(e) {
                e.preventDefault();
                cleanUpObjectURLs();
                previewModal.style.display = 'none';
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            });
        }
    }
    
    // Close preview modal when clicking outside
    const previewModal = document.getElementById('previewModal');
    if (previewModal && e.target === previewModal) {
        // Clean up object URLs
        objectURLs.forEach((url, key) => {
            URL.revokeObjectURL(url);
            objectURLs.delete(key);
        });
        
        previewModal.style.display = 'none';
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
});

// Close preview modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const previewModal = document.getElementById('previewModal');
        if (previewModal && previewModal.style.display === 'flex') {
            // Clean up object URLs
            objectURLs.forEach((url, key) => {
                URL.revokeObjectURL(url);
                objectURLs.delete(key);
            });
            
            previewModal.style.display = 'none';
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        
        // Also handle logout modal
        const logoutModal = document.getElementById('logout-modal');
        if (logoutModal && logoutModal.style.display === 'flex') {
            logoutModal.style.display = 'none';
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    }
});

// Clean up object URLs when page is about to unload (form submission)
window.addEventListener('beforeunload', function() {
    objectURLs.forEach((url, key) => {
        URL.revokeObjectURL(url);
    });
    objectURLs.clear();
});

// Global modal functions for consistency
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        if (!document.querySelector('.modal[style*="display: flex"]')) {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    }
}