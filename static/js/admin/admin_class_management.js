// admin_class_management.js - Complete Fixed Version with Consistent UI/UX
$(document).ready(function() {
    let classes = [];
    let filteredClasses = [];
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initClassDetails();
        initFiltering();
        initPagination();
        loadClasses();
    }
    
    // Load classes from existing DOM elements
    function loadClasses() {
        // Get classes from existing table rows
        const tableRows = document.querySelectorAll('#classes-container tr[data-course-title]');
        const mobileCards = document.querySelectorAll('#mobile-classes-container .mobile-user-card');
        
        classes = [];
        
        // Extract data from desktop table rows
        tableRows.forEach((row, index) => {
            const classData = {
                class_id: row.cells[0].textContent,
                class_title: row.cells[1].textContent,
                course_title: row.cells[2].textContent,
                duration: row.cells[3].textContent,
                students: row.cells[4].textContent,
                status: row.querySelector('.status-badge').textContent,
                instructor_name: row.cells[6].textContent,
                start_date: row.cells[3].textContent.split(' to ')[0],
                end_date: row.cells[3].textContent.split(' to ')[1],
                schedule: '',
                venue: '',
                max_students: row.cells[4].textContent.split('/')[1],
                current_students: row.cells[4].textContent.split('/')[0],
                date_created: ''
            };
            
            // Get additional data from the button data attribute
            const viewBtn = row.querySelector('.view-class-details-btn');
            if (viewBtn && viewBtn.dataset.classData) {
                try {
                    const additionalData = JSON.parse(viewBtn.dataset.classData.replace(/'/g, '"'));
                    Object.assign(classData, additionalData);
                } catch (e) {
                    console.error('Error parsing class data:', e);
                }
            }
            
            classes.push(classData);
        });
        
        // Format dates for all classes
        classes.forEach(cls => {
            cls.formatted_start_date = formatDate(cls.start_date);
            cls.formatted_end_date = formatDate(cls.end_date);
            cls.formatted_date_created = formatDate(cls.date_created);
        });
        
        filteredClasses = [...classes];
        currentPage = 1;
        renderClasses();
    }
    
    // Format date to "Nov 1, 2025" format
    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            renderClasses();
        });
        
        // Pagination button handlers
        $('#first-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = 1;
                renderClasses();
            }
        });
        
        $('#prev-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage--;
                renderClasses();
            }
        });
        
        $('#next-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage++;
                renderClasses();
            }
        });
        
        $('#last-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = totalPages;
                renderClasses();
            }
        });
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalClasses = filteredClasses.length;
        totalPages = Math.ceil(totalClasses / pageSize);
        
        // Update pagination info
        const start = ((currentPage - 1) * pageSize) + 1;
        const end = Math.min(currentPage * pageSize, totalClasses);
        $('#pagination-start').text(start);
        $('#pagination-end').text(end);
        $('#pagination-total').text(totalClasses);
        
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
                renderClasses();
            });
            $pagesContainer.append(pageBtn);
        }
        
        // Show/hide pagination
        if (totalClasses > 0) {
            $('#pagination-container').show();
        } else {
            $('#pagination-container').hide();
        }
    }
    
    // Render classes based on current pagination
    function renderClasses() {
        if (filteredClasses.length === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredClasses.length);
        const currentClasses = filteredClasses.slice(startIndex, endIndex);
        
        // Render desktop table
        renderDesktopTable(currentClasses);
        
        // Render mobile cards
        renderMobileCards(currentClasses);
        
        // Update pagination
        updatePagination();
    }
    
    // Render desktop table
    function renderDesktopTable(currentClasses) {
        let tableHtml = '';
        
        currentClasses.forEach(cls => {
            tableHtml += `
                <tr data-course-title="${cls.course_title}">
                    <td>${cls.class_id}</td>
                    <td>${cls.class_title}</td>
                    <td>${cls.course_title}</td>
                    <td>${cls.formatted_start_date} to ${cls.formatted_end_date}</td>
                    <td>${cls.current_students || 0}/${cls.max_students}</td>
                    <td>
                        <span class="status-badge status-${cls.status.toLowerCase()}">
                            ${cls.status}
                        </span>
                    </td>
                    <td>${cls.instructor_name}</td>
                    <td>
                        <button class="action-btn view-btn view-class-details-btn" data-class-id="${cls.class_id}" 
                                data-class-data='{
                                    "class_id": "${cls.class_id}",
                                    "class_title": "${cls.class_title}",
                                    "course_title": "${cls.course_title}",
                                    "schedule": "${cls.schedule}",
                                    "venue": "${cls.venue}",
                                    "max_students": "${cls.max_students}",
                                    "start_date": "${cls.formatted_start_date}",
                                    "end_date": "${cls.formatted_end_date}",
                                    "status": "${cls.status}",
                                    "date_created": "${cls.formatted_date_created}",
                                    "instructor_name": "${cls.instructor_name}"
                                }'>
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        $('#classes-container').html(tableHtml);
    }
    
    // Render mobile cards
    function renderMobileCards(currentClasses) {
        let cardsHtml = '';
        
        currentClasses.forEach(cls => {
            cardsHtml += `
                <div class="mobile-user-card" data-course-title="${cls.course_title}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${cls.class_title}</div>
                            <div class="mobile-user-email">${cls.course_title}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Class ID</div>
                            <div class="mobile-detail-value">${cls.class_id}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Duration</div>
                            <div class="mobile-detail-value">${cls.formatted_start_date} to ${cls.formatted_end_date}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Students</div>
                            <div class="mobile-detail-value">${cls.current_students || 0}/${cls.max_students}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge status-${cls.status.toLowerCase()}">${cls.status}</span>
                            </div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${cls.instructor_name}</div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-btn mobile-view-class-details-btn" 
                                data-class-data='{
                                    "class_id": "${cls.class_id}",
                                    "class_title": "${cls.class_title}",
                                    "course_title": "${cls.course_title}",
                                    "schedule": "${cls.schedule}",
                                    "venue": "${cls.venue}",
                                    "max_students": "${cls.max_students}",
                                    "start_date": "${cls.formatted_start_date}",
                                    "end_date": "${cls.formatted_end_date}",
                                    "status": "${cls.status}",
                                    "date_created": "${cls.formatted_date_created}",
                                    "instructor_name": "${cls.instructor_name}"
                                }'>
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        });
        
        $('#mobile-classes-container').html(cardsHtml);
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#classes-container').html(`
            <tr>
                <td colspan="8" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-users-slash"></i>
                        <h3>No Active Classes Found</h3>
                        <p>There are currently no active classes in the system.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-classes-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-users-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Active Classes Found</h3>
                <p style="color: #94a3b8;">There are currently no active classes in the system.</p>
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

        // Class Details Modal
        $('#closeClassDetailsModal').click(function() {
            closeAllModals();
        });

        $('#close-class-details-modal').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize class details functionality
    function initClassDetails() {
        // Desktop view details button handler
        $(document).on('click', '.view-class-details-btn', function() {
            const classData = $(this).data('class-data');
            viewClassDetails(classData);
        });
        
        // Mobile view details button handler
        $(document).on('click', '.mobile-view-class-details-btn', function() {
            const classData = $(this).data('class-data');
            viewClassDetails(classData);
        });
    }
    
    // Initialize filtering functionality
    function initFiltering() {
        $('#courseFilter').on('change', function() {
            filterTable();
        });
    }
    
    // View detailed class information
    function viewClassDetails(classData) {
        // Populate modal with class data
        $('#detail-class-id').text(classData.class_id);
        $('#detail-class-title').text(classData.class_title);
        $('#detail-course-title').text(classData.course_title);
        $('#detail-schedule').text(classData.schedule);
        $('#detail-venue').text(classData.venue);
        $('#detail-max-students').text(classData.max_students);
        $('#detail-start-date').text(classData.start_date);
        $('#detail-end-date').text(classData.end_date);
        $('#detail-date-created').text(classData.date_created);
        $('#detail-instructor-name').text(classData.instructor_name);
        
        // Update status with proper styling
        const statusElement = $('#detail-status');
        statusElement.text(classData.status);
        statusElement.removeClass().addClass('status-badge status-' + classData.status.toLowerCase());
        
        // Show modal
        $('#classDetailsModal').fadeIn();
        $('body').addClass('modal-open');
    }
    
    // Filter table by course title
    function filterTable() {
        const filterValue = $('#courseFilter').val().toLowerCase();
        
        if (filterValue === 'all') {
            filteredClasses = [...classes];
        } else {
            filteredClasses = classes.filter(cls => 
                cls.course_title.toLowerCase().includes(filterValue) || filterValue === ''
            );
        }
        
        currentPage = 1;
        renderClasses();
    }
    
    // Initialize everything
    init();
});