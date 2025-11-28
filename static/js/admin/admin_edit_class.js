// admin_edit_class.js - Enhanced Version with Improved UI/UX
$(document).ready(function() {
    const editClassUrl = "/admin/update_class";
    let classes = [];
    let filteredClasses = [];
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initEditClass();
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
                class_id: row.cells[0].textContent,
                class_title: row.cells[1].textContent,
                course_title: row.cells[2].textContent,
                duration: row.cells[3].textContent,
                students: row.cells[4].textContent,
                status: row.querySelector('.status-badge').textContent,
                instructor_name: row.cells[6].textContent,
                start_date: row.cells[3].textContent.split(' to ')[0],
                end_date: row.cells[3].textContent.split(' to ')[1],
                schedule: '',
                venue: '',
                max_students: row.cells[4].textContent.split('/')[1],
                current_students: row.cells[4].textContent.split('/')[0],
                date_created: '',
                school_year: '',
                batch: ''
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
        
        // Format dates for all classes
        classes.forEach(cls => {
            cls.formatted_start_date = formatDate(cls.start_date);
            cls.formatted_end_date = formatDate(cls.end_date);
            cls.formatted_date_created = formatDate(cls.date_created);
        });
        
        filteredClasses = [...classes];
        currentPage = 1;
        renderClasses();
    }
    
    // Format date to "Nov 1, 2025" format
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
                <tr data-course-title="${cls.course_title}">
                    <td>${cls.class_id}</td>
                    <td>${cls.class_title}</td>
                    <td>${cls.course_title}</td>
                    <td>${cls.formatted_start_date} to ${cls.formatted_end_date}</td>
                    <td>${cls.current_students || 0}/${cls.max_students}</td>
                    <td>
                        <span class="status-badge status-${cls.status.toLowerCase()}">
                            ${cls.status}
                        </span>
                    </td>
                    <td>${cls.instructor_name}</td>
                    <td>
                        <button class="action-btn edit-btn edit-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-pencil-alt"></i> Edit
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
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value">
                                <span class="status-badge status-${cls.status.toLowerCase()}">${cls.status}</span>
                            </div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${cls.instructor_name}</div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn edit-btn mobile-edit-class-btn" data-class='${JSON.stringify(cls).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-pencil-alt"></i> Edit Class
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

        // Edit Class Modal
        $('#close-edit-modal').click(function() {
            closeAllModals();
        });

        $('#cancel-btn').click(function() {
            closeAllModals();
        });
    }
    
    // Initialize edit class functionality
    function initEditClass() {
        let daySlots = new Set();
        
        // Template for day time slot
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

        // Generate time options in 1-hour increments from 6AM to 6PM
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

        // Manage day selections and time slots
        function initializeDaySelectors() {
            const daySelectors = document.querySelectorAll('.day-selector');
            const dayTimeSlots = document.getElementById('dayTimeSlots');
            
            daySelectors.forEach(selector => {
                selector.addEventListener('change', function() {
                    const day = this.value;
                    
                    if (this.checked && !daySlots.has(day)) {
                        // Add new day slot
                        daySlots.add(day);
                        updateDaySlotsDisplay();
                    } else if (!this.checked && daySlots.has(day)) {
                        // Remove day slot
                        daySlots.delete(day);
                        updateDaySlotsDisplay();
                    }
                });
            });

            // Handle remove day button clicks (delegated event)
            dayTimeSlots.addEventListener('click', function(e) {
                if (e.target.closest('.remove-day')) {
                    const daySlot = e.target.closest('.day-slot');
                    const day = daySlot.dataset.day;
                    
                    // Uncheck the corresponding checkbox
                    const checkbox = document.querySelector(`.day-selector[value="${day}"]`);
                    if (checkbox) {
                        checkbox.checked = false;
                    }
                    
                    // Remove from set and update display
                    daySlots.delete(day);
                    updateDaySlotsDisplay();
                }
            });

            // Time validation for day slots
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
                }
            });
        }

        // Update the day slots display
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
            
            // Sort days in order (Monday to Sunday)
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

        // Edit button event listeners
        $(document).on('click', '.edit-class-btn, .mobile-edit-class-btn', function() {
            try {
                const classData = $(this).data('class');
                openEditModal(classData);
            } catch (error) {
                console.error('Error parsing class data:', error);
                showMessage('Error loading class data', 'error');
            }
        });

        // Date validation to ensure end date is after start date
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
            });
        }

        // Set minimum end date based on start date
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
            });
        }

        // Save button event listener
        $('#save-btn').click(submitEditRequest);

        function openEditModal(classData) {
            const modal = document.getElementById('editModal');
            if (!modal) return;

            // Clear previous errors and reset form
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.classList.remove('error');
            });

            // Set basic form values
            document.getElementById('class_id').value = classData.class_id;
            document.getElementById('class_title').value = classData.class_title || '';
            document.getElementById('school_year').value = classData.school_year || '';
            document.getElementById('batch').value = classData.batch || '';
            document.getElementById('instructor_name').value = classData.instructor_name || '';
            document.getElementById('venue').value = classData.venue || '';
            
            // Set max students to 25 (read-only)
            const maxStudentsField = document.getElementById('max_students');
            maxStudentsField.value = "25";
            maxStudentsField.setAttribute('readonly', 'true');
            
            // Format dates for date inputs
            if (classData.start_date) {
                const startDate = new Date(classData.start_date);
                document.getElementById('start_date').value = startDate.toISOString().split('T')[0];
            }
            
            if (classData.end_date) {
                const endDate = new Date(classData.end_date);
                document.getElementById('end_date').value = endDate.toISOString().split('T')[0];
            }
            
            // Handle days_of_week
            daySlots.clear();
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
                
                // Check the checkboxes and create time slots
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
                    
                    // After slots are created, set the time values
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
                    }, 100);
                }
            }

            // Show modal
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
            
            // Focus on first field
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
                
                // Scroll to error
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
            
            // Scroll to message
            messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Hide message after 5 seconds
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

            const data = {
                class_id: classId,
                class_title: document.getElementById('class_title').value.trim(),
                school_year: document.getElementById('school_year').value.trim(),
                batch: document.getElementById('batch').value.trim(),
                instructor_name: document.getElementById('instructor_name').value.trim(),
                venue: document.getElementById('venue').value.trim(),
                max_students: 25, // Fixed at 25 students
                start_date: document.getElementById('start_date').value,
                end_date: document.getElementById('end_date').value
            };

            // Create days_of_week JSON
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

            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(el => {
                el.style.display = 'none';
            });
            document.querySelectorAll('.form-control').forEach(el => {
                el.classList.remove('error');
            });

            // Validation
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

            // Show loading state
            const saveBtn = document.getElementById('save-btn');
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
                if (res.status === 'success') {
                    showMessage(res.message || 'Class updated successfully', 'success');
                    // Close modal using the new modal system
                    $('.modal').fadeOut(300);
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                } else {
                    throw new Error(res.message || 'Unknown error occurred');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showMessage(error.message || 'An error occurred while saving changes', 'error');
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

        // Initialize day selectors
        initializeDaySelectors();
    }
    
    // Initialize everything
    init();
});