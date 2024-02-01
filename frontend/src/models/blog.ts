import { ID } from "edifice-ts-client";

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
  // visibility: "OWNER";
  // thumbnail: "";
  // "comment-type": "IMMEDIATE";
  // "publish-type": "RESTRAINT";
  // created: {
  //   $date: 1699370018827;
  // };
  // modified: {
  //   $date: 1699370018827;
  // };
};
