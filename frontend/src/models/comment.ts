import { ID } from "edifice-ts-client";

export enum CommentState {
  PUBLISHED = "PUBLISHED",
  SUBMITTED = "SUBMITTED",
  DRAFT = "DRAFT",
}

export type CommentDto = {
  id: ID;
  comment: string;
  created: {
    $date: number;
  };
  modified?: {
    $date: number;
  };
  author: {
    userId: ID;
    username: string;
    login: string;
  };
  state: CommentState;
};

export interface Comment {
  id: string;
  comment: string;
  authorId: string;
  authorName: string;
  createdAt: number;
  updatedAt?: number;
}
