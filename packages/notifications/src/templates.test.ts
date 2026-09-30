import { describe, it, expect } from 'vitest';
import { nannyVerified, nannyRejected, adminNewRequest } from './templates';

describe('notification templates', () => {
  it('nannyVerified is localized', () => {
    expect(nannyVerified('hy', 'Անահիտ').subject).toContain('Dayak');
    expect(nannyVerified('ru', 'Марина').body).toContain('Марина');
    expect(nannyVerified('en', 'Susan').subject.toLowerCase()).toContain('verified');
  });

  it('nannyRejected never leaks a free-text reason', () => {
    const c = nannyRejected('en', 'Ann');
    expect(c.body).not.toMatch(/reason|because/i);
  });

  it('adminNewRequest includes the source and handles find-me-someone', () => {
    expect(adminNewRequest('Parent A', 'Nanny B', 'fb1')).toContain('fb1');
    expect(adminNewRequest('Parent A', null, null)).toContain('find me someone');
    expect(adminNewRequest('Parent A', null, null)).toContain('direct');
  });
});
