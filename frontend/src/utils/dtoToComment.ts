import { Comment, CommentDto } from '~/models/comment';

export const dtoToComment = (comments: CommentDto[]): Comment[] => {
  return comments.map((comment) => ({
    id: comment.id,
    comment: comment.comment,
    authorId: comment.author.userId,
    authorName: comment.author.username,
    createdAt: comment.created.$date,
    updatedAt: comment.modified?.$date,
  }));
};
