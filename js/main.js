import {ScrollManager} from './scroll.js';
import {initPage0} from './page0.js';
import {initPage1} from './page1.js';
import {initPage2} from './page2.js';
import {initPage3} from './page3.js';
import {initPage4} from './page4.js';
import {initPage5} from './page5.js';

// Initialize scroll manager
const scrollManager = new ScrollManager();
window.scrollManager = scrollManager;

// Initialize all page-specific code when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initPage0();
    initPage1();
    initPage2();
    initPage3();
    initPage4();
    initPage5();
});