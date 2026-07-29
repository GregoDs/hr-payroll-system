export function createField(label, name, type = "text", value = "", options = null, required = true) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  const caption = document.createElement("span");
  caption.textContent = label;
  let control;
  if (options) {
    control = document.createElement("select");
    options.forEach(([optionValue, text]) => control.add(new Option(text, optionValue)));
  } else if (type === "textarea") {
    control = document.createElement("textarea");
  } else {
    control = document.createElement("input");
    control.type = type;
  }
  control.name = name;
  control.value = value ?? "";
  control.required = required;
  wrapper.append(caption, control);
  return wrapper;
}

export function addFormActions(form, submitLabel, icon) {
  const actions = document.createElement("div");
  actions.className = "form-actions field--full";
  const cancel = document.createElement("button");
  cancel.className = "button";
  cancel.type = "button";
  cancel.innerHTML = `${icon("x")}Cancel`;
  cancel.dataset.closeModal = "";
  const submit = document.createElement("button");
  submit.className = "button button--primary";
  submit.type = "submit";
  submit.innerHTML = `${icon("check")}${submitLabel}`;
  actions.append(cancel, submit);
  form.append(actions);
}

export function createFormError() {
  const error = document.createElement("p");
  error.className = "form-error field--full";
  error.setAttribute("aria-live", "polite");
  return error;
}
