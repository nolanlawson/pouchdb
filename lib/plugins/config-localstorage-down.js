module.exports = {
  name: 'localstorage',
  valid: function () {
    return 'localStorage' in window;
  }
};