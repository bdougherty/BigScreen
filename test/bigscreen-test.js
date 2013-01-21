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
        it('has the proper value for enabled', function() {
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

    xdescribe('videoEnabled', function() {

        // @todo - need two checks here: one with an element that has a child video, one without
        it('should be the same as enabled', function() {
            var enabled = BigScreen.videoEnabled();
            // If the spec fullscreen api exists and we're not in an iframe, it should be enabled
            if (enabledProp === false && document.webkitCancelFullScreen) {
                if (self === top) {
                    expect(enabled).to.be.true;
                }
                else {
                    expect(enabled).to.equal('maybe');
                }
            }
            // Otherwise it should match the value of the browser property
            else if (enabledProp) {
                expect(enabled).to.be.true;
            }
            else {
                expect(enabled).to.be.false;
            }
        });

    });

    describe('request(documentElement)', function() {

        it('should call global error handler if request fails', function(done) {
            var enterSpy = sinon.spy(BigScreen, 'onenter');
            var changeSpy = sinon.spy(BigScreen, 'onchange');
            var exitSpy = sinon.spy(BigScreen, 'onexit');

            var expectedError = enabledProp === true ? 'not_allowed' : enabledProp === false ? 'not_enabled' : 'not_supported';

            var oldOnError = BigScreen.onerror;
            var errorSpy = sinon.spy(function() {
                expect(enterSpy).to.not.have.been.called;
                expect(changeSpy).to.not.have.been.called;
                expect(exitSpy).to.not.have.been.called;

                expect(errorSpy).to.have.been.calledOnce;
                expect(errorSpy).to.have.been.calledWith(document.documentElement, expectedError);
                console.log('error reason:', errorSpy.getCall(0).args[1]);

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

            var expectedError = enabledProp === true ? 'not_allowed' : enabledProp === false ? 'not_enabled' : 'not_supported';

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

            var expectedError = enabledProp === true ? 'not_allowed' : enabledProp === false ? 'not_enabled' : 'not_supported';

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