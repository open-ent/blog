import { Suspense } from 'react';

import { LoadingScreen } from '@edifice.io/react';
import { OnboardingModal } from '@edifice.io/react/modals';
import { Explorer } from 'ode-explorer/lib';
import { useTranslation } from 'react-i18next';

import illuBlog from '@images/onboarding/illu-blog.svg';
import illuEditor from '@images/onboarding/illu-editor.svg';

import { explorerConfig } from '~/config';

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
              src: illuBlog,
              alt: t('explorer.modal.onboarding.blog.screen1.alt', {
                ns: 'blog',
              }),
              text: t('explorer.modal.onboarding.blog.screen1.text', {
                ns: 'blog',
              }),
            },
            {
              src: illuEditor,
              alt: t('explorer.modal.onboarding.blog.screen2.alt', {
                ns: 'blog',
              }),
              text: t('explorer.modal.onboarding.blog.screen2.text', {
                ns: 'blog',
              }),
            },
          ]}
          modalOptions={{
            title: t('explorer.modal.onboarding.blog.title', { ns: 'blog' }),
            prevText: 'explorer.modal.onboarding.trash.prev',
            nextText: 'explorer.modal.onboarding.trash.next',
            closeText: 'explorer.modal.onboarding.trash.close',
          }}
        />
      </Suspense>
    </>
  );
}
