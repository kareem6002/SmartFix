import { WorkHistory } from './WorkHistory';
import { CollaborationPanel } from './Inbox';
import { useI18n } from '../i18n';

export function WorkHistoryPage() {
  const { t } = useI18n();
  return <div className="workspace-tab-page"><header><h3 className="section-title">{t('work.title')}</h3><p className="text-muted">{t('work.subtitle')}</p></header><WorkHistory /></div>;
}
export function CollaborationPage() {
  const { t } = useI18n();
  return <div className="workspace-tab-page"><header><h3 className="section-title">{t('collab.pageTitle')}</h3><p className="text-muted">{t('collab.pageSubtitle')}</p></header><CollaborationPanel /></div>;
}
