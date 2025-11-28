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

    // Initialize Student Enrollment
    new StudentEnrollment();
});

// Student Enrollment JavaScript Functions (unchanged)
class StudentEnrollment {
    constructor() {
        this.enrolledClasses = [];
        this.hasCurrentEnrollment = false;
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('Student Enrollment initialized');
    }

    bindEvents() {
        // Dropdown change event
        $('#class_id').on('change', (e) => {
            const classId = e.target.value;
            if (classId) {
                this.loadClassDetails(classId);
            } else {
                this.showPlaceholder();
            }
        });

        // Summary card click events
        $('.summary-card').on('click', (e) => {
            const classId = $(e.currentTarget).data('class-id');
            $('#class_id').val(classId).trigger('change');
            
            // Scroll to the dropdown
            $('html, body').animate({
                scrollTop: $('#class_id').offset().top - 100
            }, 500);
        });

        // Submit button click
        $('#submit-btn').on('click', () => {
            this.submitEnrollment();
        });
    }

    async loadClassDetails(classId) {
        try {
            const response = await fetch(`/student/class/${classId}/details`);
            if (!response.ok) {
                throw new Error('Failed to fetch class details');
            }
            
            const classDetails = await response.json();
            this.displayClassDetails(classDetails);
            this.updateSubmitButton(classId);
            
        } catch (error) {
            console.error('Error loading class details:', error);
            this.showFlashMessage('Error loading class details. Please try again.', 'error');
        }
    }

    displayClassDetails(classDetails) {
        const detailsDiv = $('#classDetails');
        const startDate = new Date(classDetails.start_date).toLocaleDateString();
        const endDate = new Date(classDetails.end_date).toLocaleDateString();
        
        let scheduleText = classDetails.schedule || 'Schedule TBA';
        if (classDetails.days_of_week) {
            try {
                const days = JSON.parse(classDetails.days_of_week);
                const daySchedules = Object.entries(days).map(([day, times]) => 
                    `${day}: ${times.start} - ${times.end}`
                );
                if (daySchedules.length > 0) {
                    scheduleText = daySchedules.join('<br>');
                }
            } catch (e) {
                console.log('Error parsing days_of_week:', e);
            }
        }

        const detailsHTML = `
            <div class="class-header">
                <h3>${classDetails.course_title}</h3>
                <div class="class-badges">
                    <span class="class-badge">${classDetails.class_title}</span>
                    <span class="slots-badge ${classDetails.available_slots > 5 ? 'slots-available' : 'slots-low'}">
                        <i class="fas fa-users"></i> ${classDetails.available_slots} slots available
                    </span>
                </div>
            </div>
            <div class="class-meta">
                <div class="meta-item">
                    <i class="fas fa-calendar-alt meta-icon"></i>
                    <span>${scheduleText}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt meta-icon"></i>
                    <span>${classDetails.venue}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-wallet meta-icon"></i>
                    <span>₱${parseFloat(classDetails.course_fee || 0).toFixed(2)}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users meta-icon"></i>
                    <span>${classDetails.max_students} maximum slots</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-user-tie meta-icon"></i>
                    <span>${classDetails.instructor_name || 'TBA'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock meta-icon"></i>
                    <span>${classDetails.duration_hours || 'N/A'} hours total</span>
                </div>
            </div>
            <div class="details-grid">
                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-info-circle detail-icon"></i>
                        <h4>Course Description</h4>
                    </div>
                    <p>${classDetails.course_description || 'No description available.'}</p>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-bullseye detail-icon"></i>
                        <h4>Learning Outcomes</h4>
                    </div>
                    <p>${classDetails.learning_outcomes || 'No learning outcomes specified.'}</p>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-clipboard-check detail-icon"></i>
                        <h4>Prerequisites</h4>
                    </div>
                    <p>${classDetails.course_prerequisites || 'No prerequisites required.'}</p>
                </div>
                <div class="detail-card">
                    <div class="detail-card-header">
                        <i class="fas fa-tags detail-icon"></i>
                        <h4>Course Details</h4>
                    </div>
                    <p><strong>Category:</strong> ${classDetails.course_category}</p>
                    <p><strong>Duration:</strong> ${classDetails.duration_hours || 'N/A'} hours</p>
                    <p><strong>Schedule:</strong> ${startDate} to ${endDate}</p>
                    <p><strong>Status:</strong> <span class="status-active">Active</span></p>
                </div>
            </div>
        `;

        detailsDiv.html(detailsHTML);
    }

    updateSubmitButton(classId) {
        const submitButton = $('#submit-btn');
        
        if (classId && !this.hasCurrentEnrollment) {
            submitButton.prop('disabled', false);
            submitButton.html('<i class="fas fa-paper-plane btn-icon"></i> Submit Enrollment Request');
            submitButton.removeClass('btn-disabled');
        } else {
            submitButton.prop('disabled', true);
            submitButton.addClass('btn-disabled');
        }
    }

    showPlaceholder() {
        $('#classDetails').html(`
            <div class="details-placeholder">
                <img src="/static/img/select_course.svg" alt="Select course" class="placeholder-img">
                <h3>No class selected</h3>
                <p>Choose a class from the dropdown above to view details</p>
            </div>
        `);
        $('#submit-btn').prop('disabled', true).addClass('btn-disabled');
    }

    async submitEnrollment() {
        const classId = $('#class_id').val();
        const submitButton = $('#submit-btn');
        const loadingSpinner = $('#loading-spinner');
        
        if (!classId) {
            this.showFlashMessage('Please select a class first.', 'error');
            return;
        }
        
        // Show loading spinner
        loadingSpinner.show();
        submitButton.prop('disabled', true);
        
        try {
            const formData = new FormData();
            formData.append('class_id', classId);
            
            const response = await fetch('/student/enroll', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showFlashMessage(data.message, 'success');
                // Disable the button and update text
                submitButton.prop('disabled', true);
                submitButton.html('<i class="fas fa-check-circle btn-icon"></i> Enrollment Requested');
                submitButton.addClass('btn-disabled');
                
                // Refresh the page after 2 seconds to update available slots
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                this.showFlashMessage(data.message, 'error');
                submitButton.prop('disabled', false);
                
                // If the error is about verification, redirect to requirements page
                if (data.message.includes('not verified') || data.message.includes('requirements')) {
                    setTimeout(() => {
                        window.location.href = "/student/requirements";
                    }, 3000);
                }
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.showFlashMessage('An error occurred during enrollment. Please try again.', 'error');
            submitButton.prop('disabled', false);
        } finally {
            loadingSpinner.hide();
        }
    }

    showFlashMessage(message, type) {
        let flashMessages = $('.flash-messages');
        if (flashMessages.length === 0) {
            // Create flash messages container if it doesn't exist
            const content = $('.enrollment-content');
            flashMessages = $('<div class="flash-messages"></div>');
            content.prepend(flashMessages);
        }
        
        const flashMessage = $(`
            <div class="flash-message flash-${type}">
                <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} flash-icon"></i>
                <span>${message}</span>
            </div>
        `);
        
        flashMessages.append(flashMessage);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            flashMessage.fadeOut(() => flashMessage.remove());
        }, 5000);
    }
}