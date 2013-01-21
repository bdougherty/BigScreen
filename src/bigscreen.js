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

				// Double-check that all functions/events exist and if not, delete them.
				// Skip the events though, because Opera reports document.onfullscreenerror as undefined instead of null.
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

	// Find a child <video> in the element passed.
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

	// Check to see if there is a <video> and if the video has webkitEnterFullscreen, try it.
	// Metadata needs to be loaded for it to work, so load() if we need to.
	function videoEnterFullscreen(element) {
		var videoElement = _getVideo(element);

		if (videoElement && videoElement.webkitEnterFullscreen) {
			try {
				// We can tell when it enters and exits full screen on iOS using these events.
				// Desktop Safari will fire the normal fullscreenchange event.
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
				// videoElement.play();
			}
			catch (err) {
				return callOnError('not_supported', element);
			}

			return true;
		}

		return callOnError('not_supported', element);
	}

	// There is a bug in older WebKit that will not fire a fullscreenchange event when the element exiting
	// is an iframe. This will listen for a window resize and fire exit if there is no current element.
	// [Chrome bug](http://code.google.com/p/chromium/issues/detail?id=138368)
	// [Safari bug](rdar://11927884)
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

	var callOnEnter = function(actualElement) {
		// Return if the element entering has actually entered already. In older WebKit versions the
		// browser will fire 2 webkitfullscreenchange events when entering full screen from inside an
		// iframe. This is the result of the same bug as the resizeExitHack.
		var lastElement = elements[elements.length - 1];
		if ((actualElement === lastElement.element || actualElement === lastVideoElement) && lastElement.hasEntered) {
			console.info('duplicate onEnter called');
			return;
		}

		// Call the global enter handler if this is the first element
		if (elements.length === 1) {
			bigscreen.onenter(bigscreen.element);
		}

		var element = elements[elements.length - 1];
		actualElement = actualElement || element.element;
		element.enter.call(element.element, actualElement);
		// Store that we've called the enter callback so we don't call it again
		element.hasEntered = true;
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

		// Check to make sure that the element exists. This is to deal with when the function
		// gets called a second time from the iframe resize hack.
		if (element) {
			element.exit.call(element.element);

			// No more elements on the stack
			if (!bigscreen.element) {
				// Call the rest of the exit handlers in the stack
				elements.forEach(function(element) {
					element.exit.call(element.element);
				});
				elements = [];

				// Call the global exit handler
				bigscreen.onexit();
			}
		}
	};

	var callOnError = function(reason, element) {
		var obj = elements.pop();
		element = element || obj.element;

		obj.error.call(element, reason);
		bigscreen.onerror(element, reason);
	};

	var bigscreen = {
		request: function handleRequest(element, enterCallback, exitCallback, errorCallback) {
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
				callOnError('not_enabled', element);
			}
		},
		exit: function handleExit() {
			removeWindowResizeHack(); // remove here if exit is called manually, so two onexit events are not fired
			document[fn.exit]();
		},
		toggle: function handleToggle(element, enterCallback, exitCallback, errorCallback) {
			if (bigscreen.element) {
				bigscreen.exit();
			}
			else {
				bigscreen.request(element, enterCallback, exitCallback, errorCallback);
			}
		},

		// Mobile Safari and earlier versions of desktop Safari support sending a <video> into full screen.
		// Checks can't be performed to verify full screen capabilities unless we know about that element,
		// and it has loaded its metadata.
		videoEnabled: function handleVideoEnabled(element) {
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

		onenter: function() {},
		onexit: function() {},
		onchange: function() {},
		onerror: function() {}
	};

	try {
		Object.defineProperties(bigscreen, {
			element: {
				enumerable: true,
				get: function() {
					if (lastVideoElement && lastVideoElement.webkitDisplayingFullscreen) {
						return lastVideoElement;
					}

					return document[fn.element] || null;
				}
			},
			enabled: {
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
		document.addEventListener(fn.change, function onFullscreenChange(event) {
			bigscreen.onchange(bigscreen.element);

			if (bigscreen.element) {
				// This is actually an exit if the element that is in full screen is the
				// previous element in the stack
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

	if (fn.error) {
		document.addEventListener(fn.error, function onFullscreenError(event) {
			if (elements.length > 0) {
				callOnError('not_allowed');
			}
		}, false);
	}

	window.BigScreen = bigscreen;

}(window, document, self !== top));