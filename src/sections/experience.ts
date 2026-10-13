import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { I18n, type MessageKey } from '../i18n/i18n';
import { CERTIFICATES, EDUCATION, JOBS, VOLUNTEERING, type Period, type Role, type School } from '../data/experience';
import { formatDuration, formatMonth, monthIndex, thisMonth } from '../lib/format';
import { Icon } from '../components/icon';
import { SectionHead } from './hero-about';

/** "Jan 2026 – Present · 10 months · Full-time · Ireland · Remote" */
@Component({
  selector: 'p[appPeriod]',
  host: { class: 'xp-meta' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `{{ text() }}`,
})
export class PeriodLine {
  readonly period = input.required<Period>({ alias: 'appPeriod' });
  private readonly i18n = inject(I18n);

  protected readonly text = computed(() => {
    const period = this.period();
    const { locale } = this.i18n.lang();
    const t = (key: string) => this.i18n.t(key);
    const start = monthIndex(period.start);
    const end = period.end ? monthIndex(period.end) : thisMonth();
    const parts: string[] = [];
    if (!period.hideDates) {
      parts.push(`${formatMonth(start, locale)} – ${period.end ? formatMonth(end, locale) : t('xp.present')}`);
    }
    parts.push(formatDuration(end - start + 1, locale));
    if (period.type) parts.push(t(`xp.type.${period.type}`));
    if (period.place) parts.push(t(`xp.place.${period.place}`));
    if (period.mode) parts.push(t(`xp.mode.${period.mode}`));
    return parts.join(' · ');
  });
}

/** Summary, bullet points and tags of one role at a company with several. */
@Component({
  selector: 'app-role-details',
  host: { style: 'display: contents' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let r = role();
    @if (r.summary) {
      <p class="xp-summary">{{ i18n.t(r.summary) }}</p>
    }
    @if (r.points) {
      <ul class="xp-points">
        @for (point of r.points; track point) {
          <li>{{ i18n.t(point) }}</li>
        }
      </ul>
    }
    @if (r.tags) {
      <ul class="xp-tags" [attr.aria-label]="r.tagsLabel ?? 'Technologies'">
        @for (tag of r.tags; track tag) {
          <li>{{ tag }}</li>
        }
      </ul>
    }
  `,
})
export class RoleDetails {
  readonly role = input.required<Role>();
  protected readonly i18n = inject(I18n);
}

@Component({
  selector: 'div[appSchoolList]',
  host: { class: 'edu' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h3 class="edu-title">{{ i18n.t(title()) }}</h3>
    <ul class="edu-list">
      @for (school of schools(); track school.name) {
        <li>
          <span class="xp-logo xp-logo-sm" [class.xp-logo-fill]="school.fill">
            <img [src]="'./images/logos/' + school.logo" alt="" width="40" height="40" loading="lazy" />
          </span>
          <span class="edu-copy">
            <span class="edu-name">{{ i18n.t(school.name) }}</span>
            <span class="edu-org">
              @if (school.url) {
                <a [href]="school.url" target="_blank" rel="noreferrer">{{ school.org }}<span class="xp-ext" aria-hidden="true">↗</span></a>
              } @else {
                {{ school.org }}
              }
              · {{ school.years }}
            </span>
            @if (school.note) {
              <span class="edu-note">{{ i18n.t(school.note) }}</span>
            }
          </span>
        </li>
      }
    </ul>
  `,
})
export class SchoolList {
  readonly title = input.required<MessageKey>();
  readonly schools = input.required<School[]>();
  protected readonly i18n = inject(I18n);
}

@Component({
  selector: 'section[appExperience]',
  imports: [NgTemplateOutlet, SectionHead, PeriodLine, RoleDetails, SchoolList, Icon],
  host: { class: 'section wrap', id: 'experience', 'aria-labelledby': 'exp-title' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header appSectionHead index="02" headingId="exp-title" title="exp.title" intro="exp.intro"></header>

    <ol class="xp-list">
      @for (job of jobs; track job.company) {
        @let grouped = job.roles.length > 1;
        @let role = job.roles[0];
        <ng-template #company>
          @if (job.url) {
            <a [href]="job.url" target="_blank" rel="noreferrer">{{ job.company }}<span class="xp-ext" aria-hidden="true">↗</span></a>
          } @else {
            {{ job.company }}
          }
        </ng-template>

        <li class="xp-item" [class.xp-group]="grouped">
          <div class="xp-rail" aria-hidden="true">
            <span class="xp-logo"><img [src]="'./images/logos/' + job.logo" alt="" width="48" height="48" loading="lazy" /></span>
          </div>
          <div class="xp-body">
            @if (grouped) {
              <h3 class="xp-role"><ng-container [ngTemplateOutlet]="company" /></h3>
              @if (job.period) {
                <p [appPeriod]="job.period"></p>
              }
              <ol class="xp-roles">
                @for (item of job.roles; track item.title) {
                  <li>
                    <h4 class="xp-subrole">{{ item.title }}</h4>
                    <p [appPeriod]="item.period"></p>
                    <app-role-details [role]="item" />
                  </li>
                }
              </ol>
            } @else {
              <h3 class="xp-role">{{ role.title }} <span class="xp-company">· <ng-container [ngTemplateOutlet]="company" /></span></h3>
              <p [appPeriod]="role.period"></p>
              @if (role.summary) {
                <p class="xp-summary">{{ i18n.t(role.summary) }}</p>
              }
              @if (role.points) {
                <ul class="xp-points">
                  @for (point of role.points; track point) {
                    <li>{{ i18n.t(point) }}</li>
                  }
                </ul>
              }
              @if (job.media; as media) {
                <a class="xp-media" [href]="media.href" target="_blank" rel="noreferrer">
                  <img [src]="'./images/' + media.image" [alt]="media.alt" [width]="media.width" [height]="media.height" loading="lazy" />
                  <span class="xp-media-copy">
                    <span class="xp-media-link"><svg icon="instagram"></svg>{{ media.label }} <span aria-hidden="true">↗</span></span>
                  </span>
                </a>
              }
              @if (role.tags) {
                <ul class="xp-tags" [attr.aria-label]="role.tagsLabel ?? 'Technologies'">
                  @for (tag of role.tags; track tag) {
                    <li>{{ tag }}</li>
                  }
                </ul>
              }
            }
          </div>
        </li>
      }
    </ol>

    <div appSchoolList title="exp.eduTitle" [schools]="education"></div>
    <div appSchoolList title="exp.volTitle" [schools]="volunteering"></div>

    <div class="edu certs">
      <h3 class="edu-title">{{ i18n.t('exp.certsTitle') }}</h3>
      <ul class="cert-list">
        @for (cert of certificates; track cert.name) {
          <li>
            <a class="cert" [class.has-thumb]="cert.thumb" [href]="cert.url" target="_blank" rel="noreferrer">
              @if (cert.thumb) {
                <img class="cert-thumb" [src]="'./images/certs/' + cert.thumb" [alt]="'Certificado: ' + cert.name" width="72" height="51" loading="lazy" />
              } @else {
                <img [src]="'./images/logos/' + (cert.issuer === 'LinkedIn' ? 'linkedin.svg' : 'openwebinars.png')" alt="" width="28" height="28" loading="lazy" />
              }
              <span class="cert-copy">
                <span class="cert-name">{{ cert.name }}</span>
                <span class="cert-meta">{{ cert.issuer }} · {{ cert.year }}</span>
              </span>
              <span class="xp-ext" aria-hidden="true">↗</span>
            </a>
          </li>
        }
      </ul>
    </div>
  `,
})
export class Experience {
  protected readonly i18n = inject(I18n);
  protected readonly jobs = JOBS;
  protected readonly education = EDUCATION;
  protected readonly volunteering = VOLUNTEERING;
  protected readonly certificates = CERTIFICATES;
}
