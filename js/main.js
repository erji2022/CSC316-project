import { ScrollManager } from './scroll.js';
import { initPage1 } from '../../../project/CSC316-project/js/page1.js';
import { initPage2 } from '../../../project/CSC316-project/js/page2.js';
import { initPage3 } from "../../../project/CSC316-project/js/page3.js";

// Initialize scroll manager
const scrollManager = new ScrollManager();

// Initialize page-specific code
document.addEventListener('DOMContentLoaded', () => {
    initPage1();
    initPage2();
    initPage3();
});