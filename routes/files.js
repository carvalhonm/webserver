const express = require('express');

const log = require('../services/log');
const Redis = require('../services/redis');

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
router.all('/categories', (req, res, next) => {
  const redis = new Redis();
  return redis
    .keys('*')
    .then((data) => {
      const response = {};
      data.forEach((value) => {
        const keys = value.split(':')[0];
        response[keys] = keys;
      });
      res.status(200).json(response);
    })
    .catch(() => res.status(204).json({ status: 'No Content' }));
});

/* router.all('/:id/:file', (req, res, next) => {
  if (data[req.params.id] !== undefined && data[req.params.id]) {
    return res.status(200).json(data[req.params.id]);
  }
  return res.status(204).json({ status: 'No Content' });
}); */
router.all('/categories/:id', async (req, res, next) => {
  log(req.params.id);
  /* if (data[req.params.id] !== undefined) {
    return res.status(200).json(data[req.params.id]);
  } */
  const redis = new Redis();
  const data = await redis.keys(`${req.params.id}*`);
  // .then((data) => {
  if (data.length === 0) {
    return res.status(204).json({ status: 'No Content' });
  }
  const response = [];
  const keys = [];
  data.forEach((value) => {
    keys.push(value);
  });
  if (keys.length === 0) {
    return res.status(204).json({ status: 'No Content' });
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const key of keys) {
    const record = await redis.get(key);
    response.push(JSON.parse(record));
  }
  return res.status(200).json(response);
});

// router.all('/', (_req, res) => res.status(200).json(sampleData));

module.exports = router;
