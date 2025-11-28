$(document).ready(function() {
    // Initialize all functionality
    init();
    
    // Load profile data on page load
    loadProfileData();
});

// Initialize all functionality
function init() {
    initMobileNavigation();
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
}

// Load profile data on page load
function loadProfileData() {
    // Show loading state
    $('#profile-form').addClass('loading');
    
    $.ajax({
        url: '/admin/profile',
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
        $('#profile-preview').attr('src', profileData.profile_picture_url);
    } else {
        $('#profile-preview').attr('src', defaultProfilePic);
    }
}

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

$('#remove-picture').click(function() {
    $('#profile_picture').val('');
    $('#profile-preview').attr('src', defaultProfilePic);
    showMessage('info', 'Profile picture removed. Remember to save changes.');
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