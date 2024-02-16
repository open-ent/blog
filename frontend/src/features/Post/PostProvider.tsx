import { createContext, useContext, ReactNode } from "react";

import { ACTION, IAction } from "edifice-ts-client";

import { usePostActions } from "../ActionBar/usePostActions";
import { postContentActions } from "~/config/postContentActions";
import { Post } from "~/models/post";

export interface PostProps {
  blogId: string;
  post: Post;
  children: ReactNode;
}

export interface PostContextProps {
  blogId: string;
  post: Post;
  actions?: IAction[];
  mustSubmit: boolean;
  /** UI may focus on readOnly(=true) mode, or on read / edit mode (=false) */
  readOnly: boolean;
  canPublish: boolean;
}

export const PostContext = createContext<PostContextProps | null>(null!);

export function PostProvider({ blogId, post, children }: PostProps) {
  // -- Get all rights the current user has on the post, without constraints on its status.
  const { actions, mustSubmit } = usePostActions(postContentActions, post);

  const values = {
    blogId,
    post,
    actions,
    mustSubmit,
    readOnly:
      !!actions && actions.findIndex((action) => action.id === ACTION.OPEN) < 0,
    canPublish:
      !!actions &&
      actions.findIndex((action) => action.id === ACTION.PUBLISH) >= 0,
  };

  return <PostContext.Provider value={values}>{children}</PostContext.Provider>;
}

export function usePostContext() {
  const context = useContext(PostContext);

  if (!context) {
    throw new Error(`Cannot be used outside of PostProvider`);
  }
  return context;
}
