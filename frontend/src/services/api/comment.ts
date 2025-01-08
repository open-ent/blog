import { odeServices } from '@edifice.io/client';

import { CommentDto } from '~/models/comment';
import { checkHttpError } from '~/utils/BlogEvent';
import { dtoToComment } from '~/utils/dtoToComment';

export async function loadComments(blogId: string, postId: string) {
  const defaultComments = await checkHttpError<CommentDto[]>(
    odeServices.http().get<CommentDto[]>(`/blog/comments/${blogId}/${postId}`),
  );

  const comments = dtoToComment(defaultComments);

  // Default sort order must be reversed and API is not parameterized.
  return comments ?? [];
}

export function createComment(blogId: string, postId: string, content: string) {
  return checkHttpError(
    odeServices.http().postJson<void>(`/blog/comment/${blogId}/${postId}`, {
      comment: content,
    }),
  );
}

export function updateComment(
  blogId: string,
  postId: string,
  comment: string,
  commentId: string,
) {
  return checkHttpError(
    odeServices
      .http()
      .putJson<void>(`/blog/comment/${blogId}/${postId}/${commentId}`, {
        comment,
      }),
  );
}

export function deleteComment(
  blogId: string,
  postId: string,
  commentId: string,
) {
  return checkHttpError(
    odeServices
      .http()
      .delete<void>(`/blog/comment/${blogId}/${postId}/${commentId}`),
  );
}
