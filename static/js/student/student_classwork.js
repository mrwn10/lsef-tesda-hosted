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

    // ===== FILE PREVIEW MODAL FUNCTIONALITY =====
    const previewModal = document.getElementById('preview-modal');
    const closePreviewModal = document.getElementById('close-preview-modal');
    const closePreviewBtn = document.getElementById('close-preview-btn');
    const downloadPreviewBtn = document.getElementById('download-preview-btn');
    const previewContent = document.getElementById('preview-content');

    // Preview button event listeners for both classwork files and submission files
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('preview-btn') || e.target.closest('.preview-btn') ||
            e.target.classList.contains('preview-btn-small') || e.target.closest('.preview-btn-small')) {
            
            const previewBtn = e.target.classList.contains('preview-btn') || e.target.classList.contains('preview-btn-small') 
                ? e.target 
                : e.target.closest('.preview-btn') || e.target.closest('.preview-btn-small');
            
            const fileUrl = previewBtn.getAttribute('data-file-url');
            const fileType = previewBtn.getAttribute('data-file-type');
            const fileName = previewBtn.getAttribute('data-file-name');
            
            openFilePreview(fileUrl, fileType, fileName);
        }
    });

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
            iframe.style.width = '100%';
            iframe.style.height = '500px';
            previewContent.appendChild(iframe);
        } 
        else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType)) {
            const img = document.createElement('img');
            img.src = fileUrl;
            img.alt = 'File Preview';
            img.className = 'preview-image';
            img.style.maxWidth = '100%';
            img.style.maxHeight = '500px';
            previewContent.appendChild(img);
        }
        else if (['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileType)) {
            const placeholder = document.createElement('div');
            placeholder.className = 'preview-placeholder';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '40px 20px';
            placeholder.innerHTML = `
                <i class="fas fa-file" style="font-size: 4rem; color: #6c757d; margin-bottom: 20px;"></i>
                <h4>Preview Not Available</h4>
                <p>Preview is not available for ${fileType.toUpperCase()} files.</p>
                <p>Please download the file to view it.</p>
            `;
            previewContent.appendChild(placeholder);
        }
        else {
            const placeholder = document.createElement('div');
            placeholder.className = 'preview-placeholder';
            placeholder.style.textAlign = 'center';
            placeholder.style.padding = '40px 20px';
            placeholder.innerHTML = `
                <i class="fas fa-file" style="font-size: 4rem; color: #6c757d; margin-bottom: 20px;"></i>
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

    // Form submission enhancement
    const submissionForm = document.getElementById('submissionForm');
    if (submissionForm) {
        submissionForm.addEventListener('submit', function(e) {
            const fileInput = document.getElementById('submission');
            if (fileInput && fileInput.files.length > 0) {
                // Add loading state to submit button
                const submitBtn = this.querySelector('#submitBtn');
                const originalText = submitBtn.innerHTML;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Handing In...';
                submitBtn.disabled = true;
                
                // Revert after 3 seconds if still on page (fallback)
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }

    // File input change handler
    const fileInput = document.getElementById('submission');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
            // You can add file validation here if needed
            console.log('Selected file:', fileName);
        });
    }

    // Initialize page functionality
    initializeClassworkPage();
});

// Classwork Page Specific Functionality
function initializeClassworkPage() {
    console.log('Student Classwork page initialized');
    
    // Real-time submission status checking
    checkSubmissionStatus();
    
    // Add any additional classwork-specific JavaScript here
}

// Function to check and update submission status in real-time
function checkSubmissionStatus() {
    const submissionForm = document.getElementById('submissionForm');
    const submitBtn = document.getElementById('submitBtn');
    
    if (!submissionForm || !submitBtn) return;
    
    // This function would typically check against server-side time
    // For now, we'll rely on the server-side validation
    console.log('Submission status monitoring active');
    
    // You could add a timer here to disable the button when deadline passes
    // This would require knowing the exact deadline time from the server
}