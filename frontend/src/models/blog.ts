import { ID } from "edifice-ts-client";

export type CommentType = "NONE" | "IMMEDIATE" | "RESTRAINT";
export type PublishType = "IMMEDIATE" | "RESTRAINT";

export type Blog = {
  _id: ID;
  title: string;
  description: string;
  author: {
    userId: ID;
    username: string;
    login: string;
  };
  thumbnail: string;
  shared: [];
  "publish-type": PublishType;
  "comment-type": CommentType;
  // visibility: "OWNER";
  // thumbnail: "";
  // created: {
  //   $date: 1699370018827;
  // };
  // modified: {
  //   $date: 1699370018827;
  // };
};
