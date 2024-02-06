import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { loadBlog, loadPost, loadPostsList } from "../api";
import { Post } from "~/models/post";

export const blogQuery = (blogId: string) => {
  return {
    queryKey: ["blog", blogId],
    queryFn: () => loadBlog(blogId),
  };
};

export const postQuery = (blogId: string, postId: string) => {
  return {
    queryKey: ["post", postId],
    queryFn: () => loadPost(blogId, postId),
  };
};

export const postsListQuery = (blogId: string, page: number) => {
  return {
    queryKey: ["postList", blogId],
    queryFn: () => loadPostsList(blogId, page),
    initialPageParam: 0,
    getNextPageParam: (lastPage: any, _allPages: any, lastPageParam: any) => {
      if (lastPage.length === 0) {
        return undefined;
      }
      return lastPageParam + 1;
    },
  };
};

/**
 * useBlog query
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
 * usePost query
 * @returns post data
 */
export const usePost = (blogId: string, postId: string) => {
  const query = useQuery(postQuery(blogId, postId));

  return {
    post: query.data,
    query,
  };
};

/**
 * usePostsList query
 * @returns list of posts metadata
 */
export const usePostsList = (blogId?: string, page?: number) => {
  const params = useParams<{ blogId: string }>();
  if (!blogId) {
    if (!params.blogId) {
      console.error("blogId is not defined");
    }
    blogId = params.blogId;
  }
  const query = useInfiniteQuery(postsListQuery(blogId!, page || 0));

  return {
    posts: query.data?.pages.flatMap((page) => page) as Post[],
    query,
  };
};

// /**
//  * usePostsList query
//  * @returns list of posts metadata
//  */
// export function useAllPostsList(blogId?: string) {
//   const params = useParams<{ blogId: string }>();
//   if (!blogId) {
//     blogId = params.blogId;
//   }
//   const page = 0;
//   const { setPosts } = useStoreUpdaters();
//   const posts = usePosts();
//   let query = usePostsList(blogId!, 0);
//   if (query.posts?.length && query?.posts?.length > 0) {
//     setPosts([...posts, ...query.posts]);
//   }

//   useEffect(() => {
//     query = usePostsList(blogId!, 0);
//     if (query.posts?.length && query?.posts?.length > 0) {
//       setPosts([...posts, ...query.posts]);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [posts]);
// }
