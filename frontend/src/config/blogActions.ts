import { ACTION } from "edifice-ts-client";

import { workflows } from ".";
import { IActionDefinition } from "~/utils/types";

/**
 * Actions doable on a new Post
 */
export const blogActions: Array<IActionDefinition> = [
  {
    id: ACTION.OPEN,
    workflow: workflows.access,
    target: "actionbar",
    right: "read",
  },
  {
    id: ACTION.SHARE,
    workflow: workflows.access,
    target: "actionbar",
    right: "manager",
  },
  {
    id: ACTION.EDIT,
    workflow: workflows.access,
    target: "actionbar",
    right: "manager",
  },
  {
    id: ACTION.CREATE,
    workflow: workflows.create,
    right: "manager",
    target: "tree",
  },
  {
    id: ACTION.CREATE_PUBLIC,
    workflow: workflows.createPublic,
    right: "manager",
    target: "tree",
  },
  {
    id: ACTION.MOVE,
    workflow: workflows.access,
    target: "actionbar",
    right: "manager",
  },
  {
    id: ACTION.PUBLISH,
    workflow: workflows.publish,
    target: "actionbar",
    right: "creator",
  },
  {
    id: ACTION.PRINT,
    workflow: workflows.print,
    target: "actionbar",
    right: "read",
  },
  {
    id: ACTION.DELETE,
    workflow: workflows.access,
    target: "actionbar",
    right: "manager",
  },
];
