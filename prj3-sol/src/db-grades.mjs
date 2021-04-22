import { AppError, CourseGrades } from 'course-grades';

import mongo from 'mongodb';

//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

const GRADES_COLLECTION = 'grades';

export default class DBGrades {
  constructor(client, grades) {
    this._client = client;
    this._grades = grades;
  }

  //factory method
  static async make(dbUrl) {
    let client, grades;
    try {
      client = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS);
      grades = client.db().collection(GRADES_COLLECTION);
    }
    catch (err) {
      const msg = `cannot connect to URL "${dbUrl}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
    return new DBGrades(client, grades);
  }

  /** Release all resources held by this instance.
   *  Specifically, close any database connections.
   */
  async close() {
    await this._client.close();
  }

  
  /** set all grades for courseInfo.id to rawGrades */
  async import(courseInfo, rawGrades) {
    const courseId = courseInfo.id;
    try {
      const result =
        await this._grades.updateOne({_id: courseId}, { $set:  {rawGrades} },
				     { upsert: true });
      return {};
    }
    catch (err) {
      const msg = `cannot update "${courseId}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** add list of [emailId, colId, value] triples to grades for 
   *  courseInfo.id, replacing previous entries if any.
   */
  async add(courseInfo, triples) {
    const courseId = courseInfo.id;
    try {
      const rawGrades = await this.raw(courseInfo);
      if (rawGrades.errors) return rawGrades;
      const grades = await CourseGrades.make(courseInfo, rawGrades);
      if (grades.errors) return grades;
      const added = grades.add(triples);
      if (added.errors) return added;
      return await this.import(courseInfo, added.raw());
    }
    catch (err) {
      const msg = `cannot add grades to "${courseId}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** Clear out all courses */
  async clear() {
    try {
      await this._grades.deleteMany({});
      return {};
    }
    catch (err) {
      const msg = `cannot drop collection ${GRADES_COLLECTION}: ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }
  
  /** return grades for courseInfo.id including stats.  Returned
   *  grades are filtered as per options.selectionSpec and
   *  projected as per options.projectionSpec.
   */
  async query(courseInfo, options) {
    const courseId = courseInfo.id;
    try {
      const rawGrades = await this.raw(courseInfo);
      if (rawGrades.errors) return rawGrades;
      const grades = await CourseGrades.make(courseInfo, rawGrades);
      if (grades.errors) return grades;
      return grades.query(options);
    }
    catch (err) {
      const msg = `cannot query grades to "${courseId}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }
  }

  /** return raw grades without stats for courseInfo.id */
  async raw(courseInfo) { 
    const courseId = courseInfo.id;
    try {
      const result = await this._grades.findOne({_id: courseId});
      const rawGrades = result?.rawGrades;
      return (
	rawGrades ||
	  { errors: [ new AppError(`unknown course "${courseId}"`,
				   {code: 'BAD_VAL', widget: 'courseId'}) ] }
      );
    }
    catch (err) {
      const msg = `cannot read "${courseId}": ${err}`;
      return { errors: [ new AppError(msg, { code: 'DB'}) ] };
    }      
  }

}

