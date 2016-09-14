/* Hide toggle on tablets and larger screens as page loads*/
$(document).ready(function(){
  if(window.innerWidth >= 750){
  	$('#toggle').hide();
    $('.icon').hide();
    $('#emptyDiv').hide();
    $('.title').hide();
      $('#firebugNav').show();
  }
});
// Hide nav by default in mobile view
$(document).ready(function(){
  if(window.innerWidth <= 750){
  	$('.main-nav ul li').hide();
      $('#emptyDiv').show();
      $('.title').show();
      $('#firebugNav').hide();


  }
});

/* Hide/show nav bar in mobile view */
$(document).ready(function () {

$('#toggle').click(function () {

 $('.main-nav ul li').toggle("slow");

 $('#toggle_class').toggle("slow");

});
});

/* Hide/show toggle as page viewport is resized */

$(window).resize(function(){
	if(window.innerWidth >= 750) {
		$(".main-nav ul li").show();
    $('#toggle_class').hide();
    $('#toggle').hide();
      $('.icon').hide();
    $('#emptyDiv').hide();
    $('.title').hide();
    $('#firebugNav').show();
	}
});

$(window).resize(function(){
	if(window.innerWidth < 768) {
     $('#toggle_class').show();
		 $('#toggle').show();
     $('.main-nav ul li').hide();//hide nav in mobile view on re-size back to mobile
     $('#emptyDiv').show();
     $('.title').show();
    $('#firebugNav').hide();
  }
});

/*hide #tour_table until shows are booked, then unhide*/

$(document).ready(function(){
  $("#tour_table").hide();
});
