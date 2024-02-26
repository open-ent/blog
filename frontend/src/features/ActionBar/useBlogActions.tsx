import { useMemo } from "react";

import { useActionDefinitions } from "./useActionDefinitions";
import { blogContentActions } from "~/config/blogContentActions";
import { Blog } from "~/models/blog";

export const useBlogActions = (blog: Blog) => {
  const { availableActionsForBlog } = useActionDefinitions(blogContentActions);

  const actions = useMemo(
    () => availableActionsForBlog(blog),
    [blog, availableActionsForBlog],
  );

  return {
    actions,
  };
};
