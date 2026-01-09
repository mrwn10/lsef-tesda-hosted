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

    // ===== PROFILE FUNCTIONALITY WITH SWEETALERT2 =====
    
    // SweetAlert2 Message Function
    function showMessage(type, text) {
        const swalConfig = {
            title: getTitleByType(type),
            text: text,
            icon: type,
            confirmButtonText: 'OK',
            confirmButtonColor: getButtonColorByType(type),
            customClass: {
                popup: 'sweetalert-popup',
                title: 'sweetalert-title',
                confirmButton: 'sweetalert-confirm-btn'
            }
        };
        
        Swal.fire(swalConfig);
    }

    function getTitleByType(type) {
        switch(type) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            case 'info': return 'Information';
            default: return 'Message';
        }
    }

    function getButtonColorByType(type) {
        switch(type) {
            case 'success': return '#15803d';
            case 'error': return '#b91c1c';
            case 'info': return '#1d4ed8';
            default: return '#003366';
        }
    }

    // Fetch student profile data
    function fetchProfileData() {
        $.ajax({
            url: fetchProfileUrl,
            type: "GET",
            beforeSend: function() {
                // Show loading state on form
                $('#profile-form').addClass('loading');
            },
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
                    showMessage('error', response.error || 'Failed to load profile data');
                }
                $('#profile-form').removeClass('loading');
            },
            error: function(xhr, status, error) {
                let errorMsg = 'Error fetching profile data';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                } else if (xhr.statusText) {
                    errorMsg = xhr.statusText;
                }
                showMessage('error', errorMsg);
                $('#profile-form').removeClass('loading');
            }
        });
    }

    // Handle form submission
    $('#profile-form').submit(function(e) {
        e.preventDefault();

        // Check password match
        const newPassword = $('#new_password').val();
        const confirmPassword = $('#confirm_password').val();
        
        if (newPassword && newPassword !== confirmPassword) {
            showMessage('error', 'New password and confirmation do not match');
            return;
        }

        // Show loading state
        $(this).addClass('loading');
        $('.btn-primary').html('<i class="fas fa-spinner fa-spin"></i> Saving...');
        $('.btn-primary').prop('disabled', true);

        const formData = new FormData(this);

        $.ajax({
            url: updateProfileUrl,
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showMessage('success', response.message);

                    // Update profile picture if changed
                    if (response.updated_profile.profile_picture_url) {
                        $('#profile-preview').attr('src', response.updated_profile.profile_picture_url);
                    }

                    // Clear password fields if they were updated
                    $('#current_password').val('');
                    $('#new_password').val('');
                    $('#confirm_password').val('');
                    
                    // Update password strength indicator
                    updatePasswordStrengthIndicator(0);
                    $('#password-strength-text').text('None');
                } else {
                    showMessage('error', response.error || 'Failed to update profile');
                }
                $('#profile-form').removeClass('loading');
                $('.btn-primary').html('<i class="fas fa-save"></i> Save Changes');
                $('.btn-primary').prop('disabled', false);
            },
            error: function(xhr, status, error) {
                let errorMsg = 'Error updating profile';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                } else if (xhr.statusText) {
                    errorMsg = xhr.statusText;
                }
                showMessage('error', errorMsg);
                $('#profile-form').removeClass('loading');
                $('.btn-primary').html('<i class="fas fa-save"></i> Save Changes');
                $('.btn-primary').prop('disabled', false);
            }
        });
    });

    // Profile picture preview
    $('#profile_picture').change(function() {
        const file = this.files[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showMessage('error', 'File size exceeds 2MB limit');
                $(this).val('');
                return;
            }
            
            // Check file type
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (!validTypes.includes(file.type)) {
                showMessage('error', 'Only JPG, JPEG, or PNG files are allowed');
                $(this).val('');
                return;
            }
            
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
        showMessage('info', 'Profile picture removed. Remember to save changes.');
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
        
        $('.strength-meter .strength-bar').removeClass('active');
        for (let i = 0; i < strength; i++) {
            $('.strength-bar').eq(i).addClass('active');
        }
    }

    // Initial fetch
    fetchProfileData();
});