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
router.all('/folders', (req, res) => {
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
router.all('/folders/:id', async (req, res) => {
  log(req.params.id);

  const redis = new Redis();
  const data = await redis.keys(`${req.params.id}:*`);

  if (data.length === 0) {
    return res.status(204).json({ status: 'No Content' });
  }

  const response = new Set();
  data.forEach((value) => {
    const keys = value.split(':')[1];
    response.add(keys);
  });
  return setTimeout(() => res.status(200).json(Array.from(response)), 0);
});

// router.all('/', (_req, res) => res.status(200).json(sampleData));

module.exports = router;
