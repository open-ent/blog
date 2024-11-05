import { useMemo } from 'react';

import { useUser } from '@edifice-ui/react';
import { ACTION, ActionType, IAction } from 'edifice-ts-client';

import { useActionDefinitions } from './useActionDefinitions';
import { Post, PostMetadata, PostState } from '~/models/post';
import {
  useDeletePost,
  useGoUpPost,
  usePublishPost,
  useSavePost,
} from '~/services/queries';
import { isEmptyEditorContent } from '~/utils/EditorHasContent';
import { IActionDefinition } from '~/utils/types';

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
  /**
   * Action to save a post as draft; invalidates cached queries if needed.
   * @param withoutNotification truthy to disable the "success" notification toast
   */
  save: (withoutNotification?: boolean) => Promise<PostMetadata>;
  /** Action to delete a post; invalidates cached queries if needed. */
  trash: () => Promise<void>;
  /**
   * Action to publish or submit a post; invalidates cached queries if needed.
   * @param fromEditor set to true if editor is opened when submitting.
   */
  publish: (fromEditor?: boolean) => Promise<Post>;
  /** Action to move up a post; invalidates cached queries if needed. */
  goUp: () => Promise<PostMetadata>;
  /** Truthy when a mutation is currently pending on this blog post. */
  isMutating: boolean;
  /** Truthy when the post's state should be displayed in a badge. */
  showBadge: boolean;
  /** Truthy when the views counter should be displayed. */
  showViews: boolean;
  /** WB-3139 i18n key to save (or save as draft) button. */
  saveButtonI18nKey: string;
  /** WB-2886 Truthy when the save (as draft) button should be hidden. */
  hideSaveButton: boolean;
  /** Truthy if post have editor content */
  emptyContent: boolean;
}

export const usePostActions = (
  actionDefinitions: IActionDefinition[],
  blogId: string,
  post: Post,
): PostActions => {
  const { user } = useUser();

  // Check resource rights.
  const {
    availableActionsForPost,
    mustSubmit,
    getDefaultPublishKeyword,
    creator,
    manager,
    contrib,
    isRestraint,
  } = useActionDefinitions(actionDefinitions);

  // Memoize a set of expensive computations
  const memoized = useMemo(() => {
    const actions = availableActionsForPost(post);

    return {
      actions,

      publishWith: getDefaultPublishKeyword(post.author.userId) as
        | 'publish'
        | 'submit',

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
    showViews: creator || manager,
    /* WB-3071 */
    hideSaveButton:
      /* Circuit actif : un contributeur n'a pas le droit de mettre en brouillon
         un billet publié dont il est l’auteur.
         (car il n’a pas le droit de le publier seul),
      */
      (isRestraint &&
        contrib &&
        !(manager || creator) &&
        post.state === PostState.PUBLISHED &&
        post.author.userId === user?.userId) ||
      /* Circuit actif : un gestionnaire n'a pas le droit de mettre en brouillon
         un billet publié dont il n'est pas l’auteur.
         (car si le billet appartient à un Contributeur il ne verra pas où est “transféré” le billet 
         et il ne pourra alors pas le republier si besoin).
      */
      (isRestraint &&
        (manager || creator) &&
        post.state === PostState.PUBLISHED &&
        post.author.userId !== user?.userId) ||
      /* Circuit INACTIF : un contributeur ou gestionnaire n'a pas le droit de mettre en brouillon
         un billet publié dont il n'est pas l’auteur.
       */
      (!isRestraint &&
        (manager || creator || contrib) &&
        post.state === PostState.PUBLISHED &&
        post.author.userId !== user?.userId),
    /* WB-3139 */
    /* Un billet soumis à validation, modifié par un gestionnaire qui n'en est pas l'auteur, ne change pas d'état.
       Le bouton doit alors indiquer "Enregistrer" et non pas "Brouillon". */
    saveButtonI18nKey:
      isRestraint &&
      (manager || creator) &&
      post.state === PostState.SUBMITTED &&
      post.author.userId !== user?.userId
        ? 'blog.save'
        : 'draft.save',
    save: (withoutNotification) =>
      saveMutation.mutateAsync({ withoutNotification }),
    trash: () => deleteMutation.mutateAsync(),
    publish: (fromEditor?: boolean) =>
      publishMutation.mutateAsync({
        post,
        publishWith: memoized.publishWith,
        fromEditor,
      }),
    goUp: () => goUpMutation.mutateAsync(),
    emptyContent,
  };
};
