/*!
 * Modernizr v2.8.3
 * www.modernizr.com
 *
 * Copyright (c) Faruk Ates, Paul Irish, Alex Sexton
 * Available under the BSD and MIT licenses: www.modernizr.com/license/
 */

/*
 * Modernizr tests which native CSS3 and HTML5 features are available in
 * the current UA and makes the results available to you in two ways:
 * as properties on a global Modernizr object, and as classes on the
 * <html> element. This information allows you to progressively enhance
 * your pages with a granular level of control over the experience.
 *
 * Modernizr has an optional (not included) conditional resource loader
 * called Modernizr.load(), based on Yepnope.js (yepnopejs.com).
 * To get a build that includes Modernizr.load(), as well as choosing
 * which tests to include, go to www.modernizr.com/download/
 *
 * Authors        Faruk Ates, Paul Irish, Alex Sexton
 * Contributors   Ryan Seddon, Ben Alman
 */

window.Modernizr = (function( window, document, undefined ) {

    var version = '2.8.3',

    Modernizr = {},

    /*>>cssclasses*/
    // option for enabling the HTML classes to be added
    enableClasses = true,
    /*>>cssclasses*/

    docElement = document.documentElement,

    /**
     * Create our "modernizr" element that we do most feature tests on.
     */
    mod = 'modernizr',
    modElem = document.createElement(mod),
    mStyle = modElem.style,

    /**
     * Create the input element for various Web Forms feature tests.
     */
    inputElem /*>>inputelem*/ = document.createElement('input') /*>>inputelem*/ ,

    /*>>smile*/
    smile = ':)',
    /*>>smile*/

    toString = {}.toString,

    // TODO :: make the prefixes more granular
    /*>>prefixes*/
    // List of property values to set for css tests. See ticket #21
    prefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
    /*>>prefixes*/

    /*>>domprefixes*/
    // Following spec is to expose vendor-specific style properties as:
    //   elem.style.WebkitBorderRadius
    // and the following would be incorrect:
    //   elem.style.webkitBorderRadius

    // Webkit ghosts their properties in lowercase but Opera & Moz do not.
    // Microsoft uses a lowercase `ms` instead of the correct `Ms` in IE8+
    //   erik.eae.net/archives/2008/03/10/21.48.10/

    // More here: github.com/Modernizr/Modernizr/issues/issue/21
    omPrefixes = 'Webkit Moz O ms',

    cssomPrefixes = omPrefixes.split(' '),

    domPrefixes = omPrefixes.toLowerCase().split(' '),
    /*>>domprefixes*/

    /*>>ns*/
    ns = {'svg': 'http://www.w3.org/2000/svg'},
    /*>>ns*/

    tests = {},
    inputs = {},
    attrs = {},

    classes = [],

    slice = classes.slice,

    featureName, // used in testing loop


    /*>>teststyles*/
    // Inject element with style element and some CSS rules
    injectElementWithStyles = function( rule, callback, nodes, testnames ) {

      var style, ret, node, docOverflow,
          div = document.createElement('div'),
          // After page load injecting a fake body doesn't work so check if body exists
          body = document.body,
          // IE6 and 7 won't return offsetWidth or offsetHeight unless it's in the body element, so we fake it.
          fakeBody = body || document.createElement('body');

      if ( parseInt(nodes, 10) ) {
          // In order not to give false positives we create a node for each test
          // This also allows the method to scale for unspecified uses
          while ( nodes-- ) {
              node = document.createElement('div');
              node.id = testnames ? testnames[nodes] : mod + (nodes + 1);
              div.appendChild(node);
          }
      }

      // <style> elements in IE6-9 are considered 'NoScope' elements and therefore will be removed
      // when injected with innerHTML. To get around this you need to prepend the 'NoScope' element
      // with a 'scoped' element, in our case the soft-hyphen entity as it won't mess with our measurements.
      // msdn.microsoft.com/en-us/library/ms533897%28VS.85%29.aspx
      // Documents served as xml will throw if using &shy; so use xml friendly encoded version. See issue #277
      style = ['&#173;','<style id="s', mod, '">', rule, '</style>'].join('');
      div.id = mod;
      // IE6 will false positive on some tests due to the style element inside the test div somehow interfering offsetHeight, so insert it into body or fakebody.
      // Opera will act all quirky when injecting elements in documentElement when page is served as xml, needs fakebody too. #270
      (body ? div : fakeBody).innerHTML += style;
      fakeBody.appendChild(div);
      if ( !body ) {
          //avoid crashing IE8, if background image is used
          fakeBody.style.background = '';
          //Safari 5.13/5.1.4 OSX stops loading if ::-webkit-scrollbar is used and scrollbars are visible
          fakeBody.style.overflow = 'hidden';
          docOverflow = docElement.style.overflow;
          docElement.style.overflow = 'hidden';
          docElement.appendChild(fakeBody);
      }

      ret = callback(div, rule);
      // If this is done after page load we don't want to remove the body so check if body exists
      if ( !body ) {
          fakeBody.parentNode.removeChild(fakeBody);
          docElement.style.overflow = docOverflow;
      } else {
          div.parentNode.removeChild(div);
      }

      return !!ret;

    },
    /*>>teststyles*/

    /*>>mq*/
    // adapted from matchMedia polyfill
    // by Scott Jehl and Paul Irish
    // gist.github.com/786768
    testMediaQuery = function( mq ) {

      var matchMedia = window.matchMedia || window.msMatchMedia;
      if ( matchMedia ) {
        return matchMedia(mq) && matchMedia(mq).matches || false;
      }

      var bool;

      injectElementWithStyles('@media ' + mq + ' { #' + mod + ' { position: absolute; } }', function( node ) {
        bool = (window.getComputedStyle ?
                  getComputedStyle(node, null) :
                  node.currentStyle)['position'] == 'absolute';
      });

      return bool;

     },
     /*>>mq*/


    /*>>hasevent*/
    //
    // isEventSupported determines if a given element supports the given event
    // kangax.github.com/iseventsupported/
    //
    // The following results are known incorrects:
    //   Modernizr.hasEvent("webkitTransitionEnd", elem) // false negative
    //   Modernizr.hasEvent("textInput") // in Webkit. github.com/Modernizr/Modernizr/issues/333
    //   ...
    isEventSupported = (function() {

      var TAGNAMES = {
        'select': 'input', 'change': 'input',
        'submit': 'form', 'reset': 'form',
        'error': 'img', 'load': 'img', 'abort': 'img'
      };

      function isEventSupported( eventName, element ) {

        element = element || document.createElement(TAGNAMES[eventName] || 'div');
        eventName = 'on' + eventName;

        // When using `setAttribute`, IE skips "unload", WebKit skips "unload" and "resize", whereas `in` "catches" those
        var isSupported = eventName in element;

        if ( !isSupported ) {
          // If it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
          if ( !element.setAttribute ) {
            element = document.createElement('div');
          }
          if ( element.setAttribute && element.removeAttribute ) {
            element.setAttribute(eventName, '');
            isSupported = is(element[eventName], 'function');

            // If property was created, "remove it" (by setting value to `undefined`)
            if ( !is(element[eventName], 'undefined') ) {
              element[eventName] = undefined;
            }
            element.removeAttribute(eventName);
          }
        }

        element = null;
        return isSupported;
      }
      return isEventSupported;
    })(),
    /*>>hasevent*/

    // TODO :: Add flag for hasownprop ? didn't last time

    // hasOwnProperty shim by kangax needed for Safari 2.0 support
    _hasOwnProperty = ({}).hasOwnProperty, hasOwnProp;

    if ( !is(_hasOwnProperty, 'undefined') && !is(_hasOwnProperty.call, 'undefined') ) {
      hasOwnProp = function (object, property) {
        return _hasOwnProperty.call(object, property);
      };
    }
    else {
      hasOwnProp = function (object, property) { /* yes, this can give false positives/negatives, but most of the time we don't care about those */
        return ((property in object) && is(object.constructor.prototype[property], 'undefined'));
      };
    }

    // Adapted from ES5-shim https://github.com/kriskowal/es5-shim/blob/master/es5-shim.js
    // es5.github.com/#x15.3.4.5

    if (!Function.prototype.bind) {
      Function.prototype.bind = function bind(that) {

        var target = this;

        if (typeof target != "function") {
            throw new TypeError();
        }

        var args = slice.call(arguments, 1),
            bound = function () {

            if (this instanceof bound) {

              var F = function(){};
              F.prototype = target.prototype;
              var self = new F();

              var result = target.apply(
                  self,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return self;

            } else {

              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );

            }

        };

        return bound;
      };
    }

    /**
     * setCss applies given styles to the Modernizr DOM node.
     */
    function setCss( str ) {
        mStyle.cssText = str;
    }

    /**
     * setCssAll extrapolates all vendor-specific css strings.
     */
    function setCssAll( str1, str2 ) {
        return setCss(prefixes.join(str1 + ';') + ( str2 || '' ));
    }

    /**
     * is returns a boolean for if typeof obj is exactly type.
     */
    function is( obj, type ) {
        return typeof obj === type;
    }

    /**
     * contains returns a boolean for if substr is found within str.
     */
    function contains( str, substr ) {
        return !!~('' + str).indexOf(substr);
    }

    /*>>testprop*/

    // testProps is a generic CSS / DOM property test.

    // In testing support for a given CSS property, it's legit to test:
    //    `elem.style[styleName] !== undefined`
    // If the property is supported it will return an empty string,
    // if unsupported it will return undefined.

    // We'll take advantage of this quick test and skip setting a style
    // on our modernizr element, but instead just testing undefined vs
    // empty string.

    // Because the testing of the CSS property names (with "-", as
    // opposed to the camelCase DOM properties) is non-portable and
    // non-standard but works in WebKit and IE (but not Gecko or Opera),
    // we explicitly reject properties with dashes so that authors
    // developing in WebKit or IE first don't end up with
    // browser-specific content by accident.

    function testProps( props, prefixed ) {
        for ( var i in props ) {
            var prop = props[i];
            if ( !contains(prop, "-") && mStyle[prop] !== undefined ) {
                return prefixed == 'pfx' ? prop : true;
            }
        }
        return false;
    }
    /*>>testprop*/

    // TODO :: add testDOMProps
    /**
     * testDOMProps is a generic DOM property test; if a browser supports
     *   a certain property, it won't return undefined for it.
     */
    function testDOMProps( props, obj, elem ) {
        for ( var i in props ) {
            var item = obj[props[i]];
            if ( item !== undefined) {

                // return the property name as a string
                if (elem === false) return props[i];

                // let's bind a function
                if (is(item, 'function')){
                  // default to autobind unless override
                  return item.bind(elem || obj);
                }

                // return the unbound function or obj or value
                return item;
            }
        }
        return false;
    }

    /*>>testallprops*/
    /**
     * testPropsAll tests a list of DOM properties we want to check against.
     *   We specify literally ALL possible (known and/or likely) properties on
     *   the element including the non-vendor prefixed one, for forward-
     *   compatibility.
     */
    function testPropsAll( prop, prefixed, elem ) {

        var ucProp  = prop.charAt(0).toUpperCase() + prop.slice(1),
            props   = (prop + ' ' + cssomPrefixes.join(ucProp + ' ') + ucProp).split(' ');

        // did they call .prefixed('boxSizing') or are we just testing a prop?
        if(is(prefixed, "string") || is(prefixed, "undefined")) {
          return testProps(props, prefixed);

        // otherwise, they called .prefixed('requestAnimationFrame', window[, elem])
        } else {
          props = (prop + ' ' + (domPrefixes).join(ucProp + ' ') + ucProp).split(' ');
          return testDOMProps(props, prefixed, elem);
        }
    }
    /*>>testallprops*/


    /**
     * Tests
     * -----
     */

    // The *new* flexbox
    // dev.w3.org/csswg/css3-flexbox

    tests['flexbox'] = function() {
      return testPropsAll('flexWrap');
    };

    // The *old* flexbox
    // www.w3.org/TR/2009/WD-css3-flexbox-20090723/

    tests['flexboxlegacy'] = function() {
        return testPropsAll('boxDirection');
    };

    // On the S60 and BB Storm, getContext exists, but always returns undefined
    // so we actually have to call getContext() to verify
    // github.com/Modernizr/Modernizr/issues/issue/97/

    tests['canvas'] = function() {
        var elem = document.createElement('canvas');
        return !!(elem.getContext && elem.getContext('2d'));
    };

    tests['canvastext'] = function() {
        return !!(Modernizr['canvas'] && is(document.createElement('canvas').getContext('2d').fillText, 'function'));
    };

    // webk.it/70117 is tracking a legit WebGL feature detect proposal

    // We do a soft detect which may false positive in order to avoid
    // an expensive context creation: bugzil.la/732441

    tests['webgl'] = function() {
        return !!window.WebGLRenderingContext;
    };

    /*
     * The Modernizr.touch test only indicates if the browser supports
     *    touch events, which does not necessarily reflect a touchscreen
     *    device, as evidenced by tablets running Windows 7 or, alas,
     *    the Palm Pre / WebOS (touch) phones.
     *
     * Additionally, Chrome (desktop) used to lie about its support on this,
     *    but that has since been rectified: crbug.com/36415
     *
     * We also test for Firefox 4 Multitouch Support.
     *
     * For more info, see: modernizr.github.com/Modernizr/touch.html
     */

    tests['touch'] = function() {
        var bool;

        if(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch) {
          bool = true;
        } else {
          injectElementWithStyles(['@media (',prefixes.join('touch-enabled),('),mod,')','{#modernizr{top:9px;position:absolute}}'].join(''), function( node ) {
            bool = node.offsetTop === 9;
          });
        }

        return bool;
    };


    // geolocation is often considered a trivial feature detect...
    // Turns out, it's quite tricky to get right:
    //
    // Using !!navigator.geolocation does two things we don't want. It:
    //   1. Leaks memory in IE9: github.com/Modernizr/Modernizr/issues/513
    //   2. Disables page caching in WebKit: webk.it/43956
    //
    // Meanwhile, in Firefox < 8, an about:config setting could expose
    // a false positive that would throw an exception: bugzil.la/688158

    tests['geolocation'] = function() {
        return 'geolocation' in navigator;
    };


    tests['postmessage'] = function() {
      return !!window.postMessage;
    };


    // Chrome incognito mode used to throw an exception when using openDatabase
    // It doesn't anymore.
    tests['websqldatabase'] = function() {
      return !!window.openDatabase;
    };

    // Vendors had inconsistent prefixing with the experimental Indexed DB:
    // - Webkit's implementation is accessible through webkitIndexedDB
    // - Firefox shipped moz_indexedDB before FF4b9, but since then has been mozIndexedDB
    // For speed, we don't test the legacy (and beta-only) indexedDB
    tests['indexedDB'] = function() {
      return !!testPropsAll("indexedDB", window);
    };

    // documentMode logic from YUI to filter out IE8 Compat Mode
    //   which false positives.
    tests['hashchange'] = function() {
      return isEventSupported('hashchange', window) && (document.documentMode === undefined || document.documentMode > 7);
    };

    // Per 1.6:
    // This used to be Modernizr.historymanagement but the longer
    // name has been deprecated in favor of a shorter and property-matching one.
    // The old API is still available in 1.6, but as of 2.0 will throw a warning,
    // and in the first release thereafter disappear entirely.
    tests['history'] = function() {
      return !!(window.history && history.pushState);
    };

    tests['draganddrop'] = function() {
        var div = document.createElement('div');
        return ('draggable' in div) || ('ondragstart' in div && 'ondrop' in div);
    };

    // FF3.6 was EOL'ed on 4/24/12, but the ESR version of FF10
    // will be supported until FF19 (2/12/13), at which time, ESR becomes FF17.
    // FF10 still uses prefixes, so check for it until then.
    // for more ESR info, see: mozilla.org/en-US/firefox/organizations/faq/
    tests['websockets'] = function() {
        return 'WebSocket' in window || 'MozWebSocket' in window;
    };


    // css-tricks.com/rgba-browser-support/
    tests['rgba'] = function() {
        // Set an rgba() color and check the returned value

        setCss('background-color:rgba(150,255,150,.5)');

        return contains(mStyle.backgroundColor, 'rgba');
    };

    tests['hsla'] = function() {
        // Same as rgba(), in fact, browsers re-map hsla() to rgba() internally,
        //   except IE9 who retains it as hsla

        setCss('background-color:hsla(120,40%,100%,.5)');

        return contains(mStyle.backgroundColor, 'rgba') || contains(mStyle.backgroundColor, 'hsla');
    };

    tests['multiplebgs'] = function() {
        // Setting multiple images AND a color on the background shorthand property
        //  and then querying the style.background property value for the number of
        //  occurrences of "url(" is a reliable method for detecting ACTUAL support for this!

        setCss('background:url(https://),url(https://),red url(https://)');

        // If the UA supports multiple backgrounds, there should be three occurrences
        //   of the string "url(" in the return value for elemStyle.background

        return (/(url\s*\(.*?){3}/).test(mStyle.background);
    };



    // this will false positive in Opera Mini
    //   github.com/Modernizr/Modernizr/issues/396

    tests['backgroundsize'] = function() {
        return testPropsAll('backgroundSize');
    };

    tests['borderimage'] = function() {
        return testPropsAll('borderImage');
    };


    // Super comprehensive table about all the unique implementations of
    // border-radius: muddledramblings.com/table-of-css3-border-radius-compliance

    tests['borderradius'] = function() {
        return testPropsAll('borderRadius');
    };

    // WebOS unfortunately false positives on this test.
    tests['boxshadow'] = function() {
        return testPropsAll('boxShadow');
    };

    // FF3.0 will false positive on this test
    tests['textshadow'] = function() {
        return document.createElement('div').style.textShadow === '';
    };


    tests['opacity'] = function() {
        // Browsers that actually have CSS Opacity implemented have done so
        //  according to spec, which means their return values are within the
        //  range of [0.0,1.0] - including the leading zero.

        setCssAll('opacity:.55');

        // The non-literal . in this regex is intentional:
        //   German Chrome returns this value as 0,55
        // github.com/Modernizr/Modernizr/issues/#issue/59/comment/516632
        return (/^0.55$/).test(mStyle.opacity);
    };


    // Note, Android < 4 will pass this test, but can only animate
    //   a single property at a time
    //   goo.gl/v3V4Gp
    tests['cssanimations'] = function() {
        return testPropsAll('animationName');
    };


    tests['csscolumns'] = function() {
        return testPropsAll('columnCount');
    };


    tests['cssgradients'] = function() {
        /**
         * For CSS Gradients syntax, please see:
         * webkit.org/blog/175/introducing-css-gradients/
         * developer.mozilla.org/en/CSS/-moz-linear-gradient
         * developer.mozilla.org/en/CSS/-moz-radial-gradient
         * dev.w3.org/csswg/css3-images/#gradients-
         */

        var str1 = 'background-image:',
            str2 = 'gradient(linear,left top,right bottom,from(#9f9),to(white));',
            str3 = 'linear-gradient(left top,#9f9, white);';

        setCss(
             // legacy webkit syntax (FIXME: remove when syntax not in use anymore)
              (str1 + '-webkit- '.split(' ').join(str2 + str1) +
             // standard syntax             // trailing 'background-image:'
              prefixes.join(str3 + str1)).slice(0, -str1.length)
        );

        return contains(mStyle.backgroundImage, 'gradient');
    };


    tests['cssreflections'] = function() {
        return testPropsAll('boxReflect');
    };


    tests['csstransforms'] = function() {
        return !!testPropsAll('transform');
    };


    tests['csstransforms3d'] = function() {

        var ret = !!testPropsAll('perspective');

        // Webkit's 3D transforms are passed off to the browser's own graphics renderer.
        //   It works fine in Safari on Leopard and Snow Leopard, but not in Chrome in
        //   some conditions. As a result, Webkit typically recognizes the syntax but
        //   will sometimes throw a false positive, thus we must do a more thorough check:
        if ( ret && 'webkitPerspective' in docElement.style ) {

          // Webkit allows this media query to succeed only if the feature is enabled.
          // `@media (transform-3d),(-webkit-transform-3d){ ... }`
          injectElementWithStyles('@media (transform-3d),(-webkit-transform-3d){#modernizr{left:9px;position:absolute;height:3px;}}', function( node, rule ) {
            ret = node.offsetLeft === 9 && node.offsetHeight === 3;
          });
        }
        return ret;
    };


    tests['csstransitions'] = function() {
        return testPropsAll('transition');
    };


    /*>>fontface*/
    // @font-face detection routine by Diego Perini
    // javascript.nwbox.com/CSSSupport/

    // false positives:
    //   WebOS github.com/Modernizr/Modernizr/issues/342
    //   WP7   github.com/Modernizr/Modernizr/issues/538
    tests['fontface'] = function() {
        var bool;

        injectElementWithStyles('@font-face {font-family:"font";src:url("https://")}', function( node, rule ) {
          var style = document.getElementById('smodernizr'),
              sheet = style.sheet || style.styleSheet,
              cssText = sheet ? (sheet.cssRules && sheet.cssRules[0] ? sheet.cssRules[0].cssText : sheet.cssText || '') : '';

          bool = /src/i.test(cssText) && cssText.indexOf(rule.split(' ')[0]) === 0;
        });

        return bool;
    };
    /*>>fontface*/

    // CSS generated content detection
    tests['generatedcontent'] = function() {
        var bool;

        injectElementWithStyles(['#',mod,'{font:0/0 a}#',mod,':after{content:"',smile,'";visibility:hidden;font:3px/1 a}'].join(''), function( node ) {
          bool = node.offsetHeight >= 3;
        });

        return bool;
    };



    // These tests evaluate support of the video/audio elements, as well as
    // testing what types of content they support.
    //
    // We're using the Boolean constructor here, so that we can extend the value
    // e.g.  Modernizr.video     // true
    //       Modernizr.video.ogg // 'probably'
    //
    // Codec values from : github.com/NielsLeenheer/html5test/blob/9106a8/index.html#L845
    //                     thx to NielsLeenheer and zcorpan

    // Note: in some older browsers, "no" was a return value instead of empty string.
    //   It was live in FF3.5.0 and 3.5.1, but fixed in 3.5.2
    //   It was also live in Safari 4.0.0 - 4.0.4, but fixed in 4.0.5

    tests['video'] = function() {
        var elem = document.createElement('video'),
            bool = false;

        // IE9 Running on Windows Server SKU can cause an exception to be thrown, bug #224
        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('video/ogg; codecs="theora"')      .replace(/^no$/,'');

                // Without QuickTime, this value will be `undefined`. github.com/Modernizr/Modernizr/issues/546
                bool.h264 = elem.canPlayType('video/mp4; codecs="avc1.42E01E"') .replace(/^no$/,'');

                bool.webm = elem.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,'');
            }

        } catch(e) { }

        return bool;
    };

    tests['audio'] = function() {
        var elem = document.createElement('audio'),
            bool = false;

        try {
            if ( bool = !!elem.canPlayType ) {
                bool      = new Boolean(bool);
                bool.ogg  = elem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,'');
                bool.mp3  = elem.canPlayType('audio/mpeg;')               .replace(/^no$/,'');

                // Mimetypes accepted:
                //   developer.mozilla.org/En/Media_formats_supported_by_the_audio_and_video_elements
                //   bit.ly/iphoneoscodecs
                bool.wav  = elem.canPlayType('audio/wav; codecs="1"')     .replace(/^no$/,'');
                bool.m4a  = ( elem.canPlayType('audio/x-m4a;')            ||
                              elem.canPlayType('audio/aac;'))             .replace(/^no$/,'');
            }
        } catch(e) { }

        return bool;
    };


    // In FF4, if disabled, window.localStorage should === null.

    // Normally, we could not test that directly and need to do a
    //   `('localStorage' in window) && ` test first because otherwise Firefox will
    //   throw bugzil.la/365772 if cookies are disabled

    // Also in iOS5 Private Browsing mode, attempting to use localStorage.setItem
    // will throw the exception:
    //   QUOTA_EXCEEDED_ERRROR DOM Exception 22.
    // Peculiarly, getItem and removeItem calls do not throw.

    // Because we are forced to try/catch this, we'll go aggressive.

    // Just FWIW: IE8 Compat mode supports these features completely:
    //   www.quirksmode.org/dom/html5.html
    // But IE8 doesn't support either with local files

    tests['localstorage'] = function() {
        try {
            localStorage.setItem(mod, mod);
            localStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };

    tests['sessionstorage'] = function() {
        try {
            sessionStorage.setItem(mod, mod);
            sessionStorage.removeItem(mod);
            return true;
        } catch(e) {
            return false;
        }
    };


    tests['webworkers'] = function() {
        return !!window.Worker;
    };


    tests['applicationcache'] = function() {
        return !!window.applicationCache;
    };


    // Thanks to Erik Dahlstrom
    tests['svg'] = function() {
        return !!document.createElementNS && !!document.createElementNS(ns.svg, 'svg').createSVGRect;
    };

    // specifically for SVG inline in HTML, not within XHTML
    // test page: paulirish.com/demo/inline-svg
    tests['inlinesvg'] = function() {
      var div = document.createElement('div');
      div.innerHTML = '<svg/>';
      return (div.firstChild && div.firstChild.namespaceURI) == ns.svg;
    };

    // SVG SMIL animation
    tests['smil'] = function() {
        return !!document.createElementNS && /SVGAnimate/.test(toString.call(document.createElementNS(ns.svg, 'animate')));
    };

    // This test is only for clip paths in SVG proper, not clip paths on HTML content
    // demo: srufaculty.sru.edu/david.dailey/svg/newstuff/clipPath4.svg

    // However read the comments to dig into applying SVG clippaths to HTML content here:
    //   github.com/Modernizr/Modernizr/issues/213#issuecomment-1149491
    tests['svgclippaths'] = function() {
        return !!document.createElementNS && /SVGClipPath/.test(toString.call(document.createElementNS(ns.svg, 'clipPath')));
    };

    /*>>webforms*/
    // input features and input types go directly onto the ret object, bypassing the tests loop.
    // Hold this guy to execute in a moment.
    function webforms() {
        /*>>input*/
        // Run through HTML5's new input attributes to see if the UA understands any.
        // We're using f which is the <input> element created early on
        // Mike Taylr has created a comprehensive resource for testing these attributes
        //   when applied to all input types:
        //   miketaylr.com/code/input-type-attr.html
        // spec: www.whatwg.org/specs/web-apps/current-work/multipage/the-input-element.html#input-type-attr-summary

        // Only input placeholder is tested while textarea's placeholder is not.
        // Currently Safari 4 and Opera 11 have support only for the input placeholder
        // Both tests are available in feature-detects/forms-placeholder.js
        Modernizr['input'] = (function( props ) {
            for ( var i = 0, len = props.length; i < len; i++ ) {
                attrs[ props[i] ] = !!(props[i] in inputElem);
            }
            if (attrs.list){
              // safari false positive's on datalist: webk.it/74252
              // see also github.com/Modernizr/Modernizr/issues/146
              attrs.list = !!(document.createElement('datalist') && window.HTMLDataListElement);
            }
            return attrs;
        })('autocomplete autofocus list placeholder max min multiple pattern required step'.split(' '));
        /*>>input*/

        /*>>inputtypes*/
        // Run through HTML5's new input types to see if the UA understands any.
        //   This is put behind the tests runloop because it doesn't return a
        //   true/false like all the other tests; instead, it returns an object
        //   containing each input type with its corresponding true/false value

        // Big thanks to @miketaylr for the html5 forms expertise. miketaylr.com/
        Modernizr['inputtypes'] = (function(props) {

            for ( var i = 0, bool, inputElemType, defaultView, len = props.length; i < len; i++ ) {

                inputElem.setAttribute('type', inputElemType = props[i]);
                bool = inputElem.type !== 'text';

                // We first check to see if the type we give it sticks..
                // If the type does, we feed it a textual value, which shouldn't be valid.
                // If the value doesn't stick, we know there's input sanitization which infers a custom UI
                if ( bool ) {

                    inputElem.value         = smile;
                    inputElem.style.cssText = 'position:absolute;visibility:hidden;';

                    if ( /^range$/.test(inputElemType) && inputElem.style.WebkitAppearance !== undefined ) {

                      docElement.appendChild(inputElem);
                      defaultView = document.defaultView;

                      // Safari 2-4 allows the smiley as a value, despite making a slider
                      bool =  defaultView.getComputedStyle &&
                              defaultView.getComputedStyle(inputElem, null).WebkitAppearance !== 'textfield' &&
                              // Mobile android web browser has false positive, so must
                              // check the height to see if the widget is actually there.
                              (inputElem.offsetHeight !== 0);

                      docElement.removeChild(inputElem);

                    } else if ( /^(search|tel)$/.test(inputElemType) ){
                      // Spec doesn't define any special parsing or detectable UI
                      //   behaviors so we pass these through as true

                      // Interestingly, opera fails the earlier test, so it doesn't
                      //  even make it here.

                    } else if ( /^(url|email)$/.test(inputElemType) ) {
                      // Real url and email support comes with prebaked validation.
                      bool = inputElem.checkValidity && inputElem.checkValidity() === false;

                    } else {
                      // If the upgraded input compontent rejects the :) text, we got a winner
                      bool = inputElem.value != smile;
                    }
                }

                inputs[ props[i] ] = !!bool;
            }
            return inputs;
        })('search tel url email datetime date month week time datetime-local number range color'.split(' '));
        /*>>inputtypes*/
    }
    /*>>webforms*/


    // End of test definitions
    // -----------------------



    // Run through all tests and detect their support in the current UA.
    // todo: hypothetically we could be doing an array of tests and use a basic loop here.
    for ( var feature in tests ) {
        if ( hasOwnProp(tests, feature) ) {
            // run the test, throw the return value into the Modernizr,
            //   then based on that boolean, define an appropriate className
            //   and push it into an array of classes we'll join later.
            featureName  = feature.toLowerCase();
            Modernizr[featureName] = tests[feature]();

            classes.push((Modernizr[featureName] ? '' : 'no-') + featureName);
        }
    }

    /*>>webforms*/
    // input tests need to run.
    Modernizr.input || webforms();
    /*>>webforms*/


    /**
     * addTest allows the user to define their own feature tests
     * the result will be added onto the Modernizr object,
     * as well as an appropriate className set on the html element
     *
     * @param feature - String naming the feature
     * @param test - Function returning true if feature is supported, false if not
     */
     Modernizr.addTest = function ( feature, test ) {
       if ( typeof feature == 'object' ) {
         for ( var key in feature ) {
           if ( hasOwnProp( feature, key ) ) {
             Modernizr.addTest( key, feature[ key ] );
           }
         }
       } else {

         feature = feature.toLowerCase();

         if ( Modernizr[feature] !== undefined ) {
           // we're going to quit if you're trying to overwrite an existing test
           // if we were to allow it, we'd do this:
           //   var re = new RegExp("\\b(no-)?" + feature + "\\b");
           //   docElement.className = docElement.className.replace( re, '' );
           // but, no rly, stuff 'em.
           return Modernizr;
         }

         test = typeof test == 'function' ? test() : test;

         if (typeof enableClasses !== "undefined" && enableClasses) {
           docElement.className += ' ' + (test ? '' : 'no-') + feature;
         }
         Modernizr[feature] = test;

       }

       return Modernizr; // allow chaining.
     };


    // Reset modElem.cssText to nothing to reduce memory footprint.
    setCss('');
    modElem = inputElem = null;

    /*>>shiv*/
    /**
     * @preserve HTML5 Shiv prev3.7.1 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    ;(function(window, document) {
        /*jshint evil:true */
        /** version */
        var version = '3.7.0';

        /** Preset options */
        var options = window.html5 || {};

        /** Used to skip problem elements */
        var reSkip = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i;

        /** Not all elements can be cloned in IE **/
        var saveClones = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i;

        /** Detect whether the browser supports default html5 styles */
        var supportsHtml5Styles;

        /** Name of the expando, to work with multiple documents or to re-shiv one document */
        var expando = '_html5shiv';

        /** The id for the the documents expando */
        var expanID = 0;

        /** Cached data for each document */
        var expandoData = {};

        /** Detect whether the browser supports unknown elements */
        var supportsUnknownElements;

        (function() {
          try {
            var a = document.createElement('a');
            a.innerHTML = '<xyz></xyz>';
            //if the hidden property is implemented we can assume, that the browser supports basic HTML5 Styles
            supportsHtml5Styles = ('hidden' in a);

            supportsUnknownElements = a.childNodes.length == 1 || (function() {
              // assign a false positive if unable to shiv
              (document.createElement)('a');
              var frag = document.createDocumentFragment();
              return (
                typeof frag.cloneNode == 'undefined' ||
                typeof frag.createDocumentFragment == 'undefined' ||
                typeof frag.createElement == 'undefined'
              );
            }());
          } catch(e) {
            // assign a false positive if detection fails => unable to shiv
            supportsHtml5Styles = true;
            supportsUnknownElements = true;
          }

        }());

        /*--------------------------------------------------------------------------*/

        /**
         * Creates a style sheet with the given CSS text and adds it to the document.
         * @private
         * @param {Document} ownerDocument The document.
         * @param {String} cssText The CSS text.
         * @returns {StyleSheet} The style element.
         */
        function addStyleSheet(ownerDocument, cssText) {
          var p = ownerDocument.createElement('p'),
          parent = ownerDocument.getElementsByTagName('head')[0] || ownerDocument.documentElement;

          p.innerHTML = 'x<style>' + cssText + '</style>';
          return parent.insertBefore(p.lastChild, parent.firstChild);
        }

        /**
         * Returns the value of `html5.elements` as an array.
         * @private
         * @returns {Array} An array of shived element node names.
         */
        function getElements() {
          var elements = html5.elements;
          return typeof elements == 'string' ? elements.split(' ') : elements;
        }

        /**
         * Returns the data associated to the given document
         * @private
         * @param {Document} ownerDocument The document.
         * @returns {Object} An object of data.
         */
        function getExpandoData(ownerDocument) {
          var data = expandoData[ownerDocument[expando]];
          if (!data) {
            data = {};
            expanID++;
            ownerDocument[expando] = expanID;
            expandoData[expanID] = data;
          }
          return data;
        }

        /**
         * returns a shived element for the given nodeName and document
         * @memberOf html5
         * @param {String} nodeName name of the element
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived element.
         */
        function createElement(nodeName, ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createElement(nodeName);
          }
          if (!data) {
            data = getExpandoData(ownerDocument);
          }
          var node;

          if (data.cache[nodeName]) {
            node = data.cache[nodeName].cloneNode();
          } else if (saveClones.test(nodeName)) {
            node = (data.cache[nodeName] = data.createElem(nodeName)).cloneNode();
          } else {
            node = data.createElem(nodeName);
          }

          // Avoid adding some elements to fragments in IE < 9 because
          // * Attributes like `name` or `type` cannot be set/changed once an element
          //   is inserted into a document/fragment
          // * Link elements with `src` attributes that are inaccessible, as with
          //   a 403 response, will cause the tab/window to crash
          // * Script elements appended to fragments will execute when their `src`
          //   or `text` property is set
          return node.canHaveChildren && !reSkip.test(nodeName) && !node.tagUrn ? data.frag.appendChild(node) : node;
        }

        /**
         * returns a shived DocumentFragment for the given document
         * @memberOf html5
         * @param {Document} ownerDocument The context document.
         * @returns {Object} The shived DocumentFragment.
         */
        function createDocumentFragment(ownerDocument, data){
          if (!ownerDocument) {
            ownerDocument = document;
          }
          if(supportsUnknownElements){
            return ownerDocument.createDocumentFragment();
          }
          data = data || getExpandoData(ownerDocument);
          var clone = data.frag.cloneNode(),
          i = 0,
          elems = getElements(),
          l = elems.length;
          for(;i<l;i++){
            clone.createElement(elems[i]);
          }
          return clone;
        }

        /**
         * Shivs the `createElement` and `createDocumentFragment` methods of the document.
         * @private
         * @param {Document|DocumentFragment} ownerDocument The document.
         * @param {Object} data of the document.
         */
        function shivMethods(ownerDocument, data) {
          if (!data.cache) {
            data.cache = {};
            data.createElem = ownerDocument.createElement;
            data.createFrag = ownerDocument.createDocumentFragment;
            data.frag = data.createFrag();
          }


          ownerDocument.createElement = function(nodeName) {
            //abort shiv
            if (!html5.shivMethods) {
              return data.createElem(nodeName);
            }
            return createElement(nodeName, ownerDocument, data);
          };

          ownerDocument.createDocumentFragment = Function('h,f', 'return function(){' +
                                                          'var n=f.cloneNode(),c=n.createElement;' +
                                                          'h.shivMethods&&(' +
                                                          // unroll the `createElement` calls
                                                          getElements().join().replace(/[\w\-]+/g, function(nodeName) {
            data.createElem(nodeName);
            data.frag.createElement(nodeName);
            return 'c("' + nodeName + '")';
          }) +
            ');return n}'
                                                         )(html5, data.frag);
        }

        /*--------------------------------------------------------------------------*/

        /**
         * Shivs the given document.
         * @memberOf html5
         * @param {Document} ownerDocument The document to shiv.
         * @returns {Document} The shived document.
         */
        function shivDocument(ownerDocument) {
          if (!ownerDocument) {
            ownerDocument = document;
          }
          var data = getExpandoData(ownerDocument);

          if (html5.shivCSS && !supportsHtml5Styles && !data.hasCSS) {
            data.hasCSS = !!addStyleSheet(ownerDocument,
                                          // corrects block display not defined in IE6/7/8/9
                                          'article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}' +
                                            // adds styling not present in IE6/7/8/9
                                            'mark{background:#FF0;color:#000}' +
                                            // hides non-rendered elements
                                            'template{display:none}'
                                         );
          }
          if (!supportsUnknownElements) {
            shivMethods(ownerDocument, data);
          }
          return ownerDocument;
        }

        /*--------------------------------------------------------------------------*/

        /**
         * The `html5` object is exposed so that more elements can be shived and
         * existing shiving can be detected on iframes.
         * @type Object
         * @example
         *
         * // options can be changed before the script is included
         * html5 = { 'elements': 'mark section', 'shivCSS': false, 'shivMethods': false };
         */
        var html5 = {

          /**
           * An array or space separated string of node names of the elements to shiv.
           * @memberOf html5
           * @type Array|String
           */
          'elements': options.elements || 'abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output progress section summary template time video',

          /**
           * current version of html5shiv
           */
          'version': version,

          /**
           * A flag to indicate that the HTML5 style sheet should be inserted.
           * @memberOf html5
           * @type Boolean
           */
          'shivCSS': (options.shivCSS !== false),

          /**
           * Is equal to true if a browser supports creating unknown/HTML5 elements
           * @memberOf html5
           * @type boolean
           */
          'supportsUnknownElements': supportsUnknownElements,

          /**
           * A flag to indicate that the document's `createElement` and `createDocumentFragment`
           * methods should be overwritten.
           * @memberOf html5
           * @type Boolean
           */
          'shivMethods': (options.shivMethods !== false),

          /**
           * A string to describe the type of `html5` object ("default" or "default print").
           * @memberOf html5
           * @type String
           */
          'type': 'default',

          // shivs the document according to the specified `html5` object options
          'shivDocument': shivDocument,

          //creates a shived element
          createElement: createElement,

          //creates a shived documentFragment
          createDocumentFragment: createDocumentFragment
        };

        /*--------------------------------------------------------------------------*/

        // expose html5
        window.html5 = html5;

        // shiv the document
        shivDocument(document);

    }(this, document));
    /*>>shiv*/

    // Assign private properties to the return object with prefix
    Modernizr._version      = version;

    // expose these for the plugin API. Look in the source for how to join() them against your input
    /*>>prefixes*/
    Modernizr._prefixes     = prefixes;
    /*>>prefixes*/
    /*>>domprefixes*/
    Modernizr._domPrefixes  = domPrefixes;
    Modernizr._cssomPrefixes  = cssomPrefixes;
    /*>>domprefixes*/

    /*>>mq*/
    // Modernizr.mq tests a given media query, live against the current state of the window
    // A few important notes:
    //   * If a browser does not support media queries at all (eg. oldIE) the mq() will always return false
    //   * A max-width or orientation query will be evaluated against the current state, which may change later.
    //   * You must specify values. Eg. If you are testing support for the min-width media query use:
    //       Modernizr.mq('(min-width:0)')
    // usage:
    // Modernizr.mq('only screen and (max-width:768)')
    Modernizr.mq            = testMediaQuery;
    /*>>mq*/

    /*>>hasevent*/
    // Modernizr.hasEvent() detects support for a given event, with an optional element to test on
    // Modernizr.hasEvent('gesturestart', elem)
    Modernizr.hasEvent      = isEventSupported;
    /*>>hasevent*/

    /*>>testprop*/
    // Modernizr.testProp() investigates whether a given style property is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testProp('pointerEvents')
    Modernizr.testProp      = function(prop){
        return testProps([prop]);
    };
    /*>>testprop*/

    /*>>testallprops*/
    // Modernizr.testAllProps() investigates whether a given style property,
    //   or any of its vendor-prefixed variants, is recognized
    // Note that the property names must be provided in the camelCase variant.
    // Modernizr.testAllProps('boxSizing')
    Modernizr.testAllProps  = testPropsAll;
    /*>>testallprops*/


    /*>>teststyles*/
    // Modernizr.testStyles() allows you to add custom styles to the document and test an element afterwards
    // Modernizr.testStyles('#modernizr { position:absolute }', function(elem, rule){ ... })
    Modernizr.testStyles    = injectElementWithStyles;
    /*>>teststyles*/


    /*>>prefixed*/
    // Modernizr.prefixed() returns the prefixed or nonprefixed property name variant of your input
    // Modernizr.prefixed('boxSizing') // 'MozBoxSizing'

    // Properties must be passed as dom-style camelcase, rather than `box-sizing` hypentated style.
    // Return values will also be the camelCase variant, if you need to translate that to hypenated style use:
    //
    //     str.replace(/([A-Z])/g, function(str,m1){ return '-' + m1.toLowerCase(); }).replace(/^ms-/,'-ms-');

    // If you're trying to ascertain which transition end event to bind to, you might do something like...
    //
    //     var transEndEventNames = {
    //       'WebkitTransition' : 'webkitTransitionEnd',
    //       'MozTransition'    : 'transitionend',
    //       'OTransition'      : 'oTransitionEnd',
    //       'msTransition'     : 'MSTransitionEnd',
    //       'transition'       : 'transitionend'
    //     },
    //     transEndEventName = transEndEventNames[ Modernizr.prefixed('transition') ];

    Modernizr.prefixed      = function(prop, obj, elem){
      if(!obj) {
        return testPropsAll(prop, 'pfx');
      } else {
        // Testing DOM property e.g. Modernizr.prefixed('requestAnimationFrame', window) // 'mozRequestAnimationFrame'
        return testPropsAll(prop, obj, elem);
      }
    };
    /*>>prefixed*/


    /*>>cssclasses*/
    // Remove "no-js" class from <html> element, if it exists:
    docElement.className = docElement.className.replace(/(^|\s)no-js(\s|$)/, '$1$2') +

                            // Add the new classes to the <html> element.
                            (enableClasses ? ' js ' + classes.join(' ') : '');
    /*>>cssclasses*/

    return Modernizr;

})(this, this.document);

/*! jQuery v1.11.2 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l="1.11.2",m=function(a,b){return new m.fn.init(a,b)},n=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,o=/^-ms-/,p=/-([\da-z])/gi,q=function(a,b){return b.toUpperCase()};m.fn=m.prototype={jquery:l,constructor:m,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=m.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return m.each(this,a,b)},map:function(a){return this.pushStack(m.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},m.extend=m.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||m.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(m.isPlainObject(c)||(b=m.isArray(c)))?(b?(b=!1,f=a&&m.isArray(a)?a:[]):f=a&&m.isPlainObject(a)?a:{},g[d]=m.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},m.extend({expando:"jQuery"+(l+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===m.type(a)},isArray:Array.isArray||function(a){return"array"===m.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){return!m.isArray(a)&&a-parseFloat(a)+1>=0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},isPlainObject:function(a){var b;if(!a||"object"!==m.type(a)||a.nodeType||m.isWindow(a))return!1;try{if(a.constructor&&!j.call(a,"constructor")&&!j.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}if(k.ownLast)for(b in a)return j.call(a,b);for(b in a);return void 0===b||j.call(a,b)},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(b){b&&m.trim(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(o,"ms-").replace(p,q)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=r(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(n,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(r(Object(a))?m.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(g)return g.call(b,a,c);for(d=b.length,c=c?0>c?Math.max(0,d+c):c:0;d>c;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,b){var c=+b.length,d=0,e=a.length;while(c>d)a[e++]=b[d++];if(c!==c)while(void 0!==b[d])a[e++]=b[d++];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=r(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(f=a[b],b=a,a=f),m.isFunction(a)?(c=d.call(arguments,2),e=function(){return a.apply(b||this,c.concat(d.call(arguments)))},e.guid=a.guid=a.guid||m.guid++,e):void 0},now:function(){return+new Date},support:k}),m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function r(a){var b=a.length,c=m.type(a);return"function"===c||m.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var s=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+1*new Date,v=a.document,w=0,x=0,y=hb(),z=hb(),A=hb(),B=function(a,b){return a===b&&(l=!0),0},C=1<<31,D={}.hasOwnProperty,E=[],F=E.pop,G=E.push,H=E.push,I=E.slice,J=function(a,b){for(var c=0,d=a.length;d>c;c++)if(a[c]===b)return c;return-1},K="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",L="[\\x20\\t\\r\\n\\f]",M="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",N=M.replace("w","w#"),O="\\["+L+"*("+M+")(?:"+L+"*([*^$|!~]?=)"+L+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+N+"))|)"+L+"*\\]",P=":("+M+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+O+")*)|.*)\\)|)",Q=new RegExp(L+"+","g"),R=new RegExp("^"+L+"+|((?:^|[^\\\\])(?:\\\\.)*)"+L+"+$","g"),S=new RegExp("^"+L+"*,"+L+"*"),T=new RegExp("^"+L+"*([>+~]|"+L+")"+L+"*"),U=new RegExp("="+L+"*([^\\]'\"]*?)"+L+"*\\]","g"),V=new RegExp(P),W=new RegExp("^"+N+"$"),X={ID:new RegExp("^#("+M+")"),CLASS:new RegExp("^\\.("+M+")"),TAG:new RegExp("^("+M.replace("w","w*")+")"),ATTR:new RegExp("^"+O),PSEUDO:new RegExp("^"+P),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+L+"*(even|odd|(([+-]|)(\\d*)n|)"+L+"*(?:([+-]|)"+L+"*(\\d+)|))"+L+"*\\)|)","i"),bool:new RegExp("^(?:"+K+")$","i"),needsContext:new RegExp("^"+L+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+L+"*((?:-\\d)?\\d*)"+L+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ab=/[+~]/,bb=/'|\\/g,cb=new RegExp("\\\\([\\da-f]{1,6}"+L+"?|("+L+")|.)","ig"),db=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)},eb=function(){m()};try{H.apply(E=I.call(v.childNodes),v.childNodes),E[v.childNodes.length].nodeType}catch(fb){H={apply:E.length?function(a,b){G.apply(a,I.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function gb(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],k=b.nodeType,"string"!=typeof a||!a||1!==k&&9!==k&&11!==k)return d;if(!e&&p){if(11!==k&&(f=_.exec(a)))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return H.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName)return H.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=1!==k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(bb,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+rb(o[l]);w=ab.test(a)&&pb(b.parentNode)||b,x=o.join(",")}if(x)try{return H.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function hb(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function ib(a){return a[u]=!0,a}function jb(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function kb(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function lb(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||C)-(~a.sourceIndex||C);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function mb(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function nb(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function ob(a){return ib(function(b){return b=+b,ib(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function pb(a){return a&&"undefined"!=typeof a.getElementsByTagName&&a}c=gb.support={},f=gb.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=gb.setDocument=function(a){var b,e,g=a?a.ownerDocument||a:v;return g!==n&&9===g.nodeType&&g.documentElement?(n=g,o=g.documentElement,e=g.defaultView,e&&e!==e.top&&(e.addEventListener?e.addEventListener("unload",eb,!1):e.attachEvent&&e.attachEvent("onunload",eb)),p=!f(g),c.attributes=jb(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=jb(function(a){return a.appendChild(g.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(g.getElementsByClassName),c.getById=jb(function(a){return o.appendChild(a).id=u,!g.getElementsByName||!g.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if("undefined"!=typeof b.getElementById&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(cb,db);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(cb,db);return function(a){var c="undefined"!=typeof a.getAttributeNode&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return"undefined"!=typeof b.getElementsByTagName?b.getElementsByTagName(a):c.qsa?b.querySelectorAll(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(g.querySelectorAll))&&(jb(function(a){o.appendChild(a).innerHTML="<a id='"+u+"'></a><select id='"+u+"-\f]' msallowcapture=''><option selected=''></option></select>",a.querySelectorAll("[msallowcapture^='']").length&&q.push("[*^$]="+L+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+L+"*(?:value|"+K+")"),a.querySelectorAll("[id~="+u+"-]").length||q.push("~="),a.querySelectorAll(":checked").length||q.push(":checked"),a.querySelectorAll("a#"+u+"+*").length||q.push(".#.+[+~]")}),jb(function(a){var b=g.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+L+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&jb(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",P)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===g||a.ownerDocument===v&&t(v,a)?-1:b===g||b.ownerDocument===v&&t(v,b)?1:k?J(k,a)-J(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,e=a.parentNode,f=b.parentNode,h=[a],i=[b];if(!e||!f)return a===g?-1:b===g?1:e?-1:f?1:k?J(k,a)-J(k,b):0;if(e===f)return lb(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?lb(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},g):n},gb.matches=function(a,b){return gb(a,null,null,b)},gb.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return gb(b,n,null,[a]).length>0},gb.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},gb.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&D.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},gb.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},gb.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=gb.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=gb.selectors={cacheLength:50,createPseudo:ib,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(cb,db),a[3]=(a[3]||a[4]||a[5]||"").replace(cb,db),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||gb.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&gb.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(cb,db).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+L+")"+a+"("+L+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||"undefined"!=typeof a.getAttribute&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=gb.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e.replace(Q," ")+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||gb.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?ib(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=J(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:ib(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?ib(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),b[0]=null,!c.pop()}}),has:ib(function(a){return function(b){return gb(a,b).length>0}}),contains:ib(function(a){return a=a.replace(cb,db),function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:ib(function(a){return W.test(a||"")||gb.error("unsupported lang: "+a),a=a.replace(cb,db).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:ob(function(){return[0]}),last:ob(function(a,b){return[b-1]}),eq:ob(function(a,b,c){return[0>c?c+b:c]}),even:ob(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:ob(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:ob(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:ob(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=mb(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=nb(b);function qb(){}qb.prototype=d.filters=d.pseudos,d.setFilters=new qb,g=gb.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?gb.error(a):z(a,i).slice(0)};function rb(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function sb(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function tb(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function ub(a,b,c){for(var d=0,e=b.length;e>d;d++)gb(a,b[d],c);return c}function vb(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function wb(a,b,c,d,e,f){return d&&!d[u]&&(d=wb(d)),e&&!e[u]&&(e=wb(e,f)),ib(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||ub(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:vb(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=vb(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?J(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=vb(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):H.apply(g,r)})}function xb(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=sb(function(a){return a===b},h,!0),l=sb(function(a){return J(b,a)>-1},h,!0),m=[function(a,c,d){var e=!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d));return b=null,e}];f>i;i++)if(c=d.relative[a[i].type])m=[sb(tb(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return wb(i>1&&tb(m),i>1&&rb(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&xb(a.slice(i,e)),f>e&&xb(a=a.slice(e)),f>e&&rb(a))}m.push(c)}return tb(m)}function yb(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=F.call(i));s=vb(s)}H.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&gb.uniqueSort(i)}return k&&(w=v,j=t),r};return c?ib(f):f}return h=gb.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=xb(b[c]),f[u]?d.push(f):e.push(f);f=A(a,yb(e,d)),f.selector=a}return f},i=gb.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(cb,db),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(cb,db),ab.test(j[0].type)&&pb(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&rb(j),!a)return H.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,ab.test(a)&&pb(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=jb(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),jb(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||kb("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&jb(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||kb("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),jb(function(a){return null==a.getAttribute("disabled")})||kb(K,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),gb}(a);m.find=s,m.expr=s.selectors,m.expr[":"]=m.expr.pseudos,m.unique=s.uniqueSort,m.text=s.getText,m.isXMLDoc=s.isXML,m.contains=s.contains;var t=m.expr.match.needsContext,u=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,v=/^.[^:#\[\.,]*$/;function w(a,b,c){if(m.isFunction(b))return m.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return m.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(v.test(b))return m.filter(b,a,c);b=m.filter(b,a)}return m.grep(a,function(a){return m.inArray(a,b)>=0!==c})}m.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?m.find.matchesSelector(d,a)?[d]:[]:m.find.matches(a,m.grep(b,function(a){return 1===a.nodeType}))},m.fn.extend({find:function(a){var b,c=[],d=this,e=d.length;if("string"!=typeof a)return this.pushStack(m(a).filter(function(){for(b=0;e>b;b++)if(m.contains(d[b],this))return!0}));for(b=0;e>b;b++)m.find(a,d[b],c);return c=this.pushStack(e>1?m.unique(c):c),c.selector=this.selector?this.selector+" "+a:a,c},filter:function(a){return this.pushStack(w(this,a||[],!1))},not:function(a){return this.pushStack(w(this,a||[],!0))},is:function(a){return!!w(this,"string"==typeof a&&t.test(a)?m(a):a||[],!1).length}});var x,y=a.document,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=m.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||x).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof m?b[0]:b,m.merge(this,m.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:y,!0)),u.test(c[1])&&m.isPlainObject(b))for(c in b)m.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}if(d=y.getElementById(c[2]),d&&d.parentNode){if(d.id!==c[2])return x.find(a);this.length=1,this[0]=d}return this.context=y,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):m.isFunction(a)?"undefined"!=typeof x.ready?x.ready(a):a(m):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),m.makeArray(a,this))};A.prototype=m.fn,x=m(y);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};m.extend({dir:function(a,b,c){var d=[],e=a[b];while(e&&9!==e.nodeType&&(void 0===c||1!==e.nodeType||!m(e).is(c)))1===e.nodeType&&d.push(e),e=e[b];return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),m.fn.extend({has:function(a){var b,c=m(a,this),d=c.length;return this.filter(function(){for(b=0;d>b;b++)if(m.contains(this,c[b]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=t.test(a)||"string"!=typeof a?m(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&m.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?m.unique(f):f)},index:function(a){return a?"string"==typeof a?m.inArray(this[0],m(a)):m.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(m.unique(m.merge(this.get(),m(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){do a=a[b];while(a&&1!==a.nodeType);return a}m.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return m.dir(a,"parentNode")},parentsUntil:function(a,b,c){return m.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return m.dir(a,"nextSibling")},prevAll:function(a){return m.dir(a,"previousSibling")},nextUntil:function(a,b,c){return m.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return m.dir(a,"previousSibling",c)},siblings:function(a){return m.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return m.sibling(a.firstChild)},contents:function(a){return m.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:m.merge([],a.childNodes)}},function(a,b){m.fn[a]=function(c,d){var e=m.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=m.filter(d,e)),this.length>1&&(C[a]||(e=m.unique(e)),B.test(a)&&(e=e.reverse())),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return m.each(a.match(E)||[],function(a,c){b[c]=!0}),b}m.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):m.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(c=a.memory&&l,d=!0,f=g||0,g=0,e=h.length,b=!0;h&&e>f;f++)if(h[f].apply(l[0],l[1])===!1&&a.stopOnFalse){c=!1;break}b=!1,h&&(i?i.length&&j(i.shift()):c?h=[]:k.disable())},k={add:function(){if(h){var d=h.length;!function f(b){m.each(b,function(b,c){var d=m.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&f(c)})}(arguments),b?e=h.length:c&&(g=d,j(c))}return this},remove:function(){return h&&m.each(arguments,function(a,c){var d;while((d=m.inArray(c,h,d))>-1)h.splice(d,1),b&&(e>=d&&e--,f>=d&&f--)}),this},has:function(a){return a?m.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],e=0,this},disable:function(){return h=i=c=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,c||k.disable(),this},locked:function(){return!i},fireWith:function(a,c){return!h||d&&!i||(c=c||[],c=[a,c.slice?c.slice():c],b?i.push(c):j(c)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!d}};return k},m.extend({Deferred:function(a){var b=[["resolve","done",m.Callbacks("once memory"),"resolved"],["reject","fail",m.Callbacks("once memory"),"rejected"],["notify","progress",m.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return m.Deferred(function(c){m.each(b,function(b,f){var g=m.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&m.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?m.extend(a,d):d}},e={};return d.pipe=d.then,m.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&m.isFunction(a.promise)?e:0,g=1===f?a:m.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&m.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;m.fn.ready=function(a){return m.ready.promise().done(a),this},m.extend({isReady:!1,readyWait:1,holdReady:function(a){a?m.readyWait++:m.ready(!0)},ready:function(a){if(a===!0?!--m.readyWait:!m.isReady){if(!y.body)return setTimeout(m.ready);m.isReady=!0,a!==!0&&--m.readyWait>0||(H.resolveWith(y,[m]),m.fn.triggerHandler&&(m(y).triggerHandler("ready"),m(y).off("ready")))}}});function I(){y.addEventListener?(y.removeEventListener("DOMContentLoaded",J,!1),a.removeEventListener("load",J,!1)):(y.detachEvent("onreadystatechange",J),a.detachEvent("onload",J))}function J(){(y.addEventListener||"load"===event.type||"complete"===y.readyState)&&(I(),m.ready())}m.ready.promise=function(b){if(!H)if(H=m.Deferred(),"complete"===y.readyState)setTimeout(m.ready);else if(y.addEventListener)y.addEventListener("DOMContentLoaded",J,!1),a.addEventListener("load",J,!1);else{y.attachEvent("onreadystatechange",J),a.attachEvent("onload",J);var c=!1;try{c=null==a.frameElement&&y.documentElement}catch(d){}c&&c.doScroll&&!function e(){if(!m.isReady){try{c.doScroll("left")}catch(a){return setTimeout(e,50)}I(),m.ready()}}()}return H.promise(b)};var K="undefined",L;for(L in m(k))break;k.ownLast="0"!==L,k.inlineBlockNeedsLayout=!1,m(function(){var a,b,c,d;c=y.getElementsByTagName("body")[0],c&&c.style&&(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),typeof b.style.zoom!==K&&(b.style.cssText="display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1",k.inlineBlockNeedsLayout=a=3===b.offsetWidth,a&&(c.style.zoom=1)),c.removeChild(d))}),function(){var a=y.createElement("div");if(null==k.deleteExpando){k.deleteExpando=!0;try{delete a.test}catch(b){k.deleteExpando=!1}}a=null}(),m.acceptData=function(a){var b=m.noData[(a.nodeName+" ").toLowerCase()],c=+a.nodeType||1;return 1!==c&&9!==c?!1:!b||b!==!0&&a.getAttribute("classid")===b};var M=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,N=/([A-Z])/g;function O(a,b,c){if(void 0===c&&1===a.nodeType){var d="data-"+b.replace(N,"-$1").toLowerCase();if(c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:M.test(c)?m.parseJSON(c):c}catch(e){}m.data(a,b,c)}else c=void 0}return c}function P(a){var b;for(b in a)if(("data"!==b||!m.isEmptyObject(a[b]))&&"toJSON"!==b)return!1;
return!0}function Q(a,b,d,e){if(m.acceptData(a)){var f,g,h=m.expando,i=a.nodeType,j=i?m.cache:a,k=i?a[h]:a[h]&&h;if(k&&j[k]&&(e||j[k].data)||void 0!==d||"string"!=typeof b)return k||(k=i?a[h]=c.pop()||m.guid++:h),j[k]||(j[k]=i?{}:{toJSON:m.noop}),("object"==typeof b||"function"==typeof b)&&(e?j[k]=m.extend(j[k],b):j[k].data=m.extend(j[k].data,b)),g=j[k],e||(g.data||(g.data={}),g=g.data),void 0!==d&&(g[m.camelCase(b)]=d),"string"==typeof b?(f=g[b],null==f&&(f=g[m.camelCase(b)])):f=g,f}}function R(a,b,c){if(m.acceptData(a)){var d,e,f=a.nodeType,g=f?m.cache:a,h=f?a[m.expando]:m.expando;if(g[h]){if(b&&(d=c?g[h]:g[h].data)){m.isArray(b)?b=b.concat(m.map(b,m.camelCase)):b in d?b=[b]:(b=m.camelCase(b),b=b in d?[b]:b.split(" ")),e=b.length;while(e--)delete d[b[e]];if(c?!P(d):!m.isEmptyObject(d))return}(c||(delete g[h].data,P(g[h])))&&(f?m.cleanData([a],!0):k.deleteExpando||g!=g.window?delete g[h]:g[h]=null)}}}m.extend({cache:{},noData:{"applet ":!0,"embed ":!0,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(a){return a=a.nodeType?m.cache[a[m.expando]]:a[m.expando],!!a&&!P(a)},data:function(a,b,c){return Q(a,b,c)},removeData:function(a,b){return R(a,b)},_data:function(a,b,c){return Q(a,b,c,!0)},_removeData:function(a,b){return R(a,b,!0)}}),m.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=m.data(f),1===f.nodeType&&!m._data(f,"parsedAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=m.camelCase(d.slice(5)),O(f,d,e[d])));m._data(f,"parsedAttrs",!0)}return e}return"object"==typeof a?this.each(function(){m.data(this,a)}):arguments.length>1?this.each(function(){m.data(this,a,b)}):f?O(f,a,m.data(f,a)):void 0},removeData:function(a){return this.each(function(){m.removeData(this,a)})}}),m.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=m._data(a,b),c&&(!d||m.isArray(c)?d=m._data(a,b,m.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=m.queue(a,b),d=c.length,e=c.shift(),f=m._queueHooks(a,b),g=function(){m.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return m._data(a,c)||m._data(a,c,{empty:m.Callbacks("once memory").add(function(){m._removeData(a,b+"queue"),m._removeData(a,c)})})}}),m.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?m.queue(this[0],a):void 0===b?this:this.each(function(){var c=m.queue(this,a,b);m._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&m.dequeue(this,a)})},dequeue:function(a){return this.each(function(){m.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=m.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=m._data(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var S=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=["Top","Right","Bottom","Left"],U=function(a,b){return a=b||a,"none"===m.css(a,"display")||!m.contains(a.ownerDocument,a)},V=m.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===m.type(c)){e=!0;for(h in c)m.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,m.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(m(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},W=/^(?:checkbox|radio)$/i;!function(){var a=y.createElement("input"),b=y.createElement("div"),c=y.createDocumentFragment();if(b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",k.leadingWhitespace=3===b.firstChild.nodeType,k.tbody=!b.getElementsByTagName("tbody").length,k.htmlSerialize=!!b.getElementsByTagName("link").length,k.html5Clone="<:nav></:nav>"!==y.createElement("nav").cloneNode(!0).outerHTML,a.type="checkbox",a.checked=!0,c.appendChild(a),k.appendChecked=a.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue,c.appendChild(b),b.innerHTML="<input type='radio' checked='checked' name='t'/>",k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,k.noCloneEvent=!0,b.attachEvent&&(b.attachEvent("onclick",function(){k.noCloneEvent=!1}),b.cloneNode(!0).click()),null==k.deleteExpando){k.deleteExpando=!0;try{delete b.test}catch(d){k.deleteExpando=!1}}}(),function(){var b,c,d=y.createElement("div");for(b in{submit:!0,change:!0,focusin:!0})c="on"+b,(k[b+"Bubbles"]=c in a)||(d.setAttribute(c,"t"),k[b+"Bubbles"]=d.attributes[c].expando===!1);d=null}();var X=/^(?:input|select|textarea)$/i,Y=/^key/,Z=/^(?:mouse|pointer|contextmenu)|click/,$=/^(?:focusinfocus|focusoutblur)$/,_=/^([^.]*)(?:\.(.+)|)$/;function ab(){return!0}function bb(){return!1}function cb(){try{return y.activeElement}catch(a){}}m.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,n,o,p,q,r=m._data(a);if(r){c.handler&&(i=c,c=i.handler,e=i.selector),c.guid||(c.guid=m.guid++),(g=r.events)||(g=r.events={}),(k=r.handle)||(k=r.handle=function(a){return typeof m===K||a&&m.event.triggered===a.type?void 0:m.event.dispatch.apply(k.elem,arguments)},k.elem=a),b=(b||"").match(E)||[""],h=b.length;while(h--)f=_.exec(b[h])||[],o=q=f[1],p=(f[2]||"").split(".").sort(),o&&(j=m.event.special[o]||{},o=(e?j.delegateType:j.bindType)||o,j=m.event.special[o]||{},l=m.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&m.expr.match.needsContext.test(e),namespace:p.join(".")},i),(n=g[o])||(n=g[o]=[],n.delegateCount=0,j.setup&&j.setup.call(a,d,p,k)!==!1||(a.addEventListener?a.addEventListener(o,k,!1):a.attachEvent&&a.attachEvent("on"+o,k))),j.add&&(j.add.call(a,l),l.handler.guid||(l.handler.guid=c.guid)),e?n.splice(n.delegateCount++,0,l):n.push(l),m.event.global[o]=!0);a=null}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,n,o,p,q,r=m.hasData(a)&&m._data(a);if(r&&(k=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=_.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=m.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,n=k[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=n.length;while(f--)g=n[f],!e&&q!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(n.splice(f,1),g.selector&&n.delegateCount--,l.remove&&l.remove.call(a,g));i&&!n.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||m.removeEvent(a,o,r.handle),delete k[o])}else for(o in k)m.event.remove(a,o+b[j],c,d,!0);m.isEmptyObject(k)&&(delete r.handle,m._removeData(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,l,n,o=[d||y],p=j.call(b,"type")?b.type:b,q=j.call(b,"namespace")?b.namespace.split("."):[];if(h=l=d=d||y,3!==d.nodeType&&8!==d.nodeType&&!$.test(p+m.event.triggered)&&(p.indexOf(".")>=0&&(q=p.split("."),p=q.shift(),q.sort()),g=p.indexOf(":")<0&&"on"+p,b=b[m.expando]?b:new m.Event(p,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=q.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:m.makeArray(c,[b]),k=m.event.special[p]||{},e||!k.trigger||k.trigger.apply(d,c)!==!1)){if(!e&&!k.noBubble&&!m.isWindow(d)){for(i=k.delegateType||p,$.test(i+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),l=h;l===(d.ownerDocument||y)&&o.push(l.defaultView||l.parentWindow||a)}n=0;while((h=o[n++])&&!b.isPropagationStopped())b.type=n>1?i:k.bindType||p,f=(m._data(h,"events")||{})[b.type]&&m._data(h,"handle"),f&&f.apply(h,c),f=g&&h[g],f&&f.apply&&m.acceptData(h)&&(b.result=f.apply(h,c),b.result===!1&&b.preventDefault());if(b.type=p,!e&&!b.isDefaultPrevented()&&(!k._default||k._default.apply(o.pop(),c)===!1)&&m.acceptData(d)&&g&&d[p]&&!m.isWindow(d)){l=d[g],l&&(d[g]=null),m.event.triggered=p;try{d[p]()}catch(r){}m.event.triggered=void 0,l&&(d[g]=l)}return b.result}},dispatch:function(a){a=m.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(m._data(this,"events")||{})[a.type]||[],k=m.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=m.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,g=0;while((e=f.handlers[g++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(e.namespace))&&(a.handleObj=e,a.data=e.data,c=((m.event.special[e.origType]||{}).handle||e.handler).apply(f.elem,i),void 0!==c&&(a.result=c)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!=this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(e=[],f=0;h>f;f++)d=b[f],c=d.selector+" ",void 0===e[c]&&(e[c]=d.needsContext?m(c,this).index(i)>=0:m.find(c,this,null,[i]).length),e[c]&&e.push(d);e.length&&g.push({elem:i,handlers:e})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},fix:function(a){if(a[m.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=Z.test(e)?this.mouseHooks:Y.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new m.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=f.srcElement||y),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,g.filter?g.filter(a,f):a},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button,g=b.fromElement;return null==a.pageX&&null!=b.clientX&&(d=a.target.ownerDocument||y,e=d.documentElement,c=d.body,a.pageX=b.clientX+(e&&e.scrollLeft||c&&c.scrollLeft||0)-(e&&e.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||c&&c.scrollTop||0)-(e&&e.clientTop||c&&c.clientTop||0)),!a.relatedTarget&&g&&(a.relatedTarget=g===a.target?b.toElement:g),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==cb()&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){return this===cb()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return m.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):void 0},_default:function(a){return m.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=m.extend(new m.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?m.event.trigger(e,null,b):m.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},m.removeEvent=y.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]===K&&(a[d]=null),a.detachEvent(d,c))},m.Event=function(a,b){return this instanceof m.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ab:bb):this.type=a,b&&m.extend(this,b),this.timeStamp=a&&a.timeStamp||m.now(),void(this[m.expando]=!0)):new m.Event(a,b)},m.Event.prototype={isDefaultPrevented:bb,isPropagationStopped:bb,isImmediatePropagationStopped:bb,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ab,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ab,a&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ab,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},m.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){m.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!m.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.submitBubbles||(m.event.special.submit={setup:function(){return m.nodeName(this,"form")?!1:void m.event.add(this,"click._submit keypress._submit",function(a){var b=a.target,c=m.nodeName(b,"input")||m.nodeName(b,"button")?b.form:void 0;c&&!m._data(c,"submitBubbles")&&(m.event.add(c,"submit._submit",function(a){a._submit_bubble=!0}),m._data(c,"submitBubbles",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&m.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){return m.nodeName(this,"form")?!1:void m.event.remove(this,"._submit")}}),k.changeBubbles||(m.event.special.change={setup:function(){return X.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(m.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._just_changed=!0)}),m.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),m.event.simulate("change",this,a,!0)})),!1):void m.event.add(this,"beforeactivate._change",function(a){var b=a.target;X.test(b.nodeName)&&!m._data(b,"changeBubbles")&&(m.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||m.event.simulate("change",this.parentNode,a,!0)}),m._data(b,"changeBubbles",!0))})},handle:function(a){var b=a.target;return this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type?a.handleObj.handler.apply(this,arguments):void 0},teardown:function(){return m.event.remove(this,"._change"),!X.test(this.nodeName)}}),k.focusinBubbles||m.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){m.event.simulate(b,a.target,m.event.fix(a),!0)};m.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=m._data(d,b);e||d.addEventListener(a,c,!0),m._data(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=m._data(d,b)-1;e?m._data(d,b,e):(d.removeEventListener(a,c,!0),m._removeData(d,b))}}}),m.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(f in a)this.on(f,b,c,a[f],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=bb;else if(!d)return this;return 1===e&&(g=d,d=function(a){return m().off(a),g.apply(this,arguments)},d.guid=g.guid||(g.guid=m.guid++)),this.each(function(){m.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,m(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=bb),this.each(function(){m.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){m.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?m.event.trigger(a,b,c,!0):void 0}});function db(a){var b=eb.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}var eb="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",fb=/ jQuery\d+="(?:null|\d+)"/g,gb=new RegExp("<(?:"+eb+")[\\s/>]","i"),hb=/^\s+/,ib=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,jb=/<([\w:]+)/,kb=/<tbody/i,lb=/<|&#?\w+;/,mb=/<(?:script|style|link)/i,nb=/checked\s*(?:[^=]|=\s*.checked.)/i,ob=/^$|\/(?:java|ecma)script/i,pb=/^true\/(.*)/,qb=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,rb={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:k.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},sb=db(y),tb=sb.appendChild(y.createElement("div"));rb.optgroup=rb.option,rb.tbody=rb.tfoot=rb.colgroup=rb.caption=rb.thead,rb.th=rb.td;function ub(a,b){var c,d,e=0,f=typeof a.getElementsByTagName!==K?a.getElementsByTagName(b||"*"):typeof a.querySelectorAll!==K?a.querySelectorAll(b||"*"):void 0;if(!f)for(f=[],c=a.childNodes||a;null!=(d=c[e]);e++)!b||m.nodeName(d,b)?f.push(d):m.merge(f,ub(d,b));return void 0===b||b&&m.nodeName(a,b)?m.merge([a],f):f}function vb(a){W.test(a.type)&&(a.defaultChecked=a.checked)}function wb(a,b){return m.nodeName(a,"table")&&m.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function xb(a){return a.type=(null!==m.find.attr(a,"type"))+"/"+a.type,a}function yb(a){var b=pb.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function zb(a,b){for(var c,d=0;null!=(c=a[d]);d++)m._data(c,"globalEval",!b||m._data(b[d],"globalEval"))}function Ab(a,b){if(1===b.nodeType&&m.hasData(a)){var c,d,e,f=m._data(a),g=m._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;e>d;d++)m.event.add(b,c,h[c][d])}g.data&&(g.data=m.extend({},g.data))}}function Bb(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!k.noCloneEvent&&b[m.expando]){e=m._data(b);for(d in e.events)m.removeEvent(b,d,e.handle);b.removeAttribute(m.expando)}"script"===c&&b.text!==a.text?(xb(b).text=a.text,yb(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),k.html5Clone&&a.innerHTML&&!m.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&W.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}}m.extend({clone:function(a,b,c){var d,e,f,g,h,i=m.contains(a.ownerDocument,a);if(k.html5Clone||m.isXMLDoc(a)||!gb.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(tb.innerHTML=a.outerHTML,tb.removeChild(f=tb.firstChild)),!(k.noCloneEvent&&k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||m.isXMLDoc(a)))for(d=ub(f),h=ub(a),g=0;null!=(e=h[g]);++g)d[g]&&Bb(e,d[g]);if(b)if(c)for(h=h||ub(a),d=d||ub(f),g=0;null!=(e=h[g]);g++)Ab(e,d[g]);else Ab(a,f);return d=ub(f,"script"),d.length>0&&zb(d,!i&&ub(a,"script")),d=h=e=null,f},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,l,n=a.length,o=db(b),p=[],q=0;n>q;q++)if(f=a[q],f||0===f)if("object"===m.type(f))m.merge(p,f.nodeType?[f]:f);else if(lb.test(f)){h=h||o.appendChild(b.createElement("div")),i=(jb.exec(f)||["",""])[1].toLowerCase(),l=rb[i]||rb._default,h.innerHTML=l[1]+f.replace(ib,"<$1></$2>")+l[2],e=l[0];while(e--)h=h.lastChild;if(!k.leadingWhitespace&&hb.test(f)&&p.push(b.createTextNode(hb.exec(f)[0])),!k.tbody){f="table"!==i||kb.test(f)?"<table>"!==l[1]||kb.test(f)?0:h:h.firstChild,e=f&&f.childNodes.length;while(e--)m.nodeName(j=f.childNodes[e],"tbody")&&!j.childNodes.length&&f.removeChild(j)}m.merge(p,h.childNodes),h.textContent="";while(h.firstChild)h.removeChild(h.firstChild);h=o.lastChild}else p.push(b.createTextNode(f));h&&o.removeChild(h),k.appendChecked||m.grep(ub(p,"input"),vb),q=0;while(f=p[q++])if((!d||-1===m.inArray(f,d))&&(g=m.contains(f.ownerDocument,f),h=ub(o.appendChild(f),"script"),g&&zb(h),c)){e=0;while(f=h[e++])ob.test(f.type||"")&&c.push(f)}return h=null,o},cleanData:function(a,b){for(var d,e,f,g,h=0,i=m.expando,j=m.cache,l=k.deleteExpando,n=m.event.special;null!=(d=a[h]);h++)if((b||m.acceptData(d))&&(f=d[i],g=f&&j[f])){if(g.events)for(e in g.events)n[e]?m.event.remove(d,e):m.removeEvent(d,e,g.handle);j[f]&&(delete j[f],l?delete d[i]:typeof d.removeAttribute!==K?d.removeAttribute(i):d[i]=null,c.push(f))}}}),m.fn.extend({text:function(a){return V(this,function(a){return void 0===a?m.text(this):this.empty().append((this[0]&&this[0].ownerDocument||y).createTextNode(a))},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=wb(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=wb(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?m.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||m.cleanData(ub(c)),c.parentNode&&(b&&m.contains(c.ownerDocument,c)&&zb(ub(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){1===a.nodeType&&m.cleanData(ub(a,!1));while(a.firstChild)a.removeChild(a.firstChild);a.options&&m.nodeName(a,"select")&&(a.options.length=0)}return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return m.clone(this,a,b)})},html:function(a){return V(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a)return 1===b.nodeType?b.innerHTML.replace(fb,""):void 0;if(!("string"!=typeof a||mb.test(a)||!k.htmlSerialize&&gb.test(a)||!k.leadingWhitespace&&hb.test(a)||rb[(jb.exec(a)||["",""])[1].toLowerCase()])){a=a.replace(ib,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(m.cleanData(ub(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,m.cleanData(ub(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,n=this,o=l-1,p=a[0],q=m.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&nb.test(p))return this.each(function(c){var d=n.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(i=m.buildFragment(a,this[0].ownerDocument,!1,this),c=i.firstChild,1===i.childNodes.length&&(i=c),c)){for(g=m.map(ub(i,"script"),xb),f=g.length;l>j;j++)d=i,j!==o&&(d=m.clone(d,!0,!0),f&&m.merge(g,ub(d,"script"))),b.call(this[j],d,j);if(f)for(h=g[g.length-1].ownerDocument,m.map(g,yb),j=0;f>j;j++)d=g[j],ob.test(d.type||"")&&!m._data(d,"globalEval")&&m.contains(h,d)&&(d.src?m._evalUrl&&m._evalUrl(d.src):m.globalEval((d.text||d.textContent||d.innerHTML||"").replace(qb,"")));i=c=null}return this}}),m.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){m.fn[a]=function(a){for(var c,d=0,e=[],g=m(a),h=g.length-1;h>=d;d++)c=d===h?this:this.clone(!0),m(g[d])[b](c),f.apply(e,c.get());return this.pushStack(e)}});var Cb,Db={};function Eb(b,c){var d,e=m(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:m.css(e[0],"display");return e.detach(),f}function Fb(a){var b=y,c=Db[a];return c||(c=Eb(a,b),"none"!==c&&c||(Cb=(Cb||m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=(Cb[0].contentWindow||Cb[0].contentDocument).document,b.write(),b.close(),c=Eb(a,b),Cb.detach()),Db[a]=c),c}!function(){var a;k.shrinkWrapBlocks=function(){if(null!=a)return a;a=!1;var b,c,d;return c=y.getElementsByTagName("body")[0],c&&c.style?(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),typeof b.style.zoom!==K&&(b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1",b.appendChild(y.createElement("div")).style.width="5px",a=3!==b.offsetWidth),c.removeChild(d),a):void 0}}();var Gb=/^margin/,Hb=new RegExp("^("+S+")(?!px)[a-z%]+$","i"),Ib,Jb,Kb=/^(top|right|bottom|left)$/;a.getComputedStyle?(Ib=function(b){return b.ownerDocument.defaultView.opener?b.ownerDocument.defaultView.getComputedStyle(b,null):a.getComputedStyle(b,null)},Jb=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ib(a),g=c?c.getPropertyValue(b)||c[b]:void 0,c&&(""!==g||m.contains(a.ownerDocument,a)||(g=m.style(a,b)),Hb.test(g)&&Gb.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0===g?g:g+""}):y.documentElement.currentStyle&&(Ib=function(a){return a.currentStyle},Jb=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ib(a),g=c?c[b]:void 0,null==g&&h&&h[b]&&(g=h[b]),Hb.test(g)&&!Kb.test(b)&&(d=h.left,e=a.runtimeStyle,f=e&&e.left,f&&(e.left=a.currentStyle.left),h.left="fontSize"===b?"1em":g,g=h.pixelLeft+"px",h.left=d,f&&(e.left=f)),void 0===g?g:g+""||"auto"});function Lb(a,b){return{get:function(){var c=a();if(null!=c)return c?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d,e,f,g,h;if(b=y.createElement("div"),b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",d=b.getElementsByTagName("a")[0],c=d&&d.style){c.cssText="float:left;opacity:.5",k.opacity="0.5"===c.opacity,k.cssFloat=!!c.cssFloat,b.style.backgroundClip="content-box",b.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===b.style.backgroundClip,k.boxSizing=""===c.boxSizing||""===c.MozBoxSizing||""===c.WebkitBoxSizing,m.extend(k,{reliableHiddenOffsets:function(){return null==g&&i(),g},boxSizingReliable:function(){return null==f&&i(),f},pixelPosition:function(){return null==e&&i(),e},reliableMarginRight:function(){return null==h&&i(),h}});function i(){var b,c,d,i;c=y.getElementsByTagName("body")[0],c&&c.style&&(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),b.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",e=f=!1,h=!0,a.getComputedStyle&&(e="1%"!==(a.getComputedStyle(b,null)||{}).top,f="4px"===(a.getComputedStyle(b,null)||{width:"4px"}).width,i=b.appendChild(y.createElement("div")),i.style.cssText=b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",i.style.marginRight=i.style.width="0",b.style.width="1px",h=!parseFloat((a.getComputedStyle(i,null)||{}).marginRight),b.removeChild(i)),b.innerHTML="<table><tr><td></td><td>t</td></tr></table>",i=b.getElementsByTagName("td"),i[0].style.cssText="margin:0;border:0;padding:0;display:none",g=0===i[0].offsetHeight,g&&(i[0].style.display="",i[1].style.display="none",g=0===i[0].offsetHeight),c.removeChild(d))}}}(),m.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var Mb=/alpha\([^)]*\)/i,Nb=/opacity\s*=\s*([^)]*)/,Ob=/^(none|table(?!-c[ea]).+)/,Pb=new RegExp("^("+S+")(.*)$","i"),Qb=new RegExp("^([+-])=("+S+")","i"),Rb={position:"absolute",visibility:"hidden",display:"block"},Sb={letterSpacing:"0",fontWeight:"400"},Tb=["Webkit","O","Moz","ms"];function Ub(a,b){if(b in a)return b;var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=Tb.length;while(e--)if(b=Tb[e]+c,b in a)return b;return d}function Vb(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=m._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&U(d)&&(f[g]=m._data(d,"olddisplay",Fb(d.nodeName)))):(e=U(d),(c&&"none"!==c||!e)&&m._data(d,"olddisplay",e?c:m.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function Wb(a,b,c){var d=Pb.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Xb(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=m.css(a,c+T[f],!0,e)),d?("content"===c&&(g-=m.css(a,"padding"+T[f],!0,e)),"margin"!==c&&(g-=m.css(a,"border"+T[f]+"Width",!0,e))):(g+=m.css(a,"padding"+T[f],!0,e),"padding"!==c&&(g+=m.css(a,"border"+T[f]+"Width",!0,e)));return g}function Yb(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Ib(a),g=k.boxSizing&&"border-box"===m.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=Jb(a,b,f),(0>e||null==e)&&(e=a.style[b]),Hb.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Xb(a,b,c||(g?"border":"content"),d,f)+"px"}m.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Jb(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":k.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=m.camelCase(b),i=a.style;if(b=m.cssProps[h]||(m.cssProps[h]=Ub(i,h)),g=m.cssHooks[b]||m.cssHooks[h],void 0===c)return g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b];if(f=typeof c,"string"===f&&(e=Qb.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(m.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||m.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),!(g&&"set"in g&&void 0===(c=g.set(a,c,d)))))try{i[b]=c}catch(j){}}},css:function(a,b,c,d){var e,f,g,h=m.camelCase(b);return b=m.cssProps[h]||(m.cssProps[h]=Ub(a.style,h)),g=m.cssHooks[b]||m.cssHooks[h],g&&"get"in g&&(f=g.get(a,!0,c)),void 0===f&&(f=Jb(a,b,d)),"normal"===f&&b in Sb&&(f=Sb[b]),""===c||c?(e=parseFloat(f),c===!0||m.isNumeric(e)?e||0:f):f}}),m.each(["height","width"],function(a,b){m.cssHooks[b]={get:function(a,c,d){return c?Ob.test(m.css(a,"display"))&&0===a.offsetWidth?m.swap(a,Rb,function(){return Yb(a,b,d)}):Yb(a,b,d):void 0},set:function(a,c,d){var e=d&&Ib(a);return Wb(a,c,d?Xb(a,b,d,k.boxSizing&&"border-box"===m.css(a,"boxSizing",!1,e),e):0)}}}),k.opacity||(m.cssHooks.opacity={get:function(a,b){return Nb.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=m.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===m.trim(f.replace(Mb,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Mb.test(f)?f.replace(Mb,e):f+" "+e)}}),m.cssHooks.marginRight=Lb(k.reliableMarginRight,function(a,b){return b?m.swap(a,{display:"inline-block"},Jb,[a,"marginRight"]):void 0}),m.each({margin:"",padding:"",border:"Width"},function(a,b){m.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+T[d]+b]=f[d]||f[d-2]||f[0];return e}},Gb.test(a)||(m.cssHooks[a+b].set=Wb)}),m.fn.extend({css:function(a,b){return V(this,function(a,b,c){var d,e,f={},g=0;if(m.isArray(b)){for(d=Ib(a),e=b.length;e>g;g++)f[b[g]]=m.css(a,b[g],!1,d);return f}return void 0!==c?m.style(a,b,c):m.css(a,b)},a,b,arguments.length>1)},show:function(){return Vb(this,!0)},hide:function(){return Vb(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){U(this)?m(this).show():m(this).hide()})}});function Zb(a,b,c,d,e){return new Zb.prototype.init(a,b,c,d,e)
}m.Tween=Zb,Zb.prototype={constructor:Zb,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(m.cssNumber[c]?"":"px")},cur:function(){var a=Zb.propHooks[this.prop];return a&&a.get?a.get(this):Zb.propHooks._default.get(this)},run:function(a){var b,c=Zb.propHooks[this.prop];return this.pos=b=this.options.duration?m.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Zb.propHooks._default.set(this),this}},Zb.prototype.init.prototype=Zb.prototype,Zb.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=m.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){m.fx.step[a.prop]?m.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[m.cssProps[a.prop]]||m.cssHooks[a.prop])?m.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Zb.propHooks.scrollTop=Zb.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},m.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},m.fx=Zb.prototype.init,m.fx.step={};var $b,_b,ac=/^(?:toggle|show|hide)$/,bc=new RegExp("^(?:([+-])=|)("+S+")([a-z%]*)$","i"),cc=/queueHooks$/,dc=[ic],ec={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=bc.exec(b),f=e&&e[3]||(m.cssNumber[a]?"":"px"),g=(m.cssNumber[a]||"px"!==f&&+d)&&bc.exec(m.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,m.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function fc(){return setTimeout(function(){$b=void 0}),$b=m.now()}function gc(a,b){var c,d={height:a},e=0;for(b=b?1:0;4>e;e+=2-b)c=T[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function hc(a,b,c){for(var d,e=(ec[b]||[]).concat(ec["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function ic(a,b,c){var d,e,f,g,h,i,j,l,n=this,o={},p=a.style,q=a.nodeType&&U(a),r=m._data(a,"fxshow");c.queue||(h=m._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,n.always(function(){n.always(function(){h.unqueued--,m.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[p.overflow,p.overflowX,p.overflowY],j=m.css(a,"display"),l="none"===j?m._data(a,"olddisplay")||Fb(a.nodeName):j,"inline"===l&&"none"===m.css(a,"float")&&(k.inlineBlockNeedsLayout&&"inline"!==Fb(a.nodeName)?p.zoom=1:p.display="inline-block")),c.overflow&&(p.overflow="hidden",k.shrinkWrapBlocks()||n.always(function(){p.overflow=c.overflow[0],p.overflowX=c.overflow[1],p.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],ac.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(q?"hide":"show")){if("show"!==e||!r||void 0===r[d])continue;q=!0}o[d]=r&&r[d]||m.style(a,d)}else j=void 0;if(m.isEmptyObject(o))"inline"===("none"===j?Fb(a.nodeName):j)&&(p.display=j);else{r?"hidden"in r&&(q=r.hidden):r=m._data(a,"fxshow",{}),f&&(r.hidden=!q),q?m(a).show():n.done(function(){m(a).hide()}),n.done(function(){var b;m._removeData(a,"fxshow");for(b in o)m.style(a,b,o[b])});for(d in o)g=hc(q?r[d]:0,d,n),d in r||(r[d]=g.start,q&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function jc(a,b){var c,d,e,f,g;for(c in a)if(d=m.camelCase(c),e=b[d],f=a[c],m.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=m.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function kc(a,b,c){var d,e,f=0,g=dc.length,h=m.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=$b||fc(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:m.extend({},b),opts:m.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:$b||fc(),duration:c.duration,tweens:[],createTween:function(b,c){var d=m.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(jc(k,j.opts.specialEasing);g>f;f++)if(d=dc[f].call(j,a,k,j.opts))return d;return m.map(k,hc,j),m.isFunction(j.opts.start)&&j.opts.start.call(a,j),m.fx.timer(m.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}m.Animation=m.extend(kc,{tweener:function(a,b){m.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],ec[c]=ec[c]||[],ec[c].unshift(b)},prefilter:function(a,b){b?dc.unshift(a):dc.push(a)}}),m.speed=function(a,b,c){var d=a&&"object"==typeof a?m.extend({},a):{complete:c||!c&&b||m.isFunction(a)&&a,duration:a,easing:c&&b||b&&!m.isFunction(b)&&b};return d.duration=m.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in m.fx.speeds?m.fx.speeds[d.duration]:m.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){m.isFunction(d.old)&&d.old.call(this),d.queue&&m.dequeue(this,d.queue)},d},m.fn.extend({fadeTo:function(a,b,c,d){return this.filter(U).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=m.isEmptyObject(a),f=m.speed(b,c,d),g=function(){var b=kc(this,m.extend({},a),f);(e||m._data(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=m.timers,g=m._data(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&cc.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&m.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=m._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=m.timers,g=d?d.length:0;for(c.finish=!0,m.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),m.each(["toggle","show","hide"],function(a,b){var c=m.fn[b];m.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(gc(b,!0),a,d,e)}}),m.each({slideDown:gc("show"),slideUp:gc("hide"),slideToggle:gc("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){m.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),m.timers=[],m.fx.tick=function(){var a,b=m.timers,c=0;for($b=m.now();c<b.length;c++)a=b[c],a()||b[c]!==a||b.splice(c--,1);b.length||m.fx.stop(),$b=void 0},m.fx.timer=function(a){m.timers.push(a),a()?m.fx.start():m.timers.pop()},m.fx.interval=13,m.fx.start=function(){_b||(_b=setInterval(m.fx.tick,m.fx.interval))},m.fx.stop=function(){clearInterval(_b),_b=null},m.fx.speeds={slow:600,fast:200,_default:400},m.fn.delay=function(a,b){return a=m.fx?m.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a,b,c,d,e;b=y.createElement("div"),b.setAttribute("className","t"),b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",d=b.getElementsByTagName("a")[0],c=y.createElement("select"),e=c.appendChild(y.createElement("option")),a=b.getElementsByTagName("input")[0],d.style.cssText="top:1px",k.getSetAttribute="t"!==b.className,k.style=/top/.test(d.getAttribute("style")),k.hrefNormalized="/a"===d.getAttribute("href"),k.checkOn=!!a.value,k.optSelected=e.selected,k.enctype=!!y.createElement("form").enctype,c.disabled=!0,k.optDisabled=!e.disabled,a=y.createElement("input"),a.setAttribute("value",""),k.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),k.radioValue="t"===a.value}();var lc=/\r/g;m.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=m.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,m(this).val()):a,null==e?e="":"number"==typeof e?e+="":m.isArray(e)&&(e=m.map(e,function(a){return null==a?"":a+""})),b=m.valHooks[this.type]||m.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=m.valHooks[e.type]||m.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(lc,""):null==c?"":c)}}}),m.extend({valHooks:{option:{get:function(a){var b=m.find.attr(a,"value");return null!=b?b:m.trim(m.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&m.nodeName(c.parentNode,"optgroup"))){if(b=m(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=m.makeArray(b),g=e.length;while(g--)if(d=e[g],m.inArray(m.valHooks.option.get(d),f)>=0)try{d.selected=c=!0}catch(h){d.scrollHeight}else d.selected=!1;return c||(a.selectedIndex=-1),e}}}}),m.each(["radio","checkbox"],function(){m.valHooks[this]={set:function(a,b){return m.isArray(b)?a.checked=m.inArray(m(a).val(),b)>=0:void 0}},k.checkOn||(m.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var mc,nc,oc=m.expr.attrHandle,pc=/^(?:checked|selected)$/i,qc=k.getSetAttribute,rc=k.input;m.fn.extend({attr:function(a,b){return V(this,m.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){m.removeAttr(this,a)})}}),m.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===K?m.prop(a,b,c):(1===f&&m.isXMLDoc(a)||(b=b.toLowerCase(),d=m.attrHooks[b]||(m.expr.match.bool.test(b)?nc:mc)),void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=m.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void m.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=m.propFix[c]||c,m.expr.match.bool.test(c)?rc&&qc||!pc.test(c)?a[d]=!1:a[m.camelCase("default-"+c)]=a[d]=!1:m.attr(a,c,""),a.removeAttribute(qc?c:d)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&m.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),nc={set:function(a,b,c){return b===!1?m.removeAttr(a,c):rc&&qc||!pc.test(c)?a.setAttribute(!qc&&m.propFix[c]||c,c):a[m.camelCase("default-"+c)]=a[c]=!0,c}},m.each(m.expr.match.bool.source.match(/\w+/g),function(a,b){var c=oc[b]||m.find.attr;oc[b]=rc&&qc||!pc.test(b)?function(a,b,d){var e,f;return d||(f=oc[b],oc[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,oc[b]=f),e}:function(a,b,c){return c?void 0:a[m.camelCase("default-"+b)]?b.toLowerCase():null}}),rc&&qc||(m.attrHooks.value={set:function(a,b,c){return m.nodeName(a,"input")?void(a.defaultValue=b):mc&&mc.set(a,b,c)}}),qc||(mc={set:function(a,b,c){var d=a.getAttributeNode(c);return d||a.setAttributeNode(d=a.ownerDocument.createAttribute(c)),d.value=b+="","value"===c||b===a.getAttribute(c)?b:void 0}},oc.id=oc.name=oc.coords=function(a,b,c){var d;return c?void 0:(d=a.getAttributeNode(b))&&""!==d.value?d.value:null},m.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);return c&&c.specified?c.value:void 0},set:mc.set},m.attrHooks.contenteditable={set:function(a,b,c){mc.set(a,""===b?!1:b,c)}},m.each(["width","height"],function(a,b){m.attrHooks[b]={set:function(a,c){return""===c?(a.setAttribute(b,"auto"),c):void 0}}})),k.style||(m.attrHooks.style={get:function(a){return a.style.cssText||void 0},set:function(a,b){return a.style.cssText=b+""}});var sc=/^(?:input|select|textarea|button|object)$/i,tc=/^(?:a|area)$/i;m.fn.extend({prop:function(a,b){return V(this,m.prop,a,b,arguments.length>1)},removeProp:function(a){return a=m.propFix[a]||a,this.each(function(){try{this[a]=void 0,delete this[a]}catch(b){}})}}),m.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!m.isXMLDoc(a),f&&(b=m.propFix[b]||b,e=m.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=m.find.attr(a,"tabindex");return b?parseInt(b,10):sc.test(a.nodeName)||tc.test(a.nodeName)&&a.href?0:-1}}}}),k.hrefNormalized||m.each(["href","src"],function(a,b){m.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}}),k.optSelected||(m.propHooks.selected={get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}}),m.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){m.propFix[this.toLowerCase()]=this}),k.enctype||(m.propFix.enctype="encoding");var uc=/[\t\r\n\f]/g;m.fn.extend({addClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j="string"==typeof a&&a;if(m.isFunction(a))return this.each(function(b){m(this).addClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(E)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(uc," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=m.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j=0===arguments.length||"string"==typeof a&&a;if(m.isFunction(a))return this.each(function(b){m(this).removeClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(E)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(uc," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?m.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(m.isFunction(a)?function(c){m(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=m(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===K||"boolean"===c)&&(this.className&&m._data(this,"__className__",this.className),this.className=this.className||a===!1?"":m._data(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(uc," ").indexOf(b)>=0)return!0;return!1}}),m.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){m.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),m.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var vc=m.now(),wc=/\?/,xc=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;m.parseJSON=function(b){if(a.JSON&&a.JSON.parse)return a.JSON.parse(b+"");var c,d=null,e=m.trim(b+"");return e&&!m.trim(e.replace(xc,function(a,b,e,f){return c&&b&&(d=0),0===d?a:(c=e||b,d+=!f-!e,"")}))?Function("return "+e)():m.error("Invalid JSON: "+b)},m.parseXML=function(b){var c,d;if(!b||"string"!=typeof b)return null;try{a.DOMParser?(d=new DOMParser,c=d.parseFromString(b,"text/xml")):(c=new ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b))}catch(e){c=void 0}return c&&c.documentElement&&!c.getElementsByTagName("parsererror").length||m.error("Invalid XML: "+b),c};var yc,zc,Ac=/#.*$/,Bc=/([?&])_=[^&]*/,Cc=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Dc=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Ec=/^(?:GET|HEAD)$/,Fc=/^\/\//,Gc=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,Hc={},Ic={},Jc="*/".concat("*");try{zc=location.href}catch(Kc){zc=y.createElement("a"),zc.href="",zc=zc.href}yc=Gc.exec(zc.toLowerCase())||[];function Lc(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(m.isFunction(c))while(d=f[e++])"+"===d.charAt(0)?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Mc(a,b,c,d){var e={},f=a===Ic;function g(h){var i;return e[h]=!0,m.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Nc(a,b){var c,d,e=m.ajaxSettings.flatOptions||{};for(d in b)void 0!==b[d]&&((e[d]?a:c||(c={}))[d]=b[d]);return c&&m.extend(!0,a,c),a}function Oc(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===e&&(e=a.mimeType||b.getResponseHeader("Content-Type"));if(e)for(g in h)if(h[g]&&h[g].test(e)){i.unshift(g);break}if(i[0]in c)f=i[0];else{for(g in c){if(!i[0]||a.converters[g+" "+i[0]]){f=g;break}d||(d=g)}f=f||d}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function Pc(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}m.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:zc,type:"GET",isLocal:Dc.test(yc[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Jc,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":m.parseJSON,"text xml":m.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Nc(Nc(a,m.ajaxSettings),b):Nc(m.ajaxSettings,a)},ajaxPrefilter:Lc(Hc),ajaxTransport:Lc(Ic),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=m.ajaxSetup({},b),l=k.context||k,n=k.context&&(l.nodeType||l.jquery)?m(l):m.event,o=m.Deferred(),p=m.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!j){j={};while(b=Cc.exec(f))j[b[1].toLowerCase()]=b[2]}b=j[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?f:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return i&&i.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||zc)+"").replace(Ac,"").replace(Fc,yc[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=m.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(c=Gc.exec(k.url.toLowerCase()),k.crossDomain=!(!c||c[1]===yc[1]&&c[2]===yc[2]&&(c[3]||("http:"===c[1]?"80":"443"))===(yc[3]||("http:"===yc[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=m.param(k.data,k.traditional)),Mc(Hc,k,b,v),2===t)return v;h=m.event&&k.global,h&&0===m.active++&&m.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!Ec.test(k.type),e=k.url,k.hasContent||(k.data&&(e=k.url+=(wc.test(e)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=Bc.test(e)?e.replace(Bc,"$1_="+vc++):e+(wc.test(e)?"&":"?")+"_="+vc++)),k.ifModified&&(m.lastModified[e]&&v.setRequestHeader("If-Modified-Since",m.lastModified[e]),m.etag[e]&&v.setRequestHeader("If-None-Match",m.etag[e])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+Jc+"; q=0.01":""):k.accepts["*"]);for(d in k.headers)v.setRequestHeader(d,k.headers[d]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(d in{success:1,error:1,complete:1})v[d](k[d]);if(i=Mc(Ic,k,b,v)){v.readyState=1,h&&n.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,i.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,c,d){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),i=void 0,f=d||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,c&&(u=Oc(k,v,c)),u=Pc(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(m.lastModified[e]=w),w=v.getResponseHeader("etag"),w&&(m.etag[e]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,h&&n.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),h&&(n.trigger("ajaxComplete",[v,k]),--m.active||m.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return m.get(a,b,c,"json")},getScript:function(a,b){return m.get(a,void 0,b,"script")}}),m.each(["get","post"],function(a,b){m[b]=function(a,c,d,e){return m.isFunction(c)&&(e=e||d,d=c,c=void 0),m.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),m._evalUrl=function(a){return m.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},m.fn.extend({wrapAll:function(a){if(m.isFunction(a))return this.each(function(b){m(this).wrapAll(a.call(this,b))});if(this[0]){var b=m(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&1===a.firstChild.nodeType)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return this.each(m.isFunction(a)?function(b){m(this).wrapInner(a.call(this,b))}:function(){var b=m(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=m.isFunction(a);return this.each(function(c){m(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){m.nodeName(this,"body")||m(this).replaceWith(this.childNodes)}).end()}}),m.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0||!k.reliableHiddenOffsets()&&"none"===(a.style&&a.style.display||m.css(a,"display"))},m.expr.filters.visible=function(a){return!m.expr.filters.hidden(a)};var Qc=/%20/g,Rc=/\[\]$/,Sc=/\r?\n/g,Tc=/^(?:submit|button|image|reset|file)$/i,Uc=/^(?:input|select|textarea|keygen)/i;function Vc(a,b,c,d){var e;if(m.isArray(b))m.each(b,function(b,e){c||Rc.test(a)?d(a,e):Vc(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==m.type(b))d(a,b);else for(e in b)Vc(a+"["+e+"]",b[e],c,d)}m.param=function(a,b){var c,d=[],e=function(a,b){b=m.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=m.ajaxSettings&&m.ajaxSettings.traditional),m.isArray(a)||a.jquery&&!m.isPlainObject(a))m.each(a,function(){e(this.name,this.value)});else for(c in a)Vc(c,a[c],b,e);return d.join("&").replace(Qc,"+")},m.fn.extend({serialize:function(){return m.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=m.prop(this,"elements");return a?m.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!m(this).is(":disabled")&&Uc.test(this.nodeName)&&!Tc.test(a)&&(this.checked||!W.test(a))}).map(function(a,b){var c=m(this).val();return null==c?null:m.isArray(c)?m.map(c,function(a){return{name:b.name,value:a.replace(Sc,"\r\n")}}):{name:b.name,value:c.replace(Sc,"\r\n")}}).get()}}),m.ajaxSettings.xhr=void 0!==a.ActiveXObject?function(){return!this.isLocal&&/^(get|post|head|put|delete|options)$/i.test(this.type)&&Zc()||$c()}:Zc;var Wc=0,Xc={},Yc=m.ajaxSettings.xhr();a.attachEvent&&a.attachEvent("onunload",function(){for(var a in Xc)Xc[a](void 0,!0)}),k.cors=!!Yc&&"withCredentials"in Yc,Yc=k.ajax=!!Yc,Yc&&m.ajaxTransport(function(a){if(!a.crossDomain||k.cors){var b;return{send:function(c,d){var e,f=a.xhr(),g=++Wc;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)void 0!==c[e]&&f.setRequestHeader(e,c[e]+"");f.send(a.hasContent&&a.data||null),b=function(c,e){var h,i,j;if(b&&(e||4===f.readyState))if(delete Xc[g],b=void 0,f.onreadystatechange=m.noop,e)4!==f.readyState&&f.abort();else{j={},h=f.status,"string"==typeof f.responseText&&(j.text=f.responseText);try{i=f.statusText}catch(k){i=""}h||!a.isLocal||a.crossDomain?1223===h&&(h=204):h=j.text?200:404}j&&d(h,i,j,f.getAllResponseHeaders())},a.async?4===f.readyState?setTimeout(b):f.onreadystatechange=Xc[g]=b:b()},abort:function(){b&&b(void 0,!0)}}}});function Zc(){try{return new a.XMLHttpRequest}catch(b){}}function $c(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}m.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return m.globalEval(a),a}}}),m.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),m.ajaxTransport("script",function(a){if(a.crossDomain){var b,c=y.head||m("head")[0]||y.documentElement;return{send:function(d,e){b=y.createElement("script"),b.async=!0,a.scriptCharset&&(b.charset=a.scriptCharset),b.src=a.url,b.onload=b.onreadystatechange=function(a,c){(c||!b.readyState||/loaded|complete/.test(b.readyState))&&(b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||e(200,"success"))},c.insertBefore(b,c.firstChild)},abort:function(){b&&b.onload(void 0,!0)}}}});var _c=[],ad=/(=)\?(?=&|$)|\?\?/;m.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=_c.pop()||m.expando+"_"+vc++;return this[a]=!0,a}}),m.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(ad.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&ad.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=m.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(ad,"$1"+e):b.jsonp!==!1&&(b.url+=(wc.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||m.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,_c.push(e)),g&&m.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),m.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||y;var d=u.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=m.buildFragment([a],b,e),e&&e.length&&m(e).remove(),m.merge([],d.childNodes))};var bd=m.fn.load;m.fn.load=function(a,b,c){if("string"!=typeof a&&bd)return bd.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=m.trim(a.slice(h,a.length)),a=a.slice(0,h)),m.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(f="POST"),g.length>0&&m.ajax({url:a,type:f,dataType:"html",data:b}).done(function(a){e=arguments,g.html(d?m("<div>").append(m.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,e||[a.responseText,b,a])}),this},m.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){m.fn[b]=function(a){return this.on(b,a)}}),m.expr.filters.animated=function(a){return m.grep(m.timers,function(b){return a===b.elem}).length};var cd=a.document.documentElement;function dd(a){return m.isWindow(a)?a:9===a.nodeType?a.defaultView||a.parentWindow:!1}m.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=m.css(a,"position"),l=m(a),n={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=m.css(a,"top"),i=m.css(a,"left"),j=("absolute"===k||"fixed"===k)&&m.inArray("auto",[f,i])>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),m.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(n.top=b.top-h.top+g),null!=b.left&&(n.left=b.left-h.left+e),"using"in b?b.using.call(a,n):l.css(n)}},m.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){m.offset.setOffset(this,a,b)});var b,c,d={top:0,left:0},e=this[0],f=e&&e.ownerDocument;if(f)return b=f.documentElement,m.contains(b,e)?(typeof e.getBoundingClientRect!==K&&(d=e.getBoundingClientRect()),c=dd(f),{top:d.top+(c.pageYOffset||b.scrollTop)-(b.clientTop||0),left:d.left+(c.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}):d},position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return"fixed"===m.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),m.nodeName(a[0],"html")||(c=a.offset()),c.top+=m.css(a[0],"borderTopWidth",!0),c.left+=m.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-m.css(d,"marginTop",!0),left:b.left-c.left-m.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||cd;while(a&&!m.nodeName(a,"html")&&"static"===m.css(a,"position"))a=a.offsetParent;return a||cd})}}),m.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c=/Y/.test(b);m.fn[a]=function(d){return V(this,function(a,d,e){var f=dd(a);return void 0===e?f?b in f?f[b]:f.document.documentElement[d]:a[d]:void(f?f.scrollTo(c?m(f).scrollLeft():e,c?e:m(f).scrollTop()):a[d]=e)},a,d,arguments.length,null)}}),m.each(["top","left"],function(a,b){m.cssHooks[b]=Lb(k.pixelPosition,function(a,c){return c?(c=Jb(a,b),Hb.test(c)?m(a).position()[b]+"px":c):void 0})}),m.each({Height:"height",Width:"width"},function(a,b){m.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){m.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return V(this,function(b,c,d){var e;return m.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?m.css(b,c,g):m.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),m.fn.size=function(){return this.length},m.fn.andSelf=m.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return m});var ed=a.jQuery,fd=a.$;return m.noConflict=function(b){return a.$===m&&(a.$=fd),b&&a.jQuery===m&&(a.jQuery=ed),m},typeof b===K&&(a.jQuery=a.$=m),m});

/*!
 * animsition v3.4.1
 * http://blivesta.github.io/animsition/
 * Licensed under MIT
 * Author : blivesta
 * http://blivesta.com/
 */
!function(a){"use strict";var b="animsition",c={init:function(d){d=a.extend({inClass:"fade-in",outClass:"fade-out",inDuration:1500,outDuration:800,linkElement:".animsition-link",loading:!0,loadingParentElement:"body",loadingClass:"animsition-loading",unSupportCss:["animation-duration","-webkit-animation-duration","-o-animation-duration"],overlay:!1,overlayClass:"animsition-overlay-slide",overlayParentElement:"body"},d);var e=c.supportCheck.call(this,d);if(!e)return"console"in window||(window.console={},window.console.log=function(a){return a}),console.log("Animsition does not support this browser."),c.destroy.call(this);var f=c.optionCheck.call(this,d);return f&&c.addOverlay.call(this,d),d.loading&&c.addLoading.call(this,d),this.each(function(){var e=this,f=a(this),g=a(window),h=f.data(b);h||(d=a.extend({},d),f.data(b,{options:d}),g.on("load."+b+" pageshow."+b,function(){c.pageIn.call(e)}),g.on("unload."+b,function(){}),a(d.linkElement).on("click."+b,function(b){b.preventDefault();var d=a(this);c.pageOut.call(e,d)}))})},addOverlay:function(b){a(b.overlayParentElement).prepend('<div class="'+b.overlayClass+'"></div>')},addLoading:function(b){a(b.loadingParentElement).append('<div class="'+b.loadingClass+'"></div>')},removeLoading:function(){var c=a(this),d=c.data(b).options,e=a(d.loadingParentElement).children("."+d.loadingClass);e.fadeOut().remove()},supportCheck:function(b){var c=a(this),d=b.unSupportCss,e=d.length,f=!1;0===e&&(f=!0);for(var g=0;e>g;g++)if("string"==typeof c.css(d[g])){f=!0;break}return f},optionCheck:function(b){var c,d=a(this);return c=b.overlay||d.data("animsition-overlay")?!0:!1},animationCheck:function(c,d,e){var f=a(this),g=f.data(b).options,h=typeof c,i=!d&&"number"===h,j=d&&"string"===h&&c.length>0;return i||j?c=c:d&&e?c=g.inClass:!d&&e?c=g.inDuration:d&&!e?c=g.outClass:d||e||(c=g.outDuration),c},pageIn:function(){var d=this,e=a(this),f=e.data(b).options,g=e.data("animsition-in-duration"),h=e.data("animsition-in"),i=c.animationCheck.call(d,g,!1,!0),j=c.animationCheck.call(d,h,!0,!0),k=c.optionCheck.call(d,f);f.loading&&c.removeLoading.call(d),k?c.pageInOverlay.call(d,j,i):c.pageInBasic.call(d,j,i)},pageInBasic:function(b,c){var d=a(this);d.css({"animation-duration":c/1e3+"s"}).addClass(b).animateCallback(function(){d.removeClass(b).css({opacity:1})})},pageInOverlay:function(c,d){var e=a(this),f=e.data(b).options;e.css({opacity:1}),a(f.overlayParentElement).children("."+f.overlayClass).css({"animation-duration":d/1e3+"s"}).addClass(c)},pageOut:function(d){var e=this,f=a(this),g=f.data(b).options,h=d.data("animsition-out"),i=f.data("animsition-out"),j=d.data("animsition-out-duration"),k=f.data("animsition-out-duration"),l=h?h:i,m=j?j:k,n=c.animationCheck.call(e,l,!0,!1),o=c.animationCheck.call(e,m,!1,!1),p=c.optionCheck.call(e,g),q=d.attr("href");p?c.pageOutOverlay.call(e,n,o,q):c.pageOutBasic.call(e,n,o,q)},pageOutBasic:function(b,c,d){var e=a(this);e.css({"animation-duration":c/1e3+"s"}).addClass(b).animateCallback(function(){location.href=d})},pageOutOverlay:function(d,e,f){var g=this,h=a(this),i=h.data(b).options,j=h.data("animsition-in"),k=c.animationCheck.call(g,j,!0,!0);a(i.overlayParentElement).children("."+i.overlayClass).css({"animation-duration":e/1e3+"s"}).removeClass(k).addClass(d).animateCallback(function(){h.css({opacity:0}),location.href=f})},destroy:function(){return this.each(function(){var c=a(this);a(window).unbind("."+b),c.css({opacity:1}).removeData(b)})}};a.fn.animateCallback=function(b){var c="animationend webkitAnimationEnd mozAnimationEnd oAnimationEnd MSAnimationEnd";return this.each(function(){a(this).bind(c,function(){return a(this).unbind(c),b.call(this)})})},a.fn.animsition=function(d){return c[d]?c[d].apply(this,Array.prototype.slice.call(arguments,1)):"object"!=typeof d&&d?void a.error("Method "+d+" does not exist on jQuery."+b):c.init.apply(this,arguments)}}(jQuery);
// Sticky Plugin v1.0.0 for jQuery
// =============
// Author: Anthony Garand
// Improvements by German M. Bravo (Kronuz) and Ruud Kamphuis (ruudk)
// Improvements by Leonardo C. Daronco (daronco)
// Created: 2/14/2011
// Date: 2/12/2012
// Website: http://labs.anthonygarand.com/sticky
// Description: Makes an element on the page stick on the screen as you scroll
//       It will only set the 'top' and 'position' of your element, you
//       might need to adjust the width in some cases.

(function($) {
  var defaults = {
      topSpacing: 0,
      bottomSpacing: 0,
      className: 'is-sticky',
      wrapperClassName: 'sticky-wrapper',
      center: false,
      getWidthFrom: '',
      responsiveWidth: false
    },
    $window = $(window),
    $document = $(document),
    sticked = [],
    windowHeight = $window.height(),
    scroller = function() {
      var scrollTop = $window.scrollTop(),
        documentHeight = $document.height(),
        dwh = documentHeight - windowHeight,
        extra = (scrollTop > dwh) ? dwh - scrollTop : 0;

      for (var i = 0; i < sticked.length; i++) {
        var s = sticked[i],
          elementTop = s.stickyWrapper.offset().top,
          etse = elementTop - s.topSpacing - extra;

        if (scrollTop <= etse) {
          if (s.currentTop !== null) {
            s.stickyElement
              .css('width', '')
              .css('position', '')
              .css('top', '');
            s.stickyElement.trigger('sticky-end', [s]).parent().removeClass(s.className);
            s.currentTop = null;
          }
        }
        else {
          var newTop = documentHeight - s.stickyElement.outerHeight()
            - s.topSpacing - s.bottomSpacing - scrollTop - extra;
          if (newTop < 0) {
            newTop = newTop + s.topSpacing;
          } else {
            newTop = s.topSpacing;
          }
          if (s.currentTop != newTop) {
            s.stickyElement
              .css('width', s.stickyElement.width())
              .css('position', 'fixed')
              .css('top', newTop);

            if (typeof s.getWidthFrom !== 'undefined') {
              s.stickyElement.css('width', $(s.getWidthFrom).width());
            }

            s.stickyElement.trigger('sticky-start', [s]).parent().addClass(s.className);
            s.currentTop = newTop;
          }
        }
      }
    },
    resizer = function() {
      windowHeight = $window.height();

      for (var i = 0; i < sticked.length; i++) {
        var s = sticked[i];
        if (typeof s.getWidthFrom !== 'undefined' && s.responsiveWidth === true) {
          s.stickyElement.css('width', $(s.getWidthFrom).width());
        }
      }
    },
    methods = {
      init: function(options) {
        var o = $.extend({}, defaults, options);
        return this.each(function() {
          var stickyElement = $(this);

          var stickyId = stickyElement.attr('id');
          var wrapperId = stickyId ? stickyId + '-' + defaults.wrapperClassName : defaults.wrapperClassName 
          var wrapper = $('<div></div>')
            .attr('id', stickyId + '-sticky-wrapper')
            .addClass(o.wrapperClassName);
          stickyElement.wrapAll(wrapper);

          if (o.center) {
            stickyElement.parent().css({width:stickyElement.outerWidth(),marginLeft:"auto",marginRight:"auto"});
          }

          if (stickyElement.css("float") == "right") {
            stickyElement.css({"float":"none"}).parent().css({"float":"right"});
          }

          var stickyWrapper = stickyElement.parent();
          stickyWrapper.css('height', stickyElement.outerHeight());
          sticked.push({
            topSpacing: o.topSpacing,
            bottomSpacing: o.bottomSpacing,
            stickyElement: stickyElement,
            currentTop: null,
            stickyWrapper: stickyWrapper,
            className: o.className,
            getWidthFrom: o.getWidthFrom,
            responsiveWidth: o.responsiveWidth
          });
        });
      },
      update: scroller,
      unstick: function(options) {
        return this.each(function() {
          var unstickyElement = $(this);

          var removeIdx = -1;
          for (var i = 0; i < sticked.length; i++)
          {
            if (sticked[i].stickyElement.get(0) == unstickyElement.get(0))
            {
                removeIdx = i;
            }
          }
          if(removeIdx != -1)
          {
            sticked.splice(removeIdx,1);
            unstickyElement.unwrap();
            unstickyElement.removeAttr('style');
          }
        });
      }
    };

  // should be more efficient than using $window.scroll(scroller) and $window.resize(resizer):
  if (window.addEventListener) {
    window.addEventListener('scroll', scroller, false);
    window.addEventListener('resize', resizer, false);
  } else if (window.attachEvent) {
    window.attachEvent('onscroll', scroller);
    window.attachEvent('onresize', resizer);
  }

  $.fn.sticky = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }
  };

  $.fn.unstick = function(method) {
    if (methods[method]) {
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    } else if (typeof method === 'object' || !method ) {
      return methods.unstick.apply( this, arguments );
    } else {
      $.error('Method ' + method + ' does not exist on jQuery.sticky');
    }

  };
  $(function() {
    setTimeout(scroller, 0);
  });
})(jQuery);

/*
     _ _      _       _
 ___| (_) ___| | __  (_)___
/ __| | |/ __| |/ /  | / __|
\__ \ | | (__|   < _ | \__ \
|___/_|_|\___|_|\_(_)/ |___/
                   |__/

 Version: 1.4.1
  Author: Ken Wheeler
 Website: http://kenwheeler.github.io
    Docs: http://kenwheeler.github.io/slick
    Repo: http://github.com/kenwheeler/slick
  Issues: http://github.com/kenwheeler/slick/issues

 */

!function(a){"use strict";"function"==typeof define&&define.amd?define(["jquery"],a):"undefined"!=typeof exports?module.exports=a(require("jquery")):a(jQuery)}(function(a){"use strict";var b=window.Slick||{};b=function(){function c(c,d){var f,g,h,e=this;if(e.defaults={accessibility:!0,adaptiveHeight:!1,appendArrows:a(c),appendDots:a(c),arrows:!0,asNavFor:null,prevArrow:'<button type="button" data-role="none" class="slick-prev">Previous</button>',nextArrow:'<button type="button" data-role="none" class="slick-next">Next</button>',autoplay:!1,autoplaySpeed:3e3,centerMode:!1,centerPadding:"50px",cssEase:"ease",customPaging:function(a,b){return'<button type="button" data-role="none">'+(b+1)+"</button>"},dots:!1,dotsClass:"slick-dots",draggable:!0,easing:"linear",edgeFriction:.35,fade:!1,focusOnSelect:!1,infinite:!0,initialSlide:0,lazyLoad:"ondemand",mobileFirst:!1,pauseOnHover:!0,pauseOnDotsHover:!1,respondTo:"window",responsive:null,rtl:!1,slide:"",slidesToShow:1,slidesToScroll:1,speed:500,swipe:!0,swipeToSlide:!1,touchMove:!0,touchThreshold:5,useCSS:!0,variableWidth:!1,vertical:!1,waitForAnimate:!0},e.initials={animating:!1,dragging:!1,autoPlayTimer:null,currentDirection:0,currentLeft:null,currentSlide:0,direction:1,$dots:null,listWidth:null,listHeight:null,loadIndex:0,$nextArrow:null,$prevArrow:null,slideCount:null,slideWidth:null,$slideTrack:null,$slides:null,sliding:!1,slideOffset:0,swipeLeft:null,$list:null,touchObject:{},transformsEnabled:!1},a.extend(e,e.initials),e.activeBreakpoint=null,e.animType=null,e.animProp=null,e.breakpoints=[],e.breakpointSettings=[],e.cssTransitions=!1,e.hidden="hidden",e.paused=!1,e.positionProp=null,e.respondTo=null,e.shouldClick=!0,e.$slider=a(c),e.$slidesCache=null,e.transformType=null,e.transitionType=null,e.visibilityChange="visibilitychange",e.windowWidth=0,e.windowTimer=null,f=a(c).data("slick")||{},e.options=a.extend({},e.defaults,f,d),e.currentSlide=e.options.initialSlide,e.originalSettings=e.options,g=e.options.responsive||null,g&&g.length>-1){e.respondTo=e.options.respondTo||"window";for(h in g)g.hasOwnProperty(h)&&(e.breakpoints.push(g[h].breakpoint),e.breakpointSettings[g[h].breakpoint]=g[h].settings);e.breakpoints.sort(function(a,b){return e.options.mobileFirst===!0?a-b:b-a})}"undefined"!=typeof document.mozHidden?(e.hidden="mozHidden",e.visibilityChange="mozvisibilitychange"):"undefined"!=typeof document.msHidden?(e.hidden="msHidden",e.visibilityChange="msvisibilitychange"):"undefined"!=typeof document.webkitHidden&&(e.hidden="webkitHidden",e.visibilityChange="webkitvisibilitychange"),e.autoPlay=a.proxy(e.autoPlay,e),e.autoPlayClear=a.proxy(e.autoPlayClear,e),e.changeSlide=a.proxy(e.changeSlide,e),e.clickHandler=a.proxy(e.clickHandler,e),e.selectHandler=a.proxy(e.selectHandler,e),e.setPosition=a.proxy(e.setPosition,e),e.swipeHandler=a.proxy(e.swipeHandler,e),e.dragHandler=a.proxy(e.dragHandler,e),e.keyHandler=a.proxy(e.keyHandler,e),e.autoPlayIterator=a.proxy(e.autoPlayIterator,e),e.instanceUid=b++,e.htmlExpr=/^(?:\s*(<[\w\W]+>)[^>]*)$/,e.init(),e.checkResponsive(!0)}var b=0;return c}(),b.prototype.addSlide=b.prototype.slickAdd=function(b,c,d){var e=this;if("boolean"==typeof c)d=c,c=null;else if(0>c||c>=e.slideCount)return!1;e.unload(),"number"==typeof c?0===c&&0===e.$slides.length?a(b).appendTo(e.$slideTrack):d?a(b).insertBefore(e.$slides.eq(c)):a(b).insertAfter(e.$slides.eq(c)):d===!0?a(b).prependTo(e.$slideTrack):a(b).appendTo(e.$slideTrack),e.$slides=e.$slideTrack.children(this.options.slide),e.$slideTrack.children(this.options.slide).detach(),e.$slideTrack.append(e.$slides),e.$slides.each(function(b,c){a(c).attr("data-slick-index",b)}),e.$slidesCache=e.$slides,e.reinit()},b.prototype.animateHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.animate({height:b},a.options.speed)}},b.prototype.animateSlide=function(b,c){var d={},e=this;e.animateHeight(),e.options.rtl===!0&&e.options.vertical===!1&&(b=-b),e.transformsEnabled===!1?e.options.vertical===!1?e.$slideTrack.animate({left:b},e.options.speed,e.options.easing,c):e.$slideTrack.animate({top:b},e.options.speed,e.options.easing,c):e.cssTransitions===!1?(e.options.rtl===!0&&(e.currentLeft=-e.currentLeft),a({animStart:e.currentLeft}).animate({animStart:b},{duration:e.options.speed,easing:e.options.easing,step:function(a){a=Math.ceil(a),e.options.vertical===!1?(d[e.animType]="translate("+a+"px, 0px)",e.$slideTrack.css(d)):(d[e.animType]="translate(0px,"+a+"px)",e.$slideTrack.css(d))},complete:function(){c&&c.call()}})):(e.applyTransition(),b=Math.ceil(b),d[e.animType]=e.options.vertical===!1?"translate3d("+b+"px, 0px, 0px)":"translate3d(0px,"+b+"px, 0px)",e.$slideTrack.css(d),c&&setTimeout(function(){e.disableTransition(),c.call()},e.options.speed))},b.prototype.asNavFor=function(b){var c=this,d=null!==c.options.asNavFor?a(c.options.asNavFor).slick("getSlick"):null;null!==d&&d.slideHandler(b,!0)},b.prototype.applyTransition=function(a){var b=this,c={};c[b.transitionType]=b.options.fade===!1?b.transformType+" "+b.options.speed+"ms "+b.options.cssEase:"opacity "+b.options.speed+"ms "+b.options.cssEase,b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.autoPlay=function(){var a=this;a.autoPlayTimer&&clearInterval(a.autoPlayTimer),a.slideCount>a.options.slidesToShow&&a.paused!==!0&&(a.autoPlayTimer=setInterval(a.autoPlayIterator,a.options.autoplaySpeed))},b.prototype.autoPlayClear=function(){var a=this;a.autoPlayTimer&&clearInterval(a.autoPlayTimer)},b.prototype.autoPlayIterator=function(){var a=this;a.options.infinite===!1?1===a.direction?(a.currentSlide+1===a.slideCount-1&&(a.direction=0),a.slideHandler(a.currentSlide+a.options.slidesToScroll)):(0===a.currentSlide-1&&(a.direction=1),a.slideHandler(a.currentSlide-a.options.slidesToScroll)):a.slideHandler(a.currentSlide+a.options.slidesToScroll)},b.prototype.buildArrows=function(){var b=this;b.options.arrows===!0&&b.slideCount>b.options.slidesToShow&&(b.$prevArrow=a(b.options.prevArrow),b.$nextArrow=a(b.options.nextArrow),b.htmlExpr.test(b.options.prevArrow)&&b.$prevArrow.appendTo(b.options.appendArrows),b.htmlExpr.test(b.options.nextArrow)&&b.$nextArrow.appendTo(b.options.appendArrows),b.options.infinite!==!0&&b.$prevArrow.addClass("slick-disabled"))},b.prototype.buildDots=function(){var c,d,b=this;if(b.options.dots===!0&&b.slideCount>b.options.slidesToShow){for(d='<ul class="'+b.options.dotsClass+'">',c=0;c<=b.getDotCount();c+=1)d+="<li>"+b.options.customPaging.call(this,b,c)+"</li>";d+="</ul>",b.$dots=a(d).appendTo(b.options.appendDots),b.$dots.find("li").first().addClass("slick-active")}},b.prototype.buildOut=function(){var b=this;b.$slides=b.$slider.children(b.options.slide+":not(.slick-cloned)").addClass("slick-slide"),b.slideCount=b.$slides.length,b.$slides.each(function(b,c){a(c).attr("data-slick-index",b)}),b.$slidesCache=b.$slides,b.$slider.addClass("slick-slider"),b.$slideTrack=0===b.slideCount?a('<div class="slick-track"/>').appendTo(b.$slider):b.$slides.wrapAll('<div class="slick-track"/>').parent(),b.$list=b.$slideTrack.wrap('<div class="slick-list"/>').parent(),b.$slideTrack.css("opacity",0),(b.options.centerMode===!0||b.options.swipeToSlide===!0)&&(b.options.slidesToScroll=1),a("img[data-lazy]",b.$slider).not("[src]").addClass("slick-loading"),b.setupInfinite(),b.buildArrows(),b.buildDots(),b.updateDots(),b.options.accessibility===!0&&b.$list.prop("tabIndex",0),b.setSlideClasses("number"==typeof this.currentSlide?this.currentSlide:0),b.options.draggable===!0&&b.$list.addClass("draggable")},b.prototype.checkResponsive=function(b){var d,e,f,c=this,g=c.$slider.width(),h=window.innerWidth||a(window).width();if("window"===c.respondTo?f=h:"slider"===c.respondTo?f=g:"min"===c.respondTo&&(f=Math.min(h,g)),c.originalSettings.responsive&&c.originalSettings.responsive.length>-1&&null!==c.originalSettings.responsive){e=null;for(d in c.breakpoints)c.breakpoints.hasOwnProperty(d)&&(c.originalSettings.mobileFirst===!1?f<c.breakpoints[d]&&(e=c.breakpoints[d]):f>c.breakpoints[d]&&(e=c.breakpoints[d]));null!==e?null!==c.activeBreakpoint?e!==c.activeBreakpoint&&(c.activeBreakpoint=e,"unslick"===c.breakpointSettings[e]?c.unslick():(c.options=a.extend({},c.originalSettings,c.breakpointSettings[e]),b===!0&&(c.currentSlide=c.options.initialSlide),c.refresh())):(c.activeBreakpoint=e,"unslick"===c.breakpointSettings[e]?c.unslick():(c.options=a.extend({},c.originalSettings,c.breakpointSettings[e]),b===!0&&(c.currentSlide=c.options.initialSlide),c.refresh())):null!==c.activeBreakpoint&&(c.activeBreakpoint=null,c.options=c.originalSettings,b===!0&&(c.currentSlide=c.options.initialSlide),c.refresh())}},b.prototype.changeSlide=function(b,c){var f,g,h,d=this,e=a(b.target);switch(e.is("a")&&b.preventDefault(),h=0!==d.slideCount%d.options.slidesToScroll,f=h?0:(d.slideCount-d.currentSlide)%d.options.slidesToScroll,b.data.message){case"previous":g=0===f?d.options.slidesToScroll:d.options.slidesToShow-f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide-g,!1,c);break;case"next":g=0===f?d.options.slidesToScroll:f,d.slideCount>d.options.slidesToShow&&d.slideHandler(d.currentSlide+g,!1,c);break;case"index":var i=0===b.data.index?0:b.data.index||a(b.target).parent().index()*d.options.slidesToScroll;d.slideHandler(d.checkNavigable(i),!1,c);break;default:return}},b.prototype.checkNavigable=function(a){var c,d,b=this;if(c=b.getNavigableIndexes(),d=0,a>c[c.length-1])a=c[c.length-1];else for(var e in c){if(a<c[e]){a=d;break}d=c[e]}return a},b.prototype.clickHandler=function(a){var b=this;b.shouldClick===!1&&(a.stopImmediatePropagation(),a.stopPropagation(),a.preventDefault())},b.prototype.destroy=function(){var b=this;b.autoPlayClear(),b.touchObject={},a(".slick-cloned",b.$slider).remove(),b.$dots&&b.$dots.remove(),b.$prevArrow&&"object"!=typeof b.options.prevArrow&&b.$prevArrow.remove(),b.$nextArrow&&"object"!=typeof b.options.nextArrow&&b.$nextArrow.remove(),b.$slides.removeClass("slick-slide slick-active slick-center slick-visible").removeAttr("data-slick-index").css({position:"",left:"",top:"",zIndex:"",opacity:"",width:""}),b.$slider.removeClass("slick-slider"),b.$slider.removeClass("slick-initialized"),b.$list.off(".slick"),a(window).off(".slick-"+b.instanceUid),a(document).off(".slick-"+b.instanceUid),b.$slider.html(b.$slides)},b.prototype.disableTransition=function(a){var b=this,c={};c[b.transitionType]="",b.options.fade===!1?b.$slideTrack.css(c):b.$slides.eq(a).css(c)},b.prototype.fadeSlide=function(a,b){var c=this;c.cssTransitions===!1?(c.$slides.eq(a).css({zIndex:1e3}),c.$slides.eq(a).animate({opacity:1},c.options.speed,c.options.easing,b)):(c.applyTransition(a),c.$slides.eq(a).css({opacity:1,zIndex:1e3}),b&&setTimeout(function(){c.disableTransition(a),b.call()},c.options.speed))},b.prototype.filterSlides=b.prototype.slickFilter=function(a){var b=this;null!==a&&(b.unload(),b.$slideTrack.children(this.options.slide).detach(),b.$slidesCache.filter(a).appendTo(b.$slideTrack),b.reinit())},b.prototype.getCurrent=b.prototype.slickCurrentSlide=function(){var a=this;return a.currentSlide},b.prototype.getDotCount=function(){var a=this,b=0,c=0,d=0;if(a.options.infinite===!0)d=Math.ceil(a.slideCount/a.options.slidesToScroll);else if(a.options.centerMode===!0)d=a.slideCount;else for(;b<a.slideCount;)++d,b=c+a.options.slidesToShow,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;return d-1},b.prototype.getLeft=function(a){var c,d,f,b=this,e=0;return b.slideOffset=0,d=b.$slides.first().outerHeight(),b.options.infinite===!0?(b.slideCount>b.options.slidesToShow&&(b.slideOffset=-1*b.slideWidth*b.options.slidesToShow,e=-1*d*b.options.slidesToShow),0!==b.slideCount%b.options.slidesToScroll&&a+b.options.slidesToScroll>b.slideCount&&b.slideCount>b.options.slidesToShow&&(a>b.slideCount?(b.slideOffset=-1*(b.options.slidesToShow-(a-b.slideCount))*b.slideWidth,e=-1*(b.options.slidesToShow-(a-b.slideCount))*d):(b.slideOffset=-1*b.slideCount%b.options.slidesToScroll*b.slideWidth,e=-1*b.slideCount%b.options.slidesToScroll*d))):a+b.options.slidesToShow>b.slideCount&&(b.slideOffset=(a+b.options.slidesToShow-b.slideCount)*b.slideWidth,e=(a+b.options.slidesToShow-b.slideCount)*d),b.slideCount<=b.options.slidesToShow&&(b.slideOffset=0,e=0),b.options.centerMode===!0&&b.options.infinite===!0?b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)-b.slideWidth:b.options.centerMode===!0&&(b.slideOffset=0,b.slideOffset+=b.slideWidth*Math.floor(b.options.slidesToShow/2)),c=b.options.vertical===!1?-1*a*b.slideWidth+b.slideOffset:-1*a*d+e,b.options.variableWidth===!0&&(f=b.slideCount<=b.options.slidesToShow||b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow),c=f[0]?-1*f[0].offsetLeft:0,b.options.centerMode===!0&&(f=b.options.infinite===!1?b.$slideTrack.children(".slick-slide").eq(a):b.$slideTrack.children(".slick-slide").eq(a+b.options.slidesToShow+1),c=f[0]?-1*f[0].offsetLeft:0,c+=(b.$list.width()-f.outerWidth())/2)),c},b.prototype.getOption=b.prototype.slickGetOption=function(a){var b=this;return b.options[a]},b.prototype.getNavigableIndexes=function(){var e,a=this,b=0,c=0,d=[];for(a.options.infinite===!1?(e=a.slideCount-a.options.slidesToShow+1,a.options.centerMode===!0&&(e=a.slideCount)):(b=-1*a.slideCount,c=-1*a.slideCount,e=2*a.slideCount);e>b;)d.push(b),b=c+a.options.slidesToScroll,c+=a.options.slidesToScroll<=a.options.slidesToShow?a.options.slidesToScroll:a.options.slidesToShow;return d},b.prototype.getSlick=function(){return this},b.prototype.getSlideCount=function(){var c,d,e,b=this;return e=b.options.centerMode===!0?b.slideWidth*Math.floor(b.options.slidesToShow/2):0,b.options.swipeToSlide===!0?(b.$slideTrack.find(".slick-slide").each(function(c,f){return f.offsetLeft-e+a(f).outerWidth()/2>-1*b.swipeLeft?(d=f,!1):void 0}),c=Math.abs(a(d).attr("data-slick-index")-b.currentSlide)||1):b.options.slidesToScroll},b.prototype.goTo=b.prototype.slickGoTo=function(a,b){var c=this;c.changeSlide({data:{message:"index",index:parseInt(a)}},b)},b.prototype.init=function(){var b=this;a(b.$slider).hasClass("slick-initialized")||(a(b.$slider).addClass("slick-initialized"),b.buildOut(),b.setProps(),b.startLoad(),b.loadSlider(),b.initializeEvents(),b.updateArrows(),b.updateDots()),b.$slider.trigger("init",[b])},b.prototype.initArrowEvents=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.on("click.slick",{message:"previous"},a.changeSlide),a.$nextArrow.on("click.slick",{message:"next"},a.changeSlide))},b.prototype.initDotEvents=function(){var b=this;b.options.dots===!0&&b.slideCount>b.options.slidesToShow&&a("li",b.$dots).on("click.slick",{message:"index"},b.changeSlide),b.options.dots===!0&&b.options.pauseOnDotsHover===!0&&b.options.autoplay===!0&&a("li",b.$dots).on("mouseenter.slick",function(){b.paused=!0,b.autoPlayClear()}).on("mouseleave.slick",function(){b.paused=!1,b.autoPlay()})},b.prototype.initializeEvents=function(){var b=this;b.initArrowEvents(),b.initDotEvents(),b.$list.on("touchstart.slick mousedown.slick",{action:"start"},b.swipeHandler),b.$list.on("touchmove.slick mousemove.slick",{action:"move"},b.swipeHandler),b.$list.on("touchend.slick mouseup.slick",{action:"end"},b.swipeHandler),b.$list.on("touchcancel.slick mouseleave.slick",{action:"end"},b.swipeHandler),b.$list.on("click.slick",b.clickHandler),b.options.autoplay===!0&&(a(document).on(b.visibilityChange,function(){b.visibility()}),b.options.pauseOnHover===!0&&(b.$list.on("mouseenter.slick",function(){b.paused=!0,b.autoPlayClear()}),b.$list.on("mouseleave.slick",function(){b.paused=!1,b.autoPlay()}))),b.options.accessibility===!0&&b.$list.on("keydown.slick",b.keyHandler),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),a(window).on("orientationchange.slick.slick-"+b.instanceUid,function(){b.checkResponsive(),b.setPosition()}),a(window).on("resize.slick.slick-"+b.instanceUid,function(){a(window).width()!==b.windowWidth&&(clearTimeout(b.windowDelay),b.windowDelay=window.setTimeout(function(){b.windowWidth=a(window).width(),b.checkResponsive(),b.setPosition()},50))}),a("*[draggable!=true]",b.$slideTrack).on("dragstart",function(a){a.preventDefault()}),a(window).on("load.slick.slick-"+b.instanceUid,b.setPosition),a(document).on("ready.slick.slick-"+b.instanceUid,b.setPosition)},b.prototype.initUI=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.show(),a.$nextArrow.show()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.show(),a.options.autoplay===!0&&a.autoPlay()},b.prototype.keyHandler=function(a){var b=this;37===a.keyCode&&b.options.accessibility===!0?b.changeSlide({data:{message:"previous"}}):39===a.keyCode&&b.options.accessibility===!0&&b.changeSlide({data:{message:"next"}})},b.prototype.lazyLoad=function(){function g(b){a("img[data-lazy]",b).each(function(){var b=a(this),c=a(this).attr("data-lazy");b.load(function(){b.animate({opacity:1},200)}).css({opacity:0}).attr("src",c).removeAttr("data-lazy").removeClass("slick-loading")})}var c,d,e,f,b=this;b.options.centerMode===!0?b.options.infinite===!0?(e=b.currentSlide+(b.options.slidesToShow/2+1),f=e+b.options.slidesToShow+2):(e=Math.max(0,b.currentSlide-(b.options.slidesToShow/2+1)),f=2+(b.options.slidesToShow/2+1)+b.currentSlide):(e=b.options.infinite?b.options.slidesToShow+b.currentSlide:b.currentSlide,f=e+b.options.slidesToShow,b.options.fade===!0&&(e>0&&e--,f<=b.slideCount&&f++)),c=b.$slider.find(".slick-slide").slice(e,f),g(c),b.slideCount<=b.options.slidesToShow?(d=b.$slider.find(".slick-slide"),g(d)):b.currentSlide>=b.slideCount-b.options.slidesToShow?(d=b.$slider.find(".slick-cloned").slice(0,b.options.slidesToShow),g(d)):0===b.currentSlide&&(d=b.$slider.find(".slick-cloned").slice(-1*b.options.slidesToShow),g(d))},b.prototype.loadSlider=function(){var a=this;a.setPosition(),a.$slideTrack.css({opacity:1}),a.$slider.removeClass("slick-loading"),a.initUI(),"progressive"===a.options.lazyLoad&&a.progressiveLazyLoad()},b.prototype.next=b.prototype.slickNext=function(){var a=this;a.changeSlide({data:{message:"next"}})},b.prototype.pause=b.prototype.slickPause=function(){var a=this;a.autoPlayClear(),a.paused=!0},b.prototype.play=b.prototype.slickPlay=function(){var a=this;a.paused=!1,a.autoPlay()},b.prototype.postSlide=function(a){var b=this;b.$slider.trigger("afterChange",[b,a]),b.animating=!1,b.setPosition(),b.swipeLeft=null,b.options.autoplay===!0&&b.paused===!1&&b.autoPlay()},b.prototype.prev=b.prototype.slickPrev=function(){var a=this;a.changeSlide({data:{message:"previous"}})},b.prototype.progressiveLazyLoad=function(){var c,d,b=this;c=a("img[data-lazy]",b.$slider).length,c>0&&(d=a("img[data-lazy]",b.$slider).first(),d.attr("src",d.attr("data-lazy")).removeClass("slick-loading").load(function(){d.removeAttr("data-lazy"),b.progressiveLazyLoad()}).error(function(){d.removeAttr("data-lazy"),b.progressiveLazyLoad()}))},b.prototype.refresh=function(){var b=this,c=b.currentSlide;b.destroy(),a.extend(b,b.initials),b.init(),b.changeSlide({data:{message:"index",index:c}},!0)},b.prototype.reinit=function(){var b=this;b.$slides=b.$slideTrack.children(b.options.slide).addClass("slick-slide"),b.slideCount=b.$slides.length,b.currentSlide>=b.slideCount&&0!==b.currentSlide&&(b.currentSlide=b.currentSlide-b.options.slidesToScroll),b.slideCount<=b.options.slidesToShow&&(b.currentSlide=0),b.setProps(),b.setupInfinite(),b.buildArrows(),b.updateArrows(),b.initArrowEvents(),b.buildDots(),b.updateDots(),b.initDotEvents(),b.options.focusOnSelect===!0&&a(b.$slideTrack).children().on("click.slick",b.selectHandler),b.setSlideClasses(0),b.setPosition(),b.$slider.trigger("reInit",[b])},b.prototype.removeSlide=b.prototype.slickRemove=function(a,b,c){var d=this;return"boolean"==typeof a?(b=a,a=b===!0?0:d.slideCount-1):a=b===!0?--a:a,d.slideCount<1||0>a||a>d.slideCount-1?!1:(d.unload(),c===!0?d.$slideTrack.children().remove():d.$slideTrack.children(this.options.slide).eq(a).remove(),d.$slides=d.$slideTrack.children(this.options.slide),d.$slideTrack.children(this.options.slide).detach(),d.$slideTrack.append(d.$slides),d.$slidesCache=d.$slides,d.reinit(),void 0)},b.prototype.setCSS=function(a){var d,e,b=this,c={};b.options.rtl===!0&&(a=-a),d="left"==b.positionProp?Math.ceil(a)+"px":"0px",e="top"==b.positionProp?Math.ceil(a)+"px":"0px",c[b.positionProp]=a,b.transformsEnabled===!1?b.$slideTrack.css(c):(c={},b.cssTransitions===!1?(c[b.animType]="translate("+d+", "+e+")",b.$slideTrack.css(c)):(c[b.animType]="translate3d("+d+", "+e+", 0px)",b.$slideTrack.css(c)))},b.prototype.setDimensions=function(){var a=this;if(a.options.vertical===!1?a.options.centerMode===!0&&a.$list.css({padding:"0px "+a.options.centerPadding}):(a.$list.height(a.$slides.first().outerHeight(!0)*a.options.slidesToShow),a.options.centerMode===!0&&a.$list.css({padding:a.options.centerPadding+" 0px"})),a.listWidth=a.$list.width(),a.listHeight=a.$list.height(),a.options.vertical===!1&&a.options.variableWidth===!1)a.slideWidth=Math.ceil(a.listWidth/a.options.slidesToShow),a.$slideTrack.width(Math.ceil(a.slideWidth*a.$slideTrack.children(".slick-slide").length));else if(a.options.variableWidth===!0){var b=0;a.slideWidth=Math.ceil(a.listWidth/a.options.slidesToShow),a.$slideTrack.children(".slick-slide").each(function(){b+=a.listWidth}),a.$slideTrack.width(Math.ceil(b)+1)}else a.slideWidth=Math.ceil(a.listWidth),a.$slideTrack.height(Math.ceil(a.$slides.first().outerHeight(!0)*a.$slideTrack.children(".slick-slide").length));var c=a.$slides.first().outerWidth(!0)-a.$slides.first().width();a.options.variableWidth===!1&&a.$slideTrack.children(".slick-slide").width(a.slideWidth-c)},b.prototype.setFade=function(){var c,b=this;b.$slides.each(function(d,e){c=-1*b.slideWidth*d,b.options.rtl===!0?a(e).css({position:"relative",right:c,top:0,zIndex:800,opacity:0}):a(e).css({position:"relative",left:c,top:0,zIndex:800,opacity:0})}),b.$slides.eq(b.currentSlide).css({zIndex:900,opacity:1})},b.prototype.setHeight=function(){var a=this;if(1===a.options.slidesToShow&&a.options.adaptiveHeight===!0&&a.options.vertical===!1){var b=a.$slides.eq(a.currentSlide).outerHeight(!0);a.$list.css("height",b)}},b.prototype.setOption=b.prototype.slickSetOption=function(a,b,c){var d=this;d.options[a]=b,c===!0&&(d.unload(),d.reinit())},b.prototype.setPosition=function(){var a=this;a.setDimensions(),a.setHeight(),a.options.fade===!1?a.setCSS(a.getLeft(a.currentSlide)):a.setFade(),a.$slider.trigger("setPosition",[a])},b.prototype.setProps=function(){var a=this,b=document.body.style;a.positionProp=a.options.vertical===!0?"top":"left","top"===a.positionProp?a.$slider.addClass("slick-vertical"):a.$slider.removeClass("slick-vertical"),(void 0!==b.WebkitTransition||void 0!==b.MozTransition||void 0!==b.msTransition)&&a.options.useCSS===!0&&(a.cssTransitions=!0),void 0!==b.OTransform&&(a.animType="OTransform",a.transformType="-o-transform",a.transitionType="OTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.MozTransform&&(a.animType="MozTransform",a.transformType="-moz-transform",a.transitionType="MozTransition",void 0===b.perspectiveProperty&&void 0===b.MozPerspective&&(a.animType=!1)),void 0!==b.webkitTransform&&(a.animType="webkitTransform",a.transformType="-webkit-transform",a.transitionType="webkitTransition",void 0===b.perspectiveProperty&&void 0===b.webkitPerspective&&(a.animType=!1)),void 0!==b.msTransform&&(a.animType="msTransform",a.transformType="-ms-transform",a.transitionType="msTransition",void 0===b.msTransform&&(a.animType=!1)),void 0!==b.transform&&a.animType!==!1&&(a.animType="transform",a.transformType="transform",a.transitionType="transition"),a.transformsEnabled=null!==a.animType&&a.animType!==!1},b.prototype.setSlideClasses=function(a){var c,d,e,f,b=this;b.$slider.find(".slick-slide").removeClass("slick-active").removeClass("slick-center"),d=b.$slider.find(".slick-slide"),b.options.centerMode===!0?(c=Math.floor(b.options.slidesToShow/2),b.options.infinite===!0&&(a>=c&&a<=b.slideCount-1-c?b.$slides.slice(a-c,a+c+1).addClass("slick-active"):(e=b.options.slidesToShow+a,d.slice(e-c+1,e+c+2).addClass("slick-active")),0===a?d.eq(d.length-1-b.options.slidesToShow).addClass("slick-center"):a===b.slideCount-1&&d.eq(b.options.slidesToShow).addClass("slick-center")),b.$slides.eq(a).addClass("slick-center")):a>=0&&a<=b.slideCount-b.options.slidesToShow?b.$slides.slice(a,a+b.options.slidesToShow).addClass("slick-active"):d.length<=b.options.slidesToShow?d.addClass("slick-active"):(f=b.slideCount%b.options.slidesToShow,e=b.options.infinite===!0?b.options.slidesToShow+a:a,b.options.slidesToShow==b.options.slidesToScroll&&b.slideCount-a<b.options.slidesToShow?d.slice(e-(b.options.slidesToShow-f),e+f).addClass("slick-active"):d.slice(e,e+b.options.slidesToShow).addClass("slick-active")),"ondemand"===b.options.lazyLoad&&b.lazyLoad()},b.prototype.setupInfinite=function(){var c,d,e,b=this;if(b.options.fade===!0&&(b.options.centerMode=!1),b.options.infinite===!0&&b.options.fade===!1&&(d=null,b.slideCount>b.options.slidesToShow)){for(e=b.options.centerMode===!0?b.options.slidesToShow+1:b.options.slidesToShow,c=b.slideCount;c>b.slideCount-e;c-=1)d=c-1,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d-b.slideCount).prependTo(b.$slideTrack).addClass("slick-cloned");for(c=0;e>c;c+=1)d=c,a(b.$slides[d]).clone(!0).attr("id","").attr("data-slick-index",d+b.slideCount).appendTo(b.$slideTrack).addClass("slick-cloned");b.$slideTrack.find(".slick-cloned").find("[id]").each(function(){a(this).attr("id","")})}},b.prototype.selectHandler=function(b){var c=this,d=parseInt(a(b.target).parents(".slick-slide").attr("data-slick-index"));return d||(d=0),c.slideCount<=c.options.slidesToShow?(c.$slider.find(".slick-slide").removeClass("slick-active"),c.$slides.eq(d).addClass("slick-active"),c.options.centerMode===!0&&(c.$slider.find(".slick-slide").removeClass("slick-center"),c.$slides.eq(d).addClass("slick-center")),c.asNavFor(d),void 0):(c.slideHandler(d),void 0)},b.prototype.slideHandler=function(a,b,c){var d,e,f,g,h=null,i=this;return b=b||!1,i.animating===!0&&i.options.waitForAnimate===!0||i.options.fade===!0&&i.currentSlide===a||i.slideCount<=i.options.slidesToShow?void 0:(b===!1&&i.asNavFor(a),d=a,h=i.getLeft(d),g=i.getLeft(i.currentSlide),i.currentLeft=null===i.swipeLeft?g:i.swipeLeft,i.options.infinite===!1&&i.options.centerMode===!1&&(0>a||a>i.getDotCount()*i.options.slidesToScroll)?(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d)),void 0):i.options.infinite===!1&&i.options.centerMode===!0&&(0>a||a>i.slideCount-i.options.slidesToScroll)?(i.options.fade===!1&&(d=i.currentSlide,c!==!0?i.animateSlide(g,function(){i.postSlide(d)}):i.postSlide(d)),void 0):(i.options.autoplay===!0&&clearInterval(i.autoPlayTimer),e=0>d?0!==i.slideCount%i.options.slidesToScroll?i.slideCount-i.slideCount%i.options.slidesToScroll:i.slideCount+d:d>=i.slideCount?0!==i.slideCount%i.options.slidesToScroll?0:d-i.slideCount:d,i.animating=!0,i.$slider.trigger("beforeChange",[i,i.currentSlide,e]),f=i.currentSlide,i.currentSlide=e,i.setSlideClasses(i.currentSlide),i.updateDots(),i.updateArrows(),i.options.fade===!0?(c!==!0?i.fadeSlide(e,function(){i.postSlide(e)}):i.postSlide(e),i.animateHeight(),void 0):(c!==!0?i.animateSlide(h,function(){i.postSlide(e)}):i.postSlide(e),void 0)))},b.prototype.startLoad=function(){var a=this;a.options.arrows===!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.hide(),a.$nextArrow.hide()),a.options.dots===!0&&a.slideCount>a.options.slidesToShow&&a.$dots.hide(),a.$slider.addClass("slick-loading")},b.prototype.swipeDirection=function(){var a,b,c,d,e=this;return a=e.touchObject.startX-e.touchObject.curX,b=e.touchObject.startY-e.touchObject.curY,c=Math.atan2(b,a),d=Math.round(180*c/Math.PI),0>d&&(d=360-Math.abs(d)),45>=d&&d>=0?e.options.rtl===!1?"left":"right":360>=d&&d>=315?e.options.rtl===!1?"left":"right":d>=135&&225>=d?e.options.rtl===!1?"right":"left":"vertical"},b.prototype.swipeEnd=function(){var c,b=this;if(b.dragging=!1,b.shouldClick=b.touchObject.swipeLength>10?!1:!0,void 0===b.touchObject.curX)return!1;if(b.touchObject.edgeHit===!0&&b.$slider.trigger("edge",[b,b.swipeDirection()]),b.touchObject.swipeLength>=b.touchObject.minSwipe)switch(b.swipeDirection()){case"left":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide+b.getSlideCount()):b.currentSlide+b.getSlideCount(),b.slideHandler(c),b.currentDirection=0,b.touchObject={},b.$slider.trigger("swipe",[b,"left"]);break;case"right":c=b.options.swipeToSlide?b.checkNavigable(b.currentSlide-b.getSlideCount()):b.currentSlide-b.getSlideCount(),b.slideHandler(c),b.currentDirection=1,b.touchObject={},b.$slider.trigger("swipe",[b,"right"])}else b.touchObject.startX!==b.touchObject.curX&&(b.slideHandler(b.currentSlide),b.touchObject={})},b.prototype.swipeHandler=function(a){var b=this;if(!(b.options.swipe===!1||"ontouchend"in document&&b.options.swipe===!1||b.options.draggable===!1&&-1!==a.type.indexOf("mouse")))switch(b.touchObject.fingerCount=a.originalEvent&&void 0!==a.originalEvent.touches?a.originalEvent.touches.length:1,b.touchObject.minSwipe=b.listWidth/b.options.touchThreshold,a.data.action){case"start":b.swipeStart(a);break;case"move":b.swipeMove(a);break;case"end":b.swipeEnd(a)}},b.prototype.swipeMove=function(a){var d,e,f,g,h,b=this;return h=void 0!==a.originalEvent?a.originalEvent.touches:null,!b.dragging||h&&1!==h.length?!1:(d=b.getLeft(b.currentSlide),b.touchObject.curX=void 0!==h?h[0].pageX:a.clientX,b.touchObject.curY=void 0!==h?h[0].pageY:a.clientY,b.touchObject.swipeLength=Math.round(Math.sqrt(Math.pow(b.touchObject.curX-b.touchObject.startX,2))),e=b.swipeDirection(),"vertical"!==e?(void 0!==a.originalEvent&&b.touchObject.swipeLength>4&&a.preventDefault(),g=(b.options.rtl===!1?1:-1)*(b.touchObject.curX>b.touchObject.startX?1:-1),f=b.touchObject.swipeLength,b.touchObject.edgeHit=!1,b.options.infinite===!1&&(0===b.currentSlide&&"right"===e||b.currentSlide>=b.getDotCount()&&"left"===e)&&(f=b.touchObject.swipeLength*b.options.edgeFriction,b.touchObject.edgeHit=!0),b.swipeLeft=b.options.vertical===!1?d+f*g:d+f*(b.$list.height()/b.listWidth)*g,b.options.fade===!0||b.options.touchMove===!1?!1:b.animating===!0?(b.swipeLeft=null,!1):(b.setCSS(b.swipeLeft),void 0)):void 0)},b.prototype.swipeStart=function(a){var c,b=this;return 1!==b.touchObject.fingerCount||b.slideCount<=b.options.slidesToShow?(b.touchObject={},!1):(void 0!==a.originalEvent&&void 0!==a.originalEvent.touches&&(c=a.originalEvent.touches[0]),b.touchObject.startX=b.touchObject.curX=void 0!==c?c.pageX:a.clientX,b.touchObject.startY=b.touchObject.curY=void 0!==c?c.pageY:a.clientY,b.dragging=!0,void 0)},b.prototype.unfilterSlides=b.prototype.slickUnfilter=function(){var a=this;null!==a.$slidesCache&&(a.unload(),a.$slideTrack.children(this.options.slide).detach(),a.$slidesCache.appendTo(a.$slideTrack),a.reinit())},b.prototype.unload=function(){var b=this;a(".slick-cloned",b.$slider).remove(),b.$dots&&b.$dots.remove(),b.$prevArrow&&"object"!=typeof b.options.prevArrow&&b.$prevArrow.remove(),b.$nextArrow&&"object"!=typeof b.options.nextArrow&&b.$nextArrow.remove(),b.$slides.removeClass("slick-slide slick-active slick-visible").css("width","")},b.prototype.unslick=function(){var a=this;a.destroy()},b.prototype.updateArrows=function(){var b,a=this;b=Math.floor(a.options.slidesToShow/2),a.options.arrows===!0&&a.options.infinite!==!0&&a.slideCount>a.options.slidesToShow&&(a.$prevArrow.removeClass("slick-disabled"),a.$nextArrow.removeClass("slick-disabled"),0===a.currentSlide?(a.$prevArrow.addClass("slick-disabled"),a.$nextArrow.removeClass("slick-disabled")):a.currentSlide>=a.slideCount-a.options.slidesToShow&&a.options.centerMode===!1?(a.$nextArrow.addClass("slick-disabled"),a.$prevArrow.removeClass("slick-disabled")):a.currentSlide>=a.slideCount-1&&a.options.centerMode===!0&&(a.$nextArrow.addClass("slick-disabled"),a.$prevArrow.removeClass("slick-disabled")))
},b.prototype.updateDots=function(){var a=this;null!==a.$dots&&(a.$dots.find("li").removeClass("slick-active"),a.$dots.find("li").eq(Math.floor(a.currentSlide/a.options.slidesToScroll)).addClass("slick-active"))},b.prototype.visibility=function(){var a=this;document[a.hidden]?(a.paused=!0,a.autoPlayClear()):(a.paused=!1,a.autoPlay())},a.fn.slick=function(){var g,a=this,c=arguments[0],d=Array.prototype.slice.call(arguments,1),e=a.length,f=0;for(f;e>f;f++)if("object"==typeof c||"undefined"==typeof c?a[f].slick=new b(a[f],c):g=a[f].slick[c].apply(a[f].slick,d),"undefined"!=typeof g)return g;return a},a(function(){a("[data-slick]").slick()})});
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

(function() {
  var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  window.requestAnimationFrame = requestAnimationFrame;
})();

$( window ).resize(function() {
  ParticleCanvas.width = ($(window).width() - 20);
  ParticleCanvas.height = ($(window).height() - 10);
});

window.onload = function() {

      var ParticleCanvas = document.getElementById("ParticleCanvas");
      var context = ParticleCanvas.getContext("2d");
      ParticleCanvas.width = ($(window).width() - 20);
      ParticleCanvas.height = ($(window).height() - 10);
      document.body.appendChild(ParticleCanvas);
      //var para = document.createElement("P");                       // Create a <p> element
      //var t = document.createTextNode("This is a paragraph");
        // Create a text node
    //  para.appendChild(t);
    // para.innerHTML = "test";                                         // Append the text to <p>
    //  ParticleCanvas.appendChild(para);
    //  para.style.color = "red" ;
      // All the info stored into an array for the particles
      var particles = {},
          particleIndex = 0,
          settings = {
            density: 30,
            particleSize: 2.5,
            //particleSize: 3,
            //startingX: ParticleCanvas.width / 2,
            startingX: ParticleCanvas.width/4 ,
            startingY: ParticleCanvas.height,
            gravity: -0.02
          };

      // Set up a function to create multiple particles
      function Particle() {
              // Establish starting positions and velocities from the settings array, the math random introduces the particles being pointed out from a random x coordinate
        this.x = settings.startingX * (Math.random() * 10);
        this.y = settings.startingY;

        // Determine original X-axis speed based on setting limitation
        this.vx = (Math.random() * 2 / 3) - (Math.random() * 3 / 3);
        this.vy = -(Math.random() * 5 / 3);

        // Add new particle to the index
        // Object used as it's simpler to manage that an array
        particleIndex ++;
        particles[particleIndex] = this;
        this.id = particleIndex;
        this.life = 0;
        this.maxLife = 200;
        this.alpha = 1;
        this.red = 255;
        this.green = 255;
        this.blue = 255;
      }

      // Some prototype methods for the particle's "draw" function
      Particle.prototype.draw = function() {
        this.x += this.vx;
        this.y += this.vy;

        // Adjust for gravity
        this.vy += settings.gravity;



        // Age the particle
        this.life++;

        this.red += 2;

        this.alpha -= 0.005;


        // If Particle is old, it goes in the chamber for renewal
        if (this.life >= this.maxLife) {
          delete particles[this.id];
        }



        // Create the shapes
        context.clearRect(settings.leftWall, settings.groundLevel, ParticleCanvas.width, ParticleCanvas.height);
        context.beginPath();
        context.fillStyle="rgba("+ this.red +", "+ this.green +", "+ this.blue +", " + this.alpha + ")";
        // Draws a circle of radius 20 at the coordinates 100,100 on the ParticleCanvas
        context.arc(this.x, this.y, settings.particleSize, 0, Math.PI*2, true);
        context.closePath();
        context.fill();

      }

      function animateDust() {
        context.clearRect(0, 0, ParticleCanvas.width, ParticleCanvas.height);

        // Draw the particles
        for (var i = 0; i < settings.density; i++) {
          if (Math.random() > 0.97) {
            // Introducing a random chance of creating a particle
            // corresponding to an chance of 1 per second,
            // per "density" value
            new Particle();
          }
        }

        for (var i in particles) {
          particles[i].draw();
        }
        window.requestAnimationFrame(animateDust);
    }

    animateDust();
};


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

/* Elfsight (c) elfsight.com */

!function e(t,o,n){function i(r,s){if(!o[r]){if(!t[r]){var l="function"==typeof require&&require;if(!s&&l)return l(r,!0);if(a)return a(r,!0);throw new Error("Cannot find module '"+r+"'")}var p=o[r]={exports:{}};t[r][0].call(p.exports,function(e){var o=t[r][1][e];return i(o?o:e)},p,p.exports,e,t,o,n)}return o[r].exports}for(var a="function"==typeof require&&require,r=0;r<n.length;r++)i(n[r]);return i}({1:[function(e,t,o){"use strict";var n=e("./jquery"),i=function(){};n.extend(i,{}),i.prototype=function(){},n.extend(i.prototype,{}),t.exports=i},{"./jquery":20}],2:[function(e,t,o){"use strict";var n=e("./jquery"),i=function(e){var t=this;t.gallery=e,t.enabled=!0,t.pause=!1,t.duration=null,t.hoverPause=null,t.timer=null,t.initialize()};i.prototype=function(){},n.extend(i.prototype,{initialize:function(){var e=this,t=parseInt(e.gallery.options.auto,10);t>0&&(e.enabled=!0,e.duration=parseInt(t,10),e.hoverPause=e.gallery.options.autoHoverPause,e.start(),e.watch())},start:function(){var e=this;e.enabled&&(e.pause=!1,e.rotate())},stop:function(){var e=this;e.enabled&&(clearInterval(e.timer),e.pause=!0)},rotate:function(){var e=this;e.timer=setTimeout(function(){e.enabled&&!e.pause&&e.gallery.hasNextView()&&e.gallery.moveToNextView().always(function(){e.rotate()})},e.duration)},watch:function(){var e=this;e.gallery.$root.on("mouseenter.instaShow",function(){e.hoverPause&&e.stop()}),e.gallery.$root.on("mouseleave.instaShow",function(){e.hoverPause&&e.start()})}}),t.exports=i},{"./jquery":20}],3:[function(e,t,o){"use strict";var n=e("./jquery"),i=e("./u"),a=e("./defaults"),r=e("./instapi"),s=e("./gallery"),l=e("./popup"),p=e("./views"),u=e("./lang"),c=function(e,t,o){var i=this;i.$element=e,i.$style=null,i.options=n.extend(!0,{},a,t),i.instapi=null,i.gallery=null,i.popup=null,i.lang=null,i.id=o,i.initialize()};n.extend(c,{VERSION:"2.0.5 June",TPL_OPTIONS_ALIASES:{tplError:"error",tplGalleryArrows:"gallery.arrows",tplGalleryCounter:"gallery.counter",tplGalleryCover:"gallery.cover",tplGalleryInfo:"gallery.info",tplGalleryLoader:"gallery.loader",tplGalleryMedia:"gallery.media",tplGalleryScroll:"gallery.scroll",tplGalleryView:"gallery.view",tplGalleryWrapper:"gallery.wrapper",tplPopupMedia:"popup.media",tplPopupRoot:"popup.root",tplPopupTwilight:"popup.twilight",tplStyle:"style"}}),c.prototype=function(){},n.extend(c.prototype,{initialize:function(){var e=this;e.instapi=new r(e,e.options,e.id);var t;if(t=e.instapi.isSandbox()?["@self"]:i.unifyMultipleOption(e.options.source),!t||!t.length)return void e.showError('Please set option "source". See details in docs.');var o={only:e.options.filterOnly?i.unifyMultipleOption(e.options.filterOnly):null,except:e.options.filterExcept?i.unifyMultipleOption(e.options.filterExcept):null};return e.mediaFetcher=e.instapi.createMediaFetcher(t,o,e.options.filter),e.mediaFetcher?(e.gallery=new s(e),e.popup=new l(e),e.lang=new u(e,e.options.lang),e.$style=n(p.style(n.extend({},e.options,{id:e.id}))),e.$style.insertBefore(e.$element),void(Handlebars&&Handlebars.compile&&n.each(c.TPL_OPTIONS_ALIASES,function(t,o){var a=e.options[t];if(a){var r=n('[data-is-tpl="'+a+'"]').html();r&&i.setProperty(p,o,Handlebars.compile(r))}}))):void e.showError('Option "source" is invalid. See details in docs.')},showError:function(e){var t=this;t.options.debug||n("#instaShowGallery_"+t.id).css("display","none");var o=n(p.error({message:e}));t.gallery?(t.gallery.puzzle(),o.appendTo(t.gallery.$root)):o.insertBefore(t.$element)}}),t.exports=c},{"./defaults":4,"./gallery":6,"./instapi":8,"./jquery":20,"./lang":21,"./popup":24,"./u":27,"./views":28}],4:[function(e,t,o){"use strict";t.exports={api:null,clientId:null,accessToken:null,debug:!1,source:null,filterOnly:null,filterExcept:null,filter:null,limit:0,width:"auto",height:"auto",columns:4,rows:2,gutter:0,responsive:null,loop:!0,arrowsControl:!0,scrollControl:!1,dragControl:!0,direction:"horizontal",freeMode:!1,scrollbar:!0,effect:"slide",speed:600,easing:"ease",auto:0,autoHoverPause:!0,popupSpeed:400,popupEasing:"ease",lang:"en",cacheMediaTime:0,mode:"popup",info:"likesCounter commentsCounter description",popupInfo:"username instagramLink likesCounter commentsCounter location passedTime description comments",popupDeepLinking:!1,popupHrImages:!1,colorGalleryBg:"rgba(0, 0, 0, 0)",colorGalleryCounters:"rgb(255, 255, 255)",colorGalleryDescription:"rgb(255, 255, 255)",colorGalleryOverlay:"rgba(33, 150, 243, 0.9)",colorGalleryArrows:"rgb(0, 142, 255)",colorGalleryArrowsHover:"rgb(37, 181, 255)",colorGalleryArrowsBg:"rgba(255, 255, 255, 0.9)",colorGalleryArrowsBgHover:"rgb(255, 255, 255)",colorGalleryScrollbar:"rgba(255, 255, 255, 0.5)",colorGalleryScrollbarSlider:"rgb(68, 68, 68)",colorPopupOverlay:"rgba(43, 43, 43, 0.9)",colorPopupBg:"rgb(255, 255, 255)",colorPopupUsername:"rgb(0, 142, 255)",colorPopupUsernameHover:"rgb(37, 181, 255)",colorPopupInstagramLink:"rgb(0, 142, 255)",colorPopupInstagramLinkHover:"rgb(37, 181, 255)",colorPopupCounters:"rgb(0, 0, 0)",colorPopupPassedTime:"rgb(152, 152, 152)",colorPopupAnchor:"rgb(0, 142, 255)",colorPopupAnchorHover:"rgb(37, 181, 255)",colorPopupText:"rgb(0, 0, 0)",colorPopupControls:"rgb(103, 103, 103)",colorPopupControlsHover:"rgb(255, 255, 255)",colorPopupMobileControls:"rgb(103, 103, 103)",colorPopupMobileControlsBg:"rgba(255, 255, 255, .8)",tplError:null,tplGalleryArrows:null,tplGalleryCounter:null,tplGalleryCover:null,tplGalleryInfo:null,tplGalleryLoader:null,tplGalleryMedia:null,tplGalleryScroll:null,tplGalleryView:null,tplGalleryWrapper:null,tplPopupMedia:null,tplPopupRoot:null,tplPopupTwilight:null,tplStyle:null}},{}],5:[function(e,t,o){"use strict";var n=e("./jquery"),i=(e("./instashow"),e("./core")),a=e("./api"),r=e("./defaults"),s=0,l=function(e,t){var o=new i(n(e),t,(++s));n.data(e,"instaShow",new a(o))};n.fn.instaShow=function(e){return this.each(function(t,o){var i=n.data(o,"instaShow");i||n.data(o,"instaShow",l(o,e))}),this},n.instaShow=function(e){n("[data-is]",e).each(function(e,t){var o=n(t),i={};n.each(r,function(e){var t="data-is-"+e.replace(/([A-Z])/g,function(e){return"-"+e.toLowerCase()}),a=o.attr(t);"undefined"!==n.type(a)&&""!==a&&("true"===a?a=!0:"false"===a&&(a=!1),i[e]=a)}),o.instaShow(n.extend(!1,{},r,i))})},n(function(){var e=window.onInstaShowReady;e&&"function"===n.type(e)&&e(),n(window).trigger("instaShowReady"),n.instaShow(window.document.body)})},{"./api":1,"./core":3,"./defaults":4,"./instashow":19,"./jquery":20}],6:[function(e,t,o){"use strict";var n=e("./jquery"),i=e("./u"),a=e("./views"),r=e("./grid"),s=e("./translations"),l=e("./move-control"),p=e("./scrollbar"),u=e("./loader"),c=e("./auto-rotator"),d=n(window),h=function(e){var t=this;t.core=e,t.options=e.options,t.translations=s,t.mediaList=[],t.classes={},t.storage={},t.infoTypes=null,t.grid=null,t.scrollbar=null,t.loader=null,t.autoRotator=null,t.breakpoints=[],t.prevBreakpoint=null,t.defaultBreakpoing=null,t.currentBreakpoint=null,t.limit=null,t.$mediaList=n(),t.$viewsList=n(),t.$root=e.$element,t.$wrapper=null,t.$container=null,t.busy=!1,t.drag=!1,t.activeViewId=-1,t.translationPrevProgress=0,t.progress=0,t.isTranslating=!1,t.viewsCastled=!1,t.initialize()};h.prototype=function(){},n.extend(h,{INFO_TYPES:["description","commentsCounter","likesCounter"]}),n.extend(h.prototype,{constructor:h,initialize:function(){var e=this;e.limit=Math.abs(parseInt(e.options.limit,10)),e.$wrapper=n(a.gallery.wrapper()),e.$container=e.$wrapper.children().first(),e.$root.append(e.$wrapper),e.defaultBreakpoing={columns:e.options.columns,rows:e.options.rows,gutter:e.options.gutter},e.options.responsive&&("string"===n.type(e.options.responsive)&&(e.options.responsive=JSON.parse(decodeURIComponent(e.options.responsive))),n.isPlainObject(e.options.responsive)&&(n.each(e.options.responsive,function(t,o){t=parseInt(t,10),e.breakpoints.push(n.extend(!1,{},o,{minWidth:t}))}),e.breakpoints=e.breakpoints.sort(function(e,t){return e.minWidth<t.minWidth?-1:e.minWidth>t.minWidth?1:0}))),e.grid=new r(e.$root,{width:e.options.width,height:e.options.height,columns:e.options.columns,rows:e.options.rows,gutter:e.options.gutter}),e.updateBreakpoint(),e.$root.width(e.options.width).height(e.options.height),e.scrollbar=new p(e),e.options.arrowsControl&&(e.$root.append(a.gallery.arrows()),e.$arrowPrevious=e.$root.find(".instashow-gallery-control-arrow-previous"),e.$arrowNext=e.$root.find(".instashow-gallery-control-arrow-next")),e.$root.attr("id","instaShowGallery_"+e.core.id),e.loader=new u(e.$root,n(a.gallery.loader())),e.defineClasses(),e.watch(),e.fit(),e.addView().done(function(t){e.setActiveView(t),e.$root.trigger("initialized.instaShow",[e.$root])}),e.autoRotator=new c(e)},getMediaIdByNativeId:function(e){var t=this,o=-1;return n.each(t.mediaList,function(t,n){o===-1&&n.id===e&&(o=t)}),o},setProgress:function(e){var t=this;t.progress=e,t.$root.trigger("progressChanged.instaShow",[e])},getProgressByOffset:function(e){var t=this;return e/t.getGlobalThreshold()},puzzle:function(){var e=this;e.busy=!0},free:function(){var e=this;e.busy=!1},isBusy:function(){var e=this;return e.busy},isHorizontal:function(){var e=this;return e.options.direction&&"horizontal"===e.options.direction.toLowerCase()},isFreeMode:function(){var e=this;return!!e.options.freeMode&&"slide"===e.options.effect},hasView:function(e){var t=this;return e>=0&&e<=t.$viewsList.length-1},hasNextView:function(){var e=this;return e.hasView(e.activeViewId+1)||(!e.limit||e.mediaList.length<e.limit)&&e.core.mediaFetcher.hasNext()},hasPreviousView:function(){var e=this;return e.hasView(e.activeViewId-1)},setActiveView:function(e,t){var o=this;if(o.hasView(e)&&(t||e!==o.activeViewId)){var n=o.$viewsList.eq(e);return o.$viewsList.removeClass("instashow-gallery-view-active instashow-gallery-view-active-prev instashow-gallery-view-active-next"),n.addClass("instashow-gallery-view-active"),n.prev().addClass("instashow-gallery-view-active-prev"),n.next().addClass("instashow-gallery-view-active-next"),o.activeViewId=e,o.$root.trigger("activeViewChanged.instaShow",[e,n]),!0}},defineClasses:function(){var e=this,t=e.$root.attr("class");t&&(t=t.split(" "),n.each(t,function(t,o){e.classes[o]=!0})),e.classes.instashow=!0,e.classes["instashow-gallery"]=!0,e.classes["instashow-gallery-horizontal"]=e.isHorizontal(),e.classes["instashow-gallery-vertical"]=!e.classes["instashow-gallery-horizontal"],e.classes["instashow-gallery-"+e.options.effect]=!0,e.updateClasses()},updateClasses:function(){var e=this,t=[];n.each(e.classes,function(e,o){o&&t.push(e)}),e.$root.attr("class",t.join(" "))},getInfoTypes:function(){var e,t=this;return t.infoTypes||(e=i.unifyMultipleOption(t.options.info),e&&(t.infoTypes=e.filter(function(e){return!!~t.constructor.INFO_TYPES.indexOf(e)}))),t.infoTypes},updateBreakpoint:function(e){var t,o=this,i=d.innerWidth();n.each(o.breakpoints,function(e,o){t||i<=o.minWidth&&(t=o)}),t||(t=o.defaultBreakpoing),t!==o.currentBreakpoint&&(o.prevBreakpoint=o.currentBreakpoint,o.currentBreakpoint=t,o.grid.columns=parseInt(o.currentBreakpoint.columns||o.defaultBreakpoing.columns,10),o.grid.rows=parseInt(o.currentBreakpoint.rows||o.defaultBreakpoing.rows,10),o.grid.gutter=parseInt(o.currentBreakpoint.gutter||o.defaultBreakpoing.gutter,10),e&&(o.grid.calculate(),o.rebuildViews(!0)))},fit:function(){var e=this;e.updateBreakpoint(!0),e.grid.calculate();e.grid.autoHeight&&e.$root.height(e.grid.height);var t=e.grid.cellSize/100*7;t>14&&(t=14),e.$wrapper.width(e.grid.width).height(e.grid.height),e.$viewsList.css({width:e.grid.viewWidth,height:e.grid.viewHeight,margin:e.grid.viewMoatVertical+"px "+e.grid.viewMoatHorizontal+"px",padding:e.grid.gutter/2}),e.$mediaList.css({width:e.grid.cellSize,height:e.grid.cellSize,padding:e.grid.gutter/2,fontSize:t}),"slide"===e.options.effect&&(e.isHorizontal()?e.$container.width(e.$viewsList.length*e.grid.width):e.$container.height(e.$viewsList.length*e.grid.height)),e.fitDescription(e.activeViewId),e.updateClasses()},rebuildViews:function(e){var t=this;t.$container.empty(),t.$viewsList=n();for(var o=t.grid.countCells(),i=Math.ceil(t.$mediaList.length/o),r=0;r<i;++r)(function(e){var o=n(a.gallery.view());e.removeClass("instashow-gallery-media-loaded"),e.appendTo(o),e.filter(function(e){return!!n('img[src!=""]',this).length}).addClass("instashow-gallery-media-loaded"),t.$viewsList=t.$viewsList.add(o.appendTo(t.$container))})(t.$mediaList.slice(r*o,(r+1)*o));t.fitImages(),e?(t.viewsRebuilded=!0,t.setProgress(0),t.setActiveView(0,!0),t.translate(0)):t.viewsRebuilded=!1},fitDescription:function(e){var t=this;if(t.hasView(e)){var o=t.$viewsList.eq(e),i=o.find(".instashow-gallery-media-info"),a=o.find(".instashow-gallery-media-info-description"),r=parseInt(a.css("line-height"));if(a.length){a.css("max-height",""),i.height(i.css("max-height"));var s=i.height()-a.position().top-parseFloat(a.css("margin-top")),l=Math.floor(s/r),p=(l-1)*r;i.height(""),a.each(function(e,t){var o=n(t);o.height()>p&&(o.css({maxHeight:p}),o.parent().addClass("instashow-gallery-media-info-cropped"))})}}},fitImages:function(e){var t=this;e=e||t.$viewsList;var o=e.find("img");o.each(function(e,o){var i=n(o),a=i.closest(".instashow-gallery-media"),r=a.attr("data-is-media-id"),s=t.storage["instaShow#"+t.core.id+"_media#"+r];i.attr("src",t.grid.cellSize>210?s.images.standard_resolution.url:s.images.low_resolution.url),i.one("load",function(){a.addClass("instashow-gallery-media-loaded")})})},addView:function(e){var t=this;return e=e||n.Deferred(),t.core.mediaFetcher.hasNext()?(t.puzzle(),t.loader.show(400),t.core.mediaFetcher.fetch(t.grid.countCells()).done(function(o){if(t.free(),t.loader.hide(),!o||!o.length)return void e.reject();var i=n(a.gallery.view());n.each(o,function(e,o){if(!t.limit||t.mediaList.length!==t.limit){var r=n(a.gallery.media(o)),s=r.children().first();t.setMediaInfo(s,o)&&t.setMediaCover(s),r.attr("data-is-media-id",o.id),t.storage["instaShow#"+t.core.id+"_media#"+o.id]=o,r.addClass("instashow-gallery-media-"+o.getImageOrientation()),"video"===o.type&&r.addClass("instashow-gallery-media-video"),t.mediaList.push(o),t.$mediaList=t.$mediaList.add(r.appendTo(i))}}),t.$viewsList=t.$viewsList.add(i.appendTo(t.$container));var r=t.$viewsList.length-1;t.$root.trigger("viewAdded.instaShow",[r,i]),setTimeout(function(){e.resolve(r,i)})})):e.reject(),e.promise()},setMediaCover:function(e){var t=n(a.gallery.cover({type:"plain"}));t.prependTo(e)},setMediaInfo:function(e,t){var o=this,i=o.getInfoTypes();if(!i||!i.length)return!1;var r,s={options:{},info:{likesCount:t.getLikesCount(),commentsCount:t.getCommentsCount(),description:t.caption?t.caption.text:null}};if(n.each(i,function(e,t){s.options[t]=!0}),s.options.hasDescription=s.options.description&&t.caption,i.length>1||s.options.description){if(1===i.length&&!s.options.hasDescription)return!1;r=n("<div></div>"),r.html(a.gallery.info(s)),r=r.unwrap()}else{switch(i[0]){case"likesCounter":s.icon="like",s.value=s.info.likesCount;break;case"commentsCounter":s.icon="comment",s.value=s.info.commentsCount}r=n(a.gallery.counter(s))}return r.prependTo(e),!0},getViewStartProgress:function(e){var t=this,o=t.$viewsList.index(e);return~o?0===o?0:1/(t.$viewsList.length-1)*o:-1},getViewIdByProgress:function(e){var t=this,o=t.$viewsList.length-1;return e<=0?0:e>=1?o:Math.round(o*e)},getActiveView:function(){var e=this;return e.$viewsList.eq(e.activeViewId)},getGlobalThreshold:function(){var e=this;return(e.$viewsList.length-1)*e.getThreshold()},getThreshold:function(){var e=this;return e.isHorizontal()?e.grid.width:e.grid.height},translate:function(e,t,o,i){var a=this;t=!!t,o=o||1,i=i||n.Deferred();var r=a.options.effect?a.options.effect.toLowerCase():"sharp",s=a.translations[r]||a.translations.sharp;return s?(a.isTranslating=!0,s.call(a,e,t,o,i),i.done(function(){a.isTranslating=!1,a.$root.trigger("translationEnded.instaShow")}),i.promise()):void a.core.showError('Translating effect "'+r+'" is undefined.')},getAdjustedProgress:function(e,t){var o=this;if(0===t)return 0;var n,i;return"slide"===o.options.effect?(n=t*e*o.getThreshold(),i=n/o.getGlobalThreshold()):i=t*e/(o.$viewsList.length-1),i},moveToNextView:function(){var e=this,t=n.Deferred(),o=e.activeViewId+1;return e.isBusy()?t.reject():!e.hasView(o)&&e.hasNextView(o)?e.addView().done(function(){e.moveToView(o,t)}).fail(function(){t.reject()}):e.moveToView(o,t),t.always(function(){e.updateArrows()}),t.promise()},moveToPreviousView:function(){var e=this;return e.moveToView(e.activeViewId-1)},moveToView:function(e,t){var o,i=this,t=t||n.Deferred();return i.isBusy()||!i.hasView(e)?t.reject():(o=i.getViewStartProgress(i.$viewsList.eq(e)),i.puzzle(),i.translate(o,!0).done(function(){i.free(),t.resolve()}),i.setProgress(o),i.setActiveView(e)),t.promise()},watchScroll:function(){var e,t=this;t.$root.on("wheel",function(o){if(o=o.originalEvent||o,o.preventDefault(),o.stopPropagation(),!e&&!t.isBusy()){var n,i,a,r=o.wheelDelta/40||-(Math.abs(o.deltaX)>Math.abs(o.deltaY)?o.deltaX:o.deltaY),s=r>0?-1:1;if(1===s&&!t.hasView(t.activeViewId+1)&&t.hasNextView())return void t.addView().done(function(){t.isFreeMode()||t.moveToNextView()});if(t.isFreeMode())n=-r*t.getThreshold()*.02,i=t.progress+n/t.getGlobalThreshold(),t.setActiveView(t.getViewIdByProgress(i)),i=t.progress+n/t.getGlobalThreshold(),i>1?i=1:i<0&&(i=0),t.translate(i),t.setProgress(i);else{if(Math.abs(r)<.75)return;if(e=!0,a=1===s?t.activeViewId+1:t.activeViewId-1,!t.hasView(a))return void(e=!1);t.moveToView(a).done(function(){e=!1})}}})},castleViews:function(){var e=this;e.viewsCastled||(e.viewsCastled=!0,e.$root.on("translationEnded.instaShow.castleViews",function(){if(1===e.progress){e.$root.off("translationEnded.instaShow.castleViews");var t=e.$viewsList.last().clone(),o=e.$viewsList.first().clone();n().add(t).add(o).addClass("instashow-gallery-view-diplicate"),e.$viewsList=n().add(t.prependTo(e.$container)).add(e.$viewsList).add(o.appendTo(e.$container));var i=e.getViewStartProgress(e.$viewsList.eq(e.activeViewId+1));e.setActiveView(e.activeViewId+1),e.setProgress(i),e.translate(i,!1),e.fitImages(t),e.fitImages(o),e.fit(),e.$root.on("translationEnded.instaShow.castleViews",function(){var t,o;if(0===e.progress)t=e.$viewsList.length-2;else{if(1!==e.progress)return;t=1}o=e.getViewStartProgress(e.$viewsList.eq(t)),e.setActiveView(t),e.setProgress(o),"fade"===e.core.options.effect&&e.$viewsList.css("opacity",0),e.translate(o,!1)})}}))},updateArrows:function(){var e=this;e.options.arrowsControl&&(e.$arrowNext.toggleClass("instashow-gallery-control-arrow-disabled",!e.viewsCastled&&!e.hasNextView()),e.$arrowPrevious.toggleClass("instashow-gallery-control-arrow-disabled",!e.viewsCastled&&!e.hasPreviousView()))},watch:function(){var e=this;e.$root.on("initialized.instaShow",function(){e.fit()}).on("activeViewChanged.instaShow",function(t,o){!e.core.options.loop||e.isFreeMode()||e.viewsCastled||!(e.limit&&e.mediaList.length>=e.limit)&&e.core.mediaFetcher.hasNext()||e.castleViews(),e.updateArrows()}).on("viewAdded.instaShow",function(t,o,n){1!==e.$viewsList.length&&e.$viewsList.length-1===o&&e.$viewsList.eq(o).addClass("instashow-gallery-view-active-next"),e.viewsRebuilded&&e.rebuildViews(),e.translationPrevProgress=e.getAdjustedProgress(o-1,e.translationPrevProgress);var i=e.getAdjustedProgress(o-1,e.progress);"slide"!==e.options.effect&&0!=o||e.translate(i,!1),e.setProgress(i),e.fit(),e.fitImages(n),e.fitDescription(o)}),d.resize(function(){e.fit(),e.fitImages(),e.translate(e.progress,!1)}),e.options.scrollControl&&e.watchScroll(),l(e).watch(),e.options.arrowsControl&&(e.$arrowPrevious.on("click touchend",function(){e.drag||e.moveToPreviousView()}),e.$arrowNext.on("click touchend",function(){e.drag||e.moveToNextView()})),"popup"===e.options.mode&&e.$root.on("click",".instashow-gallery-media",function(t){if(!e.drag){t.preventDefault(),t.stopPropagation();var o=n(this).attr("data-is-media-id"),i=e.storage["instaShow#"+e.core.id+"_media#"+o];e.core.popup.open(i)}})}}),t.exports=h},{"./auto-rotator":2,"./grid":7,"./jquery":20,"./loader":22,"./move-control":23,"./scrollbar":25,"./translations":26,"./u":27,"./views":28}],7:[function(e,t,o){"use strict";var n=e("./jquery"),i=function(e,t){var o=this;o.$element=e,o.options=t,o.width=null,o.height=null,o.columns=Math.floor(o.options.columns)||0,o.rows=Math.floor(o.options.rows)||0,o.gutter=Math.floor(o.options.gutter)||0,o.ratio=null,o.viewWidth=null,o.viewRatio=null,o.cellSize=null,o.viewMoatHorizontal=null,o.viewMoatVertical=null,o.initialize()};i.prototype=function(){},n.extend(i.prototype,{initialize:function(){var e=this;e.autoHeight=!e.options.height||"auto"===e.options.height},calculate:function(){var e=this;e.width=e.$element.width(),e.viewRatio=e.columns/e.rows,e.autoHeight?(e.height=e.width/e.viewRatio,e.ratio=e.viewRatio):(e.height=e.$element.height(),e.ratio=e.width/e.height),e.ratio>1?e.viewRatio<=1||e.viewRatio<e.ratio?(e.viewHeight=e.height,e.viewWidth=Math.floor(e.viewHeight*e.viewRatio)):(e.viewWidth=e.width,e.viewHeight=Math.floor(e.viewWidth/e.viewRatio)):e.viewRatio>=1||e.viewRatio>e.ratio?(e.viewWidth=e.width,e.viewHeight=Math.floor(e.viewWidth/e.viewRatio)):(e.viewHeight=e.height,e.viewWidth=Math.floor(e.viewHeight*e.viewRatio)),e.autoHeight?(e.cellSize=(e.viewWidth-e.gutter)/e.columns,e.height=e.viewHeight=e.cellSize*e.rows+e.gutter,e.viewWidth=e.cellSize*e.columns+e.gutter):(e.viewRatio>1?e.cellSize=(e.viewHeight-e.gutter)/e.rows:e.cellSize=(e.viewWidth-e.gutter)/e.columns,e.viewWidth=e.cellSize*e.columns+e.gutter,e.viewHeight=e.cellSize*e.rows+e.gutter),e.viewMoatHorizontal=(e.width-e.viewWidth)/2,e.viewMoatVertical=(e.height-e.viewHeight)/2},countCells:function(){var e=this;return e.columns*e.rows}}),t.exports=i},{"./jquery":20}],8:[function(e,t,o){"use strict";var n=e("./jquery"),i=e("./instapi/client"),a=e("./instapi/cache-provider"),r=e("./instapi/user-media-fetcher"),s=e("./instapi/tag-media-fetcher"),l=e("./instapi/complex-media-fetcher"),p=e("./instapi/specific-media-fetcher"),u=function(e,t,o){var n=this;n.core=e,n.options=t,n.id=o,n.client=null,n.cacheProvider=null,n.initialize()};n.extend(u,{SOURCE_DETERMINANTS:[{type:"user",regex:/^@([^$]+)$/,index:1},{type:"tag",regex:/^#([^$]+)$/,index:1},{type:"specific_media_id",regex:/^\$(\d+_\d+)$/,index:1},{type:"specific_media_shortcode",regex:/^\$([^$]+)$/i,index:1},{type:"user",regex:/^https?\:\/\/(www\.)?instagram.com\/([^\/]+)\/?(\?[^\$]+)?$/,index:2},{type:"tag",regex:/^https?\:\/\/(www\.)?instagram.com\/explore\/tags\/([^\/]+)\/?(\?[^\$]+)?$/,index:2},{type:"specific_media_shortcode",regex:/^https?\:\/\/(www\.)?instagram.com\/p\/([^\/]+)\/?(\?[^\$]+)?$/,index:2}],createScheme:function(e){var t=[];return"array"===n.type(e)&&e.length?(n.each(e,function(e,o){if("string"===n.type(o)){var i,a;n.each(u.SOURCE_DETERMINANTS,function(e,t){if(!i){var n=o.match(t.regex);n&&n[t.index]&&(i=t.type,a=n[t.index])}}),i&&("specific_media_shortcode"!==i&&(a=a.toLowerCase()),t.push({type:i,name:a}))}}),t):t},parseAnchors:function(e){return e=e.replace(/(https?\:\/\/[^$\s]+)/g,function(e){return'<a href="'+e+'" target="_blank" rel="nofollow">'+e+"</a>"}),e=e.replace(/(@|#)([^\s#@]+)/g,function(e,t,o){var n="";switch(t){case"@":n="https://instagram.com/"+o+"/";break;case"#":n="https://instagram.com/explore/tags/"+o+"/";break;default:return e}return'<a href="'+n+'" target="_blank" rel="nofollow">'+e+"</a>"})}}),u.prototype=function(){},n.extend(u.prototype,{initialize:function(){var e=this;e.cacheProvider=new a(e.id),e.client=new i(e,e.options,e.cacheProvider)},isSandbox:function(){var e=this;return!e.client.isAlternativeApi()&&e.options.accessToken&&!e.options.source},createMediaFetcher:function(e,t,o){var i=this;if("array"===n.type(e)&&e.length){"string"===n.type(o)&&"function"===n.type(window[o])&&(o=window[o]);var a=u.createScheme(e);if(a&&a.length){var c=[];t&&n.isPlainObject(t)&&n.each(t,function(e,t){if(t&&t.length){var o=u.createScheme(t);n.each(o,function(t,o){o.logic=e}),Array.prototype.push.apply(c,o)}});var d=[];return n.each(a,function(e,t){var n;switch(t.type){default:break;case"tag":n=new s(i.client,t.name,c,o);break;case"user":n=new r(i.client,t.name,c,o);break;case"specific_media_id":case"specific_media_shortcode":n=new p(i.client,t.type,t.name,c,o)}d.push(n)}),d.length>1?new l(d):d[0]}}}}),t.exports=u},{"./instapi/cache-provider":9,"./instapi/client":10,"./instapi/complex-media-fetcher":11,"./instapi/specific-media-fetcher":15,"./instapi/tag-media-fetcher":16,"./instapi/user-media-fetcher":17,"./jquery":20}],9:[function(e,t,o){"use strict";var n=e("../jquery"),i=function(e){var t=this;t.id=e,t.supports=!!window.localStorage};i.prototype=function(){},n.extend(i.prototype,{set:function(e,t,o){var n=this;if(!n.supports)return!1;try{return localStorage.setItem(e,JSON.stringify({cacheTime:t,expired:Date.now()/1e3+t,value:o})),!0}catch(i){return localStorage.clear(),!1}},get:function(e,t){var o=this;if(!o.supports)return!1;var n=localStorage.getItem(e);return n=n?JSON.parse(n):null,n&&t===n.cacheTime&&n.expired>Date.now()/1e3?n.value:(localStorage.removeItem(e),null)},has:function(e,t){var o=this;return!!o.get(e,t)}}),t.exports=i},{"../jquery":20}],10:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("../u"),a=function(e,t,o){var n=this;n.instapi=e,n.options=t,n.cacheProvider=o,n.authorized=!1,n.clientId=t.clientId,n.accessToken=t.accessToken,n.displayErrors=!0,n.lastErrorMessage=null,n.initialize()};n.extend(a,{API_URI:"https://api.instagram.com/v1"}),a.prototype=function(){},n.extend(a.prototype,{initialize:function(){var e=this;e.accessToken?e.authorized=!0:!e.clientId},getApiUrl:function(){var e=this;return e.options.api?e.options.api.replace(/\/+$/,"")+"/":a.API_URI},isAlternativeApi:function(){var e=this;return e.getApiUrl()!=a.API_URI},send:function(e,t,o,a){var r=this;t=t||{},o=o||{},a="undefined"===n.type(a)?0:parseInt(a,10)||0;var s=n.Deferred(),l=i.parseQuery(e);t=n.extend(!1,{},l,t),e=e.replace(r.getApiUrl(),"").replace(/\?.+$/,""),r.isAlternativeApi()||(r.accessToken&&(t.access_token=r.accessToken),r.clientId&&(t.client_id=r.clientId)),t.callback&&(t.callback=null);var p;return r.isAlternativeApi()?(t.path="/v1"+e.replace("/v1",""),p=r.getApiUrl()+"?"+n.param(t)):p=r.getApiUrl()+e+"?"+n.param(t),o=n.extend(!1,{},o,{url:p,dataType:"jsonp",type:o.type||"get"}),"get"===o.type&&a&&r.cacheProvider.has(p,a)?s.resolve(r.cacheProvider.get(p,a)):n.ajax(o).done(function(e){200!==e.meta.code?(r.lastErrorMessage=e.meta.error_message,r.displayErrors&&r.instapi.core.showError(e.meta.error_message),s.reject()):(r.cacheProvider.set(p,a,e),s.resolve(e))}),s.promise()},get:function(e,t,o,i){var a=this;return o=n.extend(!1,o,{type:"get"}),a.send(e,t,o,i)},setDisplayErrors:function(e){var t=this;t.displayErrors=!!e}}),t.exports=a},{"../jquery":20,"../u":27}],11:[function(e,t,o){"use strict";var n=e("../jquery"),i=function(e){var t=this;t.fetchers=e};i.prototype=function(){},n.extend(i.prototype,{fetch:function(e,t){var o=this;t=t||n.Deferred();var i,a=0,r=[],s=o.fetchers.length,l=function(){var o=[],a=[];n.each(r,function(e,t){Array.prototype.push.apply(o,t)}),n.each(o,function(e,t){var o=a.some(function(e){return e.id===t.id});o||a.push(t)}),a.sort(function(e,t){return t.created_time-e.created_time}),i=a.slice(0,e),n.each(a.slice(e).reverse(),function(e,t){t.fetcher.refund(t)}),t.resolve(i)},p=o.fetchers[0].client;return p.setDisplayErrors(!1),n.each(o.fetchers,function(t,n){var i=n.fetch(e);i.always(function(e){if("resolved"===i.state())r.push(e);else{if(s<2)return;o.fetchers=o.fetchers.filter(function(e,o){return t!==o})}++a==s&&(p.setDisplayErrors(!0),o.fetchers.length?l():p.instapi.core.showError(p.lastErrorMessage))})}),t.promise()},hasNext:function(){var e=this;return e.fetchers.some(function(e){return e.hasNext()})}}),t.exports=i},{"../jquery":20}],12:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("./media"),a=function(e,t,o,n){var i=this;i.client=e,i.sourceName=t,i.filters=o,i.postFilter=n,i.stack=[],i.hasNextMedia=!0,i.nextPaginationUri=null,i.basePath=null,i.initialize()};a.prototype=function(){},n.extend(a.prototype,{initialize:function(){},fetch:function(e,t){var o=this;t=t||n.Deferred();var i;return!o.hasNextMedia||e<=o.stack.length?(i=o.stack.slice(0,e),o.stack=o.stack.slice(e),t.resolve(o.processData(i))):o.load().done(function(i){var a=i.data;"array"!==n.type(a)&&(a=[a]),Array.prototype.push.apply(o.stack,a),o.fetch(e,t)}).fail(function(n){n===-1?t.reject():o.fetch(e,t)}),t.promise()},load:function(){var e,t,o=this,i=n.Deferred();return o.hasNextMedia?(t={count:33},e=o.nextPaginationUri?o.nextPaginationUri:o.basePath,o.client.get(e,t,null,o.client.instapi.core.options.cacheMediaTime).done(function(e){e.pagination&&e.pagination.next_url?(o.nextPaginationUri=e.pagination.next_url,o.hasNextMedia=!0):(o.nextPaginationUri=null,o.hasNextMedia=!1),e.data=o.filterData(e.data),i.resolve(e)}).fail(function(){i.reject(-1)})):i.reject(),i.promise()},processData:function(e){var t=this,o=[];return n.each(e,function(e,n){o.push(i.create(t.client,n,t))}),o},filterData:function(e){var t=this;return n.isArray(e)||(e=[e]),e.filter(function(e){var o=!0;return n.each(t.filters,function(t,n){if(o)switch(e.tags||(e.tags=[]),n.logic){case"only":"user"===n.type?o=e.user.username===n.name:"tag"===n.type?o=!!~e.tags.map(function(e){return e.toLowerCase?e.toLowerCase():e}).indexOf(n.name):"specific_media_shortcode"===n.type?o=!!~e.link.indexOf(n.name):"specific_media_id"===n.type&&(o=e.id===n.name);break;case"except":"user"===n.type?o=e.user.username!==n.name:"tag"===n.type?o=!~e.tags.map(function(e){return e.toLowerCase?e.toLowerCase():e}).indexOf(n.name):"specific_media_shortcode"===n.type?o=!~e.link.indexOf(n.name):"specific_media_id"===n.type&&(o=e.id!==n.name)}}),o&&"function"===n.type(t.postFilter)&&(o=!!t.postFilter(e)),o})},refund:function(e){var t=this;Array.prototype.unshift.call(t.stack,e.original)},hasNext:function(){var e=this;return e.stack.length||e.hasNextMedia}}),t.exports=a},{"../jquery":20,"./media":13}],13:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("./model"),a=e("../u"),r=function(e,t){var o=this;i.call(o,e,t)};n.extend(r,i,{findById:function(e,t,o){return o=o||n.Deferred(),e.get("/media/"+t).done(function(t){var n=r.create(e,t.data);o.resolve(n)}),o.promise()},findByCode:function(e,t,o){return o=o||n.Deferred(),e.get("/media/shortcode/"+t+"/").done(function(t){var n=r.create(e,t.data);o.resolve(n)}),o.promise()}}),n.extend(r.prototype,i.prototype,{constructor:r,getLikesCount:function(){var e=this;return a.formatNumber(e.likes.count)},getCommentsCount:function(){var e=this;return a.formatNumber(e.comments.count)},getImageOrientation:function(){var e=this,t=e.getImageRatio();return t>1?"album":t<1?"portrait":"square"},getImageRatio:function(){var e=this,t=e.images.standard_resolution.width,o=e.images.standard_resolution.height;return t/o}}),t.exports=r},{"../jquery":20,"../u":27,"./model":14}],14:[function(e,t,o){"use strict";var n=e("../jquery"),i=function(e,t){var o=this;o.fetcher=t,o.client=e};n.extend(i,{create:function(e,t,o){var n=new this(e,o);return n.fill(t),n}}),i.prototype=function(){},n.extend(i.prototype,{fill:function(e){var t=this;t.original=e,n.extend(t,e)}}),t.exports=i},{"../jquery":20}],15:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("./media-fetcher"),a=function(e,t,o,n,a){var r=this;r.idType=t,i.call(r,e,o,n,a)};n.extend(a,i),a.prototype=function(){},n.extend(a.prototype,i.prototype,{initialize:function(){var e=this;"specific_media_shortcode"===e.idType?e.basePath="/media/shortcode/"+e.sourceName+"/":"specific_media_id"===e.idType&&(e.basePath="/media/"+e.sourceName+"/")}}),t.exports=a},{"../jquery":20,"./media-fetcher":12}],16:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("./media-fetcher"),a=function(e,t,o,n){var a=this;i.call(a,e,t,o,n)};n.extend(a,i),a.prototype=function(){},n.extend(a.prototype,i.prototype,{initialize:function(){var e=this;e.basePath="/tags/"+e.sourceName+"/media/recent/";
}}),t.exports=a},{"../jquery":20,"./media-fetcher":12}],17:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("./media-fetcher"),a=e("./user"),r=function(e,t,o,n){var a=this;i.call(a,e,t,o,n),a.userId=null};n.extend(r,i),r.prototype=function(){},n.extend(r.prototype,i.prototype,{initialize:function(){},fetch:function(e,t){var o=this;t=t||n.Deferred();var r=n.Deferred();return o.userId?r.resolve():a.findId(o.client,o.sourceName).done(function(e){o.userId=e,o.basePath="/users/"+e+"/media/recent/",r.resolve()}).fail(function(){o.client.instapi.core.showError("Sorry, user <strong>@"+o.sourceName+"</strong> can`t be found.")}),r.done(function(){i.prototype.fetch.call(o,e,t)}),t.promise()}}),t.exports=r},{"../jquery":20,"./media-fetcher":12,"./user":18}],18:[function(e,t,o){"use strict";var n=e("../jquery"),i=e("./model"),a=function(e){var t=this;i.call(t,e)};n.extend(a,i,{constructor:a,findId:function(e,t){var o=n.Deferred();return e.isAlternativeApi()||e.instapi.isSandbox()?o.resolve(t):e.get("/users/search/",{q:t},null,604800).done(function(e){var i;n.each(e.data,function(e,o){i||o.username===t&&(i=o.id)}),i?o.resolve(i):o.reject()}),o.promise()}}),n.extend(a.prototype,i.prototype,{constructor:a}),t.exports=a},{"../jquery":20,"./model":14}],19:[function(e,t,o){"use strict";var n=e("./jquery"),i=function(){};i.prototype=function(){},n.extend(i.prototype,{}),t.exports=i},{"./jquery":20}],20:[function(e,t,o){"use strict";t.exports=window.jQuery},{}],21:[function(e,t,o){"use strict";var n=e("./jquery"),i={en:{},de:{"View in Instagram":"Folgen",w:"Wo.",d:"Tag",h:"Std.",m:"min",s:"Sek"},es:{"View in Instagram":"Seguir",w:"sem",d:"día",h:"h",m:"min",s:"s"},fr:{"View in Instagram":"S`abonner",w:"sem",d:"j",h:"h",m:"min",s:"s"},it:{"View in Instagram":"Segui",w:"sett.",d:"g",h:"h",m:"m",s:"s"},nl:{"View in Instagram":"Volgen",w:"w.",d:"d.",h:"u.",m:"m.",s:"s."},no:{"View in Instagram":"Følg",w:"u",d:"d",h:"t",m:"m",s:"s"},pl:{"View in Instagram":"Obserwuj",w:"w",d:"dzień",h:"godz.",m:"min",s:"s"},"pt-BR":{"View in Instagram":"Seguir",w:"sem",d:"d",h:"h",m:"min",s:"s"},sv:{"View in Instagram":"F?lj",w:"v",d:"d",h:"h",m:"min",s:"sek"},tr:{"View in Instagram":"Takip et",w:"h",d:"g",h:"s",m:"d",s:"sn"},ru:{"View in Instagram":"Посмотреть в Instagram",w:"нед.",d:"дн.",h:"ч",m:"мин",s:"с"},hi:{"View in Instagram":"फ़ॉलो करें",w:"सप्ताह",d:"दिन",h:"घंटे",m:"मिनट",s:"सेकंड"},ko:{"View in Instagram":"팔로우",w:"주",d:"일",h:"시간",m:"분",s:"초"},"zh-HK":{"View in Instagram":"天注",w:"周",d:"天",h:"小时",m:"分钟",s:"秒"},ja:{"View in Instagram":"フォローする",w:"週間前",d:"日前",h:"時間前",m:"分前",s:"秒前"}},a=function(e,t){var o=this;o.core=e,o.id=t,o.currentLib=null,o.initialize()};a.prototype=function(){},n.extend(a.prototype,{initialize:function(){var e=this;if(e.currentLib=i[e.id],!e.currentLib)return void e.core.showError('Sorry, language "'+e.id+'" is undefined. See details in docs.')},t:function(e){var t=this;return t.currentLib[e]||e}}),t.exports=a},{"./jquery":20}],22:[function(e,t,o){"use strict";var n=e("./jquery"),i=function(e,t){var o=this;o.$root=e,o.$element=t,o.timer=null,o.initialize()};i.prototype=function(){},n.extend(i.prototype,{initialize:function(){var e=this;e.$element.prependTo(e.$root)},show:function(e){var t=this;t.timer=setTimeout(function(){t.toggle(!0)},e)},hide:function(){var e=this;e.timer&&(clearTimeout(e.timer),e.timer=null),e.toggle(!1)},toggle:function(e){var t=this;t.$element.toggleClass("instashow-show",e)}}),t.exports=i},{"./jquery":20}],23:[function(e,t,o){"use strict";var n=e("./jquery"),i=n(window);t.exports=function(e){var t=!1,o=0,n=0,a=!1,r=function(e){return/^touch/.test(e.type)},s=function(i){var a=r(i);a||(i.preventDefault(),i.stopPropagation()),e.isBusy()||(t=!0,n=e.progress,o=a?e.isHorizontal()?i.originalEvent.touches[0].clientX:i.originalEvent.touches[0].clientY:e.isHorizontal()?i.originalEvent.clientX:i.originalEvent.clientY)},l=function(i){if(!t||e.isBusy())return void(t=!1);i.preventDefault(),i.stopPropagation(),p=r(i)?e.isHorizontal()?i.originalEvent.changedTouches[0].clientX:i.originalEvent.changedTouches[0].clientY:e.isHorizontal()?i.originalEvent.clientX:i.originalEvent.clientY;var s,l,p,u=e.hasView(e.activeViewId+1),c=e.hasView(e.activeViewId-1);!u&&!a&&p<o&&e.hasNextView()&&(e.addView(),a=!0),l=(o-p)/e.getGlobalThreshold(),s=n+l,l&&(e.drag=!0);var d=e.getViewIdByProgress(s);e.activeViewId!==d&&e.setActiveView(d),l=(o-p)/e.getGlobalThreshold(),s=n+l;var h=s>1&&!u||s<0&&!c?.2:1;e.setProgress(s),e.translate(s,!1,h)},p=function(o){if(t=!1,e.drag){a=!1,setTimeout(function(){e.drag=!1},0);var n,i,r=e.progress>1|0;if(e.puzzle(),e.progress<0||r)i=e.translate(r,!0),e.setProgress(r);else{if(e.isFreeMode())return void e.free();n=e.getViewStartProgress(e.getActiveView()),i=e.translate(n,!0),e.setProgress(n)}i.done(function(){e.free()})}};return{watch:function(){e.$root.on("viewAdded.instaShow",function(t,o){n=e.getAdjustedProgress(o-1,n)}),e.options.dragControl&&(e.$root.on("mousedown",s),i.on("mousemove",l),i.on("mouseup",p),e.$root.on("click",function(t){e.drag&&(t.preventDefault(),t.stopPropagation())})),(e.options.scrollControl||e.options.dragControl)&&(e.$root.on("touchstart",s),i.on("touchmove",l),i.on("touchend",p))}}}},{"./jquery":20}],24:[function(e,t,o){"use strict";var n=e("./jquery"),i=e("./views"),a=e("./u"),r=e("./instapi"),s=e("./instapi/media"),l=e("./instapi/specific-media-fetcher"),p=n(window),u=function(e){var t=this;t.core=e,t.options=t.core.options,t.showing=!1,t.$body=null,t.$root=null,t.$twilight=null,t.$wrapper=null,t.$container=null,t.$controlClose=null,t.$controlPrevious=null,t.$controlNext=null,t.$media=null,t.video=null,t.currentMedia=null,t.optionInfo=null,t.optionControl=null,t.initialize(),t.watch()};n.extend(u,{AVAILABLE_INFO:["username","instagramLink","passedTime","likesCounter","commentsCounter","description","comments","location"]}),u.prototype=function(){},n.extend(u.prototype,{initialize:function(){var e=this;e.optionInfo=a.unifyMultipleOption(e.options.popupInfo),e.moveDuration=parseInt(e.options.popupSpeed,10),e.easing=e.options.popupEasing,e.optionInfo&&(e.optionInfo=e.optionInfo.filter(function(e){return!!~u.AVAILABLE_INFO.indexOf(e)})),e.$body=n("body"),e.$root=n(i.popup.root()),e.$wrapper=e.$root.find(".instashow-popup-wrapper"),e.$container=e.$root.find(".instashow-popup-container"),e.$twilight=n(i.popup.twilight()),e.$controlClose=e.$container.find(".instashow-popup-control-close"),e.$controlNext=e.$container.find(".instashow-popup-control-arrow-next"),e.$controlPrevious=e.$container.find(".instashow-popup-control-arrow-previous"),e.$root.attr("id","instaShowPopup_"+e.core.id),e.$twilight.prependTo(e.$root),e.$root.appendTo(document.body)},open:function(e){var t=this;return!t.showing&&!t.busy&&(t.$body.css("overflow","hidden"),t.busy=!0,t.findMediaId(e).done(function(e){t.currentMedia=e,t.busy=!1,t.$root.trigger("popupMediaOpened.instaShow")}),t.$root.css("display",""),t.showMedia(e),t.showing=!0,t.core.options.popupDeepLinking&&(window.location.hash="#!is"+t.core.id+"/$"+e.code),void setTimeout(function(){t.$root.addClass("instashow-show")}))},close:function(){var e=this;e.showing=!1,e.$root.removeClass("instashow-show"),setTimeout(function(){e.$root.css("display","none")},500),e.$body.css("overflow",""),e.video&&e.video.pause(),e.core.options.popupDeepLinking&&(window.location.hash="!")},createMedia:function(e){var t=this;t.core.options.popupHrImages&&(e.images.standard_resolution.url=e.images.standard_resolution.url.replace("s640x640","s1080x1080"));var o=e.getCommentsCount(),s={media:e,options:{},info:{viewOnInstagram:t.core.lang.t("View in Instagram"),likesCount:e.getLikesCount(),commentsCount:o,description:e.caption?a.nl2br(r.parseAnchors(e.caption.text)):null,location:e.location?e.location.name:null,passedTime:a.pretifyDate(e.created_time,t.core.lang)}};t.optionInfo&&n.each(t.optionInfo,function(e,o){t.core.instapi.isSandbox()&&"comments"===o||(s.options[o]=!0)}),s.options.hasDescription=s.options.description&&e.caption,s.options.hasLocation=s.options.location&&e.location,s.options.hasComments=s.options.comments&&e.comments.data,s.options.hasProperties=s.options.hasLocation||s.options.likesCounter||s.options.commentsCounter,s.options.isVideo="video"===e.type,s.options.hasOrigin=s.options.username||s.options.instagramLink,s.options.hasMeta=s.options.hasProperties||s.options.passedTime,s.options.hasContent=s.options.hasDescription||s.options.hasComments,s.options.hasInfo=s.options.hasOrigin||s.options.hasMeta||s.options.hasContent;var p=n.extend(!0,[],e.comments.data||[]);p.map(function(e){return e.text=a.nl2br(r.parseAnchors(e.text)),e}),p&&(s.info.comments=i.popup.mediaComments({list:p}));var u=n(i.popup.media(s));s.options.isVideo&&(t.video=u.find("video").get(0),u.find(".instashow-popup-media-video").click(function(){u.toggleClass("instashow-playing",t.video.paused),t.video.paused?t.video.play():t.video.pause()})),u.addClass("instashow-popup-media-"+e.getImageOrientation());var c=new Image;c.src=e.images.standard_resolution.url,c.onload=function(){u.find(".instashow-popup-media-picture").addClass("instashow-popup-media-picture-loaded"),u.css("transition-duration","0s").toggleClass("instashow-popup-media-hr",c.width>=1080),u.width(),u.css("transition-duration",""),t.adjust()};var d,h;return t.core.instapi.client.isAlternativeApi()&&!p.length&&o&&u.hasClass("instashow-popup-media-has-comments")&&(d=u.find(".instashow-popup-media-info-content"),d.length||(d=n('<div class="instashow-popup-media-info-content"></div>'),d.appendTo(u.find(".instashow-popup-media-info"))),h=new l(t.core.instapi.client,"specific_media_shortcode",e.code,[]),t.core.instapi.client.setDisplayErrors(!1),h.fetch().done(function(o){var s=o[0];e.comments.data=s.comments.data;var l=n.extend(!0,[],e.comments.data||[]);l.map(function(e){return e.text=a.nl2br(r.parseAnchors(e.text)),e});var p=n(i.popup.mediaComments({list:l}));d.append(p),t.core.instapi.client.setDisplayErrors(!0)})),u},showMedia:function(e){var t=this;t.preloadImage(e.images.standard_resolution.url).done(function(){var o=t.createMedia(e);t.$media?t.$media.replaceWith(o):o.appendTo(t.$container),t.$media=o,t.adjust()})},moveToMedia:function(e,t,o){var i=this;o=o||n.Deferred(),e=parseInt(e,10)||0;var r,s,l=t?0:i.moveDuration||0,p=e>i.currentMedia,u=i.$media,c=i.getMedia(e);return i.isBusy()||!c?o.reject():(i.busy=!0,i.core.options.popupDeepLinking&&(window.location.hash="#!is"+i.core.id+"/$"+c.code),i.preloadImage(c.images.standard_resolution.url).done(function(){r=i.createMedia(c),s=n().add(u).add(r),r.toggleClass("instashow-popup-media-hr",u.hasClass("instashow-popup-media-hr")),s.css({transitionDuration:l+"ms",transitionTimingFunction:i.easing}),r.addClass("instashow-popup-media-appearing"),p?r.addClass("instashow-popup-media-next").appendTo(i.$container):r.addClass("instashow-popup-media-previous").prependTo(i.$container),s.width(),r.removeClass("instashow-popup-media-next instashow-popup-media-previous"),p?u.addClass("instashow-popup-media-previous"):u.addClass("instashow-popup-media-next"),i.$media=r,setTimeout(function(){u.detach(),s.removeClass("instashow-popup-media-appearing instashow-popup-media-next instashow-popup-media-previous").css({transitionDuration:"",transitionTimingFunction:""}),o.resolve()},l+(a.isMobileDevice()?300:0))})),o.done(function(){i.busy=!1,i.currentMedia=e,i.$root.trigger("popupMediaChanged.instaShow")}),o.promise()},preloadImage:function(e,t){t=t||n.Deferred();var o=new Image;return o.src=e,o.onload=function(){t.resolve()},t.promise()},followHash:function(){var e=this,t=window.location.hash,o=t.match(new RegExp("#!is"+e.core.id+"/\\$(.+)$"));if(!e.isBusy()&&o&&o[1]){var n=o[1];s.findByCode(e.core.instapi.client,n).done(function(t){e.open(t)})}},hasMedia:function(e){var t=this;return!!t.getMedia(e)},hasNextMedia:function(){var e=this;return e.hasMedia(e.currentMedia+1)||(!e.core.gallery.limit||e.core.gallery.mediaList.length<e.core.gallery.limit)&&e.core.mediaFetcher.hasNext()||e.core.options.loop},hasPreviousMedia:function(){var e=this;return e.hasMedia(e.currentMedia-1)||e.core.options.loop&&(e.core.gallery.limit&&e.core.gallery.mediaList.length>=e.core.gallery.limit||!e.core.mediaFetcher.hasNext())},moveToNextMedia:function(){var e=this,t=n.Deferred(),o=e.currentMedia+1;return e.getMedia(o)?e.moveToMedia(o,!1,t):(!e.core.gallery.limit||e.core.gallery.mediaList.length<e.core.gallery.limit)&&e.core.mediaFetcher.hasNext()?e.core.gallery.addView().done(function(){e.moveToMedia(o,!1,t)}):e.core.options.loop?e.moveToMedia(0,!1,t):t.reject(),t.promise()},moveToPreviousMedia:function(){var e=this,t=e.currentMedia-1;return!e.hasMedia(t)&&e.hasPreviousMedia()&&(t=e.core.gallery.mediaList.length-1),e.moveToMedia(t,!1)},findMediaId:function(e,t){var o=this;t=t||n.Deferred();var i=o.core.gallery.getMediaIdByNativeId(e.id);return~i?t.resolve(i):o.core.gallery.addView().done(function(){o.findMediaId(e,t)}).fail(function(){t.resolve(-1)}),t.promise()},getMedia:function(e){var t=this;return t.core.gallery.mediaList[e]||null},adjust:function(){var e=this;e.$media&&(e.$container.height(e.$media.height()),a.isMobileDevice()||setTimeout(function(){var t=p.height(),o=e.$media.innerHeight()+parseInt(e.$container.css("padding-top"),10)+parseInt(e.$container.css("padding-bottom"),10);e.$container.css("top",t<=o?0:t/2-o/2)}))},isBusy:function(){var e=this;return e.busy},watch:function(){var e=this;e.$wrapper.on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd",".instashow-popup-media, .instashow-popup-container",function(){setTimeout(function(){e.adjust()},17)}),p.resize(function(){e.adjust()}),e.$wrapper.click(function(t){t.target===e.$wrapper.get(0)&&e.close()}),e.$controlClose.click(function(t){t.preventDefault(),e.close()}),e.$controlNext.click(function(t){t.preventDefault(),e.moveToNextMedia()}),e.$controlPrevious.click(function(t){t.preventDefault(),e.moveToPreviousMedia()}),p.keydown(function(t){if(e.showing&&!e.isBusy())switch(t.which){case 39:e.moveToNextMedia();break;case 37:e.moveToPreviousMedia();break;case 27:e.close()}});var t,o,n;a.isTouchDevice()&&(e.$root.on("touchstart",function(n){e.isBusy()||(t=n.originalEvent.touches[0].clientX,o=n.originalEvent.touches[0].clientY)}),e.$root.on("touchend",function(o){if(!e.isBusy()){var i=o.originalEvent.changedTouches[0].clientX;n&&(i>t?e.moveToPreviousMedia():i<t&&e.moveToNextMedia())}}),e.$root.on("touchmove",function(i){if(!e.isBusy()){var a=i.originalEvent.changedTouches[0].clientX,r=i.originalEvent.changedTouches[0].clientY;n=Math.abs(o-r)<Math.abs(t-a),n&&(i.preventDefault(),i.stopPropagation())}})),p.on("hashchange",function(){e.followHash()}),e.core.gallery.$root.on("initialized.instaShow",function(){e.followHash()}),e.$root.on("popupMediaOpened.instaShow popupMediaChanged.instaShow",function(){e.$controlPrevious.toggleClass("instashow-disabled",!e.hasPreviousMedia()),e.$controlNext.toggleClass("instashow-disabled",!e.hasNextMedia())})}}),t.exports=u},{"./instapi":8,"./instapi/media":13,"./instapi/specific-media-fetcher":15,"./jquery":20,"./u":27,"./views":28}],25:[function(e,t,o){"use strict";var n=e("./jquery"),i=e("./views"),a=function(e){var t=this;t.gallery=e,t.initialize(),t.watch()};a.prototype=function(){},n.extend(a.prototype,{initialize:function(){var e=this;e.$element=n(i.gallery.scroll()),e.$slider=e.$element.children().first(),e.gallery.options.scrollbar&&e.$element.appendTo(e.gallery.$root)},fit:function(){var e=this,t=e.gallery.progress,o=e.gallery.$viewsList.length;e.gallery.viewsCastled&&(o-=2),t<0?t=0:t>1&&(t=1);var n=e.gallery.isHorizontal()?e.$element.width():e.$element.height(),i=n/o,a=(n-i)*t;if(i&&isFinite(i)){var r;r=e.gallery.isHorizontal()?{transform:"translate3d("+a+"px, 0, 0)",width:i}:{transform:"translate3d(0, "+a+"px, 0)",height:i},e.$slider.css(r)}},watch:function(){var e=this;e.gallery.$root.on("progressChanged.instaShow",function(){e.fit()})}}),t.exports=a},{"./jquery":20,"./views":28}],26:[function(e,t,o){"use strict";var n,i=e("./jquery");t.exports={slide:function(e,t,o,i){var a=this;o=o||1;var r=0,s="";t?(r=a.options.speed,s=a.options.easing,n=setTimeout(function(){a.$container.css({transitionDuration:"",transitionTimingFunction:""}),i.resolve()},r)):i.resolve(),a.$container.css({transitionDuration:r+"ms",transitionTimingFunction:s});var l,p,u=a.getGlobalThreshold();p=e<=1?-e*o*u:-u+(1-e)*o*u,l=a.isHorizontal()?"translate3d("+p+"px, 0, 0)":"translate3d(0, "+p+"px, 0)",a.$container.css("transform",l),a.translationPrevProgress=e},fade:function(e,t,o,a){var r=this;o=o||1,o*=.5;var s=0,l="";t?(s=r.options.speed,l=r.options.easing,n=setTimeout(function(){g.css({transitionDuration:"",transitionTimingFunction:""}),a.resolve()},s)):a.resolve();var p,u,c,d,h=r.getViewIdByProgress(e),f=r.$viewsList.eq(h),m=r.getViewStartProgress(f);e==m?(u=0,d=0,p=e>r.translationPrevProgress?r.$viewsList.eq(h-1):e<r.translationPrevProgress?r.$viewsList.eq(h+1):i()):(e>m?(u=1,p=r.$viewsList.eq(h+1),c=m+r.getThreshold()/r.getGlobalThreshold()/2):(u=-1,p=r.$viewsList.eq(h-1),c=m-r.getThreshold()/r.getGlobalThreshold()/2),d=(e-m)/(c-m)*o);var g=i().add(f).add(p);g.css({transitionDuration:s?s+"ms":"",transitionTimingFunction:l}),g.width(),f.css("opacity",1-d),p.css("opacity",d),r.translationPrevProgress=e}}},{"./jquery":20}],27:[function(e,t,o){"use strict";var n=e("./jquery");t.exports={MOBILE_DEVICE_REGEX:/android|webos|iphone|ipad|ipod|blackberry|windows\sphone/i,unifyMultipleOption:function(e){var t=n.type(e);return"array"===t?e:"string"===t?e.split(/[\s,;\|]+/).filter(function(e){return!!e}):[]},parseQuery:function(e){var t=e.match(/\?([^#]+)/);if(!t||!t[1])return null;var o={},n=function(e){var t=e.split("=");o[t[0]]=t[1]||""};return t[1].split("&").map(n),o},formatNumber:function(e,t){if(e=parseFloat(e),t=t||0,"number"!==n.type(e))return NaN;var o,i,a;return e>=1e6?(o=(e/1e6).toFixed(t),a="m"):e>=1e3?(o=(e/1e3).toFixed(t),a="k"):(o=e,a=""),i=parseInt(o,10),o-i===0&&(o=i),o+a},pretifyDate:function(e,t){var o,n,i=Math.round((new Date).getTime()/1e3),a=Math.abs(i-e);return a>=604800?(o=a/604800,n=t.t("w")):a>=86400?(o=a/86400,n=t.t("d")):a>=3600?(o=a/3600,n=t.t("h")):a>=60?(o=a/60,n=t.t("m")):(o=a,n=t.t("s")),o=Math.round(o),o+" "+n},isTouchDevice:function(){return"ontouchstart"in document.documentElement},isMobileDevice:function(){return this.MOBILE_DEVICE_REGEX.test(navigator.userAgent)},nl2br:function(e){return e.replace(/\n+/,"<br>")},getProperty:function(e,t,o){var i=this;if(e&&t&&"string"===n.type(t)){var a=e;return n.each(t.split("."),function(e,t){if(a=a[t],!a)return!1}),a&&o&&(a=i.applyModifier(a,o)),a}},setProperty:function(e,t,o){if(e&&t&&"string"===n.type(t)){var i=e,a=t.split(".");return n.each(a,function(e,t){e==a.length-1?i[t]=o:"undefined"===n.type(i[t])&&(i[t]={}),i=i[t]}),e}},applyModifier:function(e,t){return"array"!==n.type(t)&&(t=[t]),n.each(t,function(t,o){"function"===n.type(o)&&(e=o.call(o,e))}),e}}},{"./jquery":20}],28:[function(e,t,o){"use strict";var n={};n.error=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i,a;return'<div class="instashow instashow-error"><div class="instashow-error-panel"><div class="instashow-error-title">Unfortunately, an error occurred</div><div class="instashow-error-caption">'+(null!=(a=null!=(a=t.message||(null!=e?e.message:e))?a:t.helperMissing,i="function"==typeof a?a.call(e,{name:"message",hash:{},data:n}):a)?i:"")+"</div></div></div>"},useData:!0}),n.gallery=n.gallery||{},n.gallery.arrows=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow-gallery-control-arrow instashow-gallery-control-arrow-previous instashow-gallery-control-arrow-disabled"></div><div class="instashow-gallery-control-arrow instashow-gallery-control-arrow-next instashow-gallery-control-arrow-disabled"></div>'},useData:!0}),n.gallery.counter=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i,a=t.helperMissing,r="function",s=this.escapeExpression;return'<span class="instashow-gallery-media-counter"><span class="instashow-icon instashow-icon-'+s((i=null!=(i=t.icon||(null!=e?e.icon:e))?i:a,typeof i===r?i.call(e,{name:"icon",hash:{},data:n}):i))+'"></span> <em>'+s((i=null!=(i=t.value||(null!=e?e.value:e))?i:a,typeof i===r?i.call(e,{name:"value",hash:{},data:n}):i))+"</em></span>"},useData:!0}),n.gallery.cover=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<span class="instashow-gallery-media-cover"></span>'},useData:!0}),n.gallery.info=Handlebars.template({1:function(e,t,o,n){return" instashow-gallery-media-info-no-description"},3:function(e,t,o,n){var i;return'<span class="instashow-gallery-media-info-counter"><span class="instashow-icon instashow-icon-like"></span> <em>'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.likesCount:i,e))+"</em></span> "},5:function(e,t,o,n){var i;return'<span class="instashow-gallery-media-info-counter"><span class="instashow-icon instashow-icon-comment"></span> <em>'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.commentsCount:i,e))+"</em></span> "},7:function(e,t,o,n){var i;return' <span class="instashow-gallery-media-info-description">'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.description:i,e))+"</span> "},compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i;return' <span class="instashow-gallery-media-info'+(null!=(i=t.unless.call(e,null!=(i=null!=e?e.options:e)?i.description:i,{name:"unless",hash:{},fn:this.program(1,n,0),inverse:this.noop,data:n}))?i:"")+'">'+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.likesCounter:i,{name:"if",hash:{},fn:this.program(3,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.commentsCounter:i,{name:"if",hash:{},fn:this.program(5,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasDescription:i,{name:"if",hash:{},fn:this.program(7,n,0),inverse:this.noop,data:n}))?i:"")+"</span>"},useData:!0}),n.gallery.loader=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow-gallery-loader"><div class="instashow-spinner"></div></div>'},useData:!0}),n.gallery.media=Handlebars.template({1:function(e,t,o,n){var i;return this.escapeExpression(this.lambda(null!=(i=null!=e?e.caption:e)?i.text:i,e))},compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i,a;return'<div class="instashow-gallery-media"> <a class="instashow-gallery-media-link" href="'+this.escapeExpression((a=null!=(a=t.link||(null!=e?e.link:e))?a:t.helperMissing,"function"==typeof a?a.call(e,{name:"link",hash:{},data:n}):a))+'" target="_blank"><span class="instashow-gallery-media-image"><img src="" alt="'+(null!=(i=t["if"].call(e,null!=e?e.caption:e,{name:"if",hash:{},fn:this.program(1,n,0),inverse:this.noop,data:n}))?i:"")+'"/></span></a></div>'},useData:!0}),n.gallery.scroll=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow-gallery-control-scroll"><div class="instashow-gallery-control-scroll-slider"></div></div>'},useData:!0}),n.gallery.view=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow-gallery-view"></div>'},useData:!0}),n.gallery.wrapper=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow-gallery-wrapper"><div class="instashow-gallery-container"></div></div>'},useData:!0}),n.popup=n.popup||{},n.popup.media=Handlebars.template({1:function(e,t,o,n){return" instashow-popup-media-has-comments"},3:function(e,t,o,n){return" instashow-popup-media-video"},5:function(e,t,o,n){var i;return'<span class="instashow-popup-media-picture-loader"><span class="instashow-spinner"></span></span> <img src="'+this.escapeExpression(this.lambda(null!=(i=null!=(i=null!=(i=null!=e?e.media:e)?i.images:i)?i.standard_resolution:i)?i.url:i,e))+'" alt=""/> '},7:function(e,t,o,n){var i,a=this.lambda,r=this.escapeExpression;return'<video poster="'+r(a(null!=(i=null!=(i=null!=(i=null!=e?e.media:e)?i.images:i)?i.standard_resolution:i)?i.url:i,e))+'" src="'+r(a(null!=(i=null!=(i=null!=(i=null!=e?e.media:e)?i.videos:i)?i.standard_resolution:i)?i.url:i,e))+'" preload="false" loop webkit-playsinline></video>'},9:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info"> '+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasOrigin:i,{name:"if",hash:{},fn:this.program(10,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasMeta:i,{name:"if",hash:{},fn:this.program(15,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasContent:i,{name:"if",hash:{},fn:this.program(25,n,0),inverse:this.noop,data:n}))?i:"")+"</div> "},10:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info-origin"> '+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.username:i,{name:"if",hash:{},fn:this.program(11,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.instagramLink:i,{name:"if",hash:{},fn:this.program(13,n,0),inverse:this.noop,data:n}))?i:"")+"</div> "},11:function(e,t,o,n){var i,a=this.lambda,r=this.escapeExpression;return' <a href="https://instagram.com/'+r(a(null!=(i=null!=(i=null!=e?e.media:e)?i.user:i)?i.username:i,e))+'" target="_blank" rel="nofollow" class="instashow-popup-media-info-author"><span class="instashow-popup-media-info-author-picture"><img src="'+r(a(null!=(i=null!=(i=null!=e?e.media:e)?i.user:i)?i.profile_picture:i,e))+'" alt=""/></span> <span class="instashow-popup-media-info-author-name">'+r(a(null!=(i=null!=(i=null!=e?e.media:e)?i.user:i)?i.username:i,e))+"</span></a> "},13:function(e,t,o,n){var i,a=this.lambda,r=this.escapeExpression;return' <a href="'+r(a(null!=(i=null!=e?e.media:e)?i.link:i,e))+'" target="_blank" rel="nofollow" class="instashow-popup-media-info-original">'+r(a(null!=(i=null!=e?e.info:e)?i.viewOnInstagram:i,e))+"</a> "},15:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info-meta"> '+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasProperties:i,{name:"if",hash:{},fn:this.program(16,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.passedTime:i,{name:"if",hash:{},fn:this.program(23,n,0),inverse:this.noop,data:n}))?i:"")+"</div> "},16:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info-properties"> '+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.likesCounter:i,{name:"if",hash:{},fn:this.program(17,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.commentsCounter:i,{name:"if",hash:{},fn:this.program(19,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasLocation:i,{name:"if",hash:{},fn:this.program(21,n,0),inverse:this.noop,data:n}))?i:"")+"</div> "},17:function(e,t,o,n){var i;return'<span class="instashow-popup-media-info-properties-item"><span class="instashow-icon instashow-icon-like"></span> <em>'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.likesCount:i,e))+"</em></span> "},19:function(e,t,o,n){var i;return'<span class="instashow-popup-media-info-properties-item"><span class="instashow-icon instashow-icon-comment"></span> <em>'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.commentsCount:i,e))+"</em></span> "},21:function(e,t,o,n){var i;return'<span class="instashow-popup-media-info-properties-item-location instashow-popup-media-info-properties-item"><span class="instashow-icon instashow-icon-placemark"></span> <em>'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.location:i,e))+"</em></span> "},23:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info-passed-time">'+this.escapeExpression(this.lambda(null!=(i=null!=e?e.info:e)?i.passedTime:i,e))+"</div> "},25:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info-content"> '+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasDescription:i,{name:"if",hash:{},fn:this.program(26,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasComments:i,{name:"if",hash:{},fn:this.program(28,n,0),inverse:this.noop,data:n}))?i:"")+"</div> "},26:function(e,t,o,n){var i,a=this.lambda,r=this.escapeExpression;return'<div class="instashow-popup-media-info-description"><a href="https://instagram.com/'+r(a(null!=(i=null!=(i=null!=e?e.media:e)?i.user:i)?i.username:i,e))+'" target="_blank" rel="nofollow">'+r(a(null!=(i=null!=(i=null!=e?e.media:e)?i.user:i)?i.username:i,e))+"</a> "+(null!=(i=a(null!=(i=null!=e?e.info:e)?i.description:i,e))?i:"")+"</div> "},28:function(e,t,o,n){var i;return" "+(null!=(i=this.lambda(null!=(i=null!=e?e.info:e)?i.comments:i,e))?i:"")+" "},compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i;return'<div class="instashow-popup-media'+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.comments:i,{name:"if",hash:{},fn:this.program(1,n,0),inverse:this.noop,data:n}))?i:"")+'"><figure class="instashow-popup-media-picture'+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.isVideo:i,{name:"if",hash:{},fn:this.program(3,n,0),inverse:this.noop,data:n}))?i:"")+'"> '+(null!=(i=t.unless.call(e,null!=(i=null!=e?e.options:e)?i.isVideo:i,{name:"unless",hash:{},fn:this.program(5,n,0),inverse:this.noop,data:n}))?i:"")+" "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.isVideo:i,{name:"if",hash:{},fn:this.program(7,n,0),inverse:this.noop,data:n}))?i:"")+"</figure> "+(null!=(i=t["if"].call(e,null!=(i=null!=e?e.options:e)?i.hasInfo:i,{name:"if",hash:{},fn:this.program(9,n,0),inverse:this.noop,data:n}))?i:"")+"</div>"},useData:!0}),n.popup.mediaComments=Handlebars.template({1:function(e,t,o,n){var i,a,r=this.lambda,s=this.escapeExpression;return'<div class="instashow-popup-media-info-comments-item"> <a href="https://instagram.com/'+s(r(null!=(i=null!=e?e.from:e)?i.username:i,e))+'" target="blank" rel="nofollow">'+s(r(null!=(i=null!=e?e.from:e)?i.username:i,e))+"</a> "+(null!=(a=null!=(a=t.text||(null!=e?e.text:e))?a:t.helperMissing,i="function"==typeof a?a.call(e,{name:"text",hash:{},data:n}):a)?i:"")+"</div> "},compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i;return'<div class="instashow-popup-media-info-comments"> '+(null!=(i=t.each.call(e,null!=e?e.list:e,{name:"each",hash:{},fn:this.program(1,n,0),inverse:this.noop,data:n}))?i:"")+"</div>"},useData:!0}),n.popup.root=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow instashow-popup"><div class="instashow-popup-wrapper"><div class="instashow-popup-container"><div class="instashow-popup-control-close"></div><div class="instashow-popup-control-arrow instashow-popup-control-arrow-previous"><span></span></div><div class="instashow-popup-control-arrow instashow-popup-control-arrow-next"><span></span></div></div></div></div>'},useData:!0}),n.popup.twilight=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){return'<div class="instashow-popup-twilight"></div>'},useData:!0}),n.style=Handlebars.template({compiler:[6,">= 2.0.0-beta.1"],main:function(e,t,o,n){var i,a=t.helperMissing,r="function",s=this.escapeExpression;return'<style type="text/css">\n    #instaShowGallery_'+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" {\n        background: "+s((i=null!=(i=t.colorGalleryBg||(null!=e?e.colorGalleryBg:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryBg",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-media-counter,\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,
typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-media-info-counter {\n        color: "+s((i=null!=(i=t.colorGalleryCounters||(null!=e?e.colorGalleryCounters:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryCounters",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-media-info-description {\n        color: "+s((i=null!=(i=t.colorGalleryDescription||(null!=e?e.colorGalleryDescription:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryDescription",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-media-cover {\n        background: "+s((i=null!=(i=t.colorGalleryOverlay||(null!=e?e.colorGalleryOverlay:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryOverlay",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-scroll {\n        background: "+s((i=null!=(i=t.colorGalleryScrollbar||(null!=e?e.colorGalleryScrollbar:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryScrollbar",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-scroll-slider {\n        background: "+s((i=null!=(i=t.colorGalleryScrollbarSlider||(null!=e?e.colorGalleryScrollbarSlider:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryScrollbarSlider",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-arrow {\n        background: "+s((i=null!=(i=t.colorGalleryArrowsBg||(null!=e?e.colorGalleryArrowsBg:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryArrowsBg",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-arrow:hover {\n        background: "+s((i=null!=(i=t.colorGalleryArrowsBgHover||(null!=e?e.colorGalleryArrowsBgHover:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryArrowsBgHover",hash:{},data:n}):i))+";\n    }\n\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-arrow::before,\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-arrow::after {\n        background: "+s((i=null!=(i=t.colorGalleryArrows||(null!=e?e.colorGalleryArrows:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryArrows",hash:{},data:n}):i))+";\n    }\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-arrow:hover::before,\n    #instaShowGallery_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-gallery-control-arrow:hover::after {\n        background: "+s((i=null!=(i=t.colorGalleryArrowsHover||(null!=e?e.colorGalleryArrowsHover:e))?i:a,typeof i===r?i.call(e,{name:"colorGalleryArrowsHover",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-twilight {\n        background: "+s((i=null!=(i=t.colorPopupOverlay||(null!=e?e.colorPopupOverlay:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupOverlay",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media {\n        background: "+s((i=null!=(i=t.colorPopupBg||(null!=e?e.colorPopupBg:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupBg",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-author {\n        color: "+s((i=null!=(i=t.colorPopupUsername||(null!=e?e.colorPopupUsername:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupUsername",hash:{},data:n}):i))+";\n    }\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-author:hover {\n        color: "+s((i=null!=(i=t.colorPopupUsernameHover||(null!=e?e.colorPopupUsernameHover:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupUsernameHover",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" a.instashow-popup-media-info-original {\n        border-color: "+s((i=null!=(i=t.colorPopupInstagramLink||(null!=e?e.colorPopupInstagramLink:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupInstagramLink",hash:{},data:n}):i))+";\n        color: "+s((i=null!=(i=t.colorPopupInstagramLink||(null!=e?e.colorPopupInstagramLink:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupInstagramLink",hash:{},data:n}):i))+";\n    }\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" a.instashow-popup-media-info-original:hover {\n        border-color: "+s((i=null!=(i=t.colorPopupInstagramLinkHover||(null!=e?e.colorPopupInstagramLinkHover:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupInstagramLinkHover",hash:{},data:n}):i))+";\n        color: "+s((i=null!=(i=t.colorPopupInstagramLinkHover||(null!=e?e.colorPopupInstagramLinkHover:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupInstagramLinkHover",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-properties {\n        color: "+s((i=null!=(i=t.colorPopupCounters||(null!=e?e.colorPopupCounters:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupCounters",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-passed-time {\n        color: "+s((i=null!=(i=t.colorPopupPassedTime||(null!=e?e.colorPopupPassedTime:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupPassedTime",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-content {\n        color: "+s((i=null!=(i=t.colorPopupText||(null!=e?e.colorPopupText:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupText",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-content a {\n        color: "+s((i=null!=(i=t.colorPopupAnchor||(null!=e?e.colorPopupAnchor:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupAnchor",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-info-content a:hover {\n        color: "+s((i=null!=(i=t.colorPopupAnchorHover||(null!=e?e.colorPopupAnchorHover:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupAnchorHover",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow span::before,\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow span::after,\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close::before,\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close::after {\n        background: "+s((i=null!=(i=t.colorPopupControls||(null!=e?e.colorPopupControls:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupControls",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow:hover span::before,\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow:hover span::after,\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close:hover::before,\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close:hover::after {\n        background: "+s((i=null!=(i=t.colorPopupControlsHover||(null!=e?e.colorPopupControlsHover:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupControlsHover",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-video::before {\n        color: "+s((i=null!=(i=t.colorPopupControls||(null!=e?e.colorPopupControls:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupControls",hash:{},data:n}):i))+";\n    }\n\n    #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-video:hover::before {\n        color: "+s((i=null!=(i=t.colorPopupControlsHover||(null!=e?e.colorPopupControlsHover:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupControlsHover",hash:{},data:n}):i))+";\n    }\n\n    @media only screen and (max-width: 1024px) {\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close {\n            background: "+s((i=null!=(i=t.colorPopupMobileControlsBg||(null!=e?e.colorPopupMobileControlsBg:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupMobileControlsBg",hash:{},data:n}):i))+";\n        }\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow span::before,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow span::after,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close::before,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close::after,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow:hover span::before,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-arrow:hover span::after,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close:hover::before,\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-control-close:hover::after {\n            background: "+s((i=null!=(i=t.colorPopupMobileControls||(null!=e?e.colorPopupMobileControls:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupMobileControls",hash:{},data:n}):i))+";\n        }\n\n        #instaShowPopup_"+s((i=null!=(i=t.id||(null!=e?e.id:e))?i:a,typeof i===r?i.call(e,{name:"id",hash:{},data:n}):i))+" .instashow-popup-media-video::before {\n            color: "+s((i=null!=(i=t.colorPopupMobileControls||(null!=e?e.colorPopupMobileControls:e))?i:a,typeof i===r?i.call(e,{name:"colorPopupMobileControls",hash:{},data:n}):i))+";\n        }\n    }\n</style>"},useData:!0}),t.exports=n},{}]},{},[5]);
/*!
 * Lightbox v2.8.2
 * by Lokesh Dhakar
 *
 * More info:
 * http://lokeshdhakar.com/projects/lightbox2/
 *
 * Copyright 2007, 2015 Lokesh Dhakar
 * Released under the MIT license
 * https://github.com/lokesh/lightbox2/blob/master/LICENSE
 */



// Uses Node, AMD or browser globals to create a module.
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        // Node. Does not work with strict CommonJS, but
        // only CommonJS-like environments that support module.exports,
        // like Node.
        module.exports = factory(require('jquery'));
    } else {
        // Browser globals (root is window)
        root.lightbox = factory(root.jQuery);
    }
}(this, function ($) {

  function Lightbox(options) {
    this.album = [];
    this.currentImageIndex = void 0;
    this.init();

    // options
    this.options = $.extend({}, this.constructor.defaults);
    this.option(options);
  }

  // Descriptions of all options available on the demo site:
  // http://lokeshdhakar.com/projects/lightbox2/index.html#options
  Lightbox.defaults = {
    albumLabel: 'Image %1 of %2',
    alwaysShowNavOnTouchDevices: false,
    fadeDuration: 500,
    fitImagesInViewport: true,
    // maxWidth: 800,
    // maxHeight: 600,
    positionFromTop: 50,
    resizeDuration: 700,
    showImageNumberLabel: true,
    wrapAround: false,
    disableScrolling: false
  };

  Lightbox.prototype.option = function(options) {
    $.extend(this.options, options);
  };

  Lightbox.prototype.imageCountLabel = function(currentImageNum, totalImages) {
    return this.options.albumLabel.replace(/%1/g, currentImageNum).replace(/%2/g, totalImages);
  };

  Lightbox.prototype.init = function() {
    this.enable();
    this.build();
  };

  // Loop through anchors and areamaps looking for either data-lightbox attributes or rel attributes
  // that contain 'lightbox'. When these are clicked, start lightbox.
  Lightbox.prototype.enable = function() {
    var self = this;
    $('body').on('click', 'a[rel^=lightbox], area[rel^=lightbox], a[data-lightbox], area[data-lightbox]', function(event) {
      self.start($(event.currentTarget));


      return false;
    });
  };

  // Build html for the lightbox and the overlay.
  // Attach event handlers to the new DOM elements. click click click
  Lightbox.prototype.build = function() {
    var self = this;

    $('<div id="lightboxOverlay" class="lightboxOverlay"></div><div id="lightbox" class="lightbox"><div class="lb-outerContainer"><div class="lb-container"><img class="lb-image" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" /><div class="lb-nav"><a class="lb-prev" href="" ></a><a class="lb-next" href="" ></a></div><div class="lb-loader"><a class="lb-cancel"></a></div></div></div><div class="lb-dataContainer"><div class="lb-data"><div class="lb-details"><span class="lb-caption"></span><span class="lb-number"></span></div><div class="lb-closeContainer"><a class="lb-close"></a></div></div></div></div>').appendTo($('body'));

    // Cache jQuery objects
    this.$lightbox       = $('#lightbox');
    this.$overlay        = $('#lightboxOverlay');
    this.$outerContainer = this.$lightbox.find('.lb-outerContainer');
    this.$container      = this.$lightbox.find('.lb-container');

    // Store css values for future lookup
    this.containerTopPadding = parseInt(this.$container.css('padding-top'), 10);
    this.containerRightPadding = parseInt(this.$container.css('padding-right'), 10);
    this.containerBottomPadding = parseInt(this.$container.css('padding-bottom'), 10);
    this.containerLeftPadding = parseInt(this.$container.css('padding-left'), 10);

    // Attach event handlers to the newly minted DOM elements
    this.$overlay.hide().on('click', function() {
      self.end();
      return false;
    });

    this.$lightbox.hide().on('click', function(event) {
      if ($(event.target).attr('id') === 'lightbox') {
        self.end();
      }
      return false;
    });

    this.$outerContainer.on('click', function(event) {
      if ($(event.target).attr('id') === 'lightbox') {

        self.end();
      }
      return false;
    });

    this.$lightbox.find('.lb-prev').on('click', function() {
      if (self.currentImageIndex === 0) {
        self.changeImage(self.album.length - 1);
      } else {
        self.changeImage(self.currentImageIndex - 1);
      }
      return false;
    });

    this.$lightbox.find('.lb-next').on('click', function() {
      if (self.currentImageIndex === self.album.length - 1) {
        self.changeImage(0);
      } else {
        self.changeImage(self.currentImageIndex + 1);
      }
      return false;
    });

    this.$lightbox.find('.lb-loader, .lb-close').on('click', function() {

      self.end();
      return false;
    });
  };

  // Show overlay and lightbox. If the image is part of a set, add siblings to album array.
  Lightbox.prototype.start = function($link) {
    var self    = this;
    var $window = $(window);

    $window.on('resize', $.proxy(this.sizeOverlay, this));

    $('select, object, embed').css({
      visibility: 'hidden'
    });

    this.sizeOverlay();

    this.album = [];
    var imageNumber = 0;

    function addToAlbum($link) {
      self.album.push({
        link: $link.attr('href'),
        title: $link.attr('data-title') || $link.attr('title')
      });
    }

    // Support both data-lightbox attribute and rel attribute implementations
    var dataLightboxValue = $link.attr('data-lightbox');
    var $links;

    if (dataLightboxValue) {
      $links = $($link.prop('tagName') + '[data-lightbox="' + dataLightboxValue + '"]');
      for (var i = 0; i < $links.length; i = ++i) {
        addToAlbum($($links[i]));
        if ($links[i] === $link[0]) {
          imageNumber = i;
        }
      }
    } else {
      if ($link.attr('rel') === 'lightbox') {
        // If image is not part of a set
        addToAlbum($link);
      } else {
        // If image is part of a set
        $links = $($link.prop('tagName') + '[rel="' + $link.attr('rel') + '"]');
        for (var j = 0; j < $links.length; j = ++j) {
          addToAlbum($($links[j]));
          if ($links[j] === $link[0]) {
            imageNumber = j;
          }
        }
      }
    }

    // Position Lightbox
    var top  = $window.scrollTop() + this.options.positionFromTop;
    var left = $window.scrollLeft();
    this.$lightbox.css({
      top: top + 'px',
      left: left + 'px'
    }).fadeIn(this.options.fadeDuration);

    // Disable scrolling of the page while open
    if (this.options.disableScrolling) {
      $('body').addClass('lb-disable-scrolling');
    }

    this.changeImage(imageNumber);
  };

  // Hide most UI elements in preparation for the animated resizing of the lightbox.
  Lightbox.prototype.changeImage = function(imageNumber) {
    var self = this;

    this.disableKeyboardNav();
    var $image = this.$lightbox.find('.lb-image');

    this.$overlay.fadeIn(this.options.fadeDuration);

    $('.lb-loader').fadeIn('slow');
    this.$lightbox.find('.lb-image, .lb-nav, .lb-prev, .lb-next, .lb-dataContainer, .lb-numbers, .lb-caption').hide();

    this.$outerContainer.addClass('animating');

    // When image to show is preloaded, we send the width and height to sizeContainer()
    var preloader = new Image();
    preloader.onload = function() {
      var $preloader;
      var imageHeight;
      var imageWidth;
      var maxImageHeight;
      var maxImageWidth;
      var windowHeight;
      var windowWidth;

      $image.attr('src', self.album[imageNumber].link);

      $preloader = $(preloader);

      $image.width(preloader.width);
      $image.height(preloader.height);

      if (self.options.fitImagesInViewport) {
        // Fit image inside the viewport.
        // Take into account the border around the image and an additional 10px gutter on each side.

        windowWidth    = $(window).width();
        windowHeight   = $(window).height();
        maxImageWidth  = windowWidth - self.containerLeftPadding - self.containerRightPadding - 20;
        maxImageHeight = windowHeight - self.containerTopPadding - self.containerBottomPadding - 120;

        // Check if image size is larger then maxWidth|maxHeight in settings
        if (self.options.maxWidth && self.options.maxWidth < maxImageWidth) {
          maxImageWidth = self.options.maxWidth;
        }
        if (self.options.maxHeight && self.options.maxHeight < maxImageWidth) {
          maxImageHeight = self.options.maxHeight;
        }

        // Is there a fitting issue?
        if ((preloader.width > maxImageWidth) || (preloader.height > maxImageHeight)) {
          if ((preloader.width / maxImageWidth) > (preloader.height / maxImageHeight)) {
            imageWidth  = maxImageWidth;
            imageHeight = parseInt(preloader.height / (preloader.width / imageWidth), 10);
            $image.width(imageWidth);
            $image.height(imageHeight);
          } else {
            imageHeight = maxImageHeight;
            imageWidth = parseInt(preloader.width / (preloader.height / imageHeight), 10);
            $image.width(imageWidth);
            $image.height(imageHeight);
          }
        }
      }
      self.sizeContainer($image.width(), $image.height());
    };

    preloader.src          = this.album[imageNumber].link;
    this.currentImageIndex = imageNumber;
  };

  // Stretch overlay to fit the viewport
  Lightbox.prototype.sizeOverlay = function() {
    this.$overlay
      .width($(document).width())
      .height($(document).height());
  };

  // Animate the size of the lightbox to fit the image we are showing
  Lightbox.prototype.sizeContainer = function(imageWidth, imageHeight) {
    var self = this;

    var oldWidth  = this.$outerContainer.outerWidth();
    var oldHeight = this.$outerContainer.outerHeight();
    var newWidth  = imageWidth + this.containerLeftPadding + this.containerRightPadding;
    var newHeight = imageHeight + this.containerTopPadding + this.containerBottomPadding;

    function postResize() {
      self.$lightbox.find('.lb-dataContainer').width(newWidth);
      self.$lightbox.find('.lb-prevLink').height(newHeight);
      self.$lightbox.find('.lb-nextLink').height(newHeight);
      self.showImage();
    }

    if (oldWidth !== newWidth || oldHeight !== newHeight) {
      this.$outerContainer.animate({
        width: newWidth,
        height: newHeight
      }, this.options.resizeDuration, 'swing', function() {
        postResize();
      });
    } else {
      postResize();
    }
  };

  // Display the image and its details and begin preload neighboring images.
  Lightbox.prototype.showImage = function() {
    this.$lightbox.find('.lb-loader').stop(true).hide();
    this.$lightbox.find('.lb-image').fadeIn('slow');

    this.updateNav();
    this.updateDetails();
    this.preloadNeighboringImages();
    this.enableKeyboardNav();
  };

  // Display previous and next navigation if appropriate.
  Lightbox.prototype.updateNav = function() {
    // Check to see if the browser supports touch events. If so, we take the conservative approach
    // and assume that mouse hover events are not supported and always show prev/next navigation
    // arrows in image sets.
    var alwaysShowNav = false;
    try {
      document.createEvent('TouchEvent');
      alwaysShowNav = (this.options.alwaysShowNavOnTouchDevices) ? true : false;
    } catch (e) {}

    this.$lightbox.find('.lb-nav').show();

    if (this.album.length > 1) {
      if (this.options.wrapAround) {
        if (alwaysShowNav) {
          this.$lightbox.find('.lb-prev, .lb-next').css('opacity', '1');
        }
        this.$lightbox.find('.lb-prev, .lb-next').show();
      } else {
        if (this.currentImageIndex > 0) {
          this.$lightbox.find('.lb-prev').show();
          if (alwaysShowNav) {
            this.$lightbox.find('.lb-prev').css('opacity', '1');
          }
        }
        if (this.currentImageIndex < this.album.length - 1) {
          this.$lightbox.find('.lb-next').show();
          if (alwaysShowNav) {
            this.$lightbox.find('.lb-next').css('opacity', '1');
          }
        }
      }
    }
  };

  // Display caption, image number, and closing button.
  Lightbox.prototype.updateDetails = function() {
    var self = this;

    // Enable anchor clicks in the injected caption html.
    // Thanks Nate Wright for the fix. @https://github.com/NateWr
    if (typeof this.album[this.currentImageIndex].title !== 'undefined' &&
      this.album[this.currentImageIndex].title !== '') {
      this.$lightbox.find('.lb-caption')
        .html(this.album[this.currentImageIndex].title)
        .fadeIn('fast')
        .find('a').on('click', function(event) {
          if ($(this).attr('target') !== undefined) {
            window.open($(this).attr('href'), $(this).attr('target'));

          } else {
            location.href = $(this).attr('href');
          }
        });
    }

    if (this.album.length > 1 && this.options.showImageNumberLabel) {
      var labelText = this.imageCountLabel(this.currentImageIndex + 1, this.album.length);
      this.$lightbox.find('.lb-number').text(labelText).fadeIn('fast');
    } else {
      this.$lightbox.find('.lb-number').hide();
    }

    this.$outerContainer.removeClass('animating');

    this.$lightbox.find('.lb-dataContainer').fadeIn(this.options.resizeDuration, function() {
      return self.sizeOverlay();
    });
  };

  // Preload previous and next images in set.
  Lightbox.prototype.preloadNeighboringImages = function() {
    if (this.album.length > this.currentImageIndex + 1) {
      var preloadNext = new Image();
      preloadNext.src = this.album[this.currentImageIndex + 1].link;
    }
    if (this.currentImageIndex > 0) {
      var preloadPrev = new Image();
      preloadPrev.src = this.album[this.currentImageIndex - 1].link;
    }
  };

  Lightbox.prototype.enableKeyboardNav = function() {
    $(document).on('keyup.keyboard', $.proxy(this.keyboardAction, this));
  };

  Lightbox.prototype.disableKeyboardNav = function() {
    $(document).off('.keyboard');
  };

  Lightbox.prototype.keyboardAction = function(event) {
    var KEYCODE_ESC        = 27;
    var KEYCODE_LEFTARROW  = 37;
    var KEYCODE_RIGHTARROW = 39;

    var keycode = event.keyCode;
    var key     = String.fromCharCode(keycode).toLowerCase();
    if (keycode === KEYCODE_ESC || key.match(/x|o|c/)) {
      this.end();
    } else if (key === 'p' || keycode === KEYCODE_LEFTARROW) {
      if (this.currentImageIndex !== 0) {
        this.changeImage(this.currentImageIndex - 1);
      } else if (this.options.wrapAround && this.album.length > 1) {
        this.changeImage(this.album.length - 1);
      }
    } else if (key === 'n' || keycode === KEYCODE_RIGHTARROW) {
      if (this.currentImageIndex !== this.album.length - 1) {
        this.changeImage(this.currentImageIndex + 1);
      } else if (this.options.wrapAround && this.album.length > 1) {
        this.changeImage(0);
      }
    }
  };

  // Closing time. :-(
  Lightbox.prototype.end = function() {
    this.disableKeyboardNav();
    $(window).off('resize', this.sizeOverlay);
    this.$lightbox.fadeOut(this.options.fadeDuration);
    this.$overlay.fadeOut(this.options.fadeDuration);
    $('select, object, embed').css({
      visibility: 'visible'
    });
    if (this.options.disableScrolling) {
      $('body').removeClass('lb-disable-scrolling');
    }
  };

  return new Lightbox();
}));

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
