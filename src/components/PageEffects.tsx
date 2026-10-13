import { useEffect, useRef } from 'react';

// Small page-wide behaviours that don't belong to any one section.

/** A thin bar pinned to the top of the viewport that fills as you scroll. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
    };
    const onScroll = () => { frame ||= requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" ref={ref} />;
}

/**
 * Fade blocks in as they scroll into view. Runs after hydration, so content is
 * fully visible without JavaScript; `deps` re-scans when lists render later.
 */
export function useReveal(selector: string, deps: unknown[] = []) {
  useEffect(() => {
    document.documentElement.classList.add('js');
    if (!('IntersectionObserver' in window)) return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll(selector).forEach((element) => {
      if (element.classList.contains('is-visible')) return;
      element.classList.add('reveal');
      observer.observe(element);
    });
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
