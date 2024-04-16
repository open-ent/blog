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
  if (!odeServices.http().isResponseError()) return result;

  notifyError({
    code: ERROR_CODE.TRANSPORT_ERROR,
    text: odeServices.http().latestResponse.statusText,
  });

  if (
    odeServices.http().latestResponse.headers.get("content-type") !==
    "application/json"
  ) {
    throw new Error(
      odeServices.http().latestResponse.status === 401
        ? "Unauthorized"
        : "Error " + odeServices.http().latestResponse.status,
    );
  }

  // Throw an error here. React Query will use it effectively.
  throw odeServices.http().latestResponse.statusText;
}
