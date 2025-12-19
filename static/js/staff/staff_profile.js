// staff_profile.js - Complete Fixed Version with Signature Integration
$(document).ready(function() {
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        fetchProfileData();
        
        // Profile form functionality
        $('#profile-form').submit(function(e) {
            e.preventDefault();
            
            // Validate files before submission
            if (!validateFiles()) {
                return;
            }

            // Show loading state on submit button
            const $submitBtn = $(this).find('.save-btn');
            const originalText = $submitBtn.html();
            $submitBtn.html('<i class="fas fa-spinner fa-spin"></i> Saving...').prop('disabled', true);
            
            const formData = new FormData(this);

            $.ajax({
                url: updateProfileUrl, 
                type: "POST",
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    // Restore button
                    $submitBtn.html(originalText).prop('disabled', false);
                    
                    if (response.success) {
                        showMessage(response.message, 'success');

                        // Update profile picture if changed
                        if (response.updated_profile && response.updated_profile.profile_picture_url) {
                            $('#profile-preview').attr('src', response.updated_profile.profile_picture_url);
                        }
                        
                        // Update signature if changed
                        if (response.updated_profile && response.updated_profile.signature_url) {
                            $('#signature-preview').attr('src', response.updated_profile.signature_url);
                        }

                        // Clear password fields
                        $('#current_password, #new_password, #confirm_password').val('');
                        
                        // Clear file inputs and reset UI
                        resetFileInputUI();
                        
                    } else {
                        showMessage(response.error || 'Failed to update profile', 'error');
                    }
                },
                error: function(xhr, status, error) {
                    // Restore button
                    $submitBtn.html(originalText).prop('disabled', false);
                    
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
            handleFileUpload(this, 'profile');
        });

        // Remove profile picture
        $('#remove-picture').click(function() {
            resetFileInput('profile_picture', defaultProfilePic, 'profile');
        });

        // Signature preview
        $('#signature').change(function() {
            handleFileUpload(this, 'signature');
        });

        // Remove signature
        $('#remove-signature').click(function() {
            resetFileInput('signature', defaultSignaturePic, 'signature');
        });

        // Toggle password visibility
        $('.toggle-password').click(function() {
            const input = $(this).siblings('input');
            const type = input.attr('type') === 'password' ? 'text' : 'password';
            input.attr('type', type);
            $(this).toggleClass('fa-eye fa-eye-slash');
        });

        // Password strength indicator
        $('#new_password').on('input', function() {
            const password = $(this).val();
            const strength = checkPasswordStrength(password);
            updatePasswordStrengthIndicator(strength);
        });
    }
    
    // Validate files before form submission
    function validateFiles() {
        const profileFile = $('#profile_picture')[0].files[0];
        const signatureFile = $('#signature')[0].files[0];
        
        if (profileFile) {
            const validProfileTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!validProfileTypes.includes(profileFile.type)) {
                showMessage('Profile picture must be JPG or PNG format', 'error');
                return false;
            }
            
            if (profileFile.size > 2 * 1024 * 1024) {
                showMessage('Profile picture size must be less than 2MB', 'error');
                return false;
            }
        }
        
        if (signatureFile) {
            const validSignatureTypes = ['image/png', 'image/jpeg', 'image/jpg'];
            if (!validSignatureTypes.includes(signatureFile.type)) {
                showMessage('Signature must be PNG, JPG, or JPEG format', 'error');
                return false;
            }
            
            if (signatureFile.size > 2 * 1024 * 1024) {
                showMessage('Signature size must be less than 2MB', 'error');
                return false;
            }
        }
        
        return true;
    }
    
    // Handle file upload with UI feedback
    function handleFileUpload(inputElement, type) {
        const file = inputElement.files[0];
        if (!file) return;
        
        const $input = $(inputElement);
        const validTypes = type === 'profile' 
            ? ['image/jpeg', 'image/jpg', 'image/png']
            : ['image/png', 'image/jpeg', 'image/jpg'];
        
        // Validate file type
        if (!validTypes.includes(file.type)) {
            showMessage(`Please upload a ${type === 'profile' ? 'JPG or PNG' : 'PNG, JPG, or JPEG'} file for ${type}`, 'error');
            $input.val('');
            return;
        }
        
        // Validate file size (2MB)
        if (file.size > 2 * 1024 * 1024) {
            showMessage(`${type === 'profile' ? 'Profile picture' : 'Signature'} size must be less than 2MB`, 'error');
            $input.val('');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Update preview image
            if (type === 'profile') {
                $('#profile-preview').attr('src', e.target.result);
            } else {
                $('#signature-preview').attr('src', e.target.result);
            }
            
            // Show file name and success state
            updateFileInputUI($input, file, type);
        };
        
        reader.readAsDataURL(file);
    }
    
    // Update file input UI with file information
    function updateFileInputUI($input, file, type) {
        const $label = $input.closest('.file-input-wrapper').find('label');
        const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
        const fileSize = (file.size / 1024).toFixed(2) + ' KB';
        
        // Update button text with file name
        $label.html(`<i class="fas fa-check-circle"></i> ${fileName}`);
        $label.addClass('upload-success');
        
        // Show file info
        const $fileInfo = $input.closest('.file-input-wrapper').find('.file-name-display');
        const iconClass = type === 'profile' ? 'fa-file-image' : 'fa-signature';
        $fileInfo.html(`<i class="fas ${iconClass}"></i> ${fileSize}`).addClass('show');
    }
    
    // Reset file input
    function resetFileInput(inputId, defaultImage, type) {
        const $input = $(`#${inputId}`);
        $input.val('');
        
        // Reset preview image
        if (type === 'profile') {
            $('#profile-preview').attr('src', defaultImage);
        } else {
            $('#signature-preview').attr('src', defaultImage);
        }
        
        // Reset button text and styling
        const $label = $input.closest('.file-input-wrapper').find('label');
        $label.removeClass('upload-success');
        $label.html(type === 'profile' 
            ? '<i class="fas fa-cloud-upload-alt"></i> Change Picture'
            : '<i class="fas fa-cloud-upload-alt"></i> Upload Signature'
        );
        
        // Hide file info
        $input.closest('.file-input-wrapper').find('.file-name-display').removeClass('show').html('');
    }
    
    // Reset all file input UI after successful submission
    function resetFileInputUI() {
        // Reset profile picture UI
        const $profileLabel = $('#profile_picture').closest('.file-input-wrapper').find('label');
        $profileLabel.removeClass('upload-success');
        $profileLabel.html('<i class="fas fa-cloud-upload-alt"></i> Change Picture');
        $('#profile-file-name').removeClass('show').html('');
        
        // Reset signature UI
        const $signatureLabel = $('#signature').closest('.file-input-wrapper').find('label');
        $signatureLabel.removeClass('upload-success');
        $signatureLabel.html('<i class="fas fa-cloud-upload-alt"></i> Upload Signature');
        $('#signature-file-name').removeClass('show').html('');
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
                    
                    // Rotate chevron icon
                    if (chevron) {
                        chevron.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                    }
                });
            });
            
            // Close mobile nav when clicking on links
            const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
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

        // ===== LOGOUT MODAL FUNCTIONALITY =====
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
            // Get logout URL from multiple possible sources for external compatibility
            const logoutUrl = window.appUrls?.logoutUrl || 
                            document.body.getAttribute('data-logout-url') || 
                            "/logout";
            
            if (logoutUrl) {
                window.location.href = logoutUrl;
            } else {
                console.log('Logout URL not properly configured, using default');
                window.location.href = "/logout";
            }
        });
    }
    
    // Fetch profile data
    function fetchProfileData() {
        $.ajax({
            url: fetchProfileUrl, 
            type: "GET",
            success: function(response) {
                if (response.success) {
                    const staff = response.staff;

                    // Personal Information
                    $('#first_name').val(staff.first_name || '');
                    $('#middle_name').val(staff.middle_name || '');
                    $('#last_name').val(staff.last_name || '');
                    $('#contact_number').val(staff.contact_number || '');
                    $('#date_of_birth').val(staff.date_of_birth || '');
                    $('#gender').val(staff.gender || '');

                    // Account Information
                    $('#username').val(staff.username || '');
                    $('#email').val(staff.email || '');

                    // Address Information
                    $('#province').val(staff.province || '');
                    $('#municipality').val(staff.municipality || '');
                    $('#baranggay').val(staff.baranggay || '');

                    // Profile Picture
                    if (staff.profile_picture_url) {
                        $('#profile-preview').attr('src', staff.profile_picture_url);
                    } else {
                        $('#profile-preview').attr('src', defaultProfilePic);
                    }
                    
                    // Signature
                    if (staff.signature_url) {
                        $('#signature-preview').attr('src', staff.signature_url);
                    } else {
                        $('#signature-preview').attr('src', defaultSignaturePic);
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
        const colors = ['#d9534f', '#f0ad4e', '#5bc0de', '#5cb85c', '#5cb85c'];

        $('.strength-bar').removeClass('active');
        for (let i = 0; i < strength; i++) {
            $('.strength-bar').eq(i).addClass('active').css('background-color', colors[strength]);
        }

        $('.strength-text span').text(strengthTexts[strength]).css('color', colors[strength]);
    }

    function showMessage(message, type) {
        const messageDiv = $('#message-content');
        messageDiv.text(message).removeClass().addClass('message ' + type);
        $('#message-container').fadeIn();

        setTimeout(function() {
            $('#message-container').fadeOut();
        }, 5000);
    }

    // Initialize everything
    init();
});