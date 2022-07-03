const variables = {
  allowedDimensions: [200, 300, 400, 500, 600, 700, 800],
  defaultDimension: 600,
  allowedQualities: [80, 90, 100],
  defaultQuality: 80,
  allowedFits: ['cover', 'contain', 'fill', 'inside', 'outside'],
  webpExtension: 'webp',
};

const getDimension = (d) => {
  const allowedDimensions = variables.allowedDimensions;

  for (let i = 0, length = allowedDimensions.length; i < length; ++i) {
    const dimension = allowedDimensions[i];
    if (d <= dimension) return dimension;
  }

  return variables.defaultDimension;
};

const getQuality = (q) => {
  const allowedQualities = variables.allowedQualities;

  for (let i = 0, length = allowedQualities.length; i < length; ++i) {
    const quality = allowedQualities[i];
    if (q <= quality) return quality;
  }

  return variables.defaultQuality;
};

exports.handler = (event, _, callback) => {
  const request = event.Records[0].cf.request;
  const { headers } = request;

  const params = new URLSearchParams(request.querystring);

  // height & width
  if (params.has('h')) params.set('h', getDimension(+params.get('h')));
  if (params.has('w')) params.set('w', getDimension(+params.get('w')));
  if (!params.has('h') && !params.has('w'))
    params.set('w', variables.defaultDimension);

  // fit
  const fit = params.get('f');
  if (variables.allowedFits.includes(fit)) params.set('f', fit);

  // quality
  const quality = getQuality(+params.get('q'));
  params.set('q', quality);

  // extension
  if (headers['accept']?.[0].value.includes(variables.webpExtension)) {
    params.set('e', variables.webpExtension);
  }

  request.querystring = params.toString();

  callback(null, request);
};
