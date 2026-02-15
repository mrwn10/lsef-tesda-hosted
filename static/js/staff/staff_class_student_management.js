// staff_class_student_management.js - COMPLETE UPDATED VERSION WITH FIXED REVISIT BUG

// Global variables
let currentAutoStatus = '';
let currentAutoRemarks = '';
let currentAverage = null;
let debounceTimer = null;
let isModalClosing = false;
let currentOpenModal = null;
let isSaving = false;
let currentClassId = null;

// Get current class ID from URL
function getCurrentClassId() {
    const urlParts = window.location.pathname.split('/');
    for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i] === 'staff_class' && i + 1 < urlParts.length) {
            return parseInt(urlParts[i + 1]);
        }
    }
    return null;
}

// Initialize with class ID
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    currentClassId = getCurrentClassId();
    console.log('Current class ID:', currentClassId);
    console.log('Class status:', window.classStatus);
    init();
});

// Smooth toast notification
function showSuccessToast(message) {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    
    const messageSpan = toast.querySelector('.toast-message');
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    toast.style.display = 'flex';
    toast.offsetHeight;
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        hideSuccessToast();
    }, 2000);
}

function hideSuccessToast() {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    
    toast.classList.remove('show');
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 500);
}

// Improved loading screen
function showLoadingScreen(message, details = '') {
    $('#loading-message').text(message);
    $('#loading-details').text(details);
    $('#loading-screen').fadeIn(200);
}

function hideLoadingScreen() {
    $('#loading-screen').fadeOut(200);
}

// Debounced auto-status-remarks calculation
function debouncedCalculateAutoStatusRemarks() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    const loadingEl = document.getElementById('autoRemarksLoading');
    if (loadingEl) loadingEl.style.display = 'inline-block';
    
    debounceTimer = setTimeout(() => {
        calculateAutoStatusRemarks();
    }, 500);
}

// Calculate status and remarks based on AVERAGE
function calculateStatusAndRemarksFromGrades(prelim, midterm, final) {
    console.log('Calculating status from grades:', { prelim, midterm, final });
    
    // Convert empty strings, null, undefined to null
    const prelimNum = (prelim === '' || prelim === null || prelim === undefined) ? null : parseFloat(prelim);
    const midtermNum = (midterm === '' || midterm === null || midterm === undefined) ? null : parseFloat(midterm);
    const finalNum = (final === '' || final === null || final === undefined) ? null : parseFloat(final);
    
    console.log('Converted to numbers:', { prelimNum, midtermNum, finalNum });
    
    // Check for missing grades (any grade is null)
    if (prelimNum === null || midtermNum === null || finalNum === null) {
        console.log('Missing grades, returning Incomplete');
        return {
            status: 'Incomplete',
            remarks: 'Incomplete',
            average: null
        };
    }
    
    // Check if any value is NaN (invalid number)
    if (isNaN(prelimNum) || isNaN(midtermNum) || isNaN(finalNum)) {
        console.log('Invalid numbers, returning Incomplete');
        return {
            status: 'Incomplete',
            remarks: 'Incomplete',
            average: null
        };
    }
    
    const average = (prelimNum + midtermNum + finalNum) / 3;
    console.log('Average calculated:', average);
    
    // Determine status based on average
    let status, remarks;
    if (average >= 96) {
        status = "Excellent (Competent)";
        remarks = "Competent";
    } else if (average >= 91) {
        status = "Very Satisfactory (Competent)";
        remarks = "Competent";
    } else if (average >= 86) {
        status = "Satisfactory (Competent)";
        remarks = "Competent";
    } else if (average >= 81) {
        status = "Fairly Satisfactory (Competent)";
        remarks = "Competent";
    } else if (average >= 75) {
        status = "Passed (Competent)";
        remarks = "Competent";
    } else {
        status = "Failed (Not Yet Competent)";
        remarks = "Not Yet Competent";
    }
    
    console.log('Determined status:', { status, remarks });
    
    return {
        status: status,
        remarks: remarks,
        average: average
    };
}

// Calculate auto status and remarks with improved error handling
function calculateAutoStatusRemarks() {
    console.log('calculateAutoStatusRemarks called');
    
    const prelimInput = document.getElementById('prelimGrade').value;
    const midtermInput = document.getElementById('midtermGrade').value;
    const finalInput = document.getElementById('finalGrade').value;
    
    console.log('Grade inputs:', { prelimInput, midtermInput, finalInput });
    
    const loadingEl = document.getElementById('autoRemarksLoading');
    if (loadingEl) loadingEl.style.display = 'inline-block';
    
    // Calculate locally first for immediate feedback
    const result = calculateStatusAndRemarksFromGrades(prelimInput, midtermInput, finalInput);
    currentAutoStatus = result.status;
    currentAutoRemarks = result.remarks;
    currentAverage = result.average;
    
    // Update displays
    updateAverageDisplay();
    updateAutoStatusRemarksDisplay();
    
    // Update remarks select if auto is enabled
    if (document.getElementById('useAutoRemarks').checked) {
        document.getElementById('remarks').value = currentAutoRemarks;
    }
    
    // Only verify with server if all grades are present and valid
    const prelimNum = prelimInput === '' ? null : parseFloat(prelimInput);
    const midtermNum = midtermInput === '' ? null : parseFloat(midtermInput);
    const finalNum = finalInput === '' ? null : parseFloat(finalInput);
    
    if (prelimNum !== null && midtermNum !== null && finalNum !== null && 
        !isNaN(prelimNum) && !isNaN(midtermNum) && !isNaN(finalNum)) {
        
        console.log('All grades present, verifying with server...');
        
        const displayElement = document.getElementById('autoRemarksText');
        displayElement.innerHTML = `${result.status} <small><i class="fas fa-sync-alt fa-spin"></i> Verifying...</small>`;
        
        // Prepare request data
        const requestData = {
            prelim_grade: prelimNum,
            midterm_grade: midtermNum,
            final_grade: finalNum
        };
        
        console.log('Sending to server:', requestData);
        console.log('URL:', window.appUrls.autoStatusRemarksUrl);
        
        fetch(window.appUrls.autoStatusRemarksUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(requestData)
        })
        .then(async response => {
            console.log('Response received:', {
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries())
            });
            
            // Check content type
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (!response.ok) {
                // Try to get error details
                const text = await response.text();
                console.error('Error response body:', text.substring(0, 500));
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                // If not JSON, get text to see what's being returned
                const text = await response.text();
                console.error('Received non-JSON response:', text.substring(0, 500));
                throw new Error('Server returned HTML instead of JSON. Check console for details.');
            }
        })
        .then(data => {
            console.log('Server response data:', data);
            
            if (data.success) {
                currentAutoStatus = data.status;
                currentAutoRemarks = data.remarks;
                updateAutoStatusRemarksDisplay();
                
                if (document.getElementById('useAutoRemarks').checked) {
                    document.getElementById('remarks').value = currentAutoRemarks;
                }
                
                // Show debug info if available
                if (data.debug) {
                    console.log('Debug info from server:', data.debug);
                }
            } else {
                console.error('Server returned error:', data.error);
                // Show error to user but keep local calculation
                Swal.fire({
                    icon: 'warning',
                    title: 'Server Warning',
                    text: data.error || 'Server validation failed, using local calculation',
                    timer: 3000,
                    showConfirmButton: false
                });
            }
        })
        .catch(error => {
            console.error('Error verifying auto status/remarks:', error);
            
            // Show error to user
            Swal.fire({
                icon: 'error',
                title: 'Connection Error',
                text: error.message || 'Failed to connect to server. Using local calculation.',
                timer: 4000,
                showConfirmButton: false
            });
            
            // Keep local calculation
        })
        .finally(() => {
            if (loadingEl) loadingEl.style.display = 'none';
        });
    } else {
        console.log('Not all grades present, skipping server verification');
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

// Update average display
function updateAverageDisplay() {
    const avgDisplay = document.getElementById('averageDisplay');
    const avgText = document.getElementById('averageText');
    
    if (!avgDisplay || !avgText) return;
    
    // Reset classes
    avgDisplay.className = 'average-display';
    
    if (currentAverage === null) {
        avgText.textContent = '-- (Incomplete)';
        avgDisplay.classList.add('incomplete');
    } else {
        avgText.textContent = currentAverage.toFixed(2);
        if (currentAverage >= 75) {
            avgDisplay.classList.add('passed');
        } else {
            avgDisplay.classList.add('failed');
        }
    }
}

// Update auto status remarks display
function updateAutoStatusRemarksDisplay() {
    const displayElement = document.getElementById('autoRemarksText');
    const container = document.getElementById('autoRemarksDisplay');
    
    if (!displayElement || !container) return;
    
    // Clean the status text for display
    const textOnly = currentAutoStatus.replace(/<[^>]*>/g, '').trim();
    displayElement.textContent = textOnly;
    
    // Reset classes
    container.className = 'auto-remarks-display';
    
    // Add appropriate class based on status
    if (currentAutoStatus.includes('Excellent') || 
        currentAutoStatus.includes('Very Satisfactory') || 
        currentAutoStatus.includes('Satisfactory') || 
        currentAutoStatus.includes('Fairly Satisfactory') || 
        currentAutoStatus.includes('Passed')) {
        container.classList.add('passed');
    } else if (currentAutoStatus.includes('Failed')) {
        container.classList.add('failed');
    } else if (currentAutoStatus === 'Incomplete') {
        container.classList.add('incomplete');
    } else {
        container.classList.add('neutral');
    }
}

// Initialize all functionality
function init() {
    console.log('Initializing all functionality...');
    
    // FIX: Re-validate all buttons on page load to ensure they're properly disabled
    validateAllCertificateButtons();
    
    initMobileNavigation();
    initModals();
    initFileUpload();
    initGradeInputValidation();
    initEditButtons();
    initProfileButtons();
    initCertificateButtons();
    
    // FIX: Add mutation observer to watch for DOM changes that might affect buttons
    observeDOMChanges();
}

// FIX: New function to validate all certificate buttons on page load
function validateAllCertificateButtons() {
    console.log('Validating all certificate buttons on page load...');
    
    const classStatus = window.classStatus;
    const completionButtons = document.querySelectorAll('.completion-btn');
    
    completionButtons.forEach(button => {
        // Get the remarks from the button's data attribute or from the row
        const remarks = button.getAttribute('data-remarks');
        const studentName = button.getAttribute('data-student-name');
        
        // Strict validation: Class must be completed AND remarks must be 'Competent'
        const canGenerate = classStatus === 'completed' && remarks === 'Competent';
        
        if (!canGenerate) {
            // Ensure button is disabled
            button.disabled = true;
            button.classList.add('disabled');
            
            // Update tooltip with clear reason
            let reason = 'Certificate requires: Class completed AND student remarks = "Competent"';
            if (classStatus !== 'completed') {
                reason = `Class must be completed (current: ${classStatus})`;
            } else if (remarks !== 'Competent') {
                reason = `Student remarks must be "Competent" (current: ${remarks || 'Not set'})`;
            }
            button.setAttribute('title', reason);
        } else {
            // Ensure button is enabled
            button.disabled = false;
            button.classList.remove('disabled');
            button.setAttribute('title', 'Generate certificate for competent student');
        }
    });
    
    console.log('Certificate button validation complete');
}

// FIX: Observe DOM changes to re-validate buttons if needed
function observeDOMChanges() {
    // Create a mutation observer to watch for changes to the table
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;
    
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // Debounce validation to avoid too many calls
                if (window.validationTimeout) {
                    clearTimeout(window.validationTimeout);
                }
                
                window.validationTimeout = setTimeout(function() {
                    console.log('DOM changed, re-validating certificate buttons...');
                    validateAllCertificateButtons();
                    // Also re-attach event listeners to new buttons
                    initCertificateButtons();
                }, 100);
            }
        });
    });
    
    // Observe changes to the table container and its descendants
    observer.observe(tableContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-remarks', 'class']
    });
    
    console.log('Mutation observer set up for DOM changes');
}

// Initialize event listeners for buttons
function initEditButtons() {
    console.log('Initializing edit buttons...');
    document.querySelectorAll('.edit-btn:not(.disabled)').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const enrollmentId = this.getAttribute('data-enrollment-id');
            const prelim = this.getAttribute('data-prelim');
            const midterm = this.getAttribute('data-midterm');
            const finalGrade = this.getAttribute('data-final');
            const remarks = this.getAttribute('data-remarks');
            const autoStatus = this.getAttribute('data-auto-status');
            
            console.log('Edit button clicked:', { enrollmentId, prelim, midterm, finalGrade, remarks, autoStatus });
            
            openEditModal(enrollmentId, prelim, midterm, finalGrade, remarks, autoStatus);
        });
    });
}

function initProfileButtons() {
    document.querySelectorAll('.profile-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            console.log('Profile button clicked for user:', userId);
            openProfileModal(userId);
        });
    });
}

function initCertificateButtons() {
    console.log('Initializing certificate buttons...');
    
    // FIX: Only attach event listeners to enabled buttons, but double-check they should be enabled
    document.querySelectorAll('.completion-btn').forEach(button => {
        // Remove any existing event listeners by cloning and replacing
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // Now attach new event listener if button should be enabled
        if (!newButton.disabled && !newButton.classList.contains('disabled')) {
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // FIX: Double-check validation on click
                const classStatus = window.classStatus;
                const remarks = this.getAttribute('data-remarks');
                
                if (classStatus !== 'completed' || remarks !== 'Competent') {
                    console.warn('Button should be disabled but was clicked! Re-validating...');
                    validateAllCertificateButtons();
                    return;
                }
                
                const enrollmentId = this.getAttribute('data-enrollment-id');
                const studentName = this.getAttribute('data-student-name');
                console.log('Certificate button clicked:', { enrollmentId, studentName, remarks });
                
                generatePrivateCompletion(enrollmentId, studentName, remarks);
            });
        }
    });
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
                closeMobileNavOnly();
            });
        }
        
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
        
        const mobileNavLinks = document.querySelectorAll('.mobile-nav-links a:not(.logout-btn)');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                closeMobileNavOnly();
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!hamburgerMenu.contains(e.target) && !mobileNav.contains(e.target) && mobileNav.classList.contains('active')) {
                closeMobileNavOnly();
            }
        });
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
                closeMobileNavOnly();
            }
        });
    }
}

function closeMobileNavOnly() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// File upload display
function initFileUpload() {
    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', function(e) {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'No file chosen';
            document.getElementById('file-name').textContent = fileName;
        });
    }
}

// Grade input validation
function initGradeInputValidation() {
    const gradeInputs = ['prelimGrade', 'midtermGrade', 'finalGrade'];
    
    gradeInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', function() {
                validateGradeInput(this);
            });
            input.addEventListener('input', function() {
                validateGradeInput(this);
            });
        }
    });
}

function validateGradeInput(input) {
    if (!input.value || input.value === '') {
        input.classList.remove('valid', 'invalid');
        return true;
    }
    
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0 || value > 100) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        return false;
    } else {
        input.classList.add('valid');
        input.classList.remove('invalid');
        return true;
    }
}

// Initialize all modal functionality
function initModals() {
    console.log('Initializing modals...');
    
    // Smooth close function
    window.closeModal = function(modalId) {
        if (isModalClosing) return;
        
        isModalClosing = true;
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('smooth-closing');
            
            setTimeout(() => {
                modal.style.display = 'none';
                modal.classList.remove('smooth-closing');
                document.body.style.overflow = '';
                document.body.classList.remove('modal-open');
                currentOpenModal = null;
                isModalClosing = false;
                
                if (debounceTimer) {
                    clearTimeout(debounceTimer);
                    debounceTimer = null;
                }
            }, 300);
        } else {
            isModalClosing = false;
        }
    };

    // Smooth open function
    window.openModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            if (currentOpenModal && currentOpenModal !== modalId) {
                closeModal(currentOpenModal);
            }
            
            setTimeout(() => {
                modal.style.display = 'flex';
                modal.classList.add('smooth-opening');
                document.body.style.overflow = 'hidden';
                document.body.classList.add('modal-open');
                currentOpenModal = modalId;
            }, currentOpenModal ? 350 : 0);
        }
    };

    // Close all modals
    window.closeAllModals = function() {
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.style.display !== 'none') {
                closeModal(modal.id);
            }
        });
    };

    // Close modal when clicking outside
    $(document).on('click', function(e) {
        if ($(e.target).hasClass('modal') && !$(e.target).closest('.modal-content').length) {
            closeModal(currentOpenModal);
        }
    });

    // Escape key to close modals
    $(document).keyup(function(e) {
        if (e.keyCode === 27 && currentOpenModal) {
            closeModal(currentOpenModal);
        }
    });

    // ===== SPECIFIC MODAL FUNCTIONALITY =====

    // Logout Modal
    $('#logout-trigger').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        openModal('logoutModal');
    });
    
    $('#mobile-logout-trigger').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeMobileNavOnly();
        setTimeout(() => {
            openModal('logoutModal');
        }, 10);
    });
    
    $('#cancel-logout').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal('logoutModal');
    });
    
    $('#close-logout-modal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal('logoutModal');
    });
    
    $('#confirm-logout').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        showLoadingScreen('Logging out...');
        const logoutUrl = document.body.getAttribute('data-logout-url');
        if (logoutUrl) {
            window.location.href = logoutUrl;
        } else {
            console.error('Logout URL not found');
            window.location.href = "/logout";
        }
    });

    // Edit Grade Modal
    const cancelEditBtn = document.getElementById('cancel-edit');
    const closeEditBtn = document.getElementById('close-edit-modal');
    const saveGradeBtn = document.getElementById('save-grade-changes');
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('editGradeModal');
        });
    }
    
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('editGradeModal');
        });
    }
    
    if (saveGradeBtn) {
        saveGradeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            submitGradeEdit();
        });
    }

    // Profile Modal
    const closeProfileDetailsBtn = document.getElementById('close-profile-details');
    const closeProfileModalBtn = document.getElementById('close-profile-modal');
    
    if (closeProfileDetailsBtn) {
        closeProfileDetailsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('viewProfileModal');
        });
    }
    
    if (closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeModal('viewProfileModal');
        });
    }

    // Auto remarks toggle
    const useAutoRemarks = document.getElementById('useAutoRemarks');
    if (useAutoRemarks) {
        useAutoRemarks.addEventListener('change', toggleRemarksSelect);
    }

    // Grade input events for auto status/remarks calculation
    const prelimInput = document.getElementById('prelimGrade');
    const midtermInput = document.getElementById('midtermGrade');
    const finalInput = document.getElementById('finalGrade');
    
    if (prelimInput) {
        prelimInput.addEventListener('input', debouncedCalculateAutoStatusRemarks);
    }
    if (midtermInput) {
        midtermInput.addEventListener('input', debouncedCalculateAutoStatusRemarks);
    }
    if (finalInput) {
        finalInput.addEventListener('input', debouncedCalculateAutoStatusRemarks);
    }
}

// Open edit modal
function openEditModal(enrollmentId, prelim, midterm, finalGrade, remarks, autoStatus) {
    console.log('Opening edit modal:', { enrollmentId, prelim, midterm, finalGrade, remarks, autoStatus });
    
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    
    document.getElementById('editEnrollmentId').value = enrollmentId;
    
    // Handle null/undefined/NaN values by setting to empty string
    document.getElementById('prelimGrade').value = (prelim !== null && prelim !== undefined && !isNaN(prelim) && prelim !== '') ? prelim : '';
    document.getElementById('midtermGrade').value = (midterm !== null && midterm !== undefined && !isNaN(midterm) && midterm !== '') ? midterm : '';
    document.getElementById('finalGrade').value = (finalGrade !== null && finalGrade !== undefined && !isNaN(finalGrade) && finalGrade !== '') ? finalGrade : '';
    
    // Set remarks, default to 'Incomplete' if null/empty
    document.getElementById('remarks').value = (remarks && remarks !== 'null' && remarks !== 'undefined') ? remarks : 'Incomplete';
    
    // Reset validation classes
    ['prelimGrade', 'midtermGrade', 'finalGrade'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.classList.remove('valid', 'invalid');
        }
    });
    
    // Calculate initial status and remarks based on grades
    const result = calculateStatusAndRemarksFromGrades(
        document.getElementById('prelimGrade').value,
        document.getElementById('midtermGrade').value,
        document.getElementById('finalGrade').value
    );
    currentAutoStatus = result.status;
    currentAutoRemarks = result.remarks;
    currentAverage = result.average;
    
    updateAverageDisplay();
    updateAutoStatusRemarksDisplay();
    
    document.getElementById('useAutoRemarks').checked = true;
    toggleRemarksSelect();
    
    const loadingEl = document.getElementById('autoRemarksLoading');
    if (loadingEl) loadingEl.style.display = 'none';
    
    openModal('editGradeModal');
    
    setTimeout(() => {
        const firstInput = document.getElementById('prelimGrade');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

function toggleRemarksSelect() {
    const useAutoRemarks = document.getElementById('useAutoRemarks');
    const remarksSelect = document.getElementById('remarks');
    
    if (!useAutoRemarks || !remarksSelect) return;
    
    if (useAutoRemarks.checked) {
        remarksSelect.disabled = true;
        remarksSelect.value = currentAutoRemarks;
        remarksSelect.title = 'Automatic remarks is enabled';
        remarksSelect.classList.add('disabled');
    } else {
        remarksSelect.disabled = false;
        remarksSelect.title = 'Manual remarks selection';
        remarksSelect.classList.remove('disabled');
    }
}

// ===================== AUTO REFRESH FUNCTIONS =====================

// Refresh the entire table
function refreshStudentTable() {
    if (!currentClassId) return;
    
    showLoadingScreen('Refreshing student data...');
    
    // Fetch updated data from server
    fetch(`/staff_class/${currentClassId}/students?refresh=true&t=${Date.now()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            // Parse the HTML response
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract the table content
            const newTable = doc.querySelector('.table-container');
            if (newTable) {
                const currentTableContainer = document.querySelector('.table-container');
                currentTableContainer.innerHTML = newTable.innerHTML;
                
                // Reinitialize event listeners and validate buttons
                initEditButtons();
                initProfileButtons();
                initCertificateButtons();
                validateAllCertificateButtons(); // Extra validation
                
                // Show success message
                showSuccessToast('Table refreshed successfully!');
            }
        })
        .catch(error => {
            console.error('Error refreshing table:', error);
            // Fallback: Reload the page
            location.reload();
        })
        .finally(() => {
            hideLoadingScreen();
        });
}

// Helper function to get CSS class for status
function getStatusClass(status) {
    if (!status) return 'incomplete';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('excellent')) return 'excellent-competent';
    if (statusLower.includes('very satisfactory')) return 'very-satisfactory-competent';
    if (statusLower.includes('satisfactory')) return 'satisfactory-competent';
    if (statusLower.includes('fairly satisfactory')) return 'fairly-satisfactory-competent';
    if (statusLower.includes('passed')) return 'passed-competent';
    if (statusLower.includes('failed')) return 'failed-not-yet-competent';
    return 'incomplete';
}

// Update only the specific row (optimized version)
function updateStudentRowOptimized(enrollmentId, prelim, midterm, final, remarks, status, average) {
    // Find the row with matching enrollment_id
    const rows = document.querySelectorAll('.class-table tbody tr');
    let rowFound = false;
    
    rows.forEach(row => {
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn && editBtn.getAttribute('data-enrollment-id') === enrollmentId) {
            rowFound = true;
            
            // Get class status from global variable
            const classStatus = window.classStatus;
            
            // Get student name from the row
            const studentNameCell = row.children[0];
            const studentName = studentNameCell ? studentNameCell.textContent.trim() : '';
            
            // Get user ID from profile button
            const oldProfileBtn = row.querySelector('.profile-btn');
            const userId = oldProfileBtn ? oldProfileBtn.getAttribute('data-user-id') : '';
            
            // Update average cell
            const avgCell = row.children[2];
            if (average !== null && average !== undefined && !isNaN(average)) {
                const avgFormatted = parseFloat(average).toFixed(2);
                const avgClass = parseFloat(average) >= 75 ? 'passed' : 'failed';
                avgCell.innerHTML = `<span class="average-grade ${avgClass}">${avgFormatted}</span>`;
            } else {
                avgCell.innerHTML = `<span class="average-grade incomplete">N/A</span>`;
            }
            
            // Update status/remarks cell
            const statusCell = row.children[3];
            const statusClass = getStatusClass(status || 'Incomplete');
            const remarksBadge = remarks === 'Competent' ? 'competent' : 
                                remarks === 'Not Yet Competent' ? 'not-yet-competent' : 
                                remarks === 'Incomplete' ? 'incomplete' :
                                remarks ? remarks.toLowerCase().replace(' ', '-') : 'incomplete';
            
            statusCell.innerHTML = `
                <div class="status-remarks-container">
                    <span class="status-remarks ${statusClass}">${status || 'Incomplete'}</span>
                    ${remarks ? `<small class="remarks-badge ${remarksBadge}">${remarks}</small>` : ''}
                </div>
            `;
            
            // Update action buttons
            const actionCell = row.children[4];
            
            // Determine button states based on class status and remarks
            const canEdit = classStatus === 'ongoing' || classStatus === 'completed';
            // STRICT RULE: Certificate only if class completed AND remarks is exactly 'Competent'
            const canGenerate = classStatus === 'completed' && remarks === 'Competent';
            
            // Prepare data attributes for edit button (handle null/undefined)
            const prelimAttr = (prelim !== null && !isNaN(prelim)) ? prelim : '';
            const midtermAttr = (midterm !== null && !isNaN(midterm)) ? midterm : '';
            const finalAttr = (final !== null && !isNaN(final)) ? final : '';
            
            // Rebuild action buttons
            actionCell.innerHTML = `
                <button class="edit-btn ${!canEdit ? 'disabled' : ''}" 
                        ${canEdit ? `data-enrollment-id="${enrollmentId}" data-prelim="${prelimAttr}" data-midterm="${midtermAttr}" data-final="${finalAttr}" data-remarks="${remarks || ''}" data-auto-status="${status || 'Incomplete'}"` : 'disabled'}
                        ${!canEdit ? `title="Editing disabled - Class status: ${classStatus}"` : ''}>
                    <i class="fas fa-edit"></i> Edit Grade
                </button>
                <button class="profile-btn" data-user-id="${userId}">
                    <i class="fas fa-user"></i> Profile
                </button>
                <button class="completion-btn ${!canGenerate ? 'disabled' : ''}" 
                        ${canGenerate ? `data-enrollment-id="${enrollmentId}" data-student-name="${studentName}" data-remarks="${remarks}"` : 'disabled'}
                        ${!canGenerate ? `title="Certificate requires: Class completed AND student remarks = 'Competent' (current: ${remarks})"` : ''}>
                    <i class="fas fa-file-certificate"></i> Certificate
                </button>
            `;
            
            // Reattach event listeners
            const newEditBtn = actionCell.querySelector('.edit-btn:not(.disabled)');
            const newProfileBtn = actionCell.querySelector('.profile-btn');
            const newCompletionBtn = actionCell.querySelector('.completion-btn:not(.disabled)');
            
            if (newEditBtn) {
                newEditBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openEditModal(
                        enrollmentId,
                        prelimAttr,
                        midtermAttr,
                        finalAttr,
                        remarks || '',
                        status || 'Incomplete'
                    );
                });
            }
            
            if (newProfileBtn) {
                newProfileBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    openProfileModal(userId);
                });
            }
            
            if (newCompletionBtn) {
                newCompletionBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    generatePrivateCompletion(enrollmentId, studentName, remarks);
                });
            }
        }
    });
    
    // If row not found, refresh entire table
    if (!rowFound) {
        refreshStudentTable();
    }
}

// SMOOTH SUBMIT FUNCTION WITH AUTO REFRESH
function submitGradeEdit() {
    if (isSaving) return;
    
    console.log('submitGradeEdit called');
    
    const enrollmentId = document.getElementById('editEnrollmentId').value;
    const prelim = document.getElementById('prelimGrade').value;
    const midterm = document.getElementById('midtermGrade').value;
    const finalGrade = document.getElementById('finalGrade').value;
    const useAutoRemarks = document.getElementById('useAutoRemarks').checked;
    let remarks = document.getElementById('remarks').value;

    console.log('Submit data:', { enrollmentId, prelim, midterm, finalGrade, useAutoRemarks, remarks });

    // Validate inputs (empty is allowed - means not yet graded)
    const prelimValid = prelim === '' || validateGradeInput(document.getElementById('prelimGrade'));
    const midtermValid = midterm === '' || validateGradeInput(document.getElementById('midtermGrade'));
    const finalValid = finalGrade === '' || validateGradeInput(document.getElementById('finalGrade'));
    
    if (!prelimValid || !midtermValid || !finalValid) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Grades',
            text: 'Please fix invalid grade values (must be between 0 and 100 or empty)',
            confirmButtonText: 'OK',
            confirmButtonColor: '#b91c1c',
            timer: 3000
        });
        return;
    }

    isSaving = true;
    
    // Prepare save button
    const saveBtn = document.getElementById('save-grade-changes');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    saveBtn.classList.add('btn-saving');
    saveBtn.disabled = true;

    // 1. First, close modal smoothly
    closeModal('editGradeModal');
    
    // 2. Show loading screen
    showLoadingScreen('Saving grade changes...');
    
    // 3. Make API call with proper null handling
    fetch(window.appUrls.editGradeUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({
            enrollment_id: enrollmentId,
            prelim_grade: prelim === '' ? null : parseFloat(prelim),
            midterm_grade: midterm === '' ? null : parseFloat(midterm),
            final_grade: finalGrade === '' ? null : parseFloat(finalGrade),
            remarks: remarks,
            use_auto_remarks: useAutoRemarks
        })
    })
    .then(async response => {
        console.log('Edit response received:', {
            status: response.status,
            statusText: response.statusText
        });
        
        const contentType = response.headers.get('content-type');
        console.log('Content-Type:', contentType);
        
        if (!response.ok) {
            const text = await response.text();
            console.error('Error response:', text.substring(0, 500));
            throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        if (contentType && contentType.includes('application/json')) {
            return response.json();
        } else {
            const text = await response.text();
            console.error('Non-JSON response:', text.substring(0, 500));
            throw new Error('Server returned HTML instead of JSON');
        }
    })
    .then(data => {
        console.log('Edit response data:', data);
        
        if (!data.success) {
            throw new Error(data.error || 'Unknown error occurred');
        }
        
        // Update loading message
        $('#loading-message').text('Refreshing table...');
        
        // Calculate average for display (handle null/empty properly)
        const prelimNum = prelim === '' ? null : parseFloat(prelim);
        const midtermNum = midterm === '' ? null : parseFloat(midterm);
        const finalNum = finalGrade === '' ? null : parseFloat(finalGrade);
        
        let avg = null;
        if (prelimNum !== null && midtermNum !== null && finalNum !== null && 
            !isNaN(prelimNum) && !isNaN(midtermNum) && !isNaN(finalNum)) {
            avg = (prelimNum + midtermNum + finalNum) / 3;
        }
        
        // Update the specific row with new data
        updateStudentRowOptimized(
            enrollmentId, 
            prelimNum, 
            midtermNum, 
            finalNum, 
            remarks, 
            data.auto_status || currentAutoStatus,
            avg
        );
        
        // 4. Hide loading screen after a short delay
        setTimeout(() => {
            hideLoadingScreen();
            isSaving = false;
            
            // 5. Show success dialog with auto-close
            Swal.fire({
                icon: 'success',
                title: 'Grade Saved Successfully!',
                html: `
                    <p>Student grades have been updated and table refreshed.</p>
                    <div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #065f46;">
                        <small style="color: #475569;">
                            <i class="fas fa-info-circle"></i> 
                            Status: ${data.auto_status || currentAutoStatus}
                            ${avg !== null ? `<br>Average: ${avg.toFixed(2)}` : '<br>Average: Incomplete'}
                        </small>
                    </div>
                `,
                showCancelButton: false,
                confirmButtonText: 'OK',
                confirmButtonColor: '#065f46',
                timer: 3000,
                timerProgressBar: true
            });
            
            // Restore save button state
            if (saveBtn) {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('btn-saving');
                saveBtn.disabled = false;
            }
            
            // FIX: Re-validate all certificate buttons after save
            validateAllCertificateButtons();
            
        }, 500);
        
    })
    .catch(error => {
        hideLoadingScreen();
        isSaving = false;
        
        console.error('Error in submitGradeEdit:', error);
        
        // Show error message with details
        Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            html: `
                <p>${error.message || 'Failed to save grade changes'}</p>
                <p style="font-size: 12px; color: #666; margin-top: 10px;">
                    Check browser console (F12) for more details
                </p>
            `,
            confirmButtonText: 'Try Again',
            confirmButtonColor: '#b91c1c'
        }).then(() => {
            // Re-open the edit modal so user can try again
            openEditModal(
                enrollmentId,
                prelim,
                midterm,
                finalGrade,
                remarks,
                currentAutoStatus
            );
            
            // Restore save button
            if (saveBtn) {
                saveBtn.innerHTML = originalText;
                saveBtn.classList.remove('btn-saving');
                saveBtn.disabled = false;
            }
        });
    });
}

// Open profile modal
function openProfileModal(userId) {
    showLoadingScreen('Loading student profile...');
    
    fetch(`${window.appUrls.studentProfileUrl}${userId}`)
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            hideLoadingScreen();
            if (!data.success) {
                throw new Error(data.error || 'Failed to load profile');
            }

            const profile = data.personal_info;
            document.getElementById('profileName').innerText = 
                `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim();
            document.getElementById('profileEmail').innerText = profile.email;
            document.getElementById('profileContact').innerText = profile.contact_number || 'Not provided';
            document.getElementById('profileDOB').innerText = profile.date_of_birth || 'Not specified';
            document.getElementById('profileGender').innerText = profile.gender || 'Not specified';
            document.getElementById('profileAddress').innerText = 
                profile.baranggay ? `${profile.baranggay}, ${profile.municipality}, ${profile.province}` : 'Not provided';
            
            const profilePicture = profile.profile_picture || 'default.png';
            const staticPath = window.appUrls.staticProfilePath || '/static/uploads/profile_pictures/';
            document.getElementById('profilePicture').src = `${staticPath}${profilePicture}`;

            const classesTable = document.getElementById('profileClassesTable').getElementsByTagName('tbody')[0];
            classesTable.innerHTML = '';
            
            data.classes.forEach(cls => {
                const row = classesTable.insertRow();
                row.insertCell(0).textContent = cls.class_title || 'N/A';
                
                let scheduleText = cls.schedule || 'N/A';
                if (cls.days_of_week && typeof cls.days_of_week === 'object') {
                    const days = Object.keys(cls.days_of_week).join(', ');
                    scheduleText += ` (${days})`;
                }
                row.insertCell(1).textContent = scheduleText;
                
                row.insertCell(2).textContent = cls.venue || 'N/A';
                
                let avgDisplay = 'N/A';
                let avgClass = '';
                if (cls.average !== null && cls.average !== undefined) {
                    avgDisplay = cls.average.toFixed(2);
                }
                row.insertCell(3).textContent = avgDisplay;
                
                row.insertCell(4).textContent = cls.grade_status || 'Not Evaluated';
                row.insertCell(5).textContent = cls.remarks || 'N/A';
                row.insertCell(6).textContent = cls.enrollment_status || 'N/A';
                row.insertCell(7).textContent = cls.instructor_name || 'N/A';
            });

            const certsTable = document.getElementById('profileCertificatesTable').getElementsByTagName('tbody')[0];
            certsTable.innerHTML = '';
            
            if (data.certificates && data.certificates.length > 0) {
                data.certificates.forEach(cert => {
                    const row = certsTable.insertRow();
                    row.insertCell(0).textContent = cert.course || cert.class_title || 'N/A';
                    row.insertCell(1).textContent = cert.date || 'N/A';
                    row.insertCell(2).textContent = cert.created_at ? new Date(cert.created_at).toLocaleDateString() : 'N/A';
                    
                    const viewCell = row.insertCell(3);
                    if (cert.file_path) {
                        const viewLink = document.createElement('a');
                        viewLink.href = cert.file_path;
                        viewLink.textContent = 'View';
                        viewLink.target = '_blank';
                        viewLink.className = 'cert-action-link';
                        viewLink.rel = 'noopener noreferrer';
                        viewCell.appendChild(viewLink);
                    } else {
                        viewCell.textContent = 'N/A';
                    }
                    
                    const downloadCell = row.insertCell(4);
                    if (cert.file_path) {
                        const downloadBtn = document.createElement('button');
                        downloadBtn.textContent = 'Download';
                        downloadBtn.className = 'cert-action-btn';
                        downloadBtn.onclick = () => {
                            const link = document.createElement('a');
                            link.href = cert.file_path;
                            link.download = `certificate_${cert.id || 'unknown'}_${cert.date || 'unknown'}.pdf`;
                            link.rel = 'noopener noreferrer';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        };
                        downloadCell.appendChild(downloadBtn);
                    } else {
                        downloadCell.textContent = 'N/A';
                    }
                });
            } else {
                const row = certsTable.insertRow();
                const cell = row.insertCell(0);
                cell.colSpan = 5;
                cell.textContent = 'No certificates available';
                cell.style.textAlign = 'center';
                cell.style.padding = '20px';
                cell.style.color = '#64748b';
            }

            openModal('viewProfileModal');
        })
        .catch(error => {
            hideLoadingScreen();
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Load Profile',
                text: `Error: ${error.message || 'Could not load student profile'}`,
                confirmButtonText: 'OK'
            });
        });
}

// ===================== STRICT CERTIFICATE GENERATION =====================
// Certificate functions with strict rules
function generatePrivateCompletion(enrollmentId, studentName, remarks) {
    // STRICT RULE: Only allow if remarks is exactly 'Competent'
    if (remarks !== 'Competent') {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Generate Certificate',
            html: `
                <p>Certificate can only be generated for students with <strong>"Competent"</strong> status.</p>
                <p style="margin-top: 10px; padding: 8px; background-color: #fee2e2; border-radius: 4px; color: #b91c1c;">
                    Current remarks: <strong>${remarks || 'Not set'}</strong>
                </p>
                <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    Please ensure the student has "Competent" remarks before generating a certificate.
                </p>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#b91c1c'
        });
        return;
    }
    
    // Check if class is completed (this will be validated on backend too)
    if (window.classStatus !== 'completed') {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Generate Certificate',
            html: `
                <p>Class must be <strong>completed</strong> to generate certificates.</p>
                <p style="margin-top: 10px; padding: 8px; background-color: #fee2e2; border-radius: 4px; color: #b91c1c;">
                    Current class status: <strong>${window.classStatus || 'unknown'}</strong>
                </p>
            `,
            confirmButtonText: 'OK',
            confirmButtonColor: '#b91c1c'
        });
        return;
    }
    
    Swal.fire({
        title: 'Generate Certificate of Completion',
        html: `
            <p>Generate completion certificate for:</p>
            <p style="font-size: 1.2rem; font-weight: 600; color: #003366;">${studentName}</p>
            <p style="margin-top: 10px; padding: 5px 10px; background-color: #d1fae5; border-radius: 20px; display: inline-block; color: #065f46;">
                <i class="fas fa-check-circle"></i> Competent
            </p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Generate',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            generatePrivateCompletionCertificate(enrollmentId, studentName);
        }
    });
}

function generatePrivateCompletionCertificate(enrollmentId, studentName) {
    showLoadingScreen('Generating certificate...');
    
    const formData = new FormData();
    formData.append('enrollment_id', enrollmentId);
    
    fetch(window.appUrls.generateCertUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw err; });
        }
        return response.json();
    })
    .then(data => {
        hideLoadingScreen();
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Certificate Generated!',
                html: `
                    <p>Private Completion Certificate generated successfully!</p>
                    ${data.cert_hash ? `<p><small>Certificate ID: ${data.cert_hash.substring(0, 16)}...</small></p>` : ''}
                `,
                showCancelButton: true,
                confirmButtonText: 'Download',
                cancelButtonText: 'Close',
                reverseButtons: true
            }).then((result) => {
                if (result.isConfirmed && data.file_path) {
                    const link = document.createElement('a');
                    link.href = data.file_path;
                    link.download = `certificate_${enrollmentId}_${Date.now()}.pdf`;
                    link.rel = 'noopener noreferrer';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            });
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    })
    .catch(error => {
        hideLoadingScreen();
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Generation Failed',
            text: `Error: ${error.message || 'Failed to generate certificate'}`,
            confirmButtonText: 'OK'
        });
    });
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('saved')) {
        showSuccessToast('Grade saved successfully!');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    init();
});

// Clean up
window.addEventListener('beforeunload', function() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
});