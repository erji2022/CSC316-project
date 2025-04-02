
export function initWaterQualityImgPage() {
    // Get the element where the image will be inserted
    const waterQualityImgPage = document.getElementById('waterQualityImgPage');
    // Create a new image element
    const image = document.createElement('img');
    // Set the image source to a file in the /images directory (replace with your actual file name)
    image.src = '/images/waterPollution.jpeg';
    // Optionally, add styling to center the image
    image.style.display = 'block';
    image.style.margin = '0 auto';
    image.style.maxWidth = '50%';
    image.style.height = 'auto';

    // Append the image element
    waterQualityImgPage.appendChild(image);
}
