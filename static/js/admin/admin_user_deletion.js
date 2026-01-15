// admin_user_deletion.js - WITH SWEETALERT2 CONFIRMATION AND 5-SECOND COOLDOWN
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

        // Alert close
        $('.close-alert').click(function() {
            $('#status-message').fadeOut();
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
                    
                    // Apply filters - IMPORTANT: Only show active users
                    filteredUsers = users.filter(user => {
                        // Only include active users
                        if (user.account_status.toLowerCase() !== 'active') {
                            return false;
                        }
                        
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
                        <i class="fas fa-users"></i>
                        <h3>No Active Users Found</h3>
                        <p>There are currently no active users to display.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-users-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-users" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Active Users Found</h3>
                <p style="color: #94a3b8;">There are currently no active users to display.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }
    
    // Show user details and trigger SweetAlert2 confirmation
    function showUserDetails(userId) {
        currentUserId = userId;
        window.currentUserId = userId;
        
        // Find user in filtered users
        const user = filteredUsers.find(u => u.user_id == userId);
        if (!user) {
            showStatusMessage('User not found', 'danger');
            return;
        }
        
        selectedUserName = [user.first_name, user.middle_name, user.last_name].filter(n => n).join(' ');
        window.selectedUserName = selectedUserName;
        
        // Use SweetAlert2 for confirmation with 5-second cooldown
        showDeleteConfirmation(user);
    }
    
    // Show SweetAlert2 confirmation dialog with 5-second cooldown
    function showDeleteConfirmation(user) {
        const registerDate = new Date(user.date_registered);
        const formattedDate = registerDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        let timerInterval;
        let timeLeft = 5; // 5 second cooldown
        
        Swal.fire({
            title: 'Are you sure you want to delete this user?',
            html: `
                <div style="text-align: left;">
                    <!-- User Details Section - SCROLLABLE -->
                    <div style="margin-bottom: 15px; padding: 15px; background: #f1f5f9; border-radius: 8px; border: 1px solid #e2e8f0; max-height: 200px; overflow-y: auto;">
                        <h4 style="margin: 0 0 12px 0; color: #003366; font-size: 16px; font-weight: 600; padding-bottom: 8px; border-bottom: 2px solid #cbd5e1;">
                            <i class="fas fa-user-circle" style="margin-right: 8px; color: #475569;"></i>User Details
                        </h4>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px;">
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">Full Name</div>
                                <div style="font-weight: 500; color: #334155; font-size: 14px;">${selectedUserName}</div>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">User ID</div>
                                <div style="font-weight: 500; color: #334155; font-size: 14px;">${user.user_id}</div>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">Email</div>
                                <div style="font-weight: 500; color: #334155; font-size: 14px; word-break: break-word;">${user.email}</div>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">Role</div>
                                <div style="font-weight: 500; color: #334155; font-size: 14px;">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</div>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">Registered Date</div>
                                <div style="font-weight: 500; color: #334155; font-size: 14px;">${formattedDate}</div>
                            </div>
                            <div style="margin-bottom: 8px;">
                                <div style="font-size: 12px; color: #64748b; font-weight: 500; margin-bottom: 4px;">Account Status</div>
                                <div><span style="background: #d1fae5; color: #065f46; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block;">${user.account_status}</span></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Deletion Process Info -->
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #92400e; font-size: 16px; font-weight: 600; padding-bottom: 8px; border-bottom: 1px solid #fbbf24;">
                            <i class="fas fa-info-circle" style="margin-right: 8px; color: #d97706;"></i>Deletion Process
                        </h4>
                        <div style="font-size: 14px; color: #92400e;">
                            <p style="margin: 0 0 10px 0; font-weight: 500;">What happens when you delete a user:</p>
                            <ul style="margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 6px; padding-left: 5px;">Account will be immediately deactivated</li>
                                <li style="margin-bottom: 6px; padding-left: 5px;">User will be moved to archive system</li>
                                <li style="margin-bottom: 6px; padding-left: 5px;">Data preserved for 30 days</li>
                                <li style="margin-bottom: 6px; padding-left: 5px;">Can be restored within 30 days</li>
                                <li style="padding-left: 5px;">Permanent deletion may occur after 30 days</li>
                            </ul>
                        </div>
                    </div>
                    
                    <!-- Cooldown Warning -->
                    <div style="background: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin-bottom: 5px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; background: #fee2e2; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i class="fas fa-exclamation-circle" style="color: #dc2626; font-size: 20px;"></i>
                            </div>
                            <div style="flex: 1;">
                                <p style="margin: 0; color: #b91c1c; font-weight: 600; font-size: 14px; margin-bottom: 3px;">
                                    Please wait <span id="countdown-timer" style="font-weight: bold; font-size: 16px; color: #dc2626;">5</span> seconds before confirming deletion
                                </p>
                                <p style="margin: 0; color: #b91c1c; font-size: 12px; opacity: 0.9;">
                                    This prevents accidental deletions
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Delete User',
            cancelButtonText: 'Cancel',
            showLoaderOnConfirm: true,
            allowOutsideClick: false,
            allowEscapeKey: true,
            width: '650px',
            padding: '1.5rem',
            // REMOVED max-height to prevent outer dialog scrolling
            customClass: {
                popup: 'sweetalert-popup',
                title: 'sweetalert-title',
                content: 'sweetalert-content',
                confirmButton: 'sweetalert-confirm',
                cancelButton: 'sweetalert-cancel'
            },
            preConfirm: () => {
                return new Promise((resolve, reject) => {
                    // Check if cooldown is complete
                    if (timeLeft > 0) {
                        reject('Please wait for the cooldown to finish');
                    } else {
                        // Proceed with deletion
                        deleteUserAjax().then(resolve).catch(reject);
                    }
                });
            },
            didOpen: () => {
                // Start countdown timer
                const timerElement = document.getElementById('countdown-timer');
                const confirmButton = Swal.getConfirmButton();
                
                // Disable confirm button initially
                confirmButton.disabled = true;
                confirmButton.innerHTML = '<i class="fas fa-clock"></i> Wait 5s';
                confirmButton.style.opacity = '0.7';
                confirmButton.style.cursor = 'not-allowed';
                
                timerInterval = setInterval(() => {
                    timeLeft--;
                    timerElement.textContent = timeLeft;
                    
                    if (timeLeft <= 0) {
                        clearInterval(timerInterval);
                        confirmButton.disabled = false;
                        confirmButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete User';
                        confirmButton.style.opacity = '1';
                        confirmButton.style.cursor = 'pointer';
                        timerElement.style.color = '#065f46';
                    } else {
                        confirmButton.innerHTML = `<i class="fas fa-clock"></i> Wait ${timeLeft}s`;
                    }
                }, 1000);
            },
            willClose: () => {
                clearInterval(timerInterval);
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Success handled in deleteUserAjax function
            }
        }).catch((error) => {
            if (error !== 'cancel' && error !== 'Esc' && error !== 'Escape') {
                // Show error message if not cancelled by user
                Swal.fire({
                    title: 'Error',
                    text: error,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    width: '400px'
                });
            }
        });
    }
    
    // Perform the actual AJAX deletion
    function deleteUserAjax() {
        return new Promise((resolve, reject) => {
            showLoadingScreen('Moving user to archive...');

            $.ajax({
                url: window.appUrls.deleteUser,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ user_id: currentUserId }),
                success: function(response) {
                    hideLoadingScreen();
                    if (response.success) {
                        // Show success message with SweetAlert2
                        Swal.fire({
                            title: 'Success!',
                            html: `
                                <div style="text-align: center; padding: 10px;">
                                    <div style="width: 60px; height: 60px; background: #d1fae5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px auto;">
                                        <i class="fas fa-check" style="font-size: 30px; color: #065f46;"></i>
                                    </div>
                                    <h3 style="color: #065f46; margin: 0 0 10px 0; font-weight: 600;">User Deleted</h3>
                                    <p style="color: #334155; margin-bottom: 5px;">
                                        <strong>"${selectedUserName}"</strong> has been successfully deleted.
                                    </p>
                                    <p style="color: #64748b; font-size: 14px; margin: 0;">
                                        The user has been moved to archive and will be preserved for 30 days.
                                    </p>
                                </div>
                            `,
                            icon: 'success',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#065f46',
                            width: '450px',
                            showConfirmButton: true,
                            allowOutsideClick: false
                        });
                        
                        // Remove user from current view (immediate visual deletion)
                        $(`[data-user-id="${currentUserId}"]`).fadeOut(300, function() {
                            $(this).remove();
                            
                            // Remove from filteredUsers array
                            filteredUsers = filteredUsers.filter(user => user.user_id != currentUserId);
                            
                            // Update pagination and render
                            currentPage = 1;
                            renderUsers();
                        });
                        
                        resolve(response);
                    } else {
                        reject(response.message || 'Deletion failed');
                    }
                },
                error: function(xhr) {
                    hideLoadingScreen();
                    reject('Error deleting user: ' + (xhr.responseJSON?.message || 'Server error'));
                }
            });
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