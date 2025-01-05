document.addEventListener('DOMContentLoaded', function() {
    // Get all necessary elements
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    const body = document.body;

    // Create overlay
    const menuOverlay = document.createElement('div');
    menuOverlay.className = 'menu-overlay';
    document.body.appendChild(menuOverlay);

    // Close menu function
    function closeMenu() {
        navMenu.classList.remove('active');
        if (mobileMenuBtn.querySelector('i')) {
            mobileMenuBtn.querySelector('i').classList.remove('fa-times');
            mobileMenuBtn.querySelector('i').classList.add('fa-bars');
        }
        menuOverlay.classList.remove('active');
        body.style.overflow = '';
    }

    // Toggle menu function
    function toggleMenu() {
        const isOpen = navMenu.classList.contains('active');
        if (isOpen) {
            closeMenu();
        } else {
            navMenu.classList.add('active');
            if (mobileMenuBtn.querySelector('i')) {
                mobileMenuBtn.querySelector('i').classList.remove('fa-bars');
                mobileMenuBtn.querySelector('i').classList.add('fa-times');
            }
            menuOverlay.classList.add('active');
            body.style.overflow = 'hidden';
        }
    }

    // Add click event to menu button
    mobileMenuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });

    // Add click events to all nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Prevent default behavior
            e.preventDefault();

            // Get the target section id
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);

            // Close the menu
            closeMenu();

            // Scroll to the section
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Close menu when clicking overlay
    menuOverlay.addEventListener('click', closeMenu);

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        const isMenuOpen = navMenu.classList.contains('active');
        if (isMenuOpen && !navMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            closeMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeMenu();
        }
    });

    // Close menu on window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });

    // Handle language selector
    const languageBtn = document.querySelector('.language-btn');
    const languageDropdown = document.querySelector('.language-dropdown');

    if (languageBtn && languageDropdown) {
        languageBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });

        // Close language dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.language-selector')) {
                languageDropdown.classList.remove('show');
            }
        });
    }
});
