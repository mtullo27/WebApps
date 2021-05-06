export default class GradesApp extends HTMLElement {

  constructor() {
    super();
    this.attachShadow({mode: 'open'});
  }

  /** Called when this element instance has been added/moved
   *  in the DOM.  Will have courseId, courseInfo and
   *  gradesTable properties.
   */
  connectedCallback() {
    const { courseId, courseInfo, gradesTable } = this;
    let html = STYLE;
    html += `<pre>${JSON.stringify(this, null, 2)}</pre>`;
    // TODO: replace above line which builds out component as per spec.
    this.shadowRoot.innerHTML = html;
  }

  /** Called when this element instance is removed from the DOM.
   */
  disconnectedCallback() {
  }

}


const STYLE = `
<style>
.grades {
  margin: 10px;
  border-collapse: collapse;
}

.grades td {
  background-color: lightcyan;
  text-align: right;
}

.grades th {
  background-color: paleturquoise;
  font-weight: bold;
  text-align: center;
}
.grades td,
.grades th {
  min-width: 40px;
  pointer: default;
  border: 1px solid gray;
}

.grades tr:hover {
  background-color: aquamarine;
}
.grades tr:hover td {
  background-color: transparent;
}
</style>
`;
