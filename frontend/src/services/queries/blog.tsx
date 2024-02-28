import { useShareMutation, useUpdateMutation } from "@edifice-ui/react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { IAction } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import {
  loadBlog,
  loadBlogCounter,
  loadPostsList,
  sessionHasWorkflowRights,
} from "../api/blog";
import usePostsFilter from "~/hooks/usePostsFilter";
import { Blog } from "~/models/blog";
import { Post, PostState } from "~/models/post";
import { usePostPageSize } from "~/store";
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

export const postsListQuery = (
  blogId: string,
  pageSize?: number,
  search?: string,
  state?: PostState,
) => {
  const queryKey: any = state || search ? { state, search } : undefined;
  return {
    queryKey: ["postList", blogId, queryKey],
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, state ?? PostState.PUBLISHED, search),
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
  const { postsFilters } = usePostsFilter();
  const pageSize = usePostPageSize();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const query = useInfiniteQuery(
    postsListQuery(blogId!, pageSize, postsFilters.search, postsFilters.state),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};

export const useUpdateBlog = (blog: Blog) => {
  const queryClient = useQueryClient();
  return useUpdateMutation({
    application: "blog",
    options: {
      onSuccess: async () => {
        return queryClient.invalidateQueries(blogQuery(blog._id));
      },
    },
  });
};

export const useShareBlog = (blog: Blog) => {
  const queryClient = useQueryClient();
  return useShareMutation({
    application: "blog",
    options: {
      onSuccess: async () => {
        return queryClient.invalidateQueries(blogQuery(blog._id));
      },
    },
  });
};
