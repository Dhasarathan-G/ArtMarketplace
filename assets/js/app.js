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

// Load products from JSON file
async function loadProducts() {
    try {
        setLoading(true);
        const response = await fetch('_data/products.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
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
    window.location.href = `products/template.html?id=${slug}`;
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

function initializeSellPage() {
    const form = document.getElementById('sellForm');
    const imageUpload = document.getElementById('imageUpload');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    
    if (form) {
        form.addEventListener('submit', handleSellFormSubmit);
        
        // Form field event listeners for live preview
        ['title', 'artist', 'description', 'price', 'category'].forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('input', updatePreview);
            }
        });
    }
    
    if (imageUpload && uploadPlaceholder) {
        // File upload handling
        imageUpload.addEventListener('change', handleImageUpload);
        
        // Drag and drop functionality
        uploadPlaceholder.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadPlaceholder.style.background = 'hsl(var(--primary-color) / 0.1)';
        });
        
        uploadPlaceholder.addEventListener('dragleave', () => {
            uploadPlaceholder.style.background = '';
        });
        
        uploadPlaceholder.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadPlaceholder.style.background = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageUpload.files = files;
                handleImageUpload({ target: { files } });
            }
        });
        
        uploadPlaceholder.addEventListener('click', () => {
            imageUpload.click();
        });
    }
}

// Handle image upload
function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showFieldError('imageUpload', 'Please select a valid image file');
        return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
        showFieldError('imageUpload', 'Image size must be less than 5MB');
        return;
    }
    
    // Clear any previous error
    clearFieldError('imageUpload');
    
    // Create preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const previewImage = document.getElementById('previewImage');
        if (previewImage) {
            previewImage.innerHTML = `<img src="${e.target.result}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
        
        // Update upload placeholder
        const uploadPlaceholder = document.getElementById('uploadPlaceholder');
        if (uploadPlaceholder) {
            uploadPlaceholder.innerHTML = `
                <div class="upload-success">
                    <div class="upload-icon">✅</div>
                    <p>Image uploaded successfully</p>
                    <small>${file.name}</small>
                </div>
            `;
        }
    };
    reader.readAsDataURL(file);
}

// Update live preview
function updatePreview() {
    const title = document.getElementById('title')?.value || 'Artwork Title';
    const artist = document.getElementById('artist')?.value || 'Artist Name';
    const description = document.getElementById('description')?.value || 'Description will appear here...';
    const price = document.getElementById('price')?.value || '0';
    const category = document.getElementById('category')?.value || 'Category';
    
    // Update preview elements
    const previewTitle = document.getElementById('previewTitle');
    const previewArtist = document.getElementById('previewArtist');
    const previewDescription = document.getElementById('previewDescription');
    const previewPrice = document.getElementById('previewPrice');
    const previewCategory = document.getElementById('previewCategory');
    
    if (previewTitle) previewTitle.textContent = title;
    if (previewArtist) previewArtist.textContent = artist;
    if (previewDescription) previewDescription.textContent = description;
    if (previewPrice) previewPrice.textContent = `₹${parseInt(price || 0).toLocaleString()}`;
    if (previewCategory) previewCategory.textContent = category;
    
    // Show preview container if any field has content
    const previewContainer = document.getElementById('previewContainer');
    if (previewContainer && (title || artist || description || price)) {
        previewContainer.style.display = 'block';
    }
}

// Handle sell form submission
async function handleSellFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const submitBtn = document.getElementById('submitBtn');
    
    // Validate form
    if (!validateSellForm(formData)) {
        return;
    }
    
    try {
        // Disable submit button
        submitBtn.disabled = true;
        submitBtn.textContent = 'Listing Artwork...';
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create new product object
        const newProduct = {
            slug: generateSlug(formData.get('title')),
            title: formData.get('title'),
            artist: formData.get('artist'),
            description: formData.get('description'),
            price: parseInt(formData.get('price')),
            category: formData.get('category'),
            imageUrl: 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(formData.get('title')),
            dateAdded: new Date().toLocaleDateString()
        };
        
        // Add to products array (client-side simulation)
        AppState.products.push(newProduct);
        
        // Show success message
        showSuccessMessage();
        
    } catch (error) {
        console.error('Error submitting form:', error);
        alert('Failed to list artwork. Please try again.');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'List Artwork';
    }
}

// Validate sell form
function validateSellForm(formData) {
    let isValid = true;
    
    // Clear previous errors
    clearAllFieldErrors();
    
    // Validate title
    if (!formData.get('title')?.trim()) {
        showFieldError('title', 'Title is required');
        isValid = false;
    }
    
    // Validate description
    if (!formData.get('description')?.trim()) {
        showFieldError('description', 'Description is required');
        isValid = false;
    }
    
    // Validate price
    const price = parseInt(formData.get('price'));
    if (!price || price < 1) {
        showFieldError('price', 'Please enter a valid price');
        isValid = false;
    }
    
    // Validate artist
    if (!formData.get('artist')?.trim()) {
        showFieldError('artist', 'Artist name is required');
        isValid = false;
    }
    
    // Validate image
    const imageFile = document.getElementById('imageUpload')?.files[0];
    if (!imageFile) {
        showFieldError('imageUpload', 'Please upload an image');
        isValid = false;
    }
    
    return isValid;
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
        field.classList.add('error');
    }
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

// Clear field error
function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorElement = document.getElementById(fieldId + 'Error');
    
    if (field) {
        field.classList.remove('error');
    }
    
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

// Clear all field errors
function clearAllFieldErrors() {
    const errorElements = document.querySelectorAll('.error-text');
    const errorFields = document.querySelectorAll('.error');
    
    errorElements.forEach(el => {
        el.textContent = '';
        el.classList.remove('show');
    });
    
    errorFields.forEach(el => {
        el.classList.remove('error');
    });
}

// Show success message
function showSuccessMessage() {
    const formContainer = document.querySelector('.sell-content');
    const successMessage = document.getElementById('successMessage');
    
    if (formContainer) {
        formContainer.style.display = 'none';
    }
    
    if (successMessage) {
        successMessage.style.display = 'block';
    }
}

// Reset form
function resetForm() {
    const form = document.getElementById('sellForm');
    const formContainer = document.querySelector('.sell-content');
    const successMessage = document.getElementById('successMessage');
    const previewContainer = document.getElementById('previewContainer');
    const uploadPlaceholder = document.getElementById('uploadPlaceholder');
    
    if (form) {
        form.reset();
    }
    
    if (formContainer) {
        formContainer.style.display = 'grid';
    }
    
    if (successMessage) {
        successMessage.style.display = 'none';
    }
    
    if (previewContainer) {
        previewContainer.style.display = 'none';
    }
    
    if (uploadPlaceholder) {
        uploadPlaceholder.innerHTML = `
            <div class="upload-icon">📁</div>
            <p>Click to upload an image or drag and drop</p>
            <small>Supported formats: JPG, PNG, WebP (Max 5MB)</small>
        `;
    }
    
    clearAllFieldErrors();
}

// Generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') + '-' + Date.now();
}

// ===============================
// UTILITY FUNCTIONS
// ===============================

// Set loading state
function setLoading(isLoading) {
    AppState.isLoading = isLoading;
    const loadingElement = document.getElementById('loading');
    
    if (loadingElement) {
        loadingElement.style.display = isLoading ? 'block' : 'none';
    }
}

// Show error message
function showError(message) {
    AppState.error = message;
    const errorElement = document.getElementById('errorMessage');
    
    if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.querySelector('p').textContent = message;
    }
    
    // Hide loading if showing error
    setLoading(false);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ===============================
// PRODUCT PAGE FUNCTIONALITY
// ===============================

function initializeProductPage() {
    // This function is called from the product template HTML
    // The product page has its own inline script for initialization
    console.log('Product page functionality is handled in template.html');
}

// ===============================
// GLOBAL EVENT HANDLERS
// ===============================

// Handle window resize for responsive adjustments
window.addEventListener('resize', function() {
    // Recalculate carousel positioning if needed
    if (window.innerWidth <= 768) {
        // Hide carousel buttons on mobile
        const carouselBtns = document.querySelectorAll('.carousel-btn');
        carouselBtns.forEach(btn => btn.style.display = 'none');
    } else {
        const carouselBtns = document.querySelectorAll('.carousel-btn');
        carouselBtns.forEach(btn => btn.style.display = 'flex');
    }
});

// Handle keyboard navigation
document.addEventListener('keydown', function(event) {
    // Arrow key navigation for carousel
    if (event.key === 'ArrowLeft') {
        moveCarousel(-1);
    } else if (event.key === 'ArrowRight') {
        moveCarousel(1);
    }
});

// Smooth scroll polyfill for older browsers
if (!('scrollBehavior' in document.documentElement.style)) {
    // Add smooth scroll polyfill if needed
    console.log('Smooth scroll not supported, consider adding polyfill');
}

// Export functions for global access
window.AppState = AppState;
window.moveCarousel = moveCarousel;
window.scrollToProducts = scrollToProducts;
window.navigateToProduct = navigateToProduct;
window.resetForm = resetForm;
