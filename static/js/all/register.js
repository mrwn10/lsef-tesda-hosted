// register.js - Updated with AJAX form submission and success modal

document.addEventListener('DOMContentLoaded', function() {
    // Set max date for date of birth (must be in the past)
    document.getElementById('date_of_birth').max = new Date().toISOString().split('T')[0];
    
    // Profile Picture Elements
    const profilePictureInput = document.getElementById('profile_picture');
    const uploadZone = document.getElementById('uploadZone');
    const browseBtn = document.getElementById('browseBtn');
    const immediatePreview = document.getElementById('immediatePreview');
    const previewImage = document.getElementById('previewImage');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removePreview = document.getElementById('removePreview');
    const uploadStatus = document.getElementById('uploadStatus');
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const reviewProfilePicture = document.getElementById('review-profile-picture');

    // Multi-step form functionality
    const formSteps = document.querySelectorAll('.form-step');
    const progressSteps = document.querySelectorAll('.step');
    let currentStep = 1;

    // Availability tracking
    let isUsernameAvailable = null;
    let isEmailAvailable = null;
    
    // Track if we're currently checking
    let isCheckingEmail = false;
    let isCheckingUsername = false;

    // Modal instances
    let successModal = null;
    const successModalElement = document.getElementById('successModal');
    if (successModalElement) {
        successModal = new bootstrap.Modal(successModalElement);
    }

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

    // Email validation helper function
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // Function to force check email availability (NO TOASTS)
    function forceCheckEmail() {
        const email = document.getElementById('email').value.trim();
        const availabilityElement = document.getElementById('email-availability');
        
        if (!email || !isValidEmail(email)) {
            if (availabilityElement) {
                availabilityElement.textContent = 'Please enter a valid email';
                availabilityElement.className = 'availability-message error';
            }
            isEmailAvailable = false;
            return Promise.resolve(false);
        }
        
        // Show checking status
        if (availabilityElement) {
            availabilityElement.textContent = 'Checking availability...';
            availabilityElement.className = 'availability-message checking';
        }
        
        isCheckingEmail = true;
        
        // Call backend
        return fetch('/check_email', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: email })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            isCheckingEmail = false;
            
            if (availabilityElement) {
                availabilityElement.textContent = data.message;
                availabilityElement.className = `availability-message ${data.available ? 'available' : 'taken'}`;
            }
            
            isEmailAvailable = data.available;
            
            const emailInput = document.getElementById('email');
            if (emailInput) {
                if (data.available) {
                    emailInput.classList.remove('error');
                    return true;
                } else {
                    emailInput.classList.add('error');
                    // NO TOAST - error is already shown in availabilityElement
                    return false;
                }
            }
            return data.available;
        })
        .catch(error => {
            console.error('Error checking email availability:', error);
            isCheckingEmail = false;
            isEmailAvailable = null;
            
            if (availabilityElement) {
                availabilityElement.textContent = 'Error checking availability';
                availabilityElement.className = 'availability-message error';
            }
            
            return false;
        });
    }

    // Function to force check username availability (NO TOASTS)
    function forceCheckUsername() {
        const username = document.getElementById('username').value.trim();
        const availabilityElement = document.getElementById('username-availability');
        
        if (!username) {
            if (availabilityElement) {
                availabilityElement.textContent = 'Username is required';
                availabilityElement.className = 'availability-message error';
            }
            isUsernameAvailable = false;
            return Promise.resolve(false);
        }
        
        if (username.length < 3) {
            if (availabilityElement) {
                availabilityElement.textContent = 'Username must be at least 3 characters';
                availabilityElement.className = 'availability-message error';
            }
            isUsernameAvailable = false;
            return Promise.resolve(false);
        }
        
        // Show checking status
        if (availabilityElement) {
            availabilityElement.textContent = 'Checking availability...';
            availabilityElement.className = 'availability-message checking';
        }
        
        isCheckingUsername = true;
        
        // Call backend
        return fetch('/check_username', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: username })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            isCheckingUsername = false;
            
            if (availabilityElement) {
                availabilityElement.textContent = data.message;
                availabilityElement.className = `availability-message ${data.available ? 'available' : 'taken'}`;
            }
            
            isUsernameAvailable = data.available;
            
            const usernameInput = document.getElementById('username');
            if (usernameInput) {
                if (data.available) {
                    usernameInput.classList.remove('error');
                    return true;
                } else {
                    usernameInput.classList.add('error');
                    // NO TOAST - error is already shown in availabilityElement
                    return false;
                }
            }
            return data.available;
        })
        .catch(error => {
            console.error('Error checking username availability:', error);
            isCheckingUsername = false;
            isUsernameAvailable = null;
            
            if (availabilityElement) {
                availabilityElement.textContent = 'Error checking availability';
                availabilityElement.className = 'availability-message error';
            }
            
            return false;
        });
    }

    // Enhanced availability check function (NO TOASTS)
    function checkAvailability(type, value) {
        if (type === 'username' && value.length < 3) {
            const availabilityElement = document.getElementById('username-availability');
            if (availabilityElement) {
                availabilityElement.textContent = '';
            }
            isUsernameAvailable = null;
            return;
        }

        const availabilityElement = document.getElementById(`${type}-availability`);
        if (!availabilityElement) return;

        availabilityElement.textContent = 'Checking availability...';
        availabilityElement.className = 'availability-message checking';

        if (type === 'email') {
            isCheckingEmail = true;
        } else {
            isCheckingUsername = true;
        }

        // ORIGINAL BACKEND CALLS TO /check_username AND /check_email
        fetch(`/check_${type}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ [type]: value })
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            availabilityElement.textContent = data.message;
            availabilityElement.className = `availability-message ${data.available ? 'available' : 'taken'}`;
            
            // Update availability state
            if (type === 'username') {
                isUsernameAvailable = data.available;
                isCheckingUsername = false;
            } else if (type === 'email') {
                isEmailAvailable = data.available;
                isCheckingEmail = false;
            }
            
            // Mark field as error if not available
            const inputField = document.getElementById(type);
            if (inputField) {
                if (data.available) {
                    inputField.classList.remove('error');
                } else {
                    inputField.classList.add('error');
                    // NO TOAST - error is already shown in availabilityElement
                }
            }
        })
        .catch(error => {
            console.error(`Error checking ${type} availability:`, error);
            availabilityElement.textContent = 'Error checking availability';
            availabilityElement.className = 'availability-message error';
            
            // On error, set to unknown
            if (type === 'username') {
                isUsernameAvailable = null;
                isCheckingUsername = false;
            } else if (type === 'email') {
                isEmailAvailable = null;
                isCheckingEmail = false;
            }
        });
    }

    // ==============================================
    // SINGLE Next button handler function (SIMPLIFIED)
    // ==============================================
    
    async function handleNextButtonClick() {
        const currentStepElement = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const inputs = currentStepElement.querySelectorAll('input, select');
        let isValid = true;

        // Validate current step
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim() && input.type !== 'file') {
                isValid = false;
                input.classList.add('error');
                
                if (input.type === 'email' && !input.value.trim()) {
                    const emailError = document.getElementById('email-availability');
                    if (emailError) {
                        emailError.textContent = 'Email is required';
                        emailError.className = 'availability-message error';
                    }
                }
            } else {
                input.classList.remove('error');
                if (input.type === 'email' && input.value.trim()) {
                    const emailError = document.getElementById('email-availability');
                    if (emailError && emailError.textContent === 'Email is required') {
                        emailError.textContent = '';
                    }
                }
            }
        });

        // Special validation for Step 1 - Profile Picture
        if (currentStep === 1) {
            const profilePic = document.getElementById('profile_picture');
            if (profilePic && !profilePic.files.length) {
                isValid = false;
                showUploadStatus('error', 'Please upload a profile picture');
            }
        }

        // Special validation for Step 2 - Contact Details
        if (currentStep === 2) {
            const email = document.getElementById('email').value.trim();
            const contactNumber = document.getElementById('contact_number').value.trim();
            const province = document.getElementById('province').value;
            const municipal = document.getElementById('municipal').value;
            const barangay = document.getElementById('barangay').value;
            
            // Basic email validation
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
            } else {
                // Check email availability (RE-CHECK every time!)
                try {
                    // Disable next button temporarily
                    const nextButtons = currentStepElement.querySelectorAll('.btn-next');
                    nextButtons.forEach(button => {
                        button.disabled = true;
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                    });
                    
                    const isAvailable = await forceCheckEmail();
                    
                    // Re-enable buttons
                    nextButtons.forEach(button => {
                        button.disabled = false;
                        button.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
                    });
                    
                    if (!isAvailable) {
                        isValid = false;
                        // Error is already shown by forceCheckEmail()
                    }
                } catch (error) {
                    // Re-enable button on error
                    const nextButtons = currentStepElement.querySelectorAll('.btn-next');
                    nextButtons.forEach(button => {
                        button.disabled = false;
                        button.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
                    });
                    
                    isValid = false;
                    document.getElementById('email-availability').textContent = 'Unable to verify email availability';
                    document.getElementById('email-availability').className = 'availability-message error';
                }
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

        // Special validation for Step 3 - Account Information
        if (currentStep === 3) {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            // Basic username validation
            if (!username) {
                isValid = false;
                document.getElementById('username').classList.add('error');
                const availabilityElement = document.getElementById('username-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = 'Username is required';
                    availabilityElement.className = 'availability-message error';
                }
            } else if (username.length < 3) {
                isValid = false;
                document.getElementById('username').classList.add('error');
                const availabilityElement = document.getElementById('username-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = 'Username must be at least 3 characters';
                    availabilityElement.className = 'availability-message error';
                }
            } else {
                // Check username availability (RE-CHECK every time!)
                try {
                    // Disable next button temporarily
                    const nextButtons = currentStepElement.querySelectorAll('.btn-next');
                    nextButtons.forEach(button => {
                        button.disabled = true;
                        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
                    });
                    
                    const isAvailable = await forceCheckUsername();
                    
                    // Re-enable buttons
                    nextButtons.forEach(button => {
                        button.disabled = false;
                        button.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
                    });
                    
                    if (!isAvailable) {
                        isValid = false;
                        // Error is already shown by forceCheckUsername()
                    }
                } catch (error) {
                    // Re-enable button on error
                    const nextButtons = currentStepElement.querySelectorAll('.btn-next');
                    nextButtons.forEach(button => {
                        button.disabled = false;
                        button.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
                    });
                    
                    isValid = false;
                    const availabilityElement = document.getElementById('username-availability');
                    if (availabilityElement) {
                        availabilityElement.textContent = 'Unable to verify username availability';
                        availabilityElement.className = 'availability-message error';
                    }
                }
            }
            
            // Password validation
            if (!password) {
                isValid = false;
                document.getElementById('password').classList.add('error');
            } else if (password.length < 8) {
                isValid = false;
                document.getElementById('password').classList.add('error');
            }
            
            // Password match validation
            if (password !== confirmPassword) {
                isValid = false;
                document.getElementById('confirm_password').classList.add('error');
                document.getElementById('password-match').textContent = 'Passwords do not match';
                document.getElementById('password-match').className = 'validation-message error';
            }
        }

        if (isValid) {
            if (currentStep === 3) {
                updateReviewSection();
            }
            
            currentStep++;
            updateFormSteps();
        } else {
            // Re-enable button if it was disabled
            const nextButtons = currentStepElement.querySelectorAll('.btn-next');
            nextButtons.forEach(button => {
                button.disabled = false;
                button.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            });
            
            // Scroll to first error
            const firstError = currentStepElement.querySelector('.error');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    // ==============================================
    // SINGLE Previous button handler function
    // ==============================================
    
    function handlePrevButtonClick() {
        if (currentStep > 1) {
            currentStep--;
            updateFormSteps();
        }
    }

    // ==============================================
    // Add event listeners ONCE
    // ==============================================
    
    // Function to setup event listeners
    function setupEventListeners() {
        // Remove any existing listeners first (prevents duplicates)
        document.querySelectorAll('.btn-next').forEach(button => {
            button.removeEventListener('click', handleNextButtonClick);
            button.addEventListener('click', handleNextButtonClick);
        });

        document.querySelectorAll('.btn-prev').forEach(button => {
            button.removeEventListener('click', handlePrevButtonClick);
            button.addEventListener('click', handlePrevButtonClick);
        });
    }

    // Call setupEventListeners once
    setupEventListeners();

    // Update review section
    function updateReviewSection() {
        const firstName = document.getElementById('first_name').value;
        const middleName = document.getElementById('middle_name').value;
        const lastName = document.getElementById('last_name').value;

        // Profile picture preview for review step
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
        document.getElementById('review-email').textContent = document.getElementById('email').value;
        document.getElementById('review-contact').textContent = document.getElementById('contact_number').value;
        
        const province = document.getElementById('province').options[document.getElementById('province').selectedIndex].text;
        const municipal = document.getElementById('municipal').options[document.getElementById('municipal').selectedIndex].text;
        const barangay = document.getElementById('barangay').options[document.getElementById('barangay').selectedIndex].text;
        document.getElementById('review-address').textContent = `${barangay}, ${municipal}, ${province}`;
        
        document.getElementById('review-username').textContent = document.getElementById('username').value;
        document.getElementById('review-role').textContent = document.getElementById('role').options[document.getElementById('role').selectedIndex].text;
    }

    // ==============================================
    // ENHANCED PROFILE PICTURE UPLOAD FUNCTIONALITY
    // ==============================================

    // Show upload status message
    function showUploadStatus(type, message) {
        uploadStatus.style.display = 'flex';
        uploadStatus.className = `upload-status ${type}`;
        statusIcon.className = `status-icon fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`;
        statusText.textContent = message;
        
        if (type === 'success') {
            setTimeout(() => {
                uploadStatus.style.display = 'none';
            }, 3000);
        }
    }

    // Validate image file
    function validateImageFile(file) {
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        
        if (!allowedTypes.includes(file.type)) {
            showUploadStatus('error', 'Invalid file type. Please upload JPG, PNG, or GIF images.');
            return false;
        }
        
        if (file.size > maxSize) {
            showUploadStatus('error', 'File too large. Maximum size is 5MB.');
            return false;
        }
        
        return true;
    }

    // Format file size
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle file selection
    function handleFileSelect(file) {
        if (!validateImageFile(file)) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            fileName.textContent = file.name;
            fileSize.textContent = formatFileSize(file.size);
            
            immediatePreview.style.display = 'block';
            uploadZone.style.display = 'none';
            
            showUploadStatus('success', 'Profile picture uploaded successfully!');
        };
        reader.readAsDataURL(file);
    }

    // Drag and drop functionality
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadZone.classList.add('drag-over');
    }

    function unhighlight() {
        uploadZone.classList.remove('drag-over');
    }

    uploadZone.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        if (file) {
            handleFileSelect(file);
            profilePictureInput.files = dt.files;
        }
    });

    // Browse button click
    browseBtn.addEventListener('click', function() {
        profilePictureInput.click();
    });

    // File input change
    profilePictureInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            handleFileSelect(file);
        }
    });

    // Remove preview
    removePreview.addEventListener('click', function() {
        profilePictureInput.value = '';
        immediatePreview.style.display = 'none';
        uploadZone.style.display = 'block';
        uploadStatus.style.display = 'none';
    });

    // ==============================================
    // SUCCESS MODAL FUNCTIONALITY
    // ==============================================

    // Show success modal
    function showSuccessModal(message, title = 'Registration Successful') {
        if (successModal) {
            const modalTitle = document.getElementById('successModalLabel');
            const modalMessage = document.getElementById('successMessage');
            
            if (modalTitle) modalTitle.textContent = title;
            if (modalMessage) modalMessage.textContent = message;
            
            successModal.show();
            
            // Reset form after showing modal
            resetForm();
        }
    }

    // Reset form after successful registration
    function resetForm() {
        const registrationForm = document.getElementById('registrationForm');
        if (registrationForm) {
            registrationForm.reset();
            
            // Reset form steps
            currentStep = 1;
            updateFormSteps();
            
            // Reset profile picture preview
            immediatePreview.style.display = 'none';
            uploadZone.style.display = 'block';
            uploadStatus.style.display = 'none';
            
            // Reset username suggestions
            hideSuggestions();
            
            // Reset availability messages
            const availabilityMessages = document.querySelectorAll('.availability-message');
            availabilityMessages.forEach(el => el.textContent = '');
            
            // Reset password validation
            validatePasswordStrength('');
            document.getElementById('password-match').textContent = '';
            
            // Reset review section
            reviewProfilePicture.src = '';
            reviewProfilePicture.style.display = 'none';
            
            // Reset terms checkbox
            const termsCheckbox = document.getElementById('terms');
            if (termsCheckbox) {
                termsCheckbox.checked = false;
                termsRead = false;
            }
            
            // Reset submit button
            const submitBtn = document.querySelector('.submit-btn');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.remove('loading');
            }
            
            // Reset error classes
            document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
            
            // Reset location dropdowns
            if (window.resetLocationDropdowns) {
                window.resetLocationDropdowns();
            }
        }
    }

    // ==============================================
    // AJAX FORM SUBMISSION
    // ==============================================

    // Form submission with AJAX
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = this.querySelector('.submit-btn');
            
            // Show loading
            submitBtn.classList.add('loading');
            
            try {
                // Final validation checks
                const password = document.getElementById('password').value;
                const confirm = document.getElementById('confirm_password').value;
                
                if (password !== confirm) {
                    submitBtn.classList.remove('loading');
                    document.getElementById('password-match').textContent = 'Passwords do not match';
                    document.getElementById('password-match').className = 'validation-message error';
                    document.getElementById('confirm_password').classList.add('error');
                    document.getElementById('confirm_password').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                
                if (!termsCheckbox.checked || !termsRead) {
                    submitBtn.classList.remove('loading');
                    if (termsModal) {
                        termsModal.show();
                    }
                    return;
                }
                
                if (!profilePictureInput.files.length) {
                    submitBtn.classList.remove('loading');
                    showUploadStatus('error', 'Please upload a profile picture');
                    document.getElementById('profile_picture').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                
                // FINAL RE-CHECK of email and username
                
                // Check email
                const emailAvailable = await forceCheckEmail();
                if (!emailAvailable) {
                    submitBtn.classList.remove('loading');
                    document.getElementById('email').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                
                // Check username
                const usernameAvailable = await forceCheckUsername();
                if (!usernameAvailable) {
                    submitBtn.classList.remove('loading');
                    document.getElementById('username').scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
                
                // Create FormData object
                const formData = new FormData(registrationForm);
                
                // Send AJAX request
                const response = await fetch(registrationForm.action, {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                // Remove loading state
                submitBtn.classList.remove('loading');
                
                if (data.success) {
                    // Show success modal
                    showSuccessModal(data.message, data.modal_title || 'Registration Successful');
                } else {
                    // Show error message
                    showUploadStatus('error', data.message || 'Registration failed');
                    
                    // Scroll to top to show error
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
                
            } catch (error) {
                submitBtn.classList.remove('loading');
                console.error('Form submission error:', error);
                showUploadStatus('error', 'An error occurred. Please try again.');
            }
        });
    }

    // ==============================================
    // SUCCESS MODAL BUTTON HANDLERS
    // ==============================================

    // OK button handler
    const successOkBtn = document.getElementById('successOkBtn');
    if (successOkBtn) {
        successOkBtn.addEventListener('click', function() {
            // Modal will close automatically via data-bs-dismiss
            // Form is already reset when modal was shown
        });
    }

    // Redirect to login button
    const redirectToLoginBtn = document.getElementById('redirectToLoginBtn');
    if (redirectToLoginBtn) {
        redirectToLoginBtn.addEventListener('click', function() {
            if (successModal) {
                successModal.hide();
            }
            // Get login URL from the auth links
            const loginLink = document.querySelector('.auth-links a[href*="login"]');
            if (loginLink && loginLink.href) {
                window.location.href = loginLink.href;
            }
        });
    }

    // ==============================================
    // EXISTING FUNCTIONALITY WITH ORIGINAL BACKEND CALLS
    // ==============================================

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

    // Function to get username suggestions - ORIGINAL BACKEND CALL
    const getUsernameSuggestions = debounce(function() {
        const firstName = firstNameInput?.value.trim() || '';
        const middleName = middleNameInput?.value.trim() || '';
        const lastName = lastNameInput?.value.trim() || '';

        if (firstName && lastName && suggestionsContainer && suggestionsList) {
            // Show loading state
            suggestionsList.innerHTML = '<div class="suggestion-loading">Loading suggestions...</div>';
            suggestionsContainer.style.display = 'block';

            // ORIGINAL BACKEND CALL TO /suggest_username
            fetch('/suggest_username', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    first_name: firstName,
                    middle_name: middleName,
                    last_name: lastName
                })
            })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
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
        if (suggestionsContainer && suggestionsList) {
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
                
                document.querySelectorAll('.suggestion-use-btn').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const selectedUsername = this.getAttribute('data-username');
                        if (usernameInput) {
                            usernameInput.value = selectedUsername;
                        }
                        hideSuggestions();
                        // Call the REAL backend to check availability
                        checkAvailability('username', selectedUsername);
                    });
                });
            } else {
                suggestionsList.innerHTML = '<div class="suggestion-empty">No suggestions available</div>';
                suggestionsContainer.style.display = 'block';
            }
        }
    }

    // Function to hide suggestions
    function hideSuggestions() {
        if (suggestionsContainer) {
            suggestionsContainer.style.display = 'none';
            if (suggestionsList) {
                suggestionsList.innerHTML = '';
            }
        }
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
            if (this.value.length >= 3) {
                checkAvailability('username', this.value);
            } else {
                const availabilityElement = document.getElementById('username-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = '';
                }
                isUsernameAvailable = null;
            }
        });

        usernameInput.addEventListener('focus', function() {
            const firstName = firstNameInput ? firstNameInput.value.trim() : '';
            const lastName = lastNameInput ? lastNameInput.value.trim() : '';
            if (firstName && lastName && !this.value) {
                getUsernameSuggestions();
            }
        });
    }

    // Email availability check (real-time as user types)
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', debounce(function() {
            const email = this.value.trim();
            if (email && isValidEmail(email)) {
                checkAvailability('email', email);
            } else if (email) {
                const availabilityElement = document.getElementById('email-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = 'Invalid email format';
                    availabilityElement.className = 'availability-message error';
                }
                isEmailAvailable = null;
            } else {
                const availabilityElement = document.getElementById('email-availability');
                if (availabilityElement) {
                    availabilityElement.textContent = '';
                }
                isEmailAvailable = null;
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
        termsCheckbox.addEventListener('click', function(e) {
            if (!termsRead) {
                e.preventDefault();
                termsModal.show();
            }
        });

        if (termsLink) {
            termsLink.addEventListener('click', function(e) {
                e.preventDefault();
                termsModal.show();
            });
        }

        if (understandBtn) {
            understandBtn.addEventListener('click', function() {
                termsRead = true;
                termsCheckbox.checked = true;
                termsModal.hide();
                if (submitBtn) {
                    submitBtn.disabled = false;
                }
                
                const termsLabel = termsCheckbox.closest('.terms-group').querySelector('label');
                termsLabel.classList.add('terms-accepted');
                termsLabel.innerHTML = `
                    <i class="fas fa-check-circle text-success me-2"></i>
                    I have read and agree to the <a href="#" class="terms-link" data-bs-toggle="modal" data-bs-target="#termsModal">Terms and Conditions</a>
                    <small class="terms-note">(Click to review again)</small>
                `;
                
                const newTermsLink = termsLabel.querySelector('.terms-link');
                if (newTermsLink) {
                    newTermsLink.addEventListener('click', function(e) {
                        e.preventDefault();
                        termsModal.show();
                    });
                }
            });
        }

        termsCheckbox.addEventListener('change', function() {
            if (submitBtn) {
                submitBtn.disabled = !this.checked;
            }
        });
    }

    // Initialize form
    updateFormSteps();

    console.log('Registration form JavaScript loaded successfully with modal support');
});