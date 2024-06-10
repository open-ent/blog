import {
  ErrorCode,
  LayerName,
  ERROR_CODE,
  odeServices,
} from "edifice-ts-client";

export interface IBlogError {
  code: ErrorCode;
  text: string;
}

/** Specialize a notification layer dedicated to this application. */
export const BlogLayer = "blog" as LayerName;

/** Function to notify a blog error. */
export function notifyError(error: IBlogError) {
  odeServices.notify().events().publish(BlogLayer, {
    name: "error",
    data: error,
  });
}

export async function checkHttpError<T>(promise: Promise<T>) {
  // odeServices.http() methods return never-failing promises.
  // It is the responsability of the application to check for them.
  const result = await promise;
  const isResponseHTML =
    (
      odeServices.http().latestResponse.headers?.get("Content-Type") as
        | string
        | undefined
    )?.includes?.("html") ?? false;

  // Check if request was redirected to login page (content is not JSON) or an error occured
  if (!isResponseHTML && !odeServices.http().isResponseError()) return result;

  // Map well-known status/text to i18n key
  const blogError = odeServices.http().isResponseError()
    ? getLatestError()
    : {
        code: ERROR_CODE.NOT_LOGGED_IN,
        text: "disconnected.warning",
      };

  // Display an error toast
  notifyError(blogError);

  // Throw an error here. React Query will use it effectively.
  throw new Error(blogError.text);
}

/*  */
function getLatestError() {
  let code: ErrorCode = ERROR_CODE.TRANSPORT_ERROR,
    text = odeServices.http().latestResponse.statusText;

  switch (odeServices.http().latestResponse.status) {
    case 401:
      code = ERROR_CODE.TRANSPORT_ERROR;
      text = "e401.page";
      break;
    case 403:
      code = ERROR_CODE.MALFORMED_DATA;
      text = "e403";
      break;
    case 404:
      code = ERROR_CODE.TRANSPORT_ERROR;
      text = "e404.page";
      break;
    case 408:
      code = ERROR_CODE.TIME_OUT;
      text = "e408";
      break;
    case 500:
      code = ERROR_CODE.UNKNOWN;
      text = "e500";
      break;
  }

  return {
    code,
    text,
  };
}
