const headerNav = document.querySelector('.header-nav');
const navToggle = document.querySelector('.mobile-nav-toggle');

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