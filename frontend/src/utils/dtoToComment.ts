import { Comment, CommentDto } from '~/models/comment';

export const dtoToComment = (comments: CommentDto[]): Comment[] => {
  return comments.map((comment) => ({
    id: comment.id,
    comment: comment.comment,
    authorId: comment.author?.userId,
    authorName: comment.author?.username,
    createdAt: new Date(comment.created.$date)?.getTime(),
    updatedAt: new Date(comment.modified?.$date ?? '')?.getTime(),
    deleted: comment.deleted,
    replyTo: comment.replyTo,
  }));
};
