/*jshint expr:true */
var expect = chai.expect;

var enabledProp = (function() {
    if (document.webkitFullscreenEnabled) {
        return document.webkitFullscreenEnabled;
    }

    if (document.mozFullScreenEnabled) {
        return document.mozFullScreenEnabled;
    }

    if (document.fullscreenEnabled) {
        return document.fullscreenEnabled;
    }

    return null;
}());

function createSource(url, type) {
    var source = document.createElement('source');
    source.src = url;
    source.type = type;
    return source;
}

function createVideo(preload) {
    var video = document.createElement('video');
    video.width = '50';
    video.height = '50';
    video.preload = preload ? 'metadata' : 'none';

    var mp4 = createSource('http://junk.bradd.me/curiosity.mp4', 'video/mp4');
    var webm = createSource('http://junk.bradd.me/curiosity.webm', 'video/webm');

    video.appendChild(mp4);
    video.appendChild(webm);

    var wrapper = document.createElement('div');
    wrapper.appendChild(video);

    return wrapper;
}

describe('BigScreen', function() {

    it('exists in the global space', function() {
        expect(BigScreen).to.exist;
    });

    it('should expose the proper api', function() {
        expect(BigScreen).to.have.property('element');
        expect(BigScreen).to.have.property('enabled');

        expect(BigScreen).to.respondTo('request');
        expect(BigScreen).to.respondTo('exit');
        expect(BigScreen).to.respondTo('toggle');
        expect(BigScreen).to.respondTo('videoEnabled');

        expect(BigScreen).to.have.property('onenter');
        expect(BigScreen.onenter).to.be.a('function');

        expect(BigScreen).to.have.property('onchange');
        expect(BigScreen.onchange).to.be.a('function');

        expect(BigScreen).to.have.property('onexit');
        expect(BigScreen.onexit).to.be.a('function');

        expect(BigScreen).to.have.property('onerror');
        expect(BigScreen.onerror).to.be.a('function');
    });

    describe('element', function() {

        it('should have null for .element by default', function() {
            expect(BigScreen).to.have.property('element', null);
        });

    });

    describe('enabled', function() {

        it('should have the expected value', function() {
            // If the spec fullscreen api exists and we're not in an iframe, it should be enabled
            if (enabledProp === null && document.webkitCancelFullScreen) {
                expect(BigScreen).to.have.property('enabled', self === top);
            }
            // Otherwise it should match the value of the browser property
            else {
                expect(BigScreen).to.have.property('enabled', !!enabledProp);
            }
        });

    });

    describe('videoEnabled', function() {

        before(function() {
            this.wrapper = createVideo();
            document.body.appendChild(this.wrapper);

            this.wrapperWithVideo = createVideo(true);
            document.body.appendChild(this.wrapperWithVideo);
        });

        it('should be the same as enabled for an element without a child video', function() {
            var videoEnabled = BigScreen.videoEnabled(document.getElementById('mocha'));
            expect(videoEnabled).to.equal(BigScreen.enabled);
        });

        it('should equal "maybe" if there is a compatible child video and in WebKit', function() {
            var videoEnabled = BigScreen.videoEnabled(this.wrapper);
            var video = this.wrapper.getElementsByTagName('video')[0];

            if (BigScreen.enabled) {
                expect(videoEnabled).to.be.true;
            }
            else if (video.webkitSupportsFullscreen === undefined) {
                expect(videoEnabled).to.be.false;
            }
            else {
                expect(videoEnabled).to.be.equal('maybe');
            }
        });

        xit('should equal true if there is a compatible child video with metadata loaded and in WebKit', function() {
            var videoEnabled = BigScreen.videoEnabled(this.wrapperWithVideo);
            var video = this.wrapperWithVideo.getElementsByTagName('video')[0];

            if (BigScreen.enabled || video.webkitSupportsFullscreen !== undefined) {
                expect(videoEnabled).to.be.true;
            }
            else {
                expect(videoEnabled).to.be.false;
            }
        });

        after(function() {
            document.body.removeChild(this.wrapper);
            document.body.removeChild(this.wrapperWithVideo);
        });

    });

    describe('request(documentElement)', function() {

        function getExpectedError() {
            if (enabledProp === true || document.documentElement.webkitRequestFullScreen) {
                return 'not_allowed';
            }

            if (enabledProp === false) {
                return 'not_enabled';
            }

            return 'not_supported';
        }

        it('should call global error handler if request fails', function(done) {
            var enterSpy = sinon.spy(BigScreen, 'onenter');
            var changeSpy = sinon.spy(BigScreen, 'onchange');
            var exitSpy = sinon.spy(BigScreen, 'onexit');

            var expectedError = getExpectedError();

            var oldOnError = BigScreen.onerror;
            var errorSpy = sinon.spy(function() {
                expect(enterSpy).to.not.have.been.called;
                expect(changeSpy).to.not.have.been.called;
                expect(exitSpy).to.not.have.been.called;

                expect(errorSpy).to.have.been.calledOnce;
                console.log('error reason:', errorSpy.getCall(0).args[1]);
                expect(errorSpy).to.have.been.calledWith(document.documentElement, expectedError);

                BigScreen.onenter.restore();
                BigScreen.onchange.restore();
                BigScreen.onexit.restore();
                BigScreen.onerror = oldOnError;

                done();
            });

            BigScreen.onerror = errorSpy;
            BigScreen.request(document.documentElement);
        });

        it('should call local error handler if request fails', function(done) {
            var enterSpy = sinon.spy();
            var exitSpy = sinon.spy();

            var expectedError = getExpectedError();

            var errorSpy = sinon.spy(function() {
                expect(enterSpy).to.not.have.been.called;
                expect(exitSpy).to.not.have.been.called;

                expect(errorSpy).to.have.been.calledOnce;
                expect(errorSpy).to.have.been.calledWith(expectedError);

                done();
            });

            BigScreen.request(null, enterSpy, exitSpy, errorSpy);
        });

        it('should call local error handler before the global handler', function(done) {
            var enterSpy = sinon.spy();
            var exitSpy = sinon.spy();

            var expectedError = getExpectedError();

            function errorCallback() {
                expect(errorSpy).to.have.been.calledOnce;
                expect(errorSpy).to.have.been.calledWith(expectedError);

                expect(globalErrorSpy).to.have.been.calledOnce;
                expect(globalErrorSpy).to.have.been.calledWith(document.documentElement, expectedError);

                expect(errorSpy).to.have.been.calledBefore(globalErrorSpy);

                BigScreen.onerror = oldOnError;
                done();
            }

            // Global error should get called after, so complete the test when that fires
            var globalErrorSpy = sinon.spy(errorCallback);
            globalErrorSpy.displayName = 'globalErrorSpy';

            var errorSpy = sinon.spy();
            errorSpy.displayName = 'errorSpy';

            var oldOnError = BigScreen.onerror;
            BigScreen.onerror = globalErrorSpy;
            BigScreen.request(document.documentElement, enterSpy, exitSpy, errorSpy);
        });

    });

});