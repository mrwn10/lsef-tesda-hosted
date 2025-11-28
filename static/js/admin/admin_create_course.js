// admin_create_course.js - Complete Updated Version with Consistent Frontend
$(document).ready(function() {
    initMobileNavigation();
    initModals();
    initCourseForm();
    addSweetAlertStyles();
});

// Mobile Navigation Functionality
function initMobileNavigation() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const closeMobileNav = document.getElementById('closeMobileNav');
    
    if (hamburgerMenu && mobileNav) {
        hamburgerMenu.addEventListener('click', function() {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        if (closeMobileNav) {
            closeMobileNav.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        }
        
        // Close mobile nav when clicking on links
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Expandable mobile menu sections
        const mobileNavHeaders = document.querySelectorAll('.mobile-nav-header-link');
        mobileNavHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                const submenu = document.getElementById(`${section}-submenu`);
                const chevron = this.querySelector('.chevron-icon');
                
                // Toggle active class
                this.classList.toggle('active');
                
                // Toggle submenu
                if (submenu) {
                    submenu.classList.toggle('active');
                }
                
                // Rotate only the chevron icon
                if (chevron) {
                    chevron.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        });
        
        // Close mobile nav when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close mobile nav with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

// Initialize all modal functionality
function initModals() {
    // Close modal function - works for ALL modals
    function closeAllModals() {
        $('.modal').fadeOut(300);
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }

    // Open modal function
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        }
    }

    // Close modal when clicking outside - works for ALL modals
    $(document).on('click', function(e) {
        if ($(e.target).hasClass('modal')) {
            closeAllModals();
        }
    });

    // Escape key to close modals - works for ALL modals
    $(document).keyup(function(e) {
        if (e.keyCode === 27) {
            closeAllModals();
        }
    });

    // ===== SPECIFIC MODAL FUNCTIONALITY =====

    // Logout Modal
    $('#logout-trigger').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        openModal('logout-modal');
    });
    
    $('#mobile-logout-trigger').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        // First close mobile nav properly
        const mobileNav = document.getElementById('mobileNav');
        if (mobileNav) {
            mobileNav.classList.remove('active');
        }
        // Then open logout modal
        setTimeout(() => {
            openModal('logout-modal');
        }, 10);
    });
    
    $('#cancel-logout').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllModals();
    });
    
    $('#close-logout-modal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeAllModals();
    });
    
    $('#confirm-logout').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        const logoutUrl = document.body.getAttribute('data-logout-url');
        if (logoutUrl) {
            window.location.href = logoutUrl;
        } else {
            console.error('Logout URL not found');
            window.location.href = "/logout";
        }
    });
}

// Initialize course form functionality
function initCourseForm() {
    // Course Form Submission
    document.getElementById('courseForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const form = e.target;
        const redirectUrl = form.getAttribute('data-redirect-url');
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => data[key] = value);

        // Required fields validation
        if (!data.course_code || !data.course_title || !data.course_description || 
            !data.course_category || !data.target_audience || !data.duration_hours) {
            Swal.fire({
                title: 'Missing Field',
                text: 'Please fill all required fields.',
                icon: 'warning',
                confirmButtonColor: '#003366'
            });
            return;
        }

        // Type conversion
        data.duration_hours = parseInt(data.duration_hours);
        data.course_fee = data.course_fee ? parseFloat(data.course_fee) : 0.00;
        data.max_students = 25; // Hardcoded to 25
        data.published = parseInt(data.published);
        data.created_by = parseInt(data.created_by);

        try {
            // Show loading state
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            submitButton.disabled = true;

            const response = await fetch('/admin/create_course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.status === 'success') {
                Swal.fire({
                    title: 'Success!',
                    text: result.message,
                    icon: 'success',
                    confirmButtonColor: '#003366',
                    customClass: {
                        popup: 'sweetalert-custom-zindex'
                    }
                }).then(() => {
                    window.location.href = redirectUrl;
                });
            } else {
                throw new Error(result.message || 'Course creation failed');
            }

        } catch (error) {
            console.error('Error creating course:', error);
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#003366',
                customClass: {
                    popup: 'sweetalert-custom-zindex'
                }
            });
        } finally {
            // Reset button state
            const submitButton = form.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.innerHTML = 'Create Course <i class="fas fa-plus-circle"></i>';
                submitButton.disabled = false;
            }
        }
    });

    // Form reset functionality
    document.querySelector('button[type="reset"]').addEventListener('click', function() {
        Swal.fire({
            title: 'Clear Form?',
            text: 'This will reset all form fields to their default values.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#003366',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Clear',
            cancelButtonText: 'Cancel',
            customClass: {
                popup: 'sweetalert-custom-zindex',
                actions: 'sweetalert-actions-reverse'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                document.getElementById('courseForm').reset();
                // Show success message
                showToast('Form cleared successfully!', 'success');
            }
        });
    });
}

// Add CSS for SweetAlert2 button order and z-index
function addSweetAlertStyles() {
    if (!document.querySelector('#sweetalert-custom-styles')) {
        const style = document.createElement('style');
        style.id = 'sweetalert-custom-styles';
        style.textContent = `
            .sweetalert-custom-zindex {
                z-index: 10000 !important;
            }
            .swal2-container {
                z-index: 10000 !important;
            }
            .sweetalert-actions-reverse .swal2-actions {
                flex-direction: row-reverse !important;
            }
            .sweetalert-actions-reverse .swal2-actions button:first-child {
                margin-left: 10px !important;
                margin-right: 0 !important;
            }
            .sweetalert-actions-reverse .swal2-actions button:last-child {
                margin-right: 10px !important;
                margin-left: 0 !important;
            }
            
            /* Toast Notification Styles */
            .toast-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                padding: 15px 20px;
                display: flex;
                align-items: center;
                gap: 12px;
                min-width: 300px;
                max-width: 400px;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s ease;
                z-index: 10000;
                border-left: 4px solid #10b981;
            }
            
            .toast-notification.show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .toast-success {
                border-left-color: #10b981;
            }
            
            .toast-error {
                border-left-color: #ef4444;
            }
            
            .toast-warning {
                border-left-color: #f59e0b;
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex: 1;
            }
            
            .toast-content i {
                font-size: 1.2rem;
            }
            
            .toast-success .toast-content i {
                color: #10b981;
            }
            
            .toast-error .toast-content i {
                color: #ef4444;
            }
            
            .toast-warning .toast-content i {
                color: #f59e0b;
            }
            
            .toast-content span {
                color: #334155;
                font-weight: 500;
                font-family: 'Poppins', sans-serif;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: #94a3b8;
                cursor: pointer;
                padding: 5px;
                border-radius: 4px;
                transition: all 0.2s;
            }
            
            .toast-close:hover {
                background: #f1f5f9;
                color: #64748b;
            }
        `;
        document.head.appendChild(style);
    }
}

// Show toast notification
function showToast(message, type = 'success') {
    // Remove existing toast if any
    $('.toast-notification').remove();
    
    const toast = $(`
        <div class="toast-notification toast-${type}">
            <div class="toast-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `);
    
    $('body').append(toast);
    
    // Show toast with animation
    setTimeout(() => {
        toast.addClass('show');
    }, 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        hideToast(toast);
    }, 5000);
    
    // Close on click
    toast.find('.toast-close').click(function() {
        hideToast(toast);
    });
}

// Hide toast notification
function hideToast(toast) {
    toast.removeClass('show');
    setTimeout(() => {
        toast.remove();
    }, 300);
}