// import { create } from "zustand";

// import { Post } from "../models/post";

// interface State {
//   posts: Post[];
//   updaters: {
//     setPosts: (posts: Post[]) => void;
//   };
// }

// export const useStoreContext = create<State>()((set) => ({
//   blog: undefined,
//   posts: [],
//   updaters: {
//     setPosts: (posts) => set({ posts }),
//   },
// }));

// export const usePosts = () => useStoreContext((state) => state.posts);

// /* Export updaters */
// export const useStoreUpdaters = () =>
//   useStoreContext((state) => state.updaters);
