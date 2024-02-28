import { useMemo } from "react";

import { ACTION, IAction } from "edifice-ts-client";

import { useActionDefinitions } from "./useActionDefinitions";
import { Post } from "~/models/post";
import { useDeletePost, usePublishPost, useSavePost } from "~/services/queries";
import { IActionDefinition } from "~/utils/types";

export interface PostActions {
  /** Available actions, not considering the post's state. */
  actions?: IAction[];
  /** Truthy if the user cannot publish a post without submitting to a manager beforehand, falsy otherwise. */
  mustSubmit: boolean;
  /** Truthy if the user can publish (or submit) a post. */
  canPublish: boolean;
  /** Truthy if the user should not alter the post. */
  readOnly: boolean;
  /** Action to save a post as draft; invalidates cached queries if needed. */
  save: () => void;
  /** Action to delete a post; invalidates cached queries if needed. */
  trash: () => void;
  /** Action to publish or submit a post; invalidates cached queries if needed. */
  publish: () => void;
}

export const usePostActions = (
  actionDefinitions: IActionDefinition[],
  blogId: string,
  post: Post,
): PostActions => {
  const { availableActionsForPost, mustSubmit } =
    useActionDefinitions(actionDefinitions);

  const actions = useMemo(
    () => availableActionsForPost(post),
    [post, availableActionsForPost],
  );

  const saveMutation = useSavePost(blogId, post);
  const deleteMutation = useDeletePost(blogId, post._id);
  const publishMutation = usePublishPost(blogId);

  return {
    actions,
    mustSubmit,
    readOnly:
      !!actions && actions.findIndex((action) => action.id === ACTION.OPEN) < 0,
    canPublish:
      !!actions &&
      actions.findIndex((action) => action.id === ACTION.PUBLISH) >= 0,
    save: () => saveMutation.mutate(),
    trash: () => deleteMutation.mutate(),
    publish: () => publishMutation.mutate({ post, mustSubmit }),
  };
};
