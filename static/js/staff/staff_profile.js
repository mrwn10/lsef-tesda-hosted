// staff_profile.js - Complete Fixed Version with External Logout Modal Support
$(document).ready(function() {
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        fetchProfileData();
        
        // Profile form functionality
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

                        if (response.updated_profile && response.updated_profile.profile_picture_url) {
                            $('#profile-preview').attr('src', response.updated_profile.profile_picture_url);
                        }

                        $('#current_password, #new_password, #confirm_password').val('');
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

        $('#remove-picture').click(function() {
            $('#profile_picture').val('');
            $('#profile-preview').attr('src', defaultProfilePic);
        });

        $('.toggle-password').click(function() {
            const input = $(this).siblings('input');
            const type = input.attr('type') === 'password' ? 'text' : 'password';
            input.attr('type', type);
            $(this).toggleClass('fa-eye fa-eye-slash');
        });

        $('#new_password').on('input', function() {
            const password = $(this).val();
            const strength = checkPasswordStrength(password);
            updatePasswordStrengthIndicator(strength);
        });
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
    
    // Initialize all modal functionality - NOW EXTERNAL FRIENDLY
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

        // Logout Modal - NOW EXTERNAL FRIENDLY
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
                            "{{ url_for('login.logout') }}" || 
                            "/logout";
            
            if (logoutUrl && logoutUrl !== "{{ url_for('login.logout') }}") {
                // Valid URL found
                window.location.href = logoutUrl;
            } else {
                // Fallback to default logout
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

                    $('#first_name').val(staff.first_name || '');
                    $('#middle_name').val(staff.middle_name || '');
                    $('#last_name').val(staff.last_name || '');
                    $('#contact_number').val(staff.contact_number || '');
                    $('#date_of_birth').val(staff.date_of_birth || '');
                    $('#gender').val(staff.gender || '');

                    $('#username').val(staff.username || '');
                    $('#email').val(staff.email || '');

                    $('#province').val(staff.province || '');
                    $('#municipality').val(staff.municipality || '');
                    $('#baranggay').val(staff.baranggay || '');

                    if (staff.profile_picture_url) {
                        $('#profile-preview').attr('src', staff.profile_picture_url);
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