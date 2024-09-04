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

const formatSeconds = (seconds) => {
  // Converte os segundos em horas, minutos e segundos
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  // Formata horas, minutos e segundos
  const formattedHours = hours > 0 ? `${hours}:` : '';
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = secs.toString().padStart(2, '0');

  // Retorna a string no formato desejado
  return `${formattedHours}${formattedMinutes}:${formattedSeconds}`;
};

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
      const subtitleName = `${dirPath}.srt`;
      const obj = {
        parent: 'all',
        genre: parentFolder,
        name: fileName,
        subtitles: `${publicUrl}/${uri.serialize(uri.parse(subtitleName.replace(`${publicFolder}/`, '')))}`,
        video: `${publicUrl}/${uri.serialize(uri.parse(dirPath.replace(`${publicFolder}/`, '')))}`,
        thumb: `${publicUrl}/${uri.serialize(uri.parse(imageName.replace(`${publicFolder}/`, '')))}`,
      };
      try {
        if (!fs.existsSync(dirPath)) {
          const fileStats = exec.execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${dirPath}"`
          );
          let duration = '0:02:00';
          if (fileStats.toString() < 120) {
            duration = formatSeconds(fileStats.toString() / 2);
          }
          exec.execSync(
            `ffmpeg -loglevel quiet -ss ${duration} -n -i ${dirPath.replace(
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
      const subtitleName = `${fileName}.srt`;
      const obj = {
        parent: parentFolder,
        genre: gender,
        name: fileName,
        subtitles: `${publicUrl}/${uri.serialize(
          uri.parse(path.join(dirPath, '/', subtitleName).replace(`${publicFolder}/`, ''))
        )}`,
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
          const fileStats = exec.execSync(
            `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${path.join(
              dirPath,
              '/',
              file
            )}"`
          );
          let duration = '0:02:00';
          if (fileStats.toString() < 120) {
            duration = formatSeconds(fileStats.toString() / 2);
          }
          exec.execSync(
            `ffmpeg -loglevel quiet -ss ${duration} -n -i ${path
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

/* router.get('', (_req, res) => {
  const parentFolders = fs.readdirSync(publicFolder);

  const fullFiles = [];
  parentFolders.forEach((folder) => {
    const files = getAllFiles(`${publicFolder}/${folder}`, [], '', 0, folder);
    updateRedis(files);
    fullFiles.push(files);
  });
  res.status(200).json(fullFiles);
}); */

log('Start SERVICE File Analisys');
const parentFolders = fs.readdirSync(publicFolder);

const fullFiles = [];
parentFolders.forEach((folder) => {
  log(`Processing Folder ${folder}`);
  const files = getAllFiles(`${publicFolder}/${folder}`, [], '', 0, folder);
  updateRedis(files);
  fullFiles.push(files);
  log(`Finnish Processing Folder ${folder}`);
});

module.exports = router;
