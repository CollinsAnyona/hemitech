// Scroll-triggered animations
const animatedEls = document.querySelectorAll(
    '.approach-card, .capability-card, .process-step, .philosophy-card, .service-card, .work-card, .team-card, .story-stat, .positioning h2, .positioning p, .section-title, .section-subtitle, .section-title-dark, .section-subtitle-dark, .service-division-header, .story-content'
);

const revealAll = () => animatedEls.forEach(el => el.classList.add('in-view'));

if ('IntersectionObserver' in window) {
    try {
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
    } catch (err) {
        // Never leave content stranded at opacity 0
        revealAll();
    }
} else {
    revealAll();
}

// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    const setMenu = (open) => {
        navMenu.classList.toggle('active', open);
        navToggle.classList.toggle('active', open);
        navToggle.setAttribute('aria-expanded', String(open));
        // Stop the page scrolling behind the open panel
        document.body.classList.toggle('nav-open', open);
    };

    navToggle.addEventListener('click', () => {
        setMenu(!navMenu.classList.contains('active'));
    });

    // Escape closes the menu and returns focus to the trigger
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            setMenu(false);
            navToggle.focus();
        }
    });

    // Clicking outside the panel closes it
    document.addEventListener('click', (e) => {
        if (!navMenu.classList.contains('active')) return;
        if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
        setMenu(false);
    });

    // Close after choosing a destination
    navMenu.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => setMenu(false));
    });

    // Reset state if the viewport grows back past the mobile breakpoint
    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => {
        if (e.matches) setMenu(false);
    });
}

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
        
        // The status node lives in the markup with role="status"/aria-live so
        // screen readers announce the result. Only create it as a fallback.
        let msgEl = contactForm.querySelector('.form-status');
        if (!msgEl) {
            msgEl = document.createElement('div');
            msgEl.className = 'form-status';
            msgEl.setAttribute('role', 'status');
            msgEl.setAttribute('aria-live', 'polite');
            contactForm.appendChild(msgEl);
        }
        msgEl.textContent = '';

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
                msgEl.setAttribute('aria-live', 'assertive');
                msgEl.textContent = 'Something went wrong. Please email us at hello@hemitech.co.ke';
                msgEl.className = 'form-status form-status--error';
            }
        } catch (error) {
            msgEl.setAttribute('aria-live', 'assertive');
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

// Add scroll effect to navbar (rAF-throttled - this fired on every scroll tick
// and wrote inline styles each time)
const navbar = document.querySelector('.navbar');

if (navbar) {
    let ticking = false;
    const applyScrollState = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
        ticking = false;
    };
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(applyScrollState);
            ticking = true;
        }
    }, { passive: true });
    applyScrollState();
}

// Spotlight effect that follows cursor.
// Skipped entirely for reduced-motion users and on touch/coarse pointers,
// where it costs battery and does nothing visible.
const spotlight = document.querySelector('.spotlight');
const wantsMotion = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

if (spotlight && wantsMotion && finePointer) {
    const hero = document.querySelector('.hero');
    let pending = false;
    let lastEvent = null;

    const paint = () => {
        pending = false;
        if (!lastEvent) return;
        if (hero && hero.contains(lastEvent.target)) {
            spotlight.style.opacity = '1';
            spotlight.style.transform =
                `translate(${lastEvent.clientX - 300}px, ${lastEvent.clientY - 300}px)`;
        } else {
            spotlight.style.opacity = '0';
        }
    };

    document.addEventListener('mousemove', (e) => {
        lastEvent = e;
        if (!pending) {
            window.requestAnimationFrame(paint);
            pending = true;
        }
    }, { passive: true });
}
