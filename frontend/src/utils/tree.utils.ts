import { SuiteTreeNode, TestCase } from '@/services/api';

/**
 * Flattens all test cases contained within a hierarchy of suite tree nodes.
 */
export function getAllCasesInTree(nodes: SuiteTreeNode[]): TestCase[] {
  let cases: TestCase[] = [];
  for (const node of nodes) {
    if (node.testCases && node.testCases.length > 0) {
      cases = cases.concat(node.testCases);
    }
    if (node.children && node.children.length > 0) {
      cases = cases.concat(getAllCasesInTree(node.children));
    }
  }
  return cases;
}

/**
 * Recursively locates a suite node by ID within the tree.
 */
export function findSuiteInTree(nodes: SuiteTreeNode[], suiteId: string): SuiteTreeNode | null {
  for (const node of nodes) {
    if (node.id === suiteId) return node;
    if (node.children && node.children.length > 0) {
      const found = findSuiteInTree(node.children, suiteId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Pure immutable helper to update a test case inside a nested tree.
 */
export function updateCaseInTreeNodes(nodes: SuiteTreeNode[], updated: TestCase): SuiteTreeNode[] {
  return nodes.map((node) => {
    const hasCase = node.testCases?.some((tc) => tc.id === updated.id);
    const newCases = hasCase
      ? node.testCases.map((tc) => (tc.id === updated.id ? { ...tc, ...updated } : tc))
      : node.testCases || [];
    const newChildren = node.children && node.children.length > 0
      ? updateCaseInTreeNodes(node.children, updated)
      : node.children;

    return {
      ...node,
      testCases: newCases,
      children: newChildren,
    };
  });
}

/**
 * Pure immutable helper to append a newly created test case to its target suite node.
 */
export function addCaseToTreeNodes(nodes: SuiteTreeNode[], newCase: TestCase): SuiteTreeNode[] {
  return nodes.map((node) => {
    if (node.id === newCase.suiteId) {
      return {
        ...node,
        testCases: [...(node.testCases || []), newCase],
      };
    }
    if (node.children && node.children.length > 0) {
      return {
        ...node,
        children: addCaseToTreeNodes(node.children, newCase),
      };
    }
    return node;
  });
}

/**
 * Pure immutable helper to remove a deleted test case from the tree.
 */
export function removeCaseFromTreeNodes(nodes: SuiteTreeNode[], caseId: string): SuiteTreeNode[] {
  return nodes.map((node) => {
    const newCases = (node.testCases || []).filter((tc) => tc.id !== caseId);
    const newChildren = node.children && node.children.length > 0
      ? removeCaseFromTreeNodes(node.children, caseId)
      : node.children;

    return {
      ...node,
      testCases: newCases,
      children: newChildren,
    };
  });
}
