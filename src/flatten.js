module.exports = function flatten (routeMap) {
  var routes = []
  var parentData = []

  function addLevel (level) {
    level.forEach(function (route) {
      routes.push({ pattern: route[0], data: parentData.concat([route[1]]) })
      if (route[2]) {
        parentData.push(route[1])
        addLevel(route[2])
        parentData.pop()
      }
    })
  }

  addLevel(routeMap)

  return routes
}
