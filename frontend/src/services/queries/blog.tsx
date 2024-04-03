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
  loadBlogPublic,
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
  postsList: (
    blogId: string,
    state?: PostState,
    search?: string,
    isPublic?: boolean,
  ) => {
    const queryKey = [...blogQueryKeys.all(blogId), "postsList"];
    const queryKeyFilter: any = {};
    if (state || search || isPublic) {
      if (state) {
        queryKeyFilter.state = state;
      }
      if (search) {
        queryKeyFilter.search = search;
      }
      if (isPublic) {
        queryKeyFilter.isPublic = true;
      }
      queryKey.push(queryKeyFilter);
    }
    return queryKey;
  },
  public: (slug: string) => ["public blog", slug],
};

/** Query blog data */
export const blogQuery = (blogId: string) => {
  return {
    queryKey: blogQueryKeys.all(blogId),
    queryFn: () => loadBlog(blogId),
  };
};

/** Query public blog data */
export const blogPublicQuery = (slug: string) => {
  return {
    queryKey: blogQueryKeys.public(slug),
    queryFn: () => loadBlogPublic(slug),
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
  isPublic: boolean = false,
) => {
  return {
    queryKey: blogQueryKeys.postsList(blogId, state, search, isPublic),
    queryFn: ({ pageParam = 0 }) =>
      loadPostsList(blogId, pageParam, state, search, nbComments, isPublic),
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
      return actions
        .filter((action: IAction) => data[action.workflow])
        .map((action) => ({
          ...action,
          available: true,
        })) as IAction[];
    },
    staleTime: Infinity,
  };
};

/**
 * useBlog query
 * @param blogId optional blog id string
 * @param slug optional blog slug string
 * @returns blog data
 */
export const useBlog = (blogId?: string, slug?: string) => {
  const params = useParams<{ blogId: string; slug: string }>();
  if (!blogId) blogId = params.blogId;
  if (!slug) slug = params.slug;

  let queryOptions = blogQuery(blogId!); // Default options
  if (!blogId) {
    if (!slug) {
      console.error("no blogId nor slug is defined");
    } else {
      queryOptions = blogPublicQuery(slug!);
    }
  }
  const query = useQuery(queryOptions);

  return {
    blog: query.data,
    query,
    publicView: !!slug,
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
  const params = useParams<{ blogId: string; slug: string }>();
  const { postsFilters } = usePostsFilter();
  const { postPageSize } = useBlogState();

  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }

  const publicView = !!params.slug;

  const query = useInfiniteQuery(
    postsListQuery(
      blogId!,
      postPageSize,
      state || postsFilters.state,
      postsFilters.search,
      withNbComments,
      publicView,
    ),
  );

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
    publicView,
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
