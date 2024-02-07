import { ID } from "edifice-ts-client";

export type PostState = "PUBLISHED" | "SUBMITTED" | "DRAFT";

export type Post = {
  _id: ID;
  content: string;
  title: string;
  // "created": {
  //     "$date": 1704384023754
  // },
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
  contentVersion: number;
  jsonContent: JSON;
};
