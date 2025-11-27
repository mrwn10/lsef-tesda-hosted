// Hamburger menu functionality
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const closeMenu = document.getElementById('closeMenu');

// Initialize menu functionality
function initMenu() {
    // Open mobile menu
    hamburger.addEventListener('click', () => {
        navMenu.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
    });
    
    // Close mobile menu
    closeMenu.addEventListener('click', () => {
        navMenu.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
    
    // Close menu when clicking on a link
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPath = new URL(link.href).pathname;
        if (currentPath === linkPath || 
           (currentPath === '/' && linkPath.includes('landing')) ||
           (currentPath.includes('program') && linkPath.includes('program')) ||
           (currentPath.includes('verify') && linkPath.includes('verify')) ||
           (currentPath.includes('register') && linkPath.includes('register')) ||
           (currentPath.includes('login') && linkPath.includes('login'))) {
            link.classList.add('active');
        }
    });
}

// Smooth scrolling for anchor links
function initSmoothScrolling() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Add loading state to buttons
function initButtonLoading() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (this.href && !this.classList.contains('btn-loading')) {
                this.classList.add('btn-loading');
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
                
                // Remove loading state after navigation (if navigation happens)
                setTimeout(() => {
                    this.classList.remove('btn-loading');
                    this.innerHTML = this.getAttribute('data-original-text') || this.innerHTML;
                }, 3000);
            }
        });
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initMenu();
    setActiveNavLink();
    initSmoothScrolling();
    initButtonLoading();
    
    // Add any additional initialization here
    console.log('TESDA LSEF Landing Page initialized');
});

// Utility function for adding active states (can be used by other scripts)
function updateActiveState(endpoint) {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(endpoint)) {
            link.classList.add('active');
        }
    });
}

// Export functions for use in other modules (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initMenu,
        setActiveNavLink,
        initSmoothScrolling,
        initButtonLoading,
        updateActiveState
    };
}