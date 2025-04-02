
export function initPlasticWasteImgPage() {
    // Get the element where the image will be inserted
    const plasticWasteImgPage = document.getElementById('plasticWasteImgPage');

    // Create a container for the images with flex display for side-by-side layout
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center'; // Center images horizontally
    container.style.alignItems = 'center';     // Align images vertically
    container.style.gap = '20px';

    // Create the first image element
    const image1 = document.createElement('img');
    image1.src = '/images/plastic.jpg';
    image1.style.display = 'block';
    image1.style.margin = '0 auto';
    image1.style.maxWidth = '40%';
    image1.style.height = 'auto';

    // Create the second image element
    const image2 = document.createElement('img');
    image2.src = '/images/plasticOcean.jpg';
    image2.style.display = 'block';
    image2.style.margin = '20px auto';
    image2.style.maxWidth = '40%';
    image2.style.height = 'auto';

    // Append both images
    container.appendChild(image1);
    container.appendChild(image2);

    plasticWasteImgPage.appendChild(container);
}
