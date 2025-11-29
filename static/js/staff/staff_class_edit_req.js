// staff_class_edit_req.js - Complete Updated Version
$(document).ready(function() {
    let allClasses = [];
    let filteredClasses = [];
    
    // Pagination variables
    let currentPage = 1;
    let pageSize = 10;
    let totalPages = 1;
    
    // Day slots management
    const daySlots = new Set();
    
    const $searchInput = $('#search-input');
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initPagination();
        setActiveNavigation();
        initClassData();
        initEditModal();
        
        // Search functionality with debounce
        let searchTimeout = null;
        function doSearch() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterClasses();
            }, 300);
        }

        // Event listeners for search
        $searchInput.on('input', doSearch);
    }
    
    // Initialize class data from server or existing HTML
    function initClassData() {
        // Check if we have classes data in the HTML
        const classesContainer = $('#classes-container');
        const classRows = classesContainer.find('tr[data-class-id]');
        
        if (classRows.length > 0) {
            // Extract data from existing HTML rows
            allClasses = [];
            classRows.each(function() {
                const $row = $(this);
                const classId = $row.data('class-id');
                const classTitle = $row.find('.class-title').text();
                const courseTitle = $row.find('td').eq(0).text();
                const schoolYear = $row.find('td').eq(2).text();
                const batch = $row.find('td').eq(3).text();
                const schedule = $row.find('td').eq(4).text();
                const venue = $row.find('td').eq(5).text();
                const instructorName = $row.find('td').eq(6).text();
                
                const statusBadge = $row.find('.status-badge');
                const status = statusBadge.text().toLowerCase();
                const statusClass = statusBadge.attr('class').split(' ').find(cls => cls.startsWith('status-'));
                
                // Get the edit button data
                const editButton = $row.find('.edit-btn');
                const classData = editButton.data('class');
                
                allClasses.push({
                    class_id: classId,
                    class_title: classTitle,
                    course_title: courseTitle,
                    school_year: schoolYear,
                    batch: batch,
                    schedule: schedule,
                    venue: venue,
                    instructor_name: instructorName,
                    status: status,
                    status_class: statusClass,
                    raw_data: classData // Store the raw JSON data
                });
            });
            
            filteredClasses = allClasses;
            
            // Setup pagination and filtering
            setupPaginationFiltering();
        } else {
            // No classes found, show empty state
            renderEmptyState();
        }
    }
    
    // Setup pagination filtering
    function setupPaginationFiltering() {
        const totalClasses = filteredClasses.length;
        if (totalClasses === 0) {
            renderEmptyState();
            return;
        }
        
        // Calculate pagination
        totalPages = Math.ceil(totalClasses / pageSize);
        
        // Show/hide rows based on current page
        updateTableVisibility();
        updatePagination();
    }
    
    // Update table row visibility based on current page
    function updateTableVisibility() {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, filteredClasses.length);
        
        // Get all class rows
        const classRows = $('#classes-container').find('tr[data-class-id]');
        
        // Hide all rows first
        classRows.hide();
        
        // Show only rows for current page
        classRows.slice(startIndex, endIndex).show();
        
        // Update mobile cards
        renderMobileCards(filteredClasses.slice(startIndex, endIndex));
    }
    
    // Set active navigation based on current page
    function setActiveNavigation() {
        // Hardcoded active class for Class Edit Request
        $('.courses-subnav .subnav-right a').removeClass('active');
        $('.courses-subnav .subnav-right a[href*="staff_class_edit_req"]').addClass('active');
        
        // Mobile navigation active state
        $('.mobile-nav-submenu a').removeClass('active');
        $('.mobile-nav-submenu a[href*="staff_class_edit_req"]').addClass('active');
    }
    
    // Initialize pagination
    function initPagination() {
        // Page size change
        $('#page-size').on('change', function() {
            pageSize = parseInt($(this).val());
            currentPage = 1;
            setupPaginationFiltering();
        });
        
        // Pagination button handlers
        $('#first-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = 1;
                setupPaginationFiltering();
            }
        });
        
        $('#prev-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage--;
                setupPaginationFiltering();
            }
        });
        
        $('#next-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage++;
                setupPaginationFiltering();
            }
        });
        
        $('#last-page').on('click', function() {
            if (!$(this).prop('disabled')) {
                currentPage = totalPages;
                setupPaginationFiltering();
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
                setupPaginationFiltering();
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
    
    // Filter classes based on search
    function filterClasses() {
        const searchTerm = $searchInput.val().toLowerCase();
        
        if (searchTerm === '') {
            // No filtering needed, show all classes
            filteredClasses = allClasses;
        } else {
            filteredClasses = allClasses.filter(cls => {
                const classTitle = (cls.class_title || '').toLowerCase();
                const courseTitle = (cls.course_title || '').toLowerCase();
                const venue = (cls.venue || '').toLowerCase();
                const instructorName = (cls.instructor_name || '').toLowerCase();
                const schoolYear = (cls.school_year || '').toLowerCase();
                const batch = (cls.batch || '').toLowerCase();
                
                return classTitle.includes(searchTerm) || 
                       courseTitle.includes(searchTerm) || 
                       venue.includes(searchTerm) ||
                       instructorName.includes(searchTerm) ||
                       schoolYear.includes(searchTerm) ||
                       batch.includes(searchTerm);
            });
        }
        
        currentPage = 1;
        setupPaginationFiltering();
    }
    
    // Render mobile cards (only for mobile view)
    function renderMobileCards(currentClasses) {
        let cardsHtml = '';
        
        currentClasses.forEach(cls => {
            cardsHtml += `
                <div class="mobile-user-card" data-class-id="${cls.class_id}">
                    <div class="mobile-user-header">
                        <div class="mobile-user-info">
                            <div class="mobile-user-name">${cls.class_title}</div>
                            <div class="mobile-user-email">${cls.course_title}</div>
                        </div>
                    </div>
                    <div class="mobile-user-details">
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">School Year</div>
                            <div class="mobile-detail-value">${cls.school_year}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Batch</div>
                            <div class="mobile-detail-value">${cls.batch}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Schedule</div>
                            <div class="mobile-detail-value">${cls.schedule}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Venue</div>
                            <div class="mobile-detail-value">${cls.venue}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Instructor</div>
                            <div class="mobile-detail-value">${cls.instructor_name}</div>
                        </div>
                        <div class="mobile-user-detail">
                            <div class="mobile-detail-label">Status</div>
                            <div class="mobile-detail-value"><span class="status-badge ${cls.status_class || 'status-' + cls.status}">${cls.status}</span></div>
                        </div>
                    </div>
                    <div class="mobile-user-actions">
                        <button class="mobile-action-btn edit-btn" data-class='${JSON.stringify(cls.raw_data).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-pencil-alt"></i> Edit
                        </button>
                    </div>
                </div>
            `;
        });
        
        $('#mobile-classes-container').html(cardsHtml);
        
        // Re-attach event listeners to mobile edit buttons
        $('#mobile-classes-container .edit-btn').on('click', function() {
            const classData = JSON.parse($(this).attr('data-class').replace(/&#39;/g, "'"));
            openEditModal(classData);
        });
    }
    
    // Render empty state
    function renderEmptyState() {
        $('#classes-container').html(`
            <tr>
                <td colspan="9" class="no-results">
                    <div class="empty-state">
                        <i class="fas fa-book-open"></i>
                        <h3>No Classes Found</h3>
                        <p>There are currently no classes matching your criteria.</p>
                    </div>
                </td>
            </tr>
        `);
        $('#mobile-classes-container').html(`
            <div class="empty-state" style="text-align: center; padding: 2rem;">
                <i class="fas fa-book-open" style="font-size: 3rem; color: #94a3b8; margin-bottom: 1rem;"></i>
                <h3 style="color: #64748b; margin-bottom: 0.5rem;">No Classes Found</h3>
                <p style="color: #94a3b8;">There are currently no classes matching your criteria.</p>
            </div>
        `);
        $('#pagination-container').hide();
    }

    // ===== EDIT MODAL FUNCTIONALITY =====
    
    function initEditModal() {
        // Edit button click handlers
        $(document).on('click', '.edit-btn', function() {
            const classData = $(this).data('class');
            openEditModal(classData);
        });
        
        // Edit modal close handlers
        $('#close-edit-modal, #cancel-btn').on('click', closeEditModal);
        
        // Save button handler
        $('#save-btn').on('click', submitEditRequest);
        
        // Day selection handlers
        $('.day-selector').on('change', handleDaySelection);
        
        // Remove day handler (delegated)
        $('#dayTimeSlots').on('click', '.remove-day', handleRemoveDay);
        
        // Time validation handler
        $('#dayTimeSlots').on('change', '.day-time-input', validateTimeInputs);
        
        // Date validation
        $('#start_date').on('change', updateEndDateMin);
        $('#end_date').on('change', validateEndDate);
    }
    
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
                            <select class="day-time-input" id="${day.toLowerCase()}-start" data-day="${day}" data-type="start" required>
                                <option value="" disabled selected>Select start time</option>
                                ${generateTimeOptions()}
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="${day.toLowerCase()}-end">End Time</label>
                        <div class="input-with-icon">
                            <i class="fas fa-clock"></i>
                            <select class="day-time-input" id="${day.toLowerCase()}-end" data-day="${day}" data-type="end" required>
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

    // Handle day selections and time slots
    function handleDaySelection() {
        const day = $(this).val();
        
        if (this.checked && !daySlots.has(day)) {
            // Add new day slot
            daySlots.add(day);
            updateDaySlotsDisplay();
        } else if (!this.checked && daySlots.has(day)) {
            // Remove day slot
            daySlots.delete(day);
            updateDaySlotsDisplay();
        }
    }

    // Handle remove day button clicks
    function handleRemoveDay(e) {
        const daySlot = $(e.target).closest('.day-slot');
        const day = daySlot.data('day');
        
        // Uncheck the corresponding checkbox
        $(`.day-selector[value="${day}"]`).prop('checked', false);
        
        // Remove from set and update display
        daySlots.delete(day);
        updateDaySlotsDisplay();
    }

    // Update the day slots display
    function updateDaySlotsDisplay() {
        const dayTimeSlots = $('#dayTimeSlots');
        
        if (daySlots.size === 0) {
            dayTimeSlots.html(`
                <div class="no-days-selected">
                    <i class="far fa-calendar-plus"></i>
                    <p>Select days above to add time slots</p>
                </div>
            `);
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
        
        dayTimeSlots.html(html);
    }

    // Time validation for day slots
    function validateTimeInputs(e) {
        const $target = $(e.target);
        if ($target.hasClass('day-time-input')) {
            const day = $target.data('day');
            const type = $target.data('type');
            const otherType = type === 'start' ? 'end' : 'start';
            
            const currentTime = $target.val();
            const $otherTimeInput = $(`.day-time-input[data-day="${day}"][data-type="${otherType}"]`);
            
            if (currentTime && $otherTimeInput.val()) {
                if (type === 'start' && currentTime >= $otherTimeInput.val()) {
                    showMessage('Start time must be before end time', 'error');
                    $target.val('');
                } else if (type === 'end' && currentTime <= $otherTimeInput.val()) {
                    showMessage('End time must be after start time', 'error');
                    $target.val('');
                }
            }
        }
    }

    function openEditModal(classData) {
        // Clear previous errors and reset form
        $('.error-message').hide();
        $('.form-control').removeClass('error');
        
        // Clear day slots
        daySlots.clear();
        $('.day-selector').prop('checked', false);
        updateDaySlotsDisplay();

        // Set basic form values
        $('#class_id').val(classData.class_id);
        $('#class_title').val(classData.class_title);
        $('#school_year').val(classData.school_year);
        $('#batch').val(classData.batch || '');
        $('#instructor_name').val(classData.instructor_name);
        $('#venue').val(classData.venue);
        $('#max_students').val(classData.max_students);
        
        // Format dates for date inputs
        const startDate = new Date(classData.start_date);
        const endDate = new Date(classData.end_date);
        $('#start_date').val(startDate.toISOString().split('T')[0]);
        $('#end_date').val(endDate.toISOString().split('T')[0]);
        
        // Clear reason field
        $('#reason').val('');

        // Handle days_of_week
        if (classData.days_of_week && typeof classData.days_of_week === 'object') {
            // Check the checkboxes and create time slots
            for (const day in classData.days_of_week) {
                daySlots.add(day);
                $(`.day-selector[value="${day}"]`).prop('checked', true);
            }
            updateDaySlotsDisplay();
            
            // After slots are created, set the time values
            setTimeout(() => {
                for (const day in classData.days_of_week) {
                    const times = classData.days_of_week[day];
                    const $startSelect = $(`.day-time-input[data-day="${day}"][data-type="start"]`);
                    const $endSelect = $(`.day-time-input[data-day="${day}"][data-type="end"]`);
                    if ($startSelect.length) $startSelect.val(times.start);
                    if ($endSelect.length) $endSelect.val(times.end);
                }
            }, 0);
        }

        // Show modal
        $('#editModal').fadeIn();
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
        $('#class_title').focus();
    }

    function closeEditModal() {
        $('#editModal').fadeOut();
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
        // Clear day slots when modal closes
        daySlots.clear();
        $('.day-selector').prop('checked', false);
        updateDaySlotsDisplay();
    }

    function updateEndDateMin() {
        const startDate = new Date($('#start_date').val());
        const $endDateField = $('#end_date');
        
        if ($('#start_date').val()) {
            startDate.setDate(startDate.getDate() + 1);
            const minEndDate = startDate.toISOString().split('T')[0];
            $endDateField.attr('min', minEndDate);
            
            if ($endDateField.val() && new Date($endDateField.val()) < startDate) {
                $endDateField.val('');
            }
        } else {
            $endDateField.removeAttr('min');
        }
    }

    function validateEndDate() {
        const startDate = new Date($('#start_date').val());
        const endDate = new Date($(this).val());
        
        if (startDate && endDate && endDate < startDate) {
            showError('end_date', "End Date cannot be before Start Date");
            $(this).val('');
        } else {
            $('#end_date_error').hide();
        }
    }

    function showError(fieldId, message) {
        const $errorElement = $(`#${fieldId}_error`);
        $errorElement.text(message);
        $errorElement.show();
        $(`#${fieldId}`).addClass('error');
    }

    function showMessage(message, type = 'success') {
        const $messageContainer = $('#status-message');
        const $messageText = $('#message-text');
        
        $messageText.text(message);
        $messageContainer.removeClass('success danger warning').addClass(type);
        $messageContainer.fadeIn();
        
        // Scroll to message
        $messageContainer[0].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide message after 5 seconds
        setTimeout(() => {
            $messageContainer.fadeOut();
        }, 5000);
    }

    function submitEditRequest() {
        const data = {
            class_id: $('#class_id').val(),
            class_title: $('#class_title').val().trim(),
            school_year: $('#school_year').val().trim(),
            batch: $('#batch').val().trim(),
            instructor_name: $('#instructor_name').val().trim(),
            venue: $('#venue').val().trim(),
            max_students: $('#max_students').val(),
            start_date: $('#start_date').val(),
            end_date: $('#end_date').val(),
            reason: $('#reason').val().trim()
        };

        // Create days_of_week JSON
        const daysData = {};
        let allTimesValid = true;
        
        if (daySlots.size === 0) {
            showError('days_error', 'Please select at least one day');
            allTimesValid = false;
        } else {
            const $dayInputs = $('.day-time-input');
            $dayInputs.each(function() {
                if (!$(this).val()) {
                    allTimesValid = false;
                    $(this).addClass('error');
                } else {
                    $(this).removeClass('error');
                }
            });
            
            if (!allTimesValid) {
                showError('days_error', 'Please provide both start and end times for all selected days');
            } else {
                daySlots.forEach(day => {
                    daysData[day] = {
                        start: $(`.day-time-input[data-day="${day}"][data-type="start"]`).val(),
                        end: $(`.day-time-input[data-day="${day}"][data-type="end"]`).val()
                    };
                });
            }
        }
        
        data.days_of_week = daysData;

        // Clear previous errors
        $('.error-message').hide();
        $('.form-control').removeClass('error');

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
        if (!data.max_students || data.max_students <= 0) {
            showError('max_students', "Max Students must be greater than 0");
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
        if (new Date(data.end_date) < new Date(data.start_date)) {
            showError('end_date', "End Date cannot be before Start Date");
            isValid = false;
        }
        if (!data.reason) {
            showError('reason', "Please provide a reason for editing");
            isValid = false;
        }

        if (!isValid) {
            return;
        }

        // Show loading state
        const $saveBtn = $('#save-btn');
        $saveBtn.addClass('loading');
        $saveBtn.prop('disabled', true);

        // Show loading screen
        $('#loading-screen').fadeIn();

        fetch(window.appUrls.editClassUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(res => {
            if (res.status === 'success') {
                $('#loading-screen').fadeOut();
                showMessage(res.message, 'success');
                closeEditModal();
                setTimeout(() => {
                    location.reload();
                }, 1500);
            } else {
                throw new Error(res.message || 'Unknown error occurred');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            $('#loading-screen').fadeOut();
            showError('reason', error.message || 'An error occurred while submitting your request');
        })
        .finally(() => {
            $saveBtn.removeClass('loading');
            $saveBtn.prop('disabled', false);
        });
    }

    // ===== MOBILE NAVIGATION AND MODAL FUNCTIONS =====
    
    // Mobile Navigation Functionality
    function initMobileNavigation() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const mobileNav = document.getElementById('mobileNav');
        const closeMobileNav = document.getElementById('closeMobileNav');
        
        if (hamburgerMenu && mobileNav) {
            hamburgerMenu.addEventListener('click', function() {
                mobileNav.classList.add('active');
                document.body.style.overflow = 'hidden';
                document.body.classList.add('modal-open');
            });
            
            if (closeMobileNav) {
                closeMobileNav.addEventListener('click', function() {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
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
                    document.body.classList.remove('modal-open');
                });
            });
            
            // Close mobile nav when clicking outside
            document.addEventListener('click', function(e) {
                if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
                }
            });
            
            // Close mobile nav with Escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
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
    
    // Initialize everything
    init();
});