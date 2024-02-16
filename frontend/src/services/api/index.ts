import { ERROR_CODE, odeServices } from "edifice-ts-client";

import { Blog } from "~/models/blog";
import { BlogCounter } from "~/models/blogCounter";
import { Post, PostState } from "~/models/post";
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

export function loadPost(blogId: string, postId: string) {
  return checkHttpError(
    odeServices
      .http()
      .get<Post>(`/blog/post/${blogId}/${postId}?state=PUBLISHED`),
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
