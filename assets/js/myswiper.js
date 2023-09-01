const swiper = new Swiper('.swiper', {
    init:false,
    speed: 500,
    spaceBetween:150,
    // Optional parameters
    effect: 'coverflow',
    coverflowEffect: {
        rotate: 5,
        stretch: 0,
        depth: 90,
        modifier: 1,
      },
      breakpoints: {
        // when window width is >= 160px
        160: {
          spaceBetween: 25
        },
        // when window width is >= 640px
        900: {
          spaceBetween: 150
        }
      },
    slidesPerView: 2,
  
    // If we need pagination
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
  
    // Navigation arrows
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    keyboard:{
        enabled: true,
    },
    grabCursor: true,
    loop:true,
  });

  swiper.init();