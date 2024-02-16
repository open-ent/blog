import { ERROR_CODE, odeServices } from "edifice-ts-client";

import { Blog } from "~/models/blog";
import { BlogCounter } from "~/models/blogCounter";
import { Post, PostMetadata, PostState } from "~/models/post";
import { notifyError } from "~/utils/BlogEvent";

async function checkHttpError<T>(promise: Promise<T>) {
  // odeServices.http() methods return never-failing promises.
  // It is the responsability of the application to check for them.
  const result = await promise;
  if (!odeServices.http().isResponseError()) return result;

  notifyError({
    code: ERROR_CODE.TRANSPORT_ERROR,
    text: odeServices.http().latestResponse.statusText,
  });
  // Throw an error here. React Query will use it effectively.
  throw odeServices.http().latestResponse.statusText;
}

export function loadBlog(id: string) {
  return checkHttpError<Blog>(odeServices.http().get<Blog>(`/blog/${id}`));
}

export function loadBlogCounter(id: string) {
  return checkHttpError<BlogCounter>(
    odeServices.http().get<BlogCounter>(`/blog/counter/${id}`),
  );
}

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

export function savePost(blogId: string, post: Post) {
  const { _id: postId, title, content } = post;
  return checkHttpError(
    odeServices.http().putJson<PostMetadata>(`/blog/post/${blogId}/${postId}`, {
      title,
      content,
    }),
  );
}

export function publishPost(blogId: string, post: Post) {
  const { _id: postId } = post;
  return checkHttpError(
    odeServices
      .http()
      .putJson<Post>(`/blog/post/publish/${blogId}/${postId}`, {}),
  );
}

export function loadPostsList(
  blogId: string,
  page: number,
  state: PostState,
  search?: string,
) {
  let path = `/blog/post/list/all/${blogId}?page=${page}&content=true&comments=false&nbComments=true&states=${state}`;
  if (search) {
    path += `&search=${search}`;
  }
  return checkHttpError<Post[]>(odeServices.http().get<Post[]>(path));
}

/**
 * sessionHasWorkflowRights API
 * @param actionRights
 * @returns check if user has rights
 */
export const sessionHasWorkflowRights = async (actionRights: string[]) => {
  return await odeServices.rights().sessionHasWorkflowRights(actionRights);
};
