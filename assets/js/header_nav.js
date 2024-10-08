const navBarHeight = document.querySelector(".header").offsetHeight;
document.documentElement.style.setProperty(
  "--scroll-padding",
  navBarHeight - 1 + "px"
);

const headerNav = document.querySelector(".header-nav");
const navToggle = document.querySelector(".mobile-nav-toggle");

// Get all sections that have an ID defined
const sections = document.querySelectorAll("section[id]");
// Add an event listener listening for scroll
window.addEventListener("scroll", () => navHighlighter(navBarHeight));

navToggle.addEventListener("click", navButtonToggler);

function navButtonToggler() {
  const visibility = headerNav.getAttribute("data-visible");

  if (visibility === "false") {
    headerNav.setAttribute("data-visible", "true");
    navToggle.setAttribute("aria-expanded", "true");
  } else {
    headerNav.setAttribute("data-visible", "false");
    navToggle.setAttribute("aria-expanded", "false");
  }
}

const getOffsetTop = (element) => {
  let offsetTop = 0;
  while (element) {
    offsetTop += element.offsetTop;
    element = element.offsetParent;
  }
  return offsetTop;
};

const bottomVisible = () =>
  document.documentElement.clientHeight + window.scrollY >=
  (document.documentElement.scrollHeight ||
    document.documentElement.clientHeight);

// 'getViewPercentage' was adapted from https://gist.github.com/rijkvanzanten/df73ae28e80b9c6e5030baed4d1a90a6
// Thanks to https://gist.github.com/rijkvanzanten
function getViewPercentage(element) {
  const viewport = {
    top: window.scrollY,
    bottom: window.scrollY + window.innerHeight,
  };

  const elementBoundingRect = element.getBoundingClientRect();
  const elementPos = {
    top: elementBoundingRect.y + window.scrollY,
    bottom: elementBoundingRect.y + elementBoundingRect.height + window.scrollY,
  };

  if (viewport.top > elementPos.bottom || viewport.bottom < elementPos.top) {
    return 0;
  }

  // Element is fully within viewport
  if (viewport.top < elementPos.top && viewport.bottom > elementPos.bottom) {
    return 100;
  }

  // Element is bigger than the viewport
  if (elementPos.top < viewport.top && elementPos.bottom > viewport.bottom) {
    return 100;
  }

  const elementHeight = elementBoundingRect.height;
  let elementHeightInView = elementHeight;

  if (elementPos.top < viewport.top) {
    elementHeightInView = elementHeight - (window.scrollY - elementPos.top);
  }

  if (elementPos.bottom > viewport.bottom) {
    elementHeightInView =
      elementHeightInView - (elementPos.bottom - viewport.bottom);
  }

  const percentageInView = (elementHeightInView / window.innerHeight) * 100;

  return Math.round(percentageInView);
}

function navHighlighter(
  correction = 100,
  min_percent_accept = 20,
  master_percent = 75
) {
  // Get current scroll position
  let Yscroll = window.scrollY;

  // Now we loop through sections to get height, top and ID values for each
  sections.forEach((current) => {
    const sectionHeight = current.offsetHeight;
    const sectionTop = getOffsetTop(current) - correction;
    let sectionId = current.getAttribute("id");
    let viewportPercentage = getViewPercentage(current);

    /*
      - If our current scroll position enters the space where current section on screen is 
      and the section is at least 'min_percent_accept' in view 
      or the current section is more than 'master_percent' in view, add .active class to corresponding navigation link, else remove it
      - To know which link needs an active class, we use sectionId variable we are getting while looping through sections as an selector
      */
    if (
      (Yscroll > sectionTop &&
        Yscroll <= sectionTop + sectionHeight &&
        viewportPercentage > min_percent_accept) ||
      viewportPercentage > master_percent
    ) {
      document
        .querySelector("nav a[href*=" + sectionId + "]")
        .setAttribute("active", "true");
    } else {
      document
        .querySelector("nav a[href*=" + sectionId + "]")
        .setAttribute("active", "false");
    }
  });
}
