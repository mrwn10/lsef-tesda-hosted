// staff_enrollment_acceptance.js - Complete Updated Version
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
                const status = statusBadge.hasClass('status-completed') ? 'complete' : 'incomplete';
                
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
                    status: status,
                    status_class: statusBadge.attr('class')
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
                            <div class="mobile-detail-value"><span class="status-badge ${enroll.status_class}">${enroll.status}</span></div>
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
        
        // Action button handlers
        $('#accept-enrollment').on('click', handleEnrollmentAction);
        $('#reject-enrollment').on('click', handleEnrollmentAction);
    }
    
    function viewStudentDetails(enrollmentId) {
        currentEnrollmentId = enrollmentId;
        
        // Show loading screen
        $('#loading-screen').fadeIn();
        
        fetch(window.appUrls.studentDetailsUrl + enrollmentId)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                $('#loading-screen').fadeOut();
                if (data.error) {
                    showMessage(data.error, 'error');
                    return;
                }
                displayStudentDetails(data);
            })
            .catch(error => {
                console.error('Error fetching student details:', error);
                $('#loading-screen').fadeOut();
                showMessage('Error loading student details', 'error');
            });
    }

    function displayStudentDetails(data) {
        const modalContent = $('#student-details-content');
        
        // Format requirements status
        const requirements = [
            { name: 'Birth Certificate', value: data.birth_certificate },
            { name: 'Educational Credentials', value: data.educational_credentials },
            { name: 'ID Photos', value: data.id_photos },
            { name: 'Barangay Clearance', value: data.barangay_clearance },
            { name: 'Medical Certificate', value: data.medical_certificate },
            { name: 'Marriage Certificate', value: data.marriage_certificate },
            { name: 'Valid ID', value: data.valid_id },
            { name: 'Transcript Form', value: data.transcript_form },
            { name: 'Good Moral Certificate', value: data.good_moral_certificate },
            { name: 'Brown Envelope', value: data.brown_envelope }
        ];

        const requirementsHtml = requirements.map(req => `
            <div class="requirement-item">
                <span class="requirement-name">${req.name}:</span>
                <span class="requirement-status ${req.value ? 'completed' : 'missing'}">
                    ${req.value ? '<i class="fas fa-check"></i> Submitted' : '<i class="fas fa-times"></i> Missing'}
                </span>
            </div>
        `).join('');

        modalContent.html(`
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
        currentEnrollmentId = null;
    }

    function handleEnrollmentAction(e) {
        if (!currentEnrollmentId) {
            showMessage('No enrollment selected', 'error');
            return;
        }

        const action = $(this).attr('id') === 'accept-enrollment' ? 'accept' : 'reject';
        const actionText = action === 'accept' ? 'accept' : 'reject';
        const studentName = $('#student-details-content .detail-row .detail-value').first().text().trim();
        
        const confirmationMessage = `Are you sure you want to ${actionText} the enrollment for ${studentName}?`;
        
        if (confirm(confirmationMessage)) {
            // Show loading state
            const $buttons = $('#accept-enrollment, #reject-enrollment');
            $buttons.prop('disabled', true).addClass('loading');
            
            // Submit the action
            $.ajax({
                url: window.appUrls.handleEnrollmentActionUrl,
                method: 'POST',
                data: {
                    enrollment_id: currentEnrollmentId,
                    action: action
                },
                success: function(response) {
                    if (response.success) {
                        showMessage(`Enrollment ${actionText}ed successfully`, 'success');
                        closeStudentDetailsModal();
                        // Reload the page after a short delay
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    } else {
                        showMessage(response.message || `Error ${actionText}ing enrollment`, 'error');
                        $buttons.prop('disabled', false).removeClass('loading');
                    }
                },
                error: function() {
                    showMessage(`Error ${actionText}ing enrollment`, 'error');
                    $buttons.prop('disabled', false).removeClass('loading');
                }
            });
        }
    }

    function showMessage(message, type = 'success') {
        const $messageContainer = $('#status-message');
        const $messageText = $('#message-text');
        
        $messageText.text(message);
        $messageContainer.removeClass('success danger warning').addClass(type);
        $messageContainer.fadeIn();
        
        // Scroll to message
        $messageContainer[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide message after 5 seconds
        setTimeout(() => {
            $messageContainer.fadeOut();
        }, 5000);
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

        // Success Modal
        $('#closeSuccessModal').click(function() {
            closeAllModals();
        });

        $('#close-success-modal').click(function() {
            closeAllModals();
        });

        // Alert close
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