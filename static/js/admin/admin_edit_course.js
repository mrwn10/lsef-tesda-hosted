// admin_edit_course.js - Complete Fixed Version
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
        initCourseEdit();
        initFiltering();
        initPagination();
        loadCourses();
        addSweetAlertStyles();
    }
    
    // Load courses from existing DOM elements
    function loadCourses() {
        console.log('Loading courses from DOM...');
        
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
            const courseStatus = cells[3]?.querySelector('.status-badge')?.textContent?.trim() || 
                               cells[3]?.textContent?.trim() || 'N/A';
            const duration = cells[4]?.textContent?.trim() || 'N/A';
            const courseFee = cells[5]?.textContent?.trim() || 'N/A';

            const courseData = {
                course_id: courseId,
                course_code: courseCode,
                course_title: courseTitle,
                course_category: courseCategory,
                course_status: courseStatus,
                duration: duration,
                course_fee: courseFee
            };
            
            // Try to get additional data from button data attributes
            const editBtn = row.querySelector('.edit-course-btn, .action-btn');
            if (editBtn) {
                const courseDataAttr = editBtn.getAttribute('data-course-data');
                
                if (courseDataAttr) {
                    try {
                        const additionalData = typeof courseDataAttr === 'string' ? 
                            JSON.parse(courseDataAttr.replace(/'/g, '"')) : 
                            courseDataAttr;
                        Object.assign(courseData, additionalData);
                    } catch (e) {
                        console.log('Could not parse course data, using raw values');
                    }
                }
                
                courseData.edit_button = editBtn;
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
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge status-${course.course_status.toLowerCase()}">
                                    <i class="fas fa-circle"></i> ${course.course_status}
                                </span>
                            </div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Duration</div>
                            <div class="mobile-detail-value">${course.duration}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Fee</div>
                            <div class="mobile-detail-value">${course.course_fee}</div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn edit-btn mobile-edit-course-btn" 
                                data-course-id="${course.course_id}">
                            <i class="fas fa-edit"></i> Edit Course
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
                <td colspan="7" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-book"></i>
                        <h3>No Courses Found</h3>
                        <p>No courses match your current search and filters.</p>
                    </div>
                </td>
            </tr>
        `);
        
        $('#mobile-courses-container').html(`
            <div class="empty-state">
                <i class="fas fa-book"></i>
                <h3>No Courses Found</h3>
                <p>No courses match your current search and filters.</p>
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

        // Edit Course Modal
        $('#close-edit-modal').click(function() {
            closeAllModals();
        });
        
        $('#cancelEditBtn').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize course edit functionality
    function initCourseEdit() {
        // Desktop edit button handler
        $(document).on('click', '.edit-course-btn', function() {
            const courseId = $(this).data('course-id');
            if (courseId) {
                openEditModal(courseId);
            }
        });
        
        // Mobile edit button handler
        $(document).on('click', '.mobile-edit-course-btn', function() {
            const courseId = $(this).data('course-id');
            if (courseId) {
                openEditModal(courseId);
            }
        });
        
        // Save button handler
        $('#saveEditBtn').click(function() {
            saveCourseEdits();
        });
        
        // Form submission handler
        $('#editCourseForm').on('submit', function(e) {
            e.preventDefault();
            saveCourseEdits();
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
        
        // Status filter functionality
        $('#statusFilter').on('change', function() {
            filterCourses();
        });
    }
    
    // Filter courses based on search, category, and status
    function filterCourses() {
        const searchTerm = $('#searchInput').val().toLowerCase();
        const categoryValue = $('#categoryFilter').val().toLowerCase();
        const statusValue = $('#statusFilter').val().toLowerCase();
        
        filteredCourses = courses.filter(course => {
            const matchesSearch = !searchTerm || 
                course.course_title.toLowerCase().includes(searchTerm) ||
                course.course_code.toLowerCase().includes(searchTerm) ||
                course.course_description?.toLowerCase().includes(searchTerm);
            
            const matchesCategory = categoryValue === 'all' || 
                course.course_category.toLowerCase().includes(categoryValue);
            
            const matchesStatus = statusValue === 'all' || 
                course.course_status.toLowerCase().includes(statusValue);
            
            return matchesSearch && matchesCategory && matchesStatus;
        });
        
        currentPage = 1;
        renderCourses();
    }
    
    // Open edit modal
    function openEditModal(courseId) {
        currentCourseId = courseId;
        
        fetch(`/admin/course/${courseId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    const course = data.course;
                    document.getElementById('editCourseId').value = course.course_id;
                    document.getElementById('editCourseCode').value = course.course_code;
                    document.getElementById('editCourseTitle').value = course.course_title;
                    document.getElementById('editCourseDescription').value = course.course_description;
                    document.getElementById('editCourseCategory').value = course.course_category;
                    document.getElementById('editTargetAudience').value = course.target_audience;
                    document.getElementById('editPrerequisites').value = course.prerequisites || '';
                    document.getElementById('editLearningOutcomes').value = course.learning_outcomes || '';
                    document.getElementById('editDurationHours').value = course.duration_hours;
                    document.getElementById('editCourseFee').value = course.course_fee;
                    document.getElementById('editMaxStudents').value = 25; // Always set to 25
                    document.getElementById('editPublished').value = course.published;

                    // Open modal
                    $('#editModal').fadeIn();
                    $('body').addClass('modal-open');
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: data.message,
                        icon: 'error',
                        confirmButtonColor: '#003366'
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching course details:', error);
                Swal.fire({
                    title: 'Error',
                    text: 'Failed to fetch course details',
                    icon: 'error',
                    confirmButtonColor: '#003366'
                });
            });
    }
    
    // Save course edits
    function saveCourseEdits() {
        const courseId = document.getElementById('editCourseId').value;
        const form = document.getElementById('editCourseForm');
        const formData = new FormData(form);
        const data = {};

        // Convert FormData to object
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Type conversion for numbers + hardcoded max students
        data.duration_hours = parseInt(data.duration_hours);
        data.course_fee = data.course_fee ? parseFloat(data.course_fee) : 0.00;
        data.max_students = 25; // Hardcoded to 25
        data.published = parseInt(data.published);

        // Show loading state
        const saveButton = $('#saveEditBtn');
        const originalText = saveButton.html();
        saveButton.html('<i class="fas fa-spinner fa-spin"></i> Saving...');
        saveButton.prop('disabled', true);

        fetch(`/admin/update_course/${courseId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                closeAllModals();
                Swal.fire({
                    title: 'Success!',
                    text: data.message,
                    icon: 'success',
                    confirmButtonColor: '#003366',
                    customClass: {
                        popup: 'sweetalert-custom-zindex'
                    }
                }).then(() => {
                    window.location.reload();
                });
            } else {
                throw new Error(data.message || 'Update failed');
            }
        })
        .catch(error => {
            console.error('Error updating course:', error);
            Swal.fire({
                title: 'Error',
                text: error.message,
                icon: 'error',
                confirmButtonColor: '#003366',
                customClass: {
                    popup: 'sweetalert-custom-zindex'
                }
            });
        })
        .finally(() => {
            // Reset button state
            saveButton.html(originalText);
            saveButton.prop('disabled', false);
        });
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