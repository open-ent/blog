import { odeServices } from "edifice-ts-client";

import { Comment, CommentDto } from "~/models/comment";
import { checkHttpError } from "~/utils/BlogEvent";

export async function loadComments(blogId: string, postId: string) {
  const comments = await checkHttpError<CommentDto[]>(
    odeServices.http().get<CommentDto[]>(`/blog/comments/${blogId}/${postId}`),
  );
  // dto to comment to respect props expected by CommentProvider
  return comments?.map((comment) => ({
    id: comment.id,
    comment: comment.comment,
    authorId: comment.author.userId,
    authorName: comment.author.username,
    createdAt: comment.created.$date,
    ...(comment.modified?.$date && {
      updatedAt: comment.modified.$date,
    }),
  }));
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
