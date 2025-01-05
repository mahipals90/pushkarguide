// Define translations for each language
const translations = {
    en: {
        home: "Home",
        explore: "Explore",
        contact: "Contact",
        hero_title: "Welcome to Pushkar",
        hero_subtitle: "Discover the Spiritual Heart of Rajasthan",
        explore_title: "Sacred Places",
        explore_subtitle: "Discover the divine essence through Pushkar's temples and sacred sites",
        contact_title: "Contact Us",
        contact_subtitle: "Get in touch with us",
        language: "Language",
        search: "Search language..."
    },
    hi: {
        home: "होम",
        explore: "एक्सप्लोर",
        contact: "संपर्क",
        hero_title: "पुष्कर में आपका स्वागत है",
        hero_subtitle: "राजस्थान के आध्यात्मिक दिल की खोज करें",
        explore_title: "पवित्र स्थल",
        explore_subtitle: "पुष्कर के मंदिरों और पवित्र स्थलों के माध्यम से दिव्य सार की खोज करें",
        contact_title: "संपर्क करें",
        contact_subtitle: "हमसे संपर्क करें",
        language: "भाषा",
        search: "भाषा खोजें..."
    },
    fr: {
        home: "Accueil",
        explore: "Explorer",
        contact: "Contact",
        hero_title: "Bienvenue à Pushkar",
        hero_subtitle: "Découvrez le cœur spirituel du Rajasthan",
        explore_title: "Lieux Sacrés",
        explore_subtitle: "Découvrez l'essence divine à travers les temples et sites sacrés de Pushkar",
        contact_title: "Contactez-nous",
        contact_subtitle: "Prenez contact avec nous",
        language: "Langue",
        search: "Rechercher une langue..."
    }
};

// Initialize translation functionality
document.addEventListener('DOMContentLoaded', function() {
    const languageBtn = document.querySelector('.language-btn');
    const languageDropdown = document.querySelector('.language-dropdown');
    const searchInput = document.querySelector('.language-search input');
    
    // Function to translate the page
    function translatePage(language) {
        // Store selected language
        localStorage.setItem('selectedLanguage', language);
        
        // Update HTML lang attribute
        document.documentElement.setAttribute('lang', language);
        
        // Translate all elements with data-lang attribute
        document.querySelectorAll('[data-lang-key]').forEach(element => {
            const key = element.getAttribute('data-lang-key');
            if (translations[language] && translations[language][key]) {
                // Handle input placeholders separately
                if (element.tagName === 'INPUT') {
                    element.placeholder = translations[language][key];
                } else {
                    element.textContent = translations[language][key];
                }
            }
        });

        // Update active state in language list
        document.querySelectorAll('.language-list a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-lang') === language) {
                link.classList.add('active');
            }
        });

        // Close dropdown
        if (languageDropdown) {
            languageDropdown.classList.remove('show');
        }
    }

    // Toggle language dropdown
    if (languageBtn) {
        languageBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            languageDropdown.classList.toggle('show');
        });
    }

    // Handle language selection
    document.querySelectorAll('.language-list a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const language = e.currentTarget.getAttribute('data-lang');
            translatePage(language);
        });
    });

    // Handle search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            document.querySelectorAll('.language-list a').forEach(link => {
                const text = link.textContent.toLowerCase();
                link.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (languageDropdown && !languageDropdown.contains(e.target)) {
            languageDropdown.classList.remove('show');
        }
    });

    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage) {
        translatePage(savedLanguage);
    }
});
