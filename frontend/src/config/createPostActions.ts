import { ACTION } from '@edifice.io/client';

import { IActionDefinition } from '~/utils/types';
import { workflows } from '.';

/**
 * Actions doable on a new Post
 */
export const createPostActions: Array<IActionDefinition> = [
  {
    // publish a post
    id: ACTION.PUBLISH,
    workflow: workflows.publish,
  },
];
