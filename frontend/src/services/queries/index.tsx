import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { IAction } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import {
  loadBlog,
  loadBlogCounter,
  loadPost,
  loadPostsList,
  sessionHasWorkflowRights,
} from "../api";
import { Post, PostState } from "~/models/post";
import { usePostsFilters } from "~/store";
import { IActionDefinition } from "~/utils/types";

/** Query metadata of a blog */
export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: () => loadBlog(blogId),
  };
};

export const blogCounterQuery = (blogId: string) => {
  return {
    queryKey: ["blog", "counter", blogId],
    queryFn: () => loadBlogCounter(blogId),
  };
};

/** Query metadata of a post */
export const postQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["post", postId],
    queryFn: () => loadPost(blogId, postId),
  };
};

export const metadataPostsListQuery = (
  blogId: string,
  search?: string,
  states?: PostState[],
) => ({
  queryKey: ["postList", { blogId, search, states }],
  queryFn: ({ pageParam = 0 }) =>
    loadPostsList(blogId, pageParam, search, states),
  initialPageParam: 0,
  getNextPageParam: (lastPage: any, _allPages: any, lastPageParam: any) => {
    if (lastPage.length === 0) {
      return undefined;
    }
    return lastPageParam + 1;
  },
});

/** Query actions availability depending on workflow rights */
export const availableActionsQuery = (actions: IActionDefinition[]) => {
  const actionRights = actions.map((action) => action.workflow);
  return {
    queryKey: actionRights,
    queryFn: async () => await sessionHasWorkflowRights(actionRights),
    select: (data: Record<string, boolean>) => {
      return actions.map((action) => ({
        ...action,
        available: data[action.workflow],
      })) as IAction[];
    },
    staleTime: Infinity,
  };
};

/**
 * useBlog query
 * @param blogId the blog id string
 * @returns blog data
 */
export const useBlog = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogQuery(blogId!));

  return {
    blog: query.data,
    query,
  };
};

/**
 * useBlogCounter query
 * @param blogId the blog id string
 * @returns counters of posts by state for on specific blogId
 */
export const useBlogCounter = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useQuery(blogCounterQuery(blogId!));

  return {
    counters: query.data,
    query,
  };
};

/**
 * usePost query
 * @param blogId the blog id string
 * @param postId the post id string
 * @returns post data
 */
export const usePost = (blogId?: string, postId?: string) => {
  const params = useParams<{ blogId: string; postId: string }>();
  if (!blogId) blogId = params.blogId;
  if (!blogId) throw "blogId is not defined";
  if (!postId) postId = params.postId;
  if (!postId) throw "postId is not defined";

  const query = useQuery(postQuery(blogId, postId));

  return {
    post: query.data,
    query,
  };
};

/**
 * useMetadataPostsList query
 * @param blogId the blog id string
 * @returns list of posts metadata
 */
export const useMetadataPostsList = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  const { states, search } = usePostsFilters();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const query = useInfiniteQuery(
    metadataPostsListQuery(blogId!, search, states),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};
