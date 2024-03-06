import { useMemo } from "react";

import { useActionDefinitions } from "./useActionDefinitions";
import { blogActions } from "~/config/blogActions";
import { Blog } from "~/models/blog";

export const useBlogActions = (blog: Blog) => {
  const { availableActionsForBlog, contrib, creator, manager } =
    useActionDefinitions(blogActions);

  const actions = useMemo(
    () => availableActionsForBlog(blog),
    [blog, availableActionsForBlog],
  );

  const canContrib = useMemo(
    () => contrib || creator || manager,
    [contrib, creator, manager],
  );

  return {
    actions,
    canContrib,
  };
};
