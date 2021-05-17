import React from 'react';
import ReactDom from 'react-dom';


/**
A component which should allow the display and editing of grades
for a particular course:

Called with four props:

  courseGrades:   An immutable course grades object backward compatible with
                  that provided earlier.  The code is found in the
                  course-grades library in the xcourse-grades.mjs file.
                  This prop contains the following properties:

     courseId:    The ID of the course; example: cs471.
     courseInfo:  The course information as used in earlier projects.
                  (this is the object built by the course-info library).
     rawGrades:   Grade table containing raw grades.
     statGrades:  Grade table containing stat rows and columns.
     sortedColIds:All column id's (including stat columns) in output order.

  onChange:       A handler which must be called to report a change.
                  Must be called with arguments emailId, colId and a
                  string representing the changed value.  Returns true
                  if the change is accepted and updated via web-services
                  on the backend; false if thechange results in an error.
                  If the latter, then the errors prop is set.

                  When the onChange() handler returns false, the
                  user's change should be automatically reverted.

  errors:         A list of errors; empty if none.  For each err
                  in the list, user the error message can be
                  retrieved from the expression err.message || err.toString().

  isEditable:     true iff the grades should be editable.  Note that
                  irrespective of this value, the following entries
                  are never editable:

                     + Entries for stat rows and columns.

                     + Entries for columns in courseInfo.registrationColIds.

The order of the columns should respect the order given by
courseGrades.sortedColIds.  The rows should be sorted by `emailId`
with rows having empty `emailId`'s sorted stably at the bottom.


*/

export default class GradesTable extends React.Component {
  constructor(props) {
    super(props);
  }


  render() {
    const gradesTable = this.renderTable(); //must have key
    return [
      <h2 key="name">{this.props.courseGrades.courseInfo.name}</h2>,
      <Errors key="err" errors={this.props.errors}/>,
      gradesTable
    ];
  }

  renderTable() {   	
   	return(<div>
   		<table id = "Grades">
   			<tbody>
   				<tr>{this.renderHeaders()}</tr>
   					{this.renderData()}
   			</tbody>
   		</table>
   	</div>)}
   	
   renderHeaders(){
   	const hdr = Object.keys(this.props.courseGrades.statGrades[0]);
   	return hdr.map((hd, i) => <th key = {hd}>{hd}</th>);
   }
   
   renderData(){
   	const gradesTable = this.props.courseGrades.statGrades;	
   	const hdrs = {};
   	const hdr = Object.keys(hdrs);
  	for (const row of gradesTable) {
    	for (const k of Object.keys(row)) hdrs[k] ||= 1;
  	}
  	const rs = Array.from(gradesTable).sort(cmpEmailIdFn);
  	const rows = Object.values(rs[0]);
  	const rowXml = [];
  	for(const [i, row] of rs.entries()){	
  		const rows = Object.values(row);
  		rowXml.push(<tr key = {row.toString() + i}/>);
  		rowXml.push(rows.map((r) => <td key = {r + " " + i}>{r}</td>));
  	}
		return rowXml;
  }
}

function cmpEmailIdFn(a, b) {
  const aEmail = (a.emailId || '').trim();
  const bEmail = (b.emailId || '').trim();
  if (aEmail && bEmail) {
    return aEmail.localeCompare(bEmail);
  }
  else if (aEmail) {
    return -1;
  }
  else if (bEmail) {
    return +1;
  }
  else {
    return 0;
  }
}


//TODO: add auxiliary functions and classes as necessary

function Errors(props) {
  const { errors } = props;
  //index as key not best choice, but no other candidate
  const errs =
    errors.map((err, i) => <li key={i}>{err.message ?? err.toString()}</li>);
  return <ul className="errors">{errs}</ul>;
}
