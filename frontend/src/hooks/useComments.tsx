import {
  useCreateComment,
  useDeleteComment,
  useUpdateComment,
} from '~/services/queries';

export interface CommentActions {
  /** Action to create a comment; invalidates cached queries if needed. */
  create: (content: string) => Promise<void>;
  /** Action to update a comment; invalidates cached queries if needed. */
  update: ({
    comment,
    commentId,
  }: {
    comment: string;
    commentId: string;
  }) => Promise<void>;
  /** Action to delete a comment; invalidates cached queries if needed. */
  remove: (commentId: string) => Promise<void>;
}

export const useComments = (blogId: string, postId: string): CommentActions => {
  const createMutation = useCreateComment(blogId, postId);
  const deleteMutation = useDeleteComment(blogId, postId);
  const updateMutation = useUpdateComment(blogId, postId);

  return {
    create: async (content: string) =>
      await createMutation.mutateAsync({ content }),
    remove: async (commentId: string) =>
      await deleteMutation.mutateAsync({ commentId }),
    update: async ({
      comment,
      commentId,
    }: {
      comment: string;
      commentId: string;
    }) => await updateMutation.mutateAsync({ comment, commentId }),
  };
};
