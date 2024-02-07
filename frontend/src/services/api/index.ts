import { ERROR_CODE, odeServices } from "edifice-ts-client";

import { Blog } from "~/models/blog";
import { BlogCounter } from "~/models/blogCounter";
import { Post, PostState } from "~/models/post";
import { notifyError } from "~/utils/BlogEvent";

async function notifyOnHttpError<T>(promise: Promise<T>) {
  const result = await promise;
  if (odeServices.http().isResponseError()) {
    notifyError({
      code: ERROR_CODE.TRANSPORT_ERROR,
      text: odeServices.http().latestResponse.statusText,
    });
    return null;
  }
  return result;
}

export function loadBlog(id: string) {
  return notifyOnHttpError(odeServices.http().get<Blog>(`/blog/${id}`));
}

export function loadBlogCounter(id: string) {
  return notifyOnHttpError(
    odeServices.http().get<BlogCounter>(`/blog/counter/${id}`),
  );
}

export function loadPost(blogId: string, postId: string) {
  return notifyOnHttpError(
    odeServices
      .http()
      .get<Post>(`/blog/post/${blogId}/${postId}?state=PUBLISHED`),
  );
}

export function loadPostsList(
  blogId: string,
  page: number,
  search?: string,
  states?: PostState[],
) {
  let path = `/blog/post/list/all/${blogId}?page=${page}`;
  if (search) {
    path += `&search=${search}`;
  }
  if (states?.length) {
    path += `&states=${states.join(",")}`;
  }
  return notifyOnHttpError(odeServices.http().get<Post[]>(path));
}
