'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MAX_JSON_DEPTH } from '@/utils/jsonWalk';

const TITLE_FALLBACK = 'Nested too deeply to display';
const BODY_FALLBACK =
  'This document nests more than {{limit}} levels deep. Browsers run out of stack space on structures that deep, so this view cannot render it. Flatten or split the document to view it here.';

interface DepthLimitNoticeProps {
  /** The limit that was actually hit. Defaults to the shared one. */
  limit?: number;
}

/**
 * The message every view shows when a document is nested past
 * {@link MAX_JSON_DEPTH}.
 *
 * A shared block rather than five copies, because the explanation is the same
 * everywhere and it is the one thing standing between the user and a bare
 * "Maximum call stack size exceeded" from the error boundary. Each view wraps it
 * in its own container, so it slots into whatever empty state that view already
 * uses.
 *
 * The `mounted` gate matches the rest of the app: the English fallback renders
 * on the server and during the first client render, and the translated string
 * appears once i18next has resolved the browser's language, so the two markups
 * agree.
 */
const DepthLimitNotice: React.FC<DepthLimitNoticeProps> = ({ limit = MAX_JSON_DEPTH }) => {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const title = mounted ? t('depth.title', { defaultValue: TITLE_FALLBACK }) : TITLE_FALLBACK;
  const body = mounted
    ? t('depth.body', { defaultValue: BODY_FALLBACK, limit })
    : BODY_FALLBACK.replace('{{limit}}', String(limit));

  return (
    <div className="text-center p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)]">{body}</p>
    </div>
  );
};

export default DepthLimitNotice;
