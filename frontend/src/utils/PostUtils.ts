import { odeServices } from "edifice-ts-client";

import { Comment } from "~/models/comment";
import { Post, PostState } from "~/models/post";

export function getAvatarURL(post: Post | Comment): string {
  return odeServices.directory().getAvatarUrl(post.author.userId, "user");
}

export function getDatedKey(state: PostState) {
  switch (state) {
    case "PUBLISHED":
      return "post.dated.published";
    case "SUBMITTED":
      return "post.dated.submitted";
    default:
      return "post.dated.draft";
  }
}
