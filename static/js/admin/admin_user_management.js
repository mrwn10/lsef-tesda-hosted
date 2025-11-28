// admin_user_management.js - Complete Fixed Version with All Mobile Navigation Features
$(document).ready(function() {
    let users = [];
    let currentUserId = null;
    const $searchInput = $('#search-input');
    const $roleFilter = $('#role-filter');
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    let filteredUsers = [];
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initPagination();
        loadPendingUsers();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const keyword = $searchInput.val().trim();
                const role = $roleFilter.val();
                loadPendingUsers(keyword, role);
            }, 300);
        }

        // Event listeners for search and filter
        $searchInput.on('input', doSearch);
        $roleFilter.on('change', doSearch);
        
        // View details button handler
        $(document).on('click', '.view-details-btn', function() {
            const userId = $(this).data('user-id');
            viewUserDetails(userId);
        });
        
        // Mobile view details button handler
        $(document).on('click', '.mobile-view-btn', function() {
            const userId = $(this).data('user-id');
            viewUserDetails(userId);
        });
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            renderUsers();
        });
        
        // Pagination button handlers
        $('#first-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = 1;
                renderUsers();
            }
        });
        
        $('#prev-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage--;
                renderUsers();
            }
        });
        
        $('#next-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage++;
                renderUsers();
            }
        });
        
        $('#last-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = totalPages;
                renderUsers();
            }
        });
    }
    
    // Update pagination controls
    function updatePagination() {
        const totalUsers = filteredUsers.length;
        totalPages = Math.ceil(totalUsers / pageSize);
        
        // Update pagination info
        const start = ((currentPage - 1) * pageSize) + 1;
        const end = Math.min(currentPage * pageSize, totalUsers);
        $('#pagination-start').text(start);
        $('#pagination-end').text(end);
        $('#pagination-total').text(totalUsers);
        
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
                renderUsers();
            });
            $pagesContainer.append(pageBtn);
        }
        
        // Show/hide pagination
        if (totalUsers > 0) {
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

        // User Details Modal Flow
        $('#closeDetailsModal').click(function() {
            closeAllModals();
        });

        $('#close-details-modal').click(function() {
            closeAllModals();
        });

        // Approve User Flow
        $('#approveUserBtn').click(function() {
            $('#userDetailsModal').fadeOut();
            $('#approvalModal').fadeIn();
        });

        $('#cancelApproval').click(function() {
            $('#approvalModal').fadeOut();
            $('#userDetailsModal').fadeIn();
        });

        $('#close-approval-modal').click(function() {
            $('#approvalModal').fadeOut();
            $('#userDetailsModal').fadeIn();
        });

        $('#confirmApproval').click(function() {
            if (currentUserId) {
                $('#approvalModal').fadeOut();
                showLoadingScreen('Approving user...');
                updateUserStatus(currentUserId, 'approved');
            }
        });

        // Reject User Flow
        $('#rejectUserBtn').click(function() {
            $('#userDetailsModal').fadeOut();
            $('#rejectionModal').fadeIn();
        });

        $('#cancelRejection').click(function() {
            $('#rejectionModal').fadeOut();
            $('#userDetailsModal').fadeIn();
        });

        $('#close-rejection-modal').click(function() {
            $('#rejectionModal').fadeOut();
            $('#userDetailsModal').fadeIn();
        });

        $('#confirmRejection').click(function() {
            if (currentUserId) {
                $('#rejectionModal').fadeOut();
                showLoadingScreen('Rejecting user...');
                updateUserStatus(currentUserId, 'rejected');
            }
        });

        // Success Modals
        $('#closeSuccessModal').click(function() {
            closeAllModals();
            loadPendingUsers();
        });

        $('#close-success-modal').click(function() {
            closeAllModals();
            loadPendingUsers();
        });

        $('#closeRejectionSuccessModal').click(function() {
            closeAllModals();
            loadPendingUsers();
        });

        $('#close-rejection-success-modal').click(function() {
            closeAllModals();
            loadPendingUsers();
        });

        // Alert close
        $('.close-alert').click(function() {
            $('#status-message').fadeOut();
        });
    }
    
    // Show loading screen during approval/rejection
    function showLoadingScreen(message) {
        // Create loading screen if it doesn't exist
        if ($('#loading-screen').length === 0) {
            $('body').append(`
                <div id="loading-screen" class="modal" style="display: none; z-index: 3000;">
                    <div class="modal-content" style="width: 300px; text-align: center;">
                        <div class="modal-body">
                            <div class="loading-spinner" style="margin-bottom: 15px;">
                                <div class="spinner" style="width: 40px; height: 40px; margin: 0 auto;"></div>
                            </div>
                            <p id="loading-message" style="margin: 0; font-size: 16px; color: #333;">${message}</p>
                        </div>
                    </div>
                </div>
            `);
        } else {
            $('#loading-message').text(message);
        }
        
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }
    
    // Load pending users with optional search/filter
    function loadPendingUsers(query = '', role = 'all') {
        showLoadingState(true);

        $.ajax({
            url: '/admin/user-management/search_users', 
            method: 'GET',
            data: { 
                query: query, 
                role: role
            },
            success: function(response) {
                showLoadingState(false);

                if (response.success && response.users && response.users.length > 0) {
                    users = response.users;
                    filteredUsers = users;
                    currentPage = 1;
                    renderUsers();
                } else {
                    users = [];
                    filteredUsers = [];
                    renderEmptyState();
                }
            },
            error: function(xhr) {
                showLoadingState(false);
                showStatusMessage('Error loading user data: ' + (xhr.responseJSON?.message || 'Server error'), 'danger');
            }
        });
    }
    
    // Render users based on current pagination
    function renderUsers() {
        if (filteredUsers.length === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
        const currentUsers = filteredUsers.slice(startIndex, endIndex);
        
        // Render desktop table
        renderDesktopTable(currentUsers);
        
        // Render mobile cards
        renderMobileCards(currentUsers);
        
        // Update pagination
        updatePagination();
    }
    
    // Render desktop table
    function renderDesktopTable(currentUsers) {
        let tableHtml = '';
        
        currentUsers.forEach(user => {
            const registerDate = new Date(user.date_registered);
            const formattedDate = registerDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            tableHtml += `
                <tr data-user-id="${user.user_id}">
                    <td>${user.full_name || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${user.username}</td>
                    <td><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></td>
                    <td>${formattedDate}</td>
                    <td><span class="status-badge pending">Pending</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn view-btn view-details-btn" data-user-id="${user.user_id}" title="View Details">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        $('#users-container').html(tableHtml);
    }
    
    // Render mobile cards
    function renderMobileCards(currentUsers) {
        let cardsHtml = '';
        
        currentUsers.forEach(user => {
            const registerDate = new Date(user.date_registered);
            const formattedDate = registerDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            cardsHtml += `
                <div class="mobile-user-card" data-user-id="${user.user_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${user.full_name || 'N/A'}</div>
                            <div class="mobile-user-email">${user.email}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Username</div>
                            <div class="mobile-detail-value">${user.username}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Role</div>
                            <div class="mobile-detail-value"><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Registered</div>
                            <div class="mobile-detail-value">${formattedDate}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value"><span class="status-badge pending">Pending</span></div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-btn mobile-view-btn" data-user-id="${user.user_id}">
                            <i class="fas fa-eye"></i> View Details
                        </button>
                    </div>
                </div>
            `;
        });
        
        $('#mobile-users-container').html(cardsHtml);
    }
    
    // Show/hide loading state
    function showLoadingState(show) {
        if (show) {
            $('#users-container').html(`
                <tr class="loading-row">
                    <td colspan="7">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <span>Loading users...</span>
                        </div>
                    </td>
                </tr>
            `);
            $('#mobile-users-container').html(`
                <div class="loading-spinner" style="padding: 2rem; text-align: center;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <span>Loading users...</span>
                </div>
            `);
        }
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#users-container').html(`
            <tr>
                <td colspan="7" class="no-results">
                    <div class="empty-state">
                        <i class="fas fa-user-slash"></i>
                        <h3>No Pending Users Found</h3>
                        <p>There are currently no users awaiting approval.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-users-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-user-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Pending Users Found</h3>
                <p style="color: #94a3b8;">There are currently no users awaiting approval.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }
    
    // View detailed user information
    function viewUserDetails(userId) {
        currentUserId = userId;
        window.currentUserId = userId;
        
        // Show loading state
        $('#userDetailsContent').html(`
            <div class="loading-spinner">
                <div class="spinner"></div>
                <span>Loading user details...</span>
            </div>
        `);
        
        $('#userDetailsModal').fadeIn();
        
        // Load user details via AJAX
        $.get(window.appUrls.userDetails.replace('0', userId))
            .done(function(response) {
                if (response.success) {
                    const user = response.user;
                    const dob = user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'Not specified';
                    const registerDate = new Date(user.date_registered).toLocaleDateString();
                    
                    let detailsHtml = `
                        <div class="user-details-content">
                            <div class="user-detail-section">
                                <h4><i class="fas fa-id-card"></i> Personal Information</h4>
                                <div class="user-detail-grid">
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Full Name</div>
                                        <div class="user-detail-value">${user.first_name} ${user.middle_name || ''} ${user.last_name}</div>
                                    </div>
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Gender</div>
                                        <div class="user-detail-value">${user.gender || 'Not specified'}</div>
                                    </div>
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Date of Birth</div>
                                        <div class="user-detail-value">${dob}</div>
                                    </div>
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Contact Number</div>
                                        <div class="user-detail-value">${user.contact_number || 'Not provided'}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="user-detail-section">
                                <h4><i class="fas fa-address-card"></i> Account Information</h4>
                                <div class="user-detail-grid">
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Email Address</div>
                                        <div class="user-detail-value">${user.email}</div>
                                    </div>
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Username</div>
                                        <div class="user-detail-value">${user.username}</div>
                                    </div>
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">User Role</div>
                                        <div class="user-detail-value"><span class="role-badge ${user.role.toLowerCase()}">${user.role}</span></div>
                                    </div>
                                    <div class="user-detail-item">
                                        <div class="user-detail-label">Registration Date</div>
                                        <div class="user-detail-value">${registerDate}</div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="user-detail-section">
                                <h4><i class="fas fa-map-marker-alt"></i> Address Information</h4>
                                <div class="user-detail-item">
                                    <div class="user-detail-label">Complete Address</div>
                                    <div class="user-detail-value">${user.full_address || 'Not provided'}</div>
                                </div>
                            </div>
                        </div>
                    `;
                    
                    $('#userDetailsContent').html(detailsHtml);
                } else {
                    $('#userDetailsContent').html(`
                        <div class="error-message">
                            <i class="fas fa-exclamation-triangle"></i>
                            Failed to load user details: ${response.message}
                        </div>
                    `);
                }
            })
            .fail(function() {
                $('#userDetailsContent').html(`
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Failed to load user details. Please try again.
                    </div>
                `);
            });
    }

    // Update user status function
    function updateUserStatus(userId, status) {
        const approveBtn = $('#confirmApproval');
        const rejectBtn = $('#confirmRejection');
        const button = status === 'approved' ? approveBtn : rejectBtn;
        
        // Show loading state
        button.addClass('loading').prop('disabled', true);
        
        // Convert frontend status to backend status
        const backendStatus = status === 'approved' ? 'active' : 'inactive';
        
        $.ajax({
            url: window.appUrls.updateStatus,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                user_id: userId,
                status: backendStatus
            }),
            success: function(response) {
                button.removeClass('loading').prop('disabled', false);
                hideLoadingScreen();
                
                if (response.success) {
                    if (status === 'approved') {
                        $('#successMessage').text('User has been approved successfully and can now access the system.');
                        $('#successModal').fadeIn();
                    } else {
                        $('#rejectionSuccessMessage').text('User has been rejected successfully.');
                        $('#rejectionSuccessModal').fadeIn();
                    }
                    
                    // Refresh the user list after successful action
                    setTimeout(() => {
                        loadPendingUsers();
                    }, 1000);
                } else {
                    showStatusMessage('Error: ' + (response.message || 'Unknown error occurred'), 'danger');
                    // Re-open user details modal if there was an error
                    $('#userDetailsModal').fadeIn();
                }
            },
            error: function(xhr, status, error) {
                button.removeClass('loading').prop('disabled', false);
                hideLoadingScreen();
                
                let errorMessage = 'Error updating user status';
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMessage += ': ' + xhr.responseJSON.message;
                } else {
                    errorMessage += ': ' + error;
                }
                
                showStatusMessage(errorMessage, 'danger');
                // Re-open user details modal if there was an error
                $('#userDetailsModal').fadeIn();
            }
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
    
    // Initialize everything
    init();
});