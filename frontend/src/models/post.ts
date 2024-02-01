import { ID } from "edifice-ts-client";

export type Post = {
  _id: ID;
  content: string;
  title: string;
  // "created": {
  //     "$date": 1704384023754
  // },
  // "modified": {
  //     "$date": 1704384365271
  // },
  author: {
    userId: ID;
    username: string;
    login: string;
  };
  state: string;
  views: number;
  contentVersion: number;
  jsonContent: JSON;
};
