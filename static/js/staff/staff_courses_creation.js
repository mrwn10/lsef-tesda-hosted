// staff_courses_creation.js - Complete Fixed Version with All Modal Features
$(document).ready(function() {
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        setActiveNavigation();
        initCourseForm();
    }
    
    // Set active navigation based on current page
    function setActiveNavigation() {
        const currentPath = window.location.pathname;
        
        // Remove active class from all navigation links
        $('.top-nav a, .mobile-nav-links a, .mobile-nav-submenu a').removeClass('active');
        
        // Set active class based on current path
        if (currentPath.includes('staff_courses_creation')) {
            $('.top-nav a[href*="staff_courses_creation"]').addClass('active');
            $('.mobile-nav-submenu a[href*="staff_courses_creation"]').addClass('active');
        } else if (currentPath.includes('staff_homepage') || currentPath === '/') {
            $('.top-nav a[href*="staff_homepage"]').addClass('active');
            $('.mobile-nav-links a[href*="staff_homepage"]').addClass('active');
        } else if (currentPath.includes('staff_class_management')) {
            $('.top-nav a[href*="staff_class_management"]').addClass('active');
            $('.mobile-nav-submenu a[href*="staff_class_management"]').addClass('active');
        } else if (currentPath.includes('staff_materials')) {
            $('.top-nav a[href*="staff_materials"]').addClass('active');
            $('.mobile-nav-links a[href*="staff_materials"]').addClass('active');
        }
        
        // Set active subnav
        $('.courses-subnav a').removeClass('active');
        if (currentPath.includes('staff_courses_creation')) {
            $('.courses-subnav a[href*="staff_courses_creation"]').addClass('active');
        } else if (currentPath.includes('staff_courses_edit_req')) {
            $('.courses-subnav a[href*="staff_courses_edit_req"]').addClass('active');
        } else if (currentPath.includes('staff_courses_view')) {
            $('.courses-subnav a[href*="staff_courses_view"]').addClass('active');
        }
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
                document.body.classList.add('modal-open');
            });
            
            if (closeMobileNav) {
                closeMobileNav.addEventListener('click', function() {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
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
                    document.body.classList.remove('modal-open');
                });
            });
            
            // Close mobile nav when clicking outside
            document.addEventListener('click', function(e) {
                if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
                }
            });
            
            // Close mobile nav with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
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

        // Success Modal
        $('#closeSuccessModal').click(function() {
            closeAllModals();
        });

        $('#close-success-modal').click(function() {
            closeAllModals();
        });
    }
    
    // Show loading screen
    function showLoadingScreen(message) {
        $('#loading-message').text(message);
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }
    
    // Show success modal
    function showSuccessModal(message) {
        $('#successMessage').text(message);
        $('#successModal').fadeIn();
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
    
    // Initialize course form functionality
    function initCourseForm() {
        const courseForm = document.getElementById('courseForm');
        
        if (courseForm) {
            courseForm.addEventListener('submit', async function(e) {
                e.preventDefault();

                const form = e.target;
                const formData = new FormData(form);
                const data = {};
                formData.forEach((value, key) => data[key] = value);

                // Required fields validation
                if (!data.course_code || !data.course_title || !data.course_description || 
                    !data.course_category || !data.target_audience || !data.duration_hours) {
                    Swal.fire('Missing Field', 'Please fill all required fields.', 'warning');
                    return;
                }

                // Type conversion
                data.duration_hours = parseInt(data.duration_hours);
                data.course_fee = data.course_fee ? parseFloat(data.course_fee) : 0.00;
                data.max_students = data.max_students ? parseInt(data.max_students) : null;
                data.published = parseInt(data.published);
                data.created_by = parseInt(data.created_by); // Ensure created_by is an integer

                try {
                    showLoadingScreen('Creating course...');
                    
                    const response = await fetch('/staff/create_course', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    const result = await response.json();
                    hideLoadingScreen();

                    if (result.status === 'success') {
                        showSuccessModal(result.message || 'Course created successfully!');
                        
                        // Reset form after successful submission
                        setTimeout(() => {
                            form.reset();
                        }, 500);
                    } else {
                        Swal.fire('Error', result.message, 'error');
                    }

                } catch (error) {
                    hideLoadingScreen();
                    Swal.fire('Error', 'Request failed: ' + error, 'error');
                }
            });
        }
    }
    
    // Initialize everything
    init();
});