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
    initModals(); // Initialize modal functionality
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
            // Check file size (max 10MB)
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
    
    // Signature handling - UPDATED with status awareness
    $('#signature').change(function () {
        const file = this.files[0];
        if (!file) return;

        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showMessage('error', 'File size exceeds 10MB limit');
            this.value = '';
            return;
        }

        // Check file type
        if (!['image/png','image/jpeg','image/jpg'].includes(file.type)) {
            showMessage('error', 'Signature must be PNG or JPG');
            this.value = '';
            return;
        }

        // Show warning about status reset if signature already exists
        const currentStatus = $('#signatureStatusBadge').data('status');
        if (currentStatus && currentStatus !== 'none') {
            Swal.fire({
                title: 'Reset Verification Status?',
                text: 'Uploading a new signature will reset your verification status to "Pending". You will need to wait for admin approval again.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#003366',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, upload anyway',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    proceedWithSignatureUpload(file);
                } else {
                    $('#signature').val('');
                }
            });
        } else {
            proceedWithSignatureUpload(file);
        }
    });
    
    // Remove signature
    $('#remove-signature').click(function() {
        const currentStatus = $('#signatureStatusBadge').data('status');
        
        if (currentStatus && currentStatus !== 'none') {
            Swal.fire({
                title: 'Remove Signature?',
                text: 'Removing your signature will require you to upload a new one and go through verification again.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#b91c1c',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Yes, remove',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    $('#signature').val('');
                    $('#signature-preview').attr('src', defaultSignaturePic);
                    updateSignatureStatus('none', 'No signature uploaded', 
                        'You haven\'t uploaded a signature yet. Please upload your e-signature for document verification.');
                    showMessage('info', 'Signature removed. Remember to save changes.');
                }
            });
        } else {
            $('#signature').val('');
            $('#signature-preview').attr('src', defaultSignaturePic);
            updateSignatureStatus('none', 'No signature uploaded', 
                'You haven\'t uploaded a signature yet. Please upload your e-signature for document verification.');
            showMessage('info', 'Signature removed. Remember to save changes.');
        }
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
                        
                        // Show additional message if signature was updated
                        if (response.signature_updated) {
                            setTimeout(() => {
                                Swal.fire({
                                    icon: 'info',
                                    title: 'Signature Updated',
                                    text: 'Your signature has been uploaded and is now pending admin verification.',
                                    confirmButtonColor: '#003366'
                                });
                            }, 500);
                        }
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
}

// Helper function to proceed with signature upload
function proceedWithSignatureUpload(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        $('#signature-preview').attr('src', e.target.result);
        // Update status to pending temporarily (will be confirmed on save)
        updateSignatureStatus('pending', 'Pending Verification', 
            'Your signature will be pending verification after you save changes.');
    };
    reader.readAsDataURL(file);
}

// Load profile data on page load
function loadProfileData() {
    // Show loading state
    $('#profile-form').addClass('loading');
    
    $.ajax({
        url: fetchProfileUrl,
        type: 'GET',
        success: function(response) {
            if (response.success && response.staff) {
                updateFormFields(response.staff);
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

// Update form fields with profile data
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
        $('#nav-profile-pic').attr('src', profileData.profile_picture_url);
    } else {
        $('#profile-preview').attr('src', defaultProfilePic);
        $('#nav-profile-pic').attr('src', defaultProfilePic);
    }
    
    // Update signature with status
    if (profileData.signature_url) {
        $('#signature-preview').attr('src', profileData.signature_url);
    } else {
        $('#signature-preview').attr('src', defaultSignaturePic);
    }
    
    // Update signature status display
    if (profileData.signature_status) {
        updateSignatureStatus(
            profileData.signature_status,
            profileData.signature_status_text,
            profileData.signature_status_description
        );
    }
}

// Update signature status UI
function updateSignatureStatus(status, statusText, description) {
    const badge = $('#signatureStatusBadge');
    const frame = $('#signatureFrame');
    const descriptionDiv = $('#signatureStatusDescription');
    const warningDiv = $('#signatureWarning');
    const warningMessage = $('#warningMessage');
    const uploadBtn = $('#signatureUploadBtn');
    
    // Remove all status classes
    badge.removeClass('status-none status-pending status-verified status-rejected');
    frame.removeClass('status-none status-pending status-verified status-rejected');
    
    // Add appropriate class
    badge.addClass(`status-${status}`);
    frame.addClass(`status-${status}`);
    
    // Update badge text and icon
    badge.find('.status-text').text(statusText);
    
    // Store status in data attribute
    badge.data('status', status);
    
    // Show badge
    badge.show();
    
    // Update description
    descriptionDiv.text(description).show();
    
    // Handle warnings and upload button state based on status
    if (status === 'pending') {
        warningMessage.text('Your signature is pending approval. Uploading a new signature will reset this status.');
        warningDiv.show();
        uploadBtn.removeClass('disabled');
    } else if (status === 'verified') {
        warningMessage.text('Your signature is verified. Uploading a new signature will reset it to pending status.');
        warningDiv.show();
        uploadBtn.removeClass('disabled');
    } else if (status === 'rejected') {
        warningMessage.text('Your signature was rejected. Please upload a new signature following the guidelines.');
        warningDiv.show();
        uploadBtn.removeClass('disabled');
    } else {
        warningDiv.hide();
        uploadBtn.removeClass('disabled');
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