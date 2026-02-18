// Modal instances
let currentStaffId = null;
let currentSignature = null;

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
    
    const staffDetailsModal = $('#staffDetailsModal');
    const staffProfilePicture = $('#staffProfilePicture');
    const staffName = $('#staffName');
    const staffEmail = $('#staffEmail');
    const staffStatus = $('#staffStatus');
    const staffDetailsContent = $('#staffDetailsContent');
    const signatureViewer = $('#signatureViewer');
    const signaturePreviewContainer = $('#signaturePreviewContainer');
    const noSignatureMessage = $('#noSignatureMessage');
    const verificationActions = $('#verificationActions');
    const signatureInfoContent = $('#signatureInfoContent');
    
    // Tab elements
    const documentTabs = $('.document-tab');
    const previewTab = $('#previewTab');
    const infoTab = $('#infoTab');
    
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
            
            renderTable(data.staff);
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
            $('#staffTableBody').html('<tr><td colspan="5" style="text-align:center;color:red;">Error loading data.</td></tr>');
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
    function renderTable(staffMembers) {
        const tbody = $('#staffTableBody');
        tbody.empty();

        if (staffMembers.length === 0) {
            tbody.html('<tr><td colspan="5" style="text-align:center;color:#64748b;padding:2rem;">No staff records found.</td></tr>');
            return;
        }

        staffMembers.forEach((s, index) => {
            // Get status badge based on verification status
            let statusBadge = '';
            if (s.verified === 'verified') {
                statusBadge = `<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>`;
            } else if (s.verified === 'rejected') {
                statusBadge = `<span class="rejected-badge"><i class="fas fa-times-circle"></i> Rejected</span>`;
            } else {
                statusBadge = `<span class="pending-badge"><i class="fas fa-clock"></i> Pending</span>`;
            }

            // Get profile picture URL
            const profilePicture = s.profile_picture || 'default.png';
            const profilePictureUrl = `${window.appUrls.staticProfilePath}${profilePicture}`;
            
            // Staff profile cell with picture
            const profileCell = `
                <div class="staff-profile-cell">
                    <img src="${profilePictureUrl}" alt="${s.full_name}" class="staff-avatar">
                    <div class="staff-info">
                        <div class="staff-name">${s.full_name}</div>
                        <div class="staff-username">${s.username}</div>
                    </div>
                </div>
            `;

            // Signature status
            let signatureHTML = '';
            if (s.has_signature && s.e_signature) {
                signatureHTML = `
                    <div class="signature-status">
                        <span class="signature-icon uploaded"><i class="fas fa-signature"></i></span>
                        <span>Uploaded</span>
                    </div>
                `;
            } else {
                signatureHTML = `
                    <div class="signature-status">
                        <span class="signature-icon missing"><i class="fas fa-times"></i></span>
                        <span style="color: #64748b;">No signature</span>
                    </div>
                `;
            }

            // Action buttons
            let actionHTML = '';
            if (s.has_signature && s.e_signature) {
                actionHTML = `
                    <div class="action-buttons">
                        <button class="btn-profile view-staff-details" data-user="${s.user_id}" title="View Staff Details">
                            <i class="fas fa-user-tie"></i> Profile
                        </button>
                        <button class="btn-view view-signature" 
                                data-user="${s.user_id}"
                                data-signature="${s.e_signature || ''}"
                                title="View Signature">
                            <i class="fas fa-signature"></i>
                            <span class="tooltip">View Signature</span>
                        </button>
                    </div>
                `;
            } else {
                actionHTML = `
                    <div class="action-buttons">
                        <button class="btn-profile view-staff-details" data-user="${s.user_id}" title="View Staff Details">
                            <i class="fas fa-user-tie"></i> Profile
                        </button>
                        <span style="color: #64748b; font-size: 0.85rem;">No signature</span>
                    </div>
                `;
            }

            tbody.append(`
                <tr>
                    <td>${profileCell}</td>
                    <td>${s.email}</td>
                    <td>${statusBadge}</td>
                    <td>${signatureHTML}</td>
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
        // View staff details
        $('.view-staff-details').on('click', function () {
            const userId = $(this).data('user');
            currentStaffId = userId;
            window.currentStaffId = userId;
            
            loadStaffDetails(userId);
        });

        // View signature buttons in table
        $('.view-signature').on('click', function(e) {
            e.stopPropagation();
            const userId = $(this).data('user');
            const signature = $(this).data('signature');
            currentStaffId = userId;
            window.currentStaffId = userId;
            
            loadStaffDetails(userId, signature);
        });
    }

    // Load staff details
    function loadStaffDetails(userId, signatureToPreview = null) {
        // Show loading state
        staffDetailsContent.html(`
            <div class="loading-spinner" style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <span>Loading staff details...</span>
            </div>
        `);
        
        // Reset signature preview
        signatureViewer.hide();
        noSignatureMessage.show();
        signatureInfoContent.empty();
        
        // Hide verification actions initially
        verificationActions.hide();
        
        // Reset tab to preview tab by default
        switchTab('preview');
        
        staffDetailsModal.fadeIn();
        
        $.getJSON(window.appUrls.staffDetails.replace('0', userId), function(response) {
            if (response.success) {
                const staff = response.staff;
                
                // Update profile picture
                const profilePicture = staff.profile_picture || 'default.png';
                staffProfilePicture.attr('src', `${window.appUrls.staticProfilePath}${profilePicture}`);
                
                // Update name and email
                staffName.text(staff.full_name);
                staffEmail.text(staff.email);
                
                // Update status
                if (staff.verified === 'verified') {
                    staffStatus.html('<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span>');
                } else if (staff.verified === 'rejected') {
                    staffStatus.html('<span class="rejected-badge"><i class="fas fa-times-circle"></i> Rejected</span>');
                } else {
                    staffStatus.html('<span class="pending-badge"><i class="fas fa-clock"></i> Pending Verification</span>');
                    // Show verification actions only for pending status and if signature exists
                    if (staff.has_signature && staff.e_signature) {
                        verificationActions.show();
                    }
                }
                
                // Format date of birth
                const formattedDateOfBirth = formatDate(staff.date_of_birth);
                const formattedDateRegistered = formatDate(staff.date_registered);
                
                // Build staff details HTML
                let detailsHtml = `
                    <!-- Personal Information -->
                    <div class="staff-detail-section">
                        <h4><i class="fas fa-id-card"></i> Personal Information</h4>
                        <div class="staff-detail-grid">
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Full Name</div>
                                <div class="staff-detail-value">${staff.full_name}</div>
                            </div>
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Gender</div>
                                <div class="staff-detail-value">${staff.gender || 'Not specified'}</div>
                            </div>
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Date of Birth</div>
                                <div class="staff-detail-value">${formattedDateOfBirth}</div>
                            </div>
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Contact Number</div>
                                <div class="staff-detail-value">${staff.contact_number || 'Not provided'}</div>
                            </div>
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Address</div>
                                <div class="staff-detail-value">${staff.full_address || 'Not provided'}</div>
                            </div>
                `;
                
                // Add username if available
                if (staff.username) {
                    detailsHtml += `
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Username</div>
                                <div class="staff-detail-value">${staff.username}</div>
                            </div>
                    `;
                }
                
                // Add account status if available
                if (staff.account_status) {
                    detailsHtml += `
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Account Status</div>
                                <div class="staff-detail-value">${staff.account_status === 'active' ? 'Active' : 'Inactive'}</div>
                            </div>
                    `;
                }
                
                // Add date registered if available
                if (formattedDateRegistered && formattedDateRegistered !== 'Not specified') {
                    detailsHtml += `
                            <div class="staff-detail-item">
                                <div class="staff-detail-label">Date Registered</div>
                                <div class="staff-detail-value">${formattedDateRegistered}</div>
                            </div>
                    `;
                }
                
                detailsHtml += `
                        </div>
                    </div>
                `;
                
                staffDetailsContent.html(detailsHtml);
                
                // Load signature information
                loadSignatureInfo(staff);
                
                // Auto-preview signature if staff has signature (for profile button) OR if signature was passed directly
                if (staff.has_signature && staff.e_signature) {
                    setTimeout(() => {
                        previewSignature(staff.e_signature);
                    }, 500);
                }
                
            } else {
                staffDetailsContent.html(`
                    <div class="error-message" style="text-align: center; padding: 2rem; color: var(--error-red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <p>Error loading staff details: ${response.error || 'Unknown error'}</p>
                    </div>
                `);
            }
        }).fail(() => {
            staffDetailsContent.html(`
                <div class="error-message" style="text-align: center; padding: 2rem; color: var(--error-red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                    <p>Failed to load staff details. Please try again.</p>
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
    }

    // Load signature information
    function loadSignatureInfo(staff) {
        // Update signature info tab
        let infoHtml = '<div class="signature-detail-card">';
        
        if (staff.has_signature && staff.e_signature) {
            const signatureFileName = staff.e_signature.split('/').pop() || staff.e_signature;
            
            infoHtml += `
                <div class="signature-detail-item">
                    <div class="signature-detail-label">
                        <i class="fas fa-file-signature"></i> Signature Status
                    </div>
                    <div class="signature-detail-value" style="color: #065f46; background-color: #d1fae5;">
                        <i class="fas fa-check-circle"></i> Signature Uploaded
                    </div>
                </div>
                <div class="signature-detail-item">
                    <div class="signature-detail-label">
                        <i class="fas fa-file"></i> Filename
                    </div>
                    <div class="signature-detail-value">
                        ${signatureFileName}
                    </div>
                </div>
                <div class="signature-detail-item">
                    <div class="signature-detail-label">
                        <i class="fas fa-calendar-alt"></i> Upload Date
                    </div>
                    <div class="signature-detail-value">
                        ${staff.date_registered ? formatDate(staff.date_registered) : 'Not available'}
                    </div>
                </div>
            `;
        } else {
            infoHtml += `
                <div class="signature-detail-item">
                    <div class="signature-detail-label">
                        <i class="fas fa-exclamation-triangle"></i> Signature Status
                    </div>
                    <div class="signature-detail-value" style="color: #7f1d1d; background-color: #fee2e2;">
                        <i class="fas fa-times-circle"></i> No Signature Uploaded
                    </div>
                </div>
                <div class="signature-detail-item">
                    <div class="signature-detail-label">
                        <i class="fas fa-info-circle"></i> Information
                    </div>
                    <div class="signature-detail-value">
                        This staff member has not uploaded an e-signature yet.
                    </div>
                </div>
            `;
        }
        
        infoHtml += '</div>';
        signatureInfoContent.html(infoHtml);
    }

    // Preview signature within the modal
    function previewSignature(filename) {
        if (!filename) return;
        
        // Show loading state
        signatureViewer.html(`
            <div class="loading-spinner" style="text-align: center; padding: 2rem;">
                <div class="spinner" style="margin: 0 auto;"></div>
                <span>Loading signature...</span>
            </div>
        `).show();
        noSignatureMessage.hide();
        
        // Store current signature
        currentSignature = filename;
        
        // Get the signature file
        $.getJSON(`${window.appUrls.getSignature}${filename}`, function (data) {
            if (data.error) {
                signatureViewer.html(`
                    <div class="document-fallback">
                        <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                        <h4>Error Loading Signature</h4>
                        <p>${data.error}</p>
                    </div>
                `);
                return;
            }
            
            const fileUrl = data.file_url;
            const ext = filename.split('.').pop().toLowerCase();
            
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext)) {
                signatureViewer.html(`<img src="${fileUrl}" alt="Staff Signature" class="signature-image">`);
            } else {
                signatureViewer.html(`
                    <div class="document-fallback">
                        <i class="fas fa-file-download" style="color: var(--tesda-blue);"></i>
                        <h4>Signature File</h4>
                        <p>This file type cannot be previewed directly.</p>
                        <a href="${fileUrl}" target="_blank" class="btn btn-primary" style="margin: 10px;">
                            <i class="fas fa-download"></i> Download Signature
                        </a>
                    </div>
                `);
            }
        }).fail((xhr, status, error) => {
            signatureViewer.html(`
                <div class="document-fallback">
                    <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
                    <h4>Error Loading Signature</h4>
                    <p>Failed to load signature preview.</p>
                </div>
            `);
        });
    }

    // Close staff details modal
    function closeStaffDetailsModal() {
        staffDetailsModal.fadeOut();
        currentStaffId = null;
        currentSignature = null;
        
        // Reset to preview tab
        switchTab('preview');
        signatureViewer.hide();
        noSignatureMessage.show();
    }

    // Verify staff from details modal
    $('#verifyStaffBtn').on('click', function() {
        if (!currentStaffId) return;
        
        // Close staff details modal first, then show approval confirmation
        closeStaffDetailsModal();
        setTimeout(() => {
            showApprovalConfirmation();
        }, 300);
    });

    // Reject staff from details modal
    $('#rejectStaffBtn').on('click', function() {
        if (!currentStaffId) return;
        
        // Close staff details modal first, then show rejection reason modal
        closeStaffDetailsModal();
        setTimeout(() => {
            showRejectionReasonModal();
        }, 300);
    });

    // Tab switching
    documentTabs.on('click', function() {
        const tabName = $(this).data('tab');
        switchTab(tabName);
    });

    // Close staff details modal
    $('#closeStaffDetailsModal').on('click', closeStaffDetailsModal);
    $('#close-staff-details-modal').on('click', closeStaffDetailsModal);
    
    $(window).on('click', (e) => { 
        if ($(e.target).is(staffDetailsModal)) closeStaffDetailsModal();
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

// Initialize modal functionality
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

    // Staff details modal close buttons
    $('#closeStaffDetailsModal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#staffDetailsModal').fadeOut();
    });
    
    $('#close-staff-details-modal').click(function(e) {
        e.preventDefault();
        e.stopPropagation();
        $('#staffDetailsModal').fadeOut();
    });

    // Close alert when X is clicked
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
                <p style="margin-bottom: 15px;">Are you sure you want to verify this staff member's e-signature? They will be able to access staff features.</p>
                <p style="color: #64748b; font-size: 0.9rem;">
                    <i class="fas fa-envelope"></i> An approval notification email will be sent to the staff member.
                </p>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Yes, Verify Staff',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#15803d',
        cancelButtonColor: '#6c757d',
        ...window.swalConfig
    }).then((result) => {
        if (result.isConfirmed) {
            approveStaff();
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
                        <i class="fas fa-comment-dots" style="margin-right: 5px;"></i> Please provide a reason for rejecting this staff verification:
                    </label>
                    <textarea id="swalRejectionReason" 
                              style="width: 100%; padding: 10px; border: 2px solid #e2e8f0; border-radius: 6px; font-family: inherit; font-size: 0.95rem; resize: vertical; min-height: 120px;"
                              placeholder="Explain why the e-signature is being rejected. For example: 'Signature is unclear', 'Invalid format', 'Does not match records', etc."
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
                    <i class="fas fa-envelope"></i> This reason will be included in the rejection email sent to the staff member.
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
            rejectStaffWithReason(result.value);
        }
    });
    
    // Add character counter for SweetAlert textarea
    setTimeout(() => {
        const textarea = document.getElementById('swalRejectionReason');
        const charCount = document.getElementById('swalCharCount');
        
        if (textarea && charCount) {
            textarea.addEventListener('input', function() {
                const count = this.value.length;
                charCount.textContent = count;
                
                if (count === 0) {
                    Swal.showValidationMessage('Please provide a rejection reason');
                } else if (count < 10) {
                    Swal.showValidationMessage('Please provide a more detailed reason (minimum 10 characters)');
                } else {
                    Swal.resetValidationMessage();
                }
            });
        }
    }, 100);
}

// Approve staff function
function approveStaff() {
    if (!window.currentStaffId) return;
    
    showLoading('Approving staff and sending email...');
    
    $.ajax({
        url: window.appUrls.acceptVerification.replace('0', window.currentStaffId),
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
                showErrorAlert('Verification Failed', response.message || 'Error verifying staff');
            }
        },
        error: function(xhr, status, error) {
            hideLoading();
            
            let errorMessage = 'Error verifying staff';
            if (xhr.responseJSON && xhr.responseJSON.message) {
                errorMessage += ': ' + xhr.responseJSON.message;
            } else {
                errorMessage += ': ' + error;
            }
            
            showErrorAlert('Verification Failed', errorMessage);
        }
    });
}

// Reject staff with reason function
function rejectStaffWithReason(rejectionReason) {
    if (!window.currentStaffId) return;
    
    showLoading('Rejecting verification and sending email...');
    
    $.ajax({
        url: window.appUrls.rejectVerification.replace('0', window.currentStaffId),
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
    const staffDetailsModal = $('#staffDetailsModal');
    
    if (staffDetailsModal.is(':visible')) {
        // You can add responsive adjustments here if needed
    }
});