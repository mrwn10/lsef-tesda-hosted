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

    // Modal Functions
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
            
            // Force reflow for mobile devices
            void modal.offsetHeight;
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

    // Hide modal when cancel is clicked
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
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
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Handle logout confirmation
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
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal && logoutModal.style.display === 'flex') {
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // ===== FILE PREVIEW MODAL FUNCTIONALITY - FIXED FOR DYNAMIC CONTENT =====
    const previewModal = document.getElementById('preview-modal');
    const closePreviewModal = document.getElementById('close-preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const downloadPreviewBtn = document.getElementById('download-preview-btn');
    const previewContent = document.getElementById('preview-content');

    // FIXED: Use event delegation on the document for preview buttons
    // This works for both Announcements and Classwork sections
    document.addEventListener('click', function(e) {
        // Handle preview buttons in both sections
        if (e.target.classList.contains('preview-btn') || e.target.closest('.preview-btn')) {
            const previewBtn = e.target.classList.contains('preview-btn') ? e.target : e.target.closest('.preview-btn');
            const fileUrl = previewBtn.getAttribute('data-file-url');
            const fileType = previewBtn.getAttribute('data-file-type');
            const fileName = previewBtn.getAttribute('data-file-name');
            
            openFilePreview(fileUrl, fileType, fileName);
        }
    });

    // FIXED: Add touch events for mobile preview buttons using event delegation
    document.addEventListener('touchend', function(e) {
        if (e.target.classList.contains('preview-btn') || e.target.closest('.preview-btn')) {
            const previewBtn = e.target.classList.contains('preview-btn') ? e.target : e.target.closest('.preview-btn');
            const fileUrl = previewBtn.getAttribute('data-file-url');
            const fileType = previewBtn.getAttribute('data-file-type');
            const fileName = previewBtn.getAttribute('data-file-name');
            
            e.preventDefault();
            openFilePreview(fileUrl, fileType, fileName);
        }
    }, { passive: false });

    function openFilePreview(fileUrl, fileType, fileName) {
        // Set download link
        downloadPreviewBtn.href = fileUrl;
        downloadPreviewBtn.download = fileName;
        
        // Clear previous content
        previewContent.innerHTML = '';
        
        // Create appropriate preview based on file type
        if (fileType === 'pdf') {
            const iframe = document.createElement('iframe');
            iframe.src = fileUrl + '#toolbar=0';
            iframe.className = 'preview-iframe';
            iframe.setAttribute('frameborder', '0');
            previewContent.appendChild(iframe);
        } 
        else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType)) {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.alt = 'File Preview';
            img.className = 'preview-image';
            previewContent.appendChild(img);
        }
        else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)) {
            const placeholder = document.createElement('div');
            placeholder.className = 'preview-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-file"></i>
                <h4>Preview Not Available</h4>
                <p>Preview is not available for ${fileType.toUpperCase()} files.</p>
                <p>Please download the file to view it.</p>
            `;
            previewContent.appendChild(placeholder);
        }
        else {
            const placeholder = document.createElement('div');
            placeholder.className = 'preview-placeholder';
            placeholder.innerHTML = `
                <i class="fas fa-file"></i>
                <h4>Preview Not Available</h4>
                <p>File preview is not available for this file type.</p>
                <p>Please download the file to view it.</p>
            `;
            previewContent.appendChild(placeholder);
        }
        
        // Open the modal
        openModal('preview-modal');
    }

    // Close preview modal events
    if (closePreviewModal) {
        closePreviewModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('preview-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    if (closePreviewBtn) {
        closePreviewBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('preview-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Close preview modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === previewModal) {
            closeModal('preview-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // Close preview modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && previewModal && previewModal.style.display === 'flex') {
            closeModal('preview-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // ===== TAB NAVIGATION - FIXED TO REINITIALIZE EVENT LISTENERS =====
    const navTabs = document.querySelectorAll('.nav-tab');
    const resourceSections = document.querySelectorAll('.resources-section');

    function switchToTab(tabElement) {
        // Remove active class from all tabs and sections
        navTabs.forEach(t => t.classList.remove('active'));
        resourceSections.forEach(s => s.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding section
        tabElement.classList.add('active');
        const targetSection = document.getElementById(tabElement.dataset.tab);
        if (targetSection) {
            targetSection.classList.add('active');
            
            // FIXED: Reinitialize any necessary event listeners for the newly shown section
            setTimeout(() => {
                initializeSectionEvents(targetSection.id);
            }, 50);
        }
    }

    // Initialize event listeners for a specific section
    function initializeSectionEvents(sectionId) {
        if (sectionId === 'classwork') {
            // Any Classwork-specific event listeners can be added here
            console.log('Classwork section initialized');
        } else if (sectionId === 'announcements') {
            // Any Announcements-specific event listeners can be added here
            console.log('Announcements section initialized');
        }
    }

    // Set up tab click events
    navTabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            switchToTab(this);
        });
        
        // Add touch events for mobile tab navigation
        tab.addEventListener('touchend', function(e) {
            e.preventDefault();
            switchToTab(this);
        }, { passive: false });
    });

    // FIXED: Initialize events for the initially active section
    initializeSectionEvents('announcements');

    // ===== ENHANCED EVENT DELEGATION FOR ALL INTERACTIVE ELEMENTS =====
    
    // Handle all download buttons in both sections
    document.addEventListener('click', function(e) {
        // Download buttons in resource cards
        if (e.target.classList.contains('download-btn') || e.target.closest('.download-btn')) {
            const downloadBtn = e.target.classList.contains('download-btn') ? e.target : e.target.closest('.download-btn');
            // Let the native download behavior handle it
            console.log('Download button clicked');
        }
        
        // Small download buttons in file placeholders
        if (e.target.classList.contains('download-btn-small') || e.target.closest('.download-btn-small')) {
            const downloadBtn = e.target.classList.contains('download-btn-small') ? e.target : e.target.closest('.download-btn-small');
            // Let the native download behavior handle it
            console.log('Small download button clicked');
        }
        
        // Submit work buttons in classwork
        if (e.target.classList.contains('submit-btn') || e.target.closest('.submit-btn')) {
            const submitBtn = e.target.classList.contains('submit-btn') ? e.target : e.target.closest('.submit-btn');
            // Let the native link behavior handle it
            console.log('Submit work button clicked');
        }
    });

    // Enhanced touch events for mobile
    document.addEventListener('touchend', function(e) {
        // Download buttons
        if (e.target.classList.contains('download-btn') || e.target.closest('.download-btn')) {
            console.log('Mobile download button tapped');
        }
        
        // Small download buttons
        if (e.target.classList.contains('download-btn-small') || e.target.closest('.download-btn-small')) {
            console.log('Mobile small download button tapped');
        }
        
        // Submit work buttons
        if (e.target.classList.contains('submit-btn') || e.target.closest('.submit-btn')) {
            console.log('Mobile submit work button tapped');
        }
        
        // Preview buttons (already handled above, but included for completeness)
        if (e.target.classList.contains('preview-btn') || e.target.closest('.preview-btn')) {
            // Already handled in the preview button section above
        }
    }, { passive: false });

    // Auto-hide flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.remove();
            }, 500);
        }, 5000);
    });

    // Initialize page functionality
    initializeResourcesPage();
});

// Resources Page Specific Functionality
function initializeResourcesPage() {
    console.log('Student Resources page initialized');
    
    // Add any resources-specific JavaScript here
    // For example: file preview enhancements, search functionality, etc.
    
    // Example: Enhance file preview interactions
    enhanceFilePreviews();
}

function enhanceFilePreviews() {
    // Add any file preview enhancement logic here
    // This is a placeholder for future functionality
}