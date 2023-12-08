const express = require('express');

const fs = require('fs');
const path = require('path');
const exec = require('child_process');
const uri = require('uri-js');
const log = require('../services/log');
const Redis = require('../services/redis');

const router = express.Router();

const publicFolder = process.env.PUBLIC_FOLDER;
const publicUrl = `${process.env.PUBLIC_URL}:${process.env.PUBLIC_PORT}`;

const allowTypes = ['mp4', 'mkv', 'm4v'];

const redis = new Redis();
redis.flushDb();

const getAllFiles = (dirPath, arrayOfFiles, gender, level, parentFolder) => {
  const parentFolderSize = publicFolder.split('/').length;
  let files;
  try {
    files = fs.readdirSync(dirPath);
  } catch (_err) {
    if (allowTypes.includes(dirPath.split('.').slice(-1).pop())) {
      log('File in parent directory, ignoring for now, kind of');
      const fileName = dirPath.replace(`${publicFolder}/`, '').split('.').slice(0, -1).join('.');
      const imageName = `${dirPath}.jpg`;
      const obj = {
        parent: 'all',
        genre: parentFolder,
        name: fileName,
        video: `${publicUrl}/${uri.serialize(uri.parse(dirPath.replace(`${publicFolder}/`, '')))}`,
        thumb: `${publicUrl}/${uri.serialize(uri.parse(imageName.replace(`${publicFolder}/`, '')))}`,
      };
      try {
        if (!fs.existsSync(dirPath)) {
          exec.execSync(
            `ffmpeg -loglevel quiet -ss 0:02:00 -n -i ${dirPath.replace(
              /(?=[&() ])/g,
              '\\'
            )} -frames:v 1 -q:v 2 ${dirPath.replace(/(?=[&() ])/g, '\\')}`
          );
        }
      } catch (e) {
        log(`Unable to process image for [${imageName}] with error [${e}]`);
      }
      return [obj];
    }
    return [];
  }

  files.forEach((file) => {
    const filePath = `${dirPath}/${file}`;
    if (fs.statSync(filePath).isDirectory()) {
      if (filePath.split('/').length === parentFolderSize + 2) {
        gender = file;
      }
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles, gender, level, parentFolder);
    } else if (allowTypes.includes(file.split('.').slice(-1).pop())) {
      const fileName = file.split('.').slice(0, -1).join('.');
      const imageName = `${fileName}.jpg`;
      const obj = {
        parent: parentFolder,
        genre: gender,
        name: fileName,
        video: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, '/', file).replace(`${publicFolder}/`, ''))
        )}`,
        thumb: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, '/', imageName).replace(`${publicFolder}/`, ''))
        )}`,
      };
      arrayOfFiles.push(obj);

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
  if (!Array.isArray(files)) {
    log('File in parent directory, ignoring for now');
    return;
  }
  files.forEach((file) => {
    let index = file.name.replace(/(&|\(|\)|'|"| )/g, '');
    if (file.genre === '') {
      file.genre = 'all';
    }
    if (file.parent === '') {
      file.parent = 'all';
    }
    index = `${file.parent.replace(/(&|\(|\)|'|")/g, '')}:${file.genre.replace(/(&|\(|\)|'|")/g, '')}:${index}`;
    redis.set(index, JSON.stringify(file));
  });
};

router.get('', (_req, res) => {
  const parentFolders = fs.readdirSync(publicFolder);

  const fullFiles = [];
  parentFolders.forEach((folder) => {
    const files = getAllFiles(`${publicFolder}/${folder}`, [], '', 0, folder);
    updateRedis(files);
    fullFiles.push(files);
  });
  res.status(200).json(fullFiles);

  /* const files = getAllFiles(publicFolder, [], '', 0);
  updateRedis(files);
  res.status(200).json(files);
   */
});

const parentFolders = fs.readdirSync(publicFolder);

const fullFiles = [];
parentFolders.forEach((folder) => {
  const files = getAllFiles(`${publicFolder}/${folder}`, [], '', 0, folder);
  updateRedis(files);
  fullFiles.push(files);
});

module.exports = router;
