import { liveStore } from "./data/live-store.js";
import { DASHBOARD_URL, SESSION_USER_KEY } from "./session.js";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
const DEMO_PASSWORD = "12345";

function selectDemoUser(email) {
  $("#login-email").value = email;
  $("#login-password").value = DEMO_PASSWORD;
  $("#login-error").textContent = "";
  $("#login-submit").classList.add("is-ready");
  $$("[data-login-email]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.loginEmail === email);
  });
}

function setButtonLoading(button, loading) {
  button.disabled = loading;
  button.innerHTML = loading
    ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>Signing in...`
    : `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>Sign in`;
}

async function bindLogin() {
  if (sessionStorage.getItem(SESSION_USER_KEY)) {
    location.replace(DASHBOARD_URL);
    return;
  }

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const submit = form.querySelector("[type='submit']");
    const error = $("#login-error");
    const values = Object.fromEntries(new FormData(form));

    error.textContent = "";
    setButtonLoading(submit, true);
    try {
      const employee = await liveStore.login(values.email, values.password);
      sessionStorage.setItem(SESSION_USER_KEY, String(employee.id));
      location.assign(DASHBOARD_URL);
    } catch (caught) {
      error.textContent = caught.message;
    } finally {
      setButtonLoading(submit, false);
    }
  });

  $$("[data-login-email]").forEach((button) => {
    button.addEventListener("click", () => {
      selectDemoUser(button.dataset.loginEmail);
      $("#login-password").focus();
    });
  });

  $("#login-submit").classList.remove("is-ready");
}

bindLogin();
