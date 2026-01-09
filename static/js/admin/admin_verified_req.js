// Modal instances
let currentStudentId = null;
let currentDocument = null;

// Format date from GMT string to readable format
function formatDate(dateString) {
    if (!dateString) return 'Not specified';
    
    try {
        // Try to parse the date string
        const date = new Date(dateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }
        
        // Format to "Month Day, Year"
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString; // Return original if error
    }
}

$(document).ready(function() {
    // Initialize all functionality
    init();
    
    const studentDetailsModal = $('#studentDetailsModal');
    const studentProfilePicture = $('#studentProfilePicture');
    const studentName = $('#studentName');
    const studentEmail = $('#studentEmail');
    const studentStatus = $('#studentStatus');
    const studentDetailsContent = $('#studentDetailsContent');
    const documentList = $('#documentList');
    const documentViewer = $('#documentViewer');
    const documentPreviewContainer = $('#documentPreviewContainer');
    const verificationActions = $('#verificationActions');
    
    // Tab elements
    const documentTabs = $('.document-tab');
    const previewTab = $('#previewTab');
    const listTab = $('#listTab');
    const documentCount = $('#documentCount');
    const uploadedCount = $('#uploadedCount');
    
    let currentPage = 1;
    let searchQuery = '';
    let statusFilter = '';
    let uploadedDocumentsCount = 0;

    // Load data dynamically
    function loadData(page = 1) {
        $('.loading-spinner').show();
        $('.stats-overview').hide();
        $('.table-section').hide();
        
        const params = { 
            page: page,
            search: searchQuery,
            status: statusFilter
        };
        
        $.getJSON(window.appUrls.fetchData, params, function (data) {
            if (data.stats) {
                updateStats(data.stats);
            } else {
                // If no stats in main response, fetch them separately
                loadStats();
            }
            
            renderTable(data.students);
            renderPagination(data.total_pages, data.current_page);
            
            // Show content after loading
            setTimeout(function() {
                $('.loading-spinner').hide();
                $('.stats-overview').fadeIn();
                $('.table-section').fadeIn();
                $('#searchSection').fadeIn();
            }, 500);
        }).fail((xhr, status, error) => {
            console.error('Error loading data:', error);
            $('#studentsTableBody').html('<tr><td colspan="5" style="text-align:center;color:red;">Error loading data.</td></tr>');
            $('.loading-spinner').hide();
            $('.stats-overview').show();
            $('.table-section').show();
            $('#searchSection').show();
            
            // Try to load stats separately if main request fails
            loadStats();
        });
    }

    // Load statistics separately
    function loadStats() {
        $.getJSON(window.appUrls.getStats, function(stats) {
            updateStats(stats);
        }).fail((xhr, status, error) => {
            console.error('Error loading stats:', error);
            // Set default values if stats fail to load
            updateStats({
                pending: 0,
                verified: 0,
                rejected: 0,
                total: 0
            });
        });
    }

    // Update statistics
    function updateStats(stats) {
        if (stats) {
            console.log('Updating stats with:', stats); // Debug log
            
            // Ensure we have numbers, not undefined
            const pending = parseInt(stats.pending) || 0;
            const verified = parseInt(stats.verified) || 0;
            const rejected = parseInt(stats.rejected) || 0;
            const total = parseInt(stats.total) || 0;
            
            console.log(`Parsed stats - Pending: ${pending}, Verified: ${verified}, Rejected: ${rejected}, Total: ${total}`);
            
            animateValue('pending-count', pending, 0);
            animateValue('verified-count', verified, 100);
            animateValue('rejected-count', rejected, 200);
            animateValue('total-count', total, 300);
            
            // Show stats container
            $('.stats-overview').show();
        } else {
            console.error('No stats data received');
        }
    }

    // Animation function for numbers
    function animateValue(id, target, delay = 0) {
        setTimeout(function() {
            const obj = document.getElementById(id);
            if (!obj) {
                console.error('Element not found:', id);
                return;
            }
            
            let current = 0;
            const duration = 1000;
            const increment = target / (duration / 20);
            const startTime = Date.now();
            
            function update() {
                const elapsed = Date.now() - startTime;
                current = Math.min(target, (elapsed / duration) * target);
                
                obj.innerHTML = Math.floor(current);
                
                if (current < target) {
                    requestAnimationFrame(update);
                } else {
                    obj.innerHTML = target;
                }
            }
            
            update();
        }, delay);
    }

    // Render table with profile pictures
    function renderTable(students) {
        const tbody = $('#studentsTableBody');
        tbody.empty();

        if (students.length === 0) {
            tbody.html('<tr><td colspan="5" style="text-align:center;color:#64748b;padding:2rem;">No student records found.</td></tr>');
            return;
        }

        students.forEach((s, index) => {
            // Get status badge based on verification status
            let statusBadge = '';
            if (s.verified === 'verified') {
                statusBadge = `<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>`;
            } else if (s.verified === 'rejected') {
                statusBadge = `<span class="rejected-badge"><i class="fas fa-times-circle"></i> Rejected</span>`;
            } else {
                statusBadge = `<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>`;
            }

            // Check if student has uploaded requirements
            if (!s.user_id || s.document_count === 0) {
                // Student hasn't uploaded requirements yet
                
                // Get profile picture URL
                const profilePicture = s.profile_picture || 'default.png';
                const profilePictureUrl = `${window.appUrls.staticProfilePath}${profilePicture}`;
                
                // Student profile cell with picture
                const profileCell = `
                    <div class="student-profile-cell">
                        <img src="${profilePictureUrl}" alt="${s.full_name}" class="student-avatar">
                        <div class="student-info">
                            <div class="student-name">${s.full_name}</div>
                            <div class="student-username">${s.username}</div>
                        </div>
                    </div>
                `;

                // Only show profile button for rejected students
                let actionHTML = '';
                if (s.verified === 'rejected') {
                    actionHTML = `
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-profile view-student-details" data-user="${s.user_id || '0'}" title="View Student Details">
                                <i class="fas fa-user-circle"></i> Profile
                            </button>
                        </div>
                    `;
                } else {
                    actionHTML = `
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <button class="btn-profile view-student-details" data-user="${s.user_id || '0'}" title="View Student Details">
                                <i class="fas fa-user-circle"></i> Profile
                            </button>
                            <span style="color: #64748b; font-size: 0.85rem;">No documents</span>
                        </div>
                    `;
                }

                tbody.append(`
                    <tr>
                        <td>${profileCell}</td>
                        <td>${s.email}</td>
                        <td>${statusBadge}</td>
                        <td><span style="color: #64748b; font-size: 0.85rem;">No documents uploaded yet</span></td>
                        <td>${actionHTML}</td>
                    </tr>
                `);
                return; // Skip to next student
            }
            
            // Student has uploaded requirements
            let filesHTML = '<div class="documents-list">';
            // Only show fields that actually exist in student_requirements
            const fields = [
                {key: 'barangay_clearance', name: 'Barangay Clearance'},
                {key: 'medical_certificate', name: 'Medical Certificate'},
                {key: 'valid_id', name: 'Valid ID'},
                {key: 'transcript_form', name: 'Transcript Form'},
                {key: 'marriage_certificate', name: 'Marriage Certificate'}
            ];
            
            let fileCount = 0;
            fields.forEach(field => {
                if (s[field.key]) {
                    fileCount++;
                    filesHTML += `
                        <button class="btn-view" 
                                data-file="${s[field.key]}" 
                                data-user="${s.user_id}"
                                data-field="${field.key}"
                                title="${field.name}">
                            <i class="fas fa-file"></i>
                            <span class="tooltip">${field.name}</span>
                        </button>`;
                }
            });

            if (fileCount === 0) {
                filesHTML = '<span style="color:#64748b;font-size:0.85rem;">No documents uploaded</span>';
            } else {
                filesHTML += '</div>';
            }

            // Get profile picture URL
            const profilePicture = s.profile_picture || 'default.png';
            const profilePictureUrl = `${window.appUrls.staticProfilePath}${profilePicture}`;
            
            // Student profile cell with picture
            const profileCell = `
                <div class="student-profile-cell">
                    <img src="${profilePictureUrl}" alt="${s.full_name}" class="student-avatar">
                    <div class="student-info">
                        <div class="student-name">${s.full_name}</div>
                        <div class="student-username">${s.username}</div>
                    </div>
                </div>
            `;

            // SIMPLIFIED: Only show profile button in table
            const actionHTML = `
                <div class="action-buttons">
                    <button class="btn-profile view-student-details" data-user="${s.user_id}" title="View Student Details">
                        <i class="fas fa-user-circle"></i> Profile
                    </button>
                </div>
            `;

            tbody.append(`
                <tr>
                    <td>${profileCell}</td>
                    <td>${s.email}</td>
                    <td>${statusBadge}</td>
                    <td>${filesHTML}</td>
                    <td>${actionHTML}</td>
                </tr>
            `);
        });

        bindTableEvents();
    }

    // Render pagination
    function renderPagination(totalPages, current) {
        const pagination = $('#pagination');
        pagination.empty();

        if (totalPages <= 1) return;

        // Previous button
        if (current > 1) {
            pagination.append(`<a href="#" data-page="${current - 1}"><i class="fas fa-chevron-left"></i></a>`);
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - 1 && i <= current + 1)) {
                pagination.append(`<a href="#" class="${i === current ? 'active' : ''}" data-page="${i}">${i}</a>`);
            } else if (i === current - 2 || i === current + 2) {
                pagination.append('<span style="padding:8px 12px;color:#64748b;">...</span>');
            }
        }

        // Next button
        if (current < totalPages) {
            pagination.append(`<a href="#" data-page="${current + 1}"><i class="fas fa-chevron-right"></i></a>`);
        }

        $('.pagination a').off('click').on('click', function (e) {
            e.preventDefault();
            currentPage = parseInt($(this).data('page'));
            loadData(currentPage);
            
            // Scroll to top of table
            $('html, body').animate({
                scrollTop: $('.table-section').offset().top - 100
            }, 300);
        });
    }

    // Bind events
    function bindTableEvents() {
        // View student details
        $('.view-student-details').on('click', function () {
            const userId = $(this).data('user');
            currentStudentId = userId;
            window.currentStudentId = userId;
            
            // Only load details if we have a valid user ID
            if (userId && userId !== '0') {
                loadStudentDetails(userId);
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'No Documents',
                    text: 'This student has not uploaded any documents yet.',
                    confirmButtonText: 'OK',
                    ...window.swalConfig
                });
            }
        });

        // Document view buttons in table (small view)
        $('.btn-view').on('click', function(e) {
            e.stopPropagation();
            const userId = $(this).data('user');
            currentStudentId = userId;
            window.currentStudentId = userId;
            
            if (userId && userId !== '0') {
                loadStudentDetails(userId, {
                    filename: $(this).data('file'),
                    fieldName: $(this).data('field')
                });
            }
        });
    }

    // Load student details
    function loadStudentDetails(userId, documentToPreview = null) {
        // Show loading state
        studentDetailsContent.html(`
            <div class="loading-spinner" style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <span>Loading student details...</span>
            </div>
        `);
        
        // Reset document preview
        documentList.empty();
        documentViewer.hide();
        $('.no-document-selected').show();
        
        // Hide verification actions initially
        verificationActions.hide();
        
        // Reset tab to preview tab by default
        switchTab('preview');
        
        studentDetailsModal.fadeIn();
        
        $.getJSON(window.appUrls.studentDetails.replace('0', userId), function(response) {
            if (response.success) {
                const student = response.student;
                
                // Update profile picture
                const profilePicture = student.profile_picture || 'default.png';
                studentProfilePicture.attr('src', `${window.appUrls.staticProfilePath}${profilePicture}`);
                
                // Update name and email
                studentName.text(student.full_name);
                studentEmail.text(student.email);
                
                // Update status
                if (student.verified === 'verified') {
                    studentStatus.html('<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>');
                } else if (student.verified === 'rejected') {
                    studentStatus.html('<span class="rejected-badge"><i class="fas fa-times-circle"></i> Rejected</span>');
                } else {
                    studentStatus.html('<span class="pending-badge"><i class="fas fa-clock"></i> Pending Verification</span>');
                    // Show verification actions only for pending status
                    verificationActions.show();
                }
                
                // Format date of birth
                const formattedDateOfBirth = formatDate(student.date_of_birth);
                
                // Build student details HTML - REMOVED Account Information section
                let detailsHtml = `
                    <!-- Personal Information -->
                    <div class="student-detail-section">
                        <h4><i class="fas fa-id-card"></i> Personal Information</h4>
                        <div class="student-detail-grid">
                            <div class="student-detail-item">
                                <div class="student-detail-label">Full Name</div>
                                <div class="student-detail-value">${student.full_name}</div>
                            </div>
                            <div class="student-detail-item">
                                <div class="student-detail-label">Gender</div>
                                <div class="student-detail-value">${student.gender || 'Not specified'}</div>
                            </div>
                            <div class="student-detail-item">
                                <div class="student-detail-label">Date of Birth</div>
                                <div class="student-detail-value">${formattedDateOfBirth}</div>
                            </div>
                            <div class="student-detail-item">
                                <div class="student-detail-label">Contact Number</div>
                                <div class="student-detail-value">${student.contact_number || 'Not provided'}</div>
                            </div>
                            <div class="student-detail-item">
                                <div class="student-detail-label">Address</div>
                                <div class="student-detail-value">${student.full_address || 'Not provided'}</div>
                            </div>
                `;
                
                // Add username if available
                if (student.username) {
                    detailsHtml += `
                            <div class="student-detail-item">
                                <div class="student-detail-label">Username</div>
                                <div class="student-detail-value">${student.username}</div>
                            </div>
                    `;
                }
                
                // Add account status if available
                if (student.account_status) {
                    detailsHtml += `
                            <div class="student-detail-item">
                                <div class="student-detail-label">Account Status</div>
                                <div class="student-detail-value">${student.account_status === 'active' ? 'Active' : 'Inactive'}</div>
                            </div>
                    `;
                }
                
                detailsHtml += `
                        </div>
                    </div>
                `;
                
                // Add additional notes if they exist
                if (student.additional_notes) {
                    detailsHtml += `
                        <div class="student-detail-section">
                            <h4><i class="fas fa-sticky-note"></i> Additional Notes</h4>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #0d6efd; max-height: 200px; overflow-y: auto;">
                                <p style="margin: 0; color: #495057; white-space: pre-line;">${student.additional_notes}</p>
                            </div>
                        </div>
                    `;
                }
                
                studentDetailsContent.html(detailsHtml);
                
                // Load documents list
                loadDocumentsList(student, documentToPreview);
                
            } else {
                studentDetailsContent.html(`
                    <div class="error-message" style="text-align: center; padding: 2rem; color: var(--error-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Error loading student details: ${response.error || 'Unknown error'}</p>
                    </div>
                `);
            }
        }).fail(() => {
            studentDetailsContent.html(`
                <div class="error-message" style="text-align: center; padding: 2rem; color: var(--error-red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Failed to load student details. Please try again.</p>
                </div>
            `);
        });
    }

    // Switch between tabs
    function switchTab(tabName) {
        // Update tab buttons
        documentTabs.removeClass('active');
        $(`.document-tab[data-tab="${tabName}"]`).addClass('active');
        
        // Update tab content
        $('.tab-pane').removeClass('active');
        $(`#${tabName}Tab`).addClass('active');
        
        // If switching to preview tab and a document is selected, show it
        if (tabName === 'preview' && currentDocument) {
            // Preview will be shown automatically since document is already selected
        }
    }

    // Load documents list
    function loadDocumentsList(student, documentToPreview = null) {
        documentList.empty();
        uploadedDocumentsCount = 0;
        
        // Document fields - only show fields that students actually upload
        const documentFields = [
            {key: 'barangay_clearance', name: 'Barangay Clearance', icon: 'fa-file-contract'},
            {key: 'medical_certificate', name: 'Medical Certificate', icon: 'fa-file-medical'},
            {key: 'valid_id', name: 'Valid ID', icon: 'fa-id-badge'},
            {key: 'transcript_form', name: 'Transcript Form', icon: 'fa-file-signature'},
            {key: 'marriage_certificate', name: 'Marriage Certificate', icon: 'fa-ring'}
        ];
        
        documentFields.forEach(field => {
            if (student[field.key]) {
                uploadedDocumentsCount++;
                const docItem = $(`
                    <div class="document-item" data-file="${student[field.key]}" data-field="${field.key}">
                        <div class="document-info">
                            <div class="document-icon">
                                <i class="fas ${field.icon}"></i>
                            </div>
                            <div class="document-details">
                                <h5>${field.name}</h5>
                                <p>${student[field.key].split('/').pop()}</p>
                            </div>
                        </div>
                        <div class="document-actions">
                            <button class="btn btn-primary btn-view-document" 
                                    data-file="${student[field.key]}" 
                                    data-field="${field.key}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    </div>
                `);
                
                documentList.append(docItem);
                
                // Bind click event for document item
                docItem.on('click', function(e) {
                    if (!$(e.target).closest('.btn-view-document').length) {
                        const filename = $(this).data('file');
                        const fieldName = $(this).data('field');
                        previewDocument(filename, fieldName, student);
                        switchTab('preview');
                    }
                });
                
                // Bind click event for view button
                docItem.find('.btn-view-document').on('click', function(e) {
                    e.stopPropagation();
                    const filename = $(this).data('file');
                    const fieldName = $(this).data('field');
                    previewDocument(filename, fieldName, student);
                    switchTab('preview');
                });
            }
        });
        
        // Update document counts
        documentCount.text(uploadedDocumentsCount);
        uploadedCount.text(`${uploadedDocumentsCount} document${uploadedDocumentsCount !== 1 ? 's' : ''}`);
        
        if (uploadedDocumentsCount === 0) {
            documentList.html('<p style="text-align: center; color: #64748b; padding: 2rem;">No documents uploaded yet</p>');
        }
        
        // Auto-preview document if specified
        if (documentToPreview && documentToPreview.filename) {
            setTimeout(() => {
                previewDocument(documentToPreview.filename, documentToPreview.fieldName, student);
            }, 500);
        }
    }

    // Preview document within the modal
    function previewDocument(filename, fieldName, student) {
        if (!filename) return;
        
        // Show loading state
        documentViewer.html(`
            <div class="loading-spinner" style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <span>Loading document...</span>
            </div>
        `).show();
        $('.no-document-selected').hide();
        
        // Highlight active document item
        $('.document-item').removeClass('active');
        $(`.document-item[data-file="${filename}"]`).addClass('active');
        
        // Store current document
        currentDocument = { filename, fieldName };
        
        // First, get document information to determine the document type
        $.getJSON(`${window.appUrls.documentInfo.replace('/0/', `/${student.user_id}/`)}${fieldName}`, function(docInfo) {
            const documentType = docInfo.document_type || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            
            // Now load the file preview
            $.getJSON(`${window.appUrls.previewFile}${filename}`, function (data) {
                if (data.error) {
                    documentViewer.html(`
                        <div class="document-fallback">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                            <h4>Error Loading Document</h4>
                            <p>${data.error}</p>
                        </div>
                    `);
                    return;
                }
                
                const ext = filename.split('.').pop().toLowerCase();
                const fileUrl = data.file_url;

                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                    documentViewer.html(`<img src="${fileUrl}" alt="${documentType}" class="document-image">`);
                } else if (['pdf'].includes(ext)) {
                    documentViewer.html(`<iframe src="${fileUrl}" title="${documentType}" class="document-iframe"></iframe>`);
                } else if (['doc', 'docx'].includes(ext)) {
                    documentViewer.html(`
                        <div class="document-fallback">
                            <i class="fas fa-file-word" style="color: #2b579a;"></i>
                            <h4>${documentType}</h4>
                            <p>Word documents cannot be previewed in the browser.</p>
                            <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                <i class="fas fa-download"></i> Download File
                            </a>
                        </div>
                    `);
                } else {
                    documentViewer.html(`
                        <div class="document-fallback">
                            <i class="fas fa-file-download" style="color: var(--tesda-blue);"></i>
                            <h4>${documentType}</h4>
                            <p>This file type cannot be previewed in the browser.</p>
                            <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                <i class="fas fa-download"></i> Download File
                            </a>
                        </div>
                    `);
                }
            }).fail((xhr, status, error) => {
                documentViewer.html(`
                    <div class="document-fallback">
                        <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                        <h4>Error Loading Document</h4>
                        <p>Failed to load document preview.</p>
                    </div>
                `);
            });
            
        }).fail(() => {
            // Fallback if document info fails
            const documentType = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            documentViewer.html(`
                <div class="document-fallback">
                    <i class="fas fa-file-alt" style="color: var(--tesda-blue);"></i>
                    <h4>${documentType}</h4>
                    <p>Loading document preview...</p>
                </div>
            `);
        });
    }

    // Close student details modal
    function closeStudentDetailsModal() {
        studentDetailsModal.fadeOut();
        currentStudentId = null;
        currentDocument = null;
        
        // Reset to preview tab
        switchTab('preview');
        documentViewer.hide();
        $('.no-document-selected').show();
        $('.document-item').removeClass('active');
    }

    // Verify student from details modal
    $('#verifyStudentBtn').on('click', function() {
        if (!currentStudentId) return;
        
        // Close student details modal first, then show approval confirmation
        closeStudentDetailsModal();
        setTimeout(() => {
            showApprovalConfirmation();
        }, 300); // Small delay to ensure modal is fully closed
    });

    // Reject student from details modal
    $('#rejectStudentBtn').on('click', function() {
        if (!currentStudentId) return;
        
        // Close student details modal first, then show rejection reason modal
        closeStudentDetailsModal();
        setTimeout(() => {
            showRejectionReasonModal();
        }, 300); // Small delay to ensure modal is fully closed
    });

    // Tab switching
    documentTabs.on('click', function() {
        const tabName = $(this).data('tab');
        switchTab(tabName);
    });

    // Close student details modal
    $('#closeStudentDetailsModal').on('click', closeStudentDetailsModal);
    $('#close-student-details-modal').on('click', closeStudentDetailsModal);
    
    $(window).on('click', (e) => { 
        if ($(e.target).is(studentDetailsModal)) closeStudentDetailsModal();
    });

    // Search and filter functionality
    $('#search-input').on('input', function() {
        searchQuery = $(this).val().trim();
        currentPage = 1;
        loadData(currentPage);
    });

    $('#status-filter').on('change', function() {
        statusFilter = $(this).val();
        currentPage = 1;
        loadData(currentPage);
    });

    // Auto-load
    loadData();
});

// Initialize all functionality
function init() {
    initMobileNavigation();
    initModals();
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

// Initialize modal functionality - CONSISTENT WITH ADMIN HOMEPAGE
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

    // Logout Modal - CONSISTENT WITH ADMIN HOMEPAGE
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

    // Student details modal close buttons
    $('#closeStudentDetailsModal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#studentDetailsModal').fadeOut();
    });
    
    $('#close-student-details-modal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#studentDetailsModal').fadeOut();
    });

    // Close alert when X is clicked (if you add alerts later)
    $('.close-alert').click(function() {
        $('#status-message').fadeOut();
    });
}

// SweetAlert2 Functions
function showLoading(message) {
    $('#loadingText').text(message || 'Processing...');
    $('#loadingOverlay').fadeIn();
}

function hideLoading() {
    $('#loadingOverlay').fadeOut();
}

function showSuccessAlert(title, message, showEmailNotification = false) {
    let html = `<div style="text-align: center;">
        <p style="margin-bottom: 15px;">${message}</p>`;
    
    if (showEmailNotification) {
        html += `<div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 10px; margin-top: 10px; color: #065f46; font-size: 0.9rem;">
            <i class="fas fa-check-circle" style="margin-right: 5px;"></i> Notification email sent successfully
        </div>`;
    }
    
    html += `</div>`;
    
    Swal.fire({
        icon: 'success',
        title: title || 'Success',
        html: html,
        confirmButtonText: 'OK',
        ...window.swalConfig
    }).then(() => {
        // Reload data after success
        window.location.reload();
    });
}

function showErrorAlert(title, message) {
    Swal.fire({
        icon: 'error',
        title: title || 'Error',
        text: message,
        confirmButtonText: 'OK',
        ...window.swalConfig
    });
}

function showInfoAlert(title, message) {
    Swal.fire({
        icon: 'info',
        title: title || 'Information',
        text: message,
        confirmButtonText: 'OK',
        ...window.swalConfig
    });
}

function showApprovalConfirmation() {
    Swal.fire({
        title: 'Confirm Verification',
        html: `
            <div style="text-align: center;">
                <i class="fas fa-check-circle" style="font-size: 3rem; color: #15803d; margin-bottom: 15px;"></i>
                <p style="margin-bottom: 15px;">Are you sure you want to verify this student's documents? They will be able to enroll in courses.</p>
                <p style="color: #64748b; font-size: 0.9rem;">
                    <i class="fas fa-envelope"></i> An approval notification email will be sent to the student.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, Verify Student',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#15803d',
        cancelButtonColor: '#6c757d',
        ...window.swalConfig
    }).then((result) => {
        if (result.isConfirmed) {
            approveStudent();
        }
    });
}

function showRejectionReasonModal() {
    Swal.fire({
        title: 'Rejection Reason Required',
        html: `
            <div style="text-align: left;">
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #334155;">
                        <i class="fas fa-comment-dots" style="margin-right: 5px;"></i> Please provide a reason for rejecting this verification:
                    </label>
                    <textarea id="swalRejectionReason" 
                              style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-family: inherit; font-size: 0.95rem; resize: vertical; min-height: 120px;"
                              placeholder="Explain why the documents are being rejected. For example: 'ID is expired', 'Medical certificate is unclear', 'Missing required information', etc."
                              maxlength="500"></textarea>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 5px;">
                        <div style="font-size: 0.85rem; color: #64748b;">
                            <span id="swalCharCount">0</span> / 500 characters
                        </div>
                        <div id="swalValidation" style="font-size: 0.85rem; color: #b91c1c; display: none;">
                            <i class="fas fa-exclamation-triangle" style="margin-right: 3px;"></i> <span id="swalValidationText"></span>
                        </div>
                    </div>
                </div>
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 10px;">
                    <i class="fas fa-envelope"></i> This reason will be included in the rejection email sent to the student.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Submit Rejection',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#b91c1c',
        cancelButtonColor: '#6c757d',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            const reason = document.getElementById('swalRejectionReason').value.trim();
            
            if (!reason) {
                Swal.showValidationMessage('Please provide a rejection reason');
                return false;
            }
            
            if (reason.length < 10) {
                Swal.showValidationMessage('Please provide a more detailed reason (minimum 10 characters)');
                return false;
            }
            
            return reason;
        },
        ...window.swalConfig
    }).then((result) => {
        if (result.isConfirmed && result.value) {
            rejectStudentWithReason(result.value);
        }
    });
    
    // Add character counter for SweetAlert textarea
    const textarea = document.getElementById('swalRejectionReason');
    const charCount = document.getElementById('swalCharCount');
    
    if (textarea && charCount) {
        textarea.addEventListener('input', function() {
            const count = this.value.length;
            charCount.textContent = count;
            
            if (count === 0) {
                Swal.enableButtons();
                Swal.showValidationMessage('Please provide a rejection reason');
            } else if (count < 10) {
                Swal.enableButtons();
                Swal.showValidationMessage('Please provide a more detailed reason (minimum 10 characters)');
            } else {
                Swal.resetValidationMessage();
            }
        });
    }
}

// Approve student function
function approveStudent() {
    if (!window.currentStudentId) return;
    
    showLoading('Approving student and sending email...');
    
    $.ajax({
        url: window.appUrls.acceptVerification.replace('0', window.currentStudentId),
        type: 'POST',
        success: function(response) {
            hideLoading();
            
            if (response.success) {
                // Show success alert with email notification
                showSuccessAlert(
                    'Verification Approved',
                    response.message,
                    response.email_sent
                );
            } else {
                showErrorAlert('Verification Failed', response.message || 'Error verifying student');
            }
        },
        error: function(xhr, status, error) {
            hideLoading();
            
            let errorMessage = 'Error verifying student';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage += ': ' + xhr.responseJSON.message;
            } else {
                errorMessage += ': ' + error;
            }
            
            showErrorAlert('Verification Failed', errorMessage);
        }
    });
}

// Reject student with reason function
function rejectStudentWithReason(rejectionReason) {
    if (!window.currentStudentId) return;
    
    showLoading('Rejecting verification and sending email...');
    
    $.ajax({
        url: window.appUrls.rejectVerification.replace('0', window.currentStudentId),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            rejection_reason: rejectionReason
        }),
        success: function(response) {
            hideLoading();
            
            if (response.success) {
                // Show success alert with email notification
                showSuccessAlert(
                    'Verification Rejected',
                    response.message,
                    response.email_sent
                );
            } else {
                showErrorAlert('Rejection Failed', response.message || 'Error rejecting verification');
            }
        },
        error: function(xhr, status, error) {
            hideLoading();
            
            let errorMessage = 'Error rejecting verification';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage += ': ' + xhr.responseJSON.message;
            } else {
                errorMessage += ': ' + error;
            }
            
            showErrorAlert('Rejection Failed', errorMessage);
        }
    });
}

// Handle window resize
$(window).on('resize', function() {
    // Adjust modal content if needed
    const studentDetailsModal = $('#studentDetailsModal');
    
    if (studentDetailsModal.is(':visible')) {
        // You can add responsive adjustments here if needed
    }
});