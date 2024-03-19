import { odeServices } from "edifice-ts-client";

import { Blog } from "~/models/blog";
import { BlogCounter } from "~/models/blogCounter";
import { Post, PostState } from "~/models/post";
import { checkHttpError } from "~/utils/BlogEvent";

/**
 * Load a blog
 * @param blogId blog id
 * @returns
 */
export function loadBlog(blogId: string) {
  return checkHttpError<Blog>(odeServices.http().get<Blog>(`/blog/${blogId}`));
}

/**
 * Load counters of a blog
 * @param blogId blog id
 * @returns counter of the blog (number of posts , published posts, submitted posts, draft posts)
 */
export function loadBlogCounter(blogId: string) {
  return checkHttpError<BlogCounter>(
    odeServices.http().get<BlogCounter>(`/blog/counter/${blogId}`),
  );
}

/**
 * Load the list of posts of a blog
 * @param blogId the blog concerned
 * @param page the page number
 * @param state the state of the posts (PUBLISHED, SUBMITTED, DRAFT)
 * @param search the search string
 * @returns the list of posts Post[]
 */
export function loadPostsList(
  blogId: string,
  page: number,
  state?: PostState,
  search?: string,
  nbComments: boolean = true,
  isPublic: boolean = false,
) {
  let path = isPublic
    ? `/blog/pub/posts/${blogId}?page=${page}&content=true`
    : `/blog/post/list/all/${blogId}?page=${page}&content=true&comments=false&nbComments=${nbComments}`;
  if (state) {
    path += `&states=${state}`;
  }
  if (search) {
    path += `&search=${search}`;
  }
  return checkHttpError<Post[]>(odeServices.http().get<Post[]>(path));
}

/**
 * Load a public blog
 * @param slug blog slug
 * @returns
 */
export function loadBlogPublic(slug: string) {
  return checkHttpError<Blog>(
    odeServices.http().get<Blog>(`/blog/pub/${slug}?type=json`),
  );
}

/**
 * sessionHasWorkflowRights API
 * @param actionRights
 * @returns check if user has rights
 */
export const sessionHasWorkflowRights = async (actionRights: string[]) => {
  return await odeServices.rights().sessionHasWorkflowRights(actionRights);
};

/**
 * Delete a blog
 * @param blogId
 * @returns
 */
export function deleteBlog(blogId: string) {
  return checkHttpError(odeServices.http().delete<void>(`/blog/${blogId}`));
}
