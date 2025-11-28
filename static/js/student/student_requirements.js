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

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        if (event.target === previewModal) {
            closeModal('previewModal');
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (logoutModal && logoutModal.style.display === 'flex') {
                closeModal('logout-modal');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
            if (previewModal && previewModal.style.display === 'flex') {
                closeModal('previewModal');
            }
            if (mobileNav && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        }
    });

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
    const previewModal = document.getElementById('previewModal');
    const previewButtons = document.querySelectorAll('.preview-btn');
    const previewContainer = document.querySelector('.preview-container');
    const modalClose = document.querySelector('.modal-close');

    // Check if elements exist
    if (!form) {
        console.error('Form not found');
        return;
    }

    // Alert close buttons
    document.querySelectorAll('.alert-close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.alert-message').style.display = 'none';
        });
    });

    // Auto-hide flash messages after 5 seconds
    document.querySelectorAll('.alert-message').forEach(alert => {
        setTimeout(() => {
            alert.style.opacity = '0';
            setTimeout(() => {
                alert.style.display = 'none';
            }, 500);
        }, 5000);
    });

    // Marital Status Change Handler
    if (maritalStatusSelect) {
        // Set initial state based on existing value
        const initialMaritalStatus = maritalStatusSelect.value;
        if (initialMaritalStatus === 'married') {
            marriageCertificateField.style.display = 'block';
            marriageCertificateInput.required = true;
        }

        maritalStatusSelect.addEventListener('change', function() {
            const isMarried = this.value === 'married';
            
            if (isMarried) {
                marriageCertificateField.style.display = 'block';
                marriageCertificateInput.required = true;
            } else {
                marriageCertificateField.style.display = 'none';
                marriageCertificateInput.required = false;
                marriageCertificateInput.value = '';
                
                // Reset the file input overlay
                const overlay = marriageCertificateInput.nextElementSibling;
                if (overlay) {
                    overlay.querySelector('span').textContent = 'Choose marriage certificate';
                    overlay.classList.remove('has-file');
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
                        validateForm();
                        return;
                    }
                    
                    // Validate file size (max 10MB)
                    if (file.size > 10 * 1024 * 1024) {
                        alert('File size too large. Please upload files smaller than 10MB.');
                        this.value = '';
                        overlay.querySelector('span').textContent = this.name === 'marriage_certificate' ? 'Choose marriage certificate' : 'Choose file';
                        overlay.classList.remove('has-file');
                        validateForm();
                        return;
                    }
                } else {
                    overlay.classList.remove('has-file');
                }
                
                validateForm();
            }
        });
    });

    // Form validation function
    function validateForm() {
        if (!form || !submitBtn) return false;
        
        let isValid = true;
        const requiredInputs = form.querySelectorAll('input[required]');
        const maritalStatus = maritalStatusSelect ? maritalStatusSelect.value : '';
        
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
        
        // Special validation for marriage certificate
        if (maritalStatus === 'married') {
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
            
            // Special check for marriage certificate
            if (maritalStatus === 'married' && (!marriageCertificateInput.files || marriageCertificateInput.files.length === 0)) {
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
        
        if (!maritalStatus) {
            missingFields.push("Marital Status");
        }
        
        requiredInputs.forEach(input => {
            if (!input.files || input.files.length === 0) {
                const fieldName = input.name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
                missingFields.push(fieldName);
            }
        });

        // Special check for marriage certificate
        if (maritalStatus === 'married' && (!marriageCertificateInput.files || marriageCertificateInput.files.length === 0)) {
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

    // Preview modal functionality
    if (previewButtons.length > 0 && previewModal && previewContainer) {
        previewButtons.forEach(button => {
            button.addEventListener('click', function() {
                const filename = this.getAttribute('data-filename');
                const label = this.getAttribute('data-label');
                const fileUrl = "/static/uploads/requirements/" + filename;
                
                console.log('Preview clicked:', filename, label);
                
                // Set modal title
                const modalTitle = document.querySelector('#previewModal .modal-header h3');
                if (modalTitle) {
                    modalTitle.innerHTML = `<i class="fas fa-eye"></i> ${label}`;
                }
                
                // Determine file type and create appropriate preview
                let previewHtml = '';
                const fileExt = filename.split('.').pop().toLowerCase();
                
                if (fileExt === 'pdf') {
                    previewHtml = `<iframe src="${fileUrl}#toolbar=0" class="preview-iframe" frameborder="0"></iframe>`;
                } else if (['jpg', 'jpeg', 'png'].includes(fileExt)) {
                    previewHtml = `<img src="${fileUrl}" alt="Preview" class="preview-image" onerror="this.style.display='none'; document.querySelector('.file-placeholder').style.display='block';">`;
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
                
                // Use the openModal function instead of direct style manipulation
                const modal = document.getElementById('previewModal');
                if (modal) {
                    modal.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                    document.body.classList.add('modal-open');
                }
            });
        });
    }

    // Close preview modal
    if (modalClose) {
        modalClose.addEventListener('click', function() {
            const modal = document.getElementById('previewModal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        });
    }

    console.log('Requirements Page initialized successfully');
}

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