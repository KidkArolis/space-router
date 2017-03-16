module.exports = function on (el, type, fn) {
  el.addEventListener(type, fn, false)
  return function off () {
    el.removeEventListener(type, fn, false)
  }
}
