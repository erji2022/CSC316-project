export class ScrollManager {
    constructor() {
        this.container = document.getElementById('scroll-container');
        this.dotsContainer = document.getElementById('dots-container');
        this.pages = document.querySelectorAll('.page');
        this.currentPage = 0;
        this.isScrolling = false;
        this.deltaAccumulator = 0;
        this.scrollThreshold = 100; // adjust threshold as needed

        this.initDots();
        this.initEventListeners();
    }

    initDots() {
        this.pages.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dot.dataset.pageId = index;
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', (e) => this.handleDotClick(e));
            this.dotsContainer.appendChild(dot);
        });
    }

    initEventListeners() {
        this.container.addEventListener('wheel', (e) => this.handleScroll(e), {passive: false});
    }

    handleDotClick(e) {
        const pageId = parseInt(e.target.dataset.pageId);
        this.scrollToPage(pageId);
    }

    scrollToPage(pageId) {
        this.currentPage = pageId;
        this.container.scrollTo({
            top: window.innerHeight * pageId,
            behavior: 'smooth'
        });
        this.updateDots();
    }

    handleScroll(e) {
        e.preventDefault();
        // Only handle new scroll if not already scrolling
        if (this.isScrolling) return;

        // Accumulate delta
        this.deltaAccumulator += e.deltaY;

        // Check if accumulated delta exceeds threshold
        if (Math.abs(this.deltaAccumulator) >= this.scrollThreshold) {
            this.isScrolling = true;

            if (this.deltaAccumulator > 0 && this.currentPage < this.pages.length - 1) {
                this.currentPage++;
            } else if (this.deltaAccumulator < 0 && this.currentPage > 0) {
                this.currentPage--;
            }

            this.scrollToPage(this.currentPage);
            this.deltaAccumulator = 0;

            // Reset isScrolling flag after a timeout (or better, when scroll ends)
            setTimeout(() => {
                this.isScrolling = false;
            }, 1000);
        }
    }

    updateDots() {
        document.querySelectorAll('.dot').forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentPage);
        });
    }
}
