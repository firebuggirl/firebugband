//hide arrows on page load
$(document).ready(function () {
    $(".arrows").hide();//hide arrows div on page load
    $("iframe").hide();//hide iframe on page load
});
//Problem: User when clicking on image goes to a dead end
//Solution: Create an overlay with the large image - Lightbox

var $overlay = $('<div id="overlay"></div>');
var $image = $("<img>");
var $caption = $("<p></p>");
//var $arrows = $(".arrows");
var $iframe = $("<iframe></iframe>");


//Keep track of image index for prev/next, we will use a list index
//position to determine where we are and what it means to move forward
//and backwards by 1.

var $index = 0;


//An image to overlay
$overlay.append($image);


//A caption to overlay
$overlay.append($caption);


//add video to overlay
$overlay.append($iframe);


//Add overlay
$("body").append($overlay);

//Capture the click event on a link to an image
$("#imageGallery a").click(function (event) {
    event.preventDefault();//prevent default browser behavior

    //get the href of the image we will display in the lightbox from the link that was clicked
    var imageLocation = $(this).addClass("selected").attr("href");
    //ditto for video....same as above
    var videoLocation = $(this).addClass("selected").attr("href");



    //Update overlay with the image linked
    $('.video').remove();
    if($(this).data('type') == 'video') {//check to see if the href clicked is the video
        $image.addClass('hidden');//hide thumbnail image
        $caption.addClass('hidden');//hide caption text
        var videoURL = $(this).data('video-url');//establish a connection with the url for the video that is provided in the html <a> tag
        var $video = ('<iframe class="video"  src="'+videoURL+'" frameborder="0" allowfullscreen></iframe>');//create div for video and include videoURL variable to show video
        $overlay.append($video);
    }
    else {
        $image.removeClass('hidden');//unhide imageLocation
        $caption.removeClass('hidden');//unhide caption text
        $image.attr("src", imageLocation);//establish image location with src attribute
        $iframe.attr("src", videoLocation);//establish video location with src attribute
    }

    //Show the overlay.
    $overlay.show();

    //show arrows div
    $(".arrows").show();

    //Hide fixed scroll bar with z-index that was previously getting in the way of te close button
    //$("#top").hide();

    $('#toggle-view').hide();

    $('footer').hide();

    $("#leftArrow").show();//show leftArrow in overlay

    $("#rightArrow").show();//show rightArrow in overlay

    //Get child's alt attribute and set caption
    var captionText = $(this).children("img").attr("alt");
    $caption.text(captionText);//show caption text for current image
});


//When close button is clicked hide the overlay and arrows, re-introduce search box and remove video

var $closeLightbox = $("<div id='closeLightbox'></div>");//create div for close button and style in css

$image.before($closeLightbox);//tell DOM where close button fits in the DOM sturcture of the overlay

$("#closeLightbox").click(function () {

    $overlay.hide();//close the overlay

    //$("#top").show();//bring back search bar when overlay is hidden
$('#toggle-view').show();
// Bring back footer
$('footer').show();
   //hide arrows
    $(".arrows").hide();

  //remove video when overlay is hidden
    $overlay.remove('.video');
});


function prevImage(){
  var $activeImg = $(".selected");
  var $previous = $activeImg.closest('li').prev().find('a');
  if($activeImg.closest('li').hasClass('first')) {
      $previous = $('.last').find('a');
  }
  var $captionText = $previous.addClass('selected').children("img").attr("alt");
  var $imagePrev = $previous.addClass('selected').attr("href");
  $activeImg.removeClass('selected');

  setImageWhenArrowsClick($previous, $imagePrev, $captionText);
}

function nextImage(){
  var $activeImg = $(".selected");//create location for current image selected by assigning .selected class (established above) to variable within function @ the local scope
  var $next = $activeImg.closest('li').next();//find the closest <li> tag of the active image and select the next image in the gallery
  if($activeImg.closest('li').hasClass('last')) {//if last item in gallery is chosen, assign .first class to $next variable to return to 1st image in gallery
      $next = $('.first');
  }
  var $captionText = $next.find('a').addClass('selected').children("img").attr("alt");//grab current image then navigate to the closest <li>, then move to the next <li> and find it's associated <a> and make it the currently selected anchor, then find the child img of the <a> tag and grab the caption text via the alt attribute
  var $imageNext = $next.find('a').addClass('selected').attr("href");//same as above, but grab href instead to show the next photo
  var $imageNextLink = $next.find('a');//locate next image href attribute

  $activeImg.removeClass('selected');//remove class of currently selected elements in order to transfer .selected class to next and prev elements
  setImageWhenArrowsClick($imageNextLink, $imageNext, $captionText);//establish link, image and caption text all in one location

}

$("body").on("click", '#leftArrow', prevImage);
$("body").on("click", '#rightArrow', nextImage);



function setImageWhenArrowsClick($imageLink, $imageSrc, $captionText) {
    $('.video').remove();//remove video from overlay

     if($imageLink.data('type') == 'video') {//show video if date type = video
        $image.addClass('hidden');//hide images from overlay and show video only
        $caption.addClass('hidden');//hide caption text for images from overlay when vidio <a> -> thumbnail is clicked
        //var videoLocation = $(this).addClass("selected").attr("href");
        //var videoURL = $(this).data('video-url');//establish a connection with the url for the video that is provided in the html <a> tag note: works with $("#imageGallery a").click function, but not with arrows function
        var $video = ('<iframe class="video"  src="https://www.youtube.com/embed/mDjs1lb4c3E" frameborder="0" allowfullscreen></iframe>');
        $overlay.append($video);
    }
    else {//unhide images, caption text, and image src location
        $image.removeClass('hidden');
        $caption.removeClass('hidden');
        $image.attr("src", $imageSrc);
        $captionNext = $captionText;
        $caption.text($captionNext);

    }
}



$(document).on('keydown', function(event) {//use .on() instead of .bind()
	if(event.keyCode == 37) {
		prevImage(true);
	} else if(event.keyCode == 39) {
		nextImage();
	}
});
