import { Affiliation } from './affiliation';
import { useI18n } from './i18n';

/** Small badges: "With Eng. Tarek" and "Under <company>" (shown to customers on technician cards, and on profiles). */
export function AffChips({ aff }: { aff?: Affiliation | null }) {
  const { t } = useI18n();
  if (!aff || (!aff.engineer && !aff.company)) return null;
  return (
    <div className="aff-chips">
      {aff.engineer && <span className="aff-chip eng">{t('aff.chipEngineer', { name: t('title.engineer', { name: aff.engineer.name }) })}</span>}
      {aff.company && <span className="aff-chip co">{t('aff.chipCompany', { name: aff.company.name })}</span>}
    </div>
  );
}
