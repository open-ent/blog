import { ID, odeServices } from "edifice-ts-client";

import { PostState } from "~/models/post";

export function getAvatarURL(userId: ID): string {
  return odeServices.directory().getAvatarUrl(userId, "user");
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
