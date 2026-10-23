import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Message } from '@aqours/contracts';
import { ReportConversation } from '../src/features/reports/components/ReportConversation';

test('supplier conversation renders chronological bubbles without mutating descending API data', () => {
  const messages: Message[] = [
    { id: 'latest', authorId: 'staff', authorRole: 'staff', text: 'Latest supplier reply', createdAt: '2026-10-23T01:00:00Z' },
    { id: 'first', authorId: 'customer', authorRole: 'customer', text: 'First customer question', createdAt: '2026-10-22T23:59:00Z' },
  ];
  const html = renderToStaticMarkup(createElement(ReportConversation, { id: 'owned-report', messages, visible: true, refresh() {} }));
  assert.ok(html.indexOf('First customer question') < html.indexOf('Latest supplier reply'), 'oldest bubble precedes newest');
  assert.match(html, /data-direction="incoming"/);
  assert.match(html, /data-direction="outgoing"/);
  assert.equal(messages[0].id, 'latest', 'rendering preserves the cached API order');
  assert.doesNotMatch(html, /Delivered|Read receipt|Online now|Typing/);
});
