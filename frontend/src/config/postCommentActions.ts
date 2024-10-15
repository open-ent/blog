import { ACTION } from 'edifice-ts-client';

import { workflows } from '.';
import { IActionDefinition } from '~/utils/types';

/**
 * Actions doable on comments
 */
export const postCommentActions: Array<IActionDefinition> = [
  {
    // publish/delete a comment
    id: ACTION.COMMENT,
    workflow: workflows.access,
  },
];
