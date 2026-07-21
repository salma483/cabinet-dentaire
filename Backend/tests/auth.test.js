const assert = require('assert');
const { login } = require('../controllers/authController');

(async () => {
  const req = { body: { email: 'admin@dentiste.com', password: 'admin123' } };
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
    }
  };

  await login(req, res);
  assert.strictEqual(res.statusCode, 500);
  console.log('auth test ok', res.payload);
})();
