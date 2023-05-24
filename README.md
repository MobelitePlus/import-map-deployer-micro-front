# import-map-deployer

The import-map-deployer is a backend service that updates import map json files. When using
import-map-deployer, a frontend deployment is completed in two steps:

1. Upload the javascript file Ex: `main.js` of a compiled project.
2. Make an HTTP request (e.g. via `curl` or `httpie`) to modify an existing import map to point to the new file.

These two steps are often performed during a CI process, to automate deployments of frontend code.

## Why does this exist?

The alternative to the import-map-deployer is to pull down the import map file, modify it, and reupload it during your CI process. That alternative has one problem: it doesn't properly handle concurrency. If two deployments occur in separate CI pipelines at the same time, it is possible they pull down the import map at the same time, modify it, and reupload. In that case, there is a race condition where the "last reupload wins," overwriting the deployment that the first reupload did.

When you have a single import map file and multiple services' deployment process modifies that import map, there is a (small) chance for a race condition where two deployments attempt to modify the import map at the same time. This could result in a CI pipeline indicating that it successfully deployed the frontend module, even though the deployment was overwritten with a stale version.
## **Installation and usage**
### *Docker*

Run `docker-compose up` from the project root. When running via docker-compose, it will mount a volume in the project root's directory,
## *Configuration file*

The import-map-deployer expects a configuration file to be present so it (1) can password protect deployments, and (2) knows where and how
to download and update the "live" import map.

Here are the properties available in the config file:

- `urlSafeList` (optional, but **highly** recommended): An object that contain four environment (default itg, rec and prod), each one is an array of strings that indicate which URLs are trusted when updating the import map. A string value is treated as a URL prefix - for example `https://unpkg.com/`.
- `packagesViaTrailingSlashes` (optional, defaults to true): A boolean that indicates whether to turn off the automatic generation of trailing slash package records on PATCH service requests. For more information and examples visit [standard guideline](https://github.com/WICG/import-maps/#packages-via-trailing-slashes).
- `manifestFormat` (required): A string that is either `"importmap"` or `"sofe"`, which indicates whether the import-map-deployer is
  interacting with an [import map](https://github.com/WICG/import-maps) or a [sofe manifest](https://github.com/CanopyTax/sofe).
- `locations` (required): An object specifying one or more `"locations"` (or "environments") for which you want the import-map-deployer to control the import map. The special `default`
  location is what will be used when no query parameter `?env=` is provided in calls to the import-map-deployer. If no `default` is provided, the import-map-deployer will create
  a local file called `import-map.json` that will be used as the import map. The keys in the `locations` object are the names of environments, and the values are
  strings that indicate how the import-map-deployer should interact with the import map for that environment.
- `requireAuth (required)`: Indicate whether or not authentication is required.
- `credential (optional)`: An object that contain four environment (default itg, rec and prod) and each one is an object of username and password.
The `"username"` for HTTP auth when calling the import-map-deployer. If username and password are omitted, anyone can update the import map without authenticating. The `"password"` for HTTP auth when calling the import-map-deployer.
- `port` (optional): The port to run the import-map-deployer on. Defaults to 5000.
- `cacheControl` (optional): Cache-control header that will be set on the import map file when the import-map-deployer is called. Defaults to `public, must-revalidate, max-age=0`.
- `alphabetical` (optional, defaults to false): A boolean that indicates whether to sort the import-map alphabetically by service/key/name.

## Endpoints

This service exposes the following endpoints

#### GET /health

An endpoint for health checks. It will return an HTTP 200 with a textual response body saying that everything is okay. You may also call `/` as a health check endpoint.

#### GET /environments

You can retrieve the list of environments (locations) a GET request at /environments

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http :5000/environments
```

Example using cURL:

```sh
curl localhost:5000/environments
```

Response:

```json
{
  "environments": [
    {
      "name": "default",
      "aliases": ["prod"],
      "isDefault": true
    },
    {
      "name": "prod",
      "aliases": ["default"],
      "isDefault": true
    },
    {
      "name": "staging",
      "aliases": [],
      "isDefault": false
    }
  ]
}
```

#### GET /import-map.json?env=prod

You can request the importmap.json file by making a GET request.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

    http :5000/import-map.json\?env=prod

Example using cURL:

    curl localhost:5000/import-map.json\?env=prod

#### PATCH /import-map.json?env=prod

You can modify the import map by making a PATCH request. The import map should be sent in the HTTP request body
and will be merged into the import map controlled by import-map-deployer.

If you have an import map called `importmap.json`, here is how you can merge it into the import map deployer's import map.

Note that the `skip_url_check` query param indicates that the import-map-deployer will update the import map even if it is not able to reach it via a network request.

Example using [HTTPie](https://github.com/jkbrzt/httpie):

```sh
http PATCH :5000/import-map.json\?env=prod < importmap.json

# Don't check whether the URLs in the import map are publicly reachable
http PATCH :5000/import-map.json\?env=prod\&skip_url_check < importmap.json
```

Example using cURL:

```sh
curl -X PATCH localhost:5000/import-map.json\?env=prod --data "@import-map.json" -H "Accept: application/json" -H "Content-Type: application/json"

# Don't check whether the URLs in the import map are publicly reachable
curl -X PATCH localhost:5000/import-map.json\?env=prod\&skip_url_check --data "@import-map.json" -H "Accept: application/json" -H "Content-Type: application/json"
```

#### PATCH /services?env=stage&packageDirLevel=1

You can PATCH services to add or update a service, the following json body is expected:

Note that the `skip_url_check` query param indicates that the import-map-deployer will update the import map even if it is not able to reach it via a network request.

Note that the `packageDirLevel` query param indicates the number of directories to remove when determining the root directory for the package. The default is 1. Note that this option only takes effect if `packagesViaTrailingSlashes` is set to true.

Body:

```json
{
  "service": "my-service",
  "url": "http://example.com/path/to/my-service.js"
}
```

Response:

```json
{
  "imports": {
    "my-service": "http://example.com/path/to/my-service.js",
    "my-service/": "http://example.com/path/to/"
  }
}
```

Example using HTTPie:

```sh
http PATCH :5000/services\?env=stage service=my-service url=http://example.com/my-service.js

# Don't check whether the URL in the request is publicly reachable
http PATCH :5000/services\?env=stage\&skip_url_check service=my-service url=http://example.com/my-service.js
```

Example using cURL:

```sh
curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services\?env=beta -H "Accept: application/json" -H "Content-Type: application/json"

# Don't check whether the URL in the request is publicly reachable
curl -d '{ "service":"my-service","url":"http://example.com/my-service.js" }' -X PATCH localhost:5000/services\?env=beta\&skip_url_check -H "Accept: application/json" -H "Content-Type: application/json"
```

#### DELETE /services/{SERVICE_NAME}?env=alpha

You can remove a service by sending a DELETE with the service name. No request body needs to be sent. Example:

```sh
DELETE /services/my-service
```

Example using HTTPie:

```sh
http DELETE :5000/services/my-service
```

Example using cURL:

```sh
curl -X DELETE localhost:5000/services/my-service
```

##### Special Chars

This project uses URI encoding: [encode URI]. If you have any service with special chars like _@_, _/_, etc... you need to use It's corresponding UTF-8 encoding character.

[encode uri]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent

Imagine you have this service name in your _import-map.json_ `@company/my-service`. You have to replace those characters to utf-8 encoded byte: See detailed list [utf8 encode]

[utf8 encode]: http://www.fileformat.info/info/charset/UTF-8/list.htm

```sh
curl -X DELETE localhost:5000/services/%40company%2Fmy-service
```
