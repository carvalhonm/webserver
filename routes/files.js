const express = require('express');

const data = require('../sampleData');
const log = require('../services/log');

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
router.all('/categories', (req, res, next) => res.status(200).json(Object.keys(data)));

/* router.all('/:id/:file', (req, res, next) => {
  if (data[req.params.id] !== undefined && data[req.params.id]) {
    return res.status(200).json(data[req.params.id]);
  }
  return res.status(204).json({ status: 'No Content' });
}); */
router.all('/categories/:id', (req, res, next) => {
  log(Object.keys(data));
  log(req.params.id);
  if (data[req.params.id] !== undefined) {
    return res.status(200).json(data[req.params.id]);
  }
  return res.status(204).json({ status: 'No Content' });
});

router.all('/', (req, res, next) => res.status(200).json(data));

module.exports = router;
