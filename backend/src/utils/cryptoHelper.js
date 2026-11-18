// Fail at startup if required authentication dependencies are missing.
module.exports = { safeBcrypt: require('bcrypt'), safeJwt: require('jsonwebtoken') };
