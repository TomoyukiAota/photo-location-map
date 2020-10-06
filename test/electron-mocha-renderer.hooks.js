exports.mochaHooks = {
  beforeEach(done) {
    global.__electronMochaRenderer__ = true;
    done();
  },
};
