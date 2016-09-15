
var $closeLightbox = $("<div id='closeLightbox'></div>");//create div for close button and style in css
var $scroll = $("#page--scrolling");

//hide arrows on page load
$(document).ready(function () {
    $("#bio").hide();//hide arrows div on page load
  //  $("#page--scrolling").hide();
  //  $("iframe").hide();//hide iframe on page load
   $scroll.hide();
   $closeLightbox.hide();

});


//Problem: User when clicking on image goes to a dead end
//Solution: Create an overlay with the large image - Lightbox

//var $overlay = $('<div id="overlay"></div>');
var $bio = $("#bio");
var $scroll = $("#page--scrolling");
var $body = $('body');
//var $caption = $("<p></p>");

//An image to overlay
// $overlay.append($bio);
// $overlay.append($scroll);

$body.append($bio);
$body.append($scroll);


//A caption to overlay
//$overlay.append($caption);


//Add overlay
//$("body").append($overlay);

//Capture the click event on a link to an image
$("#showBio").click(function (event) {
    event.preventDefault();//prevent default browser behavior

    //get the href of the image we will display in the lightbox from the link that was clicked
    //var imageLocation = $(this).addClass("selected").attr("href");
    //ditto for video....same as above
  //  var videoLocation = $(this).addClass("selected").attr("href");

  //Show the overlay.
  //  $overlay.show();
  //  $('.container').hide();
    $('.row').hide();
    $('.animsition').hide();
    $bio.show();
    $scroll.show();
    $closeLightbox.show();
  //  $('.main-nav ul li').hide();
    //Hide fixed scroll bar with z-index that was previously getting in the way of te close button
    //$("#top").hide();

    //$('#toggle-view').hide();

    //$('footer').hide();


});


//When close button is clicked hide the overlay and arrows, re-introduce search box and remove video

var $closeLightbox = $("<div id='closeLightbox'></div>");//create div for close button and style in css

$bio.before($closeLightbox);//tell DOM where close button fits in the DOM sturcture of the overlay
//$closeLightbox.after($scroll);
$("#closeLightbox").click(function () {
  //$('#toggle-view').show();
  //  $overlay.hide();//close the overlay

    $('.container').show();
    $('.row').show();
    $('.animsition').show();
    $closeLightbox.hide();
    $bio.hide();
    $scroll.hide();

    // if(window.innerWidth <= 750){
    //   $('.main-nav ul li').hide();
    // }else{
    //     $('.main-nav ul li').show();
    // }




});
