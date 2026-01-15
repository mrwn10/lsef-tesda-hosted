// admin_user_archive.js - Updated for Inactive Users Management
$(document).ready(function() {
    let users = [];
    let selectedUserId = null;
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
        initModals(); // Restored original modals functionality
        initPagination();
        loadInactiveUsers();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const keyword = $searchInput.val().trim();
                const role = $roleFilter.val();
                loadInactiveUsers(keyword, role);
            }, 300);
        }

        // Event listeners for search and filter
        $searchInput.on('input', doSearch);
        $roleFilter.on('change', doSearch);
        
        // Restore button handler (using SweetAlert)
        $(document).on('click', '.restore-btn', function() {
            const userId = $(this).data('userid');
            const userName = $(this).data('username');
            confirmRestoreUser(userId, userName);
        });
        
        // Delete button handler (using SweetAlert)
        $(document).on('click', '.delete-btn', function() {
            const userId = $(this).data('userid');
            const userName = $(this).data('username');
            confirmDeleteUser(userId, userName);
        });
        
        // Mobile button handlers (using SweetAlert)
        $(document).on('click', '.mobile-restore-btn', function() {
            const userId = $(this).data('userid');
            const userName = $(this).data('username');
            confirmRestoreUser(userId, userName);
        });
        
        $(document).on('click', '.mobile-delete-btn', function() {
            const userId = $(this).data('userid');
            const userName = $(this).data('username');
            confirmDeleteUser(userId, userName);
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
    
    // Initialize all modals (keeping original logout modal behavior)
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

        // Logout Modal (KEEP ORIGINAL EXACTLY)
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

        // Success Modal close button (optional - can remove if not using)
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
    
    // Show loading screen during operations
    function showLoadingScreen(message) {
        $('#loading-message').text(message);
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }
    
    // Load inactive users with optional search/filter
    function loadInactiveUsers(query = '', role = 'all') {
        showLoadingState(true);

        $.ajax({
            url: window.appUrls.inactiveUsers,
            method: 'GET',
            success: function(response) {
                showLoadingState(false);

                if (response.users && response.users.length > 0) {
                    users = response.users;
                    
                    // Apply filters
                    filteredUsers = users.filter(user => {
                        const matchesRole = role === 'all' || user.role.toLowerCase() === role.toLowerCase();
                        const matchesSearch = !query || 
                            (user.username && user.username.toLowerCase().includes(query.toLowerCase())) ||
                            (user.email && user.email.toLowerCase().includes(query.toLowerCase())) ||
                            (user.full_name && user.full_name.toLowerCase().includes(query.toLowerCase()));
                        
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
                showStatusMessage('Error loading inactive user data: ' + (xhr.responseJSON?.message || 'Server error'), 'danger');
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
            
            const fullName = user.full_name || 'N/A';

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
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.contact_number || 'N/A'}</td>
                    <td>${formattedDate}</td>
                    <td><span class="role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                    <td><span class="status-badge status-inactive">Inactive</span></td>
                    <td>
                        <div class="action-btn-group">
                            <button class="action-btn restore-btn" 
                                    data-userid="${user.user_id}" 
                                    data-username="${fullName}"
                                    title="Restore User">
                                <i class="fas fa-undo-alt"></i> Restore
                            </button>
                            <button class="action-btn delete-btn" 
                                    data-userid="${user.user_id}"
                                    data-username="${fullName}"
                                    title="Delete Permanently">
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
            
            const fullName = user.full_name || 'N/A';
            
            cardsHtml += `
                <div class="mobile-user-card" data-user-id="${user.user_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${fullName}</div>
                            <div class="mobile-user-email">${user.email || 'N/A'}</div>
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
                            <div class="mobile-detail-value"><span class="status-badge status-inactive">Inactive</span></div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn restore-btn mobile-restore-btn" 
                                data-userid="${user.user_id}" 
                                data-username="${fullName}">
                            <i class="fas fa-undo-alt"></i> Restore
                        </button>
                        <button class="mobile-action-btn delete-btn mobile-delete-btn"
                                data-userid="${user.user_id}"
                                data-username="${fullName}">
                            <i class="fas fa-trash-alt"></i> Delete
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
                            <span>Loading inactive users...</span>
                        </div>
                    </td>
                </tr>
            `);
            $('#mobile-users-container').html(`
                <div class="loading-spinner" style="padding: 2rem; text-align: center;">
                    <div class="spinner" style="margin: 0 auto;"></div>
                    <span>Loading inactive users...</span>
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
                        <h3>No Inactive Users Found</h3>
                        <p>There are currently no inactive users to display.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-users-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-user-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Inactive Users Found</h3>
                <p style="color: #94a3b8;">There are currently no inactive users to display.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }
    
    // Confirm restore user with SweetAlert
    function confirmRestoreUser(userId, userName) {
        selectedUserId = userId;
        selectedUserName = userName;
        
        Swal.fire({
            title: 'Restore User Account',
            html: `Are you sure you want to restore <strong>${userName}</strong>?<br><br>
                  <div style="text-align: left; background: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #065f46;">This action will:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                        <li>Change account status to <strong>active</strong></li>
                        <li>Allow the user to login again</li>
                        <li>Preserve all user data and settings</li>
                    </ul>
                  </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Restore',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return restoreUser();
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Success is handled in restoreUser function
            }
        });
    }
    
    // Confirm delete user with SweetAlert
    function confirmDeleteUser(userId, userName) {
        selectedUserId = userId;
        selectedUserName = userName;
        
        Swal.fire({
            title: 'Delete User Account',
            html: `Are you sure you want to permanently delete <strong>${userName}</strong>?<br><br>
                  <div style="text-align: left; background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0 0 10px 0; font-weight: 600; color: #92400e;">Warning:</p>
                    <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                        <li>This action is currently <strong>disabled</strong></li>
                        <li>No data will be deleted at this time</li>
                        <li>This is a placeholder for future implementation</li>
                    </ul>
                  </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete (Placeholder)',
            cancelButtonText: 'Cancel',
            reverseButtons: true,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return deleteUser();
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Success is handled in deleteUser function
            }
        });
    }
    
    // Restore user function
    function restoreUser() {
        return new Promise((resolve, reject) => {
            showLoadingScreen('Restoring user account...');

            $.ajax({
                url: window.appUrls.restoreUser,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ user_id: selectedUserId }),
                success: function(response) {
                    hideLoadingScreen();
                    if (response.success) {
                        Swal.fire({
                            title: 'Success!',
                            html: `User <strong>${selectedUserName}</strong> has been successfully restored.<br><br>
                                  <div style="background: #d1fae5; padding: 15px; border-radius: 8px; text-align: center;">
                                    <i class="fas fa-check-circle" style="color: #10b981; font-size: 2rem; margin-bottom: 10px;"></i><br>
                                    <span style="color: #065f46;">Account status changed to <strong>active</strong></span>
                                  </div>`,
                            icon: 'success',
                            confirmButtonColor: '#10b981',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            // Reload the user list
                            loadInactiveUsers($searchInput.val().trim(), $roleFilter.val());
                            resolve();
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: response.message || 'Restoration failed',
                            icon: 'error',
                            confirmButtonColor: '#ef4444'
                        });
                        reject(response.message);
                    }
                },
                error: function(xhr) {
                    hideLoadingScreen();
                    Swal.fire({
                        title: 'Error!',
                        text: 'Error restoring user: ' + (xhr.responseJSON?.message || 'Server error'),
                        icon: 'error',
                        confirmButtonColor: '#ef4444'
                    });
                    reject(xhr.responseJSON?.message);
                }
            });
        });
    }
    
    // Delete user function (placeholder)
    function deleteUser() {
        return new Promise((resolve, reject) => {
            showLoadingScreen('Processing delete request...');

            $.ajax({
                url: window.appUrls.deleteUser,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ user_id: selectedUserId }),
                success: function(response) {
                    hideLoadingScreen();
                    if (response.success) {
                        Swal.fire({
                            title: 'Placeholder Function',
                            html: `Delete function for <strong>${selectedUserName}</strong> is currently disabled.<br><br>
                                  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; text-align: center;">
                                    <i class="fas fa-info-circle" style="color: #f59e0b; font-size: 2rem; margin-bottom: 10px;"></i><br>
                                    <span style="color: #92400e;">${response.message}</span><br>
                                    <small style="color: #92400e;">${response.note || ''}</small>
                                  </div>`,
                            icon: 'info',
                            confirmButtonColor: '#f59e0b',
                            confirmButtonText: 'OK'
                        }).then(() => {
                            resolve();
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: response.message || 'Delete operation failed',
                            icon: 'error',
                            confirmButtonColor: '#ef4444'
                        });
                        reject(response.message);
                    }
                },
                error: function(xhr) {
                    hideLoadingScreen();
                    Swal.fire({
                        title: 'Error!',
                        text: 'Error in delete operation: ' + (xhr.responseJSON?.message || 'Server error'),
                        icon: 'error',
                        confirmButtonColor: '#ef4444'
                    });
                    reject(xhr.responseJSON?.message);
                }
            });
        });
    }
    
    // Show status messages (for non-SweetAlert notifications)
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