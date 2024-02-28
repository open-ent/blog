import { odeServices } from "edifice-ts-client";

import { Post, PostMetadata } from "~/models/post";
import { checkHttpError } from "~/utils/BlogEvent";

/** Use to get a the state of a post */
export async function loadPostMetadata(blogId: string, postId: string) {
  const results = await checkHttpError(
    odeServices
      .http()
      .get<PostMetadata[]>(`/blog/post/list/all/${blogId}?postId=${postId}`),
  );
  return results[0];
}

export function loadPost(blogId: string, post: PostMetadata) {
  const { _id: postId, state } = post;
  return checkHttpError(
    odeServices
      .http()
      .get<Post>(`/blog/post/${blogId}/${postId}?state=${state}`),
  );
}

export function loadOriginalPost(blogId: string, post: PostMetadata) {
  const { _id: postId, state } = post;
  return checkHttpError(
    odeServices
      .http()
      .get<Post>(
        `/blog/post/${blogId}/${postId}?state=${state}&originalFormat=true`,
      ),
  );
}

export function deletePost(blogId: string, postId: string) {
  return checkHttpError(
    odeServices.http().delete<void>(`/blog/post/${blogId}/${postId}`),
  );
}

export function savePost(blogId: string, post: Post) {
  const { _id: postId, title, content } = post;
  return checkHttpError(
    odeServices.http().putJson<PostMetadata>(`/blog/post/${blogId}/${postId}`, {
      title,
      content,
    }),
  );
}

export function publishPost(blogId: string, post: Post, mustSubmit: boolean) {
  const { _id: postId } = post;
  return checkHttpError(
    odeServices
      .http()
      .putJson<Post>(
        `/blog/post/${mustSubmit ? "submit" : "publish"}/${blogId}/${postId}`,
        {},
      ),
  );
}

export function createPost(blogId: string, title: string, content: string) {
  return checkHttpError(
    odeServices.http().postJson<Post>(`/blog/post/${blogId}`, {
      title,
      content,
    }),
  );
}
