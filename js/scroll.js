export class ScrollManager {
    constructor() {
        this.container = document.getElementById('scroll-container');
        this.dotsContainer = document.getElementById('dots-container');
        this.pages = document.querySelectorAll('.page');
        this.currentPage = 0;
        this.isScrolling = false;

        this.initDots();
        this.initEventListeners();
    }

    initDots() {
        // Create a dot on the right for each page and add click events
        this.pages.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.dataset.pageId = index;
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', (e) => this.handleDotClick(e));
            this.dotsContainer.appendChild(dot);
        });
    }

    // Add scroll event
    initEventListeners() {
        this.container.addEventListener('scroll', () => this.handleScroll());
    }

    // Scroll to the correct page on click
    handleDotClick(e) {
        const pageId = parseInt(e.target.dataset.pageId);
        this.scrollToPage(pageId);
    }

    // Set to a page
    scrollToPage(pageId) {
        this.currentPage = pageId;
        this.container.scrollTo({
            top: window.innerHeight * pageId,
            behavior: 'smooth'
        });
        this.updateDots();
    }

    // Handle scrolling
    handleScroll() {
        if (!this.isScrolling) {
            this.isScrolling = true;
            window.requestAnimationFrame(() => {
                this.currentPage = Math.round(this.container.scrollTop / window.innerHeight);
                this.updateDots();
                this.isScrolling = false;
            });
        }
    }

    // Update the dots on the right
    updateDots() {
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPage);
        });
    }
}