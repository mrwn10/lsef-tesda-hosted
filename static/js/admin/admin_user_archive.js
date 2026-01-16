// admin_user_archive.js - Hierarchical Timeline Archive System (SAFER VERSION)
$(document).ready(function() {
    let archiveData = null;
    let filteredData = null;
    let searchQuery = '';
    let selectedRole = 'all';
    let currentExpandedYear = null;
    let currentExpandedMonth = null;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initEventListeners();
        loadArchiveHierarchy();
    }
    
    // Initialize event listeners
    function initEventListeners() {
        // Search functionality with debounce
        let searchTimeout = null;
        $('#search-input').on('input', function() {
            searchQuery = $(this).val().trim();
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterAndRenderArchive();
            }, 300);
        });
        
        // Role filter
        $('#role-filter').on('change', function() {
            selectedRole = $(this).val();
            filterAndRenderArchive();
        });
        
        // Expand/Collapse all buttons (REMOVED EXPAND ALL, KEEP COLLAPSE)
        $('#collapse-all').on('click', function() {
            collapseAllSections();
        });
        
        // REMOVED: Expand all button (too dangerous)
        $('#expand-all').remove();
        
        // Restore button handlers (delegated for dynamic content)
        $(document).on('click', '.restore-btn', function() {
            const userId = $(this).data('userid');
            const userName = $(this).data('username');
            confirmRestoreUser(userId, userName);
        });
        
        $(document).on('click', '.mobile-restore-btn', function() {
            const userId = $(this).data('userid');
            const userName = $(this).data('username');
            confirmRestoreUser(userId, userName);
        });
        
        // Year/Month toggle handlers
        $(document).on('click', '.year-header', function() {
            const year = $(this).data('year');
            toggleYear(year);
        });
        
        $(document).on('click', '.month-header', function() {
            const year = $(this).data('year');
            const month = $(this).data('month');
            toggleMonth(year, month);
        });
        
        // Mobile year/month toggle handlers
        $(document).on('click', '.mobile-year-header', function() {
            const year = $(this).data('year');
            toggleYear(year);
        });
        
        $(document).on('click', '.mobile-month-header', function() {
            const year = $(this).data('year');
            const month = $(this).data('month');
            toggleMonth(year, month);
        });
    }
    
    // Initialize modals (keeping logout functionality)
    function initModals() {
        function closeAllModals() {
            $('.modal').fadeOut(300);
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }

        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                document.body.classList.add('modal-open');
            }
        }

        // Close modal when clicking outside
        $(document).on('click', function(e) {
            if ($(e.target).hasClass('modal')) {
                closeAllModals();
            }
        });

        // Escape key to close modals
        $(document).keyup(function(e) {
            if (e.keyCode === 27) {
                closeAllModals();
            }
        });

        // Logout Modal
        $('#logout-trigger').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('logout-modal');
        });
        
        $('#mobile-logout-trigger').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            const mobileNav = document.getElementById('mobileNav');
            if (mobileNav) {
                mobileNav.classList.remove('active');
            }
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
    
    // Mobile Navigation Functionality (unchanged)
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
    
    // Load archive hierarchy
    function loadArchiveHierarchy() {
        showLoadingState(true);
        
        $.ajax({
            url: window.appUrls.archivedUsersHierarchy,
            method: 'GET',
            success: function(response) {
                showLoadingState(false);
                
                if (response.success && response.years) {
                    archiveData = response.years;
                    filteredData = JSON.parse(JSON.stringify(archiveData)); // Deep copy
                    
                    // Update stats
                    updateArchiveStats(response);
                    
                    // Render timeline
                    filterAndRenderArchive();
                    
                    // Auto-expand first year only
                    if (archiveData.length > 0) {
                        toggleYear(archiveData[0].year, true);
                    }
                } else {
                    renderEmptyState();
                }
            },
            error: function(xhr) {
                showLoadingState(false);
                showStatusMessage('Error loading archive data: ' + (xhr.responseJSON?.message || 'Server error'), 'danger');
                renderEmptyState();
            }
        });
    }
    
    // Filter and render archive based on search and role filters
    function filterAndRenderArchive() {
        if (!archiveData) return;
        
        // Reset filtered data
        filteredData = JSON.parse(JSON.stringify(archiveData));
        
        // Apply filters
        if (searchQuery || selectedRole !== 'all') {
            filteredData = filteredData.map(year => {
                const filteredMonths = year.months.map(month => {
                    const filteredUsers = month.users.filter(user => {
                        const matchesRole = selectedRole === 'all' || 
                                          user.role.toLowerCase() === selectedRole.toLowerCase();
                        
                        const matchesSearch = !searchQuery || 
                                            (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                            (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
                                            (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase()));
                        
                        return matchesRole && matchesSearch;
                    });
                    
                    return {
                        ...month,
                        users: filteredUsers,
                        user_count: filteredUsers.length
                    };
                }).filter(month => month.user_count > 0);
                
                const yearUserCount = filteredMonths.reduce((sum, month) => sum + month.user_count, 0);
                
                return {
                    ...year,
                    months: filteredMonths,
                    month_count: filteredMonths.length,
                    user_count: yearUserCount
                };
            }).filter(year => year.user_count > 0);
        }
        
        // Reset expansion if current year/month is not in filtered results
        if (currentExpandedYear && !filteredData.find(y => y.year === currentExpandedYear)) {
            currentExpandedYear = null;
            currentExpandedMonth = null;
        }
        
        // Render both desktop and mobile views
        renderDesktopTimeline();
        renderMobileTimeline();
    }
    
    // Render desktop timeline
    function renderDesktopTimeline() {
        if (!filteredData || filteredData.length === 0) {
            renderEmptyState();
            return;
        }
        
        let timelineHtml = '';
        
        filteredData.forEach(yearData => {
            const isYearExpanded = currentExpandedYear === yearData.year;
            
            timelineHtml += `
                <div class="year-section">
                    <div class="year-header ${isYearExpanded ? 'expanded' : ''}" data-year="${yearData.year}">
                        <div class="header-content">
                            <div class="header-icon">
                                <i class="fas fa-chevron-${isYearExpanded ? 'down' : 'right'}"></i>
                            </div>
                            <div class="header-title">
                                <h4>${yearData.year}</h4>
                                <span class="header-subtitle">${yearData.month_count} months • ${yearData.user_count} users</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="year-content" style="display: ${isYearExpanded ? 'block' : 'none'}">
            `;
            
            yearData.months.forEach(monthData => {
                const isMonthExpanded = currentExpandedYear === yearData.year && 
                                      currentExpandedMonth === monthData.month_number;
                
                timelineHtml += `
                    <div class="month-section">
                        <div class="month-header ${isMonthExpanded ? 'expanded' : ''}" 
                             data-year="${yearData.year}" 
                             data-month="${monthData.month_number}">
                            <div class="header-content">
                                <div class="header-icon">
                                    <i class="fas fa-chevron-${isMonthExpanded ? 'down' : 'right'}"></i>
                                </div>
                                <div class="header-title">
                                    <h5>${monthData.month_name}</h5>
                                    <span class="header-subtitle">${monthData.user_count} users</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="month-content" style="display: ${isMonthExpanded ? 'block' : 'none'}">
                            <table class="user-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Contact No.</th>
                                        <th>Date Registered</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                monthData.users.forEach(user => {
                    timelineHtml += `
                        <tr data-user-id="${user.user_id}">
                            <td>
                                <div class="user-info">
                                    <div class="user-avatar">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="user-details">
                                        <span class="user-name">${user.full_name || 'N/A'}</span>
                                        <span class="user-id">ID: ${user.user_id}</span>
                                    </div>
                                </div>
                            </td>
                            <td>${user.email || 'N/A'}</td>
                            <td>${user.contact_number || 'N/A'}</td>
                            <td>${user.date_registered_short || 'N/A'}</td>
                            <td><span class="role-badge role-${user.role}">${user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span></td>
                            <td><span class="status-badge status-archived">Archived</span></td>
                            <td>
                                <button class="btn btn-small restore-btn" 
                                        data-userid="${user.user_id}" 
                                        data-username="${user.full_name || user.username}">
                                    <i class="fas fa-undo-alt"></i> Restore
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                timelineHtml += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            });
            
            timelineHtml += `
                    </div>
                </div>
            `;
        });
        
        $('#timeline-content').html(timelineHtml);
    }
    
    // Render mobile timeline
    function renderMobileTimeline() {
        if (!filteredData || filteredData.length === 0) {
            renderMobileEmptyState();
            return;
        }
        
        let mobileHtml = '';
        
        filteredData.forEach(yearData => {
            const isYearExpanded = currentExpandedYear === yearData.year;
            
            mobileHtml += `
                <div class="mobile-year-section">
                    <div class="mobile-year-header ${isYearExpanded ? 'expanded' : ''}" data-year="${yearData.year}">
                        <div class="mobile-header-content">
                            <div class="mobile-header-icon">
                                <i class="fas fa-chevron-${isYearExpanded ? 'down' : 'right'}"></i>
                            </div>
                            <div class="mobile-header-title">
                                <h4>${yearData.year}</h4>
                                <span class="mobile-header-subtitle">${yearData.month_count} months • ${yearData.user_count} users</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mobile-year-content" style="display: ${isYearExpanded ? 'block' : 'none'}">
            `;
            
            yearData.months.forEach(monthData => {
                const isMonthExpanded = currentExpandedYear === yearData.year && 
                                      currentExpandedMonth === monthData.month_number;
                
                mobileHtml += `
                    <div class="mobile-month-section">
                        <div class="mobile-month-header ${isMonthExpanded ? 'expanded' : ''}" 
                             data-year="${yearData.year}" 
                             data-month="${monthData.month_number}">
                            <div class="mobile-header-content">
                                <div class="mobile-header-icon">
                                    <i class="fas fa-chevron-${isMonthExpanded ? 'down' : 'right'}"></i>
                                </div>
                                <div class="mobile-header-title">
                                    <h5>${monthData.month_name}</h5>
                                    <span class="mobile-header-subtitle">${monthData.user_count} users</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mobile-month-content" style="display: ${isMonthExpanded ? 'block' : 'none'}">
                `;
                
                monthData.users.forEach(user => {
                    mobileHtml += `
                        <div class="mobile-user-card" data-user-id="${user.user_id}">
                            <div class="mobile-user-header">
                                <div class="mobile-user-info">
                                    <div class="mobile-user-name">${user.full_name || 'N/A'}</div>
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
                                    <div class="mobile-detail-value">${user.date_registered_short || 'N/A'}</div>
                                </div>
                                <div class="mobile-user-detail">
                                    <div class="mobile-detail-label">Status</div>
                                    <div class="mobile-detail-value"><span class="status-badge status-archived">Archived</span></div>
                                </div>
                            </div>
                            <div class="mobile-user-actions">
                                <button class="mobile-action-btn restore-btn mobile-restore-btn" 
                                        data-userid="${user.user_id}" 
                                        data-username="${user.full_name || user.username}">
                                    <i class="fas fa-undo-alt"></i> Restore
                                </button>
                            </div>
                        </div>
                    `;
                });
                
                mobileHtml += `
                        </div>
                    </div>
                `;
            });
            
            mobileHtml += `
                    </div>
                </div>
            `;
        });
        
        $('#mobile-timeline-content').html(mobileHtml);
    }
    
    // Toggle year expansion (ACCORDION STYLE)
    function toggleYear(year, initialLoad = false) {
        if (currentExpandedYear === year) {
            // Clicking the same year collapses it
            currentExpandedYear = null;
            currentExpandedMonth = null;
        } else {
            // Open new year, close previous
            currentExpandedYear = year;
            currentExpandedMonth = null; // Reset month when year changes
        }
        filterAndRenderArchive();
    }
    
    // Toggle month expansion (ACCORDION STYLE)
    function toggleMonth(year, month) {
        const monthKey = `${year}-${month}`;
        
        if (currentExpandedYear === year && currentExpandedMonth === month) {
            // Clicking the same month collapses it
            currentExpandedMonth = null;
        } else {
            // Open new month
            currentExpandedYear = year;
            currentExpandedMonth = month;
        }
        filterAndRenderArchive();
    }
    
    // Collapse all sections
    function collapseAllSections() {
        currentExpandedYear = null;
        currentExpandedMonth = null;
        filterAndRenderArchive();
    }
    
    // Update archive statistics
    function updateArchiveStats(response) {
        const totalYears = response.years.length;
        const totalMonths = response.years.reduce((sum, year) => sum + year.month_count, 0);
        const totalUsers = response.total_users || response.years.reduce((sum, year) => sum + year.user_count, 0);
        
        $('#total-users').text(totalUsers);
        $('#total-years').text(totalYears);
        $('#total-months').text(totalMonths);
        $('#archive-stats').show();
    }
    
    // Show/hide loading state
    function showLoadingState(show) {
        if (show) {
            $('#timeline-content').html(`
                <div class="loading-state">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Loading archive timeline...</span>
                    </div>
                </div>
            `);
            $('#mobile-timeline-content').html(`
                <div class="loading-state">
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                        <span>Loading archive timeline...</span>
                    </div>
                </div>
            `);
        }
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#timeline-content').html(`
            <div class="empty-state">
                <i class="fas fa-archive"></i>
                <h3>No Archived Users Found</h3>
                <p>${searchQuery || selectedRole !== 'all' ? 'No users match your search criteria.' : 'There are currently no archived users to display.'}</p>
                ${searchQuery || selectedRole !== 'all' ? '<button class="btn btn-secondary" id="clear-filters">Clear Filters</button>' : ''}
            </div>
        `);
        
        // Add clear filters button listener
        $('#clear-filters').on('click', function() {
            $('#search-input').val('');
            $('#role-filter').val('all');
            searchQuery = '';
            selectedRole = 'all';
            filterAndRenderArchive();
        });
    }
    
    // Render mobile empty state
    function renderMobileEmptyState() {
        $('#mobile-timeline-content').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-archive" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Archived Users Found</h3>
                <p style="color: #94a3b8;">${searchQuery || selectedRole !== 'all' ? 'No users match your search criteria.' : 'There are currently no archived users to display.'}</p>
                ${searchQuery || selectedRole !== 'all' ? '<button class="btn btn-secondary" style="margin-top: 1rem;" id="clear-filters-mobile">Clear Filters</button>' : ''}
            </div>
        `);
        
        // Add clear filters button listener
        $('#clear-filters-mobile').on('click', function() {
            $('#search-input').val('');
            $('#role-filter').val('all');
            searchQuery = '';
            selectedRole = 'all';
            filterAndRenderArchive();
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
    
    // Show loading screen
    function showLoadingScreen(message) {
        $('#loading-message').text(message);
        $('#loading-screen').fadeIn();
    }
    
    // Hide loading screen
    function hideLoadingScreen() {
        $('#loading-screen').fadeOut();
    }
    
    // =============== RESTORE FUNCTIONS ===============
    // REMOVED ALL BULK RESTORE FUNCTIONS - TOO DANGEROUS
    
    // Confirm restore user (SAFE - single user only)
    function confirmRestoreUser(userId, userName) {
        Swal.fire({
            title: 'Restore User Account',
            html: `Are you sure you want to restore <strong>${userName}</strong>?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Restore',
            cancelButtonText: 'Cancel',
            reverseButtons: false,
            showLoaderOnConfirm: true,
            preConfirm: () => {
                return restoreSingleUser(userId);
            }
        }).then((result) => {
            if (result.isConfirmed) {
                // Success handled in restoreSingleUser
            }
        });
    }
    
    // Restore single user (ONLY SAFE METHOD)
    function restoreSingleUser(userId) {
        return new Promise((resolve, reject) => {
            showLoadingScreen('Restoring user account...');

            $.ajax({
                url: window.appUrls.restoreUser,
                method: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ user_id: userId }),
                success: function(response) {
                    hideLoadingScreen();
                    if (response.success) {
                        Swal.fire({
                            title: 'Success!',
                            text: 'User has been successfully restored.',
                            icon: 'success',
                            confirmButtonColor: '#10b981'
                        }).then(() => {
                            // Reload the archive
                            loadArchiveHierarchy();
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
    
    // Initialize everything
    init();
});