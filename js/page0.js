// page0.js
export function initPage0() {
    const pageElement = document.querySelector('#page0');

    // Add any additional interactivity for the introduction page here.
    pageElement.addEventListener('click', () => {
        console.log('Clicked Introduction Page');
    });
}