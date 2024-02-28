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

// /** Model of a notified blog error. */
// interface IBlogErrorMessage extends ISubjectMessage {
//     name: "error",
//     data: {
//         code: string;
//         text: string;
//     }
// }

/** Specialize a notification layer dedicated to this application. */
const BlogLayer = "blog" as LayerName;

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
  if (!odeServices.http().isResponseError()) return result;

  notifyError({
    code: ERROR_CODE.TRANSPORT_ERROR,
    text: odeServices.http().latestResponse.statusText,
  });
  // Throw an error here. React Query will use it effectively.
  throw odeServices.http().latestResponse.statusText;
}
