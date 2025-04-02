// reflectionPage.js
export function initReflectionPage() {
    const pageElement = document.querySelector('#reflectionPage');

    // Set up the Restart Story button to scroll back to the top (Introduction Page)
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (window.scrollManager) {
                window.scrollManager.currentPage = 0;
                window.scrollManager.scrollToPage(0);
            }
        });
    }

    pageElement.addEventListener('click', () => {
        console.log('Clicked Conclusion & Call-to-Action Page');
    });
}