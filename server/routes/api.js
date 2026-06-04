const express = require('express');
const router = express.Router();
const rc5Controller = require('../controllers/rc5Controller');

router.post('/encrypt', rc5Controller.encryptData);
router.post('/decrypt', rc5Controller.decryptData);
router.post('/generate-key', rc5Controller.generateKey);
// ADD THIS LINE:
router.post('/encrypt-cbc', rc5Controller.encryptCBCData);
router.post('/decrypt-cbc', rc5Controller.decryptCBCData);

module.exports = router;