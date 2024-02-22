import { redirectBlogHashLocation } from "~/utils/redirectBlogHashLocation";

/** Check old format URL and redirect if needed */
export const redirectLoader = async () => {
  redirectBlogHashLocation();

  throw new Error("Not found");
};
