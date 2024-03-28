import { Suspense } from "react";

import { LoadingScreen, OnboardingModal } from "@edifice-ui/react";
import { Explorer } from "ode-explorer/lib";
import { useTranslation } from "react-i18next";

import { explorerConfig } from "~/config/config";

export function ExplorerBlog() {
  const { t } = useTranslation();
  return (
    <>
      <Explorer config={explorerConfig} />

      <Suspense fallback={<LoadingScreen />}>
        <OnboardingModal
          id="showOnboardingBlog"
          items={[
            {
              src: "onboarding/illu-blog.svg",
              alt: t("explorer.modal.onboarding.blog.screen1.alt", {
                ns: "blog",
              }),
              text: t("explorer.modal.onboarding.blog.screen1.text", {
                ns: "blog",
              }),
            },
            {
              src: "onboarding/illu-editor.svg",
              alt: t("explorer.modal.onboarding.blog.screen2.alt", {
                ns: "blog",
              }),
              text: t("explorer.modal.onboarding.blog.screen2.text", {
                ns: "blog",
              }),
            },
          ]}
          modalOptions={{
            title: t("explorer.modal.onboarding.blog.title", { ns: "blog" }),
            prevText: "explorer.modal.onboarding.trash.prev",
            nextText: "explorer.modal.onboarding.trash.next",
            closeText: "explorer.modal.onboarding.trash.close",
          }}
        />
      </Suspense>
    </>
  );
}
