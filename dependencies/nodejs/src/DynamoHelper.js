// aws lambda publish-layer-version --layer-name lambda_layer_aws_helper --description “AWS Helper functions. Dependencies: Boto3 v1.12.14” --license-info “MIT” --zip-file fileb://lambda_layer_python_aws_helper.zip --compatible-runtimes python3.8
const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient(dynamo_config);
const TableName = `QuoteBotDB`;

exports.genericGetItem = async (dynamo_key) => {
  const get_item_params = {
    Key: dynamo_key, 
    TableName
  };
  
  const {Item} = await dynamodb.get(get_item_params).promise();

  return Item;
}

exports.genericBatchGet = async (keys) => {
  const batch = await dynamodb.batchGet({
    RequestItems: {
      [TableName]: {
        Keys: keys
      }
    }
  }).promise();

  return batch.Responses[TableName];
}

exports.genericQueryByPKStartSK = async ({PK, SK}) => {
  const query_params = {
    KeyConditionExpression: 'PK = :hkey and begins_with(SK, :rkey)',
    ExpressionAttributeValues: {
      ':hkey':  PK,
      ':rkey': SK
    },
    TableName
  };
  
  const {Items} = await dynamodb.query(query_params).promise();
  return Items;
}

exports.genericPutItem = async (attributes) => {
  const params = {
    Item: attributes,
    TableName,
    ReturnValues: 'ALL_OLD',
    ConditionExpression: 'attribute_not_exists(PK) and attribute_not_exists(SK)'
  };

  const response = await dynamodb.put(params).promise();
  return response ? attributes : null;
}

exports.genericSafeUpdate = async (dynamo_key, raw_attributes, banned_attributes = null) => {
  let attributes = Object.assign(raw_attributes);
  if (banned_attributes) {
    Object.keys(raw_attributes).forEach(key => {
      if(banned_attributes[key]) {
        delete attributes[key];
      }
    });
  }

  console.warn(attributes)

  let UpdateExpression = 'set';
  let ExpressionAttributeValues = {};

  Object.keys(attributes).forEach((key) => {
    UpdateExpression = `${UpdateExpression} ${key} = :${key},`;
    ExpressionAttributeValues = {[`:${key}`]: attributes[key], ...ExpressionAttributeValues};
  })

  UpdateExpression = UpdateExpression.slice(0, -1);
  
  const params = {
    UpdateExpression,
    ExpressionAttributeValues,
    ReturnValues:"ALL_NEW",
    Key: dynamo_key,
    TableName
  }

  const response = await dynamodb.update(params).promise();
  return response.Attributes;
}

exports.genericSafeUpdateDeepObj = async (deep_key, dynamo_key, attributes) => {
  const current_time = new Date().getTime();
  let UpdateExpression = 'set date_updated = :date_updated, ';
  let ExpressionAttributeNames = {};
  let ExpressionAttributeValues = {':date_updated': current_time};
  let key_num = 0;
  Object.keys(attributes).forEach((key) => {
    const expression_key = `id${key_num}`
    UpdateExpression = `${UpdateExpression} ${deep_key}.#${expression_key} = :${expression_key},`;
    ExpressionAttributeNames =  {[`#${expression_key}`]: key, ...ExpressionAttributeNames};
    ExpressionAttributeValues = {[`:${expression_key}`]: attributes[key], ...ExpressionAttributeValues};
    key_num++;
  })

  UpdateExpression = UpdateExpression.slice(0, -1);
  
  const params = {
    UpdateExpression,
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ReturnValues:"ALL_NEW",
    Key: dynamo_key,
    TableName
  }

  const response = await dynamodb.update(params).promise();
  return response.Attributes;
}