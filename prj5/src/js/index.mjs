//this file necessary because parcel doesn't allow imports
//within inline script elements
import LoginApp from 'login-app';
import GradesApp from './grades-app.mjs';

customElements.define('login-app', LoginApp.LoginApp);
customElements.define('do-logout', LoginApp.Logout);
customElements.define('grades-app', GradesApp);


