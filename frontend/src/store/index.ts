// import { create } from "zustand";

// import { Blog } from "../models/blog";
// import { Post } from "../models/post";

// /* SAMPLE STORE */

// interface State {
//   blog: Blog | undefined;
//   posts: Post[];
//   updaters: {
//     setBlog: (blog?: Blog) => void;
//     setPosts: (posts: Post[]) => void;
//   };
// }

// export const useStoreContext = create<State>()((set) => ({
//   blog: undefined,
//   posts: [],
//   updaters: {
//     setBlog: (blog) => set({ blog }),
//     setPosts: (posts) => set({ posts }),
//   },
// }));

// export const useBlog = () => useStoreContext((state) => state.blog);

// export const usePosts = () => useStoreContext((state) => state.posts);

// /* Export updaters */
// export const useStoreUpdaters = () =>
//   useStoreContext((state) => state.updaters);
