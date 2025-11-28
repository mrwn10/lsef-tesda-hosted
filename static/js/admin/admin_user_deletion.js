// admin_user_deletion.js - Complete Fixed Version with All Mobile Navigation Features
$(document).ready(function() {
    let users = [];
    let currentUserId = null;
    let selectedUserName = null;
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
        loadActiveUsers();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const keyword = $searchInput.val().trim();
                const role = $roleFilter.val();
                loadActiveUsers(keyword, role);
            }, 300);
        }

        // Event listeners for search and filter
        $searchInput.on('input', doSearch);
        $roleFilter.on('change', doSearch);
        
        // Delete button handler
        $(document).on('click', '.delete-btn', function() {
            const userId = $(this).data('userid');
            showUserDetails(userId);
        });
        
        // Mobile delete button handler
        $(document).on('click', '.mobile-delete-btn', function() {
            const userId = $(this).data('userid');
            showUserDetails(userId);
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

        // Confirmation Modal Flow
        $('#close-confirmation-modal').click(function() {
            closeAllModals();
        });

        // Success Modals
        $('#closeSuccessModal').click(function() {
            closeAllModals();
            loadActiveUsers();
        });

        $('#close-success-modal').click(function() {
            closeAllModals();
            loadActiveUsers();
        });

        // Alert close
        $('.close-alert').click(function() {
            $('#status-message').fadeOut();
        });
        
        // Cancel button handler for confirmation modal
        $(document).on('click', '.cancel-btn', function() {
            closeAllModals();
        });
        
        // Confirm delete button handler
        $(document).on('click', '#confirmDeleteBtn', function() {
            deleteUser();
        });
    }
    
    // Show loading screen during operations
    function showLoadingScreen(message) {
        $('#loading-message').text(message);
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }
    
    // Load active users with optional search/filter
    function loadActiveUsers(query = '', role = 'all') {
        showLoadingState(true);

        $.ajax({
            url: window.appUrls.activeUsers,
            method: 'GET',
            success: function(response) {
                showLoadingState(false);

                if (response.users && response.users.length > 0) {
                    users = response.users;
                    
                    // Apply filters
                    filteredUsers = users.filter(user => {
                        const matchesRole = role === 'all' || user.role.toLowerCase() === role.toLowerCase();
                        const matchesSearch = !query || 
                            user.username.toLowerCase().includes(query.toLowerCase()) ||
                            user.email.toLowerCase().includes(query.toLowerCase()) ||
                            `${user.first_name} ${user.last_name}`.toLowerCase().includes(query.toLowerCase());
                        
                        return matchesRole && matchesSearch;
                    });
                    
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
            
            const fullName = [user.first_name, user.middle_name, user.last_name].filter(name => name).join(' ');

            tableHtml += `
                <tr data-user-id="${user.user_id}">
                    <td>
                        <div class="user-info">
                            <div class="user-avatar">
                                <i class="fas fa-user-circle"></i>
                            </div>
                            <div class="user-details">
                                <span class="user-name">${fullName}</span>
                                <span class="user-id">ID: ${user.user_id}</span>
                            </div>
                        </div>
                    </td>
                    <td>${user.email}</td>
                    <td>${user.contact_number || 'N/A'}</td>
                    <td>${formattedDate}</td>
                    <td><span class="role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                    <td><span class="status-badge status-${user.account_status.toLowerCase()}">${user.account_status}</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn delete-btn" data-userid="${user.user_id}" title="Delete User">
                                <i class="fas fa-trash-alt"></i> Delete
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
            
            const fullName = [user.first_name, user.middle_name, user.last_name].filter(name => name).join(' ');
            
            cardsHtml += `
                <div class="mobile-user-card" data-user-id="${user.user_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${fullName}</div>
                            <div class="mobile-user-email">${user.email}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">User ID</div>
                            <div class="mobile-detail-value">${user.user_id}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Contact</div>
                            <div class="mobile-detail-value">${user.contact_number || 'N/A'}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Role</div>
                            <div class="mobile-detail-value"><span class="role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Registered</div>
                            <div class="mobile-detail-value">${formattedDate}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value"><span class="status-badge status-${user.account_status.toLowerCase()}">${user.account_status}</span></div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn delete-btn mobile-delete-btn" data-userid="${user.user_id}">
                            <i class="fas fa-trash-alt"></i> Delete User
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
                        <h3>No Active Users Found</h3>
                        <p>There are currently no active users to display.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-users-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-user-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Active Users Found</h3>
                <p style="color: #94a3b8;">There are currently no active users to display.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }
    
    // Show user details in confirmation modal
    function showUserDetails(userId) {
        currentUserId = userId;
        window.currentUserId = userId;
        
        const detailsContainer = $('#userDetailsContainer');
        detailsContainer.html('<div class="loading-spinner"><div class="spinner"></div><span>Loading user details...</span></div>');
        
        $('#confirmationModal').fadeIn();
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');

        // Find user in filtered users
        const user = filteredUsers.find(u => u.user_id == userId);
        if (user) {
            selectedUserName = [user.first_name, user.middle_name, user.last_name].filter(n => n).join(' ');
            
            const registerDate = new Date(user.date_registered);
            const formattedDate = registerDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            detailsContainer.html(`
                <div class="user-details-content">
                    <div class="user-detail-section">
                        <h4><i class="fas fa-user"></i> User Information</h4>
                        <div class="user-detail-grid">
                            <div class="user-detail-item">
                                <div class="user-detail-label">User ID</div>
                                <div class="user-detail-value">${user.user_id}</div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Full Name</div>
                                <div class="user-detail-value">${selectedUserName}</div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Username</div>
                                <div class="user-detail-value">${user.username}</div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Email</div>
                                <div class="user-detail-value">${user.email}</div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Contact Number</div>
                                <div class="user-detail-value">${user.contact_number || 'N/A'}</div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Role</div>
                                <div class="user-detail-value"><span class="role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Status</div>
                                <div class="user-detail-value"><span class="status-badge status-${user.account_status.toLowerCase()}">${user.account_status}</span></div>
                            </div>
                            <div class="user-detail-item">
                                <div class="user-detail-label">Date Registered</div>
                                <div class="user-detail-value">${formattedDate}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);
        } else {
            $('#confirmationModal').fadeOut();
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
            showStatusMessage('User not found', 'danger');
        }
    }

    // Delete user function
    function deleteUser() {
        if (!currentUserId) {
            showStatusMessage('No user selected for deletion', 'danger');
            return;
        }

        // Disable button and show loading state
        $('#confirmDeleteBtn').prop('disabled', true).addClass('loading').html('<i class="fas fa-spinner fa-spin"></i> Deleting...');

        showLoadingScreen('Archiving and deleting user...');

        $.ajax({
            url: window.appUrls.deleteUser,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ user_id: currentUserId }),
            success: function(response) {
                hideLoadingScreen();
                if (response.success) {
                    $('#confirmationModal').fadeOut();
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
                    
                    $('#successMessage').text(`User "${selectedUserName}" has been successfully deleted and archived.`);
                    $('#successModal').fadeIn();
                    
                    loadActiveUsers();
                } else {
                    showStatusMessage(response.message || 'Deletion failed', 'danger');
                }
            },
            error: function(xhr) {
                hideLoadingScreen();
                showStatusMessage('Error deleting user: ' + (xhr.responseJSON?.message || 'Server error'), 'danger');
            },
            complete: function() {
                // Reset button state
                setTimeout(() => {
                    $('#confirmDeleteBtn').prop('disabled', false).removeClass('loading').html('<i class="fas fa-trash-alt"></i> Archive User');
                }, 500);
            }
        });
    }

    // Show status messages
    function showStatusMessage(message, type) {
        const statusMessage = $('#status-message');
        const messageText = $('#message-text');
        
        statusMessage.removeClass().addClass(`alert ${type}`);
        messageText.text(message);
        statusMessage.show();
        setTimeout(() => statusMessage.hide(), 5000);
    }

    // Initialize everything
    init();
});