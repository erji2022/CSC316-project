import {ScrollManager} from './scroll.js';
import {initPage1} from './page1.js';
import {initPage2} from './page2.js';
import {initPage3} from './page3.js';

// Initialize scroll manager
const scrollManager = new ScrollManager();

// Initialize page-specific code
document.addEventListener('DOMContentLoaded', () => {
    initPage1();
    initPage2();
    initPage3();
});