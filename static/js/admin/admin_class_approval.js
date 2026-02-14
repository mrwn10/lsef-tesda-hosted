// admin_class_approval.js - Updated with SweetAlert2 and fixed data display
$(document).ready(function() {
    const approvalUrl = "/approval_action";
    let classes = [];
    let filteredClasses = [];
    let currentClassId = null;
    let currentClassData = null;
    
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
        const tableRows = document.querySelectorAll('#classes-container tr[data-class]');
        
        classes = [];
        
        // Extract data from desktop table rows
        tableRows.forEach((row) => {
            const viewBtn = row.querySelector('.view-class-btn');
            if (viewBtn && viewBtn.dataset.class) {
                try {
                    const classData = JSON.parse(viewBtn.dataset.class);
                    classes.push(classData);
                } catch (e) {
                    console.error('Error parsing class data:', e);
                }
            }
        });
        
        filteredClasses = [...classes];
        currentPage = 1;
        renderClasses();
    }
    
    // Initialize pagination
    function initPagination() {
        $('#page-size').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            renderClasses();
        });
        
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
        
        const start = totalClasses === 0 ? 0 : ((currentPage - 1) * pageSize) + 1;
        const end = Math.min(currentPage * pageSize, totalClasses);
        
        $('#pagination-start').text(start);
        $('#pagination-end').text(end);
        $('#pagination-total').text(totalClasses);
        
        $('#first-page').prop('disabled', currentPage === 1 || totalClasses === 0);
        $('#prev-page').prop('disabled', currentPage === 1 || totalClasses === 0);
        $('#next-page').prop('disabled', currentPage === totalPages || totalClasses === 0);
        $('#last-page').prop('disabled', currentPage === totalPages || totalClasses === 0);
        
        const $pagesContainer = $('#pagination-pages');
        $pagesContainer.empty();
        
        if (totalClasses > 0) {
            let startPage = Math.max(1, currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            
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
        }
        
        $('#pagination-container').toggle(totalClasses > 0);
    }
    
    // Render classes based on current pagination
    function renderClasses() {
        if (filteredClasses.length === 0) {
            renderEmptyState();
            return;
        }
        
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredClasses.length);
        const currentClasses = filteredClasses.slice(startIndex, endIndex);
        
        renderDesktopTable(currentClasses);
        renderMobileCards(currentClasses);
        updatePagination();
    }
    
    // Render desktop table
    function renderDesktopTable(currentClasses) {
        let tableHtml = '';
        
        currentClasses.forEach(cls => {
            const enrolledCount = cls.enrolled_count || 0;
            const instructorName = cls.instructor_name || `${cls.first_name || ''} ${cls.last_name || ''}`.trim();
            
            tableHtml += `
                <tr id="class-${cls.class_id}" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}' data-course-title="${cls.course_title || ''}">
                    <td><strong>${cls.class_title || 'N/A'}</strong><br><small class="text-muted">Batch ${cls.batch || 'N/A'}</small></td>
                    <td>${cls.course_title || 'N/A'}<br><small class="text-muted">${cls.course_code || ''}</small></td>
                    <td>${instructorName || 'N/A'}</td>
                    <td>
                        <div class="schedule-info">
                            <i class="fas fa-calendar-alt"></i> ${cls.start_date ? cls.start_date.substring(0, 10) : 'N/A'}<br>
                            <i class="fas fa-clock"></i> ${cls.schedule ? cls.schedule.substring(0, 20) : 'N/A'}
                        </div>
                    </td>
                    <td>${cls.venue || 'N/A'}</td>
                    <td class="text-center">${enrolledCount}/${cls.max_students || 0}</td>
                    <td>
                        <span class="status-badge status-pending">Pending</span>
                    </td>
                    <td>
                        <button class="action-btn view-btn view-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-eye"></i>
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
            const enrolledCount = cls.enrolled_count || 0;
            const instructorName = cls.instructor_name || `${cls.first_name || ''} ${cls.last_name || ''}`.trim();
            
            cardsHtml += `
                <div class="mobile-user-card" data-course-title="${cls.course_title || ''}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${cls.class_title || 'N/A'}</div>
                            <div class="mobile-user-email">${cls.course_title || 'N/A'} (Batch ${cls.batch || 'N/A'})</div>
                        </div>
                        <span class="status-badge status-pending">Pending</span>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${instructorName || 'N/A'}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Schedule</div>
                            <div class="mobile-detail-value">${cls.schedule || 'N/A'}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Venue</div>
                            <div class="mobile-detail-value">${cls.venue || 'N/A'}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Students</div>
                            <div class="mobile-detail-value">${enrolledCount}/${cls.max_students || 0}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Dates</div>
                            <div class="mobile-detail-value">${cls.start_date ? cls.start_date.substring(0, 10) : 'N/A'} to ${cls.end_date ? cls.end_date.substring(0, 10) : 'N/A'}</div>
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
                <td colspan="8" class="no-data">
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
                cls.course_title && cls.course_title.toLowerCase().includes(filterValue)
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
            
            const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
            
            const mobileNavHeaders = document.querySelectorAll('.mobile-nav-header-link');
            mobileNavHeaders.forEach(header => {
                header.addEventListener('click', function() {
                    const section = this.getAttribute('data-section');
                    const submenu = document.getElementById(`${section}-submenu`);
                    const chevron = this.querySelector('.chevron-icon');
                    
                    this.classList.toggle('active');
                    
                    if (submenu) {
                        submenu.classList.toggle('active');
                    }
                    
                    if (chevron) {
                        chevron.style.transform = this.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
                    }
                });
            });
            
            document.addEventListener('click', function(e) {
                if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        }
    }
    
    // Initialize modal functionality
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

        $(document).on('click', function(e) {
            if ($(e.target).hasClass('modal')) {
                closeAllModals();
            }
        });

        $(document).keyup(function(e) {
            if (e.keyCode === 27) {
                closeAllModals();
            }
        });

        // Logout Modal
        $('#logout-trigger, #mobile-logout-trigger').click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            if ($(this).attr('id') === 'mobile-logout-trigger') {
                const mobileNav = document.getElementById('mobileNav');
                if (mobileNav) {
                    mobileNav.classList.remove('active');
                }
            }
            setTimeout(() => {
                openModal('logout-modal');
            }, 10);
        });
        
        $('#cancel-logout, #close-logout-modal').click(function(e) {
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
                window.location.href = "/logout";
            }
        });

        // View Details Modal close buttons
        $('#close-view-modal, #modal-cancel-btn').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize class approval functionality
    function initClassApproval() {
        $(document).on('click', '.view-class-btn, .mobile-view-class-btn', function() {
            try {
                const classData = $(this).data('class');
                openViewModal(classData);
            } catch (error) {
                console.error('Error parsing class data:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Error loading class data',
                    icon: 'error',
                    confirmButtonColor: '#003366',
                    confirmButtonText: 'OK'
                });
            }
        });

        $('#modal-approve-btn').click(function() {
            if (currentClassData) {
                showConfirmationDialog('approve');
            }
        });

        $('#modal-reject-btn').click(function() {
            if (currentClassData) {
                showConfirmationDialog('reject');
            }
        });
    }

    function openViewModal(classData) {
        currentClassId = classData.class_id;
        currentClassData = classData;
        
        // Populate modal with class data
        $('#detail-class-title').text(classData.class_title || 'N/A');
        $('#detail-course').text(classData.course_title || 'N/A');
        $('#detail-course-code').text(classData.course_code || 'N/A');
        $('#detail-school-year').text(classData.school_year || 'N/A');
        $('#detail-batch').text(classData.batch || 'N/A');
        
        const instructorName = classData.instructor_name || `${classData.first_name || ''} ${classData.last_name || ''}`.trim();
        $('#detail-instructor').text(instructorName || 'N/A');
        
        $('#detail-venue').text(classData.venue || 'N/A');
        $('#detail-max-students').text(classData.max_students || 'N/A');
        $('#detail-enrolled').text(classData.enrolled_count || '0');
        $('#detail-schedule').text(classData.schedule || 'N/A');
        
        // Format dates
        if (classData.start_date) {
            const startDate = new Date(classData.start_date);
            $('#detail-start-date').text(startDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        } else {
            $('#detail-start-date').text('N/A');
        }
        
        if (classData.end_date) {
            const endDate = new Date(classData.end_date);
            $('#detail-end-date').text(endDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        } else {
            $('#detail-end-date').text('N/A');
        }
        
        $('#detail-prerequisites').text(classData.prerequisites || 'None specified');

        // Handle days_of_week
        const daysTimesContainer = $('#detail-days-times');
        daysTimesContainer.empty();
        
        if (classData.days_of_week) {
            let daysData = classData.days_of_week;
            
            if (typeof daysData === 'string') {
                try {
                    daysData = JSON.parse(daysData);
                } catch (e) {
                    console.error('Error parsing days_of_week:', e);
                    daysData = {};
                }
            }
            
            if (daysData && typeof daysData === 'object' && Object.keys(daysData).length > 0) {
                for (const day in daysData) {
                    if (daysData.hasOwnProperty(day)) {
                        const times = daysData[day];
                        const startTime = times.start ? formatTime(times.start) : 'N/A';
                        const endTime = times.end ? formatTime(times.end) : 'N/A';
                        
                        daysTimesContainer.append(`
                            <div class="day-time-item">
                                <span class="day">${day}</span>
                                <span class="time">${startTime} - ${endTime}</span>
                            </div>
                        `);
                    }
                }
            } else {
                daysTimesContainer.html('<div class="no-data">No schedule details available</div>');
            }
        } else {
            daysTimesContainer.html('<div class="no-data">No schedule details available</div>');
        }
        
        $('#viewDetailsModal').css('display', 'flex');
        $('body').addClass('modal-open');
    }

    function formatTime(time24) {
        if (!time24) return 'N/A';
        
        const [hours, minutes] = time24.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `${hour12}:${minutes} ${ampm}`;
    }

    // FIXED: SweetAlert2 with Confirm button on RIGHT, Cancel on LEFT (standard)
    function showConfirmationDialog(action) {
        const actionText = action === 'approve' ? 'approve' : 'reject';
        const actionTitle = action === 'approve' ? 'Approve Class' : 'Reject Class';
        const confirmButtonColor = action === 'approve' ? '#10b981' : '#ef4444';
        
        Swal.fire({
            title: `Confirm ${actionTitle}`,
            text: `Are you sure you want to ${actionText} this class?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmButtonColor,
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Yes, ${actionText} it!`,
            cancelButtonText: 'Cancel',
            reverseButtons: false,  // false = Cancel on LEFT, Confirm on RIGHT (standard)
            buttonsStyling: true,
            focusConfirm: false,
            focusCancel: true
        }).then((result) => {
            if (result.isConfirmed) {
                processApproval(action);
            }
        });
        
        // Close the view modal
        $('#viewDetailsModal').fadeOut(300);
        $('body').removeClass('modal-open');
    }

    function processApproval(action) {
        if (!currentClassId) return;

        Swal.fire({
            title: 'Processing...',
            text: 'Please wait',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

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
                // Remove the class from arrays
                classes = classes.filter(cls => cls.class_id !== currentClassId);
                filteredClasses = filteredClasses.filter(cls => cls.class_id !== currentClassId);
                
                Swal.fire({
                    title: 'Success!',
                    text: data.message,
                    icon: 'success',
                    confirmButtonColor: '#003366',
                    confirmButtonText: 'OK'
                }).then(() => {
                    renderClasses();
                });
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message || 'An error occurred while processing the request',
                icon: 'error',
                confirmButtonColor: '#003366',
                confirmButtonText: 'OK'
            });
        })
        .finally(() => {
            currentClassId = null;
            currentClassData = null;
        });
    }
    
    // Initialize everything
    init();
});