// Scroll-triggered animations
const animatedEls = document.querySelectorAll(
    '.approach-card, .capability-card, .process-step, .philosophy-card, .service-card, .work-card, .team-card, .story-stat, .positioning h2, .positioning p, .section-title, .section-subtitle, .section-title-dark, .section-subtitle-dark, .service-division-header, .story-content'
);

if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    animatedEls.forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        const isOpen = navMenu.classList.contains('active');
        navToggle.setAttribute('aria-expanded', String(isOpen));

        // Animate hamburger icon
        const spans = navToggle.querySelectorAll('span');
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
}

// Close mobile menu when clicking on a link
const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (navMenu.classList.contains('active')) {
            navMenu.classList.remove('active');
            navToggle.setAttribute('aria-expanded', 'false');
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
});

// Keep footer copyright year current
const yearEl = document.getElementById('year');
if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
}

// Contact Form Handling
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        
        let msgEl = contactForm.querySelector('.form-status');
        if (!msgEl) {
            msgEl = document.createElement('div');
            msgEl.className = 'form-status';
            contactForm.appendChild(msgEl);
        }

        try {
            const formData = new FormData(contactForm);
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                msgEl.textContent = '✓ Message sent! We\'ll get back to you within 24 hours.';
                msgEl.className = 'form-status form-status--success';
                contactForm.reset();
            } else {
                msgEl.textContent = 'Something went wrong. Please email us at hello@hemitech.co.ke';
                msgEl.className = 'form-status form-status--error';
            }
        } catch (error) {
            msgEl.textContent = 'Something went wrong. Please email us at hello@hemitech.co.ke';
            msgEl.className = 'form-status form-status--error';
        }

        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add scroll effect to navbar
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        navbar.classList.add('scrolled');
    } else {
        navbar.style.boxShadow = 'none';
        navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
});

// Spotlight effect that follows cursor
const spotlight = document.querySelector('.spotlight');
if (spotlight) {
    document.addEventListener('mousemove', (e) => {
        const hero = document.querySelector('.hero');
        if (hero && hero.contains(e.target)) {
            spotlight.style.opacity = '1';
            spotlight.style.left = e.clientX - 300 + 'px';
            spotlight.style.top = e.clientY - 300 + 'px';
        } else {
            spotlight.style.opacity = '0';
        }
    });
}
