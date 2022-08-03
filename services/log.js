const log = (txt) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(txt);
  }
};

module.exports = log;
