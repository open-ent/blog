import { workflows } from ".";

export const explorerConfig = {
  app: "blog",
  types: ["blog"],
  filters: [
    { id: "owner", defaultValue: true },
    { id: "public", defaultValue: false },
    { id: "shared", defaultValue: true },
  ],
  orders: [
    { id: "name", defaultValue: "asc", i18n: "explorer.sorts.name" },
    { id: "updatedAt", i18n: "explorer.sorts.updatedat" },
  ],
  actions: [
    {
      id: "open",
      workflow: workflows.access,
      target: "actionbar",
      right: "read",
    },
    {
      id: "share",
      workflow: workflows.access,
      target: "actionbar",
      right: "manager",
    },
    {
      id: "edit",
      workflow: workflows.access,
      target: "actionbar",
      right: "manager",
    },
    {
      id: "create",
      workflow: workflows.create,
      target: "tree",
    },
    {
      id: "createPublic",
      workflow: workflows.createPublic,
      target: "tree",
    },
    {
      id: "move",
      workflow: workflows.access,
      target: "actionbar",
      right: "read",
    },
    {
      id: "publish",
      workflow: workflows.publish,
      target: "actionbar",
      right: "creator",
    },
    {
      id: "print",
      workflow: workflows.print,
      target: "actionbar",
      right: "read",
    },
    {
      id: "delete",
      workflow: workflows.access,
      target: "actionbar",
      right: "read",
    },
  ],
  trashActions: [
    {
      id: "restore",
      available: true,
      target: "actionbar",
      workflow: "",
      right: "manager",
    },
    {
      id: "delete",
      available: true,
      target: "actionbar",
      workflow: "",
      right: "manager",
    },
  ],
};
