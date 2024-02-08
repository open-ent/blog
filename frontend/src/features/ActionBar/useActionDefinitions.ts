import { useCallback, useMemo } from "react";

import { useUser } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ACTION, ActionType, IAction, RightRole } from "edifice-ts-client";

import { Post } from "~/models/post";
import { availableActionsQuery, useBlog } from "~/services/queries";
import { IActionDefinition } from "~/utils/types";

type SharedRoles = { read: boolean; contrib: boolean; manager: boolean };
type SharedRight = {
  "org-entcore-blog-controllers-PostController|list": boolean;
  "org-entcore-blog-controllers-PostController|submit": boolean;
  "org-entcore-blog-controllers-BlogController|shareResource": boolean;
};

/**
 * This hook resolves instances of IActionDefinition into IAction.s,
 * => check user's workflow and resource rights, and apply them on each IActionDefinition
 */
export const useActionDefinitions = (
  actionDefinitions: IActionDefinition[],
) => {
  // Check workflow rights.
  const { data: availableActions } = useQuery<
    Record<string, boolean>,
    Error,
    IAction[]
  >(availableActionsQuery(actionDefinitions));

  // Check resource rights.
  const { user } = useUser();
  const { blog } = useBlog();
  const rights = useMemo(() => {
    if (!blog || !user) {
      return {
        creator: false,
        read: false,
        contrib: false,
        manager: false,
      };
    }
    const { shared, author } = blog;
    const { userId, groupsIds } = user;
    // Look for granted rights in the "shared" array
    const sharedRights = (shared as any).reduce(
      (
        previous: SharedRoles,
        current: {
          userId: string;
          groupId: string;
        } & SharedRight,
      ) => {
        if (
          current &&
          (current.userId === userId || groupsIds.indexOf(current.groupId) >= 0)
        ) {
          previous.read ||=
            current["org-entcore-blog-controllers-PostController|list"];
          previous.contrib ||=
            current["org-entcore-blog-controllers-PostController|submit"];
          previous.manager ||=
            current[
              "org-entcore-blog-controllers-BlogController|shareResource"
            ];
        }
        return previous;
      },
      {
        read: false,
        contrib: false,
        manager: false,
      },
    ) as SharedRoles;
    return {
      ...sharedRights,
      creator: author.userId === userId,
    };
  }, [blog, user]);

  /**
   * Check the `right` field of an IAction.
   * @returns `true` if no right is required, or if the current user has a sufficient role.
   * Roles order is `creator` > `manager` > `contrib` > `read`
   */
  const hasRight = useCallback(
    (action: IAction) => {
      const rolesPrecedence = [
        "creator",
        "manager",
        "contrib",
        "read",
      ] as RightRole[];

      if (typeof action?.right === "string" && !!rights) {
        for (let i = 0; i < rolesPrecedence.length; i++) {
          const rightRole = rolesPrecedence[i];
          if (rights[rightRole] === true) {
            // The user has a powerful enough right to use this action.
            return true;
          }
          if (rightRole === action.right) break;
        }
        return false;
      }
      return true;
    },
    [rights],
  );

  /** Filter function the actions the current user can use on a post. */
  const filterActionsForPost = useCallback(
    (post: Post) => {
      const isPostAuthor = post.author.userId === user?.userId;
      const authorized = [ACTION.PRINT] as ActionType[];

      // Managers have all rights
      if (rights.creator || rights.manager) {
        authorized.push(ACTION.OPEN, ACTION.DELETE, ACTION.PUBLISH);
        if (post.state === "PUBLISHED") authorized.push(ACTION.MOVE);
      }
      // Contributors have limited actions rights on their own posts
      else if (rights.contrib && isPostAuthor) {
        authorized.push(ACTION.OPEN, ACTION.DELETE, ACTION.PUBLISH);
      }

      return (action: IAction) => authorized.indexOf(action.id) >= 0;
    },
    [rights.contrib, rights.creator, rights.manager, user?.userId],
  );

  /** Get the actions the current user can use on a post. */
  const availableActionsForPost = useCallback(
    (post: Post) => availableActions?.filter(filterActionsForPost(post)),
    [availableActions, filterActionsForPost],
  );

  return {
    availableActions,
    ...rights,
    hasRight,
    availableActionsForPost,
  };
};
