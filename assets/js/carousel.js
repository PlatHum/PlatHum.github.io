document.addEventListener('DOMContentLoaded', function() {
    const slider = document.querySelector('.carousel');
    const arrowLeft = document.querySelector('.arrow-left');
    const arrowRight = document.querySelector('.arrow-right');
    const slides = Array.from(document.querySelectorAll('.cards label'));

    arrowLeft.addEventListener('click', function() {
        const currentSlide = document.querySelector('input[name="slider"]:checked');
        if (currentSlide === slides[0].control) {

            slides[slides.length - 1].control.checked = true;
        }else{
            const prevSlide = currentSlide.previousElementSibling || slider.lastElementChild;
            prevSlide.checked = true;
        }
        currentSlide.checked=false;
    });

    arrowRight.addEventListener('click', function() {
        const currentSlide = document.querySelector('input[name="slider"]:checked');
        if (currentSlide === slides[slides.length - 1].control) {
            slides[0].control.checked = true;
        }else{
            const nextSlide = currentSlide.nextElementSibling || slider.firstElementChild;
            nextSlide.checked = true;
        }
        currentSlide.checked=false;
    });
});
