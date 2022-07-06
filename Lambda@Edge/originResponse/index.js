const AWS = require('aws-sdk');
const sharp = require('sharp');

const S3 = new AWS.S3({
  signatureVersion: 'v4',
  region: 'ap-northeast-2',
});
const BUCKET = '';

const supportedTypes = {
  avif: true,
  gif: true,
  jpeg: true,
  jpg: true,
  png: true,
  svg: true,
  tiff: true,
  webp: true,
};

exports.handler = async (event, _, callback) => {
  const {
    response,
    request: { uri, querystring },
  } = event.Records[0].cf;

  if (response.status >= 400) {
    callback(null, response);
    return;
  }

  const extenstion = uri.match(/\.(\w*)$/)?.[1].toLowerCase();

  if (!supportedTypes[extenstion]) {
    // response.status = 415;
    // response.body = 'Unsupported Media Type';
    // response.headers['content-type'] = [
    //   { key: 'Content-Type', value: 'text/plain' },
    // ];

    callback(null, response);
    return;
  }

  const params = new URLSearchParams(querystring);
  const format = params.get('e') || 'jpeg';
  let quality = +params.get('q');
  let height;
  let width;
  let fit;

  if (params.has('h')) height = +params.get('h');
  if (params.has('w')) width = +params.get('w');
  if (params.has('f')) fit = params.get('f');

  const { Body } = await S3.getObject({
    Bucket: BUCKET,
    Key: uri.substring(1),
  }).promise();

  const { height: h, width: w, pages } = await sharp(Body).metadata();
  const animated = pages > 1;

  if (animated) {
    callback(null, response);
    return;
  }

  const mozjpeg = format === 'jpeg';
  if (height > h) height = h;
  if (width > w) width = w;

  let buffer;

  do {
    buffer = await sharp(Body, { animated })
      .rotate()
      .resize({
        height,
        width,
        fit,
      })
      .toFormat(format, { quality, mozjpeg })
      .toBuffer();

    quality = Math.floor(quality * 0.9);
  } while (Buffer.byteLength(buffer) > 1048576);

  response.status = 200;
  response.body = buffer.toString('base64');
  response.bodyEncoding = 'base64';
  response.headers['content-type'] = [
    { key: 'Content-Type', value: 'image/' + format },
  ];

  callback(null, response);
};
