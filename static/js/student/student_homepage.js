$(document).ready(function() {
    // Mobile Navigation Functionality
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

    // Modal Functions
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            document.body.classList.add('modal-open');
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            // Only reset overflow if no other modals are open
            if (!document.querySelector('.modal[style*="display: flex"]')) {
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        }
    }

    // Logout Modal Handling - FIXED VERSION
    const logoutModal = document.getElementById('logout-modal');
    const logoutTrigger = document.getElementById('logout-trigger');
    const mobileLogoutTrigger = document.getElementById('mobile-logout-trigger');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    const closeLogoutModal = document.getElementById('close-logout-modal');

    // Show modal when logout is clicked (desktop)
    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('logout-modal');
        });
    }

    // Show modal when logout is clicked (mobile) - FIXED
    if (mobileLogoutTrigger) {
        mobileLogoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            // First close mobile nav properly
            if (mobileNav) {
                mobileNav.classList.remove('active');
            }
            // Then open logout modal
            setTimeout(() => {
                openModal('logout-modal');
            }, 10);
        });
    }

    // Hide modal when cancel is clicked - FIXED
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Hide modal when close button is clicked
    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    // Handle logout confirmation - FIXED ROUTE
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Get the logout URL from the data attribute
            const logoutUrl = document.body.getAttribute('data-logout-url');
            if (logoutUrl) {
                window.location.href = logoutUrl;
            } else {
                console.error('Logout URL not found');
                // Fallback to a default URL if needed
                window.location.href = "/logout";
            }
        });
    }

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && logoutModal && logoutModal.style.display === 'flex') {
            closeModal('logout-modal');
            // Ensure body overflow is properly reset
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    });

    // Mobile Schedule Accordion
    const mobileScheduleDays = document.querySelectorAll('.mobile-schedule-day');
    mobileScheduleDays.forEach(day => {
        const header = day.querySelector('.mobile-day-header');
        header.addEventListener('click', function() {
            day.classList.toggle('active');
        });
    });

    // Fetch schedule data from the API
    const userId = $('body').data('user-id');
    
    // Fetch user statistics
    fetchUserStatistics(userId);
    
    // Fetch schedule data
    $.ajax({
        url: `/api/schedule/${userId}`,
        method: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.schedule && response.schedule.length > 0) {
                populateSchedule(response.schedule);
                populateMobileSchedule(response.schedule);
            }
        },
        error: function(xhr, status, error) {
            console.error('Error fetching schedule:', error);
        }
    });

    // Verification Notification Handling
    const verificationNotification = document.getElementById('verificationNotification');
    const closeNotificationBtn = document.getElementById('closeNotification');

    if (verificationNotification && closeNotificationBtn) {
        // Show notification with animation
        setTimeout(() => {
            verificationNotification.classList.add('show');
        }, 1000);

        // Close notification when close button is clicked
        closeNotificationBtn.addEventListener('click', function() {
            closeVerificationNotification();
        });

        // Auto-close notification after 15 seconds
        setTimeout(() => {
            if (verificationNotification.classList.contains('show')) {
                closeVerificationNotification();
            }
        }, 15000);

        // Close notification when clicking outside
        verificationNotification.addEventListener('click', function(e) {
            if (e.target === verificationNotification) {
                closeVerificationNotification();
            }
        });
    }

    function closeVerificationNotification() {
        if (verificationNotification) {
            verificationNotification.classList.remove('show');
            verificationNotification.classList.add('hiding');
            
            // Mark notification as seen in the backend
            $.ajax({
                url: '/api/mark_notification_seen',
                method: 'POST',
                success: function(response) {
                    console.log('Notification marked as seen');
                },
                error: function(xhr, status, error) {
                    console.error('Error marking notification as seen:', error);
                }
            });
            
            // Remove from DOM after animation
            setTimeout(() => {
                verificationNotification.style.display = 'none';
            }, 500);
        }
    }

    function fetchUserStatistics(userId) {
        $.ajax({
            url: `/api/user/statistics/${userId}`,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                if (response.success) {
                    $('#enrolledCount').text(response.data.enrolled_courses);
                    $('#pendingCount').text(response.data.pending_courses);
                    $('#completedCount').text(response.data.completed_courses);
                    
                    // If user has enrolled courses, ensure notification doesn't show
                    if (response.data.enrolled_courses > 0) {
                        // Mark notification as seen to prevent future displays
                        $.ajax({
                            url: '/api/mark_notification_seen',
                            method: 'POST',
                            success: function(response) {
                                console.log('Notification marked as seen due to existing enrollment');
                            },
                            error: function(xhr, status, error) {
                                console.error('Error marking notification as seen:', error);
                            }
                        });
                    }
                }
            },
            error: function(xhr, status, error) {
                console.error('Error fetching user statistics:', error);
                // Set default values
                $('#enrolledCount').text('0');
                $('#pendingCount').text('0');
                $('#completedCount').text('0');
            }
        });
    }

    function populateSchedule(classes) {
        // First pass: identify all multi-hour classes
        classes.forEach(function(cls) {
            cls.days.forEach(function(daySchedule) {
                const day = daySchedule.day;
                const startTime = daySchedule.start_time;
                const endTime = daySchedule.end_time;
                
                // Parse time to get hours
                const startParts = startTime.split(':');
                const endParts = endTime.split(':');
                
                const startHour = parseInt(startParts[0]);
                const endHour = parseInt(endParts[0]);
                
                // Calculate duration in hours
                const duration = endHour - startHour;
                
                // Create unique identifier for this class session
                const classSessionId = `${day}-${cls.class_id}-${startTime}-${endTime}`;
                
                // Create class event HTML (only show details in first hour)
                const eventHtml = `
                    <div class="class-event">
                        <div class="time-range">${startTime} - ${endTime}</div>
                        <div class="course-code">${cls.title}</div>
                        <div class="time">${cls.course}</div>
                        <div class="venue">${cls.venue}</div>
                    </div>
                `;
                
                const emptyEventHtml = `
                    <div class="class-event-multi"></div>
                `;
                
                // Mark all hours for this class
                for (let hour = startHour; hour < endHour; hour++) {
                    const cell = $(`#cell-${day}-${hour}`);
                    if (cell.length) {
                        if (hour === startHour) {
                            // First hour - show full details
                            cell.html(eventHtml);
                        } else {
                            // Subsequent hours - show colored background only
                            cell.html(emptyEventHtml);
                        }
                        cell.data('class-session', classSessionId);
                    }
                }
            });
        });
    }

    function populateMobileSchedule(classes) {
        // Group classes by day
        const classesByDay = {
            'Monday': [],
            'Tuesday': [],
            'Wednesday': [],
            'Thursday': [],
            'Friday': [],
            'Saturday': [],
            'Sunday': []
        };

        // Organize classes by day
        classes.forEach(function(cls) {
            cls.days.forEach(function(daySchedule) {
                const day = daySchedule.day;
                if (classesByDay[day]) {
                    classesByDay[day].push({
                        title: cls.title,
                        course: cls.course,
                        venue: cls.venue,
                        start_time: daySchedule.start_time,
                        end_time: daySchedule.end_time
                    });
                }
            });
        });

        // Populate mobile schedule for each day
        Object.keys(classesByDay).forEach(day => {
            const dayElement = $(`#mobile${day}`);
            const scheduleContainer = dayElement.find('.mobile-day-schedule');
            
            if (classesByDay[day].length > 0) {
                classesByDay[day].forEach(classInfo => {
                    const classHtml = `
                        <div class="mobile-class-event">
                            <div class="mobile-class-time">${classInfo.start_time} - ${classInfo.end_time}</div>
                            <div class="mobile-class-title">${classInfo.title}</div>
                            <div class="mobile-class-course">${classInfo.course}</div>
                            <div class="mobile-class-venue">${classInfo.venue}</div>
                        </div>
                    `;
                    scheduleContainer.append(classHtml);
                });
            } else {
                scheduleContainer.html('<div class="mobile-class-event" style="background-color: #f8fafc; color: #94a3b8; text-align: center;">No classes scheduled</div>');
            }
        });
    }

    // Add some interactive effects
    $('.stat-card').hover(
        function() {
            $(this).addClass('stat-card-hover');
        },
        function() {
            $(this).removeClass('stat-card-hover');
        }
    );

    // Add confetti effect for verification notification (optional)
    function showConfetti() {
        if (verificationNotification && verificationNotification.classList.contains('show')) {
            // Simple confetti effect using emojis
            const confettiContainer = document.createElement('div');
            confettiContainer.className = 'confetti-container';
            document.body.appendChild(confettiContainer);

            const emojis = ['🎉', '🎊', '⭐', '✨', '🌟', '💫', '🔥', '💯'];
            
            for (let i = 0; i < 20; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)];
                confetti.style.left = Math.random() * 100 + 'vw';
                confetti.style.animationDelay = Math.random() * 2 + 's';
                confettiContainer.appendChild(confetti);
            }

            // Remove confetti after animation
            setTimeout(() => {
                confettiContainer.remove();
            }, 3000);
        }
    }

    // Show confetti when notification appears
    if (verificationNotification) {
        setTimeout(showConfetti, 1200);
    }
});