export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
export const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
})[character]);

export const icons = {
  alert: "M12 9v4m0 4h.01M10.29 3.86 1.82 14.58A2 2 0 0 0 13.53 21h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
  arrowRight: "M5 12h14m-6-6 6 6-6 6", banknote: "M3 7h18v10H3zM7 11h.01M17 13h.01M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  briefcase: "M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1m-9 0h14v13H5zM9 12h6", calendar: "M7 3v3M17 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  check: "m5 12 4 4L19 6", clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  edit: "M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3ZM13.5 6.5l4 4", fileText: "M14 3H6v18h12V7zM14 3v4h4M8 13h8M8 17h5M8 9h2",
  filter: "M4 5h16l-6 7v5l-4 2v-7Z", moon: "M21 14.6A8 8 0 0 1 9.4 3 7 7 0 1 0 21 14.6Z",
  org: "M12 4v5M6 20v-4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 9h12M6 9v3M18 9v3M10 4h4v4h-4z", plus: "M12 5v14M5 12h14",
  refresh: "M21 12a9 9 0 0 1-15.5 6.3M3 12A9 9 0 0 1 18.5 5.7M3 19v-5h5M21 5v5h-5",
  receipt: "M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h4", search: "M11 19a8 8 0 1 1 5.66-2.34L21 21",
  shield: "M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6zM9 12l2 2 4-5", slash: "M5 5l14 14M19 5 5 19",
  sun: "M12 3v2M12 19v2M3 12h2M19 12h2M5.64 5.64l1.42 1.42M16.94 16.94l1.42 1.42M18.36 5.64l-1.42 1.42M7.06 16.94l-1.42 1.42M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  users: "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", x: "M6 6l12 12M18 6 6 18",
};

export function icon(name, label = "") {
  const aria = label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true"';
  return `<svg class="icon" viewBox="0 0 24 24" ${aria}><path d="${icons[name]}"/></svg>`;
}

export const rowNumber = (index) => `<span class="row-number">${String(index + 1).padStart(2, "0")}</span>`;
export const nameOf = (employee) => `${employee.first_name} ${employee.last_name}`;

export function setFeedback(selector, message, isError = false) {
  const element = $(selector);
  element.innerHTML = `${icon(isError ? "alert" : "check")}<span>${escapeHtml(message)}</span>`;
  element.hidden = false;
  element.classList.toggle("is-error", isError);
  $("#app-status").textContent = message;
}

export const hideFeedback = (selector) => { $(selector).hidden = true; };
export function toast(message) {
  const element = document.createElement("div");
  element.className = "toast";
  element.innerHTML = `${icon("check")}<span>${escapeHtml(message)}</span>`;
  $("#toast-region").append(element);
  window.setTimeout(() => element.remove(), 3600);
}
