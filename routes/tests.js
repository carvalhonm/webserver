const express = require('express');

const router = express.Router();

/**
 * @api {get} /templates Request Template information
 * @apiName GetTemplate
 * @apiGroup Template
 *
 * @apiParam {String} id User Api Key unique Key.
 *
 * @apiSuccess {String} All User Template
 */
router.all('*', (req, res, next) => res.status(200).json({ status: 'OK' }));

module.exports = router;
