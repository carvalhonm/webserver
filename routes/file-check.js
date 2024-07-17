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
    // Handling single file case
    if (allowTypes.includes(dirPath.split('.').slice(-1).pop())) {
      const stats = fs.statSync(dirPath);
      const fileName = path.basename(dirPath, path.extname(dirPath));
      const obj = {
        parent: 'all',
        genre: parentFolder,
        name: fileName,
        subtitles: `${publicUrl}/${uri.serialize(uri.parse(`${fileName}.srt`.replace(`${publicFolder}/`, '')))}`,
        video: `${publicUrl}/${uri.serialize(uri.parse(dirPath.replace(`${publicFolder}/`, '')))}`,
        thumb: `${publicUrl}/${uri.serialize(uri.parse(`${fileName}.jpg`.replace(`${publicFolder}/`, '')))}`,
        mtime: stats.mtime,
      };
      return [obj];
    }
    return [];
  }

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (filePath.split('/').length === parentFolderSize + 2) {
        gender = file;
      }
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles, gender, level, parentFolder);
    } else if (allowTypes.includes(file.split('.').slice(-1).pop())) {
      const stats = fs.statSync(filePath);
      const fileName = path.basename(file, path.extname(file));
      const obj = {
        parent: parentFolder,
        genre: gender,
        name: fileName,
        subtitles: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, `${fileName}.srt`).replace(`${publicFolder}/`, ''))
        )}`,
        video: `${publicUrl}/${uri.serialize(uri.parse(filePath.replace(`${publicFolder}/`, '')))}`,
        thumb: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, `${fileName}.jpg`).replace(`${publicFolder}/`, ''))
        )}`,
        mtime: stats.mtime,
      };
      arrayOfFiles.push(obj);
    }
  });
  return arrayOfFiles;
};

const getLatestFiles = (files, limit = 10) =>
  files.sort((a, b) => new Date(b.mtime) - new Date(a.mtime)).slice(0, limit);

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

log('Start SERVICE File Analysis');
const parentFolders = fs.readdirSync(publicFolder);

let allFiles = [];
parentFolders.forEach((folder) => {
  log(`Processing Folder ${folder}`);
  const files = getAllFiles(path.join(publicFolder, folder), [], '', 0, folder);
  updateRedis(files); // Atualiza o Redis com todos os ficheiros
  allFiles = allFiles.concat(files); // Adiciona à lista completa de ficheiros
  log(`Finished Processing Folder ${folder}`);
});

// Selecionar os 10 ficheiros mais recentes
const latestFiles = getLatestFiles(allFiles, 10);
redis.set('latest', JSON.stringify(latestFiles));

module.exports = router;
