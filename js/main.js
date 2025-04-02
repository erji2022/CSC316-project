import {ScrollManager} from './scroll.js';
import {initTitlePage} from './titlePage.js';
import {initClimateChangeVisPage} from './climateChangeVisPage.js';
import {initAirQualityVisPage} from './airQualityVisPage.js';
import {initPlasticWasteVisPage} from './plasticWasteVisPage.js';
import {initWaterQualityVisPage} from './waterQualityVisPage.js';
import {initReflectionPage} from './reflectionPage.js';
import {initAirQualityImgPage} from "./airQualityImgPage.js";
import {initClimateChangeImgPage} from "./climateChangeImgPage.js";
import {initPlasticWasteImgPage} from "./plasticWasteImgPage.js";
import {initWaterQualityImgPage} from "./waterQualityImgPage.js";

// Initialize scroll manager
const scrollManager = new ScrollManager();
window.scrollManager = scrollManager;

// Initialize all page-specific code when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initTitlePage();
    initClimateChangeImgPage();
    initClimateChangeVisPage();
    initAirQualityImgPage();
    initAirQualityVisPage();
    initPlasticWasteImgPage();
    initPlasticWasteVisPage();
    initWaterQualityImgPage();
    initWaterQualityVisPage();
    initReflectionPage();
});