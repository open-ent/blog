import { odeServices } from "edifice-ts-client";

import { Comment } from "~/models/comment";
import { checkHttpError } from "~/utils/BlogEvent";

export function loadComments(blogId: string, postId: string) {
  return checkHttpError<Comment[]>(
    odeServices.http().get<Comment[]>(`/blog/comments/${blogId}/${postId}`),
  );
}
