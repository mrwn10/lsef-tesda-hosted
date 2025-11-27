// Hamburger menu functionality
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');
const closeMenu = document.getElementById('closeMenu');

hamburger.addEventListener('click', () => {
    navMenu.classList.add('active');
    document.body.style.overflow = 'hidden';
});

closeMenu.addEventListener('click', () => {
    navMenu.classList.remove('active');
    document.body.style.overflow = '';
});

document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navMenu.contains(e.target) && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

const navLinks = document.querySelectorAll('.nav-links a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        navMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
});

// Carousel functionality
const track = document.getElementById('carouselTrack');
const slides = Array.from(track.children);
const nextButton = document.getElementById('nextBtn');
const prevButton = document.getElementById('prevBtn');
const indicators = document.getElementById('carouselIndicators');
const dots = Array.from(indicators.children);

// Set slide positions
slides.forEach((slide, index) => {
    slide.style.left = `${index * 100}%`;
});

let currentIndex = 0;

const updateCarousel = () => {
    // Move track
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    // Update indicators
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentIndex);
    });
    
    // Update slides
    slides.forEach((slide, index) => {
        slide.classList.toggle('current-slide', index === currentIndex);
    });
    
    // Update button states
    prevButton.classList.toggle('is-hidden', currentIndex === 0);
    nextButton.classList.toggle('is-hidden', currentIndex === slides.length - 1);
};

// Next button click
nextButton.addEventListener('click', () => {
    if (currentIndex < slides.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

// Previous button click
prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

// Indicator click
dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentIndex = index;
        updateCarousel();
    });
});

// Auto-advance carousel
let autoSlideInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % slides.length;
    updateCarousel();
}, 5000);

// Pause auto-slide on hover
const carouselContainer = document.querySelector('.carousel-container');
carouselContainer.addEventListener('mouseenter', () => {
    clearInterval(autoSlideInterval);
});

carouselContainer.addEventListener('mouseleave', () => {
    autoSlideInterval = setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    }, 5000);
});

// Modal functionality
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    document.body.style.overflow = 'auto';
}

window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Initialize carousel
updateCarousel();