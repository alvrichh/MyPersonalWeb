import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18n } from '../i18n/i18n';
import { PROJECTS, SKILLS, type Project } from '../data/work';
import { SectionHead } from './hero-about';

@Component({
  selector: 'section[appWork]',
  imports: [SectionHead],
  host: { class: 'section wrap', id: 'work', 'aria-labelledby': 'work-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header appSectionHead index="01" headingId="work-title" title="work.title" intro="work.intro"></header>

    <ol class="work-list">
      @for (project of projects; track $index) {
        <li class="work-item">
          <span class="work-num">{{ pad($index + 1) }}</span>
          <div class="work-main">
            <h3>
              @if (project.href) {
                <a [href]="project.href" [attr.target]="project.external ? '_blank' : null" [attr.rel]="project.external ? 'noreferrer' : null">
                  {{ title(project) }} <span class="arrow" aria-hidden="true">↗</span>
                </a>
              } @else {
                {{ title(project) }}
              }
            </h3>
            <p>{{ i18n.t(project.summary) }}</p>
            @if (project.points) {
              <ul class="work-points">
                @for (point of project.points; track point) {
                  <li>{{ i18n.t(point) }}</li>
                }
              </ul>
            }
            <p class="work-stack">{{ project.stack }}</p>
          </div>
          <div class="work-meta">
            <span class="work-year">{{ project.year }}</span>
            <span [class.work-private]="project.private">{{ i18n.t(project.status) }}</span>
          </div>
        </li>
      }
    </ol>
  `,
})
export class Work {
  protected readonly i18n = inject(I18n);
  protected readonly projects = PROJECTS;

  protected title(project: Project) {
    return typeof project.title === 'string' ? project.title : this.i18n.t(project.title.key);
  }

  protected pad(value: number) {
    return String(value).padStart(2, '0');
  }
}

@Component({
  selector: 'section[appSkills]',
  imports: [SectionHead],
  host: { class: 'section wrap', id: 'skills', 'aria-labelledby': 'skills-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header appSectionHead index="03" headingId="skills-title" title="skills.title" intro="skills.intro"></header>
    <dl class="skills-grid">
      @for (skill of skills; track skill.label) {
        <div>
          <dt>{{ i18n.t(skill.label) }}</dt>
          <dd>{{ typeof skill.value === 'string' ? skill.value : i18n.t(skill.value.key) }}</dd>
        </div>
      }
    </dl>
  `,
})
export class Skills {
  protected readonly i18n = inject(I18n);
  protected readonly skills = SKILLS;
}
