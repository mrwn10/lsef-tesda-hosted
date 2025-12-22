// ===================== SMOOTH UX FIXES =====================
// Global variables
let currentAutoRemarks = '';
let debounceTimer = null;
let isModalClosing = false;
let currentOpenModal = null;
let isSaving = false;

// Smooth toast notification
function showSuccessToast(message) {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    
    const messageSpan = toast.querySelector('.toast-message');
    if (messageSpan) {
        messageSpan.textContent = message;
    }
    
    toast.style.display = 'flex';
    
    // Force reflow for smooth animation
    toast.offsetHeight;
    
    // Show with animation
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Auto hide after 2 seconds
    setTimeout(() => {
        hideSuccessToast();
    }, 2000);
}

function hideSuccessToast() {
    const toast = document.getElementById('success-toast');
    if (!toast) return;
    
    toast.classList.remove('show');
    
    // Wait for animation to complete before hiding
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

// Debounced auto-remarks calculation
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

// Calculate auto remarks
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
        
        fetch('/staff_student/get_auto_remarks', {
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

// Local remarks calculation
function calculateRemarksLocally(prelim, midterm, final) {
    if (prelim === null || midterm === null || final === null) {
        return 'Incomplete';
    }
    
    const average = (prelim + midterm + final) / 3;
    return average >= 75 ? 'Passed' : 'Failed';
}

// Initialize all functionality
function init() {
    initMobileNavigation();
    initModals();
    initFileUpload();
    initGradeInputValidation();
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

// Initialize all modal functionality
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
}

// Open edit modal
function openEditModal(enrollmentId, prelim, midterm, finalGrade, remarks, autoRemarks) {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
    }
    
    document.getElementById('editEnrollmentId').value = enrollmentId;
    document.getElementById('prelimGrade').value = prelim || '';
    document.getElementById('midtermGrade').value = midterm || '';
    document.getElementById('finalGrade').value = finalGrade || '';
    document.getElementById('remarks').value = remarks || 'Passed';
    
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
    
    const prelimInput = document.getElementById('prelimGrade');
    const midtermInput = document.getElementById('midtermGrade');
    const finalInput = document.getElementById('finalGrade');
    
    if (prelimInput) {
        prelimInput.oninput = debouncedCalculateAutoRemarks;
    }
    if (midtermInput) {
        midtermInput.oninput = debouncedCalculateAutoRemarks;
    }
    if (finalInput) {
        finalInput.oninput = debouncedCalculateAutoRemarks;
    }
    
    openModal('editGradeModal');
    
    setTimeout(() => {
        const firstInput = document.getElementById('prelimGrade');
        if (firstInput) {
            firstInput.focus();
        }
    }, 100);
}

function updateAutoRemarksDisplay() {
    const displayElement = document.getElementById('autoRemarksText');
    const container = document.getElementById('autoRemarksDisplay');
    
    if (!displayElement || !container) return;
    
    const textOnly = currentAutoRemarks.replace(/<[^>]*>/g, '').trim();
    displayElement.textContent = textOnly;
    
    container.className = 'auto-remarks-display';
    
    if (currentAutoRemarks === 'Passed' || currentAutoRemarks === 'Completed') {
        container.classList.add('passed');
    } else if (currentAutoRemarks === 'Failed') {
        container.classList.add('failed');
    } else if (currentAutoRemarks === 'Incomplete') {
        container.classList.add('incomplete');
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

// SMOOTH SUBMIT FUNCTION - Updated to match certificate generation success behavior
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

    // 1. First, close modal smoothly
    closeModal('editGradeModal');
    
    // 2. Show loading screen briefly
    setTimeout(() => {
        showLoadingScreen('Saving grade changes...');
        
        // 3. Make API call
        setTimeout(() => {
            fetch('/staff_student/edit_grade', {
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
                
                // 5. Show success dialog (SAME AS CERTIFICATE GENERATION)
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
                    
                    // Update the specific row in the table without reloading the page
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
                    // Re-open the edit modal so user can try again
                    openEditModal(
                        enrollmentId,
                        prelim,
                        midterm,
                        finalGrade,
                        remarks,
                        currentAutoRemarks
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

// Update student row locally without page reload
function updateStudentRowLocally(enrollmentId, prelim, midterm, final, remarks) {
    // Find the row with matching enrollment_id
    const rows = document.querySelectorAll('.class-table tbody tr');
    rows.forEach(row => {
        const editBtn = row.querySelector('.edit-btn');
        if (editBtn && editBtn.getAttribute('onclick')) {
            // Extract enrollmentId from onclick attribute
            const match = editBtn.getAttribute('onclick').match(/openEditModal\('([^']+)'/);
            if (match && match[1] === enrollmentId) {
                // Update grade cells
                const gradeCell = row.children[2];
                if (prelim && midterm && final) {
                    const avg = ((parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3).toFixed(2);
                    gradeCell.innerHTML = `<span class="grade-value">${avg}%</span>`;
                } else {
                    gradeCell.innerHTML = '<span class="grade-na">N/A</span>';
                }
                
                // Update current remarks
                const remarksCell = row.children[4];
                if (remarks) {
                    remarksCell.innerHTML = `<span class="current-remarks ${remarks.toLowerCase()}">${remarks}</span>`;
                }
                
                // Update auto remarks based on new grades
                const autoRemarksCell = row.children[3];
                if (prelim && midterm && final) {
                    const avg = (parseFloat(prelim) + parseFloat(midterm) + parseFloat(final)) / 3;
                    const autoRemarks = avg >= 75 ? 'Passed' : 'Failed';
                    autoRemarksCell.innerHTML = `<span class="auto-remarks ${autoRemarks.toLowerCase()}">${autoRemarks}</span>`;
                } else {
                    autoRemarksCell.innerHTML = `<span class="auto-remarks incomplete">Incomplete</span>`;
                }
                
                // Update completion button status
                const completionBtn = row.querySelector('.completion-btn');
                if (completionBtn) {
                    completionBtn.disabled = remarks !== 'Completed';
                }
            }
        }
    });
}

function openProfileModal(userId) {
    showLoadingScreen('Loading student profile...');
    
    fetch(`/staff_student_profile/${userId}`)
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
            
            // FIXED: Use same path structure as subnav with proper fallback
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
                row.insertCell(5).textContent = cls.status || 'N/A';
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

// Certificate functions
function generatePrivateCompletion(enrollmentId, studentName, remarks) {
    if (remarks !== 'Completed') {
        Swal.fire({
            icon: 'warning',
            title: 'Cannot Generate Certificate',
            text: 'Certificate can only be generated for students with "Completed" status',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    Swal.fire({
        title: 'Generate Certificate of Completion',
        html: `<p>Generate private completion certificate for <strong>${studentName}</strong>?</p>`,
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
    
    fetch('/generate_private_completion', {
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