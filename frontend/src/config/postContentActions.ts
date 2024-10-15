import { ACTION } from 'edifice-ts-client';

import { workflows } from '.';
import { IActionDefinition } from '~/utils/types';

/**
 * Actions doable on a post for users who can edit it
 * (requires having author/manage/contrib access to it)
 */
export const postContentActions: Array<IActionDefinition> = [
  {
    // modify the post => implies cancel and save too.
    id: ACTION.OPEN,
    workflow: workflows.access,
  },
  {
    // print
    id: ACTION.PRINT,
    workflow: workflows.access,
  },
  {
    // delete
    id: ACTION.DELETE,
    workflow: workflows.access,
  },
  {
    // publish a post
    id: ACTION.PUBLISH,
    workflow: workflows.access,
  },
  {
    // republish / move top up
    id: ACTION.MOVE,
    workflow: workflows.access,
  },
];
