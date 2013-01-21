// A library to make it easier to use the JavaScript Fullscreen API.
(function(window, document, iframe) {
	'use strict';

	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function() {
		var map = [
			// Properties/events/functions as defined in the spec.
			// Currently implemented in Opera.
			{
				request: 'requestFullscreen',
				exit: 'exitFullscreen',
				enabled: 'fullscreenEnabled',
				element: 'fullscreenElement',
				change: 'fullscreenchange',
				error: 'fullscreenerror'
			},
			// Properties/events/functions in newer versions of WebKit (Chrome and Safari 6).
			// _Note the lowercase 's' in Fulscreen (to match the spec).
			{
				request: 'webkitRequestFullscreen',
				exit: 'webkitExitFullscreen',
				enabled: 'webkitFullscreenEnabled',
				element: 'webkitFullscreenElement',
				change: 'webkitfullscreenchange',
				error: 'webkitfullscreenerror'
			},
			// Properties/events/functions for older WebKit (Safari 5.1).
			// _Note the capital 'S' in FullScreen._
			{
				request: 'webkitRequestFullScreen',
				exit: 'webkitCancelFullScreen',
				element: 'webkitCurrentFullScreenElement',
				change: 'webkitfullscreenchange',
				error: 'webkitfullscreenerror'
			},
			// Properties/events/functions for Firefox 10+.
			{
				request: 'mozRequestFullScreen',
				exit: 'mozCancelFullScreen',
				enabled: 'mozFullScreenEnabled',
				element: 'mozFullScreenElement',
				change: 'mozfullscreenchange',
				error: 'mozfullscreenerror'
			}
		];

		var fullscreen = false;
		var testElement = document.createElement('video');

		// Loop over each set of properties/events/functions to find the set that has
		// a working requestFullscreen function. Double-check that the rest of the
		// functions and properties actually do exist, and if they don't, delete them.
		// Skip checking events events though, because Opera reports document.onfullscreenerror
		// as undefined instead of null.
		for (var i = 0; i < map.length; i++) {
			if (map[i].request in testElement) {
				fullscreen = map[i];

				for (var item in fullscreen) {
					if (item !== 'change' && item !== 'error' && !(fullscreen[item] in document) && !(fullscreen[item] in testElement)) {
						delete fullscreen[item];
					}
				}

				break;
			}
		}

		testElement = null;

		return fullscreen;
	}());

	// Find a child video in the element passed.
	function _getVideo(element) {
		var videoElement = null;

		if (element.tagName === 'VIDEO') {
			videoElement = element;
		}
		else {
			var videos = element.getElementsByTagName('video');
			if (videos[0]) {
				videoElement = videos[0];
			}
		}

		return videoElement;
	}

	var lastVideoElement = null;
	var hasControls = null;
	var emptyFunction = function() {};
	var elements = [];

	// Attempt to put a child video into full screen using webkitEnterFullscreen.
	// The metadata must be loaded in order for it to work, so load it automatically
	// if it isn't already.
	function videoEnterFullscreen(element) {
		var videoElement = _getVideo(element);

		if (videoElement && videoElement.webkitEnterFullscreen) {
			try {
				// We can tell when the video enters and exits full screen on iOS using the `webkitbeginfullscreen`
				// and `webkitendfullscreen` events. Desktop Safari and Chrome will fire the normal `fullscreenchange`
				// event instead.
				videoElement.addEventListener('webkitbeginfullscreen', function onBeginFullscreen(event) {
					videoElement.removeEventListener('webkitbeginfullscreen', onBeginFullscreen, false);
					bigscreen.onchange(videoElement);
					callOnEnter(videoElement);
				}, false);

				videoElement.addEventListener('webkitendfullscreen', function onEndFullscreen(event) {
					videoElement.removeEventListener('webkitendfullscreen', onEndFullscreen, false);
					bigscreen.onchange();
					callOnExit();
				}, false);

				if (videoElement.readyState < videoElement.HAVE_METADATA) {
					videoElement.addEventListener('loadedmetadata', function onMetadataLoaded() {
						videoElement.removeEventListener('loadedmetadata', onMetadataLoaded, false);
						videoElement.webkitEnterFullscreen();
						hasControls = !!videoElement.getAttribute('controls');
					}, false);
					videoElement.load();
				}
				else {
					videoElement.webkitEnterFullscreen();
					hasControls = !!videoElement.getAttribute('controls');
				}

				lastVideoElement = videoElement;
			}
			catch (err) {
				return callOnError('not_supported', element);
			}

			return true;
		}

		return callOnError(fn.request === undefined ? 'not_supported' : 'not_enabled', element);
	}

	// There is a bug in older versions of WebKit that will fire `webkitfullscreenchange` twice when
	// entering full screen from inside an iframe, and won't fire it when exiting. We can listen for
	// a resize event once we enter to tell when it returns to normal size (and thus has exited full
	// screen). See the [Safari bug](rdar://11927884).
	function resizeExitHack() {
		if (!bigscreen.element) {
			callOnExit();
			removeWindowResizeHack();
		}
	}

	// Add the listener for the resize hack, but only when inside an iframe in WebKit.
	function addWindowResizeHack() {
		if (iframe && fn.change === 'webkitfullscreenchange') {
			window.addEventListener('resize', resizeExitHack, false);
		}
	}

	function removeWindowResizeHack() {
		if (iframe && fn.change === 'webkitfullscreenchange') {
			window.removeEventListener('resize', resizeExitHack, false);
		}
	}

	var callOnEnter = function(actualElement) {
		// Return if the element entering has actually entered already. In older WebKit versions the
		// browser will fire 2 `webkitfullscreenchange` events when entering full screen from inside an
		// iframe. This is the result of the same bug as the resizeExitHack.
		var lastElement = elements[elements.length - 1];
		if ((actualElement === lastElement.element || actualElement === lastVideoElement) && lastElement.hasEntered) {
			return;
		}

		// Call the global enter handler only if this is the first element.
		if (elements.length === 1) {
			bigscreen.onenter(bigscreen.element);
		}

		// Call the stored callback for the request call and record that we did so we don't do it
		// again if there is a duplicate call (see above).
		lastElement.enter.call(lastElement.element, actualElement || lastElement.element);
		lastElement.hasEntered = true;
	};

	var callOnExit = function() {
		// Fix a bug present in some versions of WebKit that will show the native controls when
		// exiting, even if they were not showing before.
		if (lastVideoElement && !hasControls) {
			lastVideoElement.setAttribute('controls', 'controls');
			lastVideoElement.removeAttribute('controls');
		}

		lastVideoElement = null;
		hasControls = null;

		var element = elements.pop();

		// Check to make sure that the element exists. This function will get called a second
		// time from the iframe resize hack.
		if (element) {
			element.exit.call(element.element);

			// When the browser has fully exited full screen, make sure to loop
			// through and call the rest of the callbacks and then the global exit.
			if (!bigscreen.element) {
				elements.forEach(function(element) {
					element.exit.call(element.element);
				});
				elements = [];

				bigscreen.onexit();
			}
		}
	};

	// Make a callback to the error handlers and clear the element from the stack when
	// an error occurs.
	var callOnError = function(reason, element) {
		if (elements.length > 0) {
			var obj = elements.pop();
			element = element || obj.element;

			obj.error.call(element, reason);
			bigscreen.onerror(element, reason);
		}
	};

	var bigscreen = {
		// ### request
		// The meat of BigScreen is here. Run through a bunch of checks to try to get
		// something into full screen that's a child of the element passed in.
		request: function(element, enterCallback, exitCallback, errorCallback) {
			element = element || document.documentElement;

			elements.push({
				element: element,
				enter: enterCallback || emptyFunction,
				exit: exitCallback || emptyFunction,
				error: errorCallback || emptyFunction
			});

			// iOS only supports webkitEnterFullscreen on videos, so try that.
			// Browsers that don't support full screen at all will also go through this,
			// but they will fire an error.
			if (fn.request === undefined) {
				return videoEnterFullscreen(element);
			}

			// `document.fullscreenEnabled` defined, but is `false`, so try a video if there is one.
			if (iframe && document[fn.enabled] === false) {
				return videoEnterFullscreen(element);
			}

			// If we're in an iframe, it needs to have the `allowfullscreen` attribute in order for element full screen
			// to work. Safari 5.1 supports element full screen, but doesn't have `document.webkitFullScreenEnabled`,
			// so the only way to tell if it will work is to just try it.
			if (iframe && fn.enabled === undefined) {
				fn.enabled = 'webkitFullscreenEnabled';

				element[fn.request]();

				setTimeout(function() {
					// It didn't work, so set `webkitFullscreenEnabled` to false so we don't
					// have to try again next time. Then try to fall back to video full screen.
					if (!document[fn.element]) {
						document[fn.enabled] = false;
						videoEnterFullscreen(element);
					}
					// It worked! set `webkitFullscreenEnabled` so we know next time.
					else {
						document[fn.enabled] = true;
					}
				}, 250);

				return;
			}

			try {
				// Safari 5.1 doesn't actually support asking for keyboard support,
				// so don't try it. The alternative is to add another `setTimeout`
				// below, which isn't nice.
				if (/5\.1[\.\d]* Safari/.test(navigator.userAgent)) {
					element[fn.request]();
				}
				else {
					element[fn.request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
				}

				// If there's no element after 100ms, it didn't work. This check is for Safari 5.1
				// which fails to fire a `webkitfullscreenerror` if the request wasn't from a user
				// action.
				setTimeout(function() {
					if (!document[fn.element]) {
						callOnError(iframe ? 'not_enabled' : 'not_allowed', element);
					}
				}, 100);
			}
			catch (err) {
				callOnError('not_enabled', element);
			}
		},
		// ### exit
		// Pops the last full screen element off the stack.
		exit: function() {
			// Remove the resize hack here if exit is called manually, so it doesn't fire twice.
			removeWindowResizeHack();
			document[fn.exit]();
		},
		// ### toggle
		// Shortcut function if you only plan on putting one element into full screen.
		toggle: function(element, enterCallback, exitCallback, errorCallback) {
			if (bigscreen.element) {
				bigscreen.exit();
			}
			else {
				bigscreen.request(element, enterCallback, exitCallback, errorCallback);
			}
		},

		// ### videoEnabled
		// Mobile Safari and earlier versions of desktop Safari support sending a `<video>` into full screen,
		// even if the `allowfullscreen` attribute isn't present on the iframe. Checks can't be performed to
		// verify full screen capabilities unless we know about that element, and it has loaded its metadata.
		videoEnabled: function(element) {
			if (bigscreen.enabled) {
				return true;
			}

			element = element || document.documentElement;
			var video = _getVideo(element);

			if (!video || video.webkitSupportsFullscreen === undefined) {
				return false;
			}

			return video.readyState < video.HAVE_METADATA ? 'maybe' : video.webkitSupportsFullscreen;
		},

		// ### onenter, onexit, onchange, onerror
		// Populate the global handlers with empty functions.
		onenter: emptyFunction,
		onexit: emptyFunction,
		onchange: emptyFunction,
		onerror: emptyFunction
	};

	// Define the two properties `element` and `enabled` with getters.
	try {
		Object.defineProperties(bigscreen, {
			// ### element
			// Get the current element that is displaying full screen.
			element: {
				enumerable: true,
				get: function() {
					if (lastVideoElement && lastVideoElement.webkitDisplayingFullscreen) {
						return lastVideoElement;
					}

					return document[fn.element] || null;
				}
			},
			// ### enabled
			// Check if element full screen is supported.
			enabled: {
				enumerable: true,
				get: function() {
					// Safari 5.1 supports full screen, but doesn't have a fullScreenEnabled property,
					// but it should work if not in an iframe. If it doesn't work when tried for the
					// first time, we'll set this to `false` then.
					if (fn.exit === 'webkitCancelFullScreen' && !iframe) {
						return true;
					}

					return document[fn.enabled] || false;
				}
			}
		});
	}
	// If the define fails, set them to `null` and `false`, respectively.
	catch (err) {
		bigscreen.element = null;
		bigscreen.enabled = false;
	}

	// If there is a valid `fullscreenchange` event, set up the listener for it.
	if (fn.change) {
		document.addEventListener(fn.change, function onFullscreenChange(event) {
			bigscreen.onchange(bigscreen.element);

			if (bigscreen.element) {
				// This should be treated an exit if the element that is in full screen
				// is the previous element in our stack.
				var previousElement = elements[elements.length - 2];
				if (previousElement && previousElement.element === bigscreen.element) {
					callOnExit();
				}
				else {
					callOnEnter(bigscreen.element);
					addWindowResizeHack();
				}
			}
			else {
				callOnExit();
			}
		}, false);
	}

	// If there is a valid `fullscreenerror` event, set up the listener for it.
	if (fn.error) {
		document.addEventListener(fn.error, function onFullscreenError(event) {
			callOnError('not_allowed');
		}, false);
	}

	// Externalize the BigScreen object. Use array notation to play nicer with
	// Closure Compiler.
	window['BigScreen'] = bigscreen;

}(window, document, self !== top));