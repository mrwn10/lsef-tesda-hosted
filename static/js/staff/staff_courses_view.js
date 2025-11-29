// staff_courses_view.js - Complete Frontend Functionality
$(document).ready(function() {
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initPagination();
        initSearchFilter();
        initTableSorting();
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
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
    
    // Initialize table sorting
    function initTableSorting() {
        const tableHeaders = document.querySelectorAll('.user-table th');
        
        tableHeaders.forEach((header, columnIndex) => {
            header.addEventListener('click', function() {
                const table = this.closest('table');
                const tbody = table.querySelector('tbody');
                const rows = Array.from(tbody.querySelectorAll('tr'));
                
                // Toggle sorting direction
                const isAscending = !this.classList.contains('asc');
                tableHeaders.forEach(h => {
                    h.classList.remove('asc', 'desc');
                    h.querySelector('i')?.classList.remove('fa-sort-up', 'fa-sort-down');
                });
                
                this.classList.add(isAscending ? 'asc' : 'desc');
                
                // Update sort icon
                const icon = this.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-sort');
                    icon.classList.add(isAscending ? 'fa-sort-up' : 'fa-sort-down');
                }
                
                rows.sort((a, b) => {
                    const aText = a.cells[columnIndex].textContent.trim();
                    const bText = b.cells[columnIndex].textContent.trim();
                    
                    // Numeric sorting for fee (column 4) and max students (column 5)
                    if (columnIndex === 4) {
                        const aNum = parseFloat(aText.replace(/[^0-9.]/g, ''));
                        const bNum = parseFloat(bText.replace(/[^0-9.]/g, ''));
                        return isAscending ? aNum - bNum : bNum - aNum;
                    }
                    
                    if (columnIndex === 5) {
                        const aNum = parseInt(aText);
                        const bNum = parseInt(bText);
                        return isAscending ? aNum - bNum : bNum - aNum;
                    }
                    
                    // Date sorting for date created (column 7)
                    if (columnIndex === 7 && aText !== 'N/A' && bText !== 'N/A') {
                        return isAscending 
                            ? new Date(aText) - new Date(bText)
                            : new Date(bText) - new Date(aText);
                    }
                    
                    // Default text sorting
                    return isAscending 
                        ? aText.localeCompare(bText)
                        : bText.localeCompare(aText);
                });
                
                // Re-append sorted rows
                rows.forEach(row => tbody.appendChild(row));
            });
        });
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
});