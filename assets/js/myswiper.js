const swiper = new Swiper('.swiper', {
    init:false,
    speed: 500,
    spaceBetween:42,
    // Optional parameters
    effect: 'coverflow',
    coverflowEffect: {
        rotate: 20,
        slideShadows: false
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