// admin_edit_class.js - Enhanced Version with Status Management and Compact Buttons
$(document).ready(function() {
    const editClassUrl = "/admin/update_class";
    const updateStatusUrl = "/admin/update_class_status";
    let classes = [];
    let filteredClasses = [];
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Current class data for status update
    let currentStatusClassData = null;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initEditClass();
        initStatusManagement();
        initFiltering();
        initPagination();
        loadClasses();
    }
    
    // Load classes from existing DOM elements
    function loadClasses() {
        const tableRows = document.querySelectorAll('#classes-container tr[data-course-title]');
        
        classes = [];
        
        tableRows.forEach((row) => {
            const classData = {
                class_id: row.cells[0].textContent.trim(),
                class_title: row.cells[1].textContent.trim().replace('Batch', '').trim(),
                course_title: row.cells[2].textContent.trim().replace(/\n.*$/, '').trim(),
                course_code: row.cells[2].querySelector('.text-muted')?.textContent || '',
                duration: row.cells[3].textContent,
                students: row.cells[4].textContent,
                status: row.querySelector('.status-badge').textContent.trim(),
                instructor_name: row.cells[6].textContent.trim(),
                start_date: row.cells[3].textContent.split(' to ')[0].trim(),
                end_date: row.cells[3].textContent.split(' to ')[1].trim(),
                max_students: row.cells[4].textContent.split('/')[1],
                current_students: row.cells[4].textContent.split('/')[0]
            };
            
            // Get edit data
            const editBtn = row.querySelector('.edit-class-btn');
            if (editBtn && editBtn.dataset.class) {
                try {
                    const editData = JSON.parse(editBtn.dataset.class);
                    Object.assign(classData, editData);
                } catch (e) {
                    console.error('Error parsing edit class data:', e);
                }
            }
            
            classes.push(classData);
        });
        
        classes.forEach(cls => {
            cls.formatted_start_date = formatDate(cls.start_date);
            cls.formatted_end_date = formatDate(cls.end_date);
            cls.formatted_date_created = formatDate(cls.date_created);
        });
        
        filteredClasses = [...classes];
        currentPage = 1;
        renderClasses();
    }
    
    // Format date function
    function formatDate(dateString) {
        if (!dateString) return 'Not specified';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
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
            tableHtml += `
                <tr data-course-title="${cls.course_title}">
                    <td>${cls.class_id}</td>
                    <td><strong>${cls.class_title}</strong><br><small class="text-muted">Batch ${cls.batch || 'N/A'}</small></td>
                    <td>${cls.course_title}<br><small class="text-muted">${cls.course_code || ''}</small></td>
                    <td>${cls.formatted_start_date} to ${cls.formatted_end_date}</td>
                    <td>${cls.current_students || 0}/${cls.max_students}</td>
                    <td>
                        <span class="status-badge status-${cls.status.toLowerCase()}">
                            ${cls.status}
                        </span>
                    </td>
                    <td>${cls.instructor_name}</td>
                    <td>
                        <button class="action-btn edit-btn edit-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}' title="Edit Class">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="action-btn status-btn status-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}' title="Change Status">
                            <i class="fas fa-toggle-on"></i>
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
                            <div class="mobile-user-email">${cls.course_title} (Batch ${cls.batch || 'N/A'})</div>
                        </div>
                        <span class="status-badge status-${cls.status.toLowerCase()}">${cls.status}</span>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Class ID</div>
                            <div class="mobile-detail-value">${cls.class_id}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Duration</div>
                            <div class="mobile-detail-value">${cls.formatted_start_date} to ${cls.formatted_end_date}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Students</div>
                            <div class="mobile-detail-value">${cls.current_students || 0}/${cls.max_students}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${cls.instructor_name}</div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn edit-btn mobile-edit-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-pencil-alt"></i> Edit
                        </button>
                        <button class="mobile-action-btn status-btn mobile-status-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-toggle-on"></i> Status
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
                        <i class="fas fa-users-slash"></i>
                        <h3>No Active Classes Found</h3>
                        <p>There are currently no active classes in the system.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-classes-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-users-slash" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Active Classes Found</h3>
                <p style="color: #94a3b8;">There are currently no active classes in the system.</p>
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
    
    // Close all modals function
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
    
    // Initialize all modal functionality
    function initModals() {
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

        // Edit Class Modal
        $('#close-edit-modal, #cancel-btn').click(function() {
            closeAllModals();
        });

        // Status Modal
        $('#close-status-modal, #cancel-status-btn').click(function() {
            closeAllModals();
            currentStatusClassData = null;
        });
    }
    
    // Initialize status management
    function initStatusManagement() {
        $(document).on('click', '.status-class-btn, .mobile-status-class-btn', function() {
            try {
                const classData = $(this).data('class');
                openStatusModal(classData);
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

        $('#update-status-btn').click(function() {
            updateClassStatus();
        });

        $('#new_status').change(function() {
            $('#status_error').hide();
        });
    }

    function openStatusModal(classData) {
        currentStatusClassData = classData;
        
        $('#status_class_id').val(classData.class_id);
        $('#status_class_title').text(classData.class_title || 'N/A');
        
        const currentStatusSpan = $('#status_current_status');
        currentStatusSpan.text(classData.status || 'N/A');
        currentStatusSpan.removeClass().addClass(`status-badge status-${(classData.status || 'pending').toLowerCase()}`);
        
        // Reset dropdown
        $('#new_status').val('');
        $('#status_error').hide();
        
        $('#statusModal').css('display', 'flex');
        $('body').addClass('modal-open');
    }

    function updateClassStatus() {
        const classId = $('#status_class_id').val();
        const newStatus = $('#new_status').val();
        
        if (!classId) {
            showMessage('Class ID is missing', 'error');
            return;
        }
        
        if (!newStatus) {
            $('#status_error').text('Please select a new status').show();
            return;
        }

        // Close the status modal first
        closeAllModals();

        Swal.fire({
            title: 'Update Status?',
            text: `Are you sure you want to change status to "${newStatus}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#8b5cf6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, update it!',
            cancelButtonText: 'Cancel',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then((result) => {
            if (result.isConfirmed) {
                performStatusUpdate(classId, newStatus);
            } else {
                // If cancelled, reopen the status modal
                if (currentStatusClassData) {
                    setTimeout(() => {
                        openStatusModal(currentStatusClassData);
                    }, 100);
                }
            }
        });
    }

    function performStatusUpdate(classId, newStatus) {
        Swal.fire({
            title: 'Processing...',
            text: 'Please wait',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch(updateStatusUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ class_id: classId, status: newStatus })
        })
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                Swal.fire({
                    title: 'Success!',
                    text: data.message,
                    icon: 'success',
                    confirmButtonColor: '#003366',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                }).then(() => {
                    location.reload();
                });
            } else {
                throw new Error(data.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            Swal.fire({
                title: 'Error!',
                text: error.message || 'An error occurred',
                icon: 'error',
                confirmButtonColor: '#003366',
                confirmButtonText: 'OK',
                allowOutsideClick: false,
                allowEscapeKey: false
            }).then(() => {
                // Reopen status modal on error
                if (currentStatusClassData) {
                    setTimeout(() => {
                        openStatusModal(currentStatusClassData);
                    }, 100);
                }
            });
        })
        .finally(() => {
            currentStatusClassData = null;
        });
    }
    
    // Initialize edit class functionality
    function initEditClass() {
        let daySlots = new Set();
        let originalData = {};
        
        function createDaySlot(day) {
            return `
                <div class="day-slot" data-day="${day}">
                    <div class="day-slot-header">
                        <span class="day-slot-title"><i class="fas fa-calendar-day"></i> ${day}</span>
                        <button type="button" class="remove-day" title="Remove this day">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="time-inputs">
                        <div class="form-group">
                            <label for="${day.toLowerCase()}-start">Start Time</label>
                            <div class="input-with-icon">
                                <i class="fas fa-clock"></i>
                                <select class="day-time-input form-control" id="${day.toLowerCase()}-start" data-day="${day}" data-type="start" required>
                                    <option value="" disabled selected>Select start time</option>
                                    ${generateTimeOptions()}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="${day.toLowerCase()}-end">End Time</label>
                            <div class="input-with-icon">
                                <i class="fas fa-clock"></i>
                                <select class="day-time-input form-control" id="${day.toLowerCase()}-end" data-day="${day}" data-type="end" required>
                                    <option value="" disabled selected>Select end time</option>
                                    ${generateTimeOptions()}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        function generateTimeOptions() {
            let options = '';
            for (let hour = 6; hour <= 18; hour++) {
                const hour12 = hour % 12 || 12;
                const ampm = hour < 12 ? 'AM' : 'PM';
                const time24 = `${hour.toString().padStart(2, '0')}:00`;
                const time12 = `${hour12}:00 ${ampm}`;
                options += `<option value="${time24}">${time12}</option>`;
            }
            return options;
        }

        function initializeDaySelectors() {
            const daySelectors = document.querySelectorAll('.day-selector');
            const dayTimeSlots = document.getElementById('dayTimeSlots');
            
            daySelectors.forEach(selector => {
                selector.addEventListener('change', function() {
                    const day = this.value;
                    
                    if (this.checked && !daySlots.has(day)) {
                        daySlots.add(day);
                        updateDaySlotsDisplay();
                    } else if (!this.checked && daySlots.has(day)) {
                        daySlots.delete(day);
                        updateDaySlotsDisplay();
                    }
                    checkForChanges();
                });
            });

            dayTimeSlots.addEventListener('click', function(e) {
                if (e.target.closest('.remove-day')) {
                    const daySlot = e.target.closest('.day-slot');
                    const day = daySlot.dataset.day;
                    
                    const checkbox = document.querySelector(`.day-selector[value="${day}"]`);
                    if (checkbox) {
                        checkbox.checked = false;
                    }
                    
                    daySlots.delete(day);
                    updateDaySlotsDisplay();
                    checkForChanges();
                }
            });

            dayTimeSlots.addEventListener('change', function(e) {
                if (e.target.classList.contains('day-time-input')) {
                    const day = e.target.dataset.day;
                    const type = e.target.dataset.type;
                    const otherType = type === 'start' ? 'end' : 'start';
                    
                    const currentTime = e.target.value;
                    const otherTimeInput = document.querySelector(`.day-time-input[data-day="${day}"][data-type="${otherType}"]`);
                    
                    if (currentTime && otherTimeInput && otherTimeInput.value) {
                        if (type === 'start' && currentTime >= otherTimeInput.value) {
                            showMessage('Start time must be before end time', 'error');
                            e.target.value = '';
                        } else if (type === 'end' && currentTime <= otherTimeInput.value) {
                            showMessage('End time must be after start time', 'error');
                            e.target.value = '';
                        }
                    }
                    checkForChanges();
                }
            });
        }

        function updateDaySlotsDisplay() {
            const dayTimeSlots = document.getElementById('dayTimeSlots');
            if (!dayTimeSlots) return;
            
            if (daySlots.size === 0) {
                dayTimeSlots.innerHTML = `
                    <div class="no-days-selected">
                        <i class="far fa-calendar-plus"></i>
                        <p>Select days above to add time slots</p>
                    </div>
                `;
                return;
            }
            
            const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            const sortedDays = Array.from(daySlots).sort((a, b) => {
                return daysOrder.indexOf(a) - daysOrder.indexOf(b);
            });
            
            let html = '';
            sortedDays.forEach(day => {
                html += createDaySlot(day);
            });
            
            dayTimeSlots.innerHTML = html;
        }

        // Track changes and disable save button when no changes
        function storeOriginalValues() {
            originalData = {
                class_title: $('#class_title').val(),
                school_year: $('#school_year').val(),
                batch: $('#batch').val(),
                instructor_name: $('#instructor_name').val(),
                venue: $('#venue').val(),
                start_date: $('#start_date').val(),
                end_date: $('#end_date').val(),
                days: new Set(daySlots),
                times: {}
            };
            
            daySlots.forEach(day => {
                originalData.times[day] = {
                    start: $(`.day-time-input[data-day="${day}"][data-type="start"]`).val(),
                    end: $(`.day-time-input[data-day="${day}"][data-type="end"]`).val()
                };
            });
        }

        function checkForChanges() {
            const saveBtn = document.getElementById('save-btn');
            if (!saveBtn) return;
            
            let hasChanges = false;
            
            // Check text fields
            if ($('#class_title').val() !== originalData.class_title) hasChanges = true;
            if ($('#school_year').val() !== originalData.school_year) hasChanges = true;
            if ($('#batch').val() !== originalData.batch) hasChanges = true;
            if ($('#instructor_name').val() !== originalData.instructor_name) hasChanges = true;
            if ($('#venue').val() !== originalData.venue) hasChanges = true;
            if ($('#start_date').val() !== originalData.start_date) hasChanges = true;
            if ($('#end_date').val() !== originalData.end_date) hasChanges = true;
            
            // Check days
            if (!hasChanges) {
                // Check if day sets are different size
                if (daySlots.size !== originalData.days.size) {
                    hasChanges = true;
                } else {
                    // Check if any day is different
                    const dayArray = Array.from(daySlots).sort();
                    const originalDayArray = Array.from(originalData.days).sort();
                    
                    for (let i = 0; i < dayArray.length; i++) {
                        if (dayArray[i] !== originalDayArray[i]) {
                            hasChanges = true;
                            break;
                        }
                    }
                    
                    // Check times if days are the same
                    if (!hasChanges) {
                        daySlots.forEach(day => {
                            const startVal = $(`.day-time-input[data-day="${day}"][data-type="start"]`).val();
                            const endVal = $(`.day-time-input[data-day="${day}"][data-type="end"]`).val();
                            
                            if (startVal !== originalData.times[day]?.start || 
                                endVal !== originalData.times[day]?.end) {
                                hasChanges = true;
                            }
                        });
                    }
                }
            }
            
            // Enable/disable save button
            saveBtn.disabled = !hasChanges;
            saveBtn.style.opacity = hasChanges ? '1' : '0.5';
            saveBtn.style.cursor = hasChanges ? 'pointer' : 'not-allowed';
            
            // Update button title
            saveBtn.title = hasChanges ? 'Save Changes' : 'No changes to save';
        }

        // Add event listeners for change tracking
        function initChangeTracking() {
            $('#editModal input, #editModal select').on('input change', function() {
                checkForChanges();
            });
            
            // Also track day selector changes
            $('.day-selector').on('change', function() {
                setTimeout(checkForChanges, 50); // Small delay to let daySlots update
            });
        }

        $(document).on('click', '.edit-class-btn, .mobile-edit-class-btn', function() {
            try {
                const classData = $(this).data('class');
                openEditModal(classData);
            } catch (error) {
                console.error('Error parsing class data:', error);
                showMessage('Error loading class data', 'error');
            }
        });

        const endDateField = document.getElementById('end_date');
        const startDateField = document.getElementById('start_date');
        
        if (endDateField) {
            endDateField.addEventListener('change', function() {
                const startDate = new Date(document.getElementById('start_date').value);
                const endDate = new Date(this.value);
                
                if (startDate && endDate && endDate < startDate) {
                    showError('end_date', "End Date cannot be before Start Date");
                    this.value = '';
                } else {
                    const errorElement = document.getElementById('end_date_error');
                    if (errorElement) {
                        errorElement.style.display = 'none';
                    }
                }
                checkForChanges();
            });
        }

        if (startDateField) {
            startDateField.addEventListener('change', function() {
                const startDate = new Date(this.value);
                const endDateField = document.getElementById('end_date');
                
                if (this.value && endDateField) {
                    startDate.setDate(startDate.getDate() + 1);
                    const minEndDate = startDate.toISOString().split('T')[0];
                    endDateField.min = minEndDate;
                    
                    if (endDateField.value && new Date(endDateField.value) < startDate) {
                        endDateField.value = '';
                    }
                } else if (endDateField) {
                    endDateField.min = '';
                }
                checkForChanges();
            });
        }

        $('#save-btn').click(submitEditRequest);

        function openEditModal(classData) {
            const modal = document.getElementById('editModal');
            if (!modal) return;

            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.classList.remove('error');
            });

            document.getElementById('class_id').value = classData.class_id;
            document.getElementById('class_title').value = classData.class_title || '';
            document.getElementById('school_year').value = classData.school_year || '';
            document.getElementById('batch').value = classData.batch || '';
            document.getElementById('instructor_name').value = classData.instructor_name || '';
            document.getElementById('venue').value = classData.venue || '';
            
            const maxStudentsField = document.getElementById('max_students');
            maxStudentsField.value = "25";
            maxStudentsField.setAttribute('readonly', 'true');
            
            if (classData.start_date) {
                const startDate = new Date(classData.start_date);
                document.getElementById('start_date').value = startDate.toISOString().split('T')[0];
            }
            
            if (classData.end_date) {
                const endDate = new Date(classData.end_date);
                document.getElementById('end_date').value = endDate.toISOString().split('T')[0];
            }
            
            daySlots.clear();
            if (classData.days_of_week) {
                let daysData;
                
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
                            daySlots.add(day);
                            const checkbox = document.querySelector(`.day-selector[value="${day}"]`);
                            if (checkbox) {
                                checkbox.checked = true;
                            }
                        }
                    }
                    updateDaySlotsDisplay();
                    
                    setTimeout(() => {
                        for (const day in daysData) {
                            if (daysData.hasOwnProperty(day)) {
                                const times = daysData[day];
                                const startSelect = document.querySelector(`.day-time-input[data-day="${day}"][data-type="start"]`);
                                const endSelect = document.querySelector(`.day-time-input[data-day="${day}"][data-type="end"]`);
                                if (startSelect && times.start) startSelect.value = times.start;
                                if (endSelect && times.end) endSelect.value = times.end;
                            }
                        }
                        // Store original values after everything is loaded
                        setTimeout(() => {
                            storeOriginalValues();
                            checkForChanges();
                        }, 200);
                    }, 100);
                } else {
                    // Store original values even if no days
                    setTimeout(() => {
                        storeOriginalValues();
                        checkForChanges();
                    }, 200);
                }
            } else {
                // Store original values if no days data
                setTimeout(() => {
                    storeOriginalValues();
                    checkForChanges();
                }, 200);
            }

            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
            
            setTimeout(() => {
                const firstInput = document.getElementById('class_title');
                if (firstInput) {
                    firstInput.focus();
                }
            }, 300);
        }

        function showError(fieldId, message) {
            const errorElement = document.getElementById(`${fieldId}_error`);
            const fieldElement = document.getElementById(fieldId);
            
            if (errorElement && fieldElement) {
                errorElement.textContent = message;
                errorElement.style.display = 'block';
                fieldElement.classList.add('error');
                
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        function showMessage(message, type = 'success') {
            const messageContainer = document.getElementById('message-container');
            const messageContent = document.getElementById('message-content');
            
            if (!messageContainer || !messageContent) return;
            
            messageContent.textContent = message;
            messageContent.className = 'message ' + type;
            messageContainer.style.display = 'block';
            
            messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 5000);
        }

        function submitEditRequest() {
            const classId = document.getElementById('class_id').value;
            if (!classId) {
                showMessage('Class ID is missing', 'error');
                return;
            }

            // Check if there are actual changes
            const saveBtn = document.getElementById('save-btn');
            if (saveBtn.disabled) {
                showMessage('No changes to save', 'info');
                return;
            }

            const data = {
                class_id: classId,
                class_title: document.getElementById('class_title').value.trim(),
                school_year: document.getElementById('school_year').value.trim(),
                batch: document.getElementById('batch').value.trim(),
                instructor_name: document.getElementById('instructor_name').value.trim(),
                venue: document.getElementById('venue').value.trim(),
                max_students: 25,
                start_date: document.getElementById('start_date').value,
                end_date: document.getElementById('end_date').value
            };

            const daysData = {};
            let allTimesValid = true;
            
            if (daySlots.size === 0) {
                showError('days_error', 'Please select at least one day');
                allTimesValid = false;
            } else {
                const dayInputs = document.querySelectorAll('.day-time-input');
                dayInputs.forEach(input => {
                    if (!input.value) {
                        allTimesValid = false;
                        input.classList.add('error');
                    } else {
                        input.classList.remove('error');
                    }
                });
                
                if (!allTimesValid) {
                    showError('days_error', 'Please provide both start and end times for all selected days');
                } else {
                    daySlots.forEach(day => {
                        const startInput = document.querySelector(`.day-time-input[data-day="${day}"][data-type="start"]`);
                        const endInput = document.querySelector(`.day-time-input[data-day="${day}"][data-type="end"]`);
                        
                        if (startInput && endInput) {
                            daysData[day] = {
                                start: startInput.value,
                                end: endInput.value
                            };
                        }
                    });
                }
            }
            
            data.days_of_week = daysData;

            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.classList.remove('error');
            });

            let isValid = allTimesValid;

            if (!data.class_title) {
                showError('class_title', "Class Title is required");
                isValid = false;
            }
            if (!data.school_year) {
                showError('school_year', "School Year is required");
                isValid = false;
            }
            if (!data.instructor_name) {
                showError('instructor_name', "Instructor Name is required");
                isValid = false;
            }
            if (!data.venue) {
                showError('venue', "Venue is required");
                isValid = false;
            }
            if (!data.start_date) {
                showError('start_date', "Start Date is required");
                isValid = false;
            }
            if (!data.end_date) {
                showError('end_date', "End Date is required");
                isValid = false;
            }
            if (data.start_date && data.end_date && new Date(data.end_date) < new Date(data.start_date)) {
                showError('end_date', "End Date cannot be before Start Date");
                isValid = false;
            }

            if (!isValid) {
                showMessage('Please fix the errors above', 'error');
                return;
            }

            if (saveBtn) {
                saveBtn.classList.add('loading');
                saveBtn.disabled = true;
                const btnText = saveBtn.querySelector('.btn-text');
                if (btnText) {
                    btnText.textContent = 'Saving...';
                }
            }

            fetch(editClassUrl, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(res => {
                // FIXED: Check for 'result' instead of 'status'
                if (res.result === 'success') {
                    // Close modal first
                    closeAllModals();
                    
                    Swal.fire({
                        title: 'Success!',
                        text: res.message || 'Class updated successfully',
                        icon: 'success',
                        confirmButtonColor: '#003366',
                        confirmButtonText: 'OK',
                        allowOutsideClick: false,
                        allowEscapeKey: false
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    throw new Error(res.message || 'Unknown error occurred');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                closeAllModals();
                Swal.fire({
                    title: 'Error!',
                    text: error.message || 'An error occurred while saving changes',
                    icon: 'error',
                    confirmButtonColor: '#003366',
                    confirmButtonText: 'OK',
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
            })
            .finally(() => {
                if (saveBtn) {
                    saveBtn.classList.remove('loading');
                    saveBtn.disabled = false;
                    const btnText = saveBtn.querySelector('.btn-text');
                    if (btnText) {
                        btnText.textContent = 'Save Changes';
                    }
                }
            });
        }

        initializeDaySelectors();
        initChangeTracking();
    }
    
    // Initialize everything
    init();
});