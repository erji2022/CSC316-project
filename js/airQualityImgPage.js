
export function initAirQualityImgPage() {
    // Get the element where the image will be inserted
    const airQualityImgPage = document.getElementById('airQualityImgPage');
    // Create a new image element
    const image = document.createElement('img');
    image.src = '/images/Air-pollution.webp';
    // add styling to center the image
    image.style.display = 'block';
    image.style.margin = '0 auto';
    image.style.maxWidth = '50%';
    image.style.height = 'auto';

    // Append the image element
    airQualityImgPage.appendChild(image);
}
