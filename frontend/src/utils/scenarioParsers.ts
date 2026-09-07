import { TestCase, Priority, TestType, ExecutionType } from '@/services/api';

export interface ParsedStep {
  stepNumber: number;
  action: string;
  expectedResult: string;
  raw?: string;
}

export interface ParsedScenarioItem {
  id: string; // temporary client-side uuid
  code?: string;
  title: string;
  description?: string;
  suiteName?: string;
  originalRawSuiteName?: string;
  isAutoMatched?: boolean;
  matchedSuiteId?: string;
  executionType: ExecutionType;
  type: TestType;
  priority: Priority;
  precondition?: string;
  jiraStoryKey?: string;
  tags: string[];
  steps: ParsedStep[];
  // Match results with existing project cases
  matchStatus: 'NEW' | 'UPDATE';
  matchedCaseId?: string;
  matchedCaseCode?: string;
  isSelected: boolean;
}

export interface SmartSuiteMatchResult {
  suiteName: string;
  isAutoMatched: boolean;
  matchedSuiteId?: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function smartMatchSuite(
  candidate: string,
  existingSuites: { id: string; name: string }[] = [],
  tags: string[] = []
): SmartSuiteMatchResult {
  if (!existingSuites || existingSuites.length === 0) {
    return { suiteName: candidate || 'Genel Test Havuzu', isAutoMatched: false, confidence: 'LOW' };
  }

  const normCandidate = (candidate || '').trim().toLowerCase();
  const tagsStr = tags.join(' ').toLowerCase();

  // 1. Exact match
  const exact = existingSuites.find((s) => s.name.trim().toLowerCase() === normCandidate);
  if (exact) {
    return { suiteName: exact.name, isAutoMatched: true, matchedSuiteId: exact.id, confidence: 'HIGH' };
  }

  // 2. Numeric / Prefix match (e.g. "03_account" or "tg03" -> matches "03_Account")
  const numMatch = (normCandidate + ' ' + tagsStr).match(/(\d+)[\_\-\.\s]|tg(\d+)/i);
  if (numMatch) {
    const rawDigits = numMatch[1] || numMatch[2];
    const numPrefix = rawDigits.padStart(2, '0');
    const prefixSuite = existingSuites.find((s) => {
      const sNum = s.name.match(/^(\d+)[\_\-\.\s]/);
      return sNum && (sNum[1].padStart(2, '0') === numPrefix || sNum[1] === rawDigits);
    });
    if (prefixSuite) {
      return { suiteName: prefixSuite.name, isAutoMatched: true, matchedSuiteId: prefixSuite.id, confidence: 'HIGH' };
    }
  }

  // 3. Domain token match (banking dictionary)
  const domainKeywords = [
    { key: 'transfer', synonyms: ['fast', 'eft', 'havale', 'virman', 'kolas', 'transfer'] },
    { key: 'account', synonyms: ['hesap', 'account', 'vadesiz', 'vadeli', 'ekstre', 'bakiye'] },
    { key: 'login', synonyms: ['login', 'giris', 'auth', 'biyometri', 'faceid', 'touchid', 'otp'] },
    { key: 'kredi', synonyms: ['kredi', 'loan', 'tahsis', 'avans', 'kmh'] },
    { key: 'kart', synonyms: ['kart', 'card', 'cvv', 'pos'] },
    { key: 'customer', synonyms: ['customer', 'musteri', 'cif', 'mbs', 'kyc', 'onboarding'] },
    { key: 'check', synonyms: ['cek', 'senet', 'check'] },
    { key: 'doviz', synonyms: ['doviz', 'fx', 'altin', 'kur'] },
    { key: 'teminat', synonyms: ['teminat', 'mektup'] },
    { key: 'fatura', synonyms: ['fatura', 'dbs', 'odeme'] },
  ];

  const allSearchText = `${normCandidate} ${tagsStr}`;
  for (const domain of domainKeywords) {
    const hasSynonym = domain.synonyms.some((syn) => allSearchText.includes(syn));
    if (hasSynonym) {
      const suiteForDomain = existingSuites.find((s) => {
        const sLower = s.name.toLowerCase();
        return domain.synonyms.some((syn) => sLower.includes(syn));
      });
      if (suiteForDomain) {
        return { suiteName: suiteForDomain.name, isAutoMatched: true, matchedSuiteId: suiteForDomain.id, confidence: 'MEDIUM' };
      }
    }
  }

  // 4. Substring match
  const cleanCandidate = normCandidate.replace(/^[\d\_\-\.\s]+/, '').replace(/\s*(senaryoları|testleri|modülü|işlemleri)$/i, '').trim();
  if (cleanCandidate.length >= 3) {
    const subMatch = existingSuites.find((s) => {
      const sLower = s.name.toLowerCase();
      return sLower.includes(cleanCandidate) || cleanCandidate.includes(sLower);
    });
    if (subMatch) {
      return { suiteName: subMatch.name, isAutoMatched: true, matchedSuiteId: subMatch.id, confidence: 'MEDIUM' };
    }
  }

  return { suiteName: candidate || 'Genel Test Havuzu', isAutoMatched: false, confidence: 'LOW' };
}

export interface ParsedScenarioFile {
  fileName: string;
  sourceType: 'CUCUMBER' | 'PLAYWRIGHT';
  featureTitle?: string;
  scenarios: ParsedScenarioItem[];
  errors: string[];
}

/**
 * Parses Cucumber Gherkin (.feature) files supporting both English and Turkish keywords
 */
export function parseCucumberFeature(
  content: string,
  fileName: string = 'test.feature',
  existingCases: TestCase[] = [],
  existingSuites: { id: string; name: string }[] = []
): ParsedScenarioFile {
  const errors: string[] = [];
  const lines = content.split(/\r?\n/);

  let featureTitle = '';
  const featureDescription: string[] = [];
  const featureTags: string[] = [];
  const scenarios: ParsedScenarioItem[] = [];

  let currentScenario: {
    title: string;
    tags: string[];
    description: string[];
    steps: ParsedStep[];
  } | null = null;

  let currentTags: string[] = [];
  const backgroundSteps: ParsedStep[] = [];
  let inBackground = false;
  let inExamples = false;
  let exampleHeaders: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const stripped = raw.trim();

    if (!stripped || stripped.startsWith('#')) {
      continue;
    }

    // @tags
    if (stripped.startsWith('@')) {
      const tags = stripped.match(/@[\w()-]+/g) || [];
      if (!featureTitle && currentScenario === null) {
        featureTags.push(...tags);
      } else {
        currentTags.push(...tags);
      }
      continue;
    }

    // Feature header
    const mFeat = stripped.match(/^(?:Feature|Özellik):\s*(.*)$/i);
    if (mFeat) {
      featureTitle = mFeat[1].trim();
      continue;
    }

    // Background header
    const mBg = stripped.match(/^(?:Background|Geçmiş|Ön Koşul):\s*(.*)$/i);
    if (mBg) {
      if (currentScenario) {
        finalizeScenario(currentScenario);
        currentScenario = null;
      }
      inBackground = true;
      inExamples = false;
      continue;
    }

    // Scenario header
    const mScen = stripped.match(/^(?:Scenario|Senaryo|Scenario Outline|Senaryo Taslağı):\s*(.*)$/i);
    if (mScen) {
      if (currentScenario) {
        finalizeScenario(currentScenario);
      }
      inBackground = false;
      inExamples = false;

      const mergedTags = Array.from(new Set([...featureTags, ...currentTags]));
      currentScenario = {
        title: mScen[1].trim() || `Senaryo ${scenarios.length + 1}`,
        tags: mergedTags,
        description: [],
        steps: backgroundSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 })),
      };
      currentTags = [];
      continue;
    }

    // Examples header
    const mExamples = stripped.match(/^(?:Examples|Örnekler):\s*(.*)$/i);
    if (mExamples && currentScenario) {
      inExamples = true;
      exampleHeaders = [];
      continue;
    }

    // Examples data table rows
    if (inExamples && stripped.startsWith('|') && currentScenario) {
      const cells = stripped
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (exampleHeaders.length === 0) {
        exampleHeaders = cells;
      } else if (cells.length > 0) {
        // Appended to scenario description as example parameter test data
        const paramStr = exampleHeaders.map((h, idx) => `${h}=${cells[idx] || ''}`).join(', ');
        currentScenario.description.push(`[Parametre Verisi]: ${paramStr}`);
      }
      continue;
    }

    // Gherkin Steps: Given, When, Then, And, But, Diyelim ki, Eğer ki, O zaman, Ve, Fakat, *
    const mStep = stripped.match(
      /^(?:Given|When|Then|And|But|\*|Diyelim ki|Eğer ki|O zaman|Ve|Fakat)\s+(.*)$/i
    );
    if (mStep) {
      const stepAction = mStep[1].trim();
      const lower = stepAction.toLowerCase();

      // Detection of verification steps
      const isVerification =
        stripped.toLowerCase().startsWith('then') ||
        stripped.toLowerCase().startsWith('o zaman') ||
        ['görünmelidir', 'doğrulanır', 'kontrol edilir', 'gözlemlenir', 'görüntülenir', 'olmalıdır', 'yüklenmelidir', 'başarılı', 'should', 'verify', 'assert'].some(
          (kw) => lower.includes(kw)
        );

      let action = stepAction;
      let expectedResult = 'Adım başarıyla tamamlanır';

      if (isVerification) {
        expectedResult = stepAction;
        action = `Doğrulama: ${stepAction}`;
      }

      const targetSteps = inBackground ? backgroundSteps : currentScenario?.steps;
      if (targetSteps) {
        targetSteps.push({
          stepNumber: targetSteps.length + 1,
          action,
          expectedResult,
          raw: stripped,
        });
      }
      continue;
    }

    // Table row for previous step
    if (stripped.startsWith('|') && currentScenario && currentScenario.steps.length > 0) {
      const lastStep = currentScenario.steps[currentScenario.steps.length - 1];
      lastStep.action += `\n${stripped}`;
      continue;
    }

    // Free text description
    if (currentScenario) {
      currentScenario.description.push(stripped);
    } else if (!featureTitle) {
      // ignore
    } else {
      featureDescription.push(stripped);
    }
  }

  if (currentScenario) {
    finalizeScenario(currentScenario);
  }

  function finalizeScenario(sc: {
    title: string;
    tags: string[];
    description: string[];
    steps: ParsedStep[];
  }) {
    const tagsStr = sc.tags.join(' ');
    const allText = `${sc.title} ${tagsStr}`;

    // Extract Case Code: @MOB-TC-01 or @TC-101 or [TC-123]
    let code: string | undefined;
    const codeMatch = allText.match(/@([A-Za-z0-9_-]+-TC-\d+)/i) || allText.match(/\[([A-Za-z0-9_-]+-\d+)\]/i);
    if (codeMatch) {
      code = codeMatch[1];
    }

    // Extract Jira Key: @MOB-402, @SCRUM-12, etc.
    let jiraStoryKey: string | undefined;
    const jiraMatch = allText.match(/@([A-Z]{2,10}-\d+)/);
    if (jiraMatch && (!code || jiraMatch[1] !== code)) {
      jiraStoryKey = jiraMatch[1];
    }

    // Priority
    const isCritical =
      sc.tags.some((t) => /@smoke|@critical|@p1|@high/i.test(t)) ||
      tagsStr.toLowerCase().includes('@critical');
    const isBlocker = sc.tags.some((t) => /@blocker|@p0/i.test(t));
    const priority: Priority = isBlocker ? 'BLOCKER' : isCritical ? 'CRITICAL' : 'NORMAL';

    // Type detection based on tags
    let type: TestType = 'WEB';
    if (/@desktop|@core|@winapp|@flaui/i.test(tagsStr)) {
      type = 'DESKTOP';
    } else if (/@ios|@apple/i.test(tagsStr)) {
      type = 'IOS';
    } else if (/@android/i.test(tagsStr)) {
      type = 'ANDROID';
    } else if (/@mobile|@appium/i.test(tagsStr)) {
      type = 'IOS';
    } else if (/@api|@rest|@backend/i.test(tagsStr)) {
      type = 'API';
    }

    const fallbackSuite = featureTitle || fileName.replace(/\.feature$/i, '');
    const smartMatched = smartMatchSuite(fallbackSuite, existingSuites, sc.tags);

    const scenarioItem: ParsedScenarioItem = {
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code,
      title: sc.title,
      description: sc.description.join('\n').trim() || undefined,
      suiteName: smartMatched.suiteName,
      originalRawSuiteName: fallbackSuite,
      isAutoMatched: smartMatched.isAutoMatched,
      matchedSuiteId: smartMatched.matchedSuiteId,
      executionType: 'AUTOMATED',
      type,
      priority,
      precondition: backgroundSteps.length > 0
        ? backgroundSteps.map((s) => s.action).join('; ')
        : undefined,
      jiraStoryKey,
      tags: sc.tags,
      steps: sc.steps,
      matchStatus: 'NEW',
      isSelected: true,
    };

    scenarios.push(scenarioItem);
  }

  // Cross-reference with existing cases
  matchScenariosWithExisting(scenarios, existingCases);

  return {
    fileName,
    sourceType: 'CUCUMBER',
    featureTitle: featureTitle || fileName,
    scenarios,
    errors,
  };
}

/**
 * Parses Playwright test files (.spec.ts, .spec.js, .test.ts, .test.js)
 */
export function parsePlaywrightTest(
  content: string,
  fileName: string = 'test.spec.ts',
  existingCases: TestCase[] = [],
  existingSuites: { id: string; name: string }[] = []
): ParsedScenarioFile {
  const errors: string[] = [];
  const scenarios: ParsedScenarioItem[] = [];

  // Extract Describe Suite
  let describeName = '';
  const describeMatch = content.match(/test\.describe\(\s*['"`](.*?)['"`]/);
  if (describeMatch) {
    describeName = describeMatch[1].trim();
  } else {
    describeName = fileName.replace(/\.(spec|test)\.(ts|js|jsx|tsx)$/i, '');
  }

  // Regex for test('...', async ({ page }) => { ... })
  // Handles test, test.only, test.skip
  const testBlockRegex = /test(?:\.only|\.skip)?\(\s*['"`](.*?)['"`](?:,\s*\{[^}]*\})?,\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\}\s*\);/g;

  let match;
  while ((match = testBlockRegex.exec(content)) !== null) {
    const rawTitle = match[1].trim();
    const testBody = match[2];

    // Tags extraction from title (e.g. "Test login @smoke @MOB-12")
    const tags = rawTitle.match(/@[\w()-]+/g) || [];
    const cleanTitle = rawTitle.replace(/@[\w()-]+/g, '').trim();

    // Extract Case Code: @MOB-TC-01 or @TC-101
    let code: string | undefined;
    const codeMatch = rawTitle.match(/@([A-Za-z0-9_-]+-TC-\d+)/i) || rawTitle.match(/\[([A-Za-z0-9_-]+-\d+)\]/i);
    if (codeMatch) {
      code = codeMatch[1];
    }

    // Extract Jira Story Key: @MOB-123
    let jiraStoryKey: string | undefined;
    const jiraMatch = rawTitle.match(/@([A-Z]{2,10}-\d+)/);
    if (jiraMatch && (!code || jiraMatch[1] !== code)) {
      jiraStoryKey = jiraMatch[1];
    }

    // Priority
    const isCritical = tags.some((t) => /@smoke|@critical|@p1|@high/i.test(t));
    const isBlocker = tags.some((t) => /@blocker|@p0/i.test(t));
    const priority: Priority = isBlocker ? 'BLOCKER' : isCritical ? 'CRITICAL' : 'NORMAL';

    // Parse Steps from testBody
    const steps: ParsedStep[] = [];

    // Check for test.step('...', async () => { ... })
    const stepRegex = /await\s+test\.step\(\s*['"`](.*?)['"`],\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\}\s*\);/g;
    let stepMatch;
    let hasExplicitSteps = false;

    while ((stepMatch = stepRegex.exec(testBody)) !== null) {
      hasExplicitSteps = true;
      const stepTitle = stepMatch[1].trim();
      const stepBody = stepMatch[2];

      // Check if expect is inside
      const expectMatch = stepBody.match(/await\s+expect\((.*?)\)\.([a-zA-Z0-9_]+)\((.*?)\)/);
      let expectedResult = 'İlgili adım ve doğrulamalar başarıyla tamamlanır';
      if (expectMatch) {
        expectedResult = `Doğrulama: expect(${expectMatch[1]}).${expectMatch[2]}(${expectMatch[3] || ''})`;
      }

      steps.push({
        stepNumber: steps.length + 1,
        action: stepTitle,
        expectedResult,
      });
    }

    // Fallback: If no test.step was used, parse sequential commands
    if (!hasExplicitSteps) {
      const bodyLines = testBody
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('await '));

      bodyLines.forEach((line) => {
        let action = line;
        let expectedResult = 'İşlem başarıyla tamamlanır';

        if (line.includes('page.goto(')) {
          const urlMatch = line.match(/page\.goto\(\s*['"`](.*?)['"`]\s*\)/);
          action = `Sayfaya git: ${urlMatch ? urlMatch[1] : 'Belirtilen URL'}`;
        } else if (line.includes('.click(')) {
          const selMatch = line.match(/\.click\(\s*['"`](.*?)['"`]\s*\)/);
          action = `Buton/Elemente tıkla: ${selMatch ? selMatch[1] : 'Seçili Element'}`;
        } else if (line.includes('.fill(')) {
          const fillMatch = line.match(/\.fill\(\s*['"`](.*?)['"`]\s*,\s*['"`](.*?)['"`]\s*\)/);
          action = fillMatch
            ? `Alana veri gir (${fillMatch[1]}): "${fillMatch[2]}"`
            : `Alana veri gir: ${line}`;
        } else if (line.includes('expect(')) {
          action = `Sayfa durumunu doğrula`;
          expectedResult = line.replace(/^await\s+/, '');
        }

        steps.push({
          stepNumber: steps.length + 1,
          action,
          expectedResult,
          raw: line,
        });
      });
    }

    // Fallback if empty
    if (steps.length === 0) {
      steps.push({
        stepNumber: 1,
        action: 'Playwright test komutları çalıştırılır',
        expectedResult: 'Tüm test assertion ve kontrolleri başarıyla geçer',
      });
    }

    const rawSuite = describeName || fileName.replace(/\.(spec|test)\.(ts|js|jsx|tsx)$/i, '');
    const smartMatched = smartMatchSuite(rawSuite, existingSuites, tags);

    // Type detection from tags
    let pwType: TestType = 'WEB';
    const tagsStr = tags.join(' ').toLowerCase();
    if (/@desktop|@core|@winapp|@flaui/i.test(tagsStr)) {
      pwType = 'DESKTOP';
    } else if (/@ios|@apple/i.test(tagsStr)) {
      pwType = 'IOS';
    } else if (/@android/i.test(tagsStr)) {
      pwType = 'ANDROID';
    } else if (/@api|@rest|@backend/i.test(tagsStr)) {
      pwType = 'API';
    }

    scenarios.push({
      id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code,
      title: cleanTitle || rawTitle,
      description: `Playwright Test Spec [${fileName}]`,
      suiteName: smartMatched.suiteName,
      originalRawSuiteName: rawSuite,
      isAutoMatched: smartMatched.isAutoMatched,
      matchedSuiteId: smartMatched.matchedSuiteId,
      executionType: 'AUTOMATED',
      type: pwType,
      priority,
      jiraStoryKey,
      tags,
      steps,
      matchStatus: 'NEW',
      isSelected: true,
    });
  }

  // Cross-reference with existing cases
  matchScenariosWithExisting(scenarios, existingCases);

  return {
    fileName,
    sourceType: 'PLAYWRIGHT',
    featureTitle: describeName,
    scenarios,
    errors,
  };
}

/**
 * Matches parsed scenarios with existing project test cases to decide if it's NEW or UPDATE
 */
export function matchScenariosWithExisting(
  parsedList: ParsedScenarioItem[],
  existingCases: TestCase[]
) {
  if (!existingCases || existingCases.length === 0) return;

  // Code index & title index
  const codeMap = new Map<string, TestCase>();
  const titleMap = new Map<string, TestCase>();

  existingCases.forEach((tc) => {
    if (tc.code) codeMap.set(tc.code.trim().toUpperCase(), tc);
    if (tc.title) titleMap.set(tc.title.trim().toLowerCase(), tc);
  });

  parsedList.forEach((item) => {
    // Check by code
    if (item.code && codeMap.has(item.code.trim().toUpperCase())) {
      const match = codeMap.get(item.code.trim().toUpperCase())!;
      item.matchStatus = 'UPDATE';
      item.matchedCaseId = match.id;
      item.matchedCaseCode = match.code;
      return;
    }

    // Check by title
    const normTitle = item.title.trim().toLowerCase();
    if (titleMap.has(normTitle)) {
      const match = titleMap.get(normTitle)!;
      item.matchStatus = 'UPDATE';
      item.matchedCaseId = match.id;
      item.matchedCaseCode = match.code;
      // Inherit existing code if item didn't have one
      if (!item.code) {
        item.code = match.code;
      }
    }
  });
}

/**
 * Convert a TestCase into a Cucumber Gherkin feature text
 */
export function exportTestCaseToGherkin(testCase: TestCase): string {
  const tags = testCase.jiraStoryKey ? `@${testCase.jiraStoryKey} @${testCase.code}` : `@${testCase.code}`;
  const suiteName = testCase.suite?.name || 'Genel Senaryolar';

  let gherkin = `@automated\nFeature: ${suiteName}\n\n`;
  if (testCase.precondition) {
    gherkin += `  Background:\n    Given ${testCase.precondition}\n\n`;
  }

  gherkin += `  ${tags}\n  Scenario: ${testCase.title}\n`;
  if (testCase.description) {
    gherkin += `    # ${testCase.description.replace(/\n/g, '\n    # ')}\n`;
  }

  if (testCase.steps && testCase.steps.length > 0) {
    testCase.steps.forEach((st, idx) => {
      const prefix = idx === 0 ? 'When' : idx === testCase.steps!.length - 1 ? 'Then' : 'And';
      gherkin += `    ${prefix} ${st.action}\n`;
      if (st.expectedResult) {
        gherkin += `    And Doğrula: ${st.expectedResult}\n`;
      }
    });
  } else {
    gherkin += `    When Test senaryosu manuel veya otomatik koşulur\n    Then Beklenen sonuç doğrulanır\n`;
  }

  return gherkin;
}

/**
 * Convert a TestCase into a Playwright TypeScript spec
 */
export function exportTestCaseToPlaywright(testCase: TestCase): string {
  const suiteName = testCase.suite?.name || 'Genel Senaryolar';
  const tagList = testCase.jiraStoryKey ? `['@${testCase.jiraStoryKey}', '@${testCase.code}']` : `['@${testCase.code}']`;

  let spec = `import { test, expect } from '@playwright/test';\n\n`;
  spec += `test.describe('${suiteName}', () => {\n`;

  if (testCase.precondition) {
    spec += `  test.beforeEach(async ({ page }) => {\n    // Ön Koşul: ${testCase.precondition}\n  });\n\n`;
  }

  spec += `  test('${testCase.title}', { tag: ${tagList} }, async ({ page }) => {\n`;

  if (testCase.steps && testCase.steps.length > 0) {
    testCase.steps.forEach((st) => {
      spec += `    await test.step('${st.action.replace(/'/g, "\\'")}', async () => {\n`;
      spec += `      // ${st.action}\n`;
      if (st.expectedResult) {
        spec += `      // Beklenen Sonuç: ${st.expectedResult}\n`;
      }
      spec += `    });\n\n`;
    });
  } else {
    spec += `    await test.step('Senaryo adımları çalıştırılır', async () => {\n      // TODO: Playwright komutları\n    });\n`;
  }

  spec += `  });\n});\n`;
  return spec;
}
