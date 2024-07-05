import { ERROR_CODE } from "edifice-ts-client";

/**
 * This function wraps a loader for ReactRouter,
 * preventing redirections to the login page.
 *
 * It should be used on public pages only.
 */
export async function disableLoginPageRedirection<T>(
  lazyLoaderFunction: () => Promise<T>,
) {
  const rootElement = document.getElementById("root");

  const preventRedirecting = (event: Event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  // Add a dedicated event listener.
  rootElement?.addEventListener(ERROR_CODE.NOT_LOGGED_IN, preventRedirecting);

  const result = await lazyLoaderFunction();

  // Route loaded, remove the dedicated event listener
  rootElement?.removeEventListener(
    ERROR_CODE.NOT_LOGGED_IN,
    preventRedirecting,
  );

  return result;
}
