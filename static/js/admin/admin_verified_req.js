// Modal instances
let fileModal = null;
let currentStudentId = null;

$(document).ready(function() {
    // Initialize all functionality
    init();
    
    const fileModal = $('#fileModal');
    const fileViewer = $('#fileViewer');
    const modalTitle = $('#modal-title');
    
    const studentDetailsModal = $('#studentDetailsModal');
    const studentProfilePicture = $('#studentProfilePicture');
    const studentName = $('#studentName');
    const studentEmail = $('#studentEmail');
    const studentStatus = $('#studentStatus');
    const studentDetailsContent = $('#studentDetailsContent');
    
    let currentPage = 1;
    let searchQuery = '';
    let statusFilter = '';

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
            const total = parseInt(stats.total) || 0;
            
            console.log(`Parsed stats - Pending: ${pending}, Verified: ${verified}, Total: ${total}`);
            
            animateValue('pending-count', pending, 0);
            animateValue('verified-count', verified, 100);
            animateValue('total-count', total, 200);
            
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
            // Check if student has uploaded requirements
            if (!s.user_id || s.document_count === 0) {
                // Student hasn't uploaded requirements yet
                const statusBadge = s.verified === 'verified'
                    ? `<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>`
                    : `<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>`;

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
                
                const actionHTML = `
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button class="btn-profile view-student-details" data-user="${s.user_id || '0'}" title="View Student Details">
                            <i class="fas fa-user-circle"></i> Profile
                        </button>
                        <span style="color: #64748b; font-size: 0.85rem;">No documents</span>
                    </div>
                `;

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
            const statusBadge = s.verified === 'verified'
                ? `<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>`
                : `<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>`;

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

            const actionHTML = `
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn-profile view-student-details" data-user="${s.user_id}" title="View Student Details">
                        <i class="fas fa-user-circle"></i> Profile
                    </button>
                    ${s.verified !== 'verified' 
                        ? `<button class="btn-accept" data-user="${s.user_id}" title="Verify Student">
                            <i class="fas fa-check"></i> Verify
                           </button>`
                        : `<i class="fas fa-check-circle" style="color:var(--success-green); font-size: 1.5rem;" title="Verified"></i>`
                    }
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
        // File preview
        $('.btn-view').on('click', function () {
            const filename = $(this).data('file');
            const userId = $(this).data('user');
            const fieldName = $(this).data('field');
            const button = $(this);
            
            // Add loading state
            const originalHtml = button.html();
            button.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
            
            // First, get document information to determine the document type
            $.getJSON(`${window.appUrls.documentInfo.replace('/0/', `/${userId}/`)}${fieldName}`, function(docInfo) {
                const documentType = docInfo.document_type || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                // Update modal title with the actual document name
                modalTitle.text(documentType);
                
                // Now load the file preview - use the correct endpoint for files
                $.getJSON(`${window.appUrls.previewFile}${filename}`, function (data) {
                    if (data.error) {
                        showMessage('error', data.error);
                        return;
                    }
                    
                    const ext = filename.split('.').pop().toLowerCase();
                    const fileUrl = data.file_url;

                    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                        fileViewer.html(`<img src="${fileUrl}" alt="${documentType}" style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;">`);
                    } else if (['pdf'].includes(ext)) {
                        fileViewer.html(`<iframe src="${fileUrl}" frameborder="0" style="width: 100%; height: 70vh;"></iframe>`);
                    } else if (['doc', 'docx'].includes(ext)) {
                        fileViewer.html(`
                            <div style="text-align: center; padding: 2rem;">
                                <i class="fas fa-file-word" style="font-size: 3rem; color: #2b579a; margin-bottom: 1rem;"></i>
                                <h4>${documentType}</h4>
                                <p>Word documents cannot be previewed in the browser.</p>
                                <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                    <i class="fas fa-download"></i> Download File
                                </a>
                            </div>
                        `);
                    } else {
                        fileViewer.html(`
                            <div style="text-align: center; padding: 2rem;">
                                <i class="fas fa-file-download" style="font-size: 3rem; color: #64748b; margin-bottom: 1rem;"></i>
                                <h4>${documentType}</h4>
                                <p>This file type cannot be previewed in the browser.</p>
                                <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                    <i class="fas fa-download"></i> Download File
                                </a>
                            </div>
                        `);
                    }
                    fileModal.fadeIn();
                }).fail((xhr, status, error) => {
                    showMessage('error', 'Error loading file preview: ' + error);
                }).always(() => {
                    // Reset button state
                    button.html(originalHtml).prop('disabled', false);
                });
                
            }).fail((xhr, status, error) => {
                // Fallback: use field name if document info fails
                const documentType = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                modalTitle.text(documentType);
                
                // Load file preview with fallback title
                $.getJSON(`${window.appUrls.previewFile}${filename}`, function (data) {
                    if (data.error) {
                        showMessage('error', data.error);
                        return;
                    }
                    
                    const ext = filename.split('.').pop().toLowerCase();
                    const fileUrl = data.file_url;

                    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                        fileViewer.html(`<img src="${fileUrl}" alt="${documentType}" style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;">`);
                    } else if (['pdf'].includes(ext)) {
                        fileViewer.html(`<iframe src="${fileUrl}" frameborder="0" style="width: 100%; height: 70vh;"></iframe>`);
                    } else {
                        fileViewer.html(`
                            <div style="text-align: center; padding: 2rem;">
                                <i class="fas fa-file-download" style="font-size: 3rem; color: #64748b; margin-bottom: 1rem;"></i>
                                <h4>${documentType}</h4>
                                <p>This file type cannot be previewed in the browser.</p>
                                <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                    <i class="fas fa-download"></i> Download File
                                </a>
                            </div>
                        `);
                    }
                    fileModal.fadeIn();
                }).fail((xhr, status, error) => {
                    showMessage('error', 'Error loading file preview: ' + error);
                }).always(() => {
                    // Reset button state
                    button.html(originalHtml).prop('disabled', false);
                });
            });
        });

        // View student details
        $('.view-student-details').on('click', function () {
            const userId = $(this).data('user');
            currentStudentId = userId;
            window.currentStudentId = userId;
            
            // Only load details if we have a valid user ID
            if (userId && userId !== '0') {
                loadStudentDetails(userId);
            } else {
                showMessage('info', 'This student has not uploaded any documents yet.');
            }
        });

        // Accept verification
        $('.btn-accept').on('click', function () {
            const userId = $(this).data('user');
            const button = $(this);
            const studentRow = button.closest('tr');
            const studentName = studentRow.find('.student-name').text().trim();
            
            if (!confirm(`Are you sure you want to verify ${studentName}? This action cannot be undone.`)) return;
            
            // Add loading state
            button.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
            
            $.post(`/admin/verify/accept/${userId}`, function (response) {
                if (response.success) {
                    showMessage('success', `Successfully verified ${studentName}`);
                    // Reload both data and stats
                    loadData(currentPage);
                    loadStats();
                } else {
                    showMessage('error', `Error: ${response.message}`);
                    button.html('<i class="fas fa-check"></i> Verify').prop('disabled', false);
                }
            }).fail(() => {
                showMessage('error', 'Error verifying student');
                button.html('<i class="fas fa-check"></i> Verify').prop('disabled', false);
            });
        });
    }

    // Load student details
    function loadStudentDetails(userId) {
        // Show loading state
        studentDetailsContent.html(`
            <div class="loading-spinner" style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <span>Loading student details...</span>
            </div>
        `);
        
        // Show verify button only for pending students
        $('#verifyStudentBtn').hide();
        
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
                    $('#verifyStudentBtn').hide();
                } else {
                    studentStatus.html('<span class="pending-badge"><i class="fas fa-clock"></i> Pending Verification</span>');
                    $('#verifyStudentBtn').show();
                }
                
                // Build student details HTML
                let detailsHtml = `
                    <div class="student-details-content">
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
                                    <div class="student-detail-value">${student.date_of_birth || 'Not specified'}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Contact Number</div>
                                    <div class="student-detail-value">${student.contact_number || 'Not provided'}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Address</div>
                                    <div class="student-detail-value">${student.full_address || 'Not provided'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Account Information -->
                        <div class="student-detail-section">
                            <h4><i class="fas fa-user-circle"></i> Account Information</h4>
                            <div class="student-detail-grid">
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Username</div>
                                    <div class="student-detail-value">${student.username}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Account Status</div>
                                    <div class="student-detail-value">${student.account_status === 'active' ? 'Active' : 'Inactive'}</div>
                                </div>
                                <div class="student-detail-item">
                                    <div class="student-detail-label">Verification Status</div>
                                    <div class="student-detail-value">
                                        ${student.verified === 'verified' 
                                            ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>' 
                                            : '<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>'
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Uploaded Documents -->
                        <div class="student-detail-section">
                            <h4><i class="fas fa-file-alt"></i> Uploaded Documents (${student.document_count || 0})</h4>
                `;
                
                // Document fields - only show fields that students actually upload
                const documentFields = [
                    {key: 'barangay_clearance', name: 'Barangay Clearance', icon: 'fa-file-contract'},
                    {key: 'medical_certificate', name: 'Medical Certificate', icon: 'fa-file-medical'},
                    {key: 'valid_id', name: 'Valid ID', icon: 'fa-id-badge'},
                    {key: 'transcript_form', name: 'Transcript Form', icon: 'fa-file-signature'},
                    {key: 'marriage_certificate', name: 'Marriage Certificate', icon: 'fa-ring'}
                ];
                
                detailsHtml += '<div class="student-documents-grid">';
                
                let uploadedDocs = 0;
                documentFields.forEach(field => {
                    if (student[field.key]) {
                        uploadedDocs++;
                        detailsHtml += `
                            <div class="document-item">
                                <i class="fas ${field.icon}"></i>
                                <p>${field.name}</p>
                                <button class="btn-view" 
                                        data-file="${student[field.key]}" 
                                        data-user="${student.user_id}"
                                        data-field="${field.key}"
                                        style="margin-top: 0.5rem; font-size: 0.75rem;">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </div>
                        `;
                    }
                });
                
                if (uploadedDocs === 0) {
                    detailsHtml += '<p style="grid-column: 1 / -1; text-align: center; color: #64748b;">No documents uploaded yet</p>';
                }
                
                // Add additional notes if they exist
                if (student.additional_notes) {
                    detailsHtml += `
                        <div class="student-detail-section" style="margin-top: 1.5rem;">
                            <h4><i class="fas fa-sticky-note"></i> Additional Notes</h4>
                            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; border-left: 4px solid #0d6efd;">
                                <p style="margin: 0; color: #495057; font-style: italic;">${student.additional_notes}</p>
                            </div>
                        </div>
                    `;
                }
                
                detailsHtml += `
                        </div>
                    </div>
                    
                    <!-- Comparison Note -->
                    <div class="student-detail-section" style="background-color: #fef3c7; border-color: #fbbf24;">
                        <h4><i class="fas fa-exclamation-triangle" style="color: #92400e;"></i> Verification Note</h4>
                        <p style="color: #92400e; font-size: 0.9rem;">
                            <strong>Important:</strong> Compare the uploaded documents with the student's profile information above. 
                            Verify that all required documents are present and valid.
                        </p>
                    </div>
                </div>
                `;
                
                studentDetailsContent.html(detailsHtml);
                
                // Re-bind document view buttons in the modal
                $('.document-item .btn-view').on('click', function() {
                    const filename = $(this).data('file');
                    const userId = $(this).data('user');
                    const fieldName = $(this).data('field');
                    const button = $(this);
                    
                    // Add loading state
                    const originalHtml = button.html();
                    button.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
                    
                    $.getJSON(`${window.appUrls.documentInfo.replace('/0/', `/${userId}/`)}${fieldName}`, function(docInfo) {
                        const documentType = docInfo.document_type || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        modalTitle.text(documentType);
                        
                        // Load file preview
                        $.getJSON(`${window.appUrls.previewFile}${filename}`, function (data) {
                            if (data.error) {
                                showMessage('error', data.error);
                                return;
                            }
                            
                            const ext = filename.split('.').pop().toLowerCase();
                            const fileUrl = data.file_url;

                            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                                fileViewer.html(`<img src="${fileUrl}" alt="${documentType}" style="max-width: 100%; max-height: 70vh; display: block; margin: 0 auto;">`);
                            } else if (['pdf'].includes(ext)) {
                                fileViewer.html(`<iframe src="${fileUrl}" frameborder="0" style="width: 100%; height: 70vh;"></iframe>`);
                            } else if (['doc', 'docx'].includes(ext)) {
                                fileViewer.html(`
                                    <div style="text-align: center; padding: 2rem;">
                                        <i class="fas fa-file-word" style="font-size: 3rem; color: #2b579a; margin-bottom: 1rem;"></i>
                                        <h4>${documentType}</h4>
                                        <p>Word documents cannot be previewed in the browser.</p>
                                        <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                            <i class="fas fa-download"></i> Download File
                                        </a>
                                    </div>
                                `);
                            } else {
                                fileViewer.html(`
                                    <div style="text-align: center; padding: 2rem;">
                                        <i class="fas fa-file-download" style="font-size: 3rem; color: #64748b; margin-bottom: 1rem;"></i>
                                        <h4>${documentType}</h4>
                                        <p>This file type cannot be previewed in the browser.</p>
                                        <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                                            <i class="fas fa-download"></i> Download File
                                        </a>
                                    </div>
                                `);
                            }
                            studentDetailsModal.fadeOut();
                            fileModal.fadeIn();
                        }).fail((xhr, status, error) => {
                            showMessage('error', 'Error loading file preview: ' + error);
                        }).always(() => {
                            button.html(originalHtml).prop('disabled', false);
                        });
                    }).fail(() => {
                        button.html(originalHtml).prop('disabled', false);
                    });
                });
                
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

    // Close file modal
    function closeFileModal() {
        fileModal.fadeOut();
        modalTitle.text('Document Preview');
    }

    // Close student details modal
    function closeStudentDetailsModal() {
        studentDetailsModal.fadeOut();
        currentStudentId = null;
    }

    // Verify student from details modal
    $('#verifyStudentBtn').on('click', function() {
        if (!currentStudentId) return;
        
        const studentNameText = studentName.text();
        
        if (!confirm(`Are you sure you want to verify ${studentNameText}? This action cannot be undone.`)) return;
        
        const button = $(this);
        const originalHtml = button.html();
        
        // Add loading state
        button.html('<i class="fas fa-spinner fa-spin"></i> Verifying...').prop('disabled', true);
        
        $.post(`/admin/verify/accept/${currentStudentId}`, function (response) {
            if (response.success) {
                showMessage('success', `Successfully verified ${studentNameText}`);
                closeStudentDetailsModal();
                // Reload both data and stats
                loadData(currentPage);
                loadStats();
            } else {
                showMessage('error', `Error: ${response.message}`);
                button.html(originalHtml).prop('disabled', false);
            }
        }).fail(() => {
            showMessage('error', 'Error verifying student');
            button.html(originalHtml).prop('disabled', false);
        });
    });

    // Close modals
    $('#close-file-modal').on('click', closeFileModal);
    $('#close-file-modal-header').on('click', closeFileModal);
    $('#closeStudentDetailsModal').on('click', closeStudentDetailsModal);
    $('#close-student-details-modal').on('click', closeStudentDetailsModal);
    
    $(window).on('click', (e) => { 
        if ($(e.target).is(fileModal)) closeFileModal();
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
}

// Unified Modal Handling - CONSISTENT WITH PROFILE PAGE
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

// Handle window resize
$(window).on('resize', function() {
    // Adjust modal content if needed
    const fileModal = $('#fileModal');
    const studentDetailsModal = $('#studentDetailsModal');
    
    if (fileModal.is(':visible') || studentDetailsModal.is(':visible')) {
        // You can add responsive adjustments here if needed
    }
});