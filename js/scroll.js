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
        this.container.addEventListener('wheel', (e) => this.handleScroll(e), { passive: false });
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
    handleScroll(e) {
        // Prevent native scrolling
        e.preventDefault();

        // Only allow one scroll at a time
        if (this.isScrolling) return;
        this.isScrolling = true;

        // Determine direction: deltaY > 0 means scrolling down, deltaY < 0 scrolling up
        if (e.deltaY > 0) {
            // Move to next page if exists
            if (this.currentPage < this.pages.length - 1) {
                this.currentPage++;
            }
        } else {
            // Move to previous page if exists
            if (this.currentPage > 0) {
                this.currentPage--;
            }
        }
        this.scrollToPage(this.currentPage);

        // Reset isScrolling flag after the smooth scroll animation completes
        setTimeout(() => {
            this.isScrolling = false;
        }, 1000);
    }

    // Update the dots on the right
    updateDots() {
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPage);
        });
    }
}