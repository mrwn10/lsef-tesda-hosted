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

    // Initialize Student Enrollment
    new StudentEnrollment();
});

// Student Enrollment JavaScript Functions
class StudentEnrollment {
    constructor() {
        this.enrolledClasses = [];
        // Check if there's any active enrollment (enrolled OR pending)
        this.hasActiveEnrollment = $('.enrollment-disabled').length > 0;
        this.isPendingEnrollment = $('.pending-enrollment-warning').length > 0;
        this.init();
    }

    init() {
        this.bindEvents();
        console.log('Student Enrollment initialized');
        
        // Show placeholder if enrollment is disabled
        if (this.hasActiveEnrollment) {
            this.showPlaceholder();
        }
    }

    bindEvents() {
        // Dropdown change event - only bind if not disabled
        if (!this.hasActiveEnrollment) {
            $('#class_id').on('change', (e) => {
                const classId = e.target.value;
                if (classId) {
                    this.loadClassDetails(classId);
                } else {
                    this.showPlaceholder();
                }
            });
        }

        // Summary card click events - only bind if not disabled
        if (!this.hasActiveEnrollment) {
            $('.summary-card:not(.card-disabled)').on('click', (e) => {
                const classId = $(e.currentTarget).data('class-id');
                $('#class_id').val(classId).trigger('change');
                
                // Scroll to the dropdown
                $('html, body').animate({
                    scrollTop: $('#class_id').offset().top - 100
                }, 500);
            });
        }

        // Submit button click - only bind if not disabled
        if (!this.hasActiveEnrollment) {
            $('#submit-btn').on('click', () => {
                this.confirmEnrollment();
            });
        }
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
            this.showSimpleAlert('Error', 'Error loading class details.', 'error');
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
        
        if (classId && !this.hasActiveEnrollment) {
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

    // Simple confirmation dialog
    confirmEnrollment() {
        const classId = $('#class_id').val();
        
        if (!classId) {
            this.showSimpleAlert('Select a Class', 'Please select a class first.', 'warning');
            return;
        }
        
        // Get selected class title
        const selectedOption = $('#class_id option:selected').text();
        const classTitle = selectedOption.split(' - ')[0]; // Just show course title
        
        // Clean confirmation dialog
        Swal.fire({
            title: 'Confirm Enrollment',
            text: `Enroll in "${classTitle}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Enroll',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#003366',
            cancelButtonColor: '#6c757d',
            showCloseButton: false,
            backdrop: true,
            allowOutsideClick: false,
            allowEscapeKey: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return this.submitEnrollment(classId);
            }
        });
    }

    // Submit enrollment with clean feedback
    async submitEnrollment(classId) {
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
                // Simple success alert
                Swal.fire({
                    title: 'Success!',
                    text: 'Enrollment request submitted successfully.',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#003366',
                    showCloseButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
                
                // Update UI
                $('#submit-btn').prop('disabled', true);
                $('#submit-btn').html('<i class="fas fa-check-circle btn-icon"></i> Enrollment Requested');
                $('#submit-btn').addClass('btn-disabled');
                
                // Disable the dropdown option
                $(`#class_id option[value="${classId}"]`).prop('disabled', true);
                
                // Refresh the page after 3 seconds to show pending warning
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
                
                return true;
            } else {
                // Simple error alert
                let errorMessage = data.message;
                if (errorMessage.length > 100) {
                    errorMessage = errorMessage.substring(0, 100) + '...';
                }
                
                Swal.fire({
                    title: 'Cannot Enroll',
                    text: errorMessage,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#dc3545',
                    showCloseButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
                
                // If the error is about verification, redirect to requirements page
                if (data.message.includes('not verified') || data.message.includes('requirements')) {
                    setTimeout(() => {
                        window.location.href = "/student/requirements";
                    }, 2000);
                }
                
                return false;
            }
            
        } catch (error) {
            console.error('Error:', error);
            
            Swal.fire({
                title: 'Connection Error',
                text: 'Please check your connection and try again.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#003366',
                showCloseButton: false,
                allowOutsideClick: false,
                allowEscapeKey: false
            });
            
            return false;
        }
    }

    // Simple alert helper
    showSimpleAlert(title, text, icon) {
        Swal.fire({
            title: title,
            text: text,
            icon: icon,
            confirmButtonText: 'OK',
            confirmButtonColor: '#003366',
            showCloseButton: false,
            timer: icon === 'success' ? 3000 : undefined,
            timerProgressBar: icon === 'success'
        });
    }
}

// Add minimal custom SweetAlert styles
const style = document.createElement('style');
style.textContent = `
    .swal2-popup {
        font-family: 'Poppins', sans-serif;
        border-radius: 8px;
    }
    
    .swal2-title {
        color: #003366;
        font-weight: 600;
        font-size: 1.5rem;
    }
    
    .swal2-content {
        font-size: 1rem;
        color: #555;
    }
    
    /* Remove close button */
    .swal2-close {
        display: none !important;
    }
    
    /* Adjust button styles */
    .swal2-confirm, .swal2-cancel {
        font-weight: 600;
        padding: 10px 24px;
        border-radius: 6px;
        font-size: 1rem;
    }
    
    /* Make SweetAlert icons match our theme */
    .swal2-icon.swal2-success {
        border-color: #28a745;
        color: #28a745;
    }
    
    .swal2-icon.swal2-error {
        border-color: #dc3545;
        color: #dc3545;
    }
    
    .swal2-icon.swal2-warning {
        border-color: #ffc107;
        color: #ffc107;
    }
    
    .swal2-icon.swal2-question {
        border-color: #003366;
        color: #003366;
    }
`;
document.head.appendChild(style);