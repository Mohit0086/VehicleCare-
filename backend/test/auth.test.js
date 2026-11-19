const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const AppError = require('../src/utils/AppError');
const validators = require('../src/middleware/validate');

// Exercise controllers and middleware with isolated database/crypto boundaries.
// Actual MySQL, bcrypt and JWT integration must also be checked on the running server.
function setup({ users = [], dbError, invalidToken = false, tokenId = 1, mailConfigured = true } = {}) {
  const records = users.map(u => ({ ...u }));
  const pool = { async execute(sql, args) {
    if (dbError) throw dbError;
    if (sql.startsWith('INSERT INTO users')) {
      if (records.some(u => u.email === args[1])) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
      const id = records.length + 1;
      records.push({ id, name: args[0], email: args[1], password_hash: args[2], role: args[3], phone: args[4], is_active: 1, email_verified_at: null });
      return [{ insertId: id }];
    }
    return [records.filter(u => sql.includes('WHERE email') ? u.email === args[0] : u.id === args[0])];
  }};
  const bcrypt = { hash: async p => `hashed:${p}`, compare: async (p, h) => h === `hashed:${p}` };
  const jwt = { sign: (payload, secret, options) => JSON.stringify({ ...payload, expiresIn: options.expiresIn }), verify: () => {
    if (invalidToken) throw new Error('expired');
    return { id: tokenId, role: 'ADMIN' };
  }};
  const dependencies = {
    '../utils/cryptoHelper': { safeBcrypt: bcrypt, safeJwt: jwt }, '../config/db': pool,
    '../config/env': { jwt: { secret: 'test', expiresIn: '1d' } },
    '../services/passwordResetMail': { getMailConfig: () => mailConfigured ? {} : null },
    '../services/emailVerification': { sendVerification: async () => 'sent' },
    '../utils/AppError': AppError, '../middleware/validate': validators, crypto: require('node:crypto'),
  };
  function load(relative) {
    const module = { exports: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
      module, exports: module.exports, require: name => {
        assert.ok(dependencies[name], `Unexpected dependency: ${name}`);
        return dependencies[name];
      }, Buffer, console, process, Date,
    });
    return module.exports;
  }
  return { controller: load('src/controllers/auth.controller.js'), middleware: load('src/middleware/auth.js'), records };
}
async function invoke(handler, { body = {}, headers = {}, user } = {}) {
  let response, error, passed = false;
  const req = { body, headers, user };
  const res = { status(code) { this.code = code; return this; }, json(data) { response = { code: this.code, ...data, statusCode: this.code }; return this; } };
  await handler(req, res, err => { error = err; passed = !err; });
  return { response, error, passed, req };
}
const details = { name: '  Test Customer  ', email: ' TEST@example.com ', phone: '9876543210', password: 'Secure123' };
const account = { id: 1, name: 'Customer', email: 'test@example.com', phone: '9876543210', password_hash: 'hashed:Secure123', role: 'CUSTOMER', is_active: 1, email_verified_at: new Date() };

test('registration stores an unverified customer and issues no session', async () => {
  const { controller, records } = setup();
  const { response, error } = await invoke(controller.register, { body: details });
  assert.equal(error, undefined);
  assert.equal(response.code, 201);
  assert.equal(response.verificationEmailSent, true);
  assert.equal(response.token, undefined);
  assert.equal(records[0].email, 'test@example.com');
  assert.equal(records[0].role, 'CUSTOMER');
  assert.equal(records[0].phone, '+919876543210');
  assert.equal(records[0].email_verified_at, null);
  assert.equal(records[0].password_hash, 'hashed:Secure123');
});
test('new account needs verification before sign-in', async () => {
  const { controller, records } = setup();
  await invoke(controller.register, { body: details });
  const blocked = await invoke(controller.login, { body: details });
  assert.equal(blocked.response.statusCode, 403);
  assert.equal(blocked.response.code, 'EMAIL_UNVERIFIED');
  assert.equal(blocked.response.token, undefined);
  records[0].email_verified_at = new Date();
  const signedIn = await invoke(controller.login, { body: details });
  assert.equal(signedIn.response.code, 200);
  assert.equal(JSON.parse(signedIn.response.token).expiresIn, '1d');
  assert.equal((await invoke(controller.login, { body: { ...details, password: 'wrong' } })).error.statusCode, 401);
});
test('registration does not create an account without configured mail', async () => {
  const { controller, records } = setup({ mailConfigured: false });
  const { error } = await invoke(controller.register, { body: details });
  assert.equal(error.statusCode, 503);
  assert.equal(records.length, 0);
});
test('duplicate email returns conflict', async () => {
  const { controller } = setup({ users: [account] });
  assert.equal((await invoke(controller.register, { body: details })).error.statusCode, 409);
});
test('public registration cannot create privileged or unknown roles', async () => {
  for (const role of ['ADMIN', 'MECHANIC', 'OTHER']) {
    const { controller, records } = setup();
    assert.equal((await invoke(controller.register, { body: { ...details, role } })).error.statusCode, 403);
    assert.equal(records.length, 0);
  }
});
test('invalid inputs are rejected without storing a user', async () => {
  for (const invalid of [{ name: ' ' }, { email: 'bad' }, { email: 'a..b@example.com' }, { email: 'a@-example.com' }, { password: '1234567' }, { password: '        ' }, { password: 'é'.repeat(40) }, { password: 1234567 }, { phone: 'abc' }, { phone: '1234567890' }, { phone: '+919876543' }]) {
    const { controller, records } = setup();
    assert.equal((await invoke(controller.register, { body: { ...details, ...invalid } })).error.statusCode, 400);
    assert.equal(records.length, 0);
  }
});
test('unknown and incorrect credentials return the same error', async () => {
  const { controller } = setup({ users: [account] });
  const unknown = await invoke(controller.login, { body: { ...details, email: 'missing@example.com' } });
  const wrong = await invoke(controller.login, { body: { ...details, password: 'wrong' } });
  assert.equal(unknown.error.statusCode, 401);
  assert.equal(unknown.error.message, wrong.error.message);
});
test('deactivated accounts cannot sign in or restore a session', async () => {
  const { controller } = setup({ users: [{ ...account, is_active: 0 }] });
  assert.equal((await invoke(controller.login, { body: details })).error.statusCode, 403);
  assert.equal((await invoke(controller.getProfile, { user: { id: 1 } })).error.statusCode, 401);
});
test('admin signs in using the same endpoint', async () => {
  const { controller } = setup({ users: [{ ...account, role: 'ADMIN' }] });
  assert.equal((await invoke(controller.login, { body: details })).response.user.role, 'ADMIN');
});
test('profile excludes password hashes', async () => {
  const { controller } = setup({ users: [account] });
  const result = await invoke(controller.getProfile, { user: { id: 1 } });
  assert.equal(result.response.user.id, 1);
  assert.equal(result.response.user.password_hash, undefined);
});
test('database errors are passed to the error handler', async () => {
  const dbError = new Error('Database unavailable');
  const { controller } = setup({ dbError });
  assert.equal((await invoke(controller.register, { body: details })).error, dbError);
  assert.equal((await invoke(controller.login, { body: details })).error, dbError);
});
test('middleware rejects missing, malformed and expired tokens', async () => {
  const { middleware } = setup({ invalidToken: true });
  for (const authorization of ['', 'Basic abc', 'Bearer', 'Bearer expired']) {
    assert.equal((await invoke(middleware, { headers: { authorization } })).error.statusCode, 401);
  }
});
test('middleware checks current database role instead of trusting old token role', async () => {
  const { middleware } = setup({ users: [account] });
  const result = await invoke(middleware, { headers: { authorization: 'Bearer signed-token' } });
  assert.equal(result.passed, true);
  assert.equal(result.req.user.role, 'CUSTOMER');
});
test('middleware rejects deleted, deactivated and malformed-token accounts', async () => {
  for (const config of [{ users: [] }, { users: [{ ...account, is_active: 0 }] }, { users: [account], tokenId: 'bad' }]) {
    const { middleware } = setup(config);
    assert.equal((await invoke(middleware, { headers: { authorization: 'Bearer signed-token' } })).error.statusCode, 401);
  }
});

test('password reset reports unavailable mail without issuing a token', async () => {
  const { controller } = setup({ users: [account], mailConfigured: false });
  const { response, error } = await invoke(controller.forgotPassword, { body: { email: account.email } });
  assert.equal(error.statusCode, 503);
  assert.equal(response, undefined);
});
