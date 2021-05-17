import React from 'react';
import ReactDOM from 'react-dom';

import GradesWs from './grades-ws.mjs';
import GradesTable from './grades-table.jsx';

import { getCourseInfo, getCourseIds } from 'courses-info';

import { XCourseGrades } from 'course-grades';

export default class GradesApp extends HTMLElement {

  constructor() {
    super();
    this.wsUrl = this.getAttribute('ws-url');
    this.gradesWs = new GradesWs(this.wsUrl);
    this.multiCourseGrades = {};
    this.courseInfos = {};
    this.addEventListener('login', this.login);
    this.addEventListener('logout', this.logout);
    this.onChange = this.onChange.bind(this);
    this.attachShadow({mode: 'open'});
    this.shadowRoot.addEventListener('click', this.click.bind(this));
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = 'hello from grades-app!!';
    this.multiCourseGrades = {};
    this.courseInfos = {};
  }

  disconnectedCallback() {
  }

  click(ev) {
    if (ev.target.classList.contains('select-course')) {
      ev.preventDefault();
      this.selectCourse(ev);
    }
    else if (ev.target.classList.contains('courses')) {
      ev.preventDefault();
      this.tableWidget = null;
      this.paintContainer();
    }
  }

  async onChange(emailId, colId, val) {
    let errors;
    delete this.errors;
    const { courseId } = this;
    if (!val.match(/^\s*\d+(\.\d*)?\s*$/)) {
      errors = { errors: [ `bad value "${val}": must be numeric` ] };
    }
    let num, updatedGrades;
    if (!errors) {
      num = Number(val);
      const courseGrades = this.multiCourseGrades[courseId];
      updatedGrades = courseGrades.add([[emailId, colId, num]]);
      if (updatedGrades.errors) errors = updatedGrades;
    }
    if (!errors) {
      const updates = [[emailId, colId, num]];
      const { sessionId } = this.sessionInfo;
      const wsResult =
	await this.gradesWs.update(courseId, { sessionId}, updates);
      if (wsResult.errors) errors = wsResult;
    }
    if (!errors) this.multiCourseGrades[courseId] = updatedGrades;
    if (errors) this.errors = errors.errors;
    this.paintContainer();
    return !errors;
  }
  
  async selectCourse(ev) {
    const courseId = this.courseId = ev.target.getAttribute('data-courseId');
    const tableWidget = this.tableWidget = document.createElement('div');
    this.paintContainer();
  }

  async login(ev) {
    const sessionInfo = this.sessionInfo = ev.detail;
    const { sessionId } = sessionInfo;
    this.shadowRoot.innerHTML = `
       ${STYLE}
       <div class="container"></div>
       <do-logout sessionId=${sessionId}></do-logout>
    `;
    
    const courseIds = getCourseIds();
    const adminCourseIds =
      getAdminCourseIds(courseIds, sessionInfo.roles, 'write');
    const isAdmin = this.isAdmin = adminCourseIds.length > 0;
    const selectedCourseIds = (isAdmin) ? adminCourseIds : courseIds;

    const courseInfos = await getCourseInfos(selectedCourseIds);
    if (courseInfos.errors) { this.displayErrors(courseInfos); return; }

    const grades =
      await this.getCourseGrades(selectedCourseIds, courseInfos, isAdmin);
    if (grades.errors) { this.displayErrors(grades); return; }

    this.multiCourseGrades = grades; this.courseInfos = courseInfos;
    this.paintContainer();    
  }

  logout(ev) {
    delete this.multiCourseGrades;
    delete this.courseInfos;
    delete this.sessionInfo;
    delete this.tableWidget;
    const container = this.shadowRoot.querySelector('.container');
    container.innerHTML = '';
  }

  async getCourseGrades(courseIds, courseInfos, isAdmin) {
    const grades = {};
    const { loginId, sessionId } = this.sessionInfo;
    const wsName = isAdmin ? 'grades' : 'student';
    for (const courseId of courseIds) {
      const courseGrades = (isAdmin)
            ? await this.gradesWs.raw(courseId, { sessionId })
	    : await this.gradesWs.student(courseId, loginId, { sessionId })
      if (courseGrades.errors) {
	if (isAdmin || courseGrades.errors[0]?.options?.code != 'NOT_FOUND') {
	  return courseGrades;
	}
      }
      else {
	const courseInfo = courseInfos[courseId];
	grades[courseId] =
	  await XCourseGrades.make(courseInfo, courseGrades, !isAdmin);
      }
    }
    return grades;
  }

  displayErrors(errorRet) {
    const container = this.shadowRoot.querySelector('.container');
    const errItems =
      errorRet.errors.map(e => `<ul>${e.message ?? e.toString()}</ul>`);
    container.innerHTML = `<ul class="error">${errItems.join('\n')}</ul>`;
  }

  paintContainer() {
    const container = this.shadowRoot.querySelector('.container');
    const courseIds = Object.keys(this.multiCourseGrades);
    const hasCourses = (courseIds.length > 0);
    if (courseIds.length === 0) {
      container.innerHTML = `
        <span class="message">Sorry, you do not have any courses.</span>
      `;
    }
    else if (this.tableWidget) {
      this.paintTableWidget(container);
    }
    else {
      this.paintCourseSelects(container);
    }
  }

  paintCourseSelects(container) {
    let html = '';
    for (const id of Object.keys(this.multiCourseGrades)) {
      html += `
        <p><a href="#" class="select-course" data-courseId=${id}>
          ${this.courseInfos[id].name}
        </a></p>
      `;
    }
    container.innerHTML = html;
  }

  paintTableWidget(container) {
    container.innerHTML = '';
    container.append(this.tableWidget);
    const courseGrades = this.multiCourseGrades[this.courseId];
    const props = {
      courseGrades,
      isEditable: this.isAdmin,
      onChange: this.onChange,
      errors: this.errors ?? [],
    };
    const gradesTable = React.createElement(GradesTable, props, null);
    //delete this.errors;
    //ReactDOM.unmountComponentAtNode(this.tableWidget);
    ReactDOM.render(gradesTable, this.tableWidget);
    const html = `
      <p><a class="courses" href="#">Back to Course Selections</a></p>
    `;
    container.insertAdjacentHTML('beforeend', html);
  }

}


/** Return those courses for which role permits perm. */
function getAdminCourseIds(courses, roles, perm) {
  const adminCourses = [];
  for (const course of courses) {
    const perms = roles[course] ?? [];
    if (perms.indexOf(perm) >= 0) adminCourses.push(course);
  }
  return adminCourses;
}

async function getCourseInfos(courseIds) {
  const courseInfos = {};
  for (const courseId of courseIds) {
    const courseInfo = await getCourseInfo(courseId);
    if (courseInfo.errors) return courseInfo;
    courseInfos[courseId] = courseInfo;
  }
  return courseInfos;
}

const STYLE = `
<style>
  .message { 
    color: red; 
    padding: 4em;
  }
  .error {
    color: red;
  }

.grades {
  margin: 10px;
  border-collapse: collapse;
}

.grades input,
.grades td {
  background-color: lightcyan;
  text-align: right;
}

.grades th {
  background-color: paleturquoise;
  font-weight: bold;
  text-align: center;
}

.grades input,
.grades td,
.grades th {
  min-width: 40px;
  width: 50px;
  pointer: default;
  border: 1px solid gray;
}
.grades input {
  border: none;
}
.grades tr:hover {
  background-color: aquamarine;
}
.grades tr:hover td {
  background-color: transparent;
}
.errors { 
  color: red; 
}
</style>
`;
