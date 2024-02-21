import { redirect } from "react-router-dom";

import { needRedirect } from "~/utils/redirectBlogNGLocation";

/** Check old format URL and redirect if needed */
export const loader = async () => {
  const redirectPath = needRedirect();
  if (redirectPath) {
    return redirect(redirectPath);
  }

  throw new Error("Not found");
};
