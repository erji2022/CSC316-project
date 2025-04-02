// titlePage.js
export function initTitlePage() {
    const pageElement = document.querySelector('#titlePage');
    pageElement.addEventListener('click', () => {
        console.log('Clicked Introduction Page');
    });
}