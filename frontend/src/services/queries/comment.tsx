import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useEdificeClient, useToast } from '@edifice.io/react';
import { useTranslation } from 'react-i18next';
import { postsListQuery } from '.';
import {
  createComment,
  deleteComment,
  loadComments,
  updateComment,
} from '../api';

/** Query comments data. */
export const commentListQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ['comments', blogId, postId],
    queryFn: () => loadComments(blogId, postId),
  };
};

export const useCreateComment = (blogId: string, postId: string) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { appCode } = useEdificeClient();
  const { t } = useTranslation(appCode);

  return useMutation({
    mutationFn: ({ content }: { content: string }) =>
      createComment(blogId, postId, content),
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries(commentListQuery(blogId, postId)),
        queryClient.invalidateQueries(postsListQuery(blogId)),
      ]);
      toast.success(t('blog.toast.success.create.comment'));
    },
    onError: (error) => {
      toast.error(t('blog.toast.error.create.comment'));
      console.error(error);
    },
  });
};

export const useUpdateComment = (blogId: string, postId: string) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { appCode } = useEdificeClient();
  const { t } = useTranslation(appCode);

  return useMutation({
    mutationFn: ({
      comment,
      commentId,
    }: {
      comment: string;
      commentId: string;
    }) => updateComment(blogId, postId, comment, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(commentListQuery(blogId, postId));
      toast.success(t('blog.toast.success.update.comment'));
    },
    onError: (error) => {
      toast.error(t('blog.toast.error.update.comment'));
      console.error(error);
    },
  });
};

export const useDeleteComment = (blogId: string, postId: string) => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { appCode } = useEdificeClient();
  const { t } = useTranslation(appCode);

  return useMutation({
    mutationFn: ({ commentId }: { commentId: string }) =>
      deleteComment(blogId, postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries(commentListQuery(blogId, postId));
      toast.success(t('blog.toast.success.delete.comment'));
    },
    onError: (error) => {
      toast.error(t('blog.toast.error.delete.comment'));
      console.error(error);
    },
  });
};
