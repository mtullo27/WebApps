import { AppError, CourseGrades } from 'course-grades';

import mongo from 'mongodb';

//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

const GRADES_COLLECTION = 'grades';

export default class DBGrades {
  constructor(db, connection) {
    this.DataBase = db;
    this.connect = connection;
  }

  //factory method
  static async make(dbUrl) {
		let url = /^mongodp:\/\/(\w+):(\d+)/.test(dbUrl);
		if(!url)
			throw[new AppError('BAD_URL', 'Bad Url')];
		const db_connect = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS);
		const db = bd_connection.db('main');
		return new DBGrades(db, db_connect);
  }

  /** Release all resources held by this instance.
   *  Specifically, close any database connections.
   */
  async close() {
   	await this.connect.close();
   	return;
  }

  
  /** set all grades for courseInfo.id to rawGrades */
  async import(courseInfo, rawGrades) {
    //@TODO
  }

  /** add list of [emailId, colId, value] triples to grades for 
   *  courseInfo.id, replacing previous entries if any.
   */
  async add(courseInfo, triples) {
    //@TODO
  }

  /** Clear out all courses */
  async clear() {
    //@TODO
  }
  
  /** return grades for courseInfo.id including stats.  Returned
   *  grades are filtered as per options.selectionSpec and
   *  projected as per options.projectionSpec.
   */
  async query(courseInfo, options) {
    //@TODO
  }

  /** return raw grades without stats for courseInfo.id */
  async raw(courseInfo) { 
    //@TODO
  }

}

