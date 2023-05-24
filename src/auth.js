//Handle http basic auth
"use strict";
const io = require("./io-operations");
const auth = require("basic-auth");
const { isTrustedHost } = require("./trusted-urls");
const md5 = require("md5");
const publicRoutes = new Set(["/", "/health"]);
let admins = {};

module.exports = function (req, res, next) {
  let env = req.query.env || "default";

  if (!io.isAuthRequired || (isTrustedHost(req.headers.origin, env) && req.method === "GET")) {
    /** without authentication */
    return next();
  }

  var user = auth(req);

  admins[io.credential[env].username] = {
    password: io.credential[env].password,
  };

  if (
    (!user ||
      !admins[user.name] ||
      admins[user.name].password !== md5(user.pass)) &&
    !publicRoutes.has(req.url)
  ) {
    res.set("WWW-Authenticate", 'Basic realm="sofe-deplanifester"');
    return res.status(401).send();
  }
  return next();
};
