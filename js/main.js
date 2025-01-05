// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Navbar Background Change on Scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Reveal Elements on Scroll
const revealElements = document.querySelectorAll('.place-card');

const revealOnScroll = function() {
    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight - 150) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
}

window.addEventListener('scroll', revealOnScroll);
window.addEventListener('load', revealOnScroll);

// Initialize place cards with initial state
revealElements.forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'all 0.6s ease-out';
});

// Translation functionality
const translations = {
    currentLang: 'en',
    cache: new Map()
};

async function translateText(text, targetLang) {
    if (!text.trim()) return text;
    
    // Check cache first
    const cacheKey = `${text}_${targetLang}`;
    if (translations.cache.has(cacheKey)) {
        return translations.cache.get(cacheKey);
    }

    try {
        const response = await fetch('https://libretranslate.de/translate', {
            method: 'POST',
            body: JSON.stringify({
                q: text,
                source: 'auto',
                target: targetLang,
                format: 'text'
            }),
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) throw new Error('Translation failed');
        
        const data = await response.json();
        // Cache the result
        translations.cache.set(cacheKey, data.translatedText);
        return data.translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text;
    }
}

function shouldTranslateNode(node) {
    // Skip these elements
    const skipElements = ['SCRIPT', 'STYLE', 'IFRAME', 'CODE', 'PRE'];
    if (skipElements.includes(node.nodeName)) return false;

    // Skip elements with these classes
    const skipClasses = ['language-btn', 'brand-icon', 'fa', 'fas'];
    if (node.classList && skipClasses.some(cls => node.classList.contains(cls))) return false;

    // Skip elements with these attributes
    if (node.hasAttribute('data-no-translate')) return false;

    return true;
}

async function translateNode(node, targetLang) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text && text.length > 1) {  // Only translate if text is meaningful
            node.textContent = await translateText(text, targetLang);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE && shouldTranslateNode(node)) {
        // Translate placeholder and value attributes for inputs
        if (node.tagName === 'INPUT' || node.tagName === 'TEXTAREA') {
            if (node.placeholder) {
                node.placeholder = await translateText(node.placeholder, targetLang);
            }
            if (node.value && node.type !== 'password' && node.type !== 'email') {
                node.value = await translateText(node.value, targetLang);
            }
        }

        // Translate alt text for images
        if (node.tagName === 'IMG' && node.alt) {
            node.alt = await translateText(node.alt, targetLang);
        }

        // Recursively translate child nodes
        for (const child of node.childNodes) {
            await translateNode(child, targetLang);
        }
    }
}

async function translatePage(targetLang) {
    if (translations.currentLang === targetLang) return;

    // Show loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'translation-loading';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <span>Translating to ${targetLang.toUpperCase()}...</span>
        <div class="translation-progress">0%</div>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        // Get all text nodes in the body
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ALL,
            null,
            false
        );

        const nodes = [];
        while (walker.nextNode()) {
            if (shouldTranslateNode(walker.currentNode)) {
                nodes.push(walker.currentNode);
            }
        }

        // Translate nodes in batches to show progress
        const batchSize = 10;
        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            await Promise.all(batch.map(node => translateNode(node, targetLang)));
            
            // Update progress
            const progress = Math.min(100, Math.round((i + batchSize) / nodes.length * 100));
            const progressEl = loadingIndicator.querySelector('.translation-progress');
            if (progressEl) progressEl.textContent = `${progress}%`;
        }

        translations.currentLang = targetLang;
    } catch (error) {
        console.error('Translation error:', error);
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'translation-error';
        errorDiv.textContent = 'Translation failed. Please try again later.';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    } finally {
        // Remove loading indicator
        loadingIndicator.remove();
    }
}

// Language Selector Functionality
document.addEventListener('DOMContentLoaded', function() {
    const languageSearch = document.querySelector('.language-search input');
    const languageItems = document.querySelectorAll('.language-list a');

    // Search functionality
    languageSearch.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        languageItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    });

    // Language selection
    languageItems.forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const newLang = this.getAttribute('data-lang');
            if (translations.currentLang === newLang) return;

            // Update active state
            languageItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Update button text
            const selectedLang = this.textContent.trim();
            const langBtn = document.querySelector('.language-btn span');
            langBtn.textContent = selectedLang;

            // Translate the page
            await translatePage(newLang);

            // Close dropdown
            const dropdown = document.querySelector('.language-dropdown');
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(10px)';
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const languageSelector = document.querySelector('.language-selector');
        if (!languageSelector.contains(e.target)) {
            const dropdown = languageSelector.querySelector('.language-dropdown');
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(10px)';
        }
    });
});
