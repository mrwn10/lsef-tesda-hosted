// staff_homepage.js - Complete Fixed Version with All Modal Features
$(document).ready(function() {
    let allStudents = [];
    let filteredStudents = [];
    
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
        fetchStudents();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterStudents();
            }, 300);
        }

        // Event listeners for search and filter
        $searchInput.on('input', doSearch);
        $statusFilter.on('change', doSearch);
        
        // View details button handlers
        $(document).on('click', '.view-details-btn', function() {
            const studentId = $(this).data('student-id');
            viewStudentDetails(studentId);
        });
        
        // Mobile view details button handler
        $(document).on('click', '.mobile-view-btn', function() {
            const studentId = $(this).data('student-id');
            viewStudentDetails(studentId);
        });
    }
    
    // Set active navigation based on current page
    function setActiveNavigation() {
        const currentPath = window.location.pathname;
        
        // Remove active class from all navigation links
        $('.top-nav a, .mobile-nav-links a, .mobile-nav-submenu a').removeClass('active');
        
        // Set active class based on current path
        if (currentPath.includes('staff_homepage') || currentPath === '/') {
            $('.top-nav a[href*="staff_homepage"]').addClass('active');
            $('.mobile-nav-links a[href*="staff_homepage"]').addClass('active');
        } else if (currentPath.includes('staff_class_management')) {
            $('.top-nav a[href*="staff_class_management"]').addClass('active');
            $('.mobile-nav-submenu a[href*="staff_class_management"]').addClass('active');
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
            renderStudents();
        });
        
        // Pagination button handlers
        $('#first-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = 1;
                renderStudents();
            }
        });
        
        $('#prev-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage--;
                renderStudents();
            }
        });
        
        $('#next-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage++;
                renderStudents();
            }
        });
        
        $('#last-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = totalPages;
                renderStudents();
            }
        });
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalStudents = filteredStudents.length;
        totalPages = Math.ceil(totalStudents / pageSize);
        
        // Update pagination info
        const start = ((currentPage - 1) * pageSize) + 1;
        const end = Math.min(currentPage * pageSize, totalStudents);
        $('#pagination-start').text(start);
        $('#pagination-end').text(end);
        $('#pagination-total').text(totalStudents);
        
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
                renderStudents();
            });
            $pagesContainer.append(pageBtn);
        }
        
        // Show/hide pagination
        if (totalStudents > 0) {
            $('#pagination-container').show();
        } else {
            $('#pagination-container').hide();
        }
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

        // Student Details Modal
        $('#closeDetailsModal').click(function() {
            closeAllModals();
        });

        $('#close-details-modal').click(function() {
            closeAllModals();
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
    
    // Show loading screen
    function showLoadingScreen(message) {
        $('#loading-message').text(message);
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }
    
    // Fetch students from server
    function fetchStudents() {
        showLoadingState(true);
        hideStatusMessage();

        showLoadingScreen('Loading students...');
        
        // Your existing fetch logic
        fetch('/students')
            .then(response => response.json())
            .then(data => {
                hideLoadingScreen();
                showLoadingState(false);
                
                if (data.success) {
                    allStudents = data.data;
                    filteredStudents = allStudents;
                    currentPage = 1;
                    renderStudents();
                    showStatusMessage('Students loaded successfully', 'success');
                } else {
                    showStatusMessage(data.error || 'Failed to load student data', 'danger');
                    renderEmptyState();
                }
            })
            .catch(error => {
                hideLoadingScreen();
                showLoadingState(false);
                showStatusMessage('Network error: ' + error.message, 'danger');
                renderEmptyState();
            });
    }
    
    // Filter students based on search and status
    function filterStudents() {
        const searchTerm = $searchInput.val().toLowerCase();
        const statusFilter = $statusFilter.val();
        
        filteredStudents = allStudents.filter(student => {
            // Status filter
            if (statusFilter !== 'all' && student.account_status !== statusFilter) {
                return false;
            }
            
            // Search term filter
            const name = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
            const email = (student.email || '').toLowerCase();
            const contact = (student.contact_number || '').toLowerCase();
            const address = student.baranggay ? `${student.baranggay}, ${student.municipality}, ${student.province}`.toLowerCase() : '';
            
            return name.includes(searchTerm) || 
                   email.includes(searchTerm) || 
                   contact.includes(searchTerm) ||
                   address.includes(searchTerm);
        });
        
        currentPage = 1;
        renderStudents();
    }
    
    // Render students based on current pagination
    function renderStudents() {
        if (filteredStudents.length === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredStudents.length);
        const currentStudents = filteredStudents.slice(startIndex, endIndex);
        
        // Render desktop table
        renderDesktopTable(currentStudents);
        
        // Render mobile cards
        renderMobileCards(currentStudents);
        
        // Update pagination
        updatePagination();
    }
    
    // Render desktop table
    function renderDesktopTable(currentStudents) {
        let tableHtml = '';
        
        currentStudents.forEach(student => {
            const address = student.baranggay ? `${student.baranggay}, ${student.municipality}, ${student.province}` : 'N/A';
            
            tableHtml += `
                <tr data-student-id="${student.user_id}">
                    <td>${student.first_name || ''} ${student.last_name || ''}</td>
                    <td>${student.email || 'No email'}</td>
                    <td>${student.contact_number || 'N/A'}</td>
                    <td>${address}</td>
                    <td><span class="status-badge status-${student.account_status}">${student.account_status}</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn view-btn view-details-btn" data-student-id="${student.user_id}" title="View Details">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        $('#students-container').html(tableHtml);
    }
    
    // Render mobile cards
    function renderMobileCards(currentStudents) {
        let cardsHtml = '';
        
        currentStudents.forEach(student => {
            const address = student.baranggay ? `${student.baranggay}, ${student.municipality}, ${student.province}` : 'N/A';
            
            cardsHtml += `
                <div class="mobile-user-card" data-student-id="${student.user_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${student.first_name || ''} ${student.last_name || ''}</div>
                            <div class="mobile-user-email">${student.email || 'No email'}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Contact</div>
                            <div class="mobile-detail-value">${student.contact_number || 'N/A'}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Address</div>
                            <div class="mobile-detail-value">${address}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value"><span class="status-badge status-${student.account_status}">${student.account_status}</span></div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-btn mobile-view-btn" data-student-id="${student.user_id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        });
        
        $('#mobile-students-container').html(cardsHtml);
    }
    
    // View detailed student information
    function viewStudentDetails(studentId) {
        window.currentStudentId = studentId;
        
        // Show loading state
        $('#studentDetailsContent').html(`
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Loading student details...</span>
            </div>
        `);
        
        // Open the modal
        $('#studentDetailsModal').fadeIn();
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
        
        // Find student data
        const student = allStudents.find(s => s.user_id == studentId);
        if (student) {
            renderStudentDetails(student);
        } else {
            $('#studentDetailsContent').html(`
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    Failed to load student details.
                </div>
            `);
        }
    }
    
    // Render student details in modal
    function renderStudentDetails(student) {
        const dob = student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'Not specified';
        const address = student.baranggay ? `${student.baranggay}, ${student.municipality}, ${student.province}` : 'Not provided';
        
        let detailsHtml = `
            <div class="user-details-content">
                <div class="user-detail-section">
                    <h4><i class="fas fa-id-card"></i> Personal Information</h4>
                    <div class="user-detail-grid">
                        <div class="user-detail-item">
                            <div class="user-detail-label">Full Name</div>
                            <div class="user-detail-value">${student.first_name || ''} ${student.middle_name || ''} ${student.last_name || ''}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Email</div>
                            <div class="user-detail-value">${student.email}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Contact Number</div>
                            <div class="user-detail-value">${student.contact_number || 'Not provided'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Date of Birth</div>
                            <div class="user-detail-value">${dob}</div>
                        </div>
                    </div>
                </div>
                
                <div class="user-detail-section">
                    <h4><i class="fas fa-address-card"></i> Account Information</h4>
                    <div class="user-detail-grid">
                        <div class="user-detail-item">
                            <div class="user-detail-label">Username</div>
                            <div class="user-detail-value">${student.username || 'N/A'}</div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Account Status</div>
                            <div class="user-detail-value"><span class="status-badge status-${student.account_status}">${student.account_status}</span></div>
                        </div>
                        <div class="user-detail-item">
                            <div class="user-detail-label">Registration Date</div>
                            <div class="user-detail-value">${new Date(student.date_registered).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
                
                <div class="user-detail-section">
                    <h4><i class="fas fa-map-marker-alt"></i> Address Information</h4>
                    <div class="user-detail-item">
                        <div class="user-detail-label">Complete Address</div>
                        <div class="user-detail-value">${address}</div>
                    </div>
                </div>
            </div>
        `;
        
        $('#studentDetailsContent').html(detailsHtml);
    }
    
    // Show/hide loading state
    function showLoadingState(show) {
        if (show) {
            $('#students-container').html(`
                <tr class="loading-row">
                    <td colspan="6">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <span>Loading students...</span>
                        </div>
                    </td>
                </tr>
            `);
            $('#mobile-students-container').html(`
                <div class="loading-spinner" style="padding: 2rem; text-align: center;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <span>Loading students...</span>
                </div>
            `);
        }
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#students-container').html(`
            <tr>
                <td colspan="6" class="no-results">
                    <div class="empty-state">
                        <i class="fas fa-user-slash"></i>
                        <h3>No Students Found</h3>
                        <p>There are currently no students matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-students-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-user-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Students Found</h3>
                <p style="color: #94a3b8;">There are currently no students matching your criteria.</p>
            </div>
        `);
        $('#pagination-container').hide();
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
    
    // Hide status message
    function hideStatusMessage() {
        $('#status-message').fadeOut();
    }
    
    // Show success modal
    function showSuccessModal(message) {
        $('#successMessage').text(message);
        $('#successModal').fadeIn();
    }
    
    // Initialize everything
    init();
});