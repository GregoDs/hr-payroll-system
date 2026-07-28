const layer = document.querySelector("#modal-layer");
const body = document.querySelector("#modal-body");
const title = document.querySelector("#modal-title");
const eyebrow = document.querySelector("#modal-eyebrow");
let returnFocus = null;

function focusableElements() {
  return [...layer.querySelectorAll("button, input, select, textarea, [href], [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.disabled);
}

function handleKeydown(event) {
  if (event.key === "Escape") closeDialog();
  if (event.key !== "Tab") return;
  const items = focusableElements();
  const first = items[0];
  const last = items.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function openDialog({ title: heading, eyebrow: label = "People operations", content, onOpen }) {
  returnFocus = document.activeElement;
  title.textContent = heading;
  eyebrow.textContent = label;
  body.replaceChildren(content);
  layer.hidden = false;
  document.body.style.overflow = "hidden";
  document.addEventListener("keydown", handleKeydown);
  requestAnimationFrame(() => {
    (body.querySelector("input, select, textarea, button") ?? layer.querySelector("[data-close-modal]")).focus();
    onOpen?.();
  });
}

export function closeDialog() {
  if (layer.hidden) return;
  layer.hidden = true;
  body.replaceChildren();
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleKeydown);
  returnFocus?.focus();
}

layer.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-modal]")) closeDialog();
});
