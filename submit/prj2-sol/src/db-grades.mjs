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
  	const errors = [];
		let url = /^mongodp:\/\/(\w+):(\d+)/.test(dbUrl);
		try{
			const db_connection = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS);
			const db = db_connection.db('main');
			const DBGrade = new DBGrades(db, db_connect);
		}
		catch(err){
			errors.push(new AppError(`DB: Cannot connect to URL ${dbUrl}: ${err}`));
		}
		return (errors.length > 0) ? { errors } : DBGrade
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
  const errors = [];
    try{
    	var table = this.db.collection(courseInfo.id);
    	await table.updateOne({courseID: courseInfo.id}, {$set: rawGrades}, {upsert: true});
    }
    catch(err){
    	errors.push(new AppError(`DB: Cannot find ${courseInfo}: ${err}`));
    }
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

