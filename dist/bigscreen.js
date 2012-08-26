/*!
* BigScreen
* v1.0.0 - 2012-08-26
* https://github.com/bdougherty/BigScreen
* Copyright 2012 Brad Dougherty; Apache 2.0 License
*/

/*global self Element */
(function(window, document, iframe) {
	'use strict';

	var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

	var fn = (function() {
		var map = [
			// spec
			{
				request: 'requestFullscreen',
				exit: 'exitFullscreen',
				enabled: 'fullscreenEnabled',
				element: 'fullscreenElement',
				change: 'fullscreenchange',
				error: 'fullscreenerror'
			},
			// new WebKit
			{
				request: 'webkitRequestFullscreen',
				exit: 'webkitExitFullscreen',
				enabled: 'webkitFullscreenEnabled',
				element: 'webkitFullscreenElement',
				change: 'webkitfullscreenchange',
				error: 'webkitfullscreenerror'
			},
			// older WebKit (Safari 5.1)
			{
				request: 'webkitRequestFullScreen',
				exit: 'webkitCancelFullScreen',
				element: 'webkitCurrentFullScreenElement',
				change: 'webkitfullscreenchange',
				error: 'webkitfullscreenerror'
			},
			// Firefox 10+
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

		// Loop through each one and check to see if the request function exists
		for (var i = 0; i < map.length; i++) {
			if (map[i].request in testElement) {
				fullscreen = map[i];

				// Double-check that all functions/events exist and if not, delete them
				for (var item in fullscreen) {
					if (!('on' + fullscreen[item] in document) && !(fullscreen[item] in document) && !(fullscreen[item] in testElement)) {
						delete fullscreen[item];
					}
				}

				break;
			}
		}

		testElement = null;

		return fullscreen;
	}());

	// From Underscore.js 1.3.3
	// http://underscorejs.org
	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) {
					func.apply(context, args);
				}
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) {
				func.apply(context, args);
			}
		};
	}

	// Find a child <video> in the element passed.
	function getVideo(element) {
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

	var lastFullscreenVideo = null;

	// Check to see if there is a <video> and if the video has webkitEnterFullscreen, try it.
	// Metadata needs to be loaded for it to work, so load() if we need to.
	function videoEnterFullscreen(element) {
		var videoElement = getVideo(element);

		if (videoElement && videoElement.webkitEnterFullscreen) {
			try {
				if (videoElement.readyState < videoElement.HAVE_METADATA) {
					videoElement.addEventListener('loadedmetadata', function onMetadataLoaded() {
						videoElement.removeEventListener('loadedmetadata', onMetadataLoaded, false);
						videoElement.webkitEnterFullscreen();
					}, false);
					videoElement.load();
				}
				else {
					videoElement.webkitEnterFullscreen();
				}

				lastFullscreenVideo = videoElement;
				videoElement.play();
				callOnEnter();
				setTimeout(checkDisplayingFullscreen, 500);
			}
			catch (err) {
				bigscreen.onerror.call(videoElement);
			}

			return;
		}

		bigscreen.onerror.call(element);
	}

	// Poll for changes to webkitDisplayingFullscreen so that we can fire BigScreen.exit()
	// if a <video> comes out of full screen when using the webkitEnterFullscreen fallback.
	function checkDisplayingFullscreen() {
		if (lastFullscreenVideo) {
			if (lastFullscreenVideo.webkitDisplayingFullscreen === true) {
				return setTimeout(checkDisplayingFullscreen, 500);
			}

			callOnExit();
		}
	}

	// There is a bug in WebKit that will not fire a fullscreenchange event when the element exiting
	// is an iframe. This will listen for a window resize and fire exit if there is no current element.
	// Chrome bug: http://code.google.com/p/chromium/issues/detail?id=138368
	// Safari bug: rdar://11927884
	function resizeExitHack() {
		if (!bigscreen.element) {
			callOnExit();
			removeWindowResizeHack();
		}
	}

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

	var callOnEnter = debounce(function() {
		bigscreen.onenter.call(bigscreen);
	}, 100, true);

	var callOnExit = debounce(function() {
		bigscreen.onexit.call(bigscreen);
	}, 200, true);

	var bigscreen = {
		request: function(element) {
			element = element || document.documentElement;

			// iOS only supports webkitEnterFullscreen on videos.
			if (fn.request === undefined) {
				return videoEnterFullscreen(element);
			}

			// document.fullscreenEnabled is false, so try a video if there is one.
			if (iframe && document[fn.enabled] === false) {
				return videoEnterFullscreen(element);
			}

			// If we're in an iframe, it needs to have the allowfullscreen attribute in order for element full screen
			// to work. Safari 5.1 supports element full screen, but doesn't have document.webkitFullScreenEnabled,
			// so the only way to tell if it will work is to just try it.
			if (iframe && fn.enabled === undefined) {
				fn.enabled = 'webkitFullscreenEnabled';

				element[fn.request]();

				setTimeout(function() {
					if (!document[fn.element]) {
						document[fn.enabled] = false;
						videoEnterFullscreen(element);
					}
					else {
						document[fn.enabled] = true;
					}
				}, 250);

				return;
			}

			try {
				element[fn.request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);

				// Safari 5.1 incorrectly states that it allows keyboard input when it doesn't
				if (!document[fn.element]) {
					element[fn.request]();
				}
			}
			catch (err) {
				bigscreen.onerror.call(element);
			}
		},
		exit: function() {
			removeWindowResizeHack(); // remove here if exit is called manually, so two onexit events are not fired
			document[fn.exit]();
			lastFullscreenVideo = null;
		},
		toggle: function(element) {
			if (bigscreen.element) {
				bigscreen.exit();
			}
			else {
				bigscreen.request(element);
			}
		},

		// Mobile Safari and earlier versions of desktop Safari support sending a <video> into full screen.
		// Checks can't be performed to verify full screen capabilities unless we know about that element,
		// and it has loaded its metadata.
		videoEnabled: function(element) {
			if (bigscreen.enabled) {
				return true;
			}

			var video = getVideo(element);

			if (!video || video.webkitSupportsFullscreen === undefined) {
				return false;
			}

			return video.readyState < video.HAVE_METADATA ? 'maybe' : video.webkitSupportsFullscreen;
		},

		onenter: function() {},
		onexit: function() {},
		onerror: function() {}
	};

	try {
		Object.defineProperties(bigscreen, {
			'element': {
				enumerable: true,
				get: function() {
					if (lastFullscreenVideo && lastFullscreenVideo.webkitDisplayingFullscreen) {
						return lastFullscreenVideo;
					}

					return document[fn.element] || null;
				}
			},
			'enabled': {
				enumerable: true,
				get: function() {
					// Safari 5.1 supports full screen, but doesn't have a fullScreenEnabled property,
					// but it should work if not in an iframe.
					if (fn.exit === 'webkitCancelFullScreen' && !iframe) {
						return true;
					}

					return document[fn.enabled] || false;
				}
			}
		});
	}
	catch (err) {
		bigscreen.element = null;
		bigscreen.enabled = false;
	}

	if (fn.change) {
		document.addEventListener(fn.change, function(event) {
			if (bigscreen.element) {
				callOnEnter();
				addWindowResizeHack();
			}
			else {
				callOnExit();
			}
		}, false);
	}

	if (fn.error) {
		document.addEventListener(fn.error, function(event) {
			bigscreen.onerror.call(event.target);
		}, false);
	}

	window.BigScreen = bigscreen;

}(window, document, self !== top));