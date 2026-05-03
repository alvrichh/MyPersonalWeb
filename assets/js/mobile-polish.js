'use strict';

const createMobilePolish = () => {
  if (document.querySelector('[data-mobile-polish-style]')) return;

  const style = document.createElement('style');
  style.setAttribute('data-mobile-polish-style', 'true');
  style.textContent = `
    @media (max-width: 760px) {
      body {
        line-height: 1.58;
      }

      .portfolio-shell {
        width: min(100% - 1.6rem, 540px);
        padding: 1.15rem 0 2.8rem;
        gap: 1.2rem;
      }

      .main-stage,
      .content-stack {
        gap: 1.2rem;
      }

      .card {
        border-radius: 26px;
      }

      .sidebar,
      .topbar,
      .panel {
        padding: 1.1rem;
      }

      .sidebar {
        padding-top: 1.25rem;
      }

      .avatar-wrap {
        width: 132px;
        border-radius: 26px;
        padding: 0.65rem;
      }

      .profile-block {
        gap: 1rem;
      }

      .profile-copy {
        gap: 0.55rem;
      }

      .name {
        font-size: clamp(2.1rem, 11vw, 2.65rem);
        letter-spacing: -0.055em;
      }

      .role,
      .lead,
      .section-intro,
      .project-copy p,
      .feature-card p,
      .mini-card p,
      .timeline-item p {
        font-size: 1rem;
      }

      .availability-pill {
        max-width: 100%;
        padding: 0.62rem 0.85rem;
        line-height: 1.25;
      }

      .floating-controls {
        position: static;
        width: 100%;
        grid-template-columns: 1fr 1fr;
        justify-items: stretch;
        gap: 0.7rem;
        margin-bottom: 0.2rem;
      }

      .floating-controls .picker,
      .floating-controls .picker-trigger {
        width: 100%;
      }

      .floating-controls .picker-trigger {
        min-height: 3.2rem;
        justify-content: center;
        padding: 0.72rem 0.8rem;
        border-radius: 18px;
      }

      .floating-controls .picker-trigger-label,
      .floating-controls .picker-trigger-current span:last-child {
        display: inline-flex;
      }

      .floating-controls .picker-trigger-copy {
        gap: 0.32rem;
      }

      .floating-controls .picker-trigger-label {
        font-size: 0.84rem;
      }

      .floating-controls .picker-trigger-current {
        font-size: 0.88rem;
      }

      .floating-controls .picker-trigger-side {
        display: none;
      }

      .floating-controls .picker-menu {
        width: min(100%, calc(100vw - 1.6rem));
        left: 0;
        right: auto;
      }

      .topbar {
        position: relative;
        top: auto;
        gap: 1.05rem;
      }

      .topbar .brand {
        width: 100%;
      }

      .brand-mark {
        width: 2.8rem;
        height: 2.8rem;
        border-radius: 18px;
      }

      .section-nav {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.65rem;
        overflow: visible;
        padding-bottom: 0;
      }

      .nav-tab,
      .gym-nav-link {
        width: 100%;
        justify-content: center;
        padding: 0.82rem 0.78rem;
        font-size: 0.92rem;
      }

      .panel-heading {
        gap: 0.8rem;
        margin-bottom: 1.65rem;
      }

      .panel-heading h2 {
        font-size: clamp(1.8rem, 9vw, 2.35rem);
        letter-spacing: -0.045em;
      }

      .intro-grid,
      .contact-layout {
        gap: 1.35rem;
      }

      .intro-copy {
        gap: 1.3rem;
      }

      .cta-row,
      .project-links,
      .filter-row {
        gap: 0.7rem;
      }

      .cta-row .btn,
      .project-link,
      .filter-chip {
        min-height: 3.05rem;
      }

      .quick-notes {
        gap: 0.8rem;
      }

      .quick-notes li {
        padding-left: 1.25rem;
      }

      .portrait-card {
        min-height: 360px;
        padding: 1rem;
        border-radius: 26px;
      }

      .portrait-photo {
        min-height: 245px;
        object-fit: cover;
      }

      .portrait-sticker {
        width: 42%;
      }

      .metric-card {
        left: 1rem;
        right: 1rem;
        bottom: 1rem;
        padding: 0.95rem;
      }

      .section-block {
        margin-top: 1.65rem;
      }

      .section-block h3 {
        margin-bottom: 0.9rem;
      }

      .feature-grid,
      .focus-grid,
      .project-grid,
      .contact-grid,
      .timeline {
        gap: 1rem;
      }

      .feature-card,
      .mini-card,
      .project-card,
      .channel-card,
      .timeline-item {
        border-radius: 22px;
      }

      .feature-card,
      .mini-card,
      .channel-card {
        padding: 1.05rem;
      }

      .timeline-item {
        padding: 1rem;
      }

      .project-card {
        overflow: hidden;
      }

      .project-media {
        min-height: 210px;
      }

      .project-copy {
        padding: 1.05rem;
        gap: 0.85rem;
      }

      .project-copy h3 {
        font-size: 1.25rem;
      }

      .project-tags {
        gap: 0.5rem;
      }

      .tag,
      .chip {
        padding: 0.45rem 0.68rem;
      }

      .chip-cloud {
        gap: 0.55rem;
      }

      .meta-list,
      .sidebar-actions {
        gap: 0.75rem;
      }

      .meta-item {
        grid-template-columns: 2.75rem 1fr;
        padding: 0.85rem;
      }

      .meta-icon,
      .feature-icon,
      .channel-icon {
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 16px;
      }
    }

    @media (max-width: 430px) {
      .portfolio-shell {
        width: min(100% - 1.1rem, 420px);
      }

      .sidebar,
      .topbar,
      .panel {
        padding: 0.95rem;
      }

      .floating-controls {
        grid-template-columns: 1fr;
      }

      .section-nav {
        grid-template-columns: 1fr;
      }

      .panel-heading h2 {
        font-size: clamp(1.65rem, 10vw, 2.1rem);
      }

      .portrait-card {
        min-height: 330px;
      }

      .project-media {
        min-height: 190px;
      }
    }
  `;

  document.head.appendChild(style);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createMobilePolish);
} else {
  createMobilePolish();
}
