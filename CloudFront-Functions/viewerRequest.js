function handler(event) {
  var defaultQuerystring = {
    w: { value: undefined },
    h: { value: undefined },
    f: { value: 'cover' },
    q: { value: 90 },
  };

  var request = event.request;
  var querystring = Object.assign(defaultQuerystring, request.querystring);

  request.querystring.e = {
    value:
      request.headers.accept && request.headers.accept.value.includes('webp')
        ? 'webp'
        : 'jpeg',
  };
  request.querystring.f = {
    value: variables.allowedFits.includes(querystring.f.value)
      ? querystring.f.value
      : 'cover',
  };
  request.querystring.q = {
    value: getQuality(+querystring.q.value).toString(),
  };

  if (!querystring.w.value && !querystring.h.value) {
    request.querystring.w = {
      value: getDimension(+querystring.w.value).toString(),
    };
  } else {
    if (querystring.w.value) {
      request.querystring.w = {
        value: getDimension(+querystring.w.value).toString(),
      };
    }
    if (querystring.h.value) {
      request.querystring.h = {
        value: getDimension(+querystring.h.value).toString(),
      };
    }
  }

  return request;
}

var variables = {
  allowedDimensions: [200, 300, 400, 500, 600, 700, 800],
  defaultDimension: 800,
  allowedQualities: [80, 90, 100],
  defaultQuality: 90,
  allowedFits: ['cover', 'contain', 'fill', 'inside', 'outside'],
};

function getDimension(d) {
  var allowedDimensions = variables.allowedDimensions;

  for (var i = 0, length = allowedDimensions.length; i < length; ++i) {
    var dimension = allowedDimensions[i];
    if (d <= dimension) return dimension;
  }

  return variables.defaultDimension;
}

function getQuality(q) {
  var allowedQualities = variables.allowedQualities;

  for (var i = 0, length = allowedQualities.length; i < length; ++i) {
    var quality = allowedQualities[i];
    if (q <= quality) return quality;
  }

  return variables.defaultQuality;
}
