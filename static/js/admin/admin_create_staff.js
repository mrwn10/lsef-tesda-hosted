$(document).ready(function() {
    // Initialize all functionality
    init();
});

// Initialize all functionality
function init() {
    initMobileNavigation();
    initModals();
    initFormValidation();
}

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

// Initialize modal functionality - CONSISTENT WITH OTHER PAGES
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

    // Logout Modal - CONSISTENT WITH OTHER PAGES
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

    // Close all modals when clicking close buttons
    $('.close-modal').click(function() {
        closeAllModals();
    });

    // Close flash messages
    $('.flash-close').click(function() {
        $(this).closest('.flash-message').fadeOut(300, function() {
            $(this).remove();
        });
    });
}

// Initialize form validation and functionality
function initFormValidation() {
    const form = document.getElementById('create-staff-form');
    if (!form) return;

    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    // Password requirement elements
    const lengthReq = document.getElementById('lengthReq');
    const upperReq = document.getElementById('upperReq');
    const lowerReq = document.getElementById('lowerReq');
    const numberReq = document.getElementById('numberReq');
    const specialReq = document.getElementById('specialReq');
    const passwordMatch = document.getElementById('passwordMatch');
    
    let usernameTimeout, emailTimeout;

    // Username availability check
    usernameInput.addEventListener('input', function() {
        clearTimeout(usernameTimeout);
        const username = this.value.trim();
        
        if (username.length < 3) {
            updateAvailability('usernameAvailability', 'Username must be at least 3 characters', 'text-muted');
            return;
        }
        
        usernameTimeout = setTimeout(() => {
            checkUsernameAvailability(username);
        }, 500);
    });

    // Email availability check
    emailInput.addEventListener('input', function() {
        clearTimeout(emailTimeout);
        const email = this.value.trim();
        
        if (!email) {
            updateAvailability('emailAvailability', '', 'text-muted');
            return;
        }
        
        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            updateAvailability('emailAvailability', 'Invalid email format', 'text-danger');
            return;
        }
        
        emailTimeout = setTimeout(() => {
            checkEmailAvailability(email);
        }, 500);
    });

    // Password strength validation
    passwordInput.addEventListener('input', function() {
        validatePassword(this.value);
        validatePasswordMatch();
    });

    // Confirm password validation
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);

    // Show/hide password
    $('.toggle-password').click(function() {
        const input = $(this).siblings('input');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });

    // Form submission validation
    form.addEventListener('submit', function(e) {
        if (!validateForm()) {
            e.preventDefault();
        } else {
            // Show loading state
            $(this).addClass('loading');
            $('.save-btn').html('<i class="fas fa-spinner fa-spin"></i> Creating...').prop('disabled', true);
        }
    });

    function checkUsernameAvailability(username) {
        updateAvailability('usernameAvailability', 'Checking...', 'text-muted');
        
        fetch(window.appUrls.checkUsernameUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username: username })
        })
        .then(response => response.json())
        .then(data => {
            if (data.available) {
                updateAvailability('usernameAvailability', data.message, 'text-success');
            } else {
                updateAvailability('usernameAvailability', data.message, 'text-danger');
            }
        })
        .catch(error => {
            console.error('Error checking username:', error);
            updateAvailability('usernameAvailability', 'Error checking availability', 'text-danger');
        });
    }

    function checkEmailAvailability(email) {
        updateAvailability('emailAvailability', 'Checking...', 'text-muted');
        
        fetch(window.appUrls.checkEmailUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.available) {
                updateAvailability('emailAvailability', data.message, 'text-success');
            } else {
                updateAvailability('emailAvailability', data.message, 'text-danger');
            }
        })
        .catch(error => {
            console.error('Error checking email:', error);
            updateAvailability('emailAvailability', 'Error checking availability', 'text-danger');
        });
    }

    function updateAvailability(elementId, message, className) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = `availability-check ${className}`;
    }

    function validatePassword(password) {
        const hasMinLength = password.length >= 8;
        const hasUpper = /[A-Z]/.test(password);
        const hasLower = /[a-z]/.test(password);
        const hasNumber = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
        
        updateRequirement(lengthReq, hasMinLength);
        updateRequirement(upperReq, hasUpper);
        updateRequirement(lowerReq, hasLower);
        updateRequirement(numberReq, hasNumber);
        updateRequirement(specialReq, hasSpecial);

        // Update strength meter
        let strength = 0;
        if (hasMinLength) strength++;
        if (hasUpper) strength++;
        if (hasLower) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;

        $('.strength-meter .strength-bar').removeClass('active');
        for (let i = 0; i < strength; i++) {
            $('.strength-bar').eq(i).addClass('active');
        }

        const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
        $('.strength-text span').text(strengthText[strength] || 'None');
    }

    function updateRequirement(element, met) {
        if (met) {
            element.className = 'requirement-met';
            element.innerHTML = '<i class="fas fa-check-circle me-1"></i>' + element.textContent.replace(/^.*?\]/, '');
        } else {
            element.className = 'requirement-not-met';
            element.innerHTML = '<i class="fas fa-circle me-1"></i>' + element.textContent.replace(/^.*?\]/, '');
        }
    }

    function validatePasswordMatch() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!password || !confirmPassword) {
            passwordMatch.className = 'text-muted';
            passwordMatch.innerHTML = '<i class="fas fa-circle me-1"></i>Passwords must match';
            return;
        }
        
        if (password === confirmPassword) {
            passwordMatch.className = 'text-success';
            passwordMatch.innerHTML = '<i class="fas fa-check-circle me-1"></i>Passwords match';
        } else {
            passwordMatch.className = 'text-danger';
            passwordMatch.innerHTML = '<i class="fas fa-times-circle me-1"></i>Passwords do not match';
        }
    }

    function validateForm() {
        let isValid = true;
        
        // Basic validation
        const requiredFields = [
            { element: usernameInput, name: 'Username' },
            { element: emailInput, name: 'Email' },
            { element: passwordInput, name: 'Password' },
            { element: confirmPasswordInput, name: 'Confirm Password' }
        ];
        
        requiredFields.forEach(field => {
            if (!field.element.value.trim()) {
                showFieldError(field.element, `${field.name} is required`);
                isValid = false;
            } else {
                clearFieldError(field.element);
            }
        });
        
        // Password match validation
        if (passwordInput.value !== confirmPasswordInput.value) {
            showFieldError(confirmPasswordInput, 'Passwords do not match');
            isValid = false;
        }
        
        // Check if username is available
        const usernameAvailability = document.getElementById('usernameAvailability');
        if (usernameAvailability.classList.contains('text-danger')) {
            showFieldError(usernameInput, 'Username is not available');
            isValid = false;
        }
        
        // Check if email is available
        const emailAvailability = document.getElementById('emailAvailability');
        if (emailAvailability.classList.contains('text-danger')) {
            showFieldError(emailInput, 'Email is not available');
            isValid = false;
        }
        
        return isValid;
    }

    function showFieldError(element, message) {
        element.classList.add('is-invalid');
        let feedback = element.nextElementSibling;
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            element.parentNode.insertBefore(feedback, element.nextElementSibling);
        }
        feedback.textContent = message;
    }

    function clearFieldError(element) {
        element.classList.remove('is-invalid');
        const feedback = element.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.remove();
        }
    }
}

// Unified Modal Handling
function showMessage(type, text) {
    // Hide all modals first
    $('.modal').fadeOut();
    
    switch(type) {
        case 'success':
            $('#success-message').text(text);
            $('#success-modal').fadeIn();
            break;
        case 'error':
            $('#error-message').text(text);
            $('#error-modal').fadeIn();
            break;
        case 'info':
            $('#info-message').text(text);
            $('#info-modal').fadeIn();
            break;
    }
}