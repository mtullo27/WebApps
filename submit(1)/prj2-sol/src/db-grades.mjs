import { AppError, CourseGrades } from 'course-grades';
import getCourseInfo from 'courses-info';

import mongo from 'mongodb';

//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };

const GRADES_COLLECTION = 'grades';

export default class DBGrades {
  constructor(db, connection) {
    this.db = db;
    this.connect = connection;
  }

  //factory method
  static async make(dbUrl) {
  	const errors = [];
		try{
			const db_connection = await mongo.connect(dbUrl, MONGO_CONNECT_OPTIONS);
			const db = db_connection.db('main');
			const DBGrade = new DBGrades(db, db_connection);
			return DBGrade;
		}
		catch(err){
			errors.push(new AppError(`DB: Cannot connect to URL ${dbUrl}: ${err}`));
		}
		return (errors.length > 0) ? { errors }: null;
  }

  /** Release all resources held by this instance.
   *  Specifically, close any database connections.
   */
  async close() {
  	try{
   		await this.connect.close();
   	}
   	catch(err){
   		return new AppError(`Cannot Close Right Now : ${err}`);
   	}
  }

  
  /** set all grades for courseInfo.id to rawGrades */
  async import(courseInfo, rawGrades) {
 	 const errors = [];
    try{
    	let table = this.db.collection(courseInfo.id);
    	await table.updateOne({courseID: courseInfo.id}, {$set: {grades: rawGrades}}, {upsert: true});
    }
    catch(err){
    	errors.push(new AppError(`DB: INPUT ERROR Cannot find ${courseInfo.id} : ${err}`));
    }
  	if(errors.length > 0){
  		return errors;
  	}
  }

  /** add list of [emailId, colId, value] triples to grades for 
   *  courseInfo.id, replacing previous entries if any.
   */
  async add(courseInfo, triples) {
  	const errors = [];
    try{
    	let data = await this.raw(courseInfo);
    	try{
    		let grades = await CourseGrades.make(courseInfo, data);
    		grades = await grades.add(triples);
    		console.log(grades);
    		await	this.import(courseInfo, grades.raw());
    	}
    	catch(err){
    		errors.push(new AppError(`DB: Cannot add to course ${courseInfo.id}: ${err}`));
   	  }
    }
    catch(err){
    	errors.push(new AppError(`DB: Cannot find course ${courseInfo.id}: ${err}`));
    }
    if(errors.length > 0) return errors;
  }

  /** Clear out all courses */
  async clear() {
  	const errors = [];
  	try{
    	let collections = ["cs544", "cs444"];
   	  for(const collection of collections){
    		let coll =  this.db.collection(collection);
    		await coll.drop();
    	}
   	}
    catch(err){
    	errors.push(new AppError(`Cannot Clear Rows: ${err}`));
    }
    if(errors.length > 0) return errors;
  }
  
  /** return grades for courseInfo.id including stats.  Returned
   *  grades are filtered as per options.selectionSpec and
   *  projected as per options.projectionSpec.
   */
  async query(courseInfo, options) {
  	const errors = [];
  	try{
  		var data = await this.raw(courseInfo);
  		try{
    		const grades = await CourseGrades.make(courseInfo, data);
    		return grades.query(options);
    	}
   		 catch(err){
    		errors.push(new AppError(`DB: Cannot make new instance of CourseGrades ${courseInfo.id}: ${err}`));
    	}
  	}
  	catch(err){
  		errors.push(new AppError(`Unkown Id ${courseInfo.id}: ${err}`));
  	}
  	if(errors.length > 0)
  		return errors;
  }

  /** return raw grades without stats for courseInfo.id */
  async raw(courseInfo) { 
  	const errors = [];
    try{
    	var table = await this.db.collection(courseInfo.id);
    	var raw = table.distinct('grades');
    	return raw;
    }
    catch(err){
    	errors.push(new AppError(`DB: Cannot find ${courseInfo.id}: ${err}`));
    }
    if(errors.length > 0)
    	return errors;
  }
}




