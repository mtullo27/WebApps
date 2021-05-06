import GradesWs from './grades-ws.mjs';

import { getCourseInfo, getCourseIds } from 'courses-info';

export default class GradesApp extends HTMLElement {

  constructor() {
    super();
    this.wsUrl = this.getAttribute('ws-url');
    this.gradesWs = new GradesWs(this.wsUrl);
    this.grades = {};
    this.courseInfos = {};
    this.addEventListener('login', this.login);
    this.addEventListener('logout', this.logout);
    this.attachShadow({mode: 'open'});
    this.shadowRoot.addEventListener('click', this.click.bind(this));
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = 'hello from grades-app!!';
    this.grades = {};
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
  
  selectCourse(ev) {
    const courseId = ev.target.getAttribute('data-courseId');
    const tableWidget = this.tableWidget =
      document.createElement('grades-table');
    tableWidget.courseId = courseId;
    tableWidget.courseInfo = this.courseInfos[courseId];
    tableWidget.gradesTable = this.grades[courseId];
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
      getAdminCourseIds(courseIds, sessionInfo.roles, 'read');
    const isAdmin = adminCourseIds.length > 0;
    const selectedCourseIds = (isAdmin) ? adminCourseIds : courseIds;

    const courseInfos = await getCourseInfos(selectedCourseIds);
    if (courseInfos.errors) { this.displayErrors(courseInfos); return; }

    const grades = await this.getCourseGrades(selectedCourseIds, isAdmin);
    if (grades.errors) { this.displayErrors(grades); return; }

    this.grades = grades; this.courseInfos = courseInfos;
    this.paintContainer();    
  }

  logout(ev) {
    delete this.grades;
    delete this.courseInfos;
    delete this.sessionInfo;
    delete this.tableWidget;
    const container = this.shadowRoot.querySelector('.container');
    container.innerHTML = '';
  }

  async getCourseGrades(courseIds, isAdmin) {
    const grades = {};
    const { loginId, sessionId } = this.sessionInfo;
    const wsName = isAdmin ? 'grades' : 'student';
    for (const courseId of courseIds) {
      const courseGrades = (isAdmin)
            ? await this.gradesWs.grades(courseId, { sessionId })
	    : await this.gradesWs.student(courseId, loginId, { sessionId })
      if (courseGrades.errors) {
	if (isAdmin || courseGrades.errors[0]?.options?.code != 'NOT_FOUND') {
	  return courseGrades;
	}
      }
      else {
	grades[courseId] = courseGrades;
      }
    }
    console.log('grades.len = ', Object.keys(grades).length);
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
    const courseIds = Object.keys(this.grades);
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
    for (const id of Object.keys(this.grades)) {
      html += `
        <p><a href="#" class="select-course"data-courseId=${id}>
          ${this.courseInfos[id].name}
        </a></p>
      `;
    }
    container.innerHTML = html;
  }

  paintTableWidget(container) {
    container.innerHTML = '';
    container.append(this.tableWidget);
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
</style>
`;
