function sendMessage(message) {
	console.log('sending message', message);
	window.parent.postMessage(JSON.stringify(message), '*');
}

BigScreen.onenter = function(element) {
	sendMessage({
		scope: 'global',
		name: 'enter',
		id: element.id
	});

	console.log('[global] enter:', element);
};

BigScreen.onchange = function(element) {
	sendMessage({
		scope: 'global',
		name: 'change',
		id: element ? element.id : null
	});

	console.log('[global] change:', element);
};

BigScreen.onexit = function() {
	sendMessage({
		scope: 'global',
		name: 'exit'
	});

	console.log('[global] exit');
};

BigScreen.onerror = function(element, reason) {
	sendMessage({
		scope: 'global',
		name: 'error',
		id: element.id,
		reason: reason
	});

	console.log('[global] error:', element, reason);
};