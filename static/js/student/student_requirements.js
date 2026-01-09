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

// NEW: Function to close rejection alert
function closeRejectionAlert() {
    const alert = document.getElementById('rejectionAlert');
    if (alert) {
        alert.style.opacity = '0';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 300);
    }
}

// Requirements Page Specific Functionality
function initializeRequirementsPage() {
    console.log('Initializing Requirements Page...');

    const form = document.getElementById("requirementsForm");
    const submitBtn = document.getElementById("submitBtn");
    const maritalStatusSelect = document.getElementById("maritalStatus");
    const marriageCertificateField = document.getElementById("marriageCertificateField");
    const marriageCertificateInput = document.getElementById("marriageCertificateInput");
    const submitUrl = document.body.getAttribute('data-submit-url');

    // Get user gender and verification status from data attributes
    const userGender = document.body.getAttribute('data-user-gender') || '';
    const verifiedStatus = document.body.getAttribute('data-verified-status') || '';

    // Check if elements exist
    if (!form || !submitUrl) {
        console.error('Form or submit URL not found');
        return;
    }

    // ===== CHECK IF STUDENT IS ALREADY VERIFIED =====
    if (verifiedStatus === 'verified') {
        console.log('Student already verified. Disabling form...');
        
        // Add disabled class to form
        form.classList.add('form-disabled');
        
        // Disable all form inputs
        const allInputs = form.querySelectorAll('input, select, textarea, button');
        allInputs.forEach(element => {
            element.disabled = true;
            element.style.cursor = 'not-allowed';
            
            // For file inputs, also disable the overlay
            if (element.classList.contains('file-input')) {
                const overlay = element.nextElementSibling;
                if (overlay && overlay.classList.contains('file-input-overlay')) {
                    overlay.style.cursor = 'not-allowed';
                    overlay.style.opacity = '0.6';
                    overlay.style.backgroundColor = '#f8f9fa';
                    overlay.style.borderColor = '#dee2e6';
                }
            }
        });
        
        // Hide submit button
        if (submitBtn) {
            submitBtn.style.display = 'none';
        }
        
        // Update marital status field styling
        const maritalStatusField = document.querySelector('.marital-status-field');
        if (maritalStatusField) {
            maritalStatusField.style.opacity = '0.6';
            maritalStatusField.style.cursor = 'not-allowed';
        }
        
        // Show verified message if not already shown
        const formActions = document.querySelector('.form-actions');
        if (formActions && !formActions.querySelector('.verified-message')) {
            // Check if message already exists from server-side template
            const existingMessage = formActions.innerHTML.includes('verified-message');
            if (!existingMessage) {
                formActions.innerHTML = `
                    <div class="verified-message">
                        <i class="fas fa-check-circle"></i>
                        <span>Your requirements have been verified and approved. No further submissions are needed.</span>
                    </div>
                `;
            }
        }
        
        // Disable preview buttons
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.disabled = true;
            btn.classList.add('preview-btn-disabled');
            btn.style.cursor = 'not-allowed';
        });
        
        console.log('Form disabled for verified student.');
        return; // STOP HERE - don't initialize form functionality for verified students
    }
    // ===== END OF VERIFICATION CHECK =====

    // Add special styling for resubmission if rejected
    if (verifiedStatus === 'rejected' && submitBtn) {
        submitBtn.classList.add('resubmit');
    }

    // Auto-hide any existing alert messages after 5 seconds
    document.querySelectorAll('.alert-message:not(#rejectionAlert)').forEach(alert => {
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

    // File input styling and validation - ADD VERIFICATION CHECK
    document.querySelectorAll('.file-input').forEach(input => {
        // Set initial state for file inputs that might have existing values
        // Don't pre-fill if status is rejected
        if (input.files.length > 0 && verifiedStatus !== 'rejected') {
            const overlay = input.nextElementSibling;
            if (overlay) {
                overlay.querySelector('span').textContent = input.files[0].name;
                overlay.classList.add('has-file');
                updateUploadStatus(input);
            }
        }

        input.addEventListener('change', function() {
            // Check if student is verified (extra safety check)
            const currentVerifiedStatus = document.body.getAttribute('data-verified-status') || '';
            if (currentVerifiedStatus === 'verified') {
                showSweetAlert('info', 'Already Verified', 
                    'Your requirements have been verified. You cannot upload new files.');
                this.value = '';
                return;
            }
            
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
                        showSweetAlert('error', 'Invalid File Type', 
                            'Please upload PDF, JPG, PNG, DOC, or DOCX files only.');
                        this.value = '';
                        overlay.querySelector('span').textContent = this.name === 'marriage_certificate' ? 'Choose marriage certificate' : 'Choose file';
                        overlay.classList.remove('has-file');
                        resetUploadStatus(this);
                        validateForm();
                        return;
                    }
                    
                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        const fieldName = this.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                        showSweetAlert('error', 'File Too Large', 
                            `${fieldName} is too large (${(file.size/1024/1024).toFixed(1)}MB). Maximum file size is 10MB.`);
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
                    // Reset to default message
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
            statusBox.className = verifiedStatus === 'rejected' ? 'status-pending' : 'status-success';
            
            // Update icon
            if (statusIcon) {
                statusIcon.className = verifiedStatus === 'rejected' ? 'fas fa-clock' : 'fas fa-check-circle';
            }
            
            // Update text
            if (statusText) {
                statusText.innerHTML = verifiedStatus === 'rejected' 
                    ? `Selected: <span class="file-link">${truncateFileName(fileName, 30)}</span>` 
                    : `Selected: <span class="file-link">${truncateFileName(fileName, 30)}</span>`;
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
        }
    }
    
    // Function to reset upload status when no file is selected
    function resetUploadStatus(fileInput) {
        const fieldName = fileInput.name;
        const verifiedStatus = document.body.getAttribute('data-verified-status') || '';
        
        // Get elements using IDs
        const statusBox = document.getElementById(`status-box-${fieldName}`);
        const statusIcon = document.getElementById(`status-icon-${fieldName}`);
        const statusText = document.getElementById(`status-text-${fieldName}`);
        const previewBtn = document.getElementById(`preview-btn-${fieldName}`);
        
        if (!statusBox || !previewBtn) return;
        
        // Reset to appropriate style based on verification status
        if (verifiedStatus === 'rejected') {
            statusBox.className = 'status-pending';
            if (statusIcon) statusIcon.className = 'fas fa-clock';
            if (statusText) statusText.textContent = 'Previous file rejected - please upload new file';
        } else {
            statusBox.className = 'status-pending';
            if (statusIcon) statusIcon.className = 'fas fa-clock';
            
            // Check if we have an existing server-uploaded file
            const existingUpload = statusText && statusText.innerHTML.includes('Uploaded:');
            if (existingUpload) {
                // Keep the server-uploaded file display
                // Do nothing - the server data is already in the HTML
            } else {
                // Reset to default text
                if (statusText) {
                    if (fieldName === 'marriage_certificate') {
                        statusText.textContent = 'Required for married female applicants';
                    } else {
                        statusText.textContent = 'Not uploaded yet';
                    }
                }
            }
        }
        
        // Reset preview button if no server file exists or if rejected
        const hasServerFile = previewBtn.getAttribute('data-filename') && 
                             previewBtn.getAttribute('data-filename').includes('static/');
        
        if (!hasServerFile || verifiedStatus === 'rejected') {
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

    // AJAX Form Submission with SweetAlert2
    form.addEventListener("submit", async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
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
                showSweetAlert('warning', 'Missing Information', 
                    `Please complete the following required fields:\n\n• ${errors.join('\n• ')}`);
            }
            
            return;
        }

        // Show loading state
        const originalText = submitBtn.innerHTML;
        const isResubmitting = verifiedStatus === 'rejected';
        submitBtn.disabled = true;
        submitBtn.innerHTML = isResubmitting 
            ? '<i class="fas fa-spinner fa-spin"></i> Resubmitting...' 
            : '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            // Prepare FormData
            const formData = new FormData(form);
            
            // Add CSRF token if available
            const csrfToken = document.querySelector('input[name="csrf_token"]');
            if (csrfToken) {
                formData.append('csrf_token', csrfToken.value);
            }

            // Send AJAX request
            const response = await fetch(submitUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok && result.status === 'success') {
                // Show success SweetAlert
                showSweetAlert('success', 'Success!', result.message).then(() => {
                    // Reload the page to show updated status and files
                    window.location.reload();
                });
            } else {
                // Show error SweetAlert
                showSweetAlert('error', 'Submission Failed', result.message || 'An error occurred. Please try again.');
                
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }

        } catch (error) {
            console.error('Submission error:', error);
            
            // Show error SweetAlert
            showSweetAlert('error', 'Network Error', 
                'Unable to connect to the server. Please check your internet connection and try again.');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    console.log('Requirements Page initialized successfully');
    console.log('User gender:', userGender);
    console.log('Verification status:', verifiedStatus);
    console.log('Submit URL:', submitUrl);
}

// NEW: SweetAlert2 Helper Function
function showSweetAlert(icon, title, text, confirmButtonText = 'OK') {
    return Swal.fire({
        icon: icon,
        title: title,
        text: text,
        confirmButtonText: confirmButtonText,
        confirmButtonColor: icon === 'success' ? '#003366' : 
                           icon === 'error' ? '#dc3545' : 
                           icon === 'warning' ? '#ffc107' : '#003366',
        timer: icon === 'success' ? 3000 : undefined,
        timerProgressBar: icon === 'success',
        showClass: {
            popup: 'animate__animated animate__fadeInDown'
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp'
        }
    });
}

// NEW: Helper function to truncate file names
function truncateFileName(fileName, maxLength) {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExtension.substring(0, maxLength - extension.length - 4); // -4 for "... ."
    
    return truncatedName + '... .' + extension;
}

// Store object URLs for cleanup
const objectURLs = new Map();

// Event delegation for preview buttons
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
        const verifiedStatus = document.body.getAttribute('data-verified-status') || '';
        
        if (!isUploaded || !filename) {
            showSweetAlert('info', 'No File', 'No file available for preview.');
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
        } else if (filename.includes('/static/')) {
            // This is an already uploaded file with full path
            fileUrl = filename;
        } else {
            // This is an already uploaded file (has server path)
            fileUrl = "/static/uploads/requirements/" + filename;
        }
        
        // Create preview based on file type
        if (fileExt === 'pdf') {
            previewHtml = `<iframe src="${fileUrl}#toolbar=0" class="preview-iframe" frameborder="0"></iframe>`;
        } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
            previewHtml = `<img src="${fileUrl}" alt="Preview" class="preview-image">`;
        } else if (['doc', 'docx'].includes(fileExt)) {
            // For DOC/DOCX files, show download option
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

// Clean up object URLs when page is about to unload
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