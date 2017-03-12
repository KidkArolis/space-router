module.exports = function flatten (routeMap) {
  var routes = []
  var parentData = []

  function addLevel (level) {
    if (!level) return
    level.forEach(function (route) {
      routes.push({ pattern: route[0], data: parentData.concat([route[1]]) })
      if (route[2]) {
        parentData.push(route[1])
        addLevel(route[2])
        parentData.pop()
      }
    })
  }

  routeMap = routeMap || []
  if (Object.prototype.toString.call(routeMap[0]) !== '[object Array]') {
    routeMap = [routeMap]
  }
  addLevel(routeMap)

  return routes
}
