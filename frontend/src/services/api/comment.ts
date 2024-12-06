import { odeServices } from '@edifice.io/client';

import { Comment } from '~/models/comment';
import { checkHttpError } from '~/utils/BlogEvent';

export async function loadComments(blogId: string, postId: string) {
  const comments = await checkHttpError<Comment[]>(
    odeServices.http().get<Comment[]>(`/blog/comments/${blogId}/${postId}`),
  );
  // Default sort order must be reversed and API is not parameterized.
  return comments && comments.length ? comments.reverse() : [];
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
  comment: Comment,
) {
  const { id, comment: content } = comment;
  return checkHttpError(
    odeServices
      .http()
      .putJson<void>(`/blog/comment/${blogId}/${postId}/${id}`, {
        comment: content,
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
