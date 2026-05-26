import { test, expect } from '@playwright/test';
import type { FitReport } from '../src/lib/types';

// Happy-path E2E for fit-analyzer.
//
// Strategy:
//  - Intercept POST /api/analyze with page.route() and return a mocked FitReport.
//  - For resume input: the InputPanel exposes a plain <textarea> fallback
//    (placeholder "…or paste the resume text directly") right under the PDF drop
//    zone. We type into that textarea directly instead of trying to mock pdfjs,
//    which is fragile in a real browser (worker module + ArrayBuffer parsing).
//    This matches the documented UX path "paste resume below instead".
//  - Then we fill the JD textarea, click "Analyze fit", and assert the
//    ResultPanel renders the mocked score, four dimensions, and findings.

const mockReport: FitReport = {
  overallScore: 80,
  verdict: 'strong',
  summary:
    'Strong overlap on core engineering skills with relevant senior experience; minor gap on the specified cloud platform.',
  dimensions: [
    {
      key: 'technical_skills',
      label: 'Technical skills',
      score: 85,
      reason: 'Deep TypeScript, React, and Node.js experience matches the stack.',
    },
    {
      key: 'experience',
      label: 'Experience',
      score: 82,
      reason: '7 years of product engineering with team-lead exposure.',
    },
    {
      key: 'education',
      label: 'Education',
      score: 70,
      reason: 'CS degree from a reputable program; no advanced certifications listed.',
    },
    {
      key: 'domain_fit',
      label: 'Domain fit',
      score: 78,
      reason: 'Prior fintech work overlaps with the company domain.',
    },
  ],
  strengths: [
    {
      point: 'Built and shipped React SPAs at scale',
      evidence: 'Led the rewrite of the customer dashboard for 200k MAU.',
    },
    {
      point: 'Strong testing discipline',
      evidence: 'Introduced Playwright E2E and raised coverage from 40% to 85%.',
    },
  ],
  gaps: [
    {
      point: 'No direct AWS production experience',
      severity: 'medium',
    },
  ],
  suggestions: [
    {
      action: 'Earn AWS Solutions Architect Associate certification',
      rationale: 'Demonstrates the cloud competency the JD calls out as required.',
    },
  ],
};

test('happy path: submit resume + JD, render fit report', async ({ page }) => {
  // 1. Mock the worker endpoint before navigation so the request is intercepted.
  await page.route('**/api/analyze', async (route) => {
    expect(route.request().method()).toBe('POST');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockReport),
    });
  });

  // 2. Visit the app (webServer in playwright.config.ts auto-starts vite).
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fit Analyzer' })).toBeVisible();

  // 3. Fill the resume textarea (fallback path — no PDF parsing required).
  const resumeTextarea = page.getByPlaceholder('…or paste the resume text directly');
  await resumeTextarea.fill(
    'Jane Doe — Senior Software Engineer.\n' +
      '7 years building React + TypeScript products.\n' +
      'Led dashboard rewrite for 200k MAU. Strong testing discipline (Playwright, Vitest).\n' +
      'B.S. Computer Science.',
  );

  // 4. Fill the JD textarea.
  const jdTextarea = page.getByPlaceholder('Paste the job description here');
  await jdTextarea.fill(
    'Senior Frontend Engineer. Required: 5+ yrs React, TypeScript, AWS. ' +
      'Fintech domain experience a plus. Own end-to-end delivery of customer-facing UI.',
  );

  // 5. Submit.
  const submit = page.getByRole('button', { name: /analyze fit/i });
  await expect(submit).toBeEnabled();
  await submit.click();

  // 6. Assert the report rendered.
  // Score gauge — overallScore is 80; ScoreGauge displays the integer somewhere.
  await expect(page.getByText('80', { exact: false }).first()).toBeVisible();

  // Summary text from the mock.
  await expect(page.getByText(/Strong overlap on core engineering skills/i)).toBeVisible();

  // The "Dimensions" section header.
  await expect(page.getByText(/^Dimensions$/i)).toBeVisible();

  // All four dimension labels must render, in order. Use exact matches so the
  // JD textarea text (which contains words like "Experience") does not collide.
  await expect(page.getByText('Technical skills', { exact: true })).toBeVisible();
  await expect(page.getByText('Experience', { exact: true })).toBeVisible();
  await expect(page.getByText('Education', { exact: true })).toBeVisible();
  await expect(page.getByText('Domain fit', { exact: true })).toBeVisible();

  // At least one finding (strength) from the mock should be on screen.
  await expect(
    page.getByText('Built and shipped React SPAs at scale'),
  ).toBeVisible();
});
