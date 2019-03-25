module.exports = function flatten(routeMap) {
  const routes = []
  const parentData = []
  addLevel(routeMap)
  return routes

  function addLevel(level) {
    level.forEach(route => {
      const { path, routes: children, ...routeData } = route
      if (path) {
        routes.push({ pattern: path, data: parentData.concat([routeData]) })
      }
      if (children) {
        parentData.push(routeData)
        addLevel(children)
        parentData.pop()
      }
    })
  }
}
