const { compile } = require('./pattern')

module.exports = function flatten(routeMap) {
  const result = []
  const parentData = []
  addLevel(routeMap)
  return result

  function addLevel(level) {
    level.forEach(route => {
      const { path, routes, ...routeData } = route
      if (path) {
        result.push({ pattern: path, re: compile(path), data: parentData.concat([routeData]) })
      }
      if (routes) {
        parentData.push(routeData)
        addLevel(routes)
        parentData.pop()
      }
    })
  }
}
