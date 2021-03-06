#! /usr/bin/env node

const TEMPLATE_FILENAME = 'template.yml';
const STACKNAME = 'cardian-api-dev';

const { Lambda, CloudFormation } = require('aws-sdk');
const { yamlParse } = require('yaml-cfn');
const { readFileSync } = require('fs');
const { difference, keys, uniq, pick, pickBy, toPairs, lastIndexOf } = require('lodash');
const { basename, resolve, dirname, extname } = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);


function loadFunctions(fname) {
  // Parse the template file and extract anything that is a Serverless::Function
  // We compare the logical name against the filter provided by the user
  const template = yamlParse(readFileSync(TEMPLATE_FILENAME, 'utf8'));
  let functions;
  if(fname === 'all') {
    functions = toPairs(pickBy(template.Resources, (resource, name) => (
      resource.Type === 'AWS::Serverless::Function'
    ))).map(([name, fn]) => ({ Name: name, ...fn.Properties }));
  } else {
    functions = toPairs(pickBy(template.Resources, (resource, name) => (
      name.toLowerCase().includes(fname.toLowerCase()) && resource.Type === 'AWS::Serverless::Function'
    ))).map(([name, fn]) => ({ Name: name, ...fn.Properties }));
  }

  if (functions.length === 0) {
    console.error(`No functions found to deploy that match ${fname}`);
    return;
  }

  console.error(`Found ${functions.length} function(s) to deploy:\n${functions.map(f => `- ${f.Name}`).join('\n')}\n`);
  return functions;
}

async function zipFunctions(resolvedFunctions) {
  await Promise.all(resolvedFunctions.map(async (fn) => {
    const pathname = fn.Handler.slice(4, -8);
    try {
      await exec(`zip build/${pathname}.zip src/${pathname}.js`);
    } catch (e) {
      console.warn(`mkdir -p build/${pathname.substr(0, pathname.lastIndexOf('/'))}`)
      await exec(`mkdir -p build/${pathname.substr(0, pathname.lastIndexOf('/'))}`);
      await exec(`zip build/${pathname}.zip src/${pathname}.js`);
    }
  }));
};

async function deployFunctions(resolvedFunctions) {
  const lambda = new Lambda();
  
  // For each function, we upload the zip with the code generated by webpack
  console.log(`Uploading functions:\n${resolvedFunctions.map(f => `- ${f.ResourceId}`).join('\n')}\n`);
  await Promise.all(resolvedFunctions.map(async (fn) => {
    const pathname = fn.Handler.slice(4, -8);
    const zipFilePath = `build/${pathname}.zip`
    await lambda.updateFunctionCode({ FunctionName: fn.ResourceId, ZipFile: readFileSync(zipFilePath) }).promise();
  }));

  console.log(`Upload finished!`);
}


async function main() {
  const fname = process.argv[2];
  if (!fname) throw new Error(`Provide a substring of the function names to deploy`);

  if (!STACKNAME) throw new Error(`STACKNAME is missing from env`);
  if (!process.env.AWS_PROFILE) throw new Error(`AWS_PROFILE is missing from env`);
  if (!process.env.AWS_REGION) throw new Error(`AWS_REGION is missing from env`);

  const functions = loadFunctions(fname);
  if (functions.length === 0) return;

  const cfn = new CloudFormation();

  const resolvedFunctions = await Promise.all(functions.map(async (fn) => {
    const response = await cfn.describeStackResource({ LogicalResourceId: fn.Name, StackName: STACKNAME }).promise();
    const resourceId = response.StackResourceDetail.PhysicalResourceId;
    return { ...fn, ResourceId: resourceId };
  }));

  await zipFunctions(resolvedFunctions);
  await deployFunctions(resolvedFunctions);
}


main().catch(err => { console.error('Error:', err.message, err.stack); process.exit(1); });