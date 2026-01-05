$(document).ready(function() {
    // Mobile Navigation Functionality - YOUR EXISTING CODE
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

    // Modal Functions - YOUR EXISTING CODE
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
            if (!document.querySelector('.modal[style*="display: flex"]')) {
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
        }
    }

    // Logout Modal Handling - YOUR EXISTING CODE
    const logoutModal = document.getElementById('logout-modal');
    const logoutTrigger = document.getElementById('logout-trigger');
    const mobileLogoutTrigger = document.getElementById('mobile-logout-trigger');
    const confirmLogout = document.getElementById('confirm-logout');
    const cancelLogout = document.getElementById('cancel-logout');
    const closeLogoutModal = document.getElementById('close-logout-modal');

    // Logout modal event listeners
    if (logoutTrigger) {
        logoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal('logout-modal');
        });
    }

    if (mobileLogoutTrigger) {
        mobileLogoutTrigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (mobileNav) {
                mobileNav.classList.remove('active');
            }
            setTimeout(() => {
                openModal('logout-modal');
            }, 10);
        });
    }

    if (cancelLogout) {
        cancelLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    if (closeLogoutModal) {
        closeLogoutModal.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        });
    }

    if (confirmLogout) {
        confirmLogout.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const logoutUrl = document.body.getAttribute('data-logout-url');
            if (logoutUrl) {
                window.location.href = logoutUrl;
            } else {
                window.location.href = "/logout";
            }
        });
    }

    // ===== NEW: Final Average Modal Handling =====
    const finalModal = document.getElementById('final-average-modal');
    const closeFinalModal = document.getElementById('close-final-modal');
    const closeFinalBtn = document.getElementById('close-final-btn');
    
    if (closeFinalModal) {
        closeFinalModal.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('final-average-modal');
        });
    }
    
    if (closeFinalBtn) {
        closeFinalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal('final-average-modal');
        });
    }

    // NEW: View Final Average functionality
    function loadFinalAverage(classId) {
        // Show loading state
        $('#final-average-content').html(`
            <div class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading final average...</p>
            </div>
        `);
        
        // Open modal
        openModal('final-average-modal');
        
        // Fetch data from API
        $.ajax({
            url: '/student/get_final_average',
            type: 'GET',
            data: { class_id: classId },
            success: function(response) {
                if (response.success) {
                    // Display the final average
                    $('#final-average-content').html(`
                        <div class="final-average-details">
                            <div class="final-average-header">
                                <div class="average-display">
                                    <div class="average-label">Final Average</div>
                                    <div class="average-value">${response.final_average}</div>
                                </div>
                            </div>
                            <div class="course-details">
                                <div class="detail-item">
                                    <i class="fas fa-book"></i>
                                    <div>
                                        <div class="detail-label">Course</div>
                                        <div class="detail-value">${response.course_title}</div>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-chalkboard-teacher"></i>
                                    <div>
                                        <div class="detail-label">Class</div>
                                        <div class="detail-value">${response.class_title}</div>
                                    </div>
                                </div>
                                <div class="detail-item">
                                    <i class="fas fa-check-circle"></i>
                                    <div>
                                        <div class="detail-label">Remarks</div>
                                        <div class="detail-value competent-value">${response.remarks}</div>
                                    </div>
                                </div>
                            </div>
                            <div class="final-note">
                                <i class="fas fa-info-circle"></i>
                                <p>This is your final average for this completed course. Congratulations!</p>
                            </div>
                        </div>
                    `);
                } else {
                    $('#final-average-content').html(`
                        <div class="error-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Unable to Load Data</h4>
                            <p>${response.message || 'No competent grade found for this class.'}</p>
                        </div>
                    `);
                }
            },
            error: function() {
                $('#final-average-content').html(`
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h4>Error Loading Data</h4>
                        <p>There was an error loading the final average. Please try again.</p>
                    </div>
                `);
            }
        });
    }

    // NEW: Attach event listeners to all "View Final Average" buttons
    $(document).on('click', '.view-final-btn, .btn-view-final', function(e) {
        e.stopPropagation();
        e.preventDefault();
        
        // Get class ID from data attribute
        const classId = $(this).data('class-id');
        
        if (classId) {
            loadFinalAverage(classId);
        }
    });

    // NEW: Add click event for completed course cards
    $(document).on('click', '.completed-course-card', function(e) {
        if (!$(e.target).closest('.view-final-btn').length && 
            !$(e.target).is('.view-final-btn')) {
            const classId = $(this).data('class-id');
            if (classId) {
                loadFinalAverage(classId);
            }
        }
    });

    // YOUR EXISTING: Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === logoutModal) {
            closeModal('logout-modal');
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
        if (event.target === finalModal) {
            closeModal('final-average-modal');
        }
    });

    // YOUR EXISTING: Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (logoutModal && logoutModal.style.display === 'flex') {
                closeModal('logout-modal');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
            }
            if (finalModal && finalModal.style.display === 'flex') {
                closeModal('final-average-modal');
            }
        }
    });

    // YOUR EXISTING: Add grade highlighting
    $('.grade-available').each(function() {
        const grade = $(this).text();
        if (grade !== 'N/A') {
            const gradeNum = parseFloat(grade);
            $(this).css({
                'font-weight': '600',
                'color': gradeNum >= 75 ? '#16a34a' : gradeNum >= 50 ? '#f59e0b' : '#dc2626'
            });
        }
    });

    // NEW: Highlight completed courses card on hover
    $('#completed-courses-card').hover(
        function() {
            $(this).addClass('pulse-effect');
        },
        function() {
            $(this).removeClass('pulse-effect');
        }
    );

    // NEW: Show tooltip for final average
    $('.average-card').hover(
        function() {
            $(this).append('<div class="tooltip">Average of final grades from completed courses</div>');
        },
        function() {
            $(this).find('.tooltip').remove();
        }
    );

    console.log('Student Grades View initialized');
});