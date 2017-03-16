var on = require('./on')

/**
 * Intercept all clicks on `a` elements
 * and invoke `fn(e)` when shouldIntercept check passes.
 */

module.exports.intercept = function intercept (matches, fn) {
  if (typeof document === 'undefined') return
  return on(document, 'click', function (e) {
    var el = a(e.target)
    var href = el && el.getAttribute('href')
    if (el && shouldIntercept(e, href, matches)) fn(e, href)
  })
}

function a (el) {
  el = { parentNode: el }
  while ((el = el.parentNode) && el !== document) {
    if (el.tagName.toLowerCase() === 'a') return el
  }
}

function shouldIntercept (e, el, matches) {
  if (e.defaultPrevented) return false
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return false
  if (matches(el)) return true
  return false
}
