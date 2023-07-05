const navBarHeight = document.querySelector('.header').offsetHeight;
document.documentElement.style.setProperty('--scroll-padding',navBarHeight -1 +"px")

const headerNav = document.querySelector('.header-nav');
const navToggle = document.querySelector('.mobile-nav-toggle');

// Get all sections that have an ID defined
const sections = document.querySelectorAll("section[id]");
// Add an event listener listening for scroll
window.addEventListener("scroll", navHighlighter);

navToggle.addEventListener('click', navButtonToggler);



function navButtonToggler(){
    const visibility = headerNav.getAttribute('data-visible');
    
    if(visibility==="false"){
        headerNav.setAttribute('data-visible',"true");
        navToggle.setAttribute('aria-expanded', "true");
    }else{
        headerNav.setAttribute('data-visible',"false");
        navToggle.setAttribute('aria-expanded',"false");
    }
}

const getOffsetTop = element => {
    let offsetTop = 0;
    while(element) {
      offsetTop += element.offsetTop;
      element = element.offsetParent;
    }
    return offsetTop;
  }

  function navHighlighter() {
    // Get current scroll position
    let Yscroll = window.scrollY;
      
    // Now we loop through sections to get height, top and ID values for each
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = getOffsetTop(current)-100;
      let sectionId = current.getAttribute("id");
      
      /*
      - If our current scroll position enters the space where current section on screen is, add .active class to corresponding navigation link, else remove it
      - To know which link needs an active class, we use sectionId variable we are getting while looping through sections as an selector
      */
      if (
        Yscroll> sectionTop &&
        Yscroll <= sectionTop + sectionHeight
      ){
        document.querySelector("nav a[href*=" + sectionId + "]").setAttribute("active","true");
    
      } else {
        document.querySelector("nav a[href*=" + sectionId + "]").setAttribute("active","false");
      }
    });
    }
