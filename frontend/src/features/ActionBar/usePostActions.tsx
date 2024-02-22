import { useMemo } from "react";

import { useActionDefinitions } from "./useActionDefinitions";
import { Post } from "~/models/post";
import { IActionDefinition } from "~/utils/types";

export const usePostActions = (
  actionDefinitions: IActionDefinition[],
  post: Post,
) => {
  const { availableActionsForPost, mustSubmit } =
    useActionDefinitions(actionDefinitions);

  const actions = useMemo(
    () => availableActionsForPost(post),
    [post, availableActionsForPost],
  );

  return {
    actions,
    mustSubmit,
  };
};
