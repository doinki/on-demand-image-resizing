function handler(event) {
  var response = event.response;
  var statusCode = response.statusCode;
  var headers = response.headers;

  if (
    statusCode === 200 &&
    headers['content-type'] &&
    headers['content-type'].value.includes('image/webp')
  ) {
    headers['cache-control'] = {
      value: 'max-age=86400',
    };
  }

  return response;
}
