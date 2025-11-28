// admin_courses_edit_req.js - Complete Fixed Version
$(document).ready(function() {
    let courses = [];
    let filteredCourses = [];
    let currentCourseId = null;
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initCourseEditReview();
        initFiltering();
        initPagination();
        loadCourses();
        addSweetAlertStyles();
    }
    
    // Load courses from existing DOM elements - FIXED VERSION
    function loadCourses() {
        console.log('Loading courses from DOM...');
        
        // Try multiple selectors to find the table rows
        const tableRows = document.querySelectorAll('#courses-container tr[data-course-id], #courses-container tr.course-row, #courses-container tr');
        
        courses = [];
        
        tableRows.forEach((row, index) => {
            // Skip header row or empty rows
            if (row.cells.length < 5 || row.classList.contains('header-row')) return;
            
            const courseId = row.getAttribute('data-course-id') || 
                            row.id.replace('course-', '') || 
                            `temp-${index}`;
            
            // Get cell data with fallbacks
            const cells = row.cells;
            const courseCode = cells[0]?.textContent?.trim() || 'N/A';
            const courseTitle = cells[1]?.querySelector('.course-title-main')?.textContent?.trim() || 
                              cells[1]?.textContent?.trim() || 'N/A';
            const courseCategory = cells[2]?.textContent?.trim() || 'N/A';
            const instructorName = cells[3]?.querySelector('.instructor-name')?.textContent?.trim() || 
                                 cells[3]?.textContent?.trim() || 'N/A';
            const courseStatus = cells[4]?.querySelector('.status-badge')?.textContent?.trim() || 
                               cells[4]?.textContent?.trim() || 'N/A';

            const courseData = {
                course_id: courseId,
                course_code: courseCode,
                course_title: courseTitle,
                course_category: courseCategory,
                instructor_name: instructorName,
                course_status: courseStatus
            };
            
            // Try to get additional data from button data attributes
            const viewBtn = row.querySelector('.view-course-btn, .view-course-edit-btn, .action-btn');
            if (viewBtn) {
                // Try to get data from various possible attributes
                const courseDataAttr = viewBtn.getAttribute('data-course') || 
                                     viewBtn.getAttribute('data-course-data') ||
                                     viewBtn.getAttribute('data-course-id');
                
                if (courseDataAttr) {
                    try {
                        // Try to parse JSON data
                        const additionalData = typeof courseDataAttr === 'string' ? 
                            JSON.parse(courseDataAttr.replace(/'/g, '"')) : 
                            courseDataAttr;
                        Object.assign(courseData, additionalData);
                    } catch (e) {
                        // If parsing fails, just use the raw data
                        console.log('Could not parse course data, using raw values');
                    }
                }
                
                // Also store the button reference for click handling
                courseData.view_button = viewBtn;
            }
            
            courses.push(courseData);
            console.log('Loaded course:', courseData.course_title);
        });
        
        console.log(`Successfully loaded ${courses.length} courses`);
        filteredCourses = [...courses];
        currentPage = 1;
        renderCourses();
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            renderCourses();
        });
        
        // Pagination button handlers
        $('#first-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = 1;
                renderCourses();
            }
        });
        
        $('#prev-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage--;
                renderCourses();
            }
        });
        
        $('#next-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage++;
                renderCourses();
            }
        });
        
        $('#last-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = totalPages;
                renderCourses();
            }
        });
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalCourses = filteredCourses.length;
        totalPages = Math.ceil(totalCourses / pageSize);
        
        // Update pagination info
        const start = ((currentPage - 1) * pageSize) + 1;
        const end = Math.min(currentPage * pageSize, totalCourses);
        $('#pagination-start').text(start);
        $('#pagination-end').text(end);
        $('#pagination-total').text(totalCourses);
        
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
                renderCourses();
            });
            $pagesContainer.append(pageBtn);
        }
        
        // Show/hide pagination
        if (totalCourses > 0) {
            $('#pagination-container').show();
        } else {
            $('#pagination-container').hide();
        }
    }
    
    // Render courses based on current pagination
    function renderCourses() {
        console.log('Rendering courses...', filteredCourses.length);
        
        if (filteredCourses.length === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredCourses.length);
        const currentCourses = filteredCourses.slice(startIndex, endIndex);
        
        // First hide all rows
        $('#courses-container tr').hide();
        
        // Show only the courses for current page
        currentCourses.forEach(course => {
            const rowSelector = `tr[data-course-id="${course.course_id}"], #course-${course.course_id}, tr:contains("${course.course_code}")`;
            $(rowSelector).show();
        });
        
        // Update pagination
        updatePagination();
        
        // Render mobile cards if mobile container exists
        if ($('#mobile-courses-container').length) {
            renderMobileCards(currentCourses);
        }
    }
    
    // Render mobile cards
    function renderMobileCards(currentCourses) {
        let cardsHtml = '';
        
        currentCourses.forEach(course => {
            cardsHtml += `
                <div class="mobile-user-card" data-course-id="${course.course_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${course.course_title}</div>
                            <div class="mobile-user-email">${course.course_code}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Category</div>
                            <div class="mobile-detail-value">
                                <span class="category-badge">${course.course_category}</span>
                            </div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${course.instructor_name}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge status-edited">
                                    <i class="fas fa-pen"></i> ${course.course_status}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-btn mobile-view-course-edit-btn" 
                                data-course-id="${course.course_id}">
                            <i class="fas fa-eye"></i> Review Changes
                        </button>
                    </div>
                </div>
            `;
        });
        
        $('#mobile-courses-container').html(cardsHtml);
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#courses-container').html(`
            <tr>
                <td colspan="6" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-edit"></i>
                        <h3>No Edit Requests Found</h3>
                        <p>No course edit requests match your current search and filters.</p>
                    </div>
                </td>
            </tr>
        `);
        
        $('#mobile-courses-container').html(`
            <div class="empty-state">
                <i class="fas fa-edit"></i>
                <h3>No Edit Requests Found</h3>
                <p>No course edit requests match your current search and filters.</p>
            </div>
        `);
        
        $('#pagination-container').hide();
    }
    
    // Mobile Navigation Functionality - COMPLETE
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
    
    // Initialize all modal functionality - COMPLETE
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

        // Course Edit Modal
        $('#close-course-edit-modal').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize course edit review functionality - COMPLETE
    function initCourseEditReview() {
        // Desktop view edit button handler
        $(document).on('click', '.view-course-edit-btn, .view-course-btn', function() {
            const courseId = $(this).data('course-id') || $(this).closest('tr').data('course-id');
            if (courseId) {
                openCourseEditModal(courseId);
            }
        });
        
        // Mobile view edit button handler
        $(document).on('click', '.mobile-view-course-edit-btn', function() {
            const courseId = $(this).data('course-id');
            if (courseId) {
                openCourseEditModal(courseId);
            }
        });
        
        // Approve and reject button handlers
        $('#approveEditBtn').click(function() {
            if (currentCourseId) {
                approveEdit(currentCourseId);
            }
        });
        
        $('#rejectEditBtn').click(function() {
            if (currentCourseId) {
                rejectEdit(currentCourseId);
            }
        });
    }
    
    // Initialize filtering functionality
    function initFiltering() {
        // Search functionality
        $('#searchInput').on('input', function() {
            filterCourses();
        });
        
        // Category filter functionality
        $('#categoryFilter').on('change', function() {
            filterCourses();
        });
    }
    
    // Filter courses based on search and category
    function filterCourses() {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const categoryValue = $('#categoryFilter').val().toLowerCase();
        
        filteredCourses = courses.filter(course => {
            const matchesSearch = !searchTerm || 
                course.course_title.toLowerCase().includes(searchTerm) ||
                course.course_code.toLowerCase().includes(searchTerm) ||
                course.course_description?.toLowerCase().includes(searchTerm) ||
                course.instructor_name.toLowerCase().includes(searchTerm);
            
            const matchesCategory = categoryValue === 'all' || 
                course.course_category.toLowerCase().includes(categoryValue);
            
            return matchesSearch && matchesCategory;
        });
        
        currentPage = 1;
        renderCourses();
    }
    
    // Open course edit modal with full comparison
    function openCourseEditModal(courseId) {
        currentCourseId = courseId;
        
        // Use existing function if available, otherwise use our fallback
        if (typeof window.openCourseModal === 'function') {
            window.openCourseModal(courseId);
        } else {
            fetchCourseEditDetails(courseId);
        }
    }
    
    // Fallback: Fetch course edit details
    function fetchCourseEditDetails(courseId) {
        fetch(`/courses/edit-details/${courseId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if(data.status === 'success') {
                    const original = data.original_course || {};
                    const edited = data.edited_course;
                    
                    showCourseComparison(original, edited);
                } else {
                    throw new Error(data.message || 'Failed to fetch course details');
                }
            })
            .catch(error => {
                console.error('Error fetching course edit details:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: '#003366'
                });
            });
    }
    
    // Show course comparison in modal
    function showCourseComparison(original, edited) {
        // Display original version (if exists)
        const originalHtml = original.course_id ? `
            <div class="user-detail-section">
                <h4><i class="fas fa-file-alt"></i> Original Version</h4>
                <div class="user-detail-grid">
                    <div class="user-detail-item">
                        <div class="user-detail-label">Course Code</div>
                        <div class="user-detail-value">${original.course_code || 'N/A'}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Title</div>
                        <div class="user-detail-value">${original.course_title || 'N/A'}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Category</div>
                        <div class="user-detail-value">${original.course_category || 'N/A'}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Duration</div>
                        <div class="user-detail-value">${original.duration_hours || '0'} hours</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Fee</div>
                        <div class="user-detail-value">₱${original.course_fee || '0'}</div>
                    </div>
                </div>
            </div>
            
            <div class="user-detail-section">
                <h4><i class="fas fa-align-left"></i> Original Description</h4>
                <div class="description-box">${original.course_description || 'No description provided'}</div>
            </div>
        ` : `
            <div class="user-detail-section">
                <div class="no-original-version">
                    <i class="fas fa-info-circle"></i>
                    <p>No previous version found. This appears to be the first edit request for this course.</p>
                </div>
            </div>
        `;
        
        // Display edited version with change highlighting
        const editedHtml = `
            <div class="user-detail-section">
                <h4><i class="fas fa-edit"></i> Edited Version</h4>
                <div class="user-detail-grid">
                    <div class="user-detail-item">
                        <div class="user-detail-label">Course Code</div>
                        <div class="user-detail-value ${original.course_code !== edited.course_code ? 'changed-value' : ''}">${edited.course_code}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Title</div>
                        <div class="user-detail-value ${original.course_title !== edited.course_title ? 'changed-value' : ''}">${edited.course_title}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Category</div>
                        <div class="user-detail-value ${original.course_category !== edited.course_category ? 'changed-value' : ''}">${edited.course_category}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Duration</div>
                        <div class="user-detail-value ${original.duration_hours !== edited.duration_hours ? 'changed-value' : ''}">${edited.duration_hours} hours</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Fee</div>
                        <div class="user-detail-value ${original.course_fee !== edited.course_fee ? 'changed-value' : ''}">₱${edited.course_fee}</div>
                    </div>
                </div>
            </div>
            
            <div class="user-detail-section">
                <h4><i class="fas fa-align-left"></i> Edited Description</h4>
                <div class="description-box ${original.course_description !== edited.course_description ? 'changed-content' : ''}">${edited.course_description}</div>
            </div>
        `;
        
        // Display edit reason
        const editReason = edited.edit_reason || 'No reason provided';
        const editReasonHtml = `
            <div class="user-detail-section">
                <h4><i class="fas fa-comment"></i> Edit Reason</h4>
                <div class="edit-reason-content">${editReason}</div>
            </div>
        `;
        
        const modalContent = `
            <div class="comparison-container">
                <div class="version-column original-version">
                    ${originalHtml}
                </div>
                <div class="version-column edited-version">
                    ${editedHtml}
                </div>
            </div>
            ${editReasonHtml}
        `;
        
        $('#courseEditContent').html(modalContent);
        
        // Show modal
        $('#courseEditModal').fadeIn();
        $('body').addClass('modal-open');
    }
    
    // Remove course from display immediately and reload page to get fresh data
    function removeCourseAndRefresh(courseId) {
        // Remove from our local arrays first
        courses = courses.filter(course => course.course_id !== courseId);
        filteredCourses = filteredCourses.filter(course => course.course_id !== courseId);
        
        // Remove from DOM immediately
        $(`[data-course-id="${courseId}"]`).remove();
        $(`#course-${courseId}`).remove();
        
        // Re-render to update pagination
        renderCourses();
        
        // If no courses left, reload the page to get fresh empty state from server
        if (courses.length === 0) {
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        }
    }
    
    // Approve edit function - COMPLETE
    async function approveEdit(courseId) {
        const result = await Swal.fire({
            title: 'Approve these changes?',
            text: 'This will update the course with the edited version',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#003366',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Approve',
            cancelButtonText: 'Cancel',
            focusCancel: true,
            customClass: {
                popup: 'sweetalert-custom-zindex',
                actions: 'sweetalert-actions-reverse'
            }
        });

        if (result.isConfirmed) {
            try {
                // Show loading state
                Swal.fire({
                    title: 'Processing...',
                    text: 'Please wait while we approve the changes',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    customClass: {
                        popup: 'sweetalert-custom-zindex'
                    }
                });

                const response = await fetch(`/approve-edit/${courseId}`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Approved!',
                        text: data.message,
                        icon: 'success',
                        confirmButtonColor: '#003366',
                        customClass: {
                            popup: 'sweetalert-custom-zindex'
                        }
                    }).then(() => {
                        // Close modal
                        closeAllModals();
                        
                        // Remove course from display and refresh
                        removeCourseAndRefresh(courseId);
                        
                        // Show success message
                        showToast('Changes approved successfully!', 'success');
                    });
                } else {
                    throw new Error(data.message || 'Approval failed');
                }
            } catch (error) {
                console.error('Error approving edit:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: '#003366',
                    customClass: {
                        popup: 'sweetalert-custom-zindex'
                    }
                });
            }
        }
    }
    
    // Reject edit function - COMPLETE
    async function rejectEdit(courseId) {
        const result = await Swal.fire({
            title: 'Reject these changes?',
            text: 'This will restore the original version of the course',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Reject',
            cancelButtonText: 'Cancel',
            focusCancel: true,
            customClass: {
                popup: 'sweetalert-custom-zindex',
                actions: 'sweetalert-actions-reverse'
            }
        });

        if (result.isConfirmed) {
            try {
                // Show loading state
                Swal.fire({
                    title: 'Processing...',
                    text: 'Please wait while we reject the changes',
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    customClass: {
                        popup: 'sweetalert-custom-zindex'
                    }
                });

                const response = await fetch(`/reject-edit/${courseId}`, { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const data = await response.json();
                
                if (data.status === 'success') {
                    Swal.fire({
                        title: 'Rejected!',
                        text: data.message,
                        icon: 'success',
                        confirmButtonColor: '#003366',
                        customClass: {
                            popup: 'sweetalert-custom-zindex'
                        }
                    }).then(() => {
                        // Close modal
                        closeAllModals();
                        
                        // Remove course from display and refresh
                        removeCourseAndRefresh(courseId);
                        
                        // Show success message
                        showToast('Changes rejected successfully!', 'success');
                    });
                } else {
                    throw new Error(data.message || 'Rejection failed');
                }
            } catch (error) {
                console.error('Error rejecting edit:', error);
                Swal.fire({
                    title: 'Error',
                    text: error.message,
                    icon: 'error',
                    confirmButtonColor: '#003366',
                    customClass: {
                        popup: 'sweetalert-custom-zindex'
                    }
                });
            }
        }
    }
    
    // Show toast notification
    function showToast(message, type = 'success') {
        // Remove existing toast if any
        $('.toast-notification').remove();
        
        const toast = $(`
            <div class="toast-notification toast-${type}">
                <div class="toast-content">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                    <span>${message}</span>
                </div>
                <button class="toast-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `);
        
        $('body').append(toast);
        
        // Show toast with animation
        setTimeout(() => {
            toast.addClass('show');
        }, 100);
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            hideToast(toast);
        }, 5000);
        
        // Close on click
        toast.find('.toast-close').click(function() {
            hideToast(toast);
        });
    }
    
    // Hide toast notification
    function hideToast(toast) {
        toast.removeClass('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
    
    // Add CSS for SweetAlert2 button order and z-index
    function addSweetAlertStyles() {
        if (!document.querySelector('#sweetalert-custom-styles')) {
            const style = document.createElement('style');
            style.id = 'sweetalert-custom-styles';
            style.textContent = `
                .sweetalert-custom-zindex {
                    z-index: 10000 !important;
                }
                .swal2-container {
                    z-index: 10000 !important;
                }
                .sweetalert-actions-reverse .swal2-actions {
                    flex-direction: row-reverse !important;
                }
                .sweetalert-actions-reverse .swal2-actions button:first-child {
                    margin-left: 10px !important;
                    margin-right: 0 !important;
                }
                .sweetalert-actions-reverse .swal2-actions button:last-child {
                    margin-right: 10px !important;
                    margin-left: 0 !important;
                }
                
                /* Toast Notification Styles */
                .toast-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    padding: 15px 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 300px;
                    max-width: 400px;
                    transform: translateX(400px);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 10000;
                    border-left: 4px solid #10b981;
                }
                
                .toast-notification.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                
                .toast-success {
                    border-left-color: #10b981;
                }
                
                .toast-error {
                    border-left-color: #ef4444;
                }
                
                .toast-warning {
                    border-left-color: #f59e0b;
                }
                
                .toast-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex: 1;
                }
                
                .toast-content i {
                    font-size: 1.2rem;
                }
                
                .toast-success .toast-content i {
                    color: #10b981;
                }
                
                .toast-error .toast-content i {
                    color: #ef4444;
                }
                
                .toast-warning .toast-content i {
                    color: #f59e0b;
                }
                
                .toast-content span {
                    color: #334155;
                    font-weight: 500;
                    font-family: 'Poppins', sans-serif;
                }
                
                .toast-close {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                
                .toast-close:hover {
                    background: #f1f5f9;
                    color: #64748b;
                }
            `;
            document.head.appendChild(style);
        }
    }
    
    // Close modal helper
    function closeAllModals() {
        $('.modal').fadeOut(300);
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }
    
    // Initialize everything
    init();
});