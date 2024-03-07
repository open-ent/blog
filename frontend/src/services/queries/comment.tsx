import { useMutation, useQueryClient } from "@tanstack/react-query";

import { postsListQuery } from ".";
import {
  createComment,
  deleteComment,
  loadComments,
  updateComment,
} from "../api";
import { Comment } from "~/models/comment";

/** Query comments data. */
export const commentListQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["comments", blogId, postId],
    queryFn: () => loadComments(blogId, postId),
  };
};

export const useCreateComment = (blogId: string, postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content }: { content: string }) =>
      createComment(blogId, postId, content),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries(commentListQuery(blogId, postId)),
        queryClient.invalidateQueries(postsListQuery(blogId)),
      ]),
  });
};

export const useUpdateComment = (blogId: string, postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comment }: { comment: Comment }) =>
      updateComment(blogId, postId, comment),
    onSuccess: () =>
      queryClient.invalidateQueries(commentListQuery(blogId, postId)),
  });
};

export const useDeleteComment = (blogId: string, postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: { commentId: string }) =>
      deleteComment(blogId, postId, commentId),
    onSuccess: () =>
      queryClient.invalidateQueries(commentListQuery(blogId, postId)),
  });
};
