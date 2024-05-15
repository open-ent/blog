import { useMemo } from "react";

import { ACTION, ActionType, IAction } from "edifice-ts-client";

import { useActionDefinitions } from "./useActionDefinitions";
import { Post, PostMetadata, PostState } from "~/models/post";
import {
  useDeletePost,
  useGoUpPost,
  usePublishPost,
  useSavePost,
} from "~/services/queries";
import { isEmptyEditorContent } from "~/utils/EditorHasContent";
import { IActionDefinition } from "~/utils/types";

export interface PostActions {
  /** Available actions, not considering the post's state. */
  actions?: IAction[];
  /** Truthy if the user can publish (or submit) a post. */
  canPublish: boolean;
  /** Truthy if the user cannot publish a post without submitting to a manager beforehand, falsy otherwise. */
  mustSubmit: boolean;
  /** Truthy if the user should not alter the post. */
  readOnly: boolean;
  /** Truthy if the user can do the action
   * @param action - The action to check
   */
  isActionAvailable: (action: ActionType) => boolean;
  /** Action to save a post as draft; invalidates cached queries if needed. */
  save: (withoutNotification?: boolean) => Promise<PostMetadata>;
  /** Action to delete a post; invalidates cached queries if needed. */
  trash: () => Promise<void>;
  /** Action to publish or submit a post; invalidates cached queries if needed. */
  publish: () => Promise<Post>;
  /** Action to move up a post; invalidates cached queries if needed. */
  goUp: () => Promise<PostMetadata>;
  /** Truthy when a mutation is currently pending on this blog post. */
  isMutating: boolean;
  /** Truthy when the post's state should be displayed in a badge. */
  showBadge: boolean;
  /** WB-2886 Thruthy when the save (as draft) button should be hidden. */
  hideSaveDraft: boolean;
  /** Truthy if post have editor content */
  emptyContent: boolean;
}

export const usePostActions = (
  actionDefinitions: IActionDefinition[],
  blogId: string,
  post: Post,
): PostActions => {
  const {
    availableActionsForPost,
    mustSubmit,
    getDefaultPublishKeyword,
    creator,
    manager,
    contrib,
  } = useActionDefinitions(actionDefinitions);

  // Memoize a set of expensive computations
  const memoized = useMemo(() => {
    const actions = availableActionsForPost(post);

    return {
      actions,

      publishWith: getDefaultPublishKeyword(post.author.userId) as
        | "publish"
        | "submit",

      isActionAvailable: (action: ActionType) =>
        !!actions && actions.findIndex((a) => a.id === action) >= 0,

      readOnly:
        !!actions &&
        actions.findIndex((action) => action.id === ACTION.OPEN) < 0,

      canPublish:
        !!actions &&
        actions.findIndex((action) => action.id === ACTION.PUBLISH) >= 0,
    };
  }, [availableActionsForPost, post, getDefaultPublishKeyword]);

  const saveMutation = useSavePost(blogId, post);
  const deleteMutation = useDeletePost(blogId, post._id);
  const publishMutation = usePublishPost(blogId);
  const goUpMutation = useGoUpPost(blogId, post._id);
  const emptyContent = isEmptyEditorContent(post.jsonContent);

  return {
    ...memoized,
    mustSubmit,
    isMutating:
      saveMutation.isPending ||
      deleteMutation.isPending ||
      publishMutation.isPending ||
      goUpMutation.isPending,
    showBadge: creator || manager || contrib,
    hideSaveDraft: (manager || creator) && post.state === PostState.PUBLISHED,
    save: (withoutNotification) =>
      saveMutation.mutateAsync({ withoutNotification }),
    trash: () => deleteMutation.mutateAsync(),
    publish: () =>
      publishMutation.mutateAsync({ post, publishWith: memoized.publishWith }),
    goUp: () => goUpMutation.mutateAsync(),
    emptyContent,
  };
};
