# BigScreen

A simple library for using the JavaScript Fullscreen API.


## Why should I use it?

BigScreen makes it easy to use full screen on your site or in your app. It smoothes out browser inconsistencies and bugs, especially if the element you're working with is inside of an `<iframe>`. It will also intelligently fall back to the older video full screen API if the element contains a `<video>` and the older API is available.


## Download

BigScreen is ~1.4 kb minified and gzipped. [Download it now](https://raw.github.com/bdougherty/BigScreen/master/bigscreen.min.js).


## Supported Browsers

* Chrome 15+
* Firefox 10+
* Safari 5.1+
* Internet Explorer 11
* Opera 12.1+
* Firefox for Android 18+
* Chrome for Android 32

These browsers are also supported for video only:

* Safari 5.0
* iOS 4.2+
* Android Browser 2.1+
* Chrome for Android < 32

(See [caniuse](http://caniuse.com/#feat=fullscreen) for always up-to-date info)


## [Demo](http://brad.is/coding/BigScreen/)


## How do I use it?

### Put the entire page in full screen

```js
document.getElementById('button').addEventListener('click', function() {
	if (BigScreen.enabled) {
		BigScreen.toggle();
	}
	else {
		// fallback
	}
}, false);
```

### Put any element in full screen

```js
var element = document.getElementById('target');

document.getElementById('button').addEventListener('click', function() {
	if (BigScreen.enabled) {
		BigScreen.request(element, onEnter, onExit, onError);
		// You could also use .toggle(element, onEnter, onExit, onError)
	}
	else {
		// fallback for browsers that don't support full screen
	}
}, false);
```

### Detecting full screen changes globally

```js
BigScreen.onenter = function() {
	// called when the first element enters full screen
}

BigScreen.onchange = function() {
	// called any time the full screen element changes
}

BigScreen.onexit = function() {
	// called when all elements have exited full screen
}
```


## Documentation

### BigScreen.request(element[, onEnter, onExit, onError])

Request that an element go into full screen. If the element is falsy, the `<body>` will be used instead.

You can only call this from a user-initiated event, otherwise the browser will deny the request. That means key, touch, mouse, or pointer events.

In addition, if your page is inside an `<iframe>` it will need to have the `allowfullscreen` (and `webkitallowfullscreen` and `mozallowfullscreen`) attribute set on the `<iframe>`.

Finally, BigScreen will try to fall back to full screen for `<video>` if there is a child `<video>` in the element you pass and the browser supports it (see `BigScreen.videoEnabled)`). If BigScreen falls back, it will automatically load the metadata of the video so the video can enter full screen.

You can optionally pass callback functions for when this element enters or exits full screen, or if there is an error entering full screen. For all callbacks, the value of `this` will be set to the element that was requested. The actual element that entered full screen will be passed as the first parameter to `onEnter`.

### BigScreen.exit()

Will exit full screen. Note that if there are multiple elements in full screen, only the last one will exit full screen.

### BigScreen.toggle(element[, onEnter, onExit, onError])

Will request full screen if there is no element in full screen, otherwise it will exit full screen.

### BigScreen.onenter(element)

Override to get notified when the first element goes into full screen. This will not fire if subsequent elements are added to the full screen stack (use `onchange` for that).

### BigScreen.onchange(element)

Override to get notified any time the full screen element changes. The element that is currently displaying in full screen will be passed as the first argument.

### BigScreen.onexit()

Override to get notified when fully exiting full screen (there are no more elements in full screen).

### BigScreen.onerror(element, reason)

Override to get notified if there is an error sending an element into full screen. The possible values for reason are:

* `not_supported`: full screen is not supported at all or for this element
* `not_enabled`: request was made from a frame that does not have the allowfullscreen attribute, or the user has disabled full screen in their browser (but it is supported)
* `not_allowed`: the request failed, probably because it was not called from a user-initiated event

These are the same values passed to individual onError callbacks as well.

### BigScreen.element

Set to the element that is currently displaying full screen, or `null` if no element is in full screen.

### BigScreen.enabled

A boolean that will tell you if it is possible to go into full screen. If your page is in an `<iframe>` it will need to have the `allowfullscreen` attribute set or this will be `false`.

### BigScreen.videoEnabled(video)

Safari 5.0 and iOS 4.2+ support putting `<video>` into full screen. `BigScreen.enabled` will report `false` in those browsers, but you can use this to check for `<video>` full screen support by passing the `<video>` itself, or an ancestor.

This function will report `false` if there is no child `<video>`, or if it is not possible to put a `<video>` in full screen. It will report `'maybe'` if it is possible, but the video's metadata has not been loaded, and `true` if it will be able to enter full screen.


## Known Fullscreen API Issues

Safari 6.0 does not work properly when putting multiple elements into full screen. [Open Radar bug report](http://openradar.appspot.com/radar?id=1878403).

There is currently a bug in Safari (was in WebKit, but has been fixed and has been merged into Chrome as of 22) that causes the `webkitfullscreenchange` event to fire incorrectly when inside an `iframe`. BigScreen is able to work around the issue though. (Safari Bug: rdar://problem/11927884)


## Links

* [Using the Fullscreen API in web browsers](http://hacks.mozilla.org/2012/01/using-the-fullscreen-api-in-web-browsers/)
* [Using HTML5's Fullscreen API for Fun and Profit](http://sorcery.smugmug.com/2012/06/06/using-html5s-fullscreen-api-for-fun-and-profit/)
* [screenfull.js](https://github.com/sindresorhus/screenfull.js)
* [Using full-screen mode - MDN](https://developer.mozilla.org/en/DOM/Using_full-screen_mode)
* [Fullscreen API Standard](http://fullscreen.spec.whatwg.org)


## License

BigScreen is licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license. Copyright 2013 Brad Dougherty.
