// admin_courses_avail.js - Complete Fixed Version with Consistent UI/UX
$(document).ready(function() {
    let courses = [];
    let filteredCourses = [];
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initCourseDetails();
        initFiltering();
        initPagination();
        loadCourses();
    }
    
    // Load courses from existing DOM elements
    function loadCourses() {
        // Get courses from existing table rows
        const tableRows = document.querySelectorAll('#courses-container tr[data-course-category]');
        const mobileCards = document.querySelectorAll('#mobile-courses-container .mobile-user-card');
        
        courses = [];
        
        // Extract data from desktop table rows
        tableRows.forEach((row, index) => {
            const courseData = {
                course_id: row.querySelector('.view-course-details-btn').dataset.courseId,
                course_code: row.cells[0].textContent,
                course_title: row.querySelector('.course-title-main').textContent,
                course_category: row.cells[2].textContent,
                instructor_name: row.querySelector('.instructor-name').textContent,
                user_id: row.querySelector('.instructor-id').textContent.replace('ID: ', ''),
                duration_hours: row.cells[4].textContent.replace(' hrs', ''),
                course_fee: row.cells[5].textContent.replace('₱', ''),
                course_status: row.querySelector('.status-badge').textContent,
                course_description: row.querySelector('.course-description-preview').textContent.replace('...', '')
            };
            
            // Get additional data from the button data attribute
            const viewBtn = row.querySelector('.view-course-details-btn');
            if (viewBtn && viewBtn.dataset.courseData) {
                try {
                    const additionalData = JSON.parse(viewBtn.dataset.courseData.replace(/'/g, '"'));
                    Object.assign(courseData, additionalData);
                } catch (e) {
                    console.error('Error parsing course data:', e);
                }
            }
            
            courses.push(courseData);
        });
        
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
        if (filteredCourses.length === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredCourses.length);
        const currentCourses = filteredCourses.slice(startIndex, endIndex);
        
        // Render desktop table
        renderDesktopTable(currentCourses);
        
        // Render mobile cards
        renderMobileCards(currentCourses);
        
        // Update pagination
        updatePagination();
    }
    
    // Render desktop table
    function renderDesktopTable(currentCourses) {
        let tableHtml = '';
        
        currentCourses.forEach(course => {
            tableHtml += `
                <tr data-course-category="${course.course_category}">
                    <td><span class="code-badge">${course.course_code}</span></td>
                    <td>
                        <div class="course-title-main">${course.course_title}</div>
                        <div class="course-description-preview">${course.course_description.substring(0, 60)}...</div>
                    </td>
                    <td><span class="category-badge">${course.course_category}</span></td>
                    <td>
                        <div class="instructor-info">
                            <div class="avatar">${course.first_name ? course.first_name[0] : ''}${course.last_name ? course.last_name[0] : ''}</div>
                            <div class="instructor-details">
                                <div class="instructor-name">${course.first_name} ${course.last_name}</div>
                                <div class="instructor-id">ID: ${course.user_id}</div>
                            </div>
                        </div>
                    </td>
                    <td>${course.duration_hours} hrs</td>
                    <td>₱${course.course_fee}</td>
                    <td>
                        <span class="status-badge status-${course.course_status.toLowerCase()}">
                            ${course.course_status}
                        </span>
                    </td>
                    <td>
                        <button class="action-btn view-btn view-course-details-btn" 
                                data-course-id="${course.course_id}"
                                data-course-data='{
                                    "course_id": "${course.course_id}",
                                    "course_code": "${course.course_code}",
                                    "course_title": "${course.course_title}",
                                    "course_category": "${course.course_category}",
                                    "course_description": "${course.course_description}",
                                    "duration_hours": "${course.duration_hours}",
                                    "course_fee": "${course.course_fee}",
                                    "course_status": "${course.course_status}",
                                    "user_id": "${course.user_id}",
                                    "first_name": "${course.first_name}",
                                    "last_name": "${course.last_name}",
                                    "role": "${course.role}"
                                }'>
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        $('#courses-container').html(tableHtml);
    }
    
    // Render mobile cards
    function renderMobileCards(currentCourses) {
        let cardsHtml = '';
        
        currentCourses.forEach(course => {
            cardsHtml += `
                <div class="mobile-user-card" data-course-category="${course.course_category}">
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
                            <div class="mobile-detail-value">${course.first_name} ${course.last_name}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Duration</div>
                            <div class="mobile-detail-value">${course.duration_hours} hrs</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Fee</div>
                            <div class="mobile-detail-value">₱${course.course_fee}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge status-${course.course_status.toLowerCase()}">${course.course_status}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-btn mobile-view-course-details-btn" 
                                data-course-data='{
                                    "course_id": "${course.course_id}",
                                    "course_code": "${course.course_code}",
                                    "course_title": "${course.course_title}",
                                    "course_category": "${course.course_category}",
                                    "course_description": "${course.course_description}",
                                    "duration_hours": "${course.duration_hours}",
                                    "course_fee": "${course.course_fee}",
                                    "course_status": "${course.course_status}",
                                    "user_id": "${course.user_id}",
                                    "first_name": "${course.first_name}",
                                    "last_name": "${course.last_name}",
                                    "role": "${course.role}"
                                }'>
                            <i class="fas fa-eye"></i> View Details
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
                <td colspan="8" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No Available Courses</h3>
                        <p>There are currently no active courses available in the system.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-courses-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-clipboard-list" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Available Courses</h3>
                <p style="color: #94a3b8;">There are currently no active courses available in the system.</p>
            </div>
        `);
        $('#pagination-container').hide();
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

        // Course Details Modal
        $('#closeCourseDetailsModal').click(function() {
            closeAllModals();
        });

        $('#close-course-details-modal').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize course details functionality
    function initCourseDetails() {
        // Desktop view details button handler
        $(document).on('click', '.view-course-details-btn', function() {
            const courseData = $(this).data('course-data');
            viewCourseDetails(courseData);
        });
        
        // Mobile view details button handler
        $(document).on('click', '.mobile-view-course-details-btn', function() {
            const courseData = $(this).data('course-data');
            viewCourseDetails(courseData);
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
                course.course_description.toLowerCase().includes(searchTerm) ||
                `${course.first_name} ${course.last_name}`.toLowerCase().includes(searchTerm);
            
            const matchesCategory = categoryValue === 'all' || 
                course.course_category.toLowerCase().includes(categoryValue);
            
            return matchesSearch && matchesCategory;
        });
        
        currentPage = 1;
        renderCourses();
    }
    
    // View detailed course information
    function viewCourseDetails(courseData) {
        // Populate modal with course data
        const modalContent = `
            <div class="user-detail-section">
                <h4><i class="fas fa-info-circle"></i> Course Information</h4>
                <div class="user-detail-grid">
                    <div class="user-detail-item">
                        <div class="user-detail-label">Course Code</div>
                        <div class="user-detail-value">${courseData.course_code}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Course Title</div>
                        <div class="user-detail-value">${courseData.course_title}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Category</div>
                        <div class="user-detail-value">${courseData.course_category}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Duration</div>
                        <div class="user-detail-value">${courseData.duration_hours} hours</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Course Fee</div>
                        <div class="user-detail-value">₱${courseData.course_fee}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Status</div>
                        <div class="user-detail-value">
                            <span class="status-badge status-${courseData.course_status.toLowerCase()}">
                                ${courseData.course_status}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="user-detail-section">
                <h4><i class="fas fa-user-tie"></i> Instructor Information</h4>
                <div class="user-detail-grid">
                    <div class="user-detail-item">
                        <div class="user-detail-label">Staff ID</div>
                        <div class="user-detail-value">${courseData.user_id}</div>
                    </div>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Role</div>
                        <div class="user-detail-value">${courseData.role || 'Instructor'}</div>
                    </div>
                    <div class="user-detail-item full-width">
                        <div class="user-detail-label">Instructor Name</div>
                        <div class="user-detail-value">${courseData.first_name} ${courseData.last_name}</div>
                    </div>
                </div>
            </div>
            
            <div class="user-detail-section">
                <h4><i class="fas fa-align-left"></i> Course Description</h4>
                <div class="description-box">
                    ${courseData.course_description}
                </div>
            </div>
        `;
        
        $('#courseDetailsContent').html(modalContent);
        
        // Show modal
        $('#courseDetailsModal').fadeIn();
        $('body').addClass('modal-open');
    }
    
    // Initialize everything
    init();
});