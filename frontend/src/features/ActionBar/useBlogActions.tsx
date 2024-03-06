import { useMemo } from "react";

import { useActionDefinitions } from "./useActionDefinitions";
import { blogActions } from "~/config/blogActions";
import { Blog } from "~/models/blog";

export const useBlogActions = (blog: Blog) => {
  const { availableActionsForBlog, canContrib } =
    useActionDefinitions(blogActions);

  const actions = useMemo(
    () => availableActionsForBlog(blog),
    [blog, availableActionsForBlog],
  );

  return {
    actions,
    canContrib,
  };
};
