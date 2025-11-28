// admin_enrollment.js - Complete Fixed Version with All Mobile Navigation Features
$(document).ready(function() {
    // Global variables
    let currentEnrollmentId = null;
    let currentAction = null;

    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initializeEventListeners();
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

        // Enrollment Details Modal Flow
        $('#closeDetailsModal').click(function() {
            closeAllModals();
        });

        $('#close-details-modal').click(function() {
            closeAllModals();
        });

        // Approve Enrollment Flow
        $('#approveEnrollmentBtn').click(function() {
            $('#enrollmentDetailsModal').fadeOut();
            $('#approvalModal').fadeIn();
        });

        $('#cancelApproval').click(function() {
            $('#approvalModal').fadeOut();
            $('#enrollmentDetailsModal').fadeIn();
        });

        $('#close-approval-modal').click(function() {
            $('#approvalModal').fadeOut();
            $('#enrollmentDetailsModal').fadeIn();
        });

        $('#confirmApproval').click(function() {
            if (currentEnrollmentId) {
                $('#approvalModal').fadeOut();
                showLoadingScreen('Approving enrollment...');
                updateEnrollmentStatus(currentEnrollmentId, 'enrolled');
            }
        });

        // Reject Enrollment Flow
        $('#rejectEnrollmentBtn').click(function() {
            $('#enrollmentDetailsModal').fadeOut();
            $('#rejectionModal').fadeIn();
        });

        $('#cancelRejection').click(function() {
            $('#rejectionModal').fadeOut();
            $('#enrollmentDetailsModal').fadeIn();
        });

        $('#close-rejection-modal').click(function() {
            $('#rejectionModal').fadeOut();
            $('#enrollmentDetailsModal').fadeIn();
        });

        $('#confirmRejection').click(function() {
            if (currentEnrollmentId) {
                $('#rejectionModal').fadeOut();
                showLoadingScreen('Rejecting enrollment...');
                updateEnrollmentStatus(currentEnrollmentId, 'rejected');
            }
        });

        // Success Modals
        $('#closeSuccessModal').click(function() {
            closeAllModals();
            // Refresh the page to show updated status
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });

        $('#close-success-modal').click(function() {
            closeAllModals();
            // Refresh the page to show updated status
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });

        $('#closeRejectionSuccessModal').click(function() {
            closeAllModals();
            // Refresh the page to show updated status
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });

        $('#close-rejection-success-modal').click(function() {
            closeAllModals();
            // Refresh the page to show updated status
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });

        // Alert close
        $('.close-alert').click(function() {
            $(this).closest('.alert').fadeOut();
        });
    }

    function initializeEventListeners() {
        // DOM Elements
        const searchInput = document.getElementById('search-input');
        const statusFilter = document.getElementById('status-filter');
        const courseFilter = document.getElementById('course-filter');
        const showAllEnrollments = document.getElementById('show-all-enrollments');
        
        // Filter event listeners
        [statusFilter, courseFilter].forEach(filter => {
            filter.addEventListener('change', applyFilters);
        });
        
        // Search functionality
        searchInput.addEventListener('input', debounce(applyFilters, 300));
        
        // Show all enrollments
        if (showAllEnrollments) {
            showAllEnrollments.addEventListener('click', resetAllFilters);
        }
        
        // Close flash messages
        document.querySelectorAll('.close-alert').forEach(btn => {
            btn.addEventListener('click', function() {
                this.closest('.alert').style.display = 'none';
            });
        });
        
        // Auto-hide flash messages after 5 seconds
        setTimeout(() => {
            document.querySelectorAll('.alert').forEach(alert => {
                alert.style.opacity = '0';
                setTimeout(() => alert.style.display = 'none', 500);
            });
        }, 5000);

        // Handle view details button clicks
        $(document).on('click', '.view-details-btn', function() {
            const enrollmentId = $(this).data('enrollment-id');
            viewEnrollmentDetails(enrollmentId);
        });
    }

    // Show loading screen during approval/rejection
    function showLoadingScreen(message) {
        $('#loading-message').text(message);
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }

    // Function to apply filters
    function applyFilters() {
        const status = document.getElementById('status-filter').value;
        const course = document.getElementById('course-filter').value;
        const search = document.getElementById('search-input').value.trim();
        
        let url = window.appUrls.getEnrollments + '?';
        if (status !== 'all') url += `status=${status}&`;
        if (course !== 'all') url += `course=${course}&`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        
        window.location.href = url.slice(0, -1);
    }

    // Function to reset all filters
    function resetAllFilters() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('course-filter').value = 'all';
        document.getElementById('search-input').value = '';
        applyFilters();
    }

    // Function to update enrollment status
    function updateEnrollmentStatus(enrollmentId, newStatus) {
        const approveBtn = $('#confirmApproval');
        const rejectBtn = $('#confirmRejection');
        const button = newStatus === 'enrolled' ? approveBtn : rejectBtn;
        
        // Show loading state
        button.addClass('loading').prop('disabled', true);
        
        fetch(window.appUrls.updateEnrollmentStatus, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                enrollment_id: enrollmentId,
                status: newStatus
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            button.removeClass('loading').prop('disabled', false);
            hideLoadingScreen();
            
            if (data.success) {
                if (newStatus === 'enrolled') {
                    $('#successMessage').text('Enrollment has been approved successfully and the student is now enrolled.');
                    $('#successModal').fadeIn();
                } else {
                    $('#rejectionSuccessMessage').text('Enrollment has been rejected successfully.');
                    $('#rejectionSuccessModal').fadeIn();
                }
            } else {
                showErrorModal(data.message || 'Failed to update enrollment status');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            button.removeClass('loading').prop('disabled', false);
            hideLoadingScreen();
            showErrorModal('An error occurred while updating enrollment status');
        });
    }

    // Function to view enrollment details
    function viewEnrollmentDetails(enrollmentId) {
        currentEnrollmentId = enrollmentId;
        window.currentEnrollmentId = enrollmentId;
        
        // Show loading state
        $('#enrollmentDetailsContent').html(`
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Loading enrollment details...</span>
            </div>
        `);
        
        $('#enrollmentDetailsModal').fadeIn();
        
        const url = window.appUrls.getEnrollmentDetails.replace('0', enrollmentId);
        
        fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.message || 'Failed to fetch enrollment details');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                populateEnrollmentDetails(data.enrollment);
                // Show/hide action buttons based on enrollment status
                if (data.enrollment.status === 'pending') {
                    $('#approveEnrollmentBtn').show();
                    $('#rejectEnrollmentBtn').show();
                } else {
                    $('#approveEnrollmentBtn').hide();
                    $('#rejectEnrollmentBtn').hide();
                }
            } else {
                $('#enrollmentDetailsContent').html(`
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Failed to load enrollment details: ${data.message}
                    </div>
                `);
                $('#approveEnrollmentBtn').hide();
                $('#rejectEnrollmentBtn').hide();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#enrollmentDetailsContent').html(`
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load enrollment details. Please try again.
                </div>
            `);
            $('#approveEnrollmentBtn').hide();
            $('#rejectEnrollmentBtn').hide();
        });
    }

    function populateEnrollmentDetails(enrollment) {
        const content = document.getElementById('enrollmentDetailsContent');
        
        const formatDate = (dateString) => {
            if (!dateString) return 'N/A';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        content.innerHTML = `
            <div class="user-details-content">
                <div class="user-detail-section">
                    <h4><i class="fas fa-user-graduate"></i> Student Information</h4>
                    <div class="user-detail-grid">
                        <div class="user-detail-item">
                            <div class="user-detail-label">Full Name</div>
                            <div class="user-detail-value">${enrollment.student_name || 'N/A'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Email</div>
                            <div class="user-detail-value">${enrollment.email || 'N/A'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Role</div>
                            <div class="user-detail-value">${enrollment.role || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="user-detail-section">
                    <h4><i class="fas fa-book"></i> Course Information</h4>
                    <div class="user-detail-grid">
                        <div class="user-detail-item">
                            <div class="user-detail-label">Course</div>
                            <div class="user-detail-value">${enrollment.course_title || 'N/A'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Class</div>
                            <div class="user-detail-value">${enrollment.class_title || 'N/A'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Schedule</div>
                            <div class="user-detail-value">${enrollment.schedule || 'N/A'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Venue</div>
                            <div class="user-detail-value">${enrollment.venue || 'N/A'}</div>
                        </div>
                    </div>
                </div>
                
                <div class="user-detail-section">
                    <h4><i class="fas fa-calendar-alt"></i> Class Dates</h4>
                    <div class="user-detail-grid">
                        <div class="user-detail-item">
                            <div class="user-detail-label">Start Date</div>
                            <div class="user-detail-value">${formatDate(enrollment.start_date)}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">End Date</div>
                            <div class="user-detail-value">${formatDate(enrollment.end_date)}</div>
                        </div>
                    </div>
                </div>
                
                <div class="user-detail-section">
                    <h4><i class="fas fa-info-circle"></i> Enrollment Details</h4>
                    <div class="user-detail-grid">
                        <div class="user-detail-item">
                            <div class="user-detail-label">Status</div>
                            <div class="user-detail-value">
                                <span class="status-badge status-${enrollment.status}">
                                    ${enrollment.status ? enrollment.status.charAt(0).toUpperCase() + enrollment.status.slice(1) : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Enrollment Date</div>
                            <div class="user-detail-value">${formatDate(enrollment.enrollment_date)}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Show error modal
    function showErrorModal(message) {
        // Create a simple alert for errors
        const alertHtml = `
            <div class="alert danger">
                <span id="message-text">
                    <i class="fas fa-exclamation-circle"></i>
                    ${message}
                </span>
                <button type="button" class="close-alert">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        // Remove any existing alerts
        $('.alert.danger').remove();
        
        // Add the new alert
        $('.flash-messages').html(alertHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            $('.alert.danger').fadeOut();
        }, 5000);
    }

    // Utility function for debouncing
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize everything
    init();
});