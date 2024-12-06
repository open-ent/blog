import { ACTION } from '@edifice.io/client';

import { IActionDefinition } from '~/utils/types';
import { workflows } from '.';

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
