require('dotenv').config();
// const path = require('path')
// require('dotenv').config({ path: path.resolve(__dirname, './.env') })

console.log(process.env);

const express = require('express');
const cors = require('cors');

const tests = require('./routes/tests');
const fileList = require('./routes/files');
const foldersList = require('./routes/folders');
const fileCheck = require('./routes/file-check');

const app = express();
const publicApp = express();
const unsecurePublicApp = express();
const log = require('./services/log');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
publicApp.use(express.static(process.env.PUBLIC_FOLDER));
unsecurePublicApp.use(express.static(process.env.PUBLIC_FOLDER));

app.use((req, res, next) => {
  log(`Method: ${req.method}\noriginalUrl: ${req.originalUrl}\nPath: ${req.path}`);
  if (!req.headers.authorization || req.headers.authorization !== process.env.ADMIN_KEY) {
    log('No authorization send');
    return res.status(403).json({ error: 'Not Allowed' });
  }

  return next();
});

app.use('/api/v1/test', tests);
app.use('/api/v1/list-folders', foldersList);
app.use('/api/v1/list-files', fileList);
app.use('/api/v1/file-check', fileCheck);

module.exports = {
  app,
  publicApp,
  unsecurePublicApp,
};
