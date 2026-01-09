// login.js - API-Based Login System (No Success Message)

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const jsMessageContainer = document.getElementById('js-message-container');
    const jsMessage = jsMessageContainer.querySelector('.js-message');
    const jsMessageText = jsMessage.querySelector('.js-message-text');
    const jsMessageIcon = jsMessage.querySelector('.js-message-icon');
    const jsMessageClose = jsMessage.querySelector('.js-message-close');
    
    // Toggle password visibility
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.closest('.input-wrapper').querySelector('input');
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            this.querySelector('i').classList.toggle('fa-eye');
            this.querySelector('i').classList.toggle('fa-eye-slash');
        });
    });
    
    // Close message
    jsMessageClose.addEventListener('click', function() {
        hideMessage();
    });
    
    // Show message function (only for errors/warnings)
    function showMessage(message, type = 'error') {
        // Set message content
        jsMessageText.textContent = message;
        
        // Set message type and icon
        jsMessage.className = 'js-message ' + type;
        
        // Set icon based on type
        const icon = jsMessageIcon.querySelector('i');
        icon.className = 'fas ' + getIconForType(type);
        
        // Show container
        jsMessageContainer.style.display = 'block';
        
        // Auto-hide info/warning messages after 5 seconds
        if (type === 'warning' || type === 'info') {
            setTimeout(() => {
                hideMessage();
            }, 5000);
        }
    }
    
    // Hide message function
    function hideMessage() {
        jsMessageContainer.style.display = 'none';
    }
    
    // Get icon for message type
    function getIconForType(type) {
        switch(type) {
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-info-circle';
        }
    }
    
    // Form submission handler
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Get form data
        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value;
        
        // Basic validation
        if (!identifier || !password) {
            showMessage('Please fill in all fields', 'error');
            return;
        }
        
        // Show loading state
        loginBtn.classList.add('loading');
        loginBtn.disabled = true;
        
        try {
            // Send login request
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identifier: identifier,
                    password: password
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // SUCCESS - Redirect immediately, no message needed
                window.location.href = result.redirect;
                
            } else {
                // Show error/warning message
                const messageType = result.type === 'pending' || result.type === 'inactive' ? 'warning' : 'error';
                showMessage(result.message, messageType);
                
                // Reset loading state
                loginBtn.classList.remove('loading');
                loginBtn.disabled = false;
                
                // Focus on password field for retry
                document.getElementById('password').focus();
            }
            
        } catch (error) {
            // Network or server error
            console.error('Login error:', error);
            showMessage('Network error. Please check your connection and try again.', 'error');
            
            // Reset loading state
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        }
    });
    
    // Allow Enter key to submit form (but not in textareas)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.target.matches('textarea')) {
            if (document.activeElement === document.getElementById('identifier') || 
                document.activeElement === document.getElementById('password')) {
                loginForm.requestSubmit();
            }
        }
    });
    
    // Debug log
    console.log('API Login system loaded successfully');
});