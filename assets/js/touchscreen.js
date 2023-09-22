   // Get all the elements with the specified classes
   const elementsToAnimate = document.querySelectorAll('.work-blob.work-ist svg path,.work-blob.work-fst svg path, .education-bachelor .timeline-card, .education-master .timeline-card, .education-iefp .timeline-card');

   // Add a click event listener to each element
   elementsToAnimate.forEach(element => {
       element.addEventListener('click', () => {
           // Toggle the 'animate' class on the clicked element
           element.classList.toggle('animate');
           
           // Remove 'animate' class from other elements
           elementsToAnimate.forEach(el => {
               if (el !== element) {
                   el.classList.remove('animate');
               }
           });
       });
   });

   // Add a click event listener to the document body to remove 'animate' class
   document.body.addEventListener('click', (event) => {
       // Check if the click target is not one of the specified elements
       if (!event.target.matches('.work-blob.work-ist svg path,.work-blob.work-fst svg path, .education-bachelor .timeline-card path, .education-master .timeline-card path, .education-iefp .timeline-card path')) {
           // Remove 'animate' class from all elements
           elementsToAnimate.forEach(element => {
               element.classList.remove('animate');
           });
       }
   });

