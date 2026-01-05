// admin_student_grade.js - FIXED VERSION
// ===================== GLOBAL VARIABLES =====================
let currentAutoRemarks = '';
let debounceTimer = null;
let isModalClosing = false;
let currentOpenModal = null;
let isSaving = false;
let currentPage = 1;
const pageSize = 20;
let allStudents = [];
let filteredStudents = [];

// ===================== INITIALIZATION =====================
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    allStudents = Array.from(document.querySelectorAll('#gradesTableBody tr')).map(row => ({
        element: row,
        classId: row.getAttribute('data-class-id'),
        status: row.getAttribute('data-status'),
        enrollmentId: row.getAttribute('data-enrollment-id')
    }));
    filteredStudents = [...allStudents];
    
    init();
    updateTableInfo();
    
    // Check for success message in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('saved')) {
        showSuccessToast('Grade saved successfully!');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
});

// ===================== MAIN INIT FUNCTION =====================
function init() {
    initMobileNavigation();
    initModals();
    initFilters();
    initFileUpload();
    initGradeInputValidation();
    initPagination();
    initBulkActions();
    initEditButtons();
    initProfileButtons();
    initCertificateButtons();
}

// ===================== EVENT HANDLER INITIALIZATION =====================
function initEditButtons() {
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const enrollmentId = this.getAttribute('data-enrollment-id');
            const prelim = this.getAttribute('data-prelim');
            const midterm = this.getAttribute('data-midterm');
            const finalGrade = this.getAttribute('data-final');
            const remarks = this.getAttribute('data-remarks');
            const autoRemarks = this.getAttribute('data-auto-remarks');
            const studentName = this.getAttribute('data-student-name');
            const className = this.getAttribute('data-class-name');
            
            openEditModal(enrollmentId, prelim, midterm, finalGrade, remarks, autoRemarks, studentName, className);
        });
    });
}

function initProfileButtons() {
    document.querySelectorAll('.profile-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const userId = this.getAttribute('data-user-id');
            openProfileModal(userId);
        });
    });
}

function initCertificateButtons() {
    document.querySelectorAll('.certificate-btn:not(:disabled)').forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const enrollmentId = this.getAttribute('data-enrollment-id');
            const studentName = this.getAttribute('data-student-name');
            const remarks = this.getAttribute('data-remarks');
            const enrollmentStatus = this.getAttribute('data-enrollment-status');
            generateCertificate(enrollmentId, studentName, remarks, enrollmentStatus);
        });
    });
}

// ===================== MOBILE NAVIGATION =====================
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

// ===================== FILTERS =====================
function initFilters() {
    const applyFilterBtn = document.getElementById('applyFilter');
    const resetFilterBtn = document.getElementById('resetFilter');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (applyFilterBtn) {
        applyFilterBtn.addEventListener('click', applyFilters);
    }
    
    if (resetFilterBtn) {
        resetFilterBtn.addEventListener('click', resetFilters);
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    // Auto-apply filter on select change
    const classFilter = document.getElementById('classFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (classFilter) classFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
}

function applyFilters() {
    const classFilter = document.getElementById('classFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    
    filteredStudents = allStudents.filter(rowData => {
        const row = rowData.element;
        const studentName = row.cells[0].textContent.toLowerCase();
        const className = row.cells[1].textContent.toLowerCase();
        const email = row.cells[2].textContent.toLowerCase();
        
        // Class filter
        if (classFilter && rowData.classId !== classFilter) {
            return false;
        }
        
        // Status filter
        if (statusFilter) {
            const rowStatus = rowData.status.toLowerCase();
            
            if (statusFilter === 'Competent') {
                // Check if enrolled status is Competent/completed OR remarks is Competent
                const remarksCell = row.cells[7];
                const remarksText = remarksCell.textContent.trim().toLowerCase();
                const statusCell = row.cells[8];
                const statusText = statusCell.textContent.trim().toLowerCase();
                
                if (!(rowStatus === 'competent' || 
                      rowStatus === 'completed' || 
                      remarksText === 'competent' ||
                      statusText === 'competent' ||
                      statusText === 'completed')) {
                    return false;
                }
            } else if (statusFilter === 'dropped') {
                if (!(rowStatus === 'dropped' || rowStatus.includes('dropped'))) {
                    return false;
                }
            } else if (statusFilter === 'enrolled') {
                // Show active enrollments (not completed, not dropped)
                if (rowStatus === 'competent' || rowStatus === 'completed' || 
                    rowStatus === 'dropped' || rowStatus === 'rejected' || 
                    rowStatus === 'cancelled') {
                    return false;
                }
            } else if (rowStatus !== statusFilter.toLowerCase()) {
                return false;
            }
        }
        
        // Search filter
        if (searchInput && 
            !studentName.includes(searchInput) && 
            !className.includes(searchInput) &&
            !email.includes(searchInput)) {
            return false;
        }
        
        return true;
    });
    
    // Update display
    updateTableDisplay();
    currentPage = 1;
    updatePagination();
    updateTableInfo();
}

function resetFilters() {
    document.getElementById('classFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('searchInput').value = '';
    
    filteredStudents = [...allStudents];
    updateTableDisplay();
    currentPage = 1;
    updatePagination();
    updateTableInfo();
}

function updateTableDisplay() {
    // Hide all rows first
    allStudents.forEach(rowData => {
        rowData.element.style.display = 'none';
    });
    
    // Show filtered rows for current page
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentStudents = filteredStudents.slice(startIndex, endIndex);
    
    currentStudents.forEach(rowData => {
        rowData.element.style.display = '';
    });
}

function updateTableInfo() {
    const showingCount = Math.min(filteredStudents.length, pageSize);
    const totalCount = filteredStudents.length;
    
    document.getElementById('showingCount').textContent = showingCount;
    document.getElementById('totalCount').textContent = totalCount;
}

// ===================== PAGINATION =====================
function initPagination() {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    
    if (prevBtn) prevBtn.addEventListener('click', goToPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
    
    updateTableDisplay();
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePagination();
        updateTableInfo();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredStudents.length / pageSize);
    if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
        updateTableInfo();
    }
}

// ===================== BULK ACTIONS =====================
function initBulkActions() {
    // Download All Grades
    const downloadAllBtn = document.getElementById('downloadAllGrades');
    if (downloadAllBtn) {
        downloadAllBtn.addEventListener('click', downloadAllGrades);
    }
    
    // Upload Bulk Grades
    const uploadBtn = document.getElementById('uploadBulkGrades');
    const fileInput = document.getElementById('bulkFileUpload');
    
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            document.getElementById('bulkFileName').textContent = 
                this.files[0] ? this.files[0].name : 'No file chosen';
        });
    }
    
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadBulkGrades);
    }
    
    // Mass Complete
    const massCompleteBtn = document.getElementById('massComplete');
    if (massCompleteBtn) {
        massCompleteBtn.addEventListener('click', massCompleteStudents);
    }
}

function downloadAllGrades() {
    showLoadingScreen('Preparing download...');
    
    // Get current filters
    const classFilter = document.getElementById('classFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    // Build query string
    let queryParams = [];
    if (classFilter) queryParams.push(`class_id=${classFilter}`);
    if (statusFilter) queryParams.push(`status=${statusFilter}`);
    
    const queryString = queryParams.length > 0 ? '?' + queryParams.join('&') : '';
    
    // Redirect to download endpoint
    setTimeout(() => {
        hideLoadingScreen();
        window.location.href = `${window.appUrls.downloadGradesUrl}${queryString}`;
    }, 500);
}

function uploadBulkGrades() {
    const fileInput = document.getElementById('bulkFileUpload');
    if (!fileInput.files[0]) {
        Swal.fire({
            icon: 'warning',
            title: 'No File Selected',
            text: 'Please select an Excel file to upload.',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    Swal.fire({
        title: 'Upload Grade Sheet',
        html: `<p>Upload grades for all students? This will update existing grades.</p>
               <small class="text-muted">Make sure your Excel file follows the correct format.</small>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Upload',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            const formData = new FormData();
            formData.append('file', fileInput.files[0]);
            
            showLoadingScreen('Uploading grade sheet...');
            
            fetch(window.appUrls.uploadGradesUrl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                hideLoadingScreen();
                if (data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Upload Successful!',
                        html: `<p>${data.message}</p>
                               <p><small>${data.updated || 0} records updated</small></p>`,
                        confirmButtonText: 'OK'
                    }).then(() => {
                        location.reload();
                    });
                } else {
                    throw new Error(data.error || 'Upload failed');
                }
            })
            .catch(error => {
                hideLoadingScreen();
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: error.message || 'Failed to upload grade sheet',
                    confirmButtonText: 'OK'
                });
            });
        }
    });
}

function massCompleteStudents() {
    // Get selected rows (you can add checkboxes later)
    // For now, this is a placeholder for mass completion functionality
    Swal.fire({
        title: 'Mass Complete Students',
        text: 'This feature will mark multiple students as Completed. Add checkboxes to enable selection.',
        icon: 'info',
        confirmButtonText: 'OK'
    });
}

// ===================== MODAL MANAGEMENT =====================
function initModals() {
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
        openModal('logout-modal');
    });
    
    $('#mobile-logout-trigger').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeMobileNavOnly();
        setTimeout(() => {
            openModal('logout-modal');
        }, 10);
    });
    
    $('#cancel-logout').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal('logout-modal');
    });
    
    $('#close-logout-modal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal('logout-modal');
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

    // Grade input events for auto remarks calculation
    const prelimInput = document.getElementById('prelimGrade');
    const midtermInput = document.getElementById('midtermGrade');
    const finalInput = document.getElementById('finalGrade');
    
    if (prelimInput) {
        prelimInput.addEventListener('input', debouncedCalculateAutoRemarks);
    }
    if (midtermInput) {
        midtermInput.addEventListener('input', debouncedCalculateAutoRemarks);
    }
    if (finalInput) {
        finalInput.addEventListener('input', debouncedCalculateAutoRemarks);
    }
}

// ===================== GRADE EDITING =====================
function openEditModal(enrollmentId, prelim, midterm, finalGrade, remarks, autoRemarks, studentName, className) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    
    document.getElementById('editEnrollmentId').value = enrollmentId;
    document.getElementById('prelimGrade').value = prelim || '';
    document.getElementById('midtermGrade').value = midterm || '';
    document.getElementById('finalGrade').value = finalGrade || '';
    document.getElementById('remarks').value = remarks || 'Competent';
    
    // Display student info
    document.getElementById('studentNameDisplay').textContent = studentName;
    document.getElementById('classNameDisplay').textContent = `Class: ${className}`;
    
    ['prelimGrade', 'midtermGrade', 'finalGrade'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.classList.remove('valid', 'invalid');
        }
    });
    
    currentAutoRemarks = autoRemarks || 'Incomplete';
    updateAutoRemarksDisplay();
    
    document.getElementById('useAutoRemarks').checked = true;
    toggleRemarksSelect();
    
    const loadingEl = document.getElementById('autoRemarksLoading');
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Calculate initial auto remarks
    calculateAutoRemarks();
    
    openModal('editGradeModal');
    
    setTimeout(() => {
        const firstInput = document.getElementById('prelimGrade');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

function debouncedCalculateAutoRemarks() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
    
    const loadingEl = document.getElementById('autoRemarksLoading');
    if (loadingEl) loadingEl.style.display = 'inline-block';
    
    debounceTimer = setTimeout(() => {
        calculateAutoRemarks();
    }, 500);
}

function calculateAutoRemarks() {
    const prelim = parseFloat(document.getElementById('prelimGrade').value) || null;
    const midterm = parseFloat(document.getElementById('midtermGrade').value) || null;
    const final = parseFloat(document.getElementById('finalGrade').value) || null;
    
    const loadingEl = document.getElementById('autoRemarksLoading');
    if (loadingEl) loadingEl.style.display = 'none';
    
    let localRemarks = calculateRemarksLocally(prelim, midterm, final);
    currentAutoRemarks = localRemarks;
    updateAutoRemarksDisplay();
    
    if (document.getElementById('useAutoRemarks').checked) {
        document.getElementById('remarks').value = currentAutoRemarks;
    }
    
    if (prelim !== null && midterm !== null && final !== null) {
        const displayElement = document.getElementById('autoRemarksText');
        const originalText = displayElement.textContent;
        displayElement.innerHTML = `${localRemarks} <small><i class="fas fa-sync-alt fa-spin"></i> Verifying...</small>`;
        
        fetch(window.appUrls.autoRemarksUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prelim_grade: prelim,
                midterm_grade: midterm,
                final_grade: final
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.auto_remarks !== localRemarks) {
                currentAutoRemarks = data.auto_remarks;
                updateAutoRemarksDisplay();
                
                if (document.getElementById('useAutoRemarks').checked) {
                    document.getElementById('remarks').value = currentAutoRemarks;
                }
            }
        })
        .catch(error => {
            console.error('Error verifying auto remarks:', error);
        });
    }
}

function calculateRemarksLocally(prelim, midterm, final) {
    if (prelim === null || midterm === null || final === null) {
        return 'Incomplete';
    }
    
    const average = (prelim + midterm + final) / 3;
    return average >= 75 ? 'Competent' : 'Not yet competent';
}

function updateAutoRemarksDisplay() {
    const displayElement = document.getElementById('autoRemarksText');
    const container = document.getElementById('autoRemarksDisplay');
    
    if (!displayElement || !container) return;
    
    const textOnly = currentAutoRemarks.replace(/<[^>]*>/g, '').trim();
    displayElement.textContent = textOnly;
    
    container.className = 'auto-remarks-display';
    
    if (currentAutoRemarks === 'Competent') {
        container.classList.add('competent');
    } else if (currentAutoRemarks === 'Not yet competent') {
        container.classList.add('not-competent');
    } else if (currentAutoRemarks === 'Incomplete') {
        container.classList.add('incomplete');
    } else if (currentAutoRemarks === 'Dropped') {
        container.classList.add('dropped');
    } else {
        container.classList.add('neutral');
    }
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

function submitGradeEdit() {
    if (isSaving) return;
    
    const enrollmentId = document.getElementById('editEnrollmentId').value;
    const prelim = document.getElementById('prelimGrade').value;
    const midterm = document.getElementById('midtermGrade').value;
    const finalGrade = document.getElementById('finalGrade').value;
    const useAutoRemarks = document.getElementById('useAutoRemarks').checked;
    let remarks = document.getElementById('remarks').value;

    // Validate inputs
    const prelimValid = validateGradeInput(document.getElementById('prelimGrade'));
    const midtermValid = validateGradeInput(document.getElementById('midtermGrade'));
    const finalValid = validateGradeInput(document.getElementById('finalGrade'));
    
    if (!prelimValid || !midtermValid || !finalValid) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Grades',
            text: 'Please fix invalid grade values (must be between 0 and 100)',
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

    // 1. Close modal smoothly
    closeModal('editGradeModal');
    
    // 2. Show loading screen
    setTimeout(() => {
        showLoadingScreen('Saving grade changes...');
        
        // 3. Make AJAX POST to /student_grades/edit
        setTimeout(() => {
            fetch(window.appUrls.editGradeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enrollment_id: enrollmentId,
                    prelim_grade: prelim || null,
                    midterm_grade: midterm || null,
                    final_grade: finalGrade || null,
                    remarks: remarks,
                    use_auto_remarks: useAutoRemarks
                })
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(err => { throw err; });
                }
                return response.json();
            })
            .then(data => {
                // 4. Hide loading screen
                hideLoadingScreen();
                isSaving = false;
                
                // 5. Show success dialog
                Swal.fire({
                    icon: 'success',
                    title: 'Grade Saved Successfully!',
                    html: `
                        <p>Student grades have been updated successfully.</p>
                        <div style="margin-top: 15px; padding: 10px; background-color: #f8fafc; border-radius: 6px; border-left: 4px solid #065f46;">
                            <small style="color: #475569;">
                                <i class="fas fa-info-circle"></i> 
                                Prelim: ${prelim || 'N/A'}, Midterm: ${midterm || 'N/A'}, Final: ${finalGrade || 'N/A'}
                            </small>
                        </div>
                    `,
                    showCancelButton: false,
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#065f46'
                }).then(() => {
                    // Restore save button state
                    if (saveBtn) {
                        saveBtn.innerHTML = originalText;
                        saveBtn.classList.remove('btn-saving');
                        saveBtn.disabled = false;
                    }
                    
                    // Update the specific row in the table
                    updateStudentRowLocally(enrollmentId, prelim, midterm, finalGrade, remarks);
                });
            })
            .catch(error => {
                hideLoadingScreen();
                isSaving = false;
                
                console.error('Error:', error);
                
                // Show error message
                Swal.fire({
                    icon: 'error',
                    title: 'Save Failed',
                    text: error.message || 'Failed to save grade changes. Please try again.',
                    confirmButtonText: 'Try Again',
                    confirmButtonColor: '#b91c1c'
                }).then(() => {
                    // Re-open the edit modal
                    const studentName = document.getElementById('studentNameDisplay').textContent;
                    const className = document.getElementById('classNameDisplay').textContent.replace('Class: ', '');
                    
                    openEditModal(
                        enrollmentId,
                        prelim,
                        midterm,
                        finalGrade,
                        remarks,
                        currentAutoRemarks,
                        studentName,
                        className
                    );
                    
                    // Restore save button
                    if (saveBtn) {
                        saveBtn.innerHTML = originalText;
                        saveBtn.classList.remove('btn-saving');
                        saveBtn.disabled = false;
                    }
                });
            });
        }, 100);
    }, 50);
}

function updateStudentRowLocally(enrollmentId, prelim, midterm, final, remarks) {
    // Find and update the row
    const rows = document.querySelectorAll('#gradesTableBody tr');
    rows.forEach(row => {
        if (row.getAttribute('data-enrollment-id') === enrollmentId) {
            // Update grade cells
            const prelimCell = row.cells[3];
            const midtermCell = row.cells[4];
            const finalCell = row.cells[5];
            const avgRemarksCell = row.cells[6];
            const remarksCell = row.cells[7];
            const statusCell = row.cells[8];
            
            // Update individual grades
            if (prelim) {
                prelimCell.innerHTML = `<span class="grade-value">${prelim}%</span>`;
            } else {
                prelimCell.innerHTML = '<span class="grade-na">N/A</span>';
            }
            
            if (midterm) {
                midtermCell.innerHTML = `<span class="grade-value">${midterm}%</span>`;
            } else {
                midtermCell.innerHTML = '<span class="grade-na">N/A</span>';
            }
            
            if (final) {
                finalCell.innerHTML = `<span class="grade-value">${final}%</span>`;
            } else {
                finalCell.innerHTML = '<span class="grade-na">N/A</span>';
            }
            
            // Update average with remarks
            if (prelim && midterm && final) {
                const avg = ((parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3).toFixed(2);
                const autoRemarks = avg >= 75 ? 'Competent' : 'Not yet competent';
                const avgClass = avg >= 75 ? 'competent' : 'not-competent';
                avgRemarksCell.innerHTML = `<span class="average-with-remarks ${avgClass}">Average ${avg}, ${autoRemarks}</span>`;
            } else {
                avgRemarksCell.innerHTML = `<span class="average-with-remarks incomplete">Average N/A, Incomplete</span>`;
            }
            
            // Update remarks
            if (remarks) {
                remarksCell.innerHTML = `<span class="current-remarks ${remarks.toLowerCase().replace(' ', '-')}">${remarks}</span>`;
            } else {
                remarksCell.innerHTML = `<span class="current-remarks not-set">Not Set</span>`;
            }
            
            // Update enrollment status
            let displayStatus = remarks;
            if (remarks === 'Dropped') {
                displayStatus = 'dropped';
            } else if (remarks === 'Competent') {
                displayStatus = 'Competent';
            } else {
                displayStatus = 'enrolled';
            }
            
            statusCell.innerHTML = `<span class="status-badge status-${displayStatus.toLowerCase()}">${displayStatus}</span>`;
            
            // Update enrollment status attribute
            row.setAttribute('data-status', displayStatus);
            
            // Update certificate button
            const certBtn = row.querySelector('.certificate-btn');
            if (certBtn) {
                const shouldEnable = remarks === 'Competent' || displayStatus === 'completed';
                certBtn.disabled = !shouldEnable;
                certBtn.setAttribute('data-remarks', remarks);
                certBtn.setAttribute('data-enrollment-status', displayStatus);
                
                if (shouldEnable) {
                    certBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        const enrollmentId = this.getAttribute('data-enrollment-id');
                        const studentName = this.getAttribute('data-student-name');
                        const remarks = this.getAttribute('data-remarks');
                        const enrollmentStatus = this.getAttribute('data-enrollment-status');
                        generateCertificate(enrollmentId, studentName, remarks, enrollmentStatus);
                    });
                }
            }
            
            // Update button data attributes
            const editBtn = row.querySelector('.edit-btn');
            if (editBtn) {
                editBtn.setAttribute('data-prelim', prelim || '');
                editBtn.setAttribute('data-midterm', midterm || '');
                editBtn.setAttribute('data-final', final || '');
                editBtn.setAttribute('data-remarks', remarks || '');
                
                // Update auto remarks attribute
                if (prelim && midterm && final) {
                    const avg = (parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3;
                    const autoRemarks = avg >= 75 ? 'Competent' : 'Not yet competent';
                    editBtn.setAttribute('data-auto-remarks', autoRemarks);
                } else {
                    editBtn.setAttribute('data-auto-remarks', 'Incomplete');
                }
            }
        }
    });
}

// ===================== FILE UPLOAD =====================
function initFileUpload() {
    const fileInput = document.getElementById('bulkFileUpload');
    if (fileInput) {
        fileInput.addEventListener('change', function() {
            const fileName = this.files[0] ? this.files[0].name : 'No file chosen';
            document.getElementById('bulkFileName').textContent = fileName;
        });
    }
}

// ===================== GRADE VALIDATION =====================
function initGradeInputValidation() {
    const gradeInputs = ['prelimGrade', 'midtermGrade', 'finalGrade'];
    
    gradeInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('blur', function() {
                validateGradeInput(this);
            });
        }
    });
}

function validateGradeInput(input) {
    const value = parseFloat(input.value);
    if (input.value && (isNaN(value) || value < 0 || value > 100)) {
        input.classList.add('invalid');
        input.classList.remove('valid');
        return false;
    } else if (input.value) {
        input.classList.add('valid');
        input.classList.remove('invalid');
        return true;
    } else {
        input.classList.remove('valid', 'invalid');
        return true;
    }
}

// ===================== UTILITY FUNCTIONS =====================
function showSuccessToast(message) {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    
    const messageSpan = toast.querySelector('.toast-message');
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    toast.style.display = 'flex';
    toast.offsetHeight; // Force reflow
    
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

function showLoadingScreen(message, details = '') {
    $('#loading-message').text(message);
    $('#loading-details').text(details);
    $('#loading-screen').fadeIn(200);
}

function hideLoadingScreen() {
    $('#loading-screen').fadeOut(200);
}

// ===================== PROFILE MODAL =====================
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
                if (cls.days_of_week && Array.isArray(cls.days_of_week)) {
                    scheduleText += ` (${cls.days_of_week.join(', ')})`;
                }
                row.insertCell(1).textContent = scheduleText;
                
                row.insertCell(2).textContent = cls.venue || 'N/A';
                
                let avgGrade = 'N/A';
                if (cls.prelim_grade && cls.midterm_grade && cls.final_grade) {
                    avgGrade = ((parseFloat(cls.prelim_grade) + parseFloat(cls.midterm_grade) + parseFloat(cls.final_grade)) / 3).toFixed(2) + '%';
                }
                row.insertCell(3).textContent = avgGrade;
                
                row.insertCell(4).textContent = cls.remarks || 'N/A';
                row.insertCell(5).textContent = cls.enrollment_status || 'N/A';
                row.insertCell(6).textContent = cls.instructor_name || 'N/A';
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

// ===================== CERTIFICATE GENERATION =====================
function generateCertificate(enrollmentId, studentName, remarks, enrollmentStatus) {
    const canGenerate = remarks === 'Competent' || enrollmentStatus === 'completed' || enrollmentStatus === 'Competent';
    
    if (!canGenerate) {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Generate Certificate',
            html: `<p>Certificate can only be generated for students with "Competent" status or "completed" enrollment.</p>
                   <p><small>Current: Remarks = "${remarks}", Status = "${enrollmentStatus}"</small></p>`,
            confirmButtonText: 'OK'
        });
        return;
    }
    
    Swal.fire({
        title: 'Generate Certificate of Completion',
        html: `<p>Generate certificate for <strong>${studentName}</strong>?</p>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, Generate',
        cancelButtonText: 'Cancel',
        reverseButtons: true
    }).then((result) => {
        if (result.isConfirmed) {
            generateCertificateFile(enrollmentId, studentName);
        }
    });
}

function generateCertificateFile(enrollmentId, studentName) {
    showLoadingScreen('Generating certificate...');
    
    const formData = new FormData();
    formData.append('enrollment_id', enrollmentId);
    
    fetch(window.appUrls.generateCertUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoadingScreen();
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Certificate Generated!',
                html: `
                    <p>Certificate generated successfully!</p>
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

// ===================== CLEANUP =====================
window.addEventListener('beforeunload', function() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
});