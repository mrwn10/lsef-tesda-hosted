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

    // Modal Functions - PERFECTLY MATCHED
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
            // Only reset overflow if no other modals are open
            if (!document.querySelector('.modal[style*="display: flex"]')) {
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        }
    }

    // Logout Modal Handling - PERFECTLY MATCHED
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

    // Show modal when logout is clicked (mobile) - PERFECTLY FIXED
    if (mobileLogoutTrigger) {
        mobileLogoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // First close mobile nav properly
            if (mobileNav) {
                mobileNav.classList.remove('active');
            }
            // Then open logout modal
            setTimeout(() => {
                openModal('logout-modal');
            }, 10);
        });
    }

    // Hide modal when cancel is clicked - PERFECTLY FIXED
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Hide modal when close button is clicked
    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Handle logout confirmation - PERFECTLY FIXED
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get the logout URL from the data attribute
            const logoutUrl = document.body.getAttribute('data-logout-url');
            if (logoutUrl) {
                window.location.href = logoutUrl;
            } else {
                console.error('Logout URL not found');
                // Fallback to a default URL if needed
                window.location.href = "/logout";
            }
        });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal && logoutModal.style.display === 'flex') {
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // Initialize any additional functionality for this page
    console.log('Student Class View initialized');
});