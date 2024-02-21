import { matchPath } from "react-router-dom";

/* Check location and return the new URL if needed
 * @returns the new URL if the location needs to be redirected, undefined otherwise
 */
export function needRedirect(): string | undefined {
  const ngLocation = location.hash.substring(1);

  // Check if the URL is an old format (angular root with hash) and redirect to the new format
  if (ngLocation) {
    const isBlogPath = matchPath("/view/:blogId", ngLocation);
    if (isBlogPath) {
      // Redirect to the new format
      return `/id/${isBlogPath?.params.blogId}`;
    }

    const isPostPath = matchPath("/detail/:blogId/:postId", ngLocation);
    if (isPostPath) {
      // Redirect to the new format
      return `/id/${isPostPath?.params.blogId}/post/${isPostPath?.params.postId}`;
    }
  }
}
