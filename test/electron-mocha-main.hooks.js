exports.mochaHooks = {
  beforeEach(done) {
    global.__electronMochaMain__ = true;
    done();
  },
};
