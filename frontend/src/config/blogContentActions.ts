import { ACTION } from "edifice-ts-client";

import { workflows } from ".";
import { IActionDefinition } from "~/utils/types";

/**
 * Actions doable on a new Post
 */
export const blogContentActions: Array<IActionDefinition> = [
  {
    // publish a blog
    id: ACTION.PUBLISH,
    workflow: workflows.publish,
  },
  {
    // print a blog
    id: ACTION.PRINT,
    workflow: workflows.print,
  },
  {
    // share a blog
    id: ACTION.SHARE,
    workflow: workflows.access,
  },
  {
    // create post in a blog
    id: ACTION.CREATE,
    workflow: workflows.access,
  },
  {
    // create post in a blog
    id: ACTION.DELETE,
    workflow: workflows.access,
  },
];
