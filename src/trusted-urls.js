const { getConfig } = require("./config");

function isHostInTrustedList(urlStr, config, env) {
  let url;
  try {
    url = new URL(urlStr);
  } catch (err) {
    return false;
  }
  const isSafe = config.urlSafeList[env].some((safe) => {
    if (typeof safe === "function") {
      return safe(url);
    } else if (typeof safe === "string") {
      return url.href.startsWith(safe);
    } else {
      throw Error(
        `config.safelist must be an array of strings or functions. Found ${typeof url}`
      );
    }
  });
  return isSafe;
}

exports.isTrustedHost = (urlStr, env) => {
  const config = getConfig();
  if (!config.urlSafeList) {
    return true;
  } else {
    return isHostInTrustedList(urlStr, config, env);
  }
};
