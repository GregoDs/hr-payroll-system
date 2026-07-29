export async function runAction({ button, loadingContent, action, onError }) {
  const originalContent = button.innerHTML;
  const originallyDisabled = button.disabled;
  button.disabled = true;
  button.innerHTML = loadingContent;
  try {
    return await action();
  } catch (error) {
    onError(error);
    return null;
  } finally {
    button.disabled = originallyDisabled;
    button.innerHTML = originalContent;
  }
}
