const express = require('express');

const fs = require('fs');
const path = require('path');
const exec = require('child_process');
const uri = require('uri-js');
const log = require('../services/log');
const Redis = require('../services/redis');

const router = express.Router();

const publicFolder = process.env.PUBLIC_FOLDER;

const getAllFiles = (dirPath, arrayOfFiles, parentFolder, level) => {
  const files = fs.readdirSync(dirPath);
  const publicUrl = `${process.env.PUBLIC_URL}:${process.env.PUBLIC_PORT}`;
  files.forEach((file) => {
    const filePath = `${dirPath}/${file}`;
    if (fs.statSync(filePath).isDirectory()) {
      if (filePath.split('/').length === 2) {
        parentFolder = file;
      }
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles, parentFolder, level);
    } else if (file.split('.').slice(-1).pop() === 'mp4' || file.split('.').slice(-1).pop() === 'mkv') {
      const fileName = file.split('.').slice(0, -1).join('.');

      const obj = {
        genre: parentFolder,
        name: fileName,
        video: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, '/', file).replace(`${publicFolder}/`, ''))
        )}`,
        thumb: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, '/', `${fileName}.jpg`).replace(`${publicFolder}/`, ''))
        )}`,
      };
      arrayOfFiles.push(obj);
      const imageName = `${fileName}.jpg`;
      try {
        if (!fs.existsSync(`${path.join(dirPath, '/', imageName)}`)) {
          exec.execSync(
            `ffmpeg -loglevel quiet -ss 0:02:00 -n -i ${path
              .join(dirPath, '/', file)
              .replace(/(?=[&() ])/g, '\\')} -frames:v 1 -q:v 2 ${path
              .join(dirPath, '/', imageName)
              .replace(/(?=[&() ])/g, '\\')}`
          );
        }
      } catch (e) {
        log(`Unable to process image for [${imageName}] with error [${e}]`);
      }
    }
  });
  return arrayOfFiles;
};

const updateRedis = (files) => {
  const redis = new Redis();
  redis.flushDb();
  files.forEach((file) => {
    let index = file.name.replace(/(&|\(|\)|'|"| )/g, '');
    if (file.genre === '') {
      file.genre = 'all';
    }
    index = `${file.genre.replace(/(&|\(|\)|'|")/g, '')}:${index}`;
    redis.set(index, JSON.stringify(file));
    log(file);
  });
};

router.get('', (_req, res) => {
  const files = getAllFiles(publicFolder, [], '', 0);
  updateRedis(files);
  res.status(200).json(files);
});

const files = getAllFiles(publicFolder, [], '', 0);
updateRedis(files);

module.exports = router;
