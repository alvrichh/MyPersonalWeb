import type { ReactNode } from 'react';
import { useI18n, type MessageKey } from '../i18n/I18nContext';
import { PROJECTS, SKILLS } from '../data/work';

export function SectionHead({ index, id, title, intro, action }: { index: string; id: string; title: MessageKey; intro?: MessageKey; action?: ReactNode }) {
  const { t } = useI18n();
  return (
    <header className={`section-head${action ? ' has-action' : ''}`}>
      <p className="section-index">{index}</p>
      <h2 id={id}>{t(title)}</h2>
      {action}
      {intro && <p className="section-intro">{t(intro)}</p>}
    </header>
  );
}

export function Work() {
  const { t } = useI18n();
  return (
    <section className="section wrap" id="work" aria-labelledby="work-title">
      <SectionHead index="03" id="work-title" title="work.title" intro="work.intro" />

      <ol className="work-list">
        {PROJECTS.map((project, index) => {
          const title = typeof project.title === 'string' ? project.title : t(project.title.key);
          return (
            <li className="work-item" key={title}>
              <span className="work-num">{String(index + 1).padStart(2, '0')}</span>
              <div className="work-main">
                <h3>
                  {project.href ? (
                    <a href={project.href} {...(project.external ? { target: '_blank', rel: 'noreferrer' } : {})}>
                      {title} <span className="arrow" aria-hidden="true">↗</span>
                    </a>
                  ) : title}
                </h3>
                <p>{t(project.summary)}</p>
                {project.points && (
                  <ul className="work-points">
                    {project.points.map((point) => <li key={point}>{t(point)}</li>)}
                  </ul>
                )}
                <p className="work-stack">{project.stack}</p>
              </div>
              <div className="work-meta">
                {project.image && (
                  <img className="work-thumb" src={project.image} alt="" width={960} height={600} loading="lazy" decoding="async" />
                )}
                <span className="work-year">{project.year}</span>
                <span className={project.private ? 'work-private' : undefined}>{t(project.status)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function Skills() {
  const { t } = useI18n();
  return (
    <section className="section wrap" id="skills" aria-labelledby="skills-title">
      <SectionHead index="04" id="skills-title" title="skills.title" intro="skills.intro" />
      <dl className="skills-grid">
        {SKILLS.map((skill) => (
          <div key={skill.label}>
            <dt>{t(skill.label)}</dt>
            <dd>{typeof skill.value === 'string' ? skill.value : t(skill.value.key)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
