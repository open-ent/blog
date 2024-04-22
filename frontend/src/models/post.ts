import { ID } from "edifice-ts-client";

export enum PostState {
  PUBLISHED = "PUBLISHED",
  SUBMITTED = "SUBMITTED",
  DRAFT = "DRAFT",
}

export type PostMetadata = {
  _id: ID;
  title: string;
  // "created": {
  //     "$date": 1704384023754
  // },
  firstPublishDate?: {
    $date: string;
  };
  modified: {
    $date: string;
  };
  author: {
    userId: ID;
    username: string;
    login: string;
  };
  state: PostState;
  views: number;
  nbComments: number;
};

export type Post = PostMetadata & {
  content: string;
  contentVersion: number;
  jsonContent: JSON;
};
