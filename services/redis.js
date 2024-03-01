const log = require('./log');

class Redis {
  constructor() {
    // eslint-disable-next-line global-require
    const redis = require('redis');
    log(`REDIS Host: ${process.env.REDIS_HOST}`);
    log(`REDIS Port: ${process.env.REDIS_PORT}`);
    log(`REDIS Database: ${process.env.REDIS_DATABASE}`);

    this.redisClient = redis.createClient({
      url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DATABASE}`,
    });
    this.redisClient.on('error', (error) => {
      log(error);
    });
  }

  keys(value) {
    const this1 = this;
    return new Promise((resolve, reject) => {
      this1.redisClient.keys(`${value}`, (err, result) => {
        if (err) {
          log(`Find keys error:${value}`);
          return reject(err);
        }
        return resolve(result);
      });
    });
  }

  set(key, value) {
    // log(`Set key: ${key} -> value: ${value}`);
    return new Promise((resolve, reject) => {
      this.redisClient.set(key, value, (err) => {
        if (err) {
          log(`Set error for key: ${key} -> value: ${value}`);
          // eslint-disable-next-line prefer-promise-reject-errors
          return reject(false);
        }
        return resolve(true);
      });
    });
  }

  get(key) {
    log(`Get key: ${key}`);
    return new Promise((resolve, reject) => {
      this.redisClient.get(`${key}`, (err, data) => {
        if (err) {
          log(`Get error for key: ${key}`);
          // eslint-disable-next-line prefer-promise-reject-errors
          return reject();
        }
        return resolve(data);
      });
    });
  }

  getParsed(key) {
    log(`Get key: ${key}`);
    return new Promise((resolve, reject) => {
      this.redisClient.get(`${key}`, (err, data) => {
        if (err) {
          log(`Get error for key: ${key}`);
          // eslint-disable-next-line prefer-promise-reject-errors
          return reject();
        }
        return resolve(JSON.parse(data));
      });
    });
  }

  del(key) {
    log(`Delete key: ${key}`);
    return new Promise((resolve, reject) => {
      this.redisClient.del(`${key}`, (err) => {
        if (err) {
          log(`Delete error for key: ${key}`);
          // eslint-disable-next-line prefer-promise-reject-errors
          return reject();
        }
        log(`Delete OK for key: ${key}`);
        return resolve();
      });
    });
  }

  flushDb() {
    log('Flushing redis DB');
    return new Promise((resolve, reject) => {
      this.redisClient.flushdb((err) => {
        if (err) {
          return reject();
        }
        return resolve();
      });
    });
  }
}

module.exports = Redis;
