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
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    }

    // Logout Modal Handling
    const logoutModal = document.getElementById('logout-modal');
    const logoutTrigger = document.getElementById('logout-trigger');
    const mobileLogoutTrigger = document.getElementById('mobile-logout-trigger');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    const closeLogoutModal = document.getElementById('close-logout-modal');

    // Show modal when logout is clicked (desktop)
    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('logout-modal');
        });
    }

    // Show modal when logout is clicked (mobile)
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

    // Hide modal when cancel is clicked
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
        });
    }

    // Hide modal when close button is clicked
    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
        });
    }

    // Handle logout confirmation
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

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            closeModal('logout-modal');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal && logoutModal.style.display === 'flex') {
            closeModal('logout-modal');
        }
    });

    // ===== YOUR ORIGINAL WORKING PROFILE FUNCTIONALITY =====
    
    // Fetch student profile data
    function fetchProfileData() {
        $.ajax({
            url: fetchProfileUrl,
            type: "GET",
            success: function(response) {
                if (response.success) {
                    const student = response.student;
                    
                    // Personal Information
                    $('#first_name').val(student.first_name || '');
                    $('#middle_name').val(student.middle_name || '');
                    $('#last_name').val(student.last_name || '');
                    $('#contact_number').val(student.contact_number || '');
                    $('#date_of_birth').val(student.date_of_birth || '');
                    $('#gender').val(student.gender || '');
                    
                    // Account Information
                    $('#username').val(student.username || '');
                    $('#email').val(student.email || '');
                    
                    // Address Information
                    $('#province').val(student.province || '');
                    $('#municipality').val(student.municipality || '');
                    $('#baranggay').val(student.baranggay || '');
                    
                    // Profile Picture
                    if (student.profile_picture_url) {
                        $('#profile-preview').attr('src', student.profile_picture_url);
                    } else {
                        $('#profile-preview').attr('src', defaultProfilePic);
                    }
                } else {
                    showMessage(response.error || 'Failed to load profile data', 'error');
                }
            },
            error: function(xhr, status, error) {
                showMessage('Error fetching profile data: ' + error, 'error');
            }
        });
    }

    // Handle form submission
    $('#profile-form').submit(function(e) {
        e.preventDefault();

        const formData = new FormData(this);

        $.ajax({
            url: updateProfileUrl,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showMessage(response.message, 'success');

                    // Update profile picture if changed
                    if (response.updated_profile.profile_picture_url) {
                        $('#profile-preview').attr('src', response.updated_profile.profile_picture_url);
                    }

                    // Clear password fields if they were updated
                    $('#current_password').val('');
                    $('#new_password').val('');
                    $('#confirm_password').val('');
                } else {
                    showMessage(response.error || 'Failed to update profile', 'error');
                }
            },
            error: function(xhr, status, error) {
                let errorMsg = 'Error updating profile';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                }
                showMessage(errorMsg, 'error');
            }
        });
    });

    // Profile picture preview
    $('#profile_picture').change(function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                $('#profile-preview').attr('src', e.target.result);
            }
            reader.readAsDataURL(file);
        }
    });

    // Remove profile picture
    $('#remove-picture').click(function() {
        $('#profile_picture').val('');
        $('#profile-preview').attr('src', defaultProfilePic);
    });

    // Toggle password visibility
    $('.toggle-password').click(function() {
        const input = $(this).siblings('input');
        const icon = $(this);
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        icon.toggleClass('fa-eye fa-eye-slash');
    });

    // Password strength indicator
    $('#new_password').on('input', function() {
        const password = $(this).val();
        const strength = checkPasswordStrength(password);
        updatePasswordStrengthIndicator(strength);
    });

    function checkPasswordStrength(password) {
        if (!password) return 0;

        let strength = 0;
        if (password.length >= 4) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;

        return Math.min(strength, 4);
    }

    function updatePasswordStrengthIndicator(strength) {
        const strengthTexts = ['None', 'Weak', 'Fair', 'Good', 'Strong'];
        $('#password-strength-text').text(strengthTexts[strength]);
    }

    // Message display function
    function showMessage(message, type) {
        const messageContainer = $('#message-container');
        const messageContent = $('#message-content');
        
        messageContent.removeClass('success error info').addClass(type);
        messageContent.html(`
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `);
        
        messageContainer.slideDown();
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageContainer.slideUp();
        }, 5000);
    }

    // Initial fetch
    fetchProfileData();
});