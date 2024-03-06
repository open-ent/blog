import { useCallback, useMemo } from "react";

import { useUser } from "@edifice-ui/react";
import { useQuery } from "@tanstack/react-query";
import { ACTION, ActionType, IAction, RightRole } from "edifice-ts-client";

import { Blog } from "~/models/blog";
import { Post } from "~/models/post";
import { availableActionsQuery, useBlog } from "~/services/queries";
import { IActionDefinition } from "~/utils/types";

// Real publish (or submit) URL. Depends on user shared rights.
type PublishWith = { defaultPublishAction?: "publish" | "submit" };
type SharedRoles = { read: boolean; contrib: boolean; manager: boolean };
type SharedRight = {
  "org-entcore-blog-controllers-PostController|list": boolean;
  "org-entcore-blog-controllers-PostController|submit": boolean;
  "org-entcore-blog-controllers-PostController|publish": boolean;
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
    // Look for granted rights in the "shared" array.
    const sharedRights = (shared as any).reduce(
      (
        previous: SharedRoles & PublishWith,
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
            current["org-entcore-blog-controllers-PostController|submit"] ||
            current["org-entcore-blog-controllers-PostController|publish"];
          previous.manager ||=
            current[
              "org-entcore-blog-controllers-BlogController|shareResource"
            ];

          // Also look for the real publish/submit URL to use.
          if (current["org-entcore-blog-controllers-PostController|publish"]) {
            previous.defaultPublishAction = "publish";
          }
          if (current["org-entcore-blog-controllers-PostController|submit"]) {
            previous.defaultPublishAction = "submit";
          }
        }
        return previous;
      },
      {
        read: false,
        contrib: false,
        manager: false,
      },
    ) as SharedRoles & PublishWith;
    return {
      ...sharedRights,
      creator: author.userId === userId,
    };
  }, [blog, user]);

  const canContrib = useMemo(
    () => rights.contrib || rights.creator || rights.manager,
    [rights],
  );

  /**
   * Check the `right` field of an IAction.
   * @returns `true` if no right is required, or if the current user has a sufficient role.
   * Roles order is `creator` > `manager` > `contrib` > `read`
   */
  const hasRight = useCallback(
    (id: ActionType) => {
      const action = availableActions?.find((action) => action.id === id);
      if (!action) return false;

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

  /** Check if a publish restriction applies on a new post. */
  const mustSubmit =
    blog?.["publish-type"] === "RESTRAINT" &&
    rights.contrib &&
    !(rights.manager || rights.creator);

  const availableActionsForBlog = useCallback(
    (blog: Blog) => {
      if (!availableActions || availableActions?.length === 0) return [];

      const isBlogAuthor = blog.author.userId === user?.userId;
      const authorizedActions: IAction[] = availableActions.filter((action) =>
        hasRight(action.id),
      );
      if (isBlogAuthor) {
        const publishAction = availableActions.find(
          (action) => action.id === ACTION.PUBLISH,
        );
        if (
          publishAction &&
          !authorizedActions.some((action) => action.id === ACTION.PUBLISH)
        ) {
          authorizedActions.push(publishAction);
        }
      }

      return authorizedActions || [];
    },
    [availableActions, user?.userId, hasRight],
  );

  return {
    availableActions,
    ...rights,
    hasRight,
    mustSubmit,
    availableActionsForPost,
    availableActionsForBlog,
    canContrib,
  };
};
