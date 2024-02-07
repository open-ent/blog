import { PostState } from "./post";

export type PostsFilters = {
  states: PostState[];
  search: string;
};
