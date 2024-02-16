import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { IAction } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import {
  loadBlog,
  loadBlogCounter,
  loadOriginalPost,
  loadPost,
  loadPostsList,
  sessionHasWorkflowRights,
} from "../api";
import { Post, PostMetadata, PostState } from "~/models/post";
import { usePostPageSize, usePostsFilters } from "~/store";
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
export const postQuery = (blogId: string, post: PostMetadata) => {
  return {
    queryKey: ["post", post._id, post.state],
    queryFn: () => loadPost(blogId, post),
  };
};

export const originalPostQuery = (blogId: string, post: PostMetadata) => {
  return {
    queryKey: ["original-post", post._id, post.state],
    queryFn: () => loadOriginalPost(blogId, post),
  };
};

export const postsListQuery = (
  blogId: string,
  pageSize?: number,
  search?: string,
  state = PostState.PUBLISHED,
) => {
  const queryKey: any = { blogId, state };
  if (search) {
    queryKey.search = search;
  }
  return {
    queryKey: ["postList", queryKey],
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, state, search),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, _allPages: any, lastPageParam: any) => {
      if (
        (pageSize && lastPage.length < pageSize) ||
        (!pageSize && lastPage.length === 0)
      ) {
        return undefined;
      }
      return lastPageParam + 1;
    },
  };
};

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
 * useMetadataPostsList query
 * @param blogId the blog id string
 * @returns list of posts metadata
 */
export const usePostsList = (blogId?: string) => {
  const params = useParams<{ blogId: string }>();
  const { state, search } = usePostsFilters();
  const pageSize = usePostPageSize();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const query = useInfiniteQuery(
    postsListQuery(blogId!, pageSize, search, state),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};
