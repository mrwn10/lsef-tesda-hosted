$(document).ready(function() {
    // Initialize all functionality
    init();
    
    // Load profile data on page load
    loadProfileData();
});

// Initialize all functionality
function init() {
    initMobileNavigation();
    initEventListeners();
    initModals();
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

// Initialize modal functionality
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

// Initialize event listeners
function initEventListeners() {
    // Profile picture handling
    $('#profile_picture').change(function() {
        const file = this.files[0];
        if (file) {
            // Check file size (max 10MB to match backend)
            if (file.size > 10 * 1024 * 1024) {
                showMessage('error', 'File size exceeds 10MB limit');
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
    
    // FIXED: Signature handling with better preview
    $('#signature').change(function () {
        const file = this.files[0];
        if (!file) return;

        if (!['image/png','image/jpeg','image/jpg'].includes(file.type)) {
            showMessage('error', 'Signature must be PNG or JPG');
            this.value = '';
            return;
        }

        // Check file size
        if (file.size > 10 * 1024 * 1024) {
            showMessage('error', 'Signature file size exceeds 10MB limit');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            // FIXED: Set src directly without any constraints
            $('#signature-preview').attr('src', e.target.result);
            
            // FIXED: Add a small delay to ensure image loads
            setTimeout(() => {
                // Check if image loaded successfully
                const img = $('#signature-preview')[0];
                if (img.complete && img.naturalHeight !== 0) {
                    console.log('Signature image loaded successfully');
                } else {
                    img.onload = function() {
                        console.log('Signature image loaded after onload event');
                    };
                    img.onerror = function() {
                        console.error('Failed to load signature image');
                        showMessage('error', 'Failed to preview signature image');
                        $('#signature').val('');
                        $('#signature-preview').attr('src', defaultSignaturePic);
                    };
                }
            }, 100);
        };
        reader.onerror = function() {
            showMessage('error', 'Failed to read signature file');
            this.value = '';
        };
        reader.readAsDataURL(file);
    });
    
    // Remove signature
    $('#remove-signature').click(function() {
        $('#signature').val('');
        $('#signature-preview').attr('src', defaultSignaturePic);
        showMessage('info', 'Signature removed. Remember to save changes.');
    });
    
    // Show/hide password
    $('.toggle-password').click(function() {
        const input = $(this).siblings('input');
        const type = input.attr('type') === 'password' ? 'text' : 'password';
        input.attr('type', type);
        $(this).toggleClass('fa-eye fa-eye-slash');
    });
    
    // Password strength indicator
    $('#new_password').on('input', function() {
        const password = $(this).val();
        let strength = 0;
        let text = '';
        
        if (password.length > 0) {
            if (password.length >= 8) strength++;
            if (/[A-Z]/.test(password)) strength++;
            if (/[0-9]/.test(password)) strength++;
            if (/[^A-Za-z0-9]/.test(password)) strength++;
            
            const strengthText = ['Very Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
            text = strengthText[strength];
            
            $('.strength-meter .strength-bar').removeClass('active');
            for (let i = 0; i < strength; i++) {
                $('.strength-bar').eq(i).addClass('active');
            }
            
            $('.strength-text span').text(text);
        } else {
            $('.strength-meter .strength-bar').removeClass('active');
            $('.strength-text span').text('None');
        }
    });
    
    // Form submission
    $('#profile-form').on('submit', function(e) {
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
        $('.save-btn').html('<i class="fas fa-spinner fa-spin"></i> Saving...');
        
        let formData = new FormData(this);
        
        $.ajax({
            url: updateProfileUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    showMessage('success', response.message);
                    if (response.updated_profile) {
                        updateFormFields(response.updated_profile);
                    }
                    // Clear password fields after successful update
                    $('#current_password').val('');
                    $('#new_password').val('');
                    $('#confirm_password').val('');
                    // Clear file inputs
                    $('#profile_picture').val('');
                    $('#signature').val('');
                } else {
                    showMessage('error', response.error || 'Update failed');
                }
                $('#profile-form').removeClass('loading');
                $('.save-btn').html('<i class="fas fa-save"></i> Save Changes');
            },
            error: function(xhr) {
                let errorMsg = 'An error occurred while updating your profile';
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMsg = xhr.responseJSON.error;
                } else if (xhr.statusText) {
                    errorMsg = xhr.statusText;
                }
                showMessage('error', errorMsg);
                $('#profile-form').removeClass('loading');
                $('.save-btn').html('<i class="fas fa-save"></i> Save Changes');
            }
        });
    });
}

// Load profile data on page load
function loadProfileData() {
    // Show loading state
    $('#profile-form').addClass('loading');
    
    $.ajax({
        url: fetchProfileUrl,
        type: 'GET',
        success: function(response) {
            if (response.success && response.admin) {
                updateFormFields(response.admin);
            } else {
                showMessage('error', response.error || 'Failed to load profile data');
            }
            $('#profile-form').removeClass('loading');
        },
        error: function(xhr) {
            showMessage('error', 'Failed to load profile data. Please try again later.');
            $('#profile-form').removeClass('loading');
        }
    });
}

function updateFormFields(profileData) {
    $('#username').val(profileData.username || '');
    $('#email').val(profileData.email || '');
    $('#first_name').val(profileData.first_name || '');
    $('#middle_name').val(profileData.middle_name || '');
    $('#last_name').val(profileData.last_name || '');
    $('#contact_number').val(profileData.contact_number || '');
    $('#province').val(profileData.province || '');
    $('#municipality').val(profileData.municipality || '');
    $('#baranggay').val(profileData.baranggay || '');
    $('#date_of_birth').val(profileData.date_of_birth || '');
    $('#gender').val(profileData.gender || '');
    
    // Update profile picture
    if (profileData.profile_picture_url) {
        // FIXED: Ensure absolute URL for profile picture
        const profilePicUrl = profileData.profile_picture_url.startsWith('http') 
            ? profileData.profile_picture_url 
            : window.location.origin + profileData.profile_picture_url;
        
        $('#profile-preview').attr('src', profilePicUrl);
        $('#nav-profile-pic').attr('src', profilePicUrl);
    } else {
        $('#profile-preview').attr('src', defaultProfilePic);
        $('#nav-profile-pic').attr('src', defaultProfilePic);
    }
    
    // FIXED: Update signature with better handling
    if (profileData.signature_url) {
        // Ensure absolute URL for signature
        const signatureUrl = profileData.signature_url.startsWith('http') 
            ? profileData.signature_url 
            : window.location.origin + profileData.signature_url;
        
        $('#signature-preview').attr('src', signatureUrl);
        
        // Add error handling for signature image
        $('#signature-preview').on('error', function() {
            console.error('Failed to load signature image from:', signatureUrl);
            $(this).attr('src', defaultSignaturePic);
        });
        
        // Force image reload
        $('#signature-preview')[0].src = signatureUrl;
    } else {
        $('#signature-preview').attr('src', defaultSignaturePic);
    }
}

// SweetAlert2 Message Handling
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