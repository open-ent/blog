import { ErrorCode, LayerName, odeServices } from "edifice-ts-client";

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
