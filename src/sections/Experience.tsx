import { useI18n, type MessageKey } from '../i18n/I18nContext';
import { CERTIFICATES, EDUCATION, JOBS, VOLUNTEERING, type Period, type Role, type School } from '../data/experience';
import { formatDuration, formatMonth, monthIndex, thisMonth } from '../lib/format';
import { InstagramIcon } from '../components/icons';
import { SectionHead } from './Work';
import { GithubActivity } from './GithubActivity';

/** "Jan 2026 – Present · 10 months · Full-time · Ireland · Remote" */
function PeriodLine({ period }: { period: Period }) {
  const { t, lang } = useI18n();
  const start = monthIndex(period.start);
  const end = period.end ? monthIndex(period.end) : thisMonth();
  const parts: string[] = [];
  if (!period.hideDates) {
    parts.push(`${formatMonth(start, lang.locale)} – ${period.end ? formatMonth(end, lang.locale) : t('xp.present')}`);
  }
  parts.push(formatDuration(end - start + 1, lang.locale));
  if (period.type) parts.push(t(`xp.type.${period.type}` as MessageKey));
  if (period.place) parts.push(t(`xp.place.${period.place}` as MessageKey));
  if (period.mode) parts.push(t(`xp.mode.${period.mode}` as MessageKey));
  // The prerendered month count can differ from the visitor's "today".
  return <p className="xp-meta" suppressHydrationWarning>{parts.join(' · ')}</p>;
}

const External = ({ href, children }: { href: string; children: string }) => (
  <a href={href} target="_blank" rel="noreferrer">
    {children}<span className="xp-ext" aria-hidden="true">↗</span>
  </a>
);

function RoleDetails({ role }: { role: Role }) {
  const { t } = useI18n();
  return (
    <>
      {role.summary && <p className="xp-summary">{t(role.summary)}</p>}
      {role.points && (
        <ul className="xp-points">
          {role.points.map((point) => <li key={point}>{t(point)}</li>)}
        </ul>
      )}
      {role.tags && (
        <ul className="xp-tags" aria-label={role.tagsLabel ?? 'Technologies'}>
          {role.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
      )}
    </>
  );
}

function SchoolList({ title, schools }: { title: MessageKey; schools: School[] }) {
  const { t } = useI18n();
  return (
    <div className="edu">
      <h3 className="edu-title">{t(title)}</h3>
      <ul className="edu-list">
        {schools.map((school) => (
          <li key={school.name}>
            <span className={`xp-logo xp-logo-sm${school.fill ? ' xp-logo-fill' : ''}`}>
              <img src={`./images/logos/${school.logo}`} alt="" width={40} height={40} loading="lazy" />
            </span>
            <span className="edu-copy">
              <span className="edu-name">{t(school.name)}</span>
              <span className="edu-org">
                {school.url ? <External href={school.url}>{school.org}</External> : school.org} · {school.years}
              </span>
              {school.note && <span className="edu-note">{t(school.note)}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Experience() {
  const { t } = useI18n();
  return (
    <section className="section wrap" id="experience" aria-labelledby="exp-title">
      <SectionHead
        index="01"
        id="exp-title"
        title="exp.title"
        intro="exp.intro"
        action={(
          <a className="section-action" href="./calendar.html">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM16 3v4M8 3v4M4 11h16" /></svg>
            {t('exp.calendarLink')} <span aria-hidden="true">↗</span>
          </a>
        )}
      />

      <ol className="xp-list">
        {JOBS.map((job) => {
          const grouped = job.roles.length > 1;
          const role = job.roles[0];
          const company = job.url ? <External href={job.url}>{job.company}</External> : job.company;
          return (
            <li className={`xp-item${grouped ? ' xp-group' : ''}`} key={job.company}>
              <div className="xp-rail" aria-hidden="true">
                <span className="xp-logo"><img src={`./images/logos/${job.logo}`} alt="" width={48} height={48} loading="lazy" /></span>
              </div>
              <div className="xp-body">
                {grouped ? (
                  <>
                    <h3 className="xp-role">{company}</h3>
                    {job.period && <PeriodLine period={job.period} />}
                    <ol className="xp-roles">
                      {job.roles.map((item) => (
                        <li key={item.title}>
                          <h4 className="xp-subrole">{item.title}</h4>
                          <PeriodLine period={item.period} />
                          <RoleDetails role={item} />
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <>
                    <h3 className="xp-role">{role.title} <span className="xp-company">· {company}</span></h3>
                    <PeriodLine period={role.period} />
                    {role.summary && <p className="xp-summary">{t(role.summary)}</p>}
                    {role.points && (
                      <ul className="xp-points">
                        {role.points.map((point) => <li key={point}>{t(point)}</li>)}
                      </ul>
                    )}
                    {job.media && (
                      <a className="xp-media" href={job.media.href} target="_blank" rel="noreferrer">
                        <img src={`./images/${job.media.image}`} alt={job.media.alt} width={job.media.width} height={job.media.height} loading="lazy" />
                        <span className="xp-media-copy">
                          <span className="xp-media-link"><InstagramIcon />{job.media.label} <span aria-hidden="true">↗</span></span>
                        </span>
                      </a>
                    )}
                    {role.tags && (
                      <ul className="xp-tags" aria-label={role.tagsLabel ?? 'Technologies'}>
                        {role.tags.map((tag) => <li key={tag}>{tag}</li>)}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <SchoolList title="exp.volTitle" schools={VOLUNTEERING} />

      <div className="edu certs">
        <h3 className="edu-title">{t('exp.certsTitle')}</h3>
        <ul className="cert-list">
          {CERTIFICATES.map((cert) => (
            <li key={cert.name}>
              <a className={`cert${cert.thumb ? ' has-thumb' : ''}`} href={cert.url} target="_blank" rel="noreferrer">
                {cert.thumb ? (
                  <img className="cert-thumb" src={`./images/certs/${cert.thumb}`} alt={`Certificado: ${cert.name}`} width={72} height={51} loading="lazy" />
                ) : (
                  <img src={`./images/logos/${cert.issuer === 'LinkedIn' ? 'linkedin.svg' : 'openwebinars.png'}`} alt="" width={28} height={28} loading="lazy" />
                )}
                <span className="cert-copy">
                  <span className="cert-name">{cert.name}</span>
                  <span className="cert-meta">{cert.issuer} · {cert.year}</span>
                </span>
                <span className="xp-ext" aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <GithubActivity />
    </section>
  );
}

/** Education as its own section: one column per school, side by side. */
export function Education() {
  const { t } = useI18n();
  return (
    <section className="section wrap" id="education" aria-labelledby="edu-title">
      <SectionHead index="02" id="edu-title" title="exp.eduTitle" intro="edu.intro" />

      <ol className="edu-columns">
        {EDUCATION.map((school) => (
          <li className="edu-col" key={school.name}>
            <span className={`xp-logo${school.fill ? ' xp-logo-fill' : ''}`}>
              <img src={`./images/logos/${school.logo}`} alt="" width={48} height={48} loading="lazy" />
            </span>
            <h3 className="edu-col-name">{t(school.name)}</h3>
            <p className="edu-col-org">{school.url ? <External href={school.url}>{school.org}</External> : school.org}</p>
            <p className="xp-meta">{[school.years, school.place && t(`xp.place.${school.place}` as MessageKey)].filter(Boolean).join(' · ')}</p>
            {school.summary && <p className="edu-col-summary">{t(school.summary)}</p>}
            {school.bio && <p className="edu-col-bio">{t(school.bio)}</p>}
            {school.points && (
              <ul className="xp-points edu-col-points">
                {school.points.map((point) => <li key={point}>{t(point)}</li>)}
              </ul>
            )}
            {school.tags && (
              <ul className="xp-tags" aria-label={school.tagsLabel ?? 'Technologies'}>
                {school.tags.map((tag) => <li key={tag}>{tag}</li>)}
              </ul>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
