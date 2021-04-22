import Store from './db-grades.mjs';
import serve from './ws-server.mjs';

import { CourseGrades, AppError } from 'course-grades';
import getCourseInfo from 'courses-info';

import fs from 'fs';
import Path from 'path';
import util from 'util';

const {promisify} = util;

async function main(args) {
  if (args.length < 2) usage();
  const [mongoUrl, portStr, ...paths ] = args;
  const port = getPort(portStr);
  let store;
  try {
    store = await Store.make(mongoUrl);
    exitOnErrors(store);
    if (paths.length > 0) {
      const clear = await store.clear();
      exitOnErrors(clear);
      for (const path of paths) {
	const ret = await importPath(path, store);
	exitOnErrors(ret);
      }
    }
    serve(port, store);
  }
  catch (err) {
    console.error(err);
    process.exit(1);
  }
  finally {
//    if (store && !store.errors) await store.close();
  }
}

export default function () { return main(process.argv.slice(2)); }

async function importPath(path, store) {
  const [ courseId ] = Path.basename(path).match(/^\w+/);
  if (!courseId) { return { errors: [ new AppError(`bad path ${path}`) ] }; }
  const courseInfo = await getCourseInfo(courseId);
  if (courseInfo.errors) return courseInfo;
  const json = await readJson(path);
  return json.errors ? json : await store.import(courseInfo, json);
}

async function readJson(path) {
  let text;
  try {
    text = await promisify(fs.readFile)(path, 'utf8');
    if (path.endsWith('.jsonl')) text = jsonlToJson(text);
  }
  catch (err) {
    return { errors: [ new AppError(`unable to read ${path}: ${err}`) ] };
  }
  try {
    return JSON.parse(text);
  }
  catch (err) {
    const msg = `unable to parse JSON from ${path}: ${err}`;
    return { errors: [ new AppError(msg) ] };
  }
}

function jsonlToJson(text) {
  return '[' + text.trim().replace(/\n/g, ',') + ']';
}

function getPort(portStr) {
  let port;
  if (!/^\d+$/.test(portStr) || (port = Number(portStr)) < 1024) {
    usageError(`bad port ${portStr}: must be >= 1024`);
  }
  return port;
}

/** Output usage message to stderr and exit */
function usage() {
  const prog = Path.basename(process.argv[1]);
  console.error(`usage: ${prog} DB_URL PORT ` +
		`[JSON_DATA_FILE|JSONL_DATA_FILE]...`);
  process.exit(1);
}

function usageError(err=null) {
  if (err) console.error(err);
  usage();
}

function exitOnErrors(result) {
  if (result.errors) {
    result.errors.forEach(e => console.error(e.toString()));
    process.exit(1);
  }
}
