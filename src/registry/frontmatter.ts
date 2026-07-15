export interface ParsedMarkdown {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseMarkdownWithFrontmatter(content: string): ParsedMarkdown {
  const normalized = content.replace(/\r\n/g, '\n');

  if (!normalized.startsWith('---\n')) {
    throw new Error('Markdown file must start with YAML frontmatter delimiter.');
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);

  if (closingIndex === -1) {
    throw new Error('Markdown file must contain closing YAML frontmatter delimiter.');
  }

  const yaml = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5).trim();

  return {
    frontmatter: parseYamlSubset(yaml),
    body,
  };
}

function parseYamlSubset(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split('\n');
  let currentObjectKey: string | null = null;

  for (const rawLine of lines) {
    const withoutComment = stripComment(rawLine);

    if (withoutComment.trim() === '') {
      continue;
    }

    const indent = countLeadingSpaces(withoutComment);
    const line = withoutComment.trim();
    const separatorIndex = line.indexOf(':');

    if (separatorIndex === -1) {
      throw new Error(`Unsupported YAML line: ${rawLine}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const valueText = line.slice(separatorIndex + 1).trim();

    if (!key) {
      throw new Error(`YAML key is empty: ${rawLine}`);
    }

    if (indent === 0) {
      if (valueText === '') {
        result[key] = {};
        currentObjectKey = key;
      } else {
        result[key] = parseYamlScalar(valueText);
        currentObjectKey = null;
      }

      continue;
    }

    if (indent > 0 && currentObjectKey) {
      const currentObject = result[currentObjectKey];

      if (!isRecord(currentObject)) {
        throw new Error(`YAML parent is not an object: ${currentObjectKey}`);
      }

      currentObject[key] = parseYamlScalar(valueText);
      continue;
    }

    throw new Error(`Nested YAML value has no parent object: ${rawLine}`);
  }

  return result;
}

function parseYamlScalar(valueText: string): unknown {
  if (valueText === '[]') {
    return [];
  }

  if (valueText.startsWith('[') && valueText.endsWith(']')) {
    const inner = valueText.slice(1, -1).trim();

    if (inner === '') {
      return [];
    }

    return splitInlineArray(inner).map((item) => parseYamlScalar(item.trim()));
  }

  if (
    (valueText.startsWith('"') && valueText.endsWith('"')) ||
    (valueText.startsWith("'") && valueText.endsWith("'"))
  ) {
    return valueText.slice(1, -1);
  }

  if (valueText === 'true') {
    return true;
  }

  if (valueText === 'false') {
    return false;
  }

  if (/^-?\d+(\.\d+)?$/.test(valueText)) {
    return Number(valueText);
  }

  return valueText;
}

function splitInlineArray(value: string): string[] {
  const items: string[] = [];
  let current = '';
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];

    if ((char === '"' || char === "'") && quote === null) {
      quote = char;
      current += char;
      continue;
    }

    if (char === quote) {
      quote = null;
      current += char;
      continue;
    }

    if (char === ',' && quote === null) {
      items.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim() !== '') {
    items.push(current);
  }

  return items;
}

function stripComment(line: string): string {
  let quote: '"' | "'" | null = null;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if ((char === '"' || char === "'") && quote === null) {
      quote = char;
      continue;
    }

    if (char === quote) {
      quote = null;
      continue;
    }

    if (char === '#' && quote === null) {
      return line.slice(0, index);
    }
  }

  return line;
}

function countLeadingSpaces(value: string): number {
  const match = value.match(/^ */);
  return match ? match[0].length : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
