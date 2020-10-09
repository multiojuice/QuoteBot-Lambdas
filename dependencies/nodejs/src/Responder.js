
const headers = {
  "Access-Control-Allow-Headers" : "*",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,DELETE",
  'Access-Control-Allow-Credentials': true,
  'X-Requested-With': '*'
};


exports.generateSuccess = (data, message) => {
  return {
    statusCode: 200,
    isBase64Encoded: false,
    headers,
    body: JSON.stringify({data, message, success: true})
  };
}

exports.generate400 = (message) => {
  return {
    statusCode: 400,
    isBase64Encoded: false,
    headers,
    body: JSON.stringify({message: `Bad Request: ${message}`, success: false, data: null})
  };
}

exports.generate401 = (message) => {
  return {
    statusCode: 401,
    isBase64Encoded: false,
    headers,
    body: JSON.stringify({message: `Unauthorized: ${message}`, success: false, data: null})
  };
}

exports.generate403 = (message) => {
  return {
    statusCode: 403,
    isBase64Encoded: false,
    headers,
    body: JSON.stringify({message: `Forbidden: ${message}`, success: false, data: null})
  };
}

exports.generate404 = (message) => {
  return {
    statusCode: 404,
    isBase64Encoded: false,
    headers,
    body: JSON.stringify({message: `Not found: ${message}`, success: false, data: null})
  };
}

exports.autoResponseAsync = async (f, error_message, fall_through_error = 'there was an unknown error') => {
  let response;

  try {
    response =  await f();
  } catch (e) {
    console.warn(error_message, e)
    return this.generate400(error_message);
  }

  if (response) {
    return this.generateSuccess(response);
  }

  console.warn(response);

  return this.generate400(fall_through_error);
}