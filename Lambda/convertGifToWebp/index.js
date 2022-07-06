const AWS = require('aws-sdk');
const sharp = require('sharp');

const s3 = new AWS.S3();
const cloudFront = new AWS.CloudFront();

exports.handler = async (event) => {
  const Bucket = event.Records[0].s3.bucket.name;
  const Key = event.Records[0].s3.object.key;

  const { Body, ContentType } = await s3.getObject({ Bucket, Key }).promise();

  if (!/\/gif$/.test(ContentType)) {
    return;
  }

  const { width: w, height: h, pages } = await sharp(Body).metadata();
  const height = h < 800 ? h : 800;
  const width = w < 600 ? w : 600;
  const animated = pages > 1;
  let quality = 85;
  let buffer;

  if (!animated) {
    return;
  }

  do {
    buffer = await sharp(Body, { animated })
      .rotate()
      .resize({ height, width, fit: 'inside' })
      .webp({ effort: 5, quality })
      .toBuffer();

    quality = Math.floor(quality * 0.9);
  } while (Buffer.byteLength(buffer) > 3145728);

  await s3
    .putObject({
      Body: buffer,
      Bucket,
      ContentType: 'image/webp',
      Key,
    })
    .promise();

  return cloudFront
    .createInvalidation({
      DistributionId: '',
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: 1,
          Items: ['/' + Key + '*'],
        },
      },
    })
    .promise();
};
