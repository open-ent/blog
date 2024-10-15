import { PostState } from './post';

export type PostsFilters = {
  state: PostState;
  search?: string;
};
