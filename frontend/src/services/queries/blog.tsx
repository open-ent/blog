import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { IAction } from "edifice-ts-client";
import { useParams } from "react-router-dom";

import {
  deleteBlog,
  loadBlog,
  loadBlogCounter,
  loadPostsList,
  sessionHasWorkflowRights,
} from "../api/blog";
import usePostsFilter from "~/hooks/usePostsFilter";
import { Post, PostState } from "~/models/post";
import { usePostPageSize } from "~/store";
import { IActionDefinition } from "~/utils/types";

/** Query blog data */
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
  state?: PostState,
  search?: string,
  nbComments: boolean = true,
) => {
  const queryKey: any = {};
  if (state) {
    queryKey.state = state;
  }
  if (search) {
    queryKey.search = search;
  }

  return {
    queryKey: ["postList", blogId, queryKey.length > 0 ? queryKey : undefined],
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, state, search, nbComments),
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
 * usePostsList query
 * @param blogId the blog id string
 * @returns list of posts
 */
export const usePostsList = (blogId?: string, getAll?: boolean) => {
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
    postsListQuery(
      blogId!,
      pageSize,
      !getAll ? postsFilters.state : undefined,
      !getAll ? postsFilters.search : undefined,
      !getAll,
    ),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};

export const useDeleteBlog = (blogId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteBlog(blogId),
    onSuccess: () =>
      Promise.all([
        // Deleting  some queries.
        queryClient.removeQueries(postsListQuery(blogId)),
        queryClient.removeQueries(blogCounterQuery(blogId)),
      ]),
  });
};
