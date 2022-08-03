const express = require('express');

const router = express.Router();

const Redis = require('../services/redis');

const redisClass = new Redis();

router.all('/*', (req, res, next) => {
  if (req.headers.authorization === process.env.ADMIN_KEY) {
    return next(); // it doesn't do anything, just allows the route above to work
  }
  return res.status(403).json({ error: 'Not Allowed' });
});

/**
 * @api {get} /templates Request Template information
 * @apiName GetTemplate
 * @apiGroup Template
 *
 * @apiParam {String} id User Api Key unique Key.
 *
 * @apiSuccess {String} All User Template
 */
router.get('/', (req, res) =>
  redisClass
    .keys('*')
    .then((result) => {
      const response = [];
      if (result.length === 0) {
        res.json(response);
      }
      console.log(result.length);
      return result.forEach((element, index) => {
        const apikey = element.replace('apikey:', '');
        redisClass
          .get(apikey)
          // eslint-disable-next-line consistent-return
          .then((data) => {
            response.push({
              apiKey: apikey,
              template: data,
            });
            if (index === result.length - 1) {
              return res.json(response);
            }
          })
          .catch((err) => res.status(500).json({ error: JSON.stringify(err) }));
      });
    })
    .catch((err1) => res.status(500).json({ error: JSON.stringify(err1) }))
);

/**
 * @api {get} /templates/:id Request Template information
 * @apiName GetTemplate
 * @apiGroup Template
 *
 * @apiParam {String} id User Api Key unique Key.
 *
 * @apiSuccess {String} User Template
 */
router.get('/:id', (req, res) =>
  redisClass
    .get(req.params.id)
    .then((data) => {
      if (data !== null) {
        return res.json({
          apiKey: req.params.id,
          template: data,
        });
      }
      return res.status(404).json({ error: 'Not found' });
    })
    .catch(() => res.status(404).json({ error: 'Not found' }))
);

/**
 * @api {put} /templates/:id Stores Template information
 * @apiName PutTemplate
 * @apiGroup Template
 *
 * @apiParam {String} id User Api Key unique Key.
 * @apiParam {Object} Template data to be stored.
 *
 * @apiSuccess {String} User Template
 */
router.put('/:id', (req, res) => {
  if (Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Cannot be array' });
  }

  return redisClass
    .get(req.params.id)
    .then((data) => {
      if (data !== null) {
        redisClass
          .set(`apikey:${req.params.id}`, req.body.template)
          .catch((err) => res.status(500).json({ error: JSON.stringify(err) }));
        return res.json({
          apiKey: req.params.id,
          template: req.body.template,
        });
      }
      return res.status(404).json({ error: 'Not found' });
    })
    .catch(() => res.status(404).json({ error: 'Not found' }));
});

/**
 * @api {post} /templates/:id Stores Template information
 * @apiName PostTemplate
 * @apiGroup Template
 *
 * @apiParam {Object} Template data to be stored.
 *
 * @apiSuccess {String} User Template
 */
router.post('/', (req, res) => {
  let data = req.body;
  if (data.constructor === Object && Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Missing params' });
  }
  if (!Array.isArray(data)) {
    data = [data];
  }

  const error = {};
  data.forEach((element) => {
    redisClass.set(`apikey:${element.apiKey}`, element.template).catch((err) => {
      error[`apikey:${element.apiKey}`] = err;
    });
  });

  if (Object.keys(error).length > 0) {
    return res.status(500).json({ error: JSON.stringify(error) });
  }
  return res.json(data);
});

/**
 * @api {delete} /templates/:id Deletes Template information
 * @apiName DeleteTemplate
 * @apiGroup Template
 *
 * @apiParam {Object} Template data to be stored.
 *
 * @apiSuccess {String} User Template
 */
router.delete('/:id', (req, res) =>
  redisClass
    .get(req.params.id)
    .then((data) => {
      if (data !== null) {
        return redisClass
          .del(req.params.id)
          .then(() => res.json({ message: 'Deleted' }))
          .catch((err) => res.status(500).json({ error: JSON.stringify(err) }));
      }
      return res.status(404).json({ error: 'Not found' });
    })
    .catch(() => res.status(404).json({ error: 'Not found' }))
);

module.exports = router;
