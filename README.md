# BigScreen

A simple library for using the JavaScript Full Screen API.


## Why should I use it?

### Before BigScreen

```js
if (element.requestFullscreen) {
    element.requestFullscreen();
}
else if (element.webkitRequestFullscreen) {
    element.webkitRequestFullscreen();
}
else if (element.webkitRequestFullScreen) {
    element.webkitRequestFullScreen();
}
else if (element.mozRequestFullScreen) {
    element.mozRequestFullScreen();
}
```

## After BigScreen

```js
BigScreen.request(element);
```

BigScreen also smoothes out a couple browser bugs for you (the real before code is a little more complicated).


## Download

BigScreen is ~1 kb minified and gzipped. [Download it now](https://raw.github.com/bdougherty/BigScreen/master/dist/bigscreen.min.js).


## Supported Browsers

* Chrome 15+
* Firefox 10+
* Safari 5.1+

These browsers are also supported for video only:

* Safari 5.0


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
		BigScreen.request(element);
		// You could also use .toggle(element)
	}
	else {
		// fallback for browsers that don't support full screen
	}
}, false);
```

### Detecting full screen changes

```js
BigScreen.onenter = function() {
	// called when entering full screen
}

BigScreen.onexit = function() {
	// called when exiting full screen
}
```


## [Demo](http://brad.is/coding/BigScreen/)


## Documentation

### BigScreen.request(element)

Request that an element go into full screen. If the element is `null` or `undefined`, the `documentElement` will be used instead.

You can only call this from a user-initiated event, otherwise the browser will deny the request. That means click, key, or touch events.

In addition, if your page is inside an `<iframe>` it will need to have the `allowfullscreen` (and `webkitallowfullscreen` and `mozallowfullscreen`) attribute set on the `<iframe>`.

Finally, BigScreen will try to fall back to full screen for `<video>` if there is a child `<video>` in the element you pass and the browser supports it (see `BigScreen.videoEnabled)`). If BigScreen falls back, it will automatically load and play the video.

### BigScreen.exit()

Will exit full screen. Note that if there are multiple elements in full screen, only the last one will exit full screen.

### BigScreen.toggle(element)

Will request full screen if there is no element in full screen, otherwise it will exit full screen.

### BigScreen.onenter()

Override to get notified when an element enters full screen. `BigScreen.element` will be set to the element that is entering full screen.

### BigScreen.onexit()

Override to get notified when fully exiting full screen (there are no more elements in full screen).

### BigScreen.element

Set to the element that is currently displaying full screen, or `null` if no element is in full screen.

### BigScreen.enabled

A boolean that will tell you if it is possible to go into full screen. If your page is in an `<iframe>` it will need to have the `allowfullscreen` attribute set or this will be `false`.

### BigScreen.videoEnabled(video)

Safari 5.0 and iOS 4.2+ support putting `<video>` into full screen. `BigScreen.enabled` will report `false` in those browsers, but you can use this to check for `<video> `full screen support by passing the `<video>` itself, or an ancestor.

This function will report `false` if there is no child `<video>`, or if it is not possible to put a `<video>` in full screen. It will report `'maybe'` if the video's metadata has not been loaded, and `true` if it will be able to enter full screen.


## Known Issues

There is currently a bug in WebKit that causes the `webkitfullscreenchange` event to fire incorrectly when inside an `iframe`. BigScreen is able to work around the issue though. ([Chrome Bug](http://code.google.com/p/chromium/issues/detail?id=138368), Safari Bug: rdar://problem/11927884)

Safari 6.0 does not work properly when putting multiple elements into full screen. [Open Radar bug report](http://openradar.appspot.com/radar?id=1878403).


## Links

* [Using the Fullscreen API in web browsers](http://hacks.mozilla.org/2012/01/using-the-fullscreen-api-in-web-browsers/)
* [Using HTML5's Fullscreen API for Fun and Profit](http://sorcery.smugmug.com/2012/06/06/using-html5s-fullscreen-api-for-fun-and-profit/)
* [Using full-screen mode - MDN](https://developer.mozilla.org/en/DOM/Using_full-screen_mode)
* [Fullscreen Specification - W3C](http://dvcs.w3.org/hg/fullscreen/raw-file/tip/Overview.html)


## License

BigScreen is licensed under the [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0) license. Copyright 2012 Brad Dougherty.