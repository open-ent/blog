import { useEffect, useState } from "react";

import {
  Badge,
  SearchBar,
  Toolbar,
  ToolbarItem,
  useDebounce,
} from "@edifice-ui/react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import { PostState } from "~/models/post";
import { PostsFilters } from "~/models/postFilter";
import { useBlogCounter } from "~/services/queries";
import { useStoreUpdaters } from "~/store";

export const BlogFilter = () => {
  const { t } = useTranslation();

  const [localPostsFilters, setLocalPostsFilter] = useState<PostsFilters>({
    states: [],
    search: "",
  });
  const debouncePostsFilters = useDebounce(localPostsFilters, 500);
  const { setPostsFilter } = useStoreUpdaters();

  const { counters } = useBlogCounter();

  const handlerSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newText = event.target.value;
    setLocalPostsFilter({ ...localPostsFilters, search: newText.toString() });
  };

  const handleFilter = (filterState: PostState) => {
    let newStatesList = localPostsFilters.states.includes(filterState)
      ? localPostsFilters.states.filter((state) => state !== filterState)
      : [...localPostsFilters.states, filterState];

    if (newStatesList.length === 3) {
      newStatesList = [];
    }
    setLocalPostsFilter({
      ...localPostsFilters,
      states: newStatesList,
    });
  };

  useEffect(() => {
    setPostsFilter(debouncePostsFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncePostsFilters]);

  const filterToolbar: ToolbarItem[] = [
    {
      type: "button",
      name: "published",
      props: {
        className: clsx({
          "bg-primary-200 selected": localPostsFilters.states.includes(
            PostState.PUBLISHED,
          ),
        }),
        children: (
          <span>
            <span>{t("Publiés")} </span>
            {counters?.countPublished}
          </span>
        ),
        onClick: () => {
          handleFilter(PostState.PUBLISHED);
        },
      },
    },
    {
      type: "button",
      name: "submitted",
      props: {
        className: clsx({
          "bg-primary-200 selected": localPostsFilters.states.includes(
            PostState.SUBMITTED,
          ),
        }),
        children: (
          <>
            <span>{t("À valider")} </span>
            {counters?.countSubmitted ? (
              <Badge
                variant={{
                  level: "warning",
                  type: "notification",
                }}
              >
                {counters.countSubmitted}
              </Badge>
            ) : (
              0
            )}
          </>
        ),
        onClick: () => {
          handleFilter(PostState.SUBMITTED);
        },
      },
    },
    {
      type: "button",
      name: "draft",
      props: {
        className: clsx({
          "bg-primary-200 selected": localPostsFilters.states.includes(
            PostState.DRAFT,
          ),
        }),
        children: (
          <>
            <span>{t("Brouillons")} </span>
            {counters?.countDraft}
          </>
        ),
        onClick: () => {
          handleFilter(PostState.DRAFT);
        },
      },
    },
  ];
  return (
    <div className="d-flex pb-16">
      <SearchBar
        isVariant
        className="d-none d-md-flex me-16 flex-fill "
        onChange={handlerSearch}
        placeholder={t("Rechercher un billet ou un auteur")}
        size="md"
      />
      <Toolbar
        variant="no-shadow"
        className="ps-4 py-2 border border-primary-200 rounded-3 blog-filter-toolbar"
        items={filterToolbar}
      ></Toolbar>
    </div>
  );
};
