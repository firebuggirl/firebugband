$(window).scroll(function (event)
{
  //  var docheight = $(document).height();
    var docheight = $(document).height();
    var winheight = $(window).height();
    var height = docheight - winheight;
    var scroll = $(document).scrollTop();
    var scrollperc = scroll/(height/100);
    $("#page--scrolling").width(scrollperc+'%');
    $("#page--scrolling-perc").text(scrollperc.toFixed(0)+'%');
});
