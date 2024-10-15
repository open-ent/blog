import { ACTION } from 'edifice-ts-client';

import { workflows } from '.';
import { IActionDefinition } from '~/utils/types';

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
