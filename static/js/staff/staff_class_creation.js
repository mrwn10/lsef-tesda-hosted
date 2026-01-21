// staff_class_creation.js - Enhanced with Simple Batch Numbers
$(document).ready(function() {
    const createClassUrl = "/class/create";
    
    // Initialize all functionality
    function init() {
        initMobileNavigation();
        initModals();
        initClassCreation();
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
                document.body.classList.add('modal-open');
            });
            
            if (closeMobileNav) {
                closeMobileNav.addEventListener('click', function() {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
                });
            }
            
            // Close mobile nav when clicking on links
            const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
            mobileNavLinks.forEach(link => {
                link.addEventListener('click', function() {
                    mobileNav.classList.remove('active');
                    document.body.style.overflow = '';
                    document.body.classList.remove('modal-open');
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
    }
    
    // Initialize class creation functionality
    function initClassCreation() {
        // Check if instructor name exists
        const instructorNameField = document.getElementById('instructor_name');
        const instructorNameDisplay = document.getElementById('instructor_name_display');
        
        if (instructorNameField && !instructorNameField.value.trim()) {
            showMessage('Please complete your profile to get your instructor name. You cannot create a class without a valid instructor name.', 'error', true);
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
                            <label for="${day.toLowerCase()}-start">Start Time <span class="required">*</span></label>
                            <div class="input-with-icon">
                                <i class="fas fa-clock"></i>
                                <select class="day-time-input" id="${day.toLowerCase()}-start" data-day="${day}" data-type="start" required>
                                    <option value="" disabled selected>Select start time</option>
                                    ${generateTimeOptions()}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="${day.toLowerCase()}-end">End Time <span class="required">*</span></label>
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

        // Calculate school year from dates
        function calculateSchoolYear(startDate, endDate) {
            const startYear = startDate.getFullYear();
            const endYear = endDate.getFullYear();
            
            if (endYear > startYear) {
                return `${startYear}-${endYear}`;
            } else {
                return `${startYear}-${startYear}`;
            }
        }

        // Format date for short display (e.g., "Jan 2025")
        function formatShortMonthYear(date) {
            return date.toLocaleString('en-US', { 
                month: 'short', 
                year: 'numeric' 
            });
        }

        // Calculate months between dates
        function calculateMonthsBetween(startDate, endDate) {
            let totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12;
            totalMonths += endDate.getMonth() - startDate.getMonth();
            totalMonths += 1; // Include both start and end months
            
            return Math.max(1, totalMonths); // At least 1 month
        }

        // Format duration in human-readable years and months
        function formatDuration(totalMonths) {
            if (totalMonths < 12) {
                return `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`;
            } else {
                const years = Math.floor(totalMonths / 12);
                const months = totalMonths % 12;
                
                if (months === 0) {
                    return `${years} year${years !== 1 ? 's' : ''}`;
                } else if (months === 1) {
                    return `${years} year${years !== 1 ? 's' : ''} and 1 month`;
                } else {
                    return `${years} year${years !== 1 ? 's' : ''} and ${months} months`;
                }
            }
        }

        // Update date information display
        function updateDateInfoDisplay(startDate, endDate) {
            const dateInfoDisplay = document.getElementById('dateInfoDisplay');
            const schoolYearDisplay = document.getElementById('schoolYearDisplay');
            const schedulePeriodDisplay = document.getElementById('schedulePeriodDisplay');
            const durationDisplay = document.getElementById('durationDisplay');
            const schoolYearHidden = document.getElementById('school_year');
            
            if (!startDate || !endDate) {
                if (dateInfoDisplay) {
                    dateInfoDisplay.classList.remove('show');
                }
                return;
            }
            
            // Calculate values
            const schoolYear = calculateSchoolYear(startDate, endDate);
            const totalMonths = calculateMonthsBetween(startDate, endDate);
            const durationText = formatDuration(totalMonths);
            
            // Update displays
            if (schoolYearDisplay) {
                schoolYearDisplay.textContent = schoolYear;
            }
            if (schoolYearHidden) {
                schoolYearHidden.value = schoolYear;
            }
            
            if (schedulePeriodDisplay) {
                schedulePeriodDisplay.textContent = `${formatShortMonthYear(startDate)} to ${formatShortMonthYear(endDate)}`;
            }
            if (durationDisplay) {
                durationDisplay.textContent = durationText;
            }
            
            // Show the display
            if (dateInfoDisplay) {
                dateInfoDisplay.classList.add('show');
            }
        }

        // Update batch field when course is selected
        function updateBatchField() {
            const courseId = document.getElementById('course_id').value;
            const batchField = document.getElementById('batch');
            
            if (!batchField) return;
            
            if (courseId) {
                // Simple placeholder
                batchField.value = "Will be generated (1, 2, 3...)";
                batchField.classList.add('batch-preview');
            } else {
                batchField.value = "Select a course first";
                batchField.classList.remove('batch-preview');
            }
        }

        // Validate dates are within school year and not in the past
        function validateDates() {
            const startDateInput = document.getElementById('start_date');
            const endDateInput = document.getElementById('end_date');
            
            if (!startDateInput || !endDateInput) return true;
            
            if (!startDateInput.value || !endDateInput.value) {
                return true; // Let form validation handle empty fields
            }
            
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0); // Reset time part for comparison
            
            // 1. Check if end date is after start date
            if (endDate <= startDate) {
                showMessage('End date must be after start date', 'error');
                endDateInput.focus();
                endDateInput.classList.add('date-error');
                return false;
            }
            
            // 2. Check if end date is in the past
            if (endDate < currentDate) {
                showMessage(`End date (${endDateInput.value}) is in the past. Cannot create a class that has already ended.`, 'error');
                endDateInput.focus();
                endDateInput.classList.add('date-error');
                return false;
            }
            
            // Clear error styling if valid
            endDateInput.classList.remove('date-error');
            return true;
        }

        // Update end date min based on start date
        function updateEndDateMin() {
            const startDateInput = document.getElementById('start_date');
            const endDateInput = document.getElementById('end_date');
            
            if (!startDateInput || !endDateInput) return;
            
            if (startDateInput.value) {
                const startDate = new Date(startDateInput.value);
                const minEndDate = new Date(startDate);
                minEndDate.setDate(startDate.getDate() + 1); // At least 1 day after start
                
                // Format for input[type="date"]
                const minDateStr = minEndDate.toISOString().split('T')[0];
                endDateInput.min = minDateStr;
                
                // If current end date is before min, clear it
                if (endDateInput.value && new Date(endDateInput.value) <= startDate) {
                    endDateInput.value = '';
                    showMessage('End date must be after start date', 'warning');
                }
            }
        }

        // Show message function
        function showMessage(message, type = 'success', permanent = false) {
            const messageContainer = document.getElementById('message-container');
            const messageContent = document.getElementById('message-content');
            
            if (!messageContainer || !messageContent) return;
            
            messageContent.textContent = message;
            messageContent.className = 'message ' + type;
            messageContainer.style.display = 'block';
            
            // Scroll to message
            messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
            // Hide message after 5 seconds unless permanent
            if (!permanent) {
                setTimeout(() => {
                    messageContainer.style.display = 'none';
                }, 5000);
            }
        }

        // Initialize date validation
        function initDateValidation() {
            const startDateInput = document.getElementById('start_date');
            const endDateInput = document.getElementById('end_date');
            
            if (!startDateInput || !endDateInput) return;
            
            // Update end date min when start date changes
            startDateInput.addEventListener('change', function() {
                updateEndDateMin();
                if (this.value && endDateInput.value) {
                    validateDates();
                    updateDateInfoDisplay(new Date(this.value), new Date(endDateInput.value));
                }
            });
            
            // Update display when dates change
            endDateInput.addEventListener('change', function() {
                if (startDateInput.value && this.value) {
                    validateDates();
                    updateDateInfoDisplay(new Date(startDateInput.value), new Date(this.value));
                }
            });
            
            // Real-time update for date info display
            [startDateInput, endDateInput].forEach(input => {
                input.addEventListener('input', function() {
                    if (startDateInput.value && endDateInput.value) {
                        const startDate = new Date(startDateInput.value);
                        const endDate = new Date(endDateInput.value);
                        if (endDate > startDate) {
                            updateDateInfoDisplay(startDate, endDate);
                        }
                    }
                });
            });
            
            // Set minimum start date to today
            const today = new Date().toISOString().split('T')[0];
            startDateInput.min = today;
        }

        // Manage day selections and time slots
        const daySelectors = document.querySelectorAll('.day-selector');
        const dayTimeSlots = document.getElementById('dayTimeSlots');
        const daySlots = new Set();

        if (daySelectors.length > 0) {
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
        }

        // Handle remove day button clicks
        if (dayTimeSlots) {
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
        }

        // Update the day slots display
        function updateDaySlotsDisplay() {
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
            
            // Sort days in order
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

        // Time validation for day slots
        if (dayTimeSlots) {
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

        // Load prerequisites when course is selected
        const courseSelect = document.getElementById('course_id');
        if (courseSelect) {
            courseSelect.addEventListener('change', function() {
                const courseId = this.value;
                const prerequisitesField = document.getElementById('prerequisites');
                
                if (!prerequisitesField) return;
                
                if (courseId) {
                    // Show loading message
                    prerequisitesField.value = 'Loading prerequisites...';
                    
                    // Try multiple URL patterns to find the correct one
                    const urlPatterns = [
                        `/course/prerequisites/${courseId}`,
                        `/staff/course/prerequisites/${courseId}`,
                        `/class/course/prerequisites/${courseId}`
                    ];
                    
                    console.log('Trying to fetch prerequisites for course:', courseId);
                    
                    let fetchAttempts = 0;
                    const maxAttempts = urlPatterns.length;
                    
                    function tryFetch(index) {
                        if (index >= maxAttempts) {
                            prerequisitesField.value = 'Error: Could not load prerequisites. Please try again.';
                            console.error('All fetch attempts failed');
                            return;
                        }
                        
                        const url = urlPatterns[index];
                        console.log(`Attempt ${index + 1}: Fetching from ${url}`);
                        
                        fetch(url)
                            .then(response => {
                                console.log(`Attempt ${index + 1}: Response status:`, response.status);
                                if (!response.ok) {
                                    throw new Error(`HTTP ${response.status}`);
                                }
                                return response.json();
                            })
                            .then(data => {
                                console.log(`Attempt ${index + 1}: Success! Data:`, data);
                                if (data.status === 'success') {
                                    prerequisitesField.value = data.prerequisites || 'No prerequisites specified.';
                                    console.log('Prerequisites loaded successfully');
                                } else {
                                    prerequisitesField.value = `Error: ${data.message}`;
                                    console.error('Server returned error:', data.message);
                                }
                            })
                            .catch(error => {
                                console.log(`Attempt ${index + 1}: Failed - ${error.message}`);
                                // Try next URL
                                tryFetch(index + 1);
                            });
                    }
                    
                    // Start trying URLs
                    tryFetch(0);
                } else {
                    prerequisitesField.value = '';
                }
                
                // Update batch field
                updateBatchField();
            });
        }

        // Form reset handler
        const resetBtn = document.querySelector('.reset-btn');
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                // Reset day slots
                daySlots.clear();
                updateDaySlotsDisplay();
                
                // Reset date info display
                const dateInfoDisplay = document.getElementById('dateInfoDisplay');
                if (dateInfoDisplay) {
                    dateInfoDisplay.classList.remove('show');
                }
                
                const schoolYearHidden = document.getElementById('school_year');
                if (schoolYearHidden) {
                    schoolYearHidden.value = '';
                }
                
                const batchField = document.getElementById('batch');
                if (batchField) {
                    batchField.value = 'Will be generated (1, 2, 3...)';
                    batchField.classList.remove('batch-preview');
                }
                
                const prerequisitesField = document.getElementById('prerequisites');
                if (prerequisitesField) {
                    prerequisitesField.value = '';
                }
                
                // Keep instructor name if exists
                const instructorName = document.getElementById('instructor_name');
                const instructorNameDisplay = document.getElementById('instructor_name_display');
                if (instructorName && instructorNameDisplay && instructorName.value.trim()) {
                    instructorNameDisplay.value = instructorName.value;
                }
            });
        }

        // Form submission
        const form = document.getElementById('classCreationForm');
        if (form) {
            form.addEventListener('submit', function(e) {
                e.preventDefault();
                
                // Check instructor name first
                const instructorName = instructorNameField ? instructorNameField.value.trim() : '';
                if (!instructorName) {
                    showMessage('Cannot create class: Instructor name not found. Please complete your profile first.', 'error');
                    return;
                }
                
                // Validate at least one day is selected
                if (daySlots.size === 0) {
                    showMessage('Please select at least one day', 'error');
                    return;
                }
                
                // Validate all day slots have times
                let allTimesValid = true;
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
                    showMessage('Please provide both start and end times for all selected days', 'error');
                    return;
                }
                
                // Date validation
                if (!validateDates()) {
                    return;
                }
                
                // Submit form
                submitFormData();
            });
        }
        
        // Function to handle actual form submission
        function submitFormData() {
            // Create days_of_week JSON and schedule text
            const daysData = {};
            let scheduleText = '';
            
            Array.from(daySlots).forEach(day => {
                const startTime = document.querySelector(`.day-time-input[data-day="${day}"][data-type="start"]`).value;
                const endTime = document.querySelector(`.day-time-input[data-day="${day}"][data-type="end"]`).value;
                
                daysData[day] = {
                    start: startTime,
                    end: endTime
                };
                
                // Format time for display (convert 24h to 12h)
                const startHour = parseInt(startTime.split(':')[0]);
                const endHour = parseInt(endTime.split(':')[0]);
                
                const startAmPm = startHour >= 12 ? 'PM' : 'AM';
                const endAmPm = endHour >= 12 ? 'PM' : 'AM';
                
                const startHour12 = startHour % 12 || 12;
                const endHour12 = endHour % 12 || 12;
                
                if (scheduleText) scheduleText += ", ";
                scheduleText += `${day} ${startHour12}:00 ${startAmPm}-${endHour12}:00 ${endAmPm}`;
            });
            
            // Set the hidden field values
            const daysOfWeekField = document.getElementById('days_of_week');
            const scheduleField = document.getElementById('schedule');
            
            if (daysOfWeekField) {
                daysOfWeekField.value = JSON.stringify(daysData);
            }
            if (scheduleField) {
                scheduleField.value = scheduleText;
            }
            
            // Create form data
            const formData = new FormData(document.getElementById('classCreationForm'));
            
            // Show loading state
            document.getElementById('classCreationForm').classList.add('loading');
            
            // Submit the form
            fetch(createClassUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const startDate = new Date(data.start_date);
                    const endDate = new Date(data.end_date);
                    const totalMonths = calculateMonthsBetween(startDate, endDate);
                    const durationText = formatDuration(totalMonths);
                    
                    console.log('Class created successfully. Batch:', data.batch);
                    
                    Swal.fire({
                        title: 'Success!',
                        html: `<p>${data.message}</p>
                               <div class="batch-info">
                                   <p><strong>Course:</strong> ${document.getElementById('class_title').value}</p>
                                   <p><strong>Batch:</strong> ${data.batch}</p>
                                   <p><strong>School Year:</strong> ${data.school_year}</p>
                                   <p><strong>Schedule Period:</strong> ${formatShortMonthYear(startDate)} to ${formatShortMonthYear(endDate)}</p>
                                   <p><strong>Duration:</strong> ${durationText}</p>
                               </div>
                               <div class="staff-note-alert">
                                   <p><i class="fas fa-clock"></i> This class is now <strong>PENDING</strong> and requires admin approval before activation.</p>
                               </div>`,
                        icon: 'success',
                        confirmButtonText: 'OK',
                        confirmButtonColor: '#003366'
                    }).then(() => {
                        // Reset form
                        document.getElementById('classCreationForm').reset();
                        daySlots.clear();
                        updateDaySlotsDisplay();
                        
                        const prerequisitesField = document.getElementById('prerequisites');
                        if (prerequisitesField) {
                            prerequisitesField.value = '';
                        }
                        
                        const dateInfoDisplay = document.getElementById('dateInfoDisplay');
                        if (dateInfoDisplay) {
                            dateInfoDisplay.classList.remove('show');
                        }
                        
                        const batchField = document.getElementById('batch');
                        if (batchField) {
                            batchField.value = 'Will be generated (1, 2, 3...)';
                            batchField.classList.remove('batch-preview');
                        }
                        
                        // Keep instructor name
                        if (instructorNameDisplay && instructorNameField.value.trim()) {
                            instructorNameDisplay.value = instructorNameField.value;
                        }
                    });
                } else {
                    showMessage(data.message, 'error');
                    
                    // Handle redirect for profile completion
                    if (data.redirect) {
                        Swal.fire({
                            title: 'Action Required',
                            text: data.message,
                            icon: 'warning',
                            confirmButtonText: 'Go to Profile',
                            confirmButtonColor: '#003366'
                        }).then(() => {
                            window.location.href = data.redirect;
                        });
                    } else {
                        Swal.fire({
                            title: 'Error!',
                            text: data.message,
                            icon: 'error',
                            confirmButtonText: 'OK',
                            confirmButtonColor: '#800000'
                        });
                    }
                }
            })
            .catch(error => {
                showMessage('Error creating class. Please try again.', 'error');
                console.error('Error:', error);
                Swal.fire({
                    title: 'Error!',
                    text: 'Error creating class. Please try again.',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#800000'
                });
            })
            .finally(() => {
                const form = document.getElementById('classCreationForm');
                if (form) {
                    form.classList.remove('loading');
                }
            });
        }
        
        // Force maximum students to 25 and disable input
        const maxStudentsInput = document.getElementById('max_students');
        if (maxStudentsInput) {
            // Set fixed value and disable input
            maxStudentsInput.value = 25;
            maxStudentsInput.readOnly = true;
            
            // Additional protection - reset to 25 if value changes
            maxStudentsInput.addEventListener('input', function() {
                if (this.value !== '25') {
                    this.value = 25;
                    showMessage('Maximum students is fixed at 25', 'info');
                }
            });
            
            // Also handle change event for additional protection
            maxStudentsInput.addEventListener('change', function() {
                this.value = 25;
            });
        }
        
        // Initialize date validation
        initDateValidation();
        
        // Initial update of batch field
        updateBatchField();
    }
    
    // Initialize everything
    init();
});