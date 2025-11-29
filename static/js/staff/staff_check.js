// staff_check_submissions.js - Simple version like materials page

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initMobileNavigation();
    initializeProgressBar();
    setupModalEvents(); // Simple modal setup
});

// Mobile Navigation - SAME AS BEFORE
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
        
        const mobileNavHeaders = document.querySelectorAll('.mobile-nav-header-link');
        mobileNavHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const section = this.getAttribute('data-section');
                const submenu = document.getElementById(`${section}-submenu`);
                const chevron = this.querySelector('.chevron-icon');
                
                this.classList.toggle('active');
                
                if (submenu) {
                    submenu.classList.toggle('active');
                }
                
                if (chevron) {
                    chevron.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                }
            });
        });
        
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        });
    }
}

// SIMPLE MODAL SYSTEM - LIKE MATERIALS PAGE
function setupModalEvents() {
    // Open logout modal - DESKTOP
    const logoutTrigger = document.getElementById('logout-trigger');
    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            openModal('logout-modal');
        });
    }
    
    // Open logout modal - MOBILE
    const mobileLogoutTrigger = document.getElementById('mobile-logout-trigger');
    if (mobileLogoutTrigger) {
        mobileLogoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            // Close mobile nav first
            const mobileNav = document.getElementById('mobileNav');
            if (mobileNav) {
                mobileNav.classList.remove('active');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
            // Then open logout modal
            setTimeout(() => {
                openModal('logout-modal');
            }, 10);
        });
    }
    
    // Close logout modal - Cancel button
    const cancelLogout = document.getElementById('cancel-logout');
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('logout-modal');
        });
    }
    
    // Close logout modal - X button
    const closeLogoutModal = document.getElementById('close-logout-modal');
    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('logout-modal');
        });
    }
    
    // Confirm logout
    const confirmLogout = document.getElementById('confirm-logout');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function(e) {
            e.preventDefault();
            const logoutUrl = document.body.getAttribute('data-logout-url');
            if (logoutUrl) {
                window.location.href = logoutUrl;
            }
        });
    }
    
    // Close preview modal
    const closePreviewModal = document.getElementById('close-preview-modal');
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', function(e) {
            e.preventDefault();
            closePreview();
        });
    }
    
    // Close success modal
    const closeSuccessModal = document.getElementById('closeSuccessModal');
    if (closeSuccessModal) {
        closeSuccessModal.addEventListener('click', function() {
            closeModal('successModal');
        });
    }
    
    const closeSuccessModalBtn = document.getElementById('close-success-modal');
    if (closeSuccessModalBtn) {
        closeSuccessModalBtn.addEventListener('click', function() {
            closeModal('successModal');
        });
    }
    
    // Close modal when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });
    
    // Close modal with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

// SIMPLE MODAL FUNCTIONS
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

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
}

// Progress bar - SAME AS BEFORE
function initializeProgressBar() {
    const progressBar = document.getElementById('submission-progress-bar');
    const submissionRateText = document.getElementById('submission-rate-text');
    
    if (progressBar && submissionRateText) {
        const submissionRate = parseFloat(submissionRateText.textContent);
        progressBar.style.width = '0%';
        
        setTimeout(() => {
            progressBar.style.transition = 'width 1s ease-in-out';
            progressBar.style.width = submissionRate + '%';
        }, 300);
    }
}

// Preview modal - SAME AS BEFORE
function openPreview(storedFilename, originalFilename, studentName) {
    const modal = document.getElementById('previewModal');
    const previewContent = document.getElementById('previewContent');
    const fileTypeInfo = document.getElementById('fileTypeInfo');
    const downloadLink = document.getElementById('downloadLink');
    
    document.getElementById('previewFileName').textContent = originalFilename;
    document.getElementById('previewStudentName').textContent = studentName;
    
    downloadLink.href = `/static/uploads/student_submissions/${storedFilename}`;
    previewContent.innerHTML = '';
    
    const fileExt = storedFilename.split('.').pop().toLowerCase();
    
    if (fileExt === 'pdf') {
        fileTypeInfo.innerHTML = '<i class="fas fa-file-pdf me-1 text-danger"></i> PDF Document';
        previewContent.innerHTML = `
            <iframe src="/static/uploads/student_submissions/${storedFilename}" 
                    class="preview-iframe" 
                    frameborder="0">
            </iframe>
        `;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExt)) {
        fileTypeInfo.innerHTML = '<i class="fas fa-file-image me-1 text-success"></i> Image File';
        previewContent.innerHTML = `
            <img src="/static/uploads/student_submissions/${storedFilename}" 
                 alt="${originalFilename}" 
                 class="preview-image">
        `;
    } else {
        fileTypeInfo.innerHTML = `<i class="fas fa-file me-1 text-primary"></i> ${fileExt.toUpperCase()} File`;
        previewContent.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-file text-muted" style="font-size: 4rem;"></i>
                <h4 class="mt-3">Preview Not Available</h4>
                <p class="text-muted">Please download the file to view it.</p>
            </div>
        `;
    }
    
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}

function closePreview() {
    closeModal('previewModal');
}

function initializePage() {
    // Any other page initialization
}

// Loading and success modals - SAME AS BEFORE
function showLoadingScreen(message) {
    const loadingMessage = document.getElementById('loading-message');
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingMessage) loadingMessage.textContent = message;
    if (loadingScreen) loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}

function showSuccessModal(message) {
    const successMessage = document.getElementById('successMessage');
    const successModal = document.getElementById('successModal');
    if (successMessage) successMessage.textContent = message;
    if (successModal) {
        successModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
}