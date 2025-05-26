// ArtMart Application - Main JavaScript File

// Global state management
const AppState = {
    products: [],
    currentProduct: null,
    isLoading: false,
    error: null
};

// Stripe configuration
const STRIPE_PUBLIC_KEY = 'pk_test_51234567890abcdef'; // Test key - replace with actual key
let stripe = null;

// Initialize Stripe if available
if (typeof Stripe !== 'undefined') {
    stripe = Stripe(STRIPE_PUBLIC_KEY);
}

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize the application
function initializeApp() {
    const currentPage = getCurrentPage();
    
    switch (currentPage) {
        case 'index':
            initializeHomePage();
            break;
        case 'sell':
            initializeSellPage();
            break;
        case 'product':
            initializeProductPage();
            break;
        default:
            console.log('Page initialized:', currentPage);
    }
}

// Get current page identifier
function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    
    if (filename === 'index.html' || filename === '') {
        return 'index';
    } else if (filename === 'sell.html') {
        return 'sell';
    } else if (path.includes('/products/')) {
        return 'product';
    }
    
    return filename.replace('.html', '');
}

// ===============================
// HOME PAGE FUNCTIONALITY
// ===============================

function initializeHomePage() {
    loadProducts()
        .then(() => {
            renderFeaturedProducts();
            renderAllProducts();
        })
        .catch(error => {
            showError('Failed to load products. Please refresh the page to try again.');
            console.error('Error loading products:', error);
        });
}

// Load products from embedded JSON data
async function loadProducts() {
    try {
        setLoading(true);
        const products = [
  {
    "slug": "mystic-mountains",
    "title": "Mystic Mountains",
    "artist": "Aria Patel",
    "description": "A breathtaking landscape painting capturing the ethereal beauty of the Himalayas at dawn. This piece uses traditional watercolor techniques to create a dreamlike atmosphere with soft blues and warm oranges.",
    "price": 15000,
    "category": "painting",
    "imageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
    "dateAdded": "2024-01-15"
  },
  {
    "slug": "urban-symphony",
    "title": "Urban Symphony",
    "artist": "Raj Kumar",
    "description": "A vibrant acrylic painting depicting the bustling energy of Mumbai streets. Bold strokes and vivid colors bring to life the chaos and beauty of urban India.",
    "price": 12500,
    "category": "painting",
    "imageUrl": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
    "dateAdded": "2024-01-10"
  },
  {
    "slug": "dancing-peacock",
    "title": "Dancing Peacock",
    "artist": "Meera Sharma",
    "description": "An intricate bronze sculpture inspired by classical Indian dance forms. The piece captures the grace and majesty of a peacock in full display, symbolizing beauty and pride.",
    "price": 28000,
    "category": "sculpture",
    "imageUrl": "https://images.unsplash.com/photo-1606041008023-472dfb5e530f?w=400&h=300&fit=crop",
    "dateAdded": "2024-01-08"
  },
  {
    "slug": "digital-mandala",
    "title": "Digital Mandala",
    "artist": "Kiran Tech",
    "description": "A contemporary digital artwork that reimagines traditional mandala patterns using modern design tools. The piece explores the intersection of ancient wisdom and digital innovation.",
    "price": 8500,
    "category": "digital",
    "imageUrl": "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
    "dateAdded": "2024-01-05"
  },
  {
    "slug": "monsoon-memories",
    "title": "Monsoon Memories",
    "artist": "Priya Iyer",
    "description": "A photographic series capturing the essence of Indian monsoons. Shot during the 2023 monsoon season across different states, showcasing the transformative power of rain.",
    "price": 6500,
    "category": "photography",
    "imageUrl": "https://images.unsplash.com/photo-1571771019784-3ff35f4f4277?w=400&h=300&fit=crop",
    "dateAdded": "2024-01-03"
  },
  {
    "slug": "heritage-fusion",
    "title": "Heritage Fusion",
    "artist": "Ankit Verma",
    "description": "A mixed media artwork combining traditional Indian textiles, contemporary painting techniques, and digital elements. This piece bridges the gap between heritage crafts and modern art.",
    "price": 18500,
    "category": "mixed-media",
    "imageUrl": "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop",
    "dateAdded": "2024-01-01"
  }
];
        AppState.products = products;
        setLoading(false);
        return products;
    } catch (error) {
        setLoading(false);
        throw error;
    }
}

// Render featured products carousel
function renderFeaturedProducts() {
    const carousel = document.getElementById('featuredCarousel');
    if (!carousel) return;
    
    const featuredProducts = AppState.products.slice(0, 6); // Show first 6 as featured
    
    if (featuredProducts.length === 0) {
        carousel.innerHTML = '<div class="no-products">No featured products available</div>';
        return;
    }
    
    carousel.innerHTML = featuredProducts.map(product => `
        <div class="carousel-item" onclick="navigateToProduct('${product.slug}')">
            <div class="product-image">
                <img src="${product.imageUrl}" alt="${product.title}" loading="lazy">
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.title}</h4>
                <p class="product-artist">${product.artist || 'Unknown Artist'}</p>
                <p class="product-price">₹${product.price.toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Render all products grid
function renderAllProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    if (AppState.products.length === 0) {
        grid.innerHTML = '<div class="no-products">No products available</div>';
        return;
    }
    
    grid.innerHTML = AppState.products.map(product => `
        <div class="product-card" onclick="navigateToProduct('${product.slug}')">
            <div class="product-image">
                <img src="${product.imageUrl}" alt="${product.title}" loading="lazy">
            </div>
            <div class="product-info">
                <h4 class="product-title">${product.title}</h4>
                <p class="product-artist">${product.artist || 'Unknown Artist'}</p>
                <p class="product-description">${product.description}</p>
                <p class="product-price">₹${product.price.toLocaleString()}</p>
            </div>
        </div>
    `).join('');
}

// Navigate to product page
function navigateToProduct(slug) {
    window.location.href = `products/${slug}.html`;
}

// Carousel navigation
let currentCarouselIndex = 0;

function moveCarousel(direction) {
    const carousel = document.getElementById('featuredCarousel');
    if (!carousel) return;
    
    const items = carousel.children;
    const itemWidth = items[0]?.offsetWidth || 300;
    const gap = 24; // 1.5rem gap
    const scrollDistance = itemWidth + gap;
    
    currentCarouselIndex += direction;
    
    // Loop around if needed
    if (currentCarouselIndex < 0) {
        currentCarouselIndex = Math.max(0, items.length - 3);
    } else if (currentCarouselIndex >= items.length - 2) {
        currentCarouselIndex = 0;
    }
    
    carousel.scrollTo({
        left: currentCarouselIndex * scrollDistance,
        behavior: 'smooth'
    });
}

// Scroll to products section
function scrollToProducts() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ===============================
// SELL PAGE FUNCTIONALITY
// ===============================

function initializeSellPage() { /* ... rest of code unchanged ... */ }

// ===============================
// UTILITY FUNCTIONS
// ===============================

function setLoading(isLoading) { /* ... */ }

function showError(message) { /* ... */ }

function formatCurrency(amount) { /* ... */ }

function formatDate(dateString) { /* ... */ }

// ===============================
// PRODUCT PAGE FUNCTIONALITY
// ===============================

function initializeProductPage() { /* ... */ }

// ===============================
// GLOBAL EVENT HANDLERS
// ===============================

window.addEventListener('resize', function() { /* ... */ });
document.addEventListener('keydown', function(event) { /* ... */ });

if (!('scrollBehavior' in document.documentElement.style)) {
    console.log('Smooth scroll not supported, consider adding polyfill');
}

// Export functions for global access
window.AppState = AppState;
window.moveCarousel = moveCarousel;
window.scrollToProducts = scrollToProducts;
window.navigateToProduct = navigateToProduct;
window.resetForm = resetForm;
