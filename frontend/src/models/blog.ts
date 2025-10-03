import { ID } from '@edifice.io/client';

export type CommentType = 'NONE' | 'IMMEDIATE' | 'RESTRAINT';
export type PublishType = 'IMMEDIATE' | 'RESTRAINT';

export type Blog = {
  '_id': ID;
  'title': string;
  'description': string;
  'author': {
    userId: ID;
    username: string;
    login: string;
  };
  'thumbnail': string;
  /** Old shared rights */
  'shared'?: [];
  /**  Normalized shared rights */
  'rights': string[];
  'publish-type': PublishType;
  'comment-type': CommentType;
  'visibility': 'OWNER' | 'PUBLIC';
  'slug': string;
  'allowReplies'?: boolean;
  'version': number;
  'created': {
    $date: string;
  };
  'modified': {
    $date: string;
  };
};
