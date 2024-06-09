document.addEventListener("DOMContentLoaded", function() {
    const images = document.querySelectorAll('.background-image');
    let currentIndex = 0;

    setInterval(() => {
        images[currentIndex].classList.add('hidden');
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].classList.remove('hidden');
    }, 1000);
});
