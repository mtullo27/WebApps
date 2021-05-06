import jsUtils from 'cs544-js-utils';
const { AppErrors } = jsUtils;

export default class GradesWs {
  constructor(url) {
    this.url = url;
  }

  /** Make a `GET` request to /:courseId/grades?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async grades(courseId, queryParams) {
    // TODO
    return `dummy grades for "${courseId}"`;
  }

  /** Make a `GET` request to /:courseId/raw?queryParams.
   *  Return success object or object having an errors
   *  property.
   */
  async raw(courseId, queryParams) {
    // Not required for this project.
    return null;
  }

  /** Make a `GET` request to
   *  /:courseId/students/:studentId?queryParams.  Return success
   *  object or object having an errors property.
   */
  async student(courseId, studentId, queryParams) {
    // TODO
    return `dummy ${studentId} student grades for "${courseId}"`;
  }

  /** Make a `PATCH` request to /courseId/grades?queryParams passing
   *  updates as request body.  Return success object or object having
   *  an errors property.
   */
  async update(courseId, queryParams, updates) {
    // Not required for this project.
    return null;
  }
  
}


  

  
