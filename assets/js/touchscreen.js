const svgPath_fst = document.querySelector('.work-blob.work-fst svg path');
const svgPath_ist = document.querySelector('.work-blob.work-ist svg path');
const card_bachelor = document.querySelector('.timeline-card.education-bachelor');
const card_master = document.querySelector('.timeline-card.education-master');
const card_iefp = document.querySelector('.timeline-card.education-iefp');

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
