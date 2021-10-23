# Space Router

> Framework agnostic router for single page apps

Space Router packs all the features you need to keep your app in sync with the url. It's distinct from many other routers in that there is only **a single callback**. This callback can be used to re-render your applocation, update a store and perform other actions on each url change. Space Router is also **stateless**, it doesn't store the current route leaving state completely up to you to handle.

In summary, Space Router:

- listens to url changes using popstate or hashchange event
- extracts url parameters and parses query strings
- supports nested routes and arbitrary route metadata
- fits into a wide range of application architectures and frameworks
- has no dependencies and weighs less than 2kb

## Install

    npm i space-router

## API

See the [API Docs](https://kidkarolis.github.io/space-router) for more details.
