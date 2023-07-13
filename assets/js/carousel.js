document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.carousel');
    const arrowLeft = document.querySelector('.arrow-left');
    const arrowRight = document.querySelector('.arrow-right');
    const slides = Array.from(document.querySelectorAll('.cards label'));
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 60; // Configurable threshold for swipe distance
    const maxSlidesToSwipe = 2; // Maximum number of slides to swipe at a time

    arrowLeft.addEventListener('click', goLeft);
    arrowRight.addEventListener('click', goRight);

    slider.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
    });

    slider.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].clientX;
        handleSwipe();
    });

    function goLeft() {
        const currentSlide = document.querySelector('input[name="slider"]:checked');
        if (currentSlide === slides[0].control) {

            slides[slides.length - 1].control.checked = true;
        }else{
            const prevSlide = currentSlide.previousElementSibling || slider.lastElementChild;
            prevSlide.checked = true;
        }
        currentSlide.checked=false;
    }

    function goRight() {
        const currentSlide = document.querySelector('input[name="slider"]:checked');
        if (currentSlide === slides[slides.length - 1].control) {
            slides[0].control.checked = true;
        }else{
            const nextSlide = currentSlide.nextElementSibling || slider.firstElementChild;
            nextSlide.checked = true;
        }
        currentSlide.checked=false;
    }
    function handleSwipe() {
        const swipeDistance = touchEndX - touchStartX;

        if (Math.abs(swipeDistance) >= swipeThreshold) {
            const numSlidesToSwipe = Math.min(Math.floor(Math.abs(swipeDistance) / swipeThreshold),maxSlidesToSwipe);
            const direction = swipeDistance < 0 ? 'next' : 'prev';

            for (let i = 0; i < numSlidesToSwipe; i++) {
                if (direction === 'next') {
                    goRight();
                } else {
                    goLeft();
                }
            }
        }
    }
});
