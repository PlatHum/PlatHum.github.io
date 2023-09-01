const swiper = new Swiper('.swiper', {
    init:false,
    speed: 500,
    breakpoints: {
      // when window width is >= 10px
      10: {
        effect: 'slide',
        slidesPerView: 'auto',
        spaceBetween: 10,
      },
      // when window width is >= 900px
      900: {
        spaceBetween: 100,
        effect: 'coverflow',
        coverflowEffect: {
            rotate: 5,
            stretch: 0,
            depth: 90,
            modifier: 1,
          },
          slidesPerView: 'auto',
      }
    },
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