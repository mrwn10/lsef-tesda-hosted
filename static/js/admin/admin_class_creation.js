// admin_class_creation.js - Complete Fixed Version with Consistent UI/UX
$(document).ready(function() {
    const createClassUrl = "/admin/class/create";
    
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
    }
    
    // Initialize class creation functionality
    function initClassCreation() {
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

        // Manage day selections and time slots
        const daySelectors = document.querySelectorAll('.day-selector');
        const dayTimeSlots = document.getElementById('dayTimeSlots');
        const daySlots = new Set();

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
                document.querySelector(`.day-selector[value="${day}"]`).checked = false;
                
                // Remove from set and update display
                daySlots.delete(day);
                updateDaySlotsDisplay();
            }
        });

        // Update the day slots display
        function updateDaySlotsDisplay() {
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

        // Time validation for day slots
        dayTimeSlots.addEventListener('change', function(e) {
            if (e.target.classList.contains('day-time-input')) {
                const day = e.target.dataset.day;
                const type = e.target.dataset.type;
                const otherType = type === 'start' ? 'end' : 'start';
                
                const currentTime = e.target.value;
                const otherTimeInput = document.querySelector(`.day-time-input[data-day="${day}"][data-type="${otherType}"]`);
                
                if (currentTime && otherTimeInput.value) {
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

        // Date validation to ensure end date is after start date
        document.getElementById('end_date').addEventListener('change', function() {
            const startDate = new Date(document.getElementById('start_date').value);
            const endDate = new Date(this.value);
            
            if (startDate && endDate && endDate < startDate) {
                showMessage('End date must be after start date', 'error');
                this.value = '';
            }
        });

        // Set minimum end date based on start date
        document.getElementById('start_date').addEventListener('change', function() {
            const startDate = new Date(this.value);
            const endDateField = document.getElementById('end_date');
            
            if (this.value) {
                startDate.setDate(startDate.getDate() + 1);
                const minEndDate = startDate.toISOString().split('T')[0];
                endDateField.min = minEndDate;
                
                if (endDateField.value && new Date(endDateField.value) < startDate) {
                    endDateField.value = '';
                }
            } else {
                endDateField.min = '';
            }
        });

        // Load prerequisites when course is selected
        document.getElementById('course_id').addEventListener('change', function() {
            const courseId = this.value;
            if (courseId) {
                fetch(`/course/prerequisites/${courseId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            document.getElementById('prerequisites').value = data.prerequisites || 'None specified';
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching prerequisites:', error);
                    });
            } else {
                document.getElementById('prerequisites').value = '';
            }
        });

        // Show message function
        function showMessage(message, type = 'success') {
            const messageContainer = document.getElementById('message-container');
            const messageContent = document.getElementById('message-content');
            
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

        // Form submission
        document.getElementById('classCreationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
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
            
            // Validate date range
            const startDate = new Date(document.getElementById('start_date').value);
            const endDate = new Date(document.getElementById('end_date').value);
            
            if (!startDate || !endDate) {
                showMessage('Please provide both start and end dates', 'error');
                return;
            }
            
            if (endDate < startDate) {
                showMessage('End date must be after start date', 'error');
                return;
            }
            
            // Validate instructor name
            const instructorName = document.getElementById('instructor_name').value.trim();
            if (!instructorName) {
                showMessage('Please enter the instructor name', 'error');
                return;
            }
            
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
            document.getElementById('days_of_week').value = JSON.stringify(daysData);
            document.getElementById('schedule').value = scheduleText;
            
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
                    Swal.fire({
                        title: 'Success!',
                        text: data.message,
                        icon: 'success',
                        confirmButtonText: 'OK'
                    }).then(() => {
                        document.getElementById('classCreationForm').reset();
                        daySlots.clear();
                        updateDaySlotsDisplay();
                        document.getElementById('prerequisites').value = '';
                    });
                } else {
                    showMessage(data.message, 'error');
                }
            })
            .catch(error => {
                showMessage('Error creating class. Please try again.', 'error');
                console.error('Error:', error);
            })
            .finally(() => {
                document.getElementById('classCreationForm').classList.remove('loading');
            });
        });
    }
    
    // Initialize everything
    init();
});