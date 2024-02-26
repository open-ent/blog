import { odeServices } from "edifice-ts-client";

import { Post, PostState } from "~/models/post";

export function getAvatarURL(post: Post): string {
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
