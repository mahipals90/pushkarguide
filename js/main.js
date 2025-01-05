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

// Translation functionality with persistent cache
const translations = {
    currentLang: 'en',
    cache: new Map(),
    version: '1.0' // For cache versioning
};

// Load cached translations from localStorage
function loadCache() {
    try {
        const savedCache = localStorage.getItem('translationCache');
        const savedVersion = localStorage.getItem('translationVersion');
        
        if (savedCache && savedVersion === translations.version) {
            const parsed = JSON.parse(savedCache);
            Object.entries(parsed).forEach(([key, value]) => {
                translations.cache.set(key, value);
            });
            console.log('Loaded translations from cache');
        }
    } catch (error) {
        console.error('Error loading cache:', error);
    }
}

// Save translations to localStorage
function saveCache() {
    try {
        const cacheObj = Object.fromEntries(translations.cache);
        localStorage.setItem('translationCache', JSON.stringify(cacheObj));
        localStorage.setItem('translationVersion', translations.version);
    } catch (error) {
        console.error('Error saving cache:', error);
    }
}

// Initialize cache
loadCache();

// Batch translation function
async function translateBatch(texts, targetLang) {
    if (texts.length === 0) return [];
    
    const uniqueTexts = [...new Set(texts)];
    const results = new Map();
    const toTranslate = [];

    // Check cache first
    uniqueTexts.forEach(text => {
        const cacheKey = `${text}_${targetLang}`;
        if (translations.cache.has(cacheKey)) {
            results.set(text, translations.cache.get(cacheKey));
        } else {
            toTranslate.push(text);
        }
    });

    if (toTranslate.length === 0) {
        return texts.map(text => results.get(text));
    }

    try {
        // Using MyMemory Translation API with batch processing
        const batchPromises = toTranslate.map(text =>
            fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`)
                .then(response => response.json())
                .then(data => {
                    if (data.responseStatus === 200 && data.responseData.translatedText) {
                        const translatedText = data.responseData.translatedText;
                        const cacheKey = `${text}_${targetLang}`;
                        translations.cache.set(cacheKey, translatedText);
                        results.set(text, translatedText);
                        return translatedText;
                    }
                    throw new Error('Translation failed');
                })
                .catch(() => text) // Fallback to original text on error
        );

        await Promise.all(batchPromises);
        saveCache(); // Save updated cache
        
        return texts.map(text => results.get(text) || text);
    } catch (error) {
        console.error('Batch translation error:', error);
        return texts; // Return original texts on error
    }
}

async function translateNode(node, targetLang) {
    if (!node || !shouldTranslateNode(node)) return;

    try {
        // Collect all text content first
        const textParts = [];
        const nodeMap = new Map();

        function collectText(n) {
            if (n.nodeType === Node.TEXT_NODE) {
                const text = n.textContent.trim();
                if (text && text.length > 1) {
                    textParts.push(text);
                    nodeMap.set(text, n);
                }
            } else if (n.nodeType === Node.ELEMENT_NODE && shouldTranslateNode(n)) {
                if (n.hasAttribute('data-translate')) {
                    const text = n.textContent.trim();
                    if (text) {
                        textParts.push(text);
                        nodeMap.set(text, n);
                    }
                }
                Array.from(n.childNodes).forEach(collectText);
            }
        }

        collectText(node);

        // Translate all collected text at once
        if (textParts.length > 0) {
            const translatedTexts = await translateBatch(textParts, targetLang);
            
            // Apply translations
            textParts.forEach((text, index) => {
                const node = nodeMap.get(text);
                if (node) {
                    node.textContent = translatedTexts[index];
                }
            });
        }
    } catch (error) {
        console.error('Error translating node:', error);
    }
}

async function translatePage(targetLang) {
    if (translations.currentLang === targetLang) return;

    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'translation-loading';
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <span>Translating to ${targetLang.toUpperCase()}...</span>
        <div class="translation-progress">0%</div>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        // First, collect all translatable nodes
        const nodes = [];
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            { acceptNode: (node) => shouldTranslateNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT }
        );

        while (walker.nextNode()) {
            nodes.push(walker.currentNode);
        }

        // Process nodes in larger batches
        const batchSize = 20;
        for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            await Promise.all(batch.map(node => translateNode(node, targetLang)));
            
            const progress = Math.min(100, Math.round((i + batchSize) / nodes.length * 100));
            const progressEl = loadingIndicator.querySelector('.translation-progress');
            if (progressEl) progressEl.textContent = `${progress}%`;
        }

        translations.currentLang = targetLang;
        saveCache(); // Save final cache state
    } catch (error) {
        console.error('Translation error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'translation-error';
        errorDiv.textContent = 'Translation failed. Please try again later.';
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    } finally {
        loadingIndicator.remove();
    }
}

function shouldTranslateNode(node) {
    if (!node) return false;

    // Skip these elements
    const skipElements = ['SCRIPT', 'STYLE', 'IFRAME', 'CODE', 'PRE', 'BUTTON'];
    if (skipElements.includes(node.nodeName)) return false;

    // Skip elements with these classes
    const skipClasses = ['fa', 'fas', 'far', 'fab', 'language-btn', 'brand-icon'];
    if (node.classList && Array.from(node.classList).some(cls => skipClasses.includes(cls))) return false;

    // Skip elements with these attributes
    if (node.hasAttribute('data-no-translate')) return false;

    return true;
}

// Language selector functionality
document.addEventListener('DOMContentLoaded', function() {
    const languageBtn = document.querySelector('.language-btn');
    const dropdown = document.querySelector('.language-dropdown');
    const languageSearch = document.querySelector('.language-search input');
    const languageItems = document.querySelectorAll('.language-list a');

    // Language search
    languageSearch?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        languageItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    });

    // Toggle dropdown
    languageBtn?.addEventListener('click', function(e) {
        e.stopPropagation();
        const isVisible = dropdown.style.visibility === 'visible';
        dropdown.style.opacity = isVisible ? '0' : '1';
        dropdown.style.visibility = isVisible ? 'hidden' : 'visible';
        dropdown.style.transform = isVisible ? 'translateY(10px)' : 'translateY(0)';
    });

    // Language selection
    languageItems.forEach(item => {
        item.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const newLang = this.getAttribute('data-lang');
            if (!newLang || translations.currentLang === newLang) return;

            // Update active state
            languageItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Update button text
            const selectedLang = this.querySelector('span:last-child')?.textContent || this.textContent;
            const langBtnText = languageBtn.querySelector('span');
            if (langBtnText) langBtnText.textContent = selectedLang;

            // Close dropdown
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(10px)';

            // Translate the page
            await translatePage(newLang);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (dropdown && !dropdown.contains(e.target) && !languageBtn.contains(e.target)) {
            dropdown.style.opacity = '0';
            dropdown.style.visibility = 'hidden';
            dropdown.style.transform = 'translateY(10px)';
        }
    });
});

// Smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
