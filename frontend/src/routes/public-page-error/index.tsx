import { Button, EmptyScreen } from '@edifice.io/react';
import illuError from '@images/emptyscreen/illu-error.svg';
import { useTranslation } from 'react-i18next';
import { useNavigate, useRouteError } from 'react-router-dom';

export default function PublicPageError() {
  const error = useRouteError();
  console.error(error);

  const { t } = useTranslation();

  const navigate = useNavigate();
  const handleBackClick = () => navigate(-1);

  return (
    <main className="container-fluid d-flex flex-column bg-white">
      <div className="d-flex flex-column gap-16 align-items-center mt-64">
        <EmptyScreen
          imageSrc={illuError}
          imageAlt={t('explorer.emptyScreen.error.alt')}
          title={t('oops')}
          text={t('notfound', {
            ns: 'blog',
          })}
        />
        <Button color="primary" onClick={handleBackClick}>
          {t('back')}
        </Button>
      </div>
    </main>
  );
}
