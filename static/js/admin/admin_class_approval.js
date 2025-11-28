// admin_class_approval.js - Enhanced Version with Improved UI/UX
$(document).ready(function() {
    const approvalUrl = "/approval_action";
    let classes = [];
    let filteredClasses = [];
    let currentClassId = null;
    let currentClassData = null;
    let pendingAction = null;
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initClassApproval();
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
                class_id: row.id.replace('class-', ''),
                class_title: row.cells[0].textContent,
                course_title: row.cells[1].textContent,
                instructor_name: row.cells[2].textContent,
                status: 'Pending'
            };
            
            // Get edit data
            const viewBtn = row.querySelector('.view-class-btn');
            if (viewBtn && viewBtn.dataset.class) {
                try {
                    const viewData = JSON.parse(viewBtn.dataset.class);
                    Object.assign(classData, viewData);
                } catch (e) {
                    console.error('Error parsing view class data:', e);
                }
            }
            
            classes.push(classData);
        });
        
        filteredClasses = [...classes];
        currentPage = 1;
        renderClasses();
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
                <tr id="class-${cls.class_id}" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}' data-course-title="${cls.course_title}">
                    <td>${cls.class_title}</td>
                    <td>${cls.course_title}</td>
                    <td>${cls.first_name} ${cls.last_name}</td>
                    <td>
                        <span class="status-badge status-pending">
                            Pending
                        </span>
                    </td>
                    <td>
                        <button class="action-btn view-btn view-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-eye"></i> View Details
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
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${cls.first_name} ${cls.last_name}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge status-pending">Pending</span>
                            </div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn view-btn mobile-view-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
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
                <td colspan="5" class="no-data">
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <h3>No Pending Classes</h3>
                        <p>There are currently no classes waiting for approval.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-classes-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Pending Classes</h3>
                <p style="color: #94a3b8;">There are currently no classes waiting for approval.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }
    
    // Initialize filtering functionality
    function initFiltering() {
        $('#courseFilter').on('change', function() {
            filterTable();
        });
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

        // View Details Modal
        $('#close-view-modal').click(function() {
            closeAllModals();
        });

        $('#modal-cancel-btn').click(function() {
            closeAllModals();
        });

        // Confirmation Modal
        $('#close-confirmation-modal').click(function() {
            closeAllModals();
        });

        $('#cancel-action').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize class approval functionality
    function initClassApproval() {
        // View details button event listeners
        $(document).on('click', '.view-class-btn, .mobile-view-class-btn', function() {
            try {
                const classData = $(this).data('class');
                openViewModal(classData);
            } catch (error) {
                console.error('Error parsing class data:', error);
                showMessage('Error loading class data', 'error');
            }
        });

        // Modal button event listeners
        $('#modal-approve-btn').click(function() {
            showConfirmationModal('approve', 'Are you sure you want to approve this class?');
        });

        $('#modal-reject-btn').click(function() {
            showConfirmationModal('reject', 'Are you sure you want to reject this class?');
        });

        // Confirmation modal action
        $('#confirm-action').click(function() {
            if (pendingAction && currentClassId) {
                processApproval(pendingAction);
            }
        });
    }

    function openViewModal(classData) {
        currentClassId = classData.class_id;
        currentClassData = classData;
        
        // Populate modal with class data
        document.getElementById('detail-class-title').textContent = classData.class_title || 'N/A';
        document.getElementById('detail-course').textContent = classData.course_title || 'N/A';
        document.getElementById('detail-school-year').textContent = classData.school_year || 'N/A';
        document.getElementById('detail-batch').textContent = classData.batch || 'N/A';
        document.getElementById('detail-instructor').textContent = `${classData.first_name || ''} ${classData.last_name || ''}`.trim() || 'N/A';
        document.getElementById('detail-venue').textContent = classData.venue || 'N/A';
        document.getElementById('detail-max-students').textContent = classData.max_students || 'N/A';
        document.getElementById('detail-schedule').textContent = classData.schedule || 'N/A';
        document.getElementById('detail-start-date').textContent = classData.start_date ? new Date(classData.start_date).toLocaleDateString() : 'N/A';
        document.getElementById('detail-end-date').textContent = classData.end_date ? new Date(classData.end_date).toLocaleDateString() : 'N/A';
        document.getElementById('detail-prerequisites').textContent = classData.prerequisites || 'None specified';

        // Handle days_of_week
        const daysTimesContainer = document.getElementById('detail-days-times');
        daysTimesContainer.innerHTML = '';
        
        if (classData.days_of_week) {
            let daysData;
            
            // Parse days_of_week if it's a string
            if (typeof classData.days_of_week === 'string') {
                try {
                    daysData = JSON.parse(classData.days_of_week);
                } catch (e) {
                    console.error('Error parsing days_of_week:', e);
                    daysData = {};
                }
            } else {
                daysData = classData.days_of_week;
            }
            
            if (daysData && typeof daysData === 'object') {
                for (const day in daysData) {
                    if (daysData.hasOwnProperty(day)) {
                        const times = daysData[day];
                        const dayTimeItem = document.createElement('div');
                        dayTimeItem.className = 'day-time-item';
                        
                        const startTime = times.start ? formatTime(times.start) : 'N/A';
                        const endTime = times.end ? formatTime(times.end) : 'N/A';
                        
                        dayTimeItem.innerHTML = `
                            <span class="day">${day}</span>
                            <span class="time">${startTime} - ${endTime}</span>
                        `;
                        daysTimesContainer.appendChild(dayTimeItem);
                    }
                }
            }
        } else {
            daysTimesContainer.innerHTML = '<div class="no-data">No schedule details available</div>';
        }
        
        // Show modal
        document.getElementById('viewDetailsModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
    }

    function showConfirmationModal(action, message) {
        pendingAction = action;
        document.getElementById('confirmation-message').textContent = message;
        
        // Set appropriate button colors based on action
        const confirmBtn = document.getElementById('confirm-action');
        if (action === 'approve') {
            confirmBtn.className = 'btn btn-confirm-approve';
            confirmBtn.innerHTML = '<i class="fas fa-check"></i> Yes, Approve';
        } else {
            confirmBtn.className = 'btn btn-confirm-reject';
            confirmBtn.innerHTML = '<i class="fas fa-times"></i> Yes, Reject';
        }
        
        // Close the view details modal first
        $('#viewDetailsModal').fadeOut(300);
        
        // Then open confirmation modal after a short delay
        setTimeout(() => {
            document.getElementById('confirmation-modal').style.display = 'flex';
        }, 300);
    }

    function formatTime(time24) {
        if (!time24) return 'N/A';
        
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `${hour12}:${minutes} ${ampm}`;
    }

    function processApproval(action) {
        if (!currentClassId) return;

        // Close confirmation modal
        $('.modal').fadeOut(300);
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');

        fetch(approvalUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ class_id: currentClassId, action: action })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showMessage(data.message, 'success');
                
                // Remove the class from the original classes array
                classes = classes.filter(cls => cls.class_id !== currentClassId);
                filteredClasses = filteredClasses.filter(cls => cls.class_id !== currentClassId);
                
                // Re-render with updated data
                renderClasses();
                
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showMessage(error.message || 'An error occurred while processing the request', 'error');
        })
        .finally(() => {
            currentClassId = null;
            currentClassData = null;
            pendingAction = null;
        });
    }

    function showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('message-container');
        const messageContent = document.getElementById('message-content');
        
        if (!messageContainer || !messageContent) return;
        
        messageContent.textContent = message;
        messageContent.className = 'message ' + type;
        messageContainer.style.display = 'block';
        
        // Scroll to message
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
    
    // Initialize everything
    init();
});