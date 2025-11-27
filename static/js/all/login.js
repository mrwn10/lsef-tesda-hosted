// login.js - Enhanced Version with Consistent Functionality

document.addEventListener('DOMContentLoaded', function() {
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
    
    // Close flash messages
    const closeButtons = document.querySelectorAll('.flash-close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.flash-message').style.opacity = '0';
            setTimeout(() => {
                this.closest('.flash-message').remove();
            }, 300);
        });
    });
    
    // Form submission loading state
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function() {
            const submitBtn = this.querySelector('.login-btn');
            submitBtn.classList.add('loading');
        });
    }

    // Debug: Log when the script loads
    console.log('Login form JavaScript loaded successfully');
});