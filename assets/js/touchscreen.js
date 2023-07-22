const svgPath_fst = document.querySelector('.work-blob.work-fst svg path');
const svgPath_ist = document.querySelector('.work-blob.work-ist svg path');
const card_bachelor = document.querySelector('.education-bachelor .timeline-card');
const card_master = document.querySelector('.education-master .timeline-card');
const card_iefp = document.querySelector('.education-iefp .timeline-card');

function handleTapAnimation(ob) {
  ob.classList.toggle('animate');
}
svgPath_fst.addEventListener('touchstart', function () {
  handleTapAnimation(svgPath_fst);
});
svgPath_ist.addEventListener('touchstart', function () {
  handleTapAnimation(svgPath_ist);
});
card_bachelor.addEventListener('touchstart', function () {
  handleTapAnimation(card_bachelor);
});
card_master.addEventListener('touchstart', function () {
  handleTapAnimation(card_master);
});
card_iefp.addEventListener('touchstart', function () {
  handleTapAnimation(card_iefp);
});
