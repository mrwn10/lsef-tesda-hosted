// staff_enrollment_acceptance.js - Fixed Version with SweetAlert2 for everything
$(document).ready(function() {
    let allEnrollments = [];
    let filteredEnrollments = [];
    let currentEnrollmentId = null;
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    const $searchInput = $('#search-input');
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initPagination();
        initEnrollmentData();
        initStudentDetailsModal();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterEnrollments();
            }, 300);
        }

        // Event listeners for search
        $searchInput.on('input', doSearch);
    }
    
    // Initialize enrollment data from server or existing HTML
    function initEnrollmentData() {
        // Check if we have enrollments data in the HTML
        const enrollmentsContainer = $('#enrollments-container');
        const enrollmentRows = enrollmentsContainer.find('tr[data-enrollment-id]');
        
        if (enrollmentRows.length > 0) {
            // Extract data from existing HTML rows
            allEnrollments = [];
            enrollmentRows.each(function() {
                const $row = $(this);
                const enrollmentId = $row.data('enrollment-id');
                const studentName = $row.find('.student-name').text().trim();
                const studentContact = $row.find('.student-contact').text().trim();
                const email = $row.find('.email-cell').text();
                const courseTitle = $row.find('.course-cell').text();
                const classTitle = $row.find('.class-cell').text();
                const schedule = $row.find('.schedule-days').text();
                const venue = $row.find('.schedule-venue').text();
                const startDate = $row.find('.schedule-date').text();
                
                const statusBadge = $row.find('.status-badge');
                const statusClass = statusBadge.attr('class') || '';
                const isComplete = statusClass.includes('status-completed');
                
                allEnrollments.push({
                    enrollment_id: enrollmentId,
                    student_name: studentName,
                    student_contact: studentContact,
                    email: email,
                    course_title: courseTitle,
                    class_title: classTitle,
                    schedule: schedule,
                    venue: venue,
                    start_date: startDate,
                    status: isComplete ? 'complete' : 'incomplete',
                    status_class: statusClass
                });
            });
            
            filteredEnrollments = allEnrollments;
            
            // Setup pagination and filtering
            setupPaginationFiltering();
        } else {
            // No enrollments found, show empty state
            renderEmptyState();
        }
    }
    
    // Setup pagination filtering
    function setupPaginationFiltering() {
        const totalEnrollments = filteredEnrollments.length;
        if (totalEnrollments === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        totalPages = Math.ceil(totalEnrollments / pageSize);
        
        // Show/hide rows based on current page
        updateTableVisibility();
        updatePagination();
    }
    
    // Update table row visibility based on current page
    function updateTableVisibility() {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredEnrollments.length);
        
        // Get all enrollment rows
        const enrollmentRows = $('#enrollments-container').find('tr[data-enrollment-id]');
        
        // Hide all rows first
        enrollmentRows.hide();
        
        // Show only rows for current page
        enrollmentRows.slice(startIndex, endIndex).show();
        
        // Update mobile cards
        renderMobileCards(filteredEnrollments.slice(startIndex, endIndex));
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            setupPaginationFiltering();
        });
        
        // Pagination button handlers
        $('#first-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = 1;
                setupPaginationFiltering();
            }
        });
        
        $('#prev-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage--;
                setupPaginationFiltering();
            }
        });
        
        $('#next-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage++;
                setupPaginationFiltering();
            }
        });
        
        $('#last-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = totalPages;
                setupPaginationFiltering();
            }
        });
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalEnrollments = filteredEnrollments.length;
        totalPages = Math.ceil(totalEnrollments / pageSize);
        
        // Update pagination info
        const start = ((currentPage - 1) * pageSize) + 1;
        const end = Math.min(currentPage * pageSize, totalEnrollments);
        $('#pagination-start').text(start);
        $('#pagination-end').text(end);
        $('#pagination-total').text(totalEnrollments);
        
        // Update button states
        $('#first-page').prop('disabled', currentPage === 1);
        $('#prev-page').prop('disabled', currentPage === 1);
        $('#next-page').prop('disabled', currentPage === totalPages);
        $('#last-page').prop('disabled', currentPage === totalPages);
        
        // Update page numbers
        const $pagesContainer = $('#pagination-pages');
        $pagesContainer.empty();
        
        // Show up to 5 page numbers
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust if we're near the end
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = $(`<button class="pagination-page ${i === currentPage ? 'active' : ''}">${i}</button>`);
            pageBtn.on('click', function() {
                currentPage = i;
                setupPaginationFiltering();
            });
            $pagesContainer.append(pageBtn);
        }
        
        // Show/hide pagination
        if (totalEnrollments > 0) {
            $('#pagination-container').show();
        } else {
            $('#pagination-container').hide();
        }
    }
    
    // Filter enrollments based on search
    function filterEnrollments() {
        const searchTerm = $searchInput.val().toLowerCase();
        
        if (searchTerm === '') {
            // No filtering needed, show all enrollments
            filteredEnrollments = allEnrollments;
        } else {
            filteredEnrollments = allEnrollments.filter(enroll => {
                const studentName = (enroll.student_name || '').toLowerCase();
                const email = (enroll.email || '').toLowerCase();
                const courseTitle = (enroll.course_title || '').toLowerCase();
                const classTitle = (enroll.class_title || '').toLowerCase();
                const venue = (enroll.venue || '').toLowerCase();
                
                return studentName.includes(searchTerm) || 
                       email.includes(searchTerm) || 
                       courseTitle.includes(searchTerm) ||
                       classTitle.includes(searchTerm) ||
                       venue.includes(searchTerm);
            });
        }
        
        currentPage = 1;
        setupPaginationFiltering();
    }
    
    // Render mobile cards (only for mobile view)
    function renderMobileCards(currentEnrollments) {
        let cardsHtml = '';
        
        currentEnrollments.forEach(enroll => {
            cardsHtml += `
                <div class="mobile-user-card" data-enrollment-id="${enroll.enrollment_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${enroll.student_name}</div>
                            <div class="mobile-user-email">${enroll.email}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Course</div>
                            <div class="mobile-detail-value">${enroll.course_title}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Class</div>
                            <div class="mobile-detail-value">${enroll.class_title}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Schedule</div>
                            <div class="mobile-detail-value">${enroll.schedule}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Venue</div>
                            <div class="mobile-detail-value">${enroll.venue}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Start Date</div>
                            <div class="mobile-detail-value">${enroll.start_date}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Requirements</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge ${enroll.status_class}">
                                    ${enroll.status === 'complete' ? 'Complete' : 'Incomplete'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-details-btn" data-enrollment-id="${enroll.enrollment_id}">
                            <i class="fas fa-eye"></i> Review
                        </button>
                    </div>
                </div>
            `;
        });
        
        $('#mobile-enrollments-container').html(cardsHtml);
        
        // Re-attach event listeners to mobile buttons
        $('#mobile-enrollments-container .view-details-btn').on('click', function() {
            const enrollmentId = $(this).data('enrollment-id');
            viewStudentDetails(enrollmentId);
        });
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#enrollments-container').html(`
            <tr>
                <td colspan="7" class="no-results">
                    <div class="empty-state">
                        <i class="fas fa-inbox"></i>
                        <h3>No pending enrollment requests</h3>
                        <p>There are currently no enrollment requests to review.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-enrollments-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-inbox" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No pending enrollment requests</h3>
                <p style="color: #94a3b8;">There are currently no enrollment requests to review.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }

    // ===== STUDENT DETAILS MODAL FUNCTIONALITY =====
    
    function initStudentDetailsModal() {
        // View button click handlers
        $(document).on('click', '.view-details-btn', function() {
            const enrollmentId = $(this).data('enrollment-id');
            viewStudentDetails(enrollmentId);
        });
        
        // Student details modal close handlers
        $('#close-student-modal, #close-student-details').on('click', closeStudentDetailsModal);
        
        // Action button handlers - UPDATED: Close modal first, then show SweetAlert2
        $('#accept-enrollment').on('click', function() {
            if (currentEnrollmentId) {
                // Close the student details modal first
                closeStudentDetailsModal();
                // Show SweetAlert2 after a short delay
                setTimeout(() => {
                    showApprovalConfirmation();
                }, 300);
            }
        });
        
        $('#reject-enrollment').on('click', function() {
            if (currentEnrollmentId) {
                // Close the student details modal first
                closeStudentDetailsModal();
                // Show SweetAlert2 after a short delay
                setTimeout(() => {
                    showRejectionConfirmation();
                }, 300);
            }
        });
    }
    
    function viewStudentDetails(enrollmentId) {
        currentEnrollmentId = enrollmentId;
        
        // Show loading screen
        $('#loading-screen').fadeIn();
        $('#loading-message').text('Loading student details...');
        
        $.ajax({
            url: window.appUrls.studentDetailsUrl.replace('0', enrollmentId),
            method: 'GET',
            success: function(data) {
                $('#loading-screen').fadeOut();
                if (data.error) {
                    showSweetAlertError('Error', data.error);
                    return;
                }
                displayStudentDetails(data);
            },
            error: function(xhr, status, error) {
                $('#loading-screen').fadeOut();
                console.error('Error fetching student details:', error);
                showSweetAlertError('Error', 'Error loading student details');
            }
        });
    }

    function displayStudentDetails(data) {
        const modalContent = $('#student-details-content');
        const gender = data.gender ? data.gender.toLowerCase() : '';
        const hasMarriageCertificate = data.marriage_certificate !== null && data.marriage_certificate !== '';
        
        // Get profile picture URL
        const profilePicture = data.student_profile_picture || 'default.png';
        const profilePictureUrl = `/static/uploads/profile_pictures/${profilePicture}`;
        
        // Format requirements status based on gender and marital status
        const requirements = [
            { 
                name: 'Barangay Clearance', 
                value: data.barangay_clearance,
                required: true
            },
            { 
                name: 'Medical Certificate', 
                value: data.medical_certificate,
                required: true
            },
            { 
                name: 'Valid ID', 
                value: data.valid_id,
                required: true
            },
            { 
                name: 'Transcript Form', 
                value: data.transcript_form,
                required: true
            }
        ];

        // Add marriage certificate conditionally
        if (gender === 'female' && hasMarriageCertificate) {
            requirements.push({ 
                name: 'Marriage Certificate', 
                value: data.marriage_certificate,
                required: true,
                conditional: true
            });
        } else if (gender === 'female' && !hasMarriageCertificate) {
            requirements.push({ 
                name: 'Marriage Certificate', 
                value: null,
                required: false,
                conditional: true,
                notRequiredReason: 'Not required for single female applicants'
            });
        }
        // For males, don't add marriage certificate at all

        const requirementsHtml = requirements.map(req => {
            if (req.conditional && !req.required) {
                return `
                    <div class="requirement-item conditional">
                        <span class="requirement-name">${req.name}:</span>
                        <span class="requirement-status not-required">
                            <i class="fas fa-info-circle"></i> ${req.notRequiredReason || 'Not Required'}
                        </span>
                    </div>
                `;
            }
            
            return `
                <div class="requirement-item ${req.conditional ? 'conditional' : ''}">
                    <span class="requirement-name">${req.name}:</span>
                    <span class="requirement-status ${req.value ? 'completed' : 'missing'}">
                        ${req.value ? '<i class="fas fa-check"></i> Submitted' : '<i class="fas fa-times"></i> Missing'}
                    </span>
                </div>
            `;
        }).join('');

        modalContent.html(`
            <div class="modal-profile-header">
                <img src="${profilePictureUrl}" alt="${data.first_name} ${data.last_name}" 
                     class="modal-profile-picture" onerror="this.src='/static/img/default_profile.png'">
                <div class="modal-profile-info">
                    <h3>${data.first_name} ${data.middle_name || ''} ${data.last_name}</h3>
                    <p>${data.email}</p>
                    <p><strong>Username:</strong> ${data.username || 'N/A'}</p>
                </div>
            </div>
            
            <div class="student-details-grid">
                <div class="detail-section">
                    <h4><i class="fas fa-user"></i> Personal Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Full Name:</span>
                        <span class="detail-value">${data.first_name} ${data.middle_name || ''} ${data.last_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email:</span>
                        <span class="detail-value">${data.email}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Contact Number:</span>
                        <span class="detail-value">${data.contact_number || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date of Birth:</span>
                        <span class="detail-value">${data.date_of_birth ? new Date(data.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Gender:</span>
                        <span class="detail-value">${data.gender || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address:</span>
                        <span class="detail-value">${data.baranggay}, ${data.municipality}, ${data.province}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h4><i class="fas fa-book"></i> Course Information</h4>
                    <div class="detail-row">
                        <span class="detail-label">Course:</span>
                        <span class="detail-value">${data.course_title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Class:</span>
                        <span class="detail-value">${data.class_title}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Schedule:</span>
                        <span class="detail-value">${data.schedule}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Venue:</span>
                        <span class="detail-value">${data.venue}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Start Date:</span>
                        <span class="detail-value">${data.start_date ? new Date(data.start_date).toLocaleDateString() : 'TBA'}</span>
                    </div>
                </div>

                <div class="detail-section full-width">
                    <h4><i class="fas fa-file-alt"></i> Requirements Status</h4>
                    <div class="requirements-note">
                        <i class="fas fa-info-circle"></i>
                        <span>Marriage certificate is only required for married female applicants.</span>
                    </div>
                    <div class="requirements-grid">
                        ${requirementsHtml}
                    </div>
                    ${data.additional_notes ? `
                    <div class="detail-row">
                        <span class="detail-label">Additional Notes:</span>
                        <span class="detail-value">${data.additional_notes}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `);

        // Show the modal
        $('#studentDetailsModal').fadeIn();
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }

    function closeStudentDetailsModal() {
        $('#studentDetailsModal').fadeOut();
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
    
    // ===== SWEETALERT2 DIALOG FUNCTIONS =====
    
    function showApprovalConfirmation() {
        Swal.fire({
            title: 'Confirm Enrollment Approval',
            html: `
                <div style="text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #15803d; margin-bottom: 15px;"></i>
                    <p style="margin-bottom: 15px;">Are you sure you want to approve this student's enrollment?</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#15803d',
            cancelButtonColor: '#6c757d',
            ...window.swalConfig
        }).then((result) => {
            if (result.isConfirmed) {
                handleEnrollmentAction('accept');
            }
        });
    }
    
    function showRejectionConfirmation() {
        Swal.fire({
            title: 'Confirm Enrollment Rejection',
            html: `
                <div style="text-align: center;">
                    <i class="fas fa-times-circle" style="font-size: 3rem; color: #b91c1c; margin-bottom: 15px;"></i>
                    <p style="margin-bottom: 15px;">Are you sure you want to reject this student's enrollment?</p>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Yes, Reject',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#b91c1c',
            cancelButtonColor: '#6c757d',
            ...window.swalConfig
        }).then((result) => {
            if (result.isConfirmed) {
                handleEnrollmentAction('reject');
            }
        });
    }
    
    function handleEnrollmentAction(action) {
        if (!currentEnrollmentId) {
            showSweetAlertError('Error', 'No enrollment selected');
            return;
        }
        
        // Show loading state in SweetAlert
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait while we process your request',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Submit the action
        $.ajax({
            url: window.appUrls.handleEnrollmentActionUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                enrollment_id: currentEnrollmentId,
                action: action
            }),
            success: function(response) {
                Swal.close();
                
                if (response.success) {
                    // Show success SweetAlert2
                    showSweetAlertSuccess(
                        'Success',
                        response.message,
                        () => {
                            // Reload the page after success
                            setTimeout(() => {
                                location.reload();
                            }, 500);
                        }
                    );
                } else {
                    showSweetAlertError('Error', response.error || `Error ${action}ing enrollment`);
                }
            },
            error: function(xhr, status, error) {
                Swal.close();
                
                let errorMessage = `Error ${action}ing enrollment`;
                if (xhr.responseJSON && xhr.responseJSON.error) {
                    errorMessage += ': ' + xhr.responseJSON.error;
                } else {
                    errorMessage += ': ' + error;
                }
                
                showSweetAlertError('Error', errorMessage);
            }
        });
    }
    
    // ===== SWEETALERT2 HELPER FUNCTIONS =====
    
    function showSweetAlertSuccess(title, message, callback = null) {
        Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#15803d',
            ...window.swalConfig
        }).then((result) => {
            if (callback && result.isConfirmed) {
                callback();
            }
        });
    }
    
    function showSweetAlertError(title, message) {
        Swal.fire({
            icon: 'error',
            title: title,
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#b91c1c',
            ...window.swalConfig
        });
    }
    
    function showSweetAlertInfo(title, message) {
        Swal.fire({
            icon: 'info',
            title: title,
            text: message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6',
            ...window.swalConfig
        });
    }

    // ===== MOBILE NAVIGATION AND MODAL FUNCTIONS =====
    
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

        // Remove the old JavaScript status message functions since we're using SweetAlert2
        $('.close-alert').click(function() {
            $(this).closest('.alert').fadeOut();
        });

        // Auto-hide flash messages after 5 seconds
        $('.alert').each(function() {
            const $alert = $(this);
            setTimeout(() => {
                $alert.fadeOut();
            }, 5000);
        });
    }
    
    // Initialize everything
    init();
});