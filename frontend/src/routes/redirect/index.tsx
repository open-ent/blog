import { redirectBlogHashLocation } from "~/utils/redirectBlogHashLocation";

/** Check old format URL and redirect if needed */
export const redirectLoader = async () => {
  const redirection = redirectBlogHashLocation();
  if (redirection) {
    return redirection;
  }

  throw new Error("Not found");
};
