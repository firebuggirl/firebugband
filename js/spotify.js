$(document).ready(function() {


var spotifyAPI = "https://api.spotify.com/v1/search";
var spotifyAlbumAPI = "https://api.spotify.com/v1/albums/";
var search = "Firebug";


//function to get individual album api:
function getAlbumInfo(callback) {

    $.getJSON(spotifyAPI, {
        q: search,
        type: "album",
      //  limit: 20
    }, function(data) {

         var array = [];


        $.each(data.albums.items, function(i, album) {
           console.log(data.albums.items);


                 if((album.id !== "6HWxqdryeaBrcVNExMyzXC")&&(album.id !== "2NeiklEJ3gQE7bV9cp27hZ")&&(album.id !== "5sah14CPmQ1v2FUp2AKDql")&&(album.id !== "2GLF9bjkeGaKSiPAyLEWRb"))
                     {
                      array.push(spotifyAlbumAPI + album.id);
                    }

          });//end each


        callback(array);


    });//end JSON


}//end callback

//////////////////////////////////////////////////////////////////




       getAlbumInfo(function(result) {



                    //defined elsewhere for clarity
                    function clickAlbum(data) {
                      return function(e) {
                      // this is the function the click event will use
                      //data variable is captured here

                       var  playingCssClass = 'playing',
                       audioObject = new Audio(data.tracks.items[0].preview_url),
                       target = $(this);

                       e.preventDefault();
                       target.append(audioObject);

                         if (target.hasClass(playingCssClass)) {
                             audioObject.pause();
                             }
                           else {
                             audioObject.play();
                            }

                            $('#lightbox').click(function(e){
                                e.preventDefault();
                                audioObject.pause();
                            });

                            $('.lb-close').click(function(e){
                                e.preventDefault();
                                audioObject.pause();
                            });




                          }//end function clickAlbum



                }//getAlbumInfo(function(result)

                ///////////////////////////////////////////////////////////



  function createAlbumList() {
  $.each(result, function(i, album) {
    $.getJSON(album, {
        q: search,
        type: "album",
        limit: 12
      },
      function(data) {
        // Build a new string for each album
        var albumHTML = '';

        albumHTML += '<li data-name="' + data.artists[0].name + '">';
        // etc...
        albumHTML += '<li data-name="' + data.artists[0].name + '">';
                      albumHTML += '<a href="' + data.images[0].url + '" data-lightbox="albums" data-title="';
                      albumHTML += 'Album Name: ' + data.name + '</br>';
                      albumHTML += 'Audio Tracks: ' + data.tracks.items[0].preview_url + '</br>';
                      albumHTML += 'Artist Name: ' + data.artists[0].name + '</br>';
                      albumHTML += 'Release Date: ' + data.release_date + '</br>';
                      albumHTML += 'SpotifyURL: ' + data.external_urls.spotify + '</br>';
                      albumHTML += '">';
                      albumHTML += '<img src="' + data.images[0].url + '"alt="' + data.name + '"></a></li>';

        // Wrap the string in a jQuery object, find the link element, and attach the click handler
        // with the current album data.
        var $clone = $(albumHTML).clone( true );//clone albumHTML so when dom elements are removed the information/data is still available
        var $findAudio = $clone.find('a').click(clickAlbum(data));//parentNode gets removed when calling on data for specific object, use clone to clone albumHTML (deeply) so data/innerHTML is always available for audio on image click AND for data sorting on button click(s)

        $('#albums').append($clone);


        // ...
      });

  });
}

  createAlbumList();



 });


 $('.musicButton1').click(function() {

    tinysort('ul#albums>li', { selector: 'a', attr: 'href' });
 });

 $('.musicButton2').click(function() {
    tinysort('ul#albums>li', { selector: 'img', attr: 'alt' });
 });


});// end document.ready.....
