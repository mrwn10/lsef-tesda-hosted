// staff_courses_edit_req.js - Fixed Version with Frontend Features Only
$(document).ready(function() {
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initPagination();
        initSearchFilter();
        
        // Edit button handlers
        $(document).on('click', '.edit-course-btn, .mobile-edit-btn', function() {
            const courseId = $(this).data('course-id');
            openEditModal(courseId);
        });
        
        // Save edits button handler
        $('#saveCourseEdits').click(function() {
            saveCourseEdits();
        });
        
        // Close edit modal handler
        $('#closeEditModal').click(function() {
            closeEditModal();
        });
        
        $('#close-edit-modal').click(function() {
            closeEditModal();
        });
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
            // Simple pagination logic - in a real app, this would make a server request
            const pageSize = parseInt($(this).val());
            updatePaginationInfo(pageSize);
        });
    }
    
    // Update pagination info
    function updatePaginationInfo(pageSize = 10) {
        const totalCourses = $('.user-table tbody tr').length;
        const totalPages = Math.ceil(totalCourses / pageSize);
        
        $('#pagination-start').text(1);
        $('#pagination-end').text(Math.min(pageSize, totalCourses));
        $('#pagination-total').text(totalCourses);
    }
    
    // Initialize search and filter
    function initSearchFilter() {
        let searchTimeout = null;
        
        $('#search-input').on('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterCourses();
            }, 300);
        });
        
        $('#status-filter').on('change', function() {
            filterCourses();
        });
    }
    
    // Filter courses based on search and status
    function filterCourses() {
        const searchTerm = $('#search-input').val().toLowerCase();
        const statusFilter = $('#status-filter').val();
        
        $('.user-table tbody tr, .mobile-user-card').each(function() {
            const $row = $(this);
            const courseCode = $row.find('td:eq(0)').text().toLowerCase();
            const courseTitle = $row.find('td:eq(1)').text().toLowerCase();
            const courseCategory = $row.find('.category-badge').text().toLowerCase();
            const courseStatus = $row.find('.status-badge').text().toLowerCase();
            
            let shouldShow = true;
            
            // Status filter
            if (statusFilter !== 'all' && courseStatus !== statusFilter) {
                shouldShow = false;
            }
            
            // Search filter
            if (searchTerm && !courseCode.includes(searchTerm) && 
                !courseTitle.includes(searchTerm) && 
                !courseCategory.includes(searchTerm)) {
                shouldShow = false;
            }
            
            if (shouldShow) {
                $row.show();
            } else {
                $row.hide();
            }
        });
        
        // Update pagination info after filtering
        const visibleCount = $('.user-table tbody tr:visible').length;
        $('#pagination-end').text(visibleCount);
        $('#pagination-total').text(visibleCount);
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
            $('#status-message').fadeOut();
        });
    }
    
    // Open edit modal - YOUR ORIGINAL FUNCTION
    function openEditModal(courseId) {
        axios.get(`/course/edit/${courseId}`)
            .then(response => {
                if (response.data.status === 'success') {
                    const course = response.data.course;
                    document.getElementById('editCourseId').value = course.course_id;
                    document.getElementById('editCourseCode').value = course.course_code;
                    document.getElementById('editCourseTitle').value = course.course_title;
                    document.getElementById('editCourseDescription').value = course.course_description;
                    
                    // Set dropdown values
                    document.getElementById('editCourseCategory').value = course.course_category;
                    document.getElementById('editTargetAudience').value = course.target_audience;
                    
                    document.getElementById('editPrerequisites').value = course.prerequisites;
                    document.getElementById('editLearningOutcomes').value = course.learning_outcomes;
                    document.getElementById('editDurationHours').value = course.duration_hours;
                    document.getElementById('editCourseFee').value = course.course_fee;
                    
                    // Force max students to 25
                    document.getElementById('editMaxStudents').value = 25;
                    
                    // Clear previous reason
                    document.getElementById('editReason').value = '';

                    // Open the modal
                    $('#editModal').fadeIn();
                    document.body.style.overflow = 'hidden';
                    document.body.classList.add('modal-open');
                } else {
                    showStatusMessage(response.data.message, 'danger');
                }
            })
            .catch(error => {
                console.error('Error fetching course details:', error);
                showStatusMessage('Failed to fetch course details. Please try again.', 'danger');
            });
    }

    // Close edit modal
    function closeEditModal() {
        $('#editModal').fadeOut();
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }

    // Save course edits - YOUR ORIGINAL FUNCTION
    function saveCourseEdits() {
        const courseId = document.getElementById('editCourseId').value;
        const reason = document.getElementById('editReason').value.trim();

        if (!reason) {
            showStatusMessage('Please provide a reason for the edit.', 'warning');
            return;
        }

        const data = {
            course_code: document.getElementById('editCourseCode').value,
            course_title: document.getElementById('editCourseTitle').value,
            course_description: document.getElementById('editCourseDescription').value,
            course_category: document.getElementById('editCourseCategory').value,
            target_audience: document.getElementById('editTargetAudience').value,
            prerequisites: document.getElementById('editPrerequisites').value,
            learning_outcomes: document.getElementById('editLearningOutcomes').value,
            duration_hours: document.getElementById('editDurationHours').value,
            course_fee: document.getElementById('editCourseFee').value,
            max_students: 25, // Always set to 25
            edit_reason: reason
        };

        axios.post(`/course/update/${courseId}`, data)
            .then(response => {
                if (response.data.status === 'success') {
                    closeEditModal();
                    showSuccessModal('Course updated successfully!');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else {
                    showStatusMessage(response.data.message || 'Failed to update course.', 'danger');
                }
            })
            .catch(error => {
                console.error('Error updating course:', error);
                showStatusMessage('An error occurred while updating the course. Please try again.', 'danger');
            });
    }
    
    // Show status message
    function showStatusMessage(message, type) {
        const $alert = $('#status-message');
        const $messageText = $('#message-text');
        
        $alert.removeClass('success danger warning').addClass(type);
        $messageText.text(message);
        $alert.fadeIn();
        
        // Auto-hide after 5 seconds
        setTimeout(() => $alert.fadeOut(), 5000);
    }
    
    // Show success modal
    function showSuccessModal(message) {
        $('#successMessage').text(message);
        $('#successModal').fadeIn();
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }
    
    // Initialize everything
    init();
    
    // Additional protection for max students field - YOUR ORIGINAL CODE
    document.addEventListener('DOMContentLoaded', function() {
        const maxStudentsInput = document.getElementById('editMaxStudents');
        
        if (maxStudentsInput) {
            // Set fixed value and disable input
            maxStudentsInput.value = 25;
            maxStudentsInput.readOnly = true;
            
            // Additional protection - reset to 25 if value changes
            maxStudentsInput.addEventListener('input', function() {
                if (this.value !== '25') {
                    this.value = 25;
                }
            });
            
            // Also handle change event for additional protection
            maxStudentsInput.addEventListener('change', function() {
                this.value = 25;
            });
        }
    });
});