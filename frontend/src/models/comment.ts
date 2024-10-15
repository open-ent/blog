import { ID } from 'edifice-ts-client';

export enum CommentState {
  PUBLISHED = 'PUBLISHED',
  SUBMITTED = 'SUBMITTED',
  DRAFT = 'DRAFT',
}

export type Comment = {
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
