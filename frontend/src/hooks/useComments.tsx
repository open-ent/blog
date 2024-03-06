import { useUser } from "@edifice-ui/react";
import { ACTION } from "edifice-ts-client";

import { useActionDefinitions } from "../features/ActionBar/useActionDefinitions";
import { postCommentActions } from "~/config/postCommentActions";
import { Comment } from "~/models/comment";
import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from "~/services/queries";

export interface CommentActions {
  /** Truthy if the user can edit (and update) the comment. */
  canEdit: (comment: Comment) => boolean;
  /** Truthy if the user can remove the comment. */
  canRemove: (comment: Comment) => boolean;
  /** Action to create a comment; invalidates cached queries if needed. */
  create: (content: string) => void;
  /** Action to update a comment; invalidates cached queries if needed. */
  update: (comment: Comment) => void;
  /** Action to delete a comment; invalidates cached queries if needed. */
  remove: (commentId: string) => void;
}

export const useComments = (blogId: string, postId: string): CommentActions => {
  const { user } = useUser();
  const { hasRight, manager } = useActionDefinitions(postCommentActions);

  const canEdit = (comment: Comment) =>
    comment.author.userId === user?.userId && hasRight(ACTION.COMMENT);

  const canRemove = (comment: Comment) => manager || canEdit(comment);

  const createMutation = useCreateComment(blogId, postId);
  const deleteMutation = useDeleteComment(blogId, postId);
  const updateMutation = useUpdateComment(blogId, postId);

  return {
    canEdit,
    canRemove,
    create: (content: string) => createMutation.mutate({ content }),
    remove: (commentId: string) => deleteMutation.mutate({ commentId }),
    update: (comment: Comment) => updateMutation.mutate({ comment }),
  };
};
