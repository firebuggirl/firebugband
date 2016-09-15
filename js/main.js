$(".animsition").animsition({
  //inClass: 'fade-in-right-lg',
  inClass: 'fade-in-up-lg',
  //outClass: 'fade-out-right-lg',
  outClass: 'fade-out-up-lg',
  linkElement: 'header a',
  inDuration: 1000,
  outDuration: 500
});

$('.header').sticky({
  getWidthFrom: '.container',
  responsiveWidth: true
});

$('.header').on('sticky-start', function () {
  $('.description').html('We make <strong>music</strong> ');
});

$('.header').on('sticky-end', function () {
  $('.description').html('We make music');
});

$('.work').sticky({
  topSpacing: 60,
  getWidthFrom: '.container',
  responsiveWidth: true
});
$('.work').on('sticky-start', function() {
  $(this).append(' <a href="mailto:email@website.com" class="email-text">Email&nbsp;us</a>');
});
$('.work').on('sticky-end', function() {
    $('.email-text').remove();
});
