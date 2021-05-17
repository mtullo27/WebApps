import jsUtils from 'cs544-js-utils';
const { AppErrors } = jsUtils;

const NO_CONTENT = 204;

export default class GradesWs {
  constructor(url) {
    this.url = url;
  }

  /** Make a `GET` request to /:courseId/grades?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async grades(courseId, queryParams) {
    const url = `${this.url}/${courseId}/grades`;
    return await doGet(url, queryParams);
  }

  /** Make a `GET` request to /:courseId/raw?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async raw(courseId, queryParams) {
    const url = `${this.url}/${courseId}/raw`;
    return await doGet(url, queryParams);
  }

  /** Make a `GET` request to
   *  /:courseId/students/:studentId?queryParams.  Return success
   *  object or object having an errors property.
   */
  async student(courseId, studentId, queryParams) {
    const url = `${this.url}/${courseId}/students/${studentId}`;
    return await doGet(url, queryParams);
  }

  /** Make a `PATCH` request to /courseId/raw?queryParams passing
   *  updates as request body.  Return success object or object having
   *  an errors property.
   */
  async update(courseId, queryParams, updates) {
    const url = `${this.url}/${courseId}/raw`;
    return await doNonGet(url, 'PATCH', queryParams, updates);
  }
}

async function doGet(url, qParams={}) {
  try {
    const response =  await fetch(qUrl(url, qParams));
    return await responseResult(response);
  }
  catch (err) {
    return new AppErrors().add(err);
  }
}

async function doNonGet(url, method, qParams={}, body={}) {
  try {
    const hasBody = Object.keys(body).length > 0;
    const options =
	  (hasBody)
	  ? { method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
	    }
	  : { method };
    const response = await fetch(qUrl(url, qParams), options);
    return await responseResult(response);
  }
  catch (err) {
    return new AppErrors().add(err);
  }
}

async function responseResult(response) {
  const ret = (response.status === NO_CONTENT) ? {} : await response.json();
  if (response.ok) {
    return ret;
  }
  else {
    return  (ret.errors) ? ret : new AppErrors().add(response.statusText);
  }
}

function qUrl(url, qParams={}) {
  const hasParams = Object.keys(qParams).length > 0;
  const ret = hasParams ? `${url}?${new URLSearchParams(qParams)}` : url;
  console.log(ret);
  return ret;
}

