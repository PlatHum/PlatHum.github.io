const headerNav = document.querySelector('.header-nav');
const navToggle = document.querySelector('.mobile-nav-toggle');
const navBarHeight = document.querySelector('.header').offsetHeight;

navToggle.addEventListener('click', () => {
    const visibility = headerNav.getAttribute('data-visible');
    
    if(visibility==="false"){
        headerNav.setAttribute('data-visible',"true");
        navToggle.setAttribute('aria-expanded', "true");
    }else{
        headerNav.setAttribute('data-visible',"false");
        navToggle.setAttribute('aria-expanded',"false");
    }
})
    document.documentElement.style.setProperty('--scroll-padding',navBarHeight -1 +"px")
