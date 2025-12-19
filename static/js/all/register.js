// register.js - Complete Enhanced Version with Username Suggestions

document.addEventListener('DOMContentLoaded', function() {
    // Set max date for date of birth (must be in the past)
    document.getElementById('date_of_birth').max = new Date().toISOString().split('T')[0];
    
    const profilePictureInput = document.getElementById('profile_picture');
    const reviewProfilePicture = document.getElementById('review-profile-picture');

    // Multi-step form functionality
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.step');
    const nextButtons = document.querySelectorAll('.btn-next');
    const prevButtons = document.querySelectorAll('.btn-prev');
    let currentStep = 1;

    // Initialize form steps
    function updateFormSteps() {
        formSteps.forEach(step => {
            if (parseInt(step.dataset.step) === currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });

        progressSteps.forEach(step => {
            if (parseInt(step.dataset.step) <= currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // Next button functionality - FIXED VALIDATION
    nextButtons.forEach(button => {
        button.addEventListener('click', function() {
            const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
            const inputs = currentStepElement.querySelectorAll('input, select');
            let isValid = true;

            // Validate current step - FIXED: Check all required fields
            inputs.forEach(input => {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    isValid = false;
                    input.classList.add('error');
                    
                    // Add error message for required fields
                    if (input.type === 'email' && !input.value.trim()) {
                        const emailError = document.getElementById('email-availability');
                        if (emailError) {
                            emailError.textContent = 'Email is required';
                            emailError.className = 'availability-message error';
                        }
                    }
                } else {
                    input.classList.remove('error');
                    // Clear error messages when field is valid
                    if (input.type === 'email' && input.value.trim()) {
                        const emailError = document.getElementById('email-availability');
                        if (emailError && emailError.textContent === 'Email is required') {
                            emailError.textContent = '';
                        }
                    }
                }
            });

            // Special validation for Step 2 - Contact Details
            if (currentStep === 2) {
                const email = document.getElementById('email').value.trim();
                const contactNumber = document.getElementById('contact_number').value.trim();
                const province = document.getElementById('province').value;
                const municipal = document.getElementById('municipal').value;
                const barangay = document.getElementById('barangay').value;
                
                // Email validation
                if (!email) {
                    isValid = false;
                    document.getElementById('email').classList.add('error');
                    document.getElementById('email-availability').textContent = 'Email is required';
                    document.getElementById('email-availability').className = 'availability-message error';
                } else if (!isValidEmail(email)) {
                    isValid = false;
                    document.getElementById('email').classList.add('error');
                    document.getElementById('email-availability').textContent = 'Invalid email format';
                    document.getElementById('email-availability').className = 'availability-message error';
                }
                
                // Contact number validation
                if (!contactNumber) {
                    isValid = false;
                    document.getElementById('contact_number').classList.add('error');
                } else if (!/^[0-9]{11}$/.test(contactNumber)) {
                    isValid = false;
                    document.getElementById('contact_number').classList.add('error');
                }
                
                // Address validation
                if (!province) {
                    isValid = false;
                    document.getElementById('province').classList.add('error');
                }
                if (!municipal) {
                    isValid = false;
                    document.getElementById('municipal').classList.add('error');
                }
                if (!barangay) {
                    isValid = false;
                    document.getElementById('barangay').classList.add('error');
                }
            }

            // Special validation for password match (Step 3)
            if (currentStep === 3) {
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm_password').value;
                
                if (password !== confirmPassword) {
                    isValid = false;
                    confirmPassword.classList.add('error');
                    document.getElementById('password-match').textContent = 'Passwords do not match';
                    document.getElementById('password-match').classList.add('error');
                }
            }

            if (isValid) {
                if (currentStep === 3) {
                    // Update review section before showing step 4
                    updateReviewSection();
                }
                
                currentStep++;
                updateFormSteps();
            } else {
                // Scroll to first error
                const firstError = currentStepElement.querySelector('.error');
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });

    // Email validation helper function
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // Previous button functionality
    prevButtons.forEach(button => {
        button.addEventListener('click', function() {
            if (currentStep > 1) {
                currentStep--;
                updateFormSteps();
            }
        });
    });

    // Update review section
    function updateReviewSection() {
        // Personal Information
        const firstName = document.getElementById('first_name').value;
        const middleName = document.getElementById('middle_name').value;
        const lastName = document.getElementById('last_name').value;

        // Profile picture preview
    if (profilePictureInput && profilePictureInput.files.length > 0) {
        const file = profilePictureInput.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
            reviewProfilePicture.src = e.target.result;
            reviewProfilePicture.style.display = 'block';
        };

        reader.readAsDataURL(file);
    }

        document.getElementById('review-fullname').textContent = `${firstName} ${middleName} ${lastName}`.trim();
        
        document.getElementById('review-dob').textContent = document.getElementById('date_of_birth').value;
        document.getElementById('review-gender').textContent = document.getElementById('gender').options[document.getElementById('gender').selectedIndex].text;
        
        // Contact Details
        document.getElementById('review-email').textContent = document.getElementById('email').value;
        document.getElementById('review-contact').textContent = document.getElementById('contact_number').value;
        
        const province = document.getElementById('province').options[document.getElementById('province').selectedIndex].text;
        const municipal = document.getElementById('municipal').options[document.getElementById('municipal').selectedIndex].text;
        const barangay = document.getElementById('barangay').options[document.getElementById('barangay').selectedIndex].text;
        document.getElementById('review-address').textContent = `${barangay}, ${municipal}, ${province}`;
        
        // Account Information
        document.getElementById('review-username').textContent = document.getElementById('username').value;
        document.getElementById('review-role').textContent = document.getElementById('role').options[document.getElementById('role').selectedIndex].text;
    }

    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-wrapper').querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });
    
    // Close flash messages
    const closeButtons = document.querySelectorAll('.flash-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.flash-message').style.opacity = '0';
            setTimeout(() => {
                this.closest('.flash-message').remove();
            }, 300);
        });
    });
    
    // Form submission loading state
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function() {
            const submitBtn = this.querySelector('.submit-btn');
            submitBtn.classList.add('loading');
        });
    }

    // Username suggestion functionality
    const firstNameInput = document.getElementById('first_name');
    const middleNameInput = document.getElementById('middle_name');
    const lastNameInput = document.getElementById('last_name');
    const usernameInput = document.getElementById('username');
    const suggestionsContainer = document.getElementById('username-suggestions');
    const suggestionsList = document.getElementById('suggestions-list');

    // Debounce function to prevent too many API calls
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

    // Function to get username suggestions
    const getUsernameSuggestions = debounce(function() {
        const firstName = firstNameInput.value.trim();
        const middleName = middleNameInput.value.trim();
        const lastName = lastNameInput.value.trim();

        console.log('Getting suggestions for:', { firstName, middleName, lastName });

        if (firstName && lastName) {
            // Show loading state
            suggestionsList.innerHTML = '<div class="suggestion-loading">Loading suggestions...</div>';
            suggestionsContainer.style.display = 'block';

            fetch('/suggest_username', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: firstName,
                    middle_name: middleName,
                    last_name: lastName
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log('Received suggestions:', data.suggestions);
                displaySuggestions(data.suggestions);
            })
            .catch(error => {
                console.error('Error fetching username suggestions:', error);
                suggestionsList.innerHTML = '<div class="suggestion-error">Failed to load suggestions</div>';
            });
        } else {
            hideSuggestions();
        }
    }, 500);

    // Function to display suggestions
    function displaySuggestions(suggestions) {
        if (suggestions && suggestions.length > 0) {
            suggestionsList.innerHTML = '';
            suggestions.forEach(suggestion => {
                const suggestionElement = document.createElement('div');
                suggestionElement.className = 'suggestion-item';
                suggestionElement.innerHTML = `
                    <span class="suggestion-text">${suggestion}</span>
                    <button type="button" class="suggestion-use-btn" data-username="${suggestion}">
                        <i class="fas fa-arrow-right"></i> Use
                    </button>
                `;
                suggestionsList.appendChild(suggestionElement);
            });
            suggestionsContainer.style.display = 'block';
            
            // Add event listeners to use buttons
            document.querySelectorAll('.suggestion-use-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const selectedUsername = this.getAttribute('data-username');
                    usernameInput.value = selectedUsername;
                    hideSuggestions();
                    // Trigger username availability check
                    checkAvailability('username', selectedUsername);
                });
            });
        } else {
            suggestionsList.innerHTML = '<div class="suggestion-empty">No suggestions available</div>';
            suggestionsContainer.style.display = 'block';
        }
    }

    // Function to hide suggestions
    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            suggestionsList.innerHTML = '';
        }
    }

    // Enhanced availability check function
    function checkAvailability(type, value) {
        if (type === 'username' && value.length < 3) {
            const availabilityElement = document.getElementById('username-availability');
            if (availabilityElement) {
                availabilityElement.textContent = '';
            }
            return;
        }

        const availabilityElement = document.getElementById(`${type}-availability`);
        if (!availabilityElement) return;

        availabilityElement.textContent = 'Checking availability...';
        availabilityElement.className = 'availability-message';

        fetch(`/check_${type}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ [type]: value })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            availabilityElement.textContent = data.message;
            availabilityElement.className = `availability-message ${data.available ? 'available' : 'taken'}`;
        })
        .catch(error => {
            console.error('Error checking availability:', error);
            availabilityElement.textContent = 'Error checking availability';
            availabilityElement.className = 'availability-message error';
        });
    }

    // Event listeners for name inputs
    [firstNameInput, middleNameInput, lastNameInput].forEach(input => {
        if (input) {
            input.addEventListener('input', getUsernameSuggestions);
        }
    });

    // Event listener for username input (manual entry)
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            hideSuggestions();
            checkAvailability('username', this.value);
        });

        // Event listener for username input focus
        usernameInput.addEventListener('focus', function() {
            const firstName = firstNameInput ? firstNameInput.value.trim() : '';
            const lastName = lastNameInput ? lastNameInput.value.trim() : '';
            if (firstName && lastName && !this.value) {
                getUsernameSuggestions();
            }
        });
    }

    // Email availability check
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', debounce(function() {
            const email = this.value.trim();
            if (email && isValidEmail(email)) {
                checkAvailability('email', email);
            } else if (email) {
                // Invalid email format
                const availabilityElement = document.getElementById('email-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = 'Invalid email format';
                    availabilityElement.className = 'availability-message error';
                }
            } else {
                // Empty email
                const availabilityElement = document.getElementById('email-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = '';
                }
            }
        }, 500));
    }

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(event) {
        if (suggestionsContainer && !suggestionsContainer.contains(event.target) && event.target !== usernameInput) {
            hideSuggestions();
        }
    });

    // Password strength validation
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    const passwordMatchElement = document.getElementById('password-match');

    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            validatePasswordStrength(this.value);
            validatePasswordMatch();
        });
    }

    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }

    function validatePasswordStrength(password) {
        const requirements = {
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        };

        // Update requirement indicators
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(`req-${req}`);
            if (element) {
                element.classList.toggle('valid', requirements[req]);
                element.classList.toggle('invalid', !requirements[req]);
            }
        });
    }

    function validatePasswordMatch() {
        if (!passwordInput || !confirmPasswordInput || !passwordMatchElement) return;

        const password = passwordInput.value;
        const confirm = confirmPasswordInput.value;
        
        if (password && confirm) {
            if (password === confirm) {
                passwordMatchElement.textContent = 'Passwords match';
                passwordMatchElement.className = 'validation-message available';
                confirmPasswordInput.classList.remove('error');
            } else {
                passwordMatchElement.textContent = 'Passwords do not match';
                passwordMatchElement.className = 'validation-message error';
                confirmPasswordInput.classList.add('error');
            }
        } else {
            passwordMatchElement.textContent = '';
            passwordMatchElement.className = 'validation-message';
            confirmPasswordInput.classList.remove('error');
        }
    }

    // Terms and Conditions functionality
    const termsCheckbox = document.getElementById('terms');
    const termsModal = document.getElementById('termsModal') ? new bootstrap.Modal(document.getElementById('termsModal')) : null;
    const termsLink = document.querySelector('.terms-link');
    const submitBtn = document.querySelector('.submit-btn');
    const understandBtn = document.getElementById('understandBtn');
    let termsRead = false;

    if (termsCheckbox && termsModal) {
        // Show modal when checkbox is clicked (forced reading)
        termsCheckbox.addEventListener('click', function(e) {
            if (!termsRead) {
                e.preventDefault(); // Prevent checkbox from being checked
                termsModal.show();
            }
        });

        // Allow manual opening of modal via terms link (optional reading)
        if (termsLink) {
            termsLink.addEventListener('click', function(e) {
                e.preventDefault();
                termsModal.show();
            });
        }

        // "I Understand" button in modal
        if (understandBtn) {
            understandBtn.addEventListener('click', function() {
                termsRead = true;
                termsCheckbox.checked = true;
                termsModal.hide();
                if (submitBtn) {
                    submitBtn.disabled = false;
                }
                
                // Add visual confirmation
                const termsLabel = termsCheckbox.closest('.terms-group').querySelector('label');
                termsLabel.classList.add('terms-accepted');
                termsLabel.innerHTML = `
                    <i class="fas fa-check-circle text-success me-2"></i>
                    I have read and agree to the <a href="#" class="terms-link" data-bs-toggle="modal" data-bs-target="#termsModal">Terms and Conditions</a>
                    <small class="terms-note">(Click to review again)</small>
                `;
                
                // Re-attach event listener to the new terms link
                const newTermsLink = termsLabel.querySelector('.terms-link');
                if (newTermsLink) {
                    newTermsLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        termsModal.show();
                    });
                }
            });
        }

        // Enable/disable submit button based on terms acceptance
        termsCheckbox.addEventListener('change', function() {
            if (submitBtn) {
                submitBtn.disabled = !this.checked;
            }
        });
    }

    // Form submission validation
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirm = document.getElementById('confirm_password').value;
            
            if (password !== confirm) {
                e.preventDefault();
                alert('Passwords do not match!');
                return false;
            }
            
            if (!termsCheckbox.checked || !termsRead) {
                e.preventDefault();
                alert('Please read and accept the Terms and Conditions before submitting.');
                if (termsModal) {
                    termsModal.show();
                }
                return false;
            }
            
            return true;
        });
    }

    // Initialize form
    updateFormSteps();

    // Debug: Log when the script loads
    console.log('Registration form JavaScript loaded successfully');
});