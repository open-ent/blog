import { blogContentActions } from "./blogContentActions";

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
  actions: [...blogContentActions],
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
