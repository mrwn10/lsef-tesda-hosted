$(document).ready(function() {
    // Initialize all functionality
    init();
});

// Initialize all functionality
function init() {
    initMobileNavigation();
    initModals();
    initializeMaterialForm();
    initializeEditForms();
    setupFormValidation();
    setupDateConstraints();
    initializeFiltering();
    setupGlobalAnnouncementFeatures();
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

// Initialize modal functionality - CONSISTENT WITH OTHER PAGES
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

    // Logout Modal - CONSISTENT WITH OTHER PAGES
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

    // Close all modals when clicking close buttons
    $('.close-modal').click(function() {
        closeAllModals();
    });

    // Close flash messages
    $('.flash-close').click(function() {
        $(this).closest('.flash-message').fadeOut(300, function() {
            $(this).remove();
        });
    });
}

// Material Form Functionality
function initializeMaterialForm() {
    const typeSelect = document.getElementById('type-select');
    const submissionDates = document.getElementById('submission-dates');
    const datesMessage = document.getElementById('dates-message');
    const classSelect = document.getElementById('class-select');
    
    if (typeSelect && submissionDates) {
        typeSelect.addEventListener('change', function() {
            handleTypeChange(this.value, submissionDates, datesMessage, classSelect);
        });
        
        // Initialize on page load
        handleTypeChange(typeSelect.value, submissionDates, datesMessage, classSelect);
    }

    // Handle class selection changes for global announcements
    if (classSelect) {
        classSelect.addEventListener('change', function() {
            handleClassSelection(this.value, typeSelect.value);
        });
    }
}

function handleTypeChange(type, submissionDates, datesMessage, classSelect) {
    if (type === 'classwork') {
        submissionDates.style.display = 'block';
        datesMessage.textContent = 'Set the submission period for this classwork. Dates are required.';
        setDefaultSubmissionDates();
        
        // Show additional info for global classwork
        if (classSelect && classSelect.value === 'all') {
            datesMessage.textContent += ' This will be available to all students across all classes.';
        }
    } else if (type === 'announcement') {
        submissionDates.style.display = 'block';
        if (classSelect && classSelect.value === 'all') {
            datesMessage.textContent = 'This global announcement will be visible to all students and instructors. Dates are optional.';
        } else {
            datesMessage.textContent = 'Optional: Set dates when this announcement should be visible to students.';
        }
        clearSubmissionDates();
    } else {
        submissionDates.style.display = 'none';
    }
}

function handleClassSelection(classValue, currentType) {
    const datesMessage = document.getElementById('dates-message');
    if (!datesMessage) return;

    if (classValue === 'all') {
        if (currentType === 'classwork') {
            datesMessage.textContent = 'Set the submission period for this classwork. This will be available to all students across all classes.';
        } else if (currentType === 'announcement') {
            datesMessage.textContent = 'This global announcement will be visible to all students and instructors. Dates are optional.';
        }
    } else {
        if (currentType === 'classwork') {
            datesMessage.textContent = 'Set the submission period for this classwork. Dates are required.';
        } else if (currentType === 'announcement') {
            datesMessage.textContent = 'Optional: Set dates when this announcement should be visible to students.';
        }
    }
}

function setupGlobalAnnouncementFeatures() {
    // Add visual indicators for global announcements
    const globalOptions = document.querySelectorAll('option[value="all"]');
    globalOptions.forEach(option => {
        if (!option.parentElement.querySelector('.global-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'badge bg-primary ms-2 global-indicator';
            indicator.textContent = 'Global';
            option.parentElement.appendChild(indicator);
        }
    });
}

function initializeEditForms() {
    document.querySelectorAll('.type-select-edit').forEach(select => {
        select.addEventListener('change', function() {
            const form = this.closest('.edit-material-form');
            const submissionDates = form.querySelector('.edit-submission-dates');
            const classSelect = form.querySelector('select[name="class_id"]');
            
            if (this.value === 'classwork') {
                submissionDates.style.display = 'block';
                // Update message for global classwork
                if (classSelect && classSelect.value === 'all') {
                    const datesMessage = form.querySelector('.edit-submission-dates .dates-info');
                    if (datesMessage) {
                        datesMessage.querySelector('p').textContent = 'This classwork will be available to all students across all classes.';
                    }
                }
            } else {
                submissionDates.style.display = 'none';
            }
        });
    });

    // Handle class selection changes in edit forms
    document.querySelectorAll('.edit-material-form select[name="class_id"]').forEach(select => {
        select.addEventListener('change', function() {
            const form = this.closest('.edit-material-form');
            const typeSelect = form.querySelector('.type-select-edit');
            handleClassSelection(this.value, typeSelect ? typeSelect.value : '');
        });
    });
}

function setupFormValidation() {
    const materialForm = document.getElementById('material-form');
    if (materialForm) {
        materialForm.addEventListener('submit', function(e) {
            const typeSelect = document.getElementById('type-select');
            const classSelect = document.getElementById('class-select');
            
            if (typeSelect.value === 'classwork') {
                if (!validateClassworkDates()) {
                    e.preventDefault();
                    return false;
                }
                
                // Additional validation for global classwork
                if (classSelect && classSelect.value === 'all') {
                    if (!confirm('This classwork will be available to ALL students across ALL classes. Are you sure you want to continue?')) {
                        e.preventDefault();
                        return false;
                    }
                }
            }
            
            // Validation for global announcements
            if (typeSelect.value === 'announcement' && classSelect && classSelect.value === 'all') {
                if (!confirm('This announcement will be visible to ALL students and instructors. Are you sure you want to continue?')) {
                    e.preventDefault();
                    return false;
                }
            }
            
            // Show loading state
            $(this).addClass('loading');
            $('.save-btn').html('<i class="fas fa-spinner fa-spin"></i> Uploading...').prop('disabled', true);
            
            return true;
        });
    }
    
    document.querySelectorAll('.edit-material-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            const typeSelect = this.querySelector('.type-select-edit');
            const classSelect = this.querySelector('select[name="class_id"]');
            
            if (typeSelect && typeSelect.value === 'classwork') {
                if (!validateClassworkDates(this)) {
                    e.preventDefault();
                    return false;
                }
                
                // Additional validation for global classwork in edit
                if (classSelect && classSelect.value === 'all') {
                    if (!confirm('This classwork will be available to ALL students across ALL classes. Are you sure you want to continue?')) {
                        e.preventDefault();
                        return false;
                    }
                }
            }
            
            // Validation for global announcements in edit
            if (typeSelect && typeSelect.value === 'announcement' && classSelect && classSelect.value === 'all') {
                if (!confirm('This announcement will be visible to ALL students and instructors. Are you sure you want to continue?')) {
                    e.preventDefault();
                    return false;
                }
            }
            
            // Show loading state
            $(this).closest('.materials-form').addClass('loading');
            $(this).find('.save-btn').html('<i class="fas fa-spinner fa-spin"></i> Saving...').prop('disabled', true);
            
            return true;
        });
    });
}

function validateClassworkDates(form = null) {
    let submissionStart, submissionEnd;
    
    if (form) {
        // For edit forms
        submissionStart = form.querySelector('input[name="submission_start"]');
        submissionEnd = form.querySelector('input[name="submission_end"]');
    } else {
        // For new material form
        submissionStart = document.getElementById('submission-start');
        submissionEnd = document.getElementById('submission-end');
    }
    
    if (!submissionStart || !submissionEnd) {
        return true; // If elements don't exist, skip validation
    }
    
    if (!submissionStart.value || !submissionEnd.value) {
        Swal.fire({
            icon: 'error',
            title: 'Missing Dates',
            text: 'Please provide both submission start and end dates for classwork.',
            confirmButtonColor: '#007bff'
        });
        return false;
    }
    
    const start = new Date(submissionStart.value);
    const end = new Date(submissionEnd.value);
    
    if (end <= start) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Dates',
            text: 'Submission end date must be after start date.',
            confirmButtonColor: '#007bff'
        });
        return false;
    }
    
    // Check if start date is in the past
    const now = new Date();
    if (start < now) {
        const result = confirm('The submission start date is in the past. Are you sure you want to continue?');
        if (!result) {
            return false;
        }
    }
    
    return true;
}

function setupDateConstraints() {
    const startInput = document.getElementById('submission-start');
    const endInput = document.getElementById('submission-end');
    
    if (startInput && endInput) {
        startInput.addEventListener('change', function() {
            endInput.min = this.value;
            
            // If end date is before new start date, clear it
            if (endInput.value && endInput.value < this.value) {
                endInput.value = '';
            }
        });
    }
}

function setDefaultSubmissionDates() {
    const now = new Date();
    const startDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
    
    const startInput = document.getElementById('submission-start');
    const endInput = document.getElementById('submission-end');
    
    if (startInput && !startInput.value) {
        startInput.value = formatDateTimeLocal(startDate);
    }
    if (endInput && !endInput.value) {
        endInput.value = formatDateTimeLocal(endDate);
        if (startInput && startInput.value) {
            endInput.min = startInput.value;
        }
    }
}

function clearSubmissionDates() {
    const startInput = document.getElementById('submission-start');
    const endInput = document.getElementById('submission-end');
    
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';
}

// Helper function to format date for datetime-local input
function formatDateTimeLocal(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Filtering functionality with global announcements support
function initializeFiltering() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter-type]');
    const classFilter = document.getElementById('class-filter');
    const clearFiltersBtn = document.getElementById('clear-filters');
    
    if (filterButtons.length > 0) {
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                applyFilters();
            });
        });
    }
    
    if (classFilter) {
        classFilter.addEventListener('change', applyFilters);
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

function applyFilters() {
    const activeTypeFilter = document.querySelector('.filter-btn.active[data-filter-type]');
    const typeFilterValue = activeTypeFilter ? activeTypeFilter.dataset.filterType : 'all';
    const classFilter = document.getElementById('class-filter');
    const classFilterValue = classFilter ? classFilter.value : 'all';
    
    const materialCards = document.querySelectorAll('.material-card');
    let visibleCount = 0;
    
    materialCards.forEach(card => {
        const cardType = card.dataset.materialType;
        const cardClassId = card.dataset.classId;
        
        const typeMatch = typeFilterValue === 'all' || cardType === typeFilterValue;
        const classMatch = classFilterValue === 'all' || 
                          (classFilterValue === 'global' && cardClassId === 'global') ||
                          cardClassId === classFilterValue;
        
        if (typeMatch && classMatch) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });
    
    // Show/hide no results message
    const noResults = document.getElementById('no-results');
    if (noResults) {
        if (visibleCount === 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }
}

function clearFilters() {
    // Reset type filter
    const filterButtons = document.querySelectorAll('.filter-btn[data-filter-type]');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filterType === 'all') {
            btn.classList.add('active');
        }
    });
    
    // Reset class filter
    const classFilter = document.getElementById('class-filter');
    if (classFilter) {
        classFilter.value = 'all';
    }
    
    // Apply cleared filters
    applyFilters();
}

// Global functions for template
function togglePreview(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = (el.style.display === "none" || el.style.display === "") ? "block" : "none";
    }
}

function toggleEdit(id) {
    const el = document.getElementById(id);
    if (el) {
        el.style.display = (el.style.display === "none" || el.style.display === "") ? "block" : "none";
    }
}

function confirmDelete() {
    return confirm('Are you sure you want to delete this material?');
}

// Unified Modal Handling
function showMessage(type, text) {
    // Hide all modals first
    $('.modal').fadeOut();
    
    switch(type) {
        case 'success':
            $('#success-message').text(text);
            $('#success-modal').fadeIn();
            break;
        case 'error':
            $('#error-message').text(text);
            $('#error-modal').fadeIn();
            break;
        case 'info':
            $('#info-message').text(text);
            $('#info-modal').fadeIn();
            break;
    }
}