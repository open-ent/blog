import { useEffect } from "react";

import { Button } from "@edifice-ui/react";
import { useTranslation } from "react-i18next";

import { usePostsList } from "~/services/queries";
import { useSidebarPostSelected } from "~/store";

const BlogPostList = () => {
  const { t } = useTranslation();
  const {
    posts,
    query: { hasNextPage, isFetching, fetchNextPage },
  } = usePostsList();
  const sidebarPostSelected = useSidebarPostSelected();

  useEffect(() => {
    if (sidebarPostSelected) {
      // Scroll to the selected post
      const selectedPost = document.getElementById(sidebarPostSelected._id);
      selectedPost?.scrollIntoView({ behavior: "smooth" });
    }
  }, [sidebarPostSelected]);

  return (
    <>
      <h1>List of posts</h1>
      {posts?.map((post) => (
        <div key={post._id} id={post._id} className="pt-8 pb-32 mb-32">
          <h2>{post.title}</h2>
          <div>
            Lorem ipsum dolor sit amet consectetur. Curabitur phasellus a ut
            duis lacus. Porttitor tincidunt ac sed laoreet. Nunc quam aliquam
            eget risus nullam auctor mattis cursus. Convallis et volutpat amet
            accumsan morbi elit noniopuuyyu...{" "}
          </div>
        </div>
      ))}
      {hasNextPage && (
        <div className="d-flex justify-content-center">
          <Button
            color="tertiary"
            variant="ghost"
            isLoading={isFetching}
            onClick={() => fetchNextPage()}
          >
            {t("Voir plus")}
          </Button>
        </div>
      )}
    </>
  );
};

export default BlogPostList;
