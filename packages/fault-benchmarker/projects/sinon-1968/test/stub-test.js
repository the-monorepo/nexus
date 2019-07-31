"use strict";

var referee = require("@sinonjs/referee");
var createStub = require("../lib/sinon/stub");
var createStubInstance = require("../lib/sinon/stub").createStubInstance;
var createSpy = require("../lib/sinon/spy");
var match = require("@sinonjs/samsam").createMatcher;
var deprecated = require("../lib/sinon/util/core/deprecated");
var assert = referee.assert;
var refute = referee.refute;
var fail = referee.fail;
var Promise = require("native-promise-only"); // eslint-disable-line no-unused-vars

describe("stub", function() {
    beforeEach(function() {
        createStub(deprecated, "printWarning");
    });

    afterEach(function() {
        if (deprecated.printWarning.restore) {
            deprecated.printWarning.restore();
        }
    });

    it("is spy", function() {
        var stub = createStub.create();

        assert.isFalse(stub.called);
        assert.isFunction(stub.calledWith);
        assert.isFunction(stub.calledOn);
    });

    it("fails if stubbing property on null", function() {
        assert.exception(
            function() {
                createStub(null, "prop");
            },
            {
                message: "Trying to stub property 'prop' of null"
            }
        );
    });

    it("throws a readable error if stubbing Symbol on null", function() {
        if (typeof Symbol === "function") {
            assert.exception(
                function() {
                    createStub(null, Symbol());
                },
                {
                    message: "Trying to stub property 'Symbol()' of null"
                }
            );
        }
    });

    it("should contain asynchronous versions of callsArg*, and yields* methods", function() {
        var stub = createStub.create();

        var syncVersions = 0;
        var asyncVersions = 0;

        for (var method in stub) {
            if (stub.hasOwnProperty(method) && method.match(/^(callsArg|yields)/)) {
                if (!method.match(/Async/)) {
                    syncVersions++;
                } else if (method.match(/Async/)) {
                    asyncVersions++;
                }
            }
        }

        assert.same(
            syncVersions,
            asyncVersions,
            "Stub prototype should contain same amount of synchronous and asynchronous methods"
        );
    });

    it("should allow overriding async behavior with sync behavior", function() {
        var stub = createStub();
        var callback = createSpy();

        stub.callsArgAsync(1);
        stub.callsArg(1);
        stub(1, callback);

        assert(callback.called);
    });

    it("should works with combination of withArgs arguments", function() {
        var stub = createStub();
        stub.returns(0);
        stub.withArgs(1, 1).returns(2);
        stub.withArgs(1).returns(1);

        assert.equals(stub(), 0);
        assert.equals(stub(1), 1);
        assert.equals(stub(1, 1), 2);
        assert.equals(stub(1, 1, 1), 2);
        assert.equals(stub(2), 0);
    });

    it("should work with combination of withArgs arguments", function() {
        var stub = createStub();

        stub.withArgs(1).returns(42);
        stub(1);

        refute.isNull(stub.withArgs(1).firstCall);
    });

    describe(".returns", function() {
        it("returns specified value", function() {
            var stub = createStub.create();
            var object = {};
            stub.returns(object);

            assert.same(stub(), object);
        });

        it("returns should return stub", function() {
            var stub = createStub.create();

            assert.same(stub.returns(""), stub);
        });

        it("returns undefined", function() {
            var stub = createStub.create();

            refute.defined(stub());
        });

        it("supersedes previous throws", function() {
            var stub = createStub.create();
            stub.throws().returns(1);

            refute.exception(function() {
                stub();
            });
        });

        it("throws only on the first call", function() {
            var stub = createStub.create();
            stub.returns("no exception");
            stub.onFirstCall().throws();

            assert.exception(function() {
                stub();
            });

            // on the second call there is no exception
            assert.same(stub(), "no exception");
        });
    });

    describe(".resolves", function() {
        afterEach(function() {
            if (Promise.resolve.restore) {
                Promise.resolve.restore();
            }
        });

        it("returns a promise to the specified value", function() {
            var stub = createStub.create();
            var object = {};
            stub.resolves(object);

            return stub().then(function(actual) {
                assert.same(actual, object);
            });
        });

        it("should return the same stub", function() {
            var stub = createStub.create();

            assert.same(stub.resolves(""), stub);
        });

        it("supersedes previous throws", function() {
            var stub = createStub.create();
            stub.throws().resolves(1);

            refute.exception(function() {
                stub();
            });
        });

        it("supersedes previous rejects", function() {
            var stub = createStub.create();
            stub.rejects(Error("should be superseeded")).resolves(1);

            return stub().then();
        });

        it("can be superseded by returns", function() {
            var stub = createStub.create();
            stub.resolves(2).returns(1);

            assert.equals(stub(), 1);
        });

        it("does not invoke Promise.resolve when the behavior is added to the stub", function() {
            var resolveSpy = createSpy(Promise, "resolve");
            var stub = createStub.create();
            stub.resolves(2);

            assert.equals(resolveSpy.callCount, 0);
        });
    });

    describe(".rejects", function() {
        afterEach(function() {
            if (Promise.reject.restore) {
                Promise.reject.restore();
            }
        });

        it("returns a promise which rejects for the specified reason", function() {
            var stub = createStub.create();
            var reason = new Error();
            stub.rejects(reason);

            return stub()
                .then(function() {
                    referee.fail("this should not resolve");
                })
                .catch(function(actual) {
                    assert.same(actual, reason);
                });
        });

        it("should return the same stub", function() {
            var stub = createStub.create();

            assert.same(stub.rejects({}), stub);
        });

        it("specifies exception message", function() {
            var stub = createStub.create();
            var message = "Oh no!";
            stub.rejects("Error", message);

            return stub()
                .then(function() {
                    referee.fail("Expected stub to reject");
                })
                .catch(function(reason) {
                    assert.equals(reason.message, message);
                });
        });

        it("does not specify exception message if not provided", function() {
            var stub = createStub.create();
            stub.rejects("Error");

            return stub()
                .then(function() {
                    referee.fail("Expected stub to reject");
                })
                .catch(function(reason) {
                    assert.equals(reason.message, "");
                });
        });

        it("rejects for a generic reason", function() {
            var stub = createStub.create();
            stub.rejects();

            return stub()
                .then(function() {
                    referee.fail("Expected stub to reject");
                })
                .catch(function(reason) {
                    assert.equals(reason.name, "Error");
                });
        });

        it("can be superseded by returns", function() {
            var stub = createStub.create();
            stub.rejects(2).returns(1);

            assert.equals(stub(), 1);
        });

        it("does not invoke Promise.reject when the behavior is added to the stub", function() {
            var rejectSpy = createSpy(Promise, "reject");
            var stub = createStub.create();
            stub.rejects(2);

            assert.equals(rejectSpy.callCount, 0);
        });
    });

    describe(".resolvesThis", function() {
        afterEach(function() {
            if (Promise.resolve.restore) {
                Promise.resolve.restore();
            }
        });

        it("returns a promise resolved with this", function() {
            var instance = {};
            instance.stub = createStub.create();
            instance.stub.resolvesThis();

            return instance.stub().then(function(actual) {
                assert.same(actual, instance);
            });
        });

        it("returns a promise resolved with the context bound with stub#call", function() {
            var stub = createStub.create();
            stub.resolvesThis();
            var object = {};

            return stub.call(object).then(function(actual) {
                assert.same(actual, object);
            });
        });

        it("returns a promise resolved with the context bound with stub#apply", function() {
            var stub = createStub.create();
            stub.resolvesThis();
            var object = {};

            return stub.apply(object).then(function(actual) {
                assert.same(actual, object);
            });
        });

        it("returns the stub itself, allowing to chain function calls", function() {
            var stub = createStub.create();

            assert.same(stub.resolvesThis(), stub);
        });

        it("overrides throws behavior for error objects", function() {
            var instance = {};
            instance.stub = createStub
                .create()
                .throws(new Error())
                .resolvesThis();

            return instance.stub().then(function(actual) {
                assert.same(actual, instance);
            });
        });

        it("overrides throws behavior for dynamically created errors", function() {
            var instance = {};
            instance.stub = createStub
                .create()
                .throws()
                .resolvesThis();

            return instance.stub().then(function(actual) {
                assert.same(actual, instance);
            });
        });
    });

    describe(".resolvesArg", function() {
        afterEach(function() {
            if (Promise.resolve.restore) {
                Promise.resolve.restore();
            }
        });

        it("returns a promise to the argument at specified index", function() {
            var stub = createStub.create();
            var object = {};
            stub.resolvesArg(0);

            return stub(object).then(function(actual) {
                assert.same(actual, object);
            });
        });

        it("returns a promise to the argument at another specified index", function() {
            var stub = createStub.create();
            var object = {};
            stub.resolvesArg(2);

            return stub("ignored", "ignored again", object).then(function(actual) {
                assert.same(actual, object);
            });
        });

        it("should return the same stub", function() {
            var stub = createStub.create();

            assert.same(stub.resolvesArg(1), stub);
        });

        it("supersedes previous throws", function() {
            var stub = createStub.create();
            stub.throws().resolvesArg(1);

            refute.exception(function() {
                stub("zero", "one");
            });
        });

        it("supersedes previous rejects", function() {
            var stub = createStub.create();
            stub.rejects(Error("should be superseeded")).resolvesArg(1);

            return stub("zero", "one").then(function(actual) {
                assert.same(actual, "one");
            });
        });

        it("does not invoke Promise.resolve when the behavior is added to the stub", function() {
            var resolveSpy = createSpy(Promise, "resolve");
            var stub = createStub.create();
            stub.resolvesArg(2);

            assert(resolveSpy.notCalled);
        });

        it("throws if index is not a number", function() {
            var stub = createStub.create();

            assert.exception(
                function() {
                    stub.resolvesArg();
                },
                { name: "TypeError" }
            );
        });

        it("throws without enough arguments", function() {
            var stub = createStub.create();
            stub.resolvesArg(3);

            assert.exception(
                function() {
                    stub("zero", "one", "two");
                },
                {
                    name: "TypeError",
                    message: "resolvesArg failed: 4 arguments required but only 3 present"
                }
            );
        });
    });

    describe(".returnsArg", function() {
        it("returns argument at specified index", function() {
            var stub = createStub.create();
            stub.returnsArg(0);
            var object = {};

            assert.same(stub(object), object);
        });

        it("returns stub", function() {
            var stub = createStub.create();

            assert.same(stub.returnsArg(0), stub);
        });

        it("throws if no index is specified", function() {
            var stub = createStub.create();

            assert.exception(
                function() {
                    stub.returnsArg();
                },
                { name: "TypeError" }
            );
        });

        it("should throw without enough arguments", function() {
            var stub = createStub.create();
            stub.returnsArg(3);

            assert.exception(
                function() {
                    stub("only", "two arguments");
                },
                {
                    name: "TypeError",
                    message: "returnsArg failed: 4 arguments required but only 2 present"
                }
            );
        });
    });

    describe(".throwsArg", function() {
        it("throws argument at specified index", function() {
            var stub = createStub.create();
            stub.throwsArg(0);
            var expectedError = new Error("The expected error message");

            assert.exception(
                function() {
                    stub(expectedError);
                },
                function(err) {
                    return err.message === expectedError.message;
                }
            );
        });

        it("returns stub", function() {
            var stub = createStub.create();

            assert.same(stub.throwsArg(0), stub);
        });

        it("throws TypeError if no index is specified", function() {
            var stub = createStub.create();

            assert.exception(
                function() {
                    stub.throwsArg();
                },
                { name: "TypeError" }
            );
        });

        it("should throw without enough arguments", function() {
            var stub = createStub.create();
            stub.throwsArg(3);

            assert.exception(
                function() {
                    stub("only", "two arguments");
                },
                {
                    name: "TypeError",
                    message: "throwsArg failed: 4 arguments required but only 2 present"
                }
            );
        });

        it("should work with call-based behavior", function() {
            var stub = createStub.create();
            var expectedError = new Error("catpants");

            stub.returns(1);
            stub.onSecondCall().throwsArg(1);

            refute.exception(function() {
                assert.equals(1, stub(null, expectedError));
            });

            assert.exception(
                function() {
                    stub(null, expectedError);
                },
                function(error) {
                    return error.message === expectedError.message;
                }
            );
        });

        it("should be reset by .resetBeahvior", function() {
            var stub = createStub.create();

            stub.throwsArg(0);
            stub.resetBehavior();

            refute.exception(function() {
                stub(new Error("catpants"));
            });
        });
    });

    describe(".returnsThis", function() {
        it("stub returns this", function() {
            var instance = {};
            instance.stub = createStub.create();
            instance.stub.returnsThis();

            assert.same(instance.stub(), instance);
        });

        var strictMode =
            (function() {
                return this;
            })() === undefined;
        if (strictMode) {
            it("stub returns undefined when detached", function() {
                var stub = createStub.create();
                stub.returnsThis();

                // Due to strict mode, would be `global` otherwise
                assert.same(stub(), undefined);
            });
        }

        it("stub respects call/apply", function() {
            var stub = createStub.create();
            stub.returnsThis();
            var object = {};

            assert.same(stub.call(object), object);
            assert.same(stub.apply(object), object);
        });

        it("returns stub", function() {
            var stub = createStub.create();

            assert.same(stub.returnsThis(), stub);
        });
    });

    describe(".usingPromise", function() {
        it("should exist and be a function", function() {
            var stub = createStub.create();

            assert(stub.usingPromise);
            assert.isFunction(stub.usingPromise);
        });

        it("should return the current stub", function() {
            var stub = createStub.create();

            assert.same(stub.usingPromise(Promise), stub);
        });

        it("should set the promise used by resolve", function() {
            var stub = createStub.create();
            var promise = {
                resolve: createStub.create().callsFake(function(value) {
                    return Promise.resolve(value);
                })
            };
            var object = {};

            stub.usingPromise(promise).resolves(object);

            return stub().then(function(actual) {
                assert.same(actual, object, "Same object resolved");
                assert.isTrue(promise.resolve.calledOnce, "Custom promise resolve called once");
                assert.isTrue(promise.resolve.calledWith(object), "Custom promise resolve called once with expected");
            });
        });

        it("should set the promise used by reject", function() {
            var stub = createStub.create();
            var promise = {
                reject: createStub.create().callsFake(function(err) {
                    return Promise.reject(err);
                })
            };
            var reason = new Error();

            stub.usingPromise(promise).rejects(reason);

            return stub()
                .then(function() {
                    referee.fail("this should not resolve");
                })
                .catch(function(actual) {
                    assert.same(actual, reason, "Same object resolved");
                    assert.isTrue(promise.reject.calledOnce, "Custom promise reject called once");
                    assert.isTrue(promise.reject.calledWith(reason), "Custom promise reject called once with expected");
                });
        });
    });

    describe(".throws", function() {
        it("throws specified exception", function() {
            var stub = createStub.create();
            var error = new Error();
            stub.throws(error);

            assert.exception(stub, error);
        });

        it("returns stub", function() {
            var stub = createStub.create();

            assert.same(stub.throws({}), stub);
        });

        it("sets type of exception to throw", function() {
            var stub = createStub.create();
            var exceptionType = "TypeError";
            stub.throws(exceptionType);

            assert.exception(function() {
                stub();
            }, exceptionType);
        });

        it("specifies exception message", function() {
            var stub = createStub.create();
            var message = "Oh no!";
            stub.throws("Error", message);

            assert.exception(stub, {
                message: message
            });
        });

        it("does not specify exception message if not provided", function() {
            var stub = createStub.create();
            stub.throws("Error");

            assert.exception(stub, {
                message: ""
            });
        });

        it("throws generic error", function() {
            var stub = createStub.create();
            stub.throws();

            assert.exception(stub, "Error");
        });

        it("throws an exception created using a function", function() {
            var stub = createStub.create();

            stub.throws(function() {
                return new Error("not implemented");
            });

            assert.exception(stub, {
                message: "not implemented"
            });
            assert.same(stub.firstCall.exception.message, "not implemented");
            assert.contains(stub.firstCall.toString(), "not implemented");
        });

        describe("lazy instantiation of exceptions", function() {
            var errorSpy;
            beforeEach(function() {
                this.originalError = global.Error;
                errorSpy = createSpy(global, "Error");
                // errorSpy starts with a call already made, not sure why
                errorSpy.resetHistory();
            });

            afterEach(function() {
                errorSpy.restore();
                global.Error = this.originalError;
            });

            it("uses a lazily created exception for the generic error", function() {
                var stub = createStub.create();
                stub.throws();

                assert.isFalse(errorSpy.called);
                assert.exception(stub, "Error");
                assert.isTrue(errorSpy.called);
            });

            it("uses a lazily created exception for the named error", function() {
                var stub = createStub.create();
                stub.throws("Named Error", "error message");

                assert.isFalse(errorSpy.called);
                assert.exception(stub, {
                    name: "Named Error",
                    message: "error message"
                });
                assert.isTrue(errorSpy.called);
            });

            it("uses a lazily created exception provided by a function", function() {
                var stub = createStub.create();

                stub.throws(function() {
                    return new Error("not implemented");
                });

                assert.isFalse(errorSpy.called);
                assert.exception(stub, {
                    message: "not implemented"
                });
                assert.isTrue(errorSpy.called);
            });

            it("does not use a lazily created exception if the error object is provided", function() {
                var stub = createStub.create();
                var exception = new Error();
                stub.throws(exception);

                assert.same(errorSpy.callCount, 1);
                assert.exception(stub, exception);
                assert.same(errorSpy.callCount, 1);
            });
        });

        it("resets 'invoking' flag", function() {
            var stub = createStub.create();
            stub.throws();

            assert.exception(stub);

            refute.defined(stub.invoking);
        });
    });

    describe(".callsArg", function() {
        beforeEach(function() {
            this.stub = createStub.create();
        });

        it("calls argument at specified index", function() {
            this.stub.callsArg(2);
            var callback = createStub.create();

            this.stub(1, 2, callback);

            assert(callback.called);
        });

        it("returns stub", function() {
            assert.isFunction(this.stub.callsArg(2));
        });

        it("throws if argument at specified index is not callable", function() {
            this.stub.callsArg(0);

            assert.exception(
                function() {
                    this.stub(1);
                },
                { name: "TypeError" }
            );
        });

        it("throws if no index is specified", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArg();
                },
                { name: "TypeError" }
            );
        });

        it("throws if index is not number", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArg({});
                },
                { name: "TypeError" }
            );
        });

        it("should throw without enough arguments", function() {
            var stub = createStub.create();
            stub.callsArg(3);

            assert.exception(
                function() {
                    stub("only", "two arguments");
                },
                {
                    name: "TypeError",
                    message: "callsArg failed: 4 arguments required but only 2 present"
                }
            );
        });

        it("returns result of invocant", function() {
            var stub = this.stub.callsArg(0);
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".callsArgWith", function() {
        beforeEach(function() {
            this.stub = createStub.create();
        });

        it("calls argument at specified index with provided args", function() {
            var object = {};
            this.stub.callsArgWith(1, object);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object));
        });

        it("returns function", function() {
            var stub = this.stub.callsArgWith(2, 3);

            assert.isFunction(stub);
        });

        it("calls callback without args", function() {
            this.stub.callsArgWith(1);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith());
        });

        it("calls callback with multiple args", function() {
            var object = {};
            var array = [];
            this.stub.callsArgWith(1, object, array);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object, array));
        });

        it("throws if no index is specified", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArgWith();
                },
                { name: "TypeError" }
            );
        });

        it("throws if index is not number", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArgWith({});
                },
                { name: "TypeError" }
            );
        });

        it("returns result of invocant", function() {
            var stub = this.stub.callsArgWith(0, "test");
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".callsArgOn", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = {
                foo: "bar"
            };
        });

        it("calls argument at specified index", function() {
            this.stub.callsArgOn(2, this.fakeContext);
            var callback = createStub.create();

            this.stub(1, 2, callback);

            assert(callback.called);
            assert(callback.calledOn(this.fakeContext));
        });

        it("calls argument at specified index with undefined context", function() {
            this.stub.callsArgOn(2, undefined);
            var callback = createStub.create();

            this.stub(1, 2, callback);

            assert(callback.called);
            assert(callback.calledOn(undefined));
        });

        it("calls argument at specified index with number context", function() {
            this.stub.callsArgOn(2, 5);
            var callback = createStub.create();

            this.stub(1, 2, callback);

            assert(callback.called);
            assert(callback.calledOn(5));
        });

        it("returns stub", function() {
            var stub = this.stub.callsArgOn(2, this.fakeContext);

            assert.isFunction(stub);
        });

        it("throws if argument at specified index is not callable", function() {
            this.stub.callsArgOn(0, this.fakeContext);

            assert.exception(
                function() {
                    this.stub(1);
                },
                { name: "TypeError" }
            );
        });

        it("throws if no index is specified", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArgOn();
                },
                { name: "TypeError" }
            );
        });

        it("throws if index is not number", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArgOn(this.fakeContext, 2);
                },
                { name: "TypeError" }
            );
        });

        it("returns result of invocant", function() {
            var stub = this.stub.callsArgOn(0, this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
            assert(callback.calledOn(this.fakeContext));
        });
    });

    describe(".callsArgOnWith", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = { foo: "bar" };
        });

        it("calls argument at specified index with provided args", function() {
            var object = {};
            this.stub.callsArgOnWith(1, this.fakeContext, object);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object));
            assert(callback.calledOn(this.fakeContext));
        });

        it("calls argument at specified index with provided args and undefined context", function() {
            var object = {};
            this.stub.callsArgOnWith(1, undefined, object);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object));
            assert(callback.calledOn(undefined));
        });

        it("calls argument at specified index with provided args and number context", function() {
            var object = {};
            this.stub.callsArgOnWith(1, 5, object);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object));
            assert(callback.calledOn(5));
        });

        it("calls argument at specified index with provided args with undefined context", function() {
            var object = {};
            this.stub.callsArgOnWith(1, undefined, object);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object));
            assert(callback.calledOn(undefined));
        });

        it("calls argument at specified index with provided args with number context", function() {
            var object = {};
            this.stub.callsArgOnWith(1, 5, object);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object));
            assert(callback.calledOn(5));
        });

        it("returns function", function() {
            var stub = this.stub.callsArgOnWith(2, this.fakeContext, 3);

            assert.isFunction(stub);
        });

        it("calls callback without args", function() {
            this.stub.callsArgOnWith(1, this.fakeContext);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith());
            assert(callback.calledOn(this.fakeContext));
        });

        it("calls callback with multiple args", function() {
            var object = {};
            var array = [];
            this.stub.callsArgOnWith(1, this.fakeContext, object, array);
            var callback = createStub.create();

            this.stub(1, callback);

            assert(callback.calledWith(object, array));
            assert(callback.calledOn(this.fakeContext));
        });

        it("throws if no index is specified", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArgOnWith();
                },
                { name: "TypeError" }
            );
        });

        it("throws if index is not number", function() {
            var stub = this.stub;

            assert.exception(
                function() {
                    stub.callsArgOnWith({});
                },
                { name: "TypeError" }
            );
        });

        it("returns result of invocant", function() {
            var object = {};
            var stub = this.stub.callsArgOnWith(0, this.fakeContext, object);
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
            assert(callback.calledWith(object));
        });
    });

    describe(".callsFake", function() {
        beforeEach(function() {
            this.method = function() {
                throw new Error("Should be stubbed");
            };
            this.object = { method: this.method };
        });

        it("uses provided function as stub", function() {
            var fakeFn = createStub.create();
            this.stub = createStub(this.object, "method");

            this.stub.callsFake(fakeFn);
            this.object.method(1, 2);

            assert(fakeFn.calledWith(1, 2));
            assert(fakeFn.calledOn(this.object));
        });

        it("is overwritten by subsequent stub behavior", function() {
            var fakeFn = createStub.create();
            this.stub = createStub(this.object, "method");

            this.stub.callsFake(fakeFn).returns(3);
            var returned = this.object.method(1, 2);

            refute(fakeFn.called);
            assert(returned === 3);
        });
    });

    describe(".objectMethod", function() {
        beforeEach(function() {
            this.method = function() {
                return;
            };
            this.object = { method: this.method };
        });

        afterEach(function() {
            if (global.console.info.restore) {
                global.console.info.restore();
            }
        });

        it("throws when third argument is provided", function() {
            var object = this.object;

            assert.exception(
                function() {
                    createStub(object, "method", 1);
                },
                { message: "stub(obj, 'meth', fn) has been removed, see documentation" },
                { name: "TypeError" }
            );
        });

        it("stubbed method should be proper stub", function() {
            var stub = createStub(this.object, "method");

            assert.isFunction(stub.returns);
            assert.isFunction(stub.throws);
        });

        it("stub should be spy", function() {
            var stub = createStub(this.object, "method");
            this.object.method();

            assert(stub.called);
            assert(stub.calledOn(this.object));
        });

        it("stub should affect spy", function() {
            var stub = createStub(this.object, "method");
            stub.throws("TypeError");

            assert.exception(this.object.method);

            assert(stub.threw("TypeError"));
        });

        it("handles threw properly for lazily instantiated Errors", function() {
            var stub = createStub(this.object, "method");
            stub.throws(function() {
                return new TypeError();
            });

            assert.exception(this.object.method);

            assert(stub.threw("TypeError"));
        });

        it("returns standalone stub without arguments", function() {
            var stub = createStub();

            assert.isFunction(stub);
            assert.isFalse(stub.called);
        });

        it("successfully stubs falsey properties", function() {
            var obj = {
                0: function() {
                    return;
                }
            };

            createStub(obj, 0).callsFake(function() {
                return "stubbed value";
            });

            assert.equals(obj[0](), "stubbed value");
        });

        it("does not stub string", function() {
            assert.exception(function() {
                createStub("test");
            });
        });
    });

    describe("everything", function() {
        it("stubs all methods of object without property", function() {
            var obj = {
                func1: function() {
                    return;
                },
                func2: function() {
                    return;
                },
                func3: function() {
                    return;
                }
            };

            createStub(obj);

            assert.isFunction(obj.func1.restore);
            assert.isFunction(obj.func2.restore);
            assert.isFunction(obj.func3.restore);
        });

        it("stubs prototype methods", function() {
            function Obj() {
                return;
            }
            Obj.prototype.func1 = function() {
                return;
            };
            var obj = new Obj();

            createStub(obj);

            assert.isFunction(obj.func1.restore);
        });

        it("returns object", function() {
            var object = {};

            assert.same(createStub(object), object);
        });

        it("returns function", function() {
            var func = function() {
                return;
            };

            assert.same(createStub(func), func);
        });

        it("stubs methods of function", function() {
            var func = function() {
                return;
            };
            func.func1 = function() {
                return;
            };
            // eslint-disable-next-line no-proto
            func.__proto__.func2 = function() {
                return;
            };

            createStub(func);

            assert.isFunction(func.func1.restore);
            assert.isFunction(func.func2.restore);
        });

        it("only stubs functions", function() {
            var object = { foo: "bar" };
            createStub(object);

            assert.equals(object.foo, "bar");
        });

        it("handles non-enumerable properties", function() {
            var obj = {
                func1: function() {
                    return;
                },
                func2: function() {
                    return;
                }
            };

            Object.defineProperty(obj, "func3", {
                value: function() {
                    return;
                },
                writable: true,
                configurable: true
            });

            createStub(obj);

            assert.isFunction(obj.func1.restore);
            assert.isFunction(obj.func2.restore);
            assert.isFunction(obj.func3.restore);
        });

        it("handles non-enumerable properties on prototypes", function() {
            function Obj() {
                return;
            }
            Object.defineProperty(Obj.prototype, "func1", {
                value: function() {
                    return;
                },
                writable: true,
                configurable: true
            });

            var obj = new Obj();

            createStub(obj);

            assert.isFunction(obj.func1.restore);
        });

        it("does not stub non-enumerable properties from Object.prototype", function() {
            var obj = {};

            createStub(obj);

            refute.isFunction(obj.toString.restore);
            refute.isFunction(obj.toLocaleString.restore);
            refute.isFunction(obj.propertyIsEnumerable.restore);
        });

        it("does not fail on overrides", function() {
            var parent = {
                func: function() {
                    return;
                }
            };
            var child = Object.create(parent);
            child.func = function() {
                return;
            };

            refute.exception(function() {
                createStub(child);
            });
        });

        it("does not call getter during restore", function() {
            var obj = {
                get prop() {
                    fail("should not call getter");
                    return;
                }
            };

            var stub = createStub(obj, "prop").get(function() {
                return 43;
            });
            assert.equals(obj.prop, 43);

            stub.restore();
        });

        it("throws if stubbing non-existent property", function() {
            var myObj = {};

            assert.exception(function() {
                createStub(myObj, "ouch");
            });

            refute.defined(myObj.ouch);
        });
    });

    describe("stubbed function", function() {
        it("has toString method", function() {
            var obj = {
                meth: function() {
                    return;
                }
            };
            createStub(obj, "meth");

            assert.equals(obj.meth.toString(), "meth");
        });

        it("toString should say 'stub' when unable to infer name", function() {
            var stub = createStub();

            assert.equals(stub.toString(), "stub");
        });

        it("toString should prefer property name if possible", function() {
            var obj = {};
            obj.meth = createStub();
            obj.meth();

            assert.equals(obj.meth.toString(), "meth");
        });
    });

    describe(".yields", function() {
        it("invokes only argument as callback", function() {
            var stub = createStub().yields();
            var spy = createSpy();
            stub(spy);

            assert(spy.calledOnce);
            assert.equals(spy.args[0].length, 0);
        });

        it("throws understandable error if no callback is passed", function() {
            var stub = createStub().yields();

            assert.exception(stub, {
                message: "stub expected to yield, but no callback was passed."
            });
        });

        it("includes stub name and actual arguments in error", function() {
            var myObj = {
                somethingAwesome: function() {
                    return;
                }
            };
            var stub = createStub(myObj, "somethingAwesome").yields();

            assert.exception(
                function() {
                    stub(23, 42);
                },
                {
                    message: "somethingAwesome expected to yield, but no callback was passed. Received [23, 42]"
                }
            );
        });

        it("invokes last argument as callback", function() {
            var stub = createStub().yields();
            var spy = createSpy();
            stub(24, {}, spy);

            assert(spy.calledOnce);
            assert.equals(spy.args[0].length, 0);
        });

        it("invokes first of two callbacks", function() {
            var stub = createStub().yields();
            var spy = createSpy();
            var spy2 = createSpy();
            stub(24, {}, spy, spy2);

            assert(spy.calledOnce);
            assert(!spy2.called);
        });

        it("invokes callback with arguments", function() {
            var obj = { id: 42 };
            var stub = createStub().yields(obj, "Crazy");
            var spy = createSpy();
            stub(spy);

            assert(spy.calledWith(obj, "Crazy"));
        });

        it("throws if callback throws", function() {
            var obj = { id: 42 };
            var stub = createStub().yields(obj, "Crazy");
            var callback = createStub().throws();

            assert.exception(function() {
                stub(callback);
            });
        });

        it("throws takes precedent over yielded return value", function() {
            var stub = createStub()
                .throws()
                .yields();
            var callback = createStub().returns("return value");

            assert.exception(function() {
                stub(callback);
            });
            assert(callback.calledOnce);
        });

        it("returns takes precedent over yielded return value", function() {
            var obj = {};
            var stub = createStub()
                .returns(obj)
                .yields();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), obj);
            assert(callback.calledOnce);
        });

        it("returnsArg takes precedent over yielded return value", function() {
            var stub = createStub()
                .returnsArg(0)
                .yields();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), callback);
            assert(callback.calledOnce);
        });

        it("returnsThis takes precedent over yielded return value", function() {
            var obj = {};
            var stub = createStub()
                .returnsThis()
                .yields();
            var callback = createStub().returns("return value");

            assert.same(stub.call(obj, callback), obj);
            assert(callback.calledOnce);
        });

        it("returns the result of the yielded callback", function() {
            var stub = createStub().yields();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".yieldsRight", function() {
        it("invokes only argument as callback", function() {
            var stub = createStub().yieldsRight();
            var spy = createSpy();
            stub(spy);

            assert(spy.calledOnce);
            assert.equals(spy.args[0].length, 0);
        });

        it("throws understandable error if no callback is passed", function() {
            var stub = createStub().yieldsRight();

            assert.exception(stub, {
                message: "stub expected to yield, but no callback was passed."
            });
        });

        it("includes stub name and actual arguments in error", function() {
            var myObj = {
                somethingAwesome: function() {
                    return;
                }
            };
            var stub = createStub(myObj, "somethingAwesome").yieldsRight();

            assert.exception(
                function() {
                    stub(23, 42);
                },
                {
                    message: "somethingAwesome expected to yield, but no callback was passed. Received [23, 42]"
                }
            );
        });

        it("invokes last argument as callback", function() {
            var stub = createStub().yieldsRight();
            var spy = createSpy();
            stub(24, {}, spy);

            assert(spy.calledOnce);
            assert.equals(spy.args[0].length, 0);
        });

        it("invokes the last of two callbacks", function() {
            var stub = createStub().yieldsRight();
            var spy = createSpy();
            var spy2 = createSpy();
            stub(24, {}, spy, spy2);

            assert(!spy.called);
            assert(spy2.calledOnce);
        });

        it("invokes callback with arguments", function() {
            var obj = { id: 42 };
            var stub = createStub().yieldsRight(obj, "Crazy");
            var spy = createSpy();
            stub(spy);

            assert(spy.calledWith(obj, "Crazy"));
        });

        it("throws if callback throws", function() {
            var obj = { id: 42 };
            var stub = createStub().yieldsRight(obj, "Crazy");
            var callback = createStub().throws();

            assert.exception(function() {
                stub(callback);
            });
        });

        it("throws takes precedent over yielded return value", function() {
            var stub = createStub()
                .yieldsRight()
                .throws();
            var callback = createStub().returns("return value");

            assert.exception(function() {
                stub(callback);
            });
            assert(callback.calledOnce);
        });

        it("returns takes precedent over yielded return value", function() {
            var obj = {};
            var stub = createStub()
                .returns(obj)
                .yieldsRight();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), obj);
            assert(callback.calledOnce);
        });

        it("returnsArg takes precedent over yielded return value", function() {
            var stub = createStub()
                .returnsArg(0)
                .yieldsRight();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), callback);
            assert(callback.calledOnce);
        });

        it("returnsThis takes precedent over yielded return value", function() {
            var obj = {};
            var stub = createStub()
                .returnsThis()
                .yieldsRight();
            var callback = createStub().returns("return value");

            assert.same(stub.call(obj, callback), obj);
            assert(callback.calledOnce);
        });

        it("returns the result of the yielded callback", function() {
            var stub = createStub().yields();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".yieldsOn", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = { foo: "bar" };
        });

        it("invokes only argument as callback", function() {
            var spy = createSpy();

            this.stub.yieldsOn(this.fakeContext);
            this.stub(spy);

            assert(spy.calledOnce);
            assert(spy.calledOn(this.fakeContext));
            assert.equals(spy.args[0].length, 0);
        });

        it("throws if no context is specified", function() {
            assert.exception(
                function() {
                    this.stub.yieldsOn();
                },
                { name: "TypeError" }
            );
        });

        it("throws understandable error if no callback is passed", function() {
            this.stub.yieldsOn(this.fakeContext);

            assert.exception(this.stub, {
                message: "stub expected to yield, but no callback was passed."
            });
        });

        it("includes stub name and actual arguments in error", function() {
            var myObj = {
                somethingAwesome: function() {
                    return;
                }
            };
            var stub = createStub(myObj, "somethingAwesome").yieldsOn(this.fakeContext);

            assert.exception(
                function() {
                    stub(23, 42);
                },
                {
                    message: "somethingAwesome expected to yield, but no callback was passed. Received [23, 42]"
                }
            );
        });

        it("invokes last argument as callback", function() {
            var spy = createSpy();
            this.stub.yieldsOn(this.fakeContext);

            this.stub(24, {}, spy);

            assert(spy.calledOnce);
            assert(spy.calledOn(this.fakeContext));
            assert.equals(spy.args[0].length, 0);
        });

        it("invokes first of two callbacks", function() {
            var spy = createSpy();
            var spy2 = createSpy();

            this.stub.yieldsOn(this.fakeContext);
            this.stub(24, {}, spy, spy2);

            assert(spy.calledOnce);
            assert(spy.calledOn(this.fakeContext));
            assert(!spy2.called);
        });

        it("invokes callback with arguments", function() {
            var obj = { id: 42 };
            var spy = createSpy();

            this.stub.yieldsOn(this.fakeContext, obj, "Crazy");
            this.stub(spy);

            assert(spy.calledWith(obj, "Crazy"));
            assert(spy.calledOn(this.fakeContext));
        });

        it("throws if callback throws", function() {
            var obj = { id: 42 };
            var callback = createStub().throws();

            this.stub.yieldsOn(this.fakeContext, obj, "Crazy");

            assert.exception(function() {
                this.stub(callback);
            });
        });

        it("throws takes precedent over yielded return value", function() {
            var stub = this.stub.throws().yieldsOn(this.fakeContext);
            var callback = createStub().returns("return value");

            assert.exception(function() {
                stub(callback);
            });
            assert(callback.calledOnce);
        });

        it("returns takes precedent over yielded return value", function() {
            var obj = {};
            var stub = this.stub.returns(obj).yieldsOn(this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub(callback), obj);
            assert(callback.calledOnce);
        });

        it("returnsArg takes precedent over yielded return value", function() {
            var stub = this.stub.returnsArg(0).yieldsOn();
            var callback = createStub().returns("return value");

            assert.same(stub(callback), callback);
            assert(callback.calledOnce);
        });

        it("returnsThis takes precedent over yielded return value", function() {
            var obj = {};
            var stub = this.stub.returnsThis().yieldsOn(this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub.call(obj, callback), obj);
            assert(callback.calledOnce);
        });

        it("returns the result of the yielded callback", function() {
            var stub = this.stub.yieldsOn(this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub(callback), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".yieldsTo", function() {
        it("yields to property of object argument", function() {
            var stub = createStub().yieldsTo("success");
            var callback = createSpy();

            stub({ success: callback });

            assert(callback.calledOnce);
            assert.equals(callback.args[0].length, 0);
        });

        it("throws understandable error if no object with callback is passed", function() {
            var stub = createStub().yieldsTo("success");

            assert.exception(stub, {
                message: "stub expected to yield to 'success', but no object with such a property was passed."
            });
        });

        it("throws understandable error if failing to yield callback by symbol", function() {
            if (typeof Symbol === "function") {
                var symbol = Symbol();

                var stub = createStub().yieldsTo(symbol);

                assert.exception(stub, {
                    message: "stub expected to yield to 'Symbol()', but no object with such a property was passed."
                });
            }
        });

        it("includes stub name and actual arguments in error", function() {
            var myObj = {
                somethingAwesome: function() {
                    return;
                }
            };
            var stub = createStub(myObj, "somethingAwesome").yieldsTo("success");

            assert.exception(
                function() {
                    stub(23, 42);
                },
                {
                    message:
                        "somethingAwesome expected to yield to 'success', but " +
                        "no object with such a property was passed. " +
                        "Received [23, 42]"
                }
            );
        });

        it("invokes property on last argument as callback", function() {
            var stub = createStub().yieldsTo("success");
            var callback = createSpy();
            stub(24, {}, { success: callback });

            assert(callback.calledOnce);
            assert.equals(callback.args[0].length, 0);
        });

        it("invokes first of two possible callbacks", function() {
            var stub = createStub().yieldsTo("error");
            var callback = createSpy();
            var callback2 = createSpy();
            stub(24, {}, { error: callback }, { error: callback2 });

            assert(callback.calledOnce);
            assert(!callback2.called);
        });

        it("invokes callback with arguments", function() {
            var obj = { id: 42 };
            var stub = createStub().yieldsTo("success", obj, "Crazy");
            var callback = createSpy();
            stub({ success: callback });

            assert(callback.calledWith(obj, "Crazy"));
        });

        it("throws if callback throws", function() {
            var obj = { id: 42 };
            var stub = createStub().yieldsTo("error", obj, "Crazy");
            var callback = createStub().throws();

            assert.exception(function() {
                stub({ error: callback });
            });
        });

        it("throws takes precedent over yielded return value", function() {
            var stub = createStub()
                .throws()
                .yieldsTo("success");
            var callback = createStub().returns("return value");

            assert.exception(function() {
                stub({ success: callback });
            });
            assert(callback.calledOnce);
        });

        it("returns takes precedent over yielded return value", function() {
            var obj = {};
            var stub = createStub()
                .returns(obj)
                .yieldsTo("success");
            var callback = createStub().returns("return value");

            assert.same(stub({ success: callback }), obj);
            assert(callback.calledOnce);
        });

        it("returnsArg takes precedent over yielded return value", function() {
            var stub = createStub()
                .returnsArg(0)
                .yieldsTo("success");
            var callback = createStub().returns("return value");

            assert.equals(stub({ success: callback }), { success: callback });
            assert(callback.calledOnce);
        });

        it("returnsThis takes precedent over yielded return value", function() {
            var obj = {};
            var stub = createStub()
                .returnsThis()
                .yieldsTo("success");
            var callback = createStub().returns("return value");

            assert.same(stub.call(obj, { success: callback }), obj);
            assert(callback.calledOnce);
        });

        it("returns the result of the yielded callback", function() {
            var stub = createStub().yieldsTo("success");
            var callback = createStub().returns("return value");

            assert.same(stub({ success: callback }), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".yieldsToOn", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = { foo: "bar" };
        });

        it("yields to property of object argument", function() {
            this.stub.yieldsToOn("success", this.fakeContext);
            var callback = createSpy();

            this.stub({ success: callback });

            assert(callback.calledOnce);
            assert(callback.calledOn(this.fakeContext));
            assert.equals(callback.args[0].length, 0);
        });

        it("yields to property of object argument with undefined context", function() {
            this.stub.yieldsToOn("success", undefined);
            var callback = createSpy();

            this.stub({ success: callback });

            assert(callback.calledOnce);
            assert(callback.calledOn(undefined));
            assert.equals(callback.args[0].length, 0);
        });

        it("yields to property of object argument with number context", function() {
            this.stub.yieldsToOn("success", 5);
            var callback = createSpy();

            this.stub({ success: callback });

            assert(callback.calledOnce);
            assert(callback.calledOn(5));
            assert.equals(callback.args[0].length, 0);
        });

        it("throws understandable error if no object with callback is passed", function() {
            this.stub.yieldsToOn("success", this.fakeContext);

            assert.exception(this.stub, {
                message: "stub expected to yield to 'success', but no object with such a property was passed."
            });
        });

        it("includes stub name and actual arguments in error", function() {
            var myObj = {
                somethingAwesome: function() {
                    return;
                }
            };
            var stub = createStub(myObj, "somethingAwesome").yieldsToOn("success", this.fakeContext);

            assert.exception(
                function() {
                    stub(23, 42);
                },
                {
                    message:
                        "somethingAwesome expected to yield to 'success', but " +
                        "no object with such a property was passed. " +
                        "Received [23, 42]"
                }
            );
        });

        it("invokes property on last argument as callback", function() {
            var callback = createSpy();

            this.stub.yieldsToOn("success", this.fakeContext);
            this.stub(24, {}, { success: callback });

            assert(callback.calledOnce);
            assert(callback.calledOn(this.fakeContext));
            assert.equals(callback.args[0].length, 0);
        });

        it("invokes first of two possible callbacks", function() {
            var callback = createSpy();
            var callback2 = createSpy();

            this.stub.yieldsToOn("error", this.fakeContext);
            this.stub(24, {}, { error: callback }, { error: callback2 });

            assert(callback.calledOnce);
            assert(callback.calledOn(this.fakeContext));
            assert(!callback2.called);
        });

        it("invokes callback with arguments", function() {
            var obj = { id: 42 };
            var callback = createSpy();

            this.stub.yieldsToOn("success", this.fakeContext, obj, "Crazy");
            this.stub({ success: callback });

            assert(callback.calledOn(this.fakeContext));
            assert(callback.calledWith(obj, "Crazy"));
        });

        it("throws if callback throws", function() {
            var obj = { id: 42 };
            var callback = createStub().throws();

            this.stub.yieldsToOn("error", this.fakeContext, obj, "Crazy");

            assert.exception(function() {
                this.stub({ error: callback });
            });
        });

        it("throws takes precedent over yielded return value", function() {
            var stub = this.stub.throws().yieldsToOn("success", this.fakeContext);
            var callback = createStub().returns("return value");

            assert.exception(function() {
                stub({ success: callback });
            });
            assert(callback.calledOnce);
        });

        it("returns takes precedent over yielded return value", function() {
            var obj = {};
            var stub = this.stub.returns(obj).yieldsToOn("success", this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub({ success: callback }), obj);
            assert(callback.calledOnce);
        });

        it("returnsArg takes precedent over yielded return value", function() {
            var stub = this.stub.returnsArg(0).yieldsToOn("success", this.fakeContext);
            var callback = createStub().returns("return value");

            assert.equals(stub({ success: callback }), { success: callback });
            assert(callback.calledOnce);
        });

        it("returnsThis takes precedent over yielded return value", function() {
            var obj = {};
            var stub = this.stub.returnsThis().yieldsToOn("success", this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub.call(obj, { success: callback }), obj);
            assert(callback.calledOnce);
        });

        it("returns the result of the yielded callback", function() {
            var stub = this.stub.yieldsToOn("success", this.fakeContext);
            var callback = createStub().returns("return value");

            assert.same(stub({ success: callback }), "return value");
            assert(callback.calledOnce);
        });
    });

    describe(".withArgs", function() {
        it("defines withArgs method", function() {
            var stub = createStub();

            assert.isFunction(stub.withArgs);
        });

        it("creates filtered stub", function() {
            var stub = createStub();
            var other = stub.withArgs(23);

            refute.same(other, stub);
            assert.isFunction(stub.returns);
            assert.isFunction(other.returns);
        });

        it("filters return values based on arguments", function() {
            var stub = createStub().returns(23);
            stub.withArgs(42).returns(99);

            assert.equals(stub(), 23);
            assert.equals(stub(42), 99);
        });

        it("filters exceptions based on arguments", function() {
            var stub = createStub().returns(23);
            stub.withArgs(42).throws();

            refute.exception(stub);
            assert.exception(function() {
                stub(42);
            });
        });

        it("ensure stub recognizes samsam match fuzzy arguments", function() {
            var stub = createStub().returns(23);
            stub.withArgs(match({ foo: "bar" })).returns(99);

            assert.equals(stub(), 23);
            assert.equals(stub({ foo: "bar", bar: "foo" }), 99);
        });

        it("ensure stub uses last matching arguments", function() {
            var unmatchedValue = "d3ada6a0-8dac-4136-956d-033b5f23eadf";
            var firstMatchedValue = "68128619-a639-4b32-a4a0-6519165bf301";
            var secondMatchedValue = "4ac2dc8f-3f3f-4648-9838-a2825fd94c9a";
            var expectedArgument = "3e1ed1ec-c377-4432-a33e-3c937f1406d1";

            var stub = createStub().returns(unmatchedValue);

            stub.withArgs(expectedArgument).returns(firstMatchedValue);
            stub.withArgs(expectedArgument).returns(secondMatchedValue);

            assert.equals(stub(), unmatchedValue);
            assert.equals(stub(expectedArgument), secondMatchedValue);
        });

        it("ensure stub uses last matching samsam match arguments", function() {
            var unmatchedValue = "0aa66a7d-3c50-49ef-8365-bdcab637b2dd";
            var firstMatchedValue = "1ab2c601-7602-4658-9377-3346f6814caa";
            var secondMatchedValue = "e2e31518-c4c4-4012-a61f-31942f603ffa";
            var expectedArgument = "90dc4a22-ef53-4c62-8e05-4cf4b4bf42fa";

            var stub = createStub().returns(unmatchedValue);
            stub.withArgs(expectedArgument).returns(firstMatchedValue);
            stub.withArgs(match(expectedArgument)).returns(secondMatchedValue);

            assert.equals(stub(), unmatchedValue);
            assert.equals(stub(expectedArgument), secondMatchedValue);
        });
    });

    describe(".callsArgAsync", function() {
        beforeEach(function() {
            this.stub = createStub.create();
        });

        it("asynchronously calls argument at specified index", function(done) {
            this.stub.callsArgAsync(2);
            var callback = createSpy(done);

            this.stub(1, 2, callback);

            assert(!callback.called);
        });
    });

    describe(".callsArgWithAsync", function() {
        beforeEach(function() {
            this.stub = createStub.create();
        });

        it("asynchronously calls callback at specified index with multiple args", function(done) {
            var object = {};
            var array = [];
            this.stub.callsArgWithAsync(1, object, array);

            var callback = createSpy(function() {
                assert(callback.calledWith(object, array));
                done();
            });

            this.stub(1, callback);

            assert(!callback.called);
        });
    });

    describe(".callsArgOnAsync", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = {
                foo: "bar"
            };
        });

        it("asynchronously calls argument at specified index with specified context", function(done) {
            var context = this.fakeContext;
            this.stub.callsArgOnAsync(2, context);

            var callback = createSpy(function() {
                assert(callback.calledOn(context));
                done();
            });

            this.stub(1, 2, callback);

            assert(!callback.called);
        });
    });

    describe(".callsArgOnWithAsync", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = { foo: "bar" };
        });

        it("asynchronously calls argument at specified index with provided context and args", function(done) {
            var object = {};
            var context = this.fakeContext;
            this.stub.callsArgOnWithAsync(1, context, object);

            var callback = createSpy(function() {
                assert(callback.calledOn(context));
                assert(callback.calledWith(object));
                done();
            });

            this.stub(1, callback);

            assert(!callback.called);
        });
    });

    describe(".yieldsAsync", function() {
        it("asynchronously invokes only argument as callback", function(done) {
            var stub = createStub().yieldsAsync();

            var spy = createSpy(done);

            stub(spy);

            assert(!spy.called);
        });
    });

    describe(".yieldsOnAsync", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = { foo: "bar" };
        });

        it("asynchronously invokes only argument as callback with given context", function(done) {
            var context = this.fakeContext;
            this.stub.yieldsOnAsync(context);

            var spy = createSpy(function() {
                assert(spy.calledOnce);
                assert(spy.calledOn(context));
                assert.equals(spy.args[0].length, 0);
                done();
            });

            this.stub(spy);

            assert(!spy.called);
        });
    });

    describe(".yieldsToAsync", function() {
        it("asynchronously yields to property of object argument", function(done) {
            var stub = createStub().yieldsToAsync("success");

            var callback = createSpy(function() {
                assert(callback.calledOnce);
                assert.equals(callback.args[0].length, 0);
                done();
            });

            stub({ success: callback });

            assert(!callback.called);
        });
    });

    describe(".yieldsToOnAsync", function() {
        beforeEach(function() {
            this.stub = createStub.create();
            this.fakeContext = { foo: "bar" };
        });

        it("asynchronously yields to property of object argument with given context", function(done) {
            var context = this.fakeContext;
            this.stub.yieldsToOnAsync("success", context);

            var callback = createSpy(function() {
                assert(callback.calledOnce);
                assert(callback.calledOn(context));
                assert.equals(callback.args[0].length, 0);
                done();
            });

            this.stub({ success: callback });
            assert(!callback.called);
        });
    });

    describe(".onCall", function() {
        it("can be used with returns to produce sequence", function() {
            var stub = createStub().returns(3);
            stub.onFirstCall()
                .returns(1)
                .onCall(2)
                .returns(2);

            assert.same(stub(), 1);
            assert.same(stub(), 3);
            assert.same(stub(), 2);
            assert.same(stub(), 3);
        });

        it("can be used with returnsArg to produce sequence", function() {
            var stub = createStub().returns("default");
            stub.onSecondCall().returnsArg(0);

            assert.same(stub(1), "default");
            assert.same(stub(2), 2);
            assert.same(stub(3), "default");
        });

        it("can be used with returnsThis to produce sequence", function() {
            var instance = {};
            instance.stub = createStub().returns("default");
            instance.stub.onSecondCall().returnsThis();

            assert.same(instance.stub(), "default");
            assert.same(instance.stub(), instance);
            assert.same(instance.stub(), "default");
        });

        it("can be used with throwsException to produce sequence", function() {
            var stub = createStub();
            var error = new Error();
            stub.onSecondCall().throwsException(error);

            stub();

            assert.exception(stub, function(e) {
                return e === error;
            });
        });

        it("supports chained declaration of behavior", function() {
            var stub = createStub()
                .onCall(0)
                .returns(1)
                .onCall(1)
                .returns(2)
                .onCall(2)
                .returns(3);

            assert.same(stub(), 1);
            assert.same(stub(), 2);
            assert.same(stub(), 3);
        });

        describe("in combination with withArgs", function() {
            it("can produce a sequence for a fake", function() {
                var stub = createStub().returns(0);
                stub.withArgs(5)
                    .returns(-1)
                    .onFirstCall()
                    .returns(1)
                    .onSecondCall()
                    .returns(2);

                assert.same(stub(0), 0);
                assert.same(stub(5), 1);
                assert.same(stub(0), 0);
                assert.same(stub(5), 2);
                assert.same(stub(5), -1);
            });

            it("falls back to stub default behaviour if fake does not have its own default behaviour", function() {
                var stub = createStub().returns(0);
                stub.withArgs(5)
                    .onFirstCall()
                    .returns(1);

                assert.same(stub(5), 1);
                assert.same(stub(5), 0);
            });

            it("falls back to stub behaviour for call if fake does not have its own behaviour for call", function() {
                var stub = createStub().returns(0);
                stub.withArgs(5)
                    .onFirstCall()
                    .returns(1);
                stub.onSecondCall().returns(2);

                assert.same(stub(5), 1);
                assert.same(stub(5), 2);
                assert.same(stub(4), 0);
            });

            it("defaults to undefined behaviour once no more calls have been defined", function() {
                var stub = createStub();
                stub.withArgs(5)
                    .onFirstCall()
                    .returns(1)
                    .onSecondCall()
                    .returns(2);

                assert.same(stub(5), 1);
                assert.same(stub(5), 2);
                refute.defined(stub(5));
            });

            it("does not create undefined behaviour just by calling onCall", function() {
                var stub = createStub().returns(2);
                stub.onFirstCall();

                assert.same(stub(6), 2);
            });

            it("works with fakes and reset", function() {
                var stub = createStub();
                stub.withArgs(5)
                    .onFirstCall()
                    .returns(1);
                stub.withArgs(5)
                    .onSecondCall()
                    .returns(2);

                assert.same(stub(5), 1);
                assert.same(stub(5), 2);
                refute.defined(stub(5));

                stub.reset();

                assert.same(stub(5), undefined);
                assert.same(stub(5), undefined);
                refute.defined(stub(5));
            });

            it("throws an understandable error when trying to use withArgs on behavior", function() {
                assert.exception(
                    function() {
                        createStub()
                            .onFirstCall()
                            .withArgs(1);
                    },
                    {
                        message: /not supported/
                    }
                );
            });
        });

        it("can be used with yields* to produce a sequence", function() {
            var context = { foo: "bar" };
            var obj = { method1: createSpy(), method2: createSpy() };
            var obj2 = { method2: createSpy() };
            var stub = createStub().yieldsToOn("method2", context, 7, 8);
            stub.onFirstCall()
                .yields(1, 2)
                .onSecondCall()
                .yieldsOn(context, 3, 4)
                .onThirdCall()
                .yieldsTo("method1", 5, 6)
                .onCall(3)
                .yieldsToOn("method2", context, 7, 8);

            var spy1 = createSpy();
            var spy2 = createSpy();

            stub(spy1);
            stub(spy2);
            stub(obj);
            stub(obj);
            stub(obj2); // should continue with default behavior

            assert(spy1.calledOnce);
            assert(spy1.calledWithExactly(1, 2));

            assert(spy2.calledOnce);
            assert(spy2.calledAfter(spy1));
            assert(spy2.calledOn(context));
            assert(spy2.calledWithExactly(3, 4));

            assert(obj.method1.calledOnce);
            assert(obj.method1.calledAfter(spy2));
            assert(obj.method1.calledWithExactly(5, 6));

            assert(obj.method2.calledOnce);
            assert(obj.method2.calledAfter(obj.method1));
            assert(obj.method2.calledOn(context));
            assert(obj.method2.calledWithExactly(7, 8));

            assert(obj2.method2.calledOnce);
            assert(obj2.method2.calledAfter(obj.method2));
            assert(obj2.method2.calledOn(context));
            assert(obj2.method2.calledWithExactly(7, 8));
        });

        it("can be used with callsArg* to produce a sequence", function() {
            var spy1 = createSpy();
            var spy2 = createSpy();
            var spy3 = createSpy();
            var spy4 = createSpy();
            var spy5 = createSpy();
            var decoy = createSpy();
            var context = { foo: "bar" };

            var stub = createStub().callsArgOnWith(3, context, "c", "d");
            stub.onFirstCall()
                .callsArg(0)
                .onSecondCall()
                .callsArgWith(1, "a", "b")
                .onThirdCall()
                .callsArgOn(2, context)
                .onCall(3)
                .callsArgOnWith(3, context, "c", "d");

            stub(spy1);
            stub(decoy, spy2);
            stub(decoy, decoy, spy3);
            stub(decoy, decoy, decoy, spy4);
            stub(decoy, decoy, decoy, spy5); // should continue with default behavior

            assert(spy1.calledOnce);

            assert(spy2.calledOnce);
            assert(spy2.calledAfter(spy1));
            assert(spy2.calledWithExactly("a", "b"));

            assert(spy3.calledOnce);
            assert(spy3.calledAfter(spy2));
            assert(spy3.calledOn(context));

            assert(spy4.calledOnce);
            assert(spy4.calledAfter(spy3));
            assert(spy4.calledOn(context));
            assert(spy4.calledWithExactly("c", "d"));

            assert(spy5.calledOnce);
            assert(spy5.calledAfter(spy4));
            assert(spy5.calledOn(context));
            assert(spy5.calledWithExactly("c", "d"));

            assert(decoy.notCalled);
        });

        it("can be used with yields* and callsArg* in combination to produce a sequence", function() {
            var stub = createStub().yields(1, 2);
            stub.onSecondCall()
                .callsArg(1)
                .onThirdCall()
                .yieldsTo("method")
                .onCall(3)
                .callsArgWith(2, "a", "b");

            var obj = { method: createSpy() };
            var spy1 = createSpy();
            var spy2 = createSpy();
            var spy3 = createSpy();
            var decoy = createSpy();

            stub(spy1);
            stub(decoy, spy2);
            stub(obj);
            stub(decoy, decoy, spy3);

            assert(spy1.calledOnce);

            assert(spy2.calledOnce);
            assert(spy2.calledAfter(spy1));

            assert(obj.method.calledOnce);
            assert(obj.method.calledAfter(spy2));

            assert(spy3.calledOnce);
            assert(spy3.calledAfter(obj.method));
            assert(spy3.calledWithExactly("a", "b"));

            assert(decoy.notCalled);
        });

        it("should interact correctly with assertions (GH-231)", function() {
            var stub = createStub();
            var spy = createSpy();

            stub.callsArgWith(0, "a");

            stub(spy);
            assert(spy.calledWith("a"));

            stub(spy);
            assert(spy.calledWith("a"));

            stub.onThirdCall().callsArgWith(0, "b");

            stub(spy);
            assert(spy.calledWith("b"));
        });
    });

    describe(".reset", function() {
        it("resets behavior", function() {
            var obj = {
                a: function() {
                    return;
                }
            };
            var spy = createSpy();
            createStub(obj, "a").callsArg(1);

            obj.a(null, spy);
            obj.a.reset();
            obj.a(null, spy);

            assert(spy.calledOnce);
        });

        it("resets call history", function() {
            var stub = createStub();

            stub(1);
            stub.reset();
            stub(2);

            assert(stub.calledOnce);
            assert.equals(stub.getCall(0).args[0], 2);
        });
    });

    describe(".resetHistory", function() {
        it("resets history", function() {
            var stub = createStub();

            stub(1);
            stub.reset();
            stub(2);

            assert(stub.calledOnce);
            assert.equals(stub.getCall(0).args[0], 2);
        });

        it("doesn't reset behavior defined using withArgs", function() {
            var stub = createStub();
            stub.withArgs("test").returns(10);

            stub.resetHistory();

            assert.equals(stub("test"), 10);
        });

        it("doesn't reset behavior", function() {
            var stub = createStub();
            stub.returns(10);

            stub.resetHistory();

            assert.equals(stub("test"), 10);
        });
    });

    describe(".resetBehavior", function() {
        it("clears yields* and callsArg* sequence", function() {
            var stub = createStub().yields(1);
            stub.onFirstCall().callsArg(1);
            stub.resetBehavior();
            stub.yields(3);
            var spyWanted = createSpy();
            var spyNotWanted = createSpy();

            stub(spyWanted, spyNotWanted);

            assert(spyNotWanted.notCalled);
            assert(spyWanted.calledOnce);
            assert(spyWanted.calledWithExactly(3));
        });

        it("cleans 'returns' behavior", function() {
            var stub = createStub().returns(1);

            stub.resetBehavior();

            refute.defined(stub());
        });

        it("cleans behavior of fakes returned by withArgs", function() {
            var stub = createStub();
            stub.withArgs("lolz").returns(2);

            stub.resetBehavior();

            refute.defined(stub("lolz"));
        });

        it("does not clean parents' behavior when called on a fake returned by withArgs", function() {
            var parentStub = createStub().returns(false);
            var childStub = parentStub.withArgs("lolz").returns(true);

            childStub.resetBehavior();

            assert.same(parentStub("lolz"), false);
            assert.same(parentStub(), false);
        });

        it("cleans 'returnsArg' behavior", function() {
            var stub = createStub().returnsArg(0);

            stub.resetBehavior();

            refute.defined(stub("defined"));
        });

        it("cleans 'returnsThis' behavior", function() {
            var instance = {};
            instance.stub = createStub.create();
            instance.stub.returnsThis();

            instance.stub.resetBehavior();

            refute.defined(instance.stub());
        });

        it("cleans 'resolvesThis' behavior, so the stub does not resolve nor returns anything", function() {
            var instance = {};
            instance.stub = createStub.create();
            instance.stub.resolvesThis();

            instance.stub.resetBehavior();

            refute.defined(instance.stub());
        });

        describe("does not touch properties that are reset by 'reset'", function() {
            it(".calledOnce", function() {
                var stub = createStub();
                stub(1);

                stub.resetBehavior();

                assert(stub.calledOnce);
            });

            it("called multiple times", function() {
                var stub = createStub();
                stub(1);
                stub(2);
                stub(3);

                stub.resetBehavior();

                assert(stub.called);
                assert.equals(stub.args.length, 3);
                assert.equals(stub.returnValues.length, 3);
                assert.equals(stub.exceptions.length, 3);
                assert.equals(stub.thisValues.length, 3);
                assert.defined(stub.firstCall);
                assert.defined(stub.secondCall);
                assert.defined(stub.thirdCall);
                assert.defined(stub.lastCall);
            });

            it("call order state", function() {
                var stubs = [createStub(), createStub()];
                stubs[0]();
                stubs[1]();

                stubs[0].resetBehavior();

                assert(stubs[0].calledBefore(stubs[1]));
            });

            it("fakes returned by withArgs", function() {
                var stub = createStub();
                var fakeA = stub.withArgs("a");
                var fakeB = stub.withArgs("b");
                stub("a");
                stub("b");
                stub("c");
                var fakeC = stub.withArgs("c");

                stub.resetBehavior();

                assert(fakeA.calledOnce);
                assert(fakeB.calledOnce);
                assert(fakeC.calledOnce);
            });
        });
    });

    describe(".length", function() {
        it("is zero by default", function() {
            var stub = createStub();

            assert.equals(stub.length, 0);
        });

        it("matches the function length", function() {
            var api = {
                // eslint-disable-next-line no-unused-vars
                someMethod: function(a, b, c) {
                    return;
                }
            };
            var stub = createStub(api, "someMethod");

            assert.equals(stub.length, 3);
        });
    });

    describe(".createStubInstance", function() {
        it("stubs existing methods", function() {
            var Class = function() {
                return;
            };
            Class.prototype.method = function() {
                return;
            };

            var stub = createStubInstance(Class);
            stub.method.returns(3);
            assert.equals(3, stub.method());
        });

        it("doesn't stub fake methods", function() {
            var Class = function() {
                return;
            };

            var stub = createStubInstance(Class);
            assert.exception(function() {
                stub.method.returns(3);
            });
        });

        it("doesn't call the constructor", function() {
            var Class = function(a, b) {
                var c = a + b;
                throw c;
            };
            Class.prototype.method = function() {
                return;
            };

            var stub = createStubInstance(Class);
            refute.exception(function() {
                stub.method(3);
            });
        });

        it("retains non function values", function() {
            var TYPE = "some-value";
            var Class = function() {
                return;
            };
            Class.prototype.type = TYPE;

            var stub = createStubInstance(Class);
            assert.equals(TYPE, stub.type);
        });

        it("has no side effects on the prototype", function() {
            var proto = {
                method: function() {
                    throw new Error("error");
                }
            };
            var Class = function() {
                return;
            };
            Class.prototype = proto;

            var stub = createStubInstance(Class);
            refute.exception(stub.method);
            assert.exception(proto.method);
        });

        it("throws exception for non function params", function() {
            var types = [{}, 3, "hi!"];

            for (var i = 0; i < types.length; i++) {
                // yes, it's silly to create functions in a loop, it's also a test
                // eslint-disable-next-line no-loop-func, ie11/no-loop-func
                assert.exception(function() {
                    createStubInstance(types[i]);
                });
            }
        });

        it("allows providing optional overrides", function() {
            var Class = function() {
                return;
            };
            Class.prototype.method = function() {
                return;
            };

            var stub = createStubInstance(Class, {
                method: createStub().returns(3)
            });

            assert.equals(3, stub.method());
        });

        it("allows providing optional returned values", function() {
            var Class = function() {
                return;
            };
            Class.prototype.method = function() {
                return;
            };

            var stub = createStubInstance(Class, {
                method: 3
            });

            assert.equals(3, stub.method());
        });

        it("allows providing null as a return value", function() {
            var Class = function() {
                return;
            };
            Class.prototype.method = function() {
                return;
            };

            var stub = createStubInstance(Class, {
                method: null
            });

            assert.equals(null, stub.method());
        });

        it("throws an exception when trying to override non-existing property", function() {
            var Class = function() {
                return;
            };
            Class.prototype.method = function() {
                return;
            };

            assert.exception(
                function() {
                    createStubInstance(Class, {
                        foo: createStub().returns(3)
                    });
                },
                { message: "Cannot stub foo. Property does not exist!" }
            );
        });
    });

    describe(".callThrough", function() {
        it("does not call original function when arguments match conditional stub", function() {
            // We need a function here because we can't wrap properties that are already stubs
            var callCount = 0;
            var originalFunc = function increaseCallCount() {
                callCount++;
            };

            var myObj = {
                prop: originalFunc
            };

            var propStub = createStub(myObj, "prop");
            propStub.withArgs("foo").returns("bar");
            propStub.callThrough();

            var result = myObj.prop("foo");

            assert.equals(result, "bar");
            assert.equals(callCount, 0);
        });

        it("calls original function when arguments do not match conditional stub", function() {
            // We need a function here because we can't wrap properties that are already stubs
            var callCount = 0;

            var originalFunc = function increaseCallCount() {
                callCount++;
                return 1337;
            };

            var myObj = {
                prop: originalFunc
            };

            var propStub = createStub(myObj, "prop");
            propStub.withArgs("foo").returns("bar");
            propStub.callThrough(propStub);

            var result = myObj.prop("not foo");

            assert.equals(result, 1337);
            assert.equals(callCount, 1);
        });

        it("calls original function with same arguments when call does not match conditional stub", function() {
            // We need a function here because we can't wrap properties that are already stubs
            var callArgs = [];

            var originalFunc = function increaseCallCount() {
                callArgs = arguments;
            };

            var myObj = {
                prop: originalFunc
            };

            var propStub = createStub(myObj, "prop");
            propStub.withArgs("foo").returns("bar");
            propStub.callThrough();

            myObj.prop("not foo");

            assert.equals(callArgs.length, 1);
            assert.equals(callArgs[0], "not foo");
        });

        it("calls original function with same `this` reference when call does not match conditional stub", function() {
            // We need a function here because we can't wrap properties that are already stubs
            var reference = {};

            var originalFunc = function increaseCallCount() {
                reference = this;
            };

            var myObj = {
                prop: originalFunc
            };

            var propStub = createStub(myObj, "prop");
            propStub.withArgs("foo").returns("bar");
            propStub.callThrough();

            myObj.prop("not foo");

            assert.equals(reference, myObj);
        });
    });

    describe(".get", function() {
        it("allows users to stub getter functions for properties", function() {
            var myObj = {
                prop: "foo"
            };

            createStub(myObj, "prop").get(function getterFn() {
                return "bar";
            });

            assert.equals(myObj.prop, "bar");
        });

        it("allows users to stub getter functions for functions", function() {
            var myObj = {
                prop: function propGetter() {
                    return "foo";
                }
            };

            createStub(myObj, "prop").get(function getterFn() {
                return "bar";
            });

            assert.equals(myObj.prop, "bar");
        });

        it("replaces old getters", function() {
            var myObj = {
                get prop() {
                    fail("should not call the old getter");
                    return;
                }
            };

            createStub(myObj, "prop").get(function getterFn() {
                return "bar";
            });

            assert.equals(myObj.prop, "bar");
        });

        it("can restore stubbed setters for functions", function() {
            var propFn = function propFn() {
                return "bar";
            };

            var myObj = {
                prop: propFn
            };

            var stub = createStub(myObj, "prop");

            stub.get(function getterFn() {
                return "baz";
            });

            stub.restore();

            assert.equals(myObj.prop, propFn);
        });

        it("can restore stubbed getters for properties", function() {
            var myObj = {
                get prop() {
                    return "bar";
                }
            };

            var stub = createStub(myObj, "prop");

            stub.get(function getterFn() {
                return "baz";
            });

            stub.restore();

            assert.equals(myObj.prop, "bar");
        });
    });

    describe(".set", function() {
        it("allows users to stub setter functions for properties", function() {
            var myObj = {
                prop: "foo"
            };

            createStub(myObj, "prop").set(function setterFn() {
                myObj.example = "bar";
            });

            myObj.prop = "baz";

            assert.equals(myObj.example, "bar");
        });

        it("allows users to stub setter functions for functions", function() {
            var myObj = {
                prop: function propSetter() {
                    return "foo";
                }
            };

            createStub(myObj, "prop").set(function setterFn() {
                myObj.example = "bar";
            });

            myObj.prop = "baz";

            assert.equals(myObj.example, "bar");
        });

        it("replaces old setters", function() {
            // eslint-disable-next-line accessor-pairs
            var myObj = {
                set prop(val) {
                    fail("should not call the old setter");
                }
            };

            createStub(myObj, "prop").set(function setterFn() {
                myObj.example = "bar";
            });

            myObj.prop = "foo";

            assert.equals(myObj.example, "bar");
        });

        it("can restore stubbed setters for functions", function() {
            var propFn = function propFn() {
                return "bar";
            };

            var myObj = {
                prop: propFn
            };

            var stub = createStub(myObj, "prop");

            stub.set(function setterFn() {
                myObj.otherProp = "baz";
            });

            stub.restore();

            assert.equals(myObj.prop, propFn);
        });

        it("can restore stubbed setters for properties", function() {
            // eslint-disable-next-line accessor-pairs
            var myObj = {
                set prop(val) {
                    this.otherProp = "bar";
                    return "bar";
                }
            };

            var stub = createStub(myObj, "prop");

            stub.set(function setterFn() {
                myObj.otherProp = "baz";
            });

            stub.restore();

            myObj.prop = "foo";
            assert.equals(myObj.otherProp, "bar");
        });
    });

    describe(".value", function() {
        it("allows stubbing property descriptor values", function() {
            var myObj = {
                prop: "rawString"
            };

            createStub(myObj, "prop").value("newString");
            assert.equals(myObj.prop, "newString");
        });

        it("allows restoring stubbed property descriptor values", function() {
            var myObj = {
                prop: "rawString"
            };

            var stub = createStub(myObj, "prop").value("newString");
            stub.restore();

            assert.equals(myObj.prop, "rawString");
        });

        it("allows stubbing function static properties", function() {
            var myFunc = function() {
                return;
            };
            myFunc.prop = "rawString";

            createStub(myFunc, "prop").value("newString");
            assert.equals(myFunc.prop, "newString");
        });

        it("allows restoring function static properties", function() {
            var myFunc = function() {
                return;
            };
            myFunc.prop = "rawString";

            var stub = createStub(myFunc, "prop").value("newString");
            stub.restore();

            assert.equals(myFunc.prop, "rawString");
        });

        it("allows stubbing object props with configurable false", function() {
            var myObj = {};
            Object.defineProperty(myObj, "prop", {
                configurable: false,
                enumerable: true,
                writable: true,
                value: "static"
            });

            createStub(myObj, "prop").value("newString");
            assert.equals(myObj.prop, "newString");
        });
    });

    describe(".id", function() {
        it("should start with 'stub#'", function() {
            for (var i = 0; i < 10; i++) {
                assert.isTrue(createStub().id.indexOf("stub#") === 0);
            }
        });
    });
});
