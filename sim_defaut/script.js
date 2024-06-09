document.addEventListener("DOMContentLoaded", function() {
    const slider = document.getElementById('slider');
    const images = slider.querySelectorAll('img');
    const totalImages = images.length;
    let currentIndex = 0;

    const progressBar = document.getElementById('progress-bar');
    progressBar.max = totalImages - 1;

    const updateImage = (index) => {
        images.forEach((img, i) => {
            img.classList.toggle('active', i === index);
        });
        progressBar.value = index;
    };

    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    prevBtn.addEventListener('click', function() {
        currentIndex = (currentIndex === 0) ? totalImages - 1 : currentIndex - 1;
        updateImage(currentIndex);
    });

    nextBtn.addEventListener('click', function() {
        currentIndex = (currentIndex === totalImages - 1) ? 0 : currentIndex + 1;
        updateImage(currentIndex);
    });

    progressBar.addEventListener('input', function() {
        currentIndex = parseInt(progressBar.value, 10);
        updateImage(currentIndex);
    });

    // Initial image
    updateImage(0);
});
