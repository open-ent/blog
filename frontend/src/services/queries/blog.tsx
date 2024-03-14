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
import { useBlogState } from "~/store";
import { IActionDefinition } from "~/utils/types";

export const blogQueryKeys = {
  all: (blogId: string) => ["blog", blogId],
  counter: (blogId: string) => [...blogQueryKeys.all(blogId), "counter"],
  postsList: (blogId: string, state?: PostState, search?: string) => {
    const queryKey = [...blogQueryKeys.all(blogId), "postsList"];
    const queryKeyFilter: any = {};
    if (state || search) {
      if (state) {
        queryKeyFilter.state = state;
      }
      if (search) {
        queryKeyFilter.search = search;
      }
      queryKey.push(queryKeyFilter);
    }
    return queryKey;
  },
};

/** Query blog data */
export const blogQuery = (blogId: string) => {
  return {
    queryKey: blogQueryKeys.all(blogId),
    queryFn: () => loadBlog(blogId),
  };
};

export const blogCounterQuery = (blogId: string) => {
  return {
    queryKey: blogQueryKeys.counter(blogId),
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
  return {
    queryKey: blogQueryKeys.postsList(blogId, state, search),
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
export const usePostsList = (
  blogId?: string,
  state?: PostState,
  withNbComments: boolean = true,
) => {
  const params = useParams<{ blogId: string }>();
  const { postsFilters } = usePostsFilter();
  const { postPageSize } = useBlogState();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const query = useInfiniteQuery(
    postsListQuery(
      blogId!,
      postPageSize,
      state || postsFilters.state,
      postsFilters.search,
      withNbComments,
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
      // Invalidate all queries for this blog.
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.all(blogId) }),
  });
};
