import { useCallback, useMemo } from "react";

import { useUser } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ACTION, ActionType, IAction, RightRole } from "edifice-ts-client";

import { Post } from "~/models/post";
import { availableActionsQuery, useBlog } from "~/services/queries";
import { IActionDefinition } from "~/utils/types";

type SpecialPostRights = {
  hasPublishPostRight: boolean;
  hasSubmitPostRight: boolean;
};
type SharedRoles = {
  read: boolean;
  contrib: boolean;
  manager: boolean;
  canComment: boolean;
  canContrib: boolean;
};
type SharedRight = {
  "org-entcore-blog-controllers-PostController|list": boolean;
  "org-entcore-blog-controllers-PostController|submit": boolean;
  "org-entcore-blog-controllers-PostController|publish": boolean;
  "org-entcore-blog-controllers-BlogController|shareResource": boolean;
  "org-entcore-blog-controllers-PostController|comment": boolean;
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
    const defaultRights = {
      creator: false,
      read: false,
      contrib: false,
      manager: false,
      canContrib: false,
      canComment: false,
      hasPublishPostRight: false,
      hasSubmitPostRight: false,
    };

    if (!blog || !user) {
      return defaultRights;
    }

    const { shared, author } = blog;
    const isAuthor = author.userId === user?.userId;

    // Look for granted rights in the "shared" array.
    const sharedRights =
      (shared?.reduce(
        (
          previous: SharedRoles & SpecialPostRights,
          current: {
            userId: string;
            groupId: string;
          } & SharedRight,
        ) => {
          if (
            current &&
            (current.userId === user?.userId ||
              user?.groupsIds?.indexOf(current.groupId) >= 0)
          ) {
            previous.read ||=
              current["org-entcore-blog-controllers-PostController|list"];
            previous.contrib ||=
              current["org-entcore-blog-controllers-PostController|submit"] ||
              current["org-entcore-blog-controllers-PostController|publish"];
            previous.manager ||=
              current[
                "org-entcore-blog-controllers-BlogController|shareResource"
              ];
            previous.canComment ||=
              current["org-entcore-blog-controllers-PostController|comment"];

            previous.canContrib ||=
              author.userId === user?.userId ||
              previous.contrib ||
              previous.manager;

            // Also look for the real publish/submit URL to use.
            // If both are acceptable, prefer publish over submit.
            if (
              current["org-entcore-blog-controllers-PostController|publish"]
            ) {
              previous.hasPublishPostRight = true;
            }
            if (current["org-entcore-blog-controllers-PostController|submit"]) {
              previous.hasSubmitPostRight = true;
            }
          }
          return previous;
        },
        defaultRights,
      ) as SharedRoles & SpecialPostRights) ?? [];

    return {
      ...sharedRights,
      // The creator has all rights.
      canComment: sharedRights.canComment || isAuthor,
      canContrib: sharedRights.canContrib || isAuthor,
      creator: isAuthor,
    };
  }, [blog, user]);

  /**
   * Check the `right` field of an IAction.
   * @returns `true` if no right is required, or if the current user has a sufficient role.
   * Roles order is `creator` > `manager` > `contrib` > `read`
   */
  const hasRight = useCallback(
    (id: ActionType) => {
      const action = availableActions?.find((action) => action.id === id);
      if (!action || !action.available) return false;

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
    [availableActions, rights],
  );

  /** Filter function the actions the current user can use on a post. */
  const filterActionsForPost = useCallback(
    (post: Post) => {
      const isPostAuthor = post.author.userId === user?.userId;
      const authorized = [ACTION.PRINT] as ActionType[];

      // Managers have all rights
      if (rights.creator || rights.manager) {
        authorized.push(ACTION.OPEN, ACTION.DELETE);
        if (post.state !== "PUBLISHED") authorized.push(ACTION.PUBLISH);
        if (post.state === "PUBLISHED") authorized.push(ACTION.MOVE);
      }
      // Contributors have limited actions rights on their own posts
      else if (rights.contrib && isPostAuthor) {
        authorized.push(ACTION.OPEN, ACTION.DELETE);
        if (!(post.state in ["PUBLISHED", "SUBMITTED"]))
          authorized.push(ACTION.PUBLISH);
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

  /** Get the publish or submit keyword to use, which depends on :
    - available rights,
    - retro-compatible logic. 
  */
  const getDefaultPublishKeyword = useCallback(
    (postAuthorId: string) => {
      const isConstraint = blog?.["publish-type"] === "RESTRAINT";

      return !isConstraint && postAuthorId === user?.userId
        ? "submit"
        : rights.manager || rights.creator || rights.hasPublishPostRight
          ? "publish"
          : "submit";
    },
    [blog, user, rights],
  );

  /**
   * Check if a publish restriction applies on a new post.
   * This is intended for UI only (buttons label), not custom backend logic.
   */
  const mustSubmit =
    blog?.["publish-type"] === "RESTRAINT" &&
    rights.contrib &&
    !(rights.manager || rights.creator);

  const availableActionsForBlog = useMemo(() => {
    if (!availableActions || availableActions?.length === 0) return [];

    const authorizedActions: IAction[] = availableActions.filter((action) =>
      hasRight(action.id),
    );

    return authorizedActions || [];
  }, [availableActions, hasRight]);

  return {
    availableActions,
    ...rights,
    hasRight,
    mustSubmit,
    getDefaultPublishKeyword,
    availableActionsForPost,
    availableActionsForBlog,
  };
};
