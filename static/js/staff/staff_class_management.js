// staff_class_management.js - Fixed Version with Working URLs
$(document).ready(function() {
    let allClasses = [];
    let filteredClasses = [];
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    const $searchInput = $('#search-input');
    const $statusFilter = $('#status-filter');
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initPagination();
        setActiveNavigation();
        initClassData();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterClasses();
            }, 300);
        }

        // Event listeners for search and filter
        $searchInput.on('input', doSearch);
        $statusFilter.on('change', doSearch);
    }
    
    // Initialize class data from server or existing HTML
    function initClassData() {
        // Check if we have classes data in the HTML
        const classesContainer = $('#classes-container');
        const classRows = classesContainer.find('tr[data-class-id]');
        
        if (classRows.length > 0) {
            // Extract data from existing HTML rows - KEEP ORIGINAL HTML STRUCTURE
            allClasses = [];
            classRows.each(function() {
                const $row = $(this);
                const classId = $row.data('class-id');
                const classTitle = $row.find('.class-title').text();
                const courseTitle = $row.find('td').eq(2).text();
                const schedule = $row.find('td').eq(3).text();
                const venue = $row.find('td').eq(4).text();
                
                const studentCount = $row.find('.student-count .current').text();
                const maxStudents = $row.find('.student-count .max').text();
                
                const statusBadge = $row.find('.status-badge');
                const status = statusBadge.text().toLowerCase();
                const statusClass = statusBadge.attr('class').split(' ').find(cls => cls.startsWith('status-'));
                
                const startDate = $row.find('.start-date').text();
                const endDate = $row.find('.end-date').text();
                
                // Get the original manage students URL from the existing link
                const manageUrl = $row.find('.view-btn').attr('href');
                
                allClasses.push({
                    class_id: classId,
                    class_title: classTitle,
                    course_title: courseTitle,
                    schedule: schedule,
                    venue: venue,
                    current_students: parseInt(studentCount) || 0,
                    max_students: parseInt(maxStudents) || 0,
                    status: status,
                    status_class: statusClass,
                    start_date: startDate,
                    end_date: endDate,
                    manage_url: manageUrl // Store the original URL
                });
            });
            
            filteredClasses = allClasses;
            
            // Instead of re-rendering, just hide/show rows for pagination
            setupPaginationFiltering();
        } else {
            // No classes found, show empty state
            renderEmptyState();
        }
    }
    
    // NEW APPROACH: Instead of re-rendering HTML, hide/show rows for pagination
    function setupPaginationFiltering() {
        const totalClasses = filteredClasses.length;
        if (totalClasses === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        totalPages = Math.ceil(totalClasses / pageSize);
        
        // Show/hide rows based on current page
        updateTableVisibility();
        updatePagination();
    }
    
    // Update table row visibility based on current page
    function updateTableVisibility() {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredClasses.length);
        
        // Get all class rows
        const classRows = $('#classes-container').find('tr[data-class-id]');
        
        // Hide all rows first
        classRows.hide();
        
        // Show only rows for current page
        classRows.slice(startIndex, endIndex).show();
        
        // Update mobile cards
        renderMobileCards(filteredClasses.slice(startIndex, endIndex));
    }
    
    // Set active navigation based on current page
    function setActiveNavigation() {
        const currentPath = window.location.pathname;
        
        // Remove active class from all navigation links
        $('.top-nav a, .mobile-nav-links a, .mobile-nav-submenu a').removeClass('active');
        
        // Set active class based on current path
        if (currentPath.includes('staff_class_management')) {
            $('.top-nav a[href*="staff_class_management"]').addClass('active');
            $('.mobile-nav-submenu a[href*="staff_class_management"]').addClass('active');
        } else if (currentPath.includes('staff_homepage') || currentPath === '/') {
            $('.top-nav a[href*="staff_homepage"]').addClass('active');
            $('.mobile-nav-links a[href*="staff_homepage"]').addClass('active');
        } else if (currentPath.includes('staff_courses_creation')) {
            $('.top-nav a[href*="staff_courses_creation"]').addClass('active');
            $('.mobile-nav-submenu a[href*="staff_courses_creation"]').addClass('active');
        } else if (currentPath.includes('staff_materials')) {
            $('.top-nav a[href*="staff_materials"]').addClass('active');
            $('.mobile-nav-links a[href*="staff_materials"]').addClass('active');
        }
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
                setupPaginationFiltering();
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
    
    // Filter classes based on search and status
    function filterClasses() {
        const searchTerm = $searchInput.val().toLowerCase();
        const statusFilter = $statusFilter.val();
        
        if (searchTerm === '' && statusFilter === 'all') {
            // No filtering needed, show all classes
            filteredClasses = allClasses;
        } else {
            filteredClasses = allClasses.filter(cls => {
                // Status filter
                if (statusFilter !== 'all' && cls.status !== statusFilter) {
                    return false;
                }
                
                // Search term filter
                const classTitle = (cls.class_title || '').toLowerCase();
                const courseTitle = (cls.course_title || '').toLowerCase();
                const venue = (cls.venue || '').toLowerCase();
                
                return classTitle.includes(searchTerm) || 
                       courseTitle.includes(searchTerm) || 
                       venue.includes(searchTerm);
            });
        }
        
        currentPage = 1;
        setupPaginationFiltering();
    }
    
    // Render mobile cards (only for mobile view)
    function renderMobileCards(currentClasses) {
        let cardsHtml = '';
        
        currentClasses.forEach(cls => {
            cardsHtml += `
                <div class="mobile-user-card" data-class-id="${cls.class_id}">
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
                            <div class="mobile-detail-label">Schedule</div>
                            <div class="mobile-detail-value">${cls.schedule}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Venue</div>
                            <div class="mobile-detail-value">${cls.venue}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Students</div>
                            <div class="mobile-detail-value">${cls.current_students}/${cls.max_students}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value"><span class="status-badge ${cls.status_class || 'status-' + cls.status}">${cls.status}</span></div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Dates</div>
                            <div class="mobile-detail-value">${cls.start_date} to ${cls.end_date}</div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <a href="${cls.manage_url}" class="mobile-action-btn view-btn">
                            <i class="fas fa-users"></i> Manage Students
                        </a>
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
                <td colspan="9" class="no-results">
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>No Classes Found</h3>
                        <p>There are currently no classes matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-classes-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-book-open" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Classes Found</h3>
                <p style="color: #94a3b8;">There are currently no classes matching your criteria.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }

    // ===== MOBILE NAVIGATION AND MODAL FUNCTIONS (UNCHANGED) =====
    
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
    
    // Initialize everything
    init();
});