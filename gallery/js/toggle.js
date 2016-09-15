/* Hide toggle on tablets and larger screens as page loads*/
$(document).ready(function(){
  if(window.innerWidth >= 750){
  	$('#toggle').hide();
  }
});

/* Hide/show nav bar in mobile view */
$(document).ready(function () {

$('#toggle').click(function () {

 $('.main-nav ul li').toggle("slow");

 $('#toggle_class').toggle("slow");


  // $(".galleryDiv").css("margin-top", "20px");


});
});




/* Hide/show toggle as page viewport is resized */

$(window).resize(function(){
	if(window.innerWidth >= 750) {
		$(".main-nav ul li").show();
    $('#toggle_class').hide();
    	$('#toggle').hide();
	}
});

$(window).resize(function(){
	if(window.innerWidth < 768) {
    $('#toggle_class').show();
			$('#toggle').show();
	}
});
