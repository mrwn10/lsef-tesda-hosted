// staff_material.js - COMPLETELY FIXED VERSION WITH AUTO-REFRESH

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functions
    initMobileNavigation();
    initModals();
    initSweetAlerts();
    setupFormSubmission();
    setupDateConstraints();
    setupFilters();
    setupDeleteButtons();
    setupEditButtons();
    setupPreviewButtons();
    setupDownloadNotifications();
    setupCancelEdit();
    checkFlashMessages();
    
    // Set default dates
    setDefaultSubmissionDates();
});

// ==================== SWEETALERT2 FUNCTIONS ====================

function initSweetAlerts() {
    window.toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
}

function showSuccessToast(message) {
    if (window.toast) {
        window.toast.fire({ icon: 'success', title: message });
    } else {
        Swal.fire({ icon: 'success', title: message, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
}

function showErrorToast(message) {
    if (window.toast) {
        window.toast.fire({ icon: 'error', title: message });
    } else {
        Swal.fire({ icon: 'error', title: message, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
}

function showWarningToast(message) {
    if (window.toast) {
        window.toast.fire({ icon: 'warning', title: message });
    } else {
        Swal.fire({ icon: 'warning', title: message, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
}

function showInfoToast(message) {
    if (window.toast) {
        window.toast.fire({ icon: 'info', title: message });
    } else {
        Swal.fire({ icon: 'info', title: message, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    }
}

function showSuccessModal(message) {
    return Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: message,
        confirmButtonColor: '#003366'
    });
}

function showErrorModal(message) {
    return Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonColor: '#003366'
    });
}

function showConfirmation(title, text) {
    return Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#003366',
        cancelButtonColor: '#800000',
        confirmButtonText: 'Yes, proceed!',
        cancelButtonText: 'Cancel'
    });
}

function showLoading(message) {
    Swal.fire({
        title: 'Processing...',
        text: message || 'Please wait',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });
}

function closeLoading() {
    Swal.close();
}

// ==================== FLASH MESSAGES ====================

function checkFlashMessages() {
    // Check for flash messages in the hidden container
    const flashMessages = document.querySelectorAll('#flash-messages-container .flash-message');
    
    if (flashMessages.length > 0) {
        flashMessages.forEach(function(msg) {
            const category = msg.getAttribute('data-category');
            const message = msg.getAttribute('data-message');
            
            if (category === 'success') {
                showSuccessToast(message);
            } else if (category === 'error') {
                showErrorToast(message);
            } else if (category === 'warning') {
                showWarningToast(message);
            } else {
                showInfoToast(message);
            }
        });
    }
}

// ==================== MOBILE NAVIGATION ====================

function initMobileNavigation() {
    const hamburger = document.getElementById('hamburgerMenu');
    const mobileNav = document.getElementById('mobileNav');
    const closeBtn = document.getElementById('closeMobileNav');
    
    if (!hamburger || !mobileNav) return;
    
    hamburger.addEventListener('click', function() {
        mobileNav.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    }
    
    // Expandable sections
    const headers = document.querySelectorAll('.mobile-nav-header-link');
    headers.forEach(function(header) {
        header.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            const submenu = document.getElementById(section + '-submenu');
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
    
    // Close on link click
    const links = document.querySelectorAll('.mobile-nav-links a');
    links.forEach(function(link) {
        link.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        });
    });
    
    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ==================== LOGOUT MODAL ====================

function initModals() {
    function closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(function(modal) {
            modal.style.display = 'none';
        });
        document.body.style.overflow = '';
    }

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    // Logout triggers
    const logoutTriggers = document.querySelectorAll('#logout-trigger, #mobile-logout-trigger');
    logoutTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.id === 'mobile-logout-trigger') {
                const mobileNav = document.getElementById('mobileNav');
                if (mobileNav) {
                    mobileNav.classList.remove('active');
                }
                setTimeout(function() {
                    openModal('logout-modal');
                }, 10);
            } else {
                openModal('logout-modal');
            }
        });
    });
    
    const cancelLogout = document.getElementById('cancel-logout');
    if (cancelLogout) {
        cancelLogout.addEventListener('click', closeAllModals);
    }
    
    const closeLogout = document.getElementById('close-logout-modal');
    if (closeLogout) {
        closeLogout.addEventListener('click', closeAllModals);
    }
    
    const confirmLogout = document.getElementById('confirm-logout');
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function() {
            const logoutUrl = document.getElementById('app-data')?.dataset.logoutUrl || '/logout';
            window.location.href = logoutUrl;
        });
    }
    
    // Close on overlay click
    const modals = document.querySelectorAll('.modal');
    modals.forEach(function(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
}

// ==================== FORM SUBMISSION ====================

function setupFormSubmission() {
    const form = document.getElementById('material-form');
    if (!form) return;
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!validateForm()) return;
        
        const isEdit = document.getElementById('edit-material-id').value;
        const title = isEdit ? 'Update Classwork' : 'Create Classwork';
        const text = isEdit ? 'Are you sure you want to update this classwork?' : 'Are you sure you want to create this classwork?';
        
        showConfirmation(title, text).then(function(result) {
            if (result.isConfirmed) {
                submitForm(form);
            }
        });
    });
}

function validateForm() {
    const titleInput = document.getElementById('title-input');
    const classSelect = document.getElementById('class-select');
    const startInput = document.getElementById('submission-start');
    const endInput = document.getElementById('submission-end');
    const fileInput = document.getElementById('file-input');
    
    const title = titleInput ? titleInput.value.trim() : '';
    const classId = classSelect ? classSelect.value : '';
    const start = startInput ? startInput.value : '';
    const end = endInput ? endInput.value : '';
    const file = fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null;
    
    if (!title) {
        showErrorToast('Please enter a title');
        titleInput?.focus();
        return false;
    }
    
    if (!classId) {
        showErrorToast('Please select a class');
        classSelect?.focus();
        return false;
    }
    
    if (!start || !end) {
        showErrorToast('Please provide both start and end dates');
        return false;
    }
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const now = new Date();
    now.setSeconds(0, 0);
    
    if (startDate < now) {
        showErrorToast('Start date cannot be in the past');
        return false;
    }
    
    if (endDate <= startDate) {
        showErrorToast('End date must be after start date');
        return false;
    }
    
    if (file) {
        const fileName = file.name;
        const ext = fileName.split('.').pop().toLowerCase();
        const allowed = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'png', 'jpeg'];
        
        if (!allowed.includes(ext)) {
            showErrorToast('File type not allowed. Allowed: PDF, PPT, Word, Excel, JPG, PNG');
            return false;
        }
        
        if (file.size > 10 * 1024 * 1024) {
            showErrorToast('File too large (max 10MB)');
            return false;
        }
    }
    
    return true;
}

function submitForm(form) {
    const formData = new FormData(form);
    showLoading('Processing...');
    
    const materialsUrl = document.getElementById('app-data')?.dataset.materialsUrl || '/materials';
    
    fetch(materialsUrl, {
        method: 'POST',
        body: formData
    })
    .then(function(response) {
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            // Not JSON - something went wrong
            return response.text().then(function(text) {
                throw new Error('Server returned non-JSON response: ' + text.substring(0, 100));
            });
        }
        return response.json();
    })
    .then(function(data) {
        closeLoading();
        
        if (data.success) {
            showSuccessModal(data.message).then(function() {
                // Auto refresh the page
                window.location.reload();
            });
        } else {
            showErrorModal(data.message || 'An unknown error occurred');
        }
    })
    .catch(function(error) {
        console.error('Error:', error);
        closeLoading();
        showErrorModal('Connection error: ' + error.message);
    });
}

// ==================== DELETE BUTTONS ====================

function setupDeleteButtons() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.delete-btn');
        if (!btn) return;
        
        e.preventDefault();
        
        const materialId = btn.getAttribute('data-material-id');
        const title = btn.getAttribute('data-title') || 'this classwork';
        
        if (!materialId) return;
        
        showConfirmation('Delete Classwork', 'Are you sure you want to delete "' + title + '"? This action cannot be undone.')
            .then(function(result) {
                if (result.isConfirmed) {
                    showLoading('Deleting...');
                    
                    fetch('/materials/delete/' + materialId, { 
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(function(response) {
                        const contentType = response.headers.get('content-type');
                        if (!contentType || !contentType.includes('application/json')) {
                            return response.text().then(function(text) {
                                throw new Error('Server returned non-JSON response');
                            });
                        }
                        return response.json();
                    })
                    .then(function(data) {
                        closeLoading();
                        
                        if (data.success) {
                            showSuccessModal(data.message).then(function() {
                                window.location.reload();
                            });
                        } else {
                            showErrorModal(data.message || 'Delete failed');
                        }
                    })
                    .catch(function(error) {
                        console.error('Error:', error);
                        closeLoading();
                        showErrorModal('Connection error: ' + error.message);
                    });
                }
            });
    });
}

// ==================== EDIT BUTTONS ====================

function setupEditButtons() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.edit-btn');
        if (!btn) return;
        
        e.preventDefault();
        
        const card = btn.closest('.material-card');
        if (!card) return;
        
        // Get data from card attributes
        const materialId = card.getAttribute('data-material-id');
        const title = card.getAttribute('data-title');
        const description = card.getAttribute('data-description') || '';
        const classId = card.getAttribute('data-class');
        const startDate = card.getAttribute('data-start');
        const endDate = card.getAttribute('data-end');
        const hasFile = card.getAttribute('data-has-file') === 'true';
        const filename = card.getAttribute('data-filename') || '';
        
        // Populate form
        const editIdInput = document.getElementById('edit-material-id');
        const titleInput = document.getElementById('title-input');
        const descInput = document.getElementById('description-input');
        const classSelect = document.getElementById('class-select');
        const startInput = document.getElementById('submission-start');
        const endInput = document.getElementById('submission-end');
        const submitBtn = document.getElementById('submit-btn');
        const cancelContainer = document.getElementById('cancel-edit-container');
        const currentFileInfo = document.querySelector('.current-file-info');
        const currentFilename = document.querySelector('.current-filename');
        
        if (editIdInput) editIdInput.value = materialId;
        if (titleInput) titleInput.value = title;
        if (descInput) descInput.value = description;
        if (classSelect) classSelect.value = classId;
        if (startInput) startInput.value = startDate;
        if (endInput) endInput.value = endDate;
        
        // Show current file info if exists
        if (currentFileInfo && currentFilename) {
            if (hasFile && filename) {
                currentFilename.textContent = filename;
                currentFileInfo.style.display = 'block';
            } else {
                currentFileInfo.style.display = 'none';
            }
        }
        
        // Change button text
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Classwork';
        }
        
        // Show cancel button
        if (cancelContainer) {
            cancelContainer.style.display = 'block';
        }
        
        // Scroll to form
        const createSection = document.querySelector('.create-section');
        if (createSection) {
            createSection.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

function setupCancelEdit() {
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (!cancelBtn) return;
    
    cancelBtn.addEventListener('click', function() {
        resetForm();
    });
}

function resetForm() {
    // Clear edit ID
    const editIdInput = document.getElementById('edit-material-id');
    if (editIdInput) editIdInput.value = '';
    
    // Reset form fields
    const form = document.getElementById('material-form');
    if (form) form.reset();
    
    // Reset submit button
    const submitBtn = document.getElementById('submit-btn');
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-upload"></i> Create Classwork';
    }
    
    // Hide cancel button
    const cancelContainer = document.getElementById('cancel-edit-container');
    if (cancelContainer) {
        cancelContainer.style.display = 'none';
    }
    
    // Hide current file info
    const currentFileInfo = document.querySelector('.current-file-info');
    if (currentFileInfo) {
        currentFileInfo.style.display = 'none';
    }
    
    // Reset dates to default
    setDefaultSubmissionDates();
}

// ==================== PREVIEW BUTTONS ====================

function setupPreviewButtons() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.preview-btn');
        if (!btn) return;
        
        e.preventDefault();
        
        const materialId = btn.getAttribute('data-material-id');
        const preview = document.getElementById('preview-' + materialId);
        
        if (preview) {
            // Close other previews
            document.querySelectorAll('.preview-section').forEach(function(p) {
                if (p.id !== 'preview-' + materialId) {
                    p.style.display = 'none';
                }
            });
            
            // Toggle current preview
            preview.style.display = preview.style.display === 'block' ? 'none' : 'block';
        }
    });
    
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.close-preview');
        if (!btn) return;
        
        e.preventDefault();
        
        const materialId = btn.getAttribute('data-material-id');
        const preview = document.getElementById('preview-' + materialId);
        
        if (preview) {
            preview.style.display = 'none';
        }
    });
}

// ==================== DOWNLOAD NOTIFICATIONS ====================

function setupDownloadNotifications() {
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.download-btn');
        if (btn && btn.getAttribute('data-filename')) {
            const filename = btn.getAttribute('data-filename');
            showSuccessToast('Downloading ' + filename + '...');
        }
    });
}

// ==================== DATE FUNCTIONS ====================

function setupDateConstraints() {
    const start = document.getElementById('submission-start');
    const end = document.getElementById('submission-end');
    
    if (start && end) {
        start.addEventListener('change', function() {
            end.min = this.value;
            if (end.value && end.value < this.value) {
                end.value = '';
                showWarningToast('End date must be after start date');
            }
        });
        
        // Set min for end based on start if both exist
        if (start.value && end.value) {
            end.min = start.value;
        }
    }
}

function setDefaultSubmissionDates() {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMilliseconds(0);
    
    // Round to next hour
    now.setHours(now.getHours() + 1);
    
    const start = document.getElementById('submission-start');
    const end = document.getElementById('submission-end');
    
    if (start && !start.value) {
        start.value = formatDate(now);
        start.min = formatDate(now);
    }
    
    if (end && !end.value) {
        const nextWeek = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000));
        end.value = formatDate(nextWeek);
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return year + '-' + month + '-' + day + 'T' + hours + ':' + minutes;
}

// ==================== FILTERING ====================

function setupFilters() {
    const filter = document.getElementById('class-filter');
    if (filter) {
        filter.addEventListener('change', applyFilters);
        applyFilters();
    }
}

function applyFilters() {
    const filter = document.getElementById('class-filter');
    const filterValue = filter ? filter.value : 'all';
    
    const cards = document.querySelectorAll('.material-card');
    let visibleCount = 0;
    
    cards.forEach(function(card) {
        const cardClassId = card.getAttribute('data-class-id');
        const matches = filterValue === 'all' || cardClassId === filterValue;
        
        if (matches) {
            card.classList.remove('hidden');
            visibleCount++;
        } else {
            card.classList.add('hidden');
        }
    });
    
    const noResults = document.getElementById('no-results');
    if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }
    
    if (visibleCount === 0 && filterValue !== 'all') {
        showInfoToast('No classwork found for selected class');
    }
}