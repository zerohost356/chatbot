export interface Token {
  text: string;
  type: string;
}

interface Rule {
  type: string;
  re: RegExp;
}

function r(type: string, source: string, flags = ""): Rule {
  return { type, re: new RegExp(source, `y${flags}`) };
}

const JS_KEYWORDS =
  "abstract|any|as|asserts|async|await|boolean|break|case|catch|class|const|constructor|continue|debugger|declare|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|global|if|implements|import|in|infer|instanceof|interface|is|keyof|let|module|namespace|never|new|null|number|object|of|package|private|protected|public|readonly|require|return|satisfies|set|static|string|super|switch|symbol|this|throw|true|try|type|typeof|undefined|unique|unknown|var|void|while|with|yield";

const JS_BUILTINS =
  "Array|Boolean|Date|Error|JSON|Map|Math|Number|Object|Promise|Proxy|Reflect|RegExp|Set|String|Symbol|WeakMap|WeakSet|console|document|globalThis|window|process|fetch|setTimeout|clearTimeout|setInterval|clearInterval|parseInt|parseFloat|isNaN|structuredClone";

const PYTHON_KEYWORDS =
  "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield";

const PYTHON_BUILTINS =
  "abs|all|any|bool|bytes|callable|chr|classmethod|dict|dir|divmod|enumerate|eval|filter|float|format|frozenset|getattr|globals|hasattr|hash|help|hex|id|input|int|isinstance|issubclass|iter|len|list|locals|map|max|memoryview|min|next|object|oct|open|ord|pow|print|property|range|repr|reversed|round|set|setattr|slice|sorted|staticmethod|str|sum|super|tuple|type|vars|zip";

const SQL_KEYWORDS =
  "add|all|alter|and|any|as|asc|between|by|case|cast|check|column|constraint|create|cross|current_date|current_time|current_timestamp|database|default|delete|desc|distinct|drop|else|end|except|exists|false|foreign|from|full|group|having|if|in|index|inner|insert|intersect|into|is|join|key|left|like|limit|not|null|offset|on|or|order|outer|primary|references|returning|right|select|set|table|then|true|union|unique|update|using|values|view|when|where|with";

const SQL_TYPES =
  "bigint|binary|bit|blob|boolean|char|date|datetime|decimal|double|enum|float|int|integer|interval|json|jsonb|longtext|numeric|real|serial|smallint|text|time|timestamp|tinyint|uuid|varchar";

const BASH_KEYWORDS =
  "case|coproc|do|done|elif|else|esac|fi|for|function|if|in|select|then|time|until|while";

const BASH_BUILTINS =
  "alias|bg|bind|break|builtin|caller|cd|command|compgen|complete|continue|declare|dirs|disown|echo|enable|eval|exec|exit|export|false|fc|fg|getopts|hash|help|history|jobs|kill|let|local|logout|mapfile|popd|printf|pushd|pwd|read|readarray|return|set|shift|shopt|source|suspend|test|times|trap|true|type|typeset|ulimit|umask|unalias|unset|wait";

const GENERIC_KEYWORDS =
  "abstract|and|as|async|await|break|case|catch|class|const|continue|def|default|delete|do|else|enum|export|extends|false|finally|for|from|function|if|implements|import|in|instanceof|interface|let|new|null|of|or|package|private|protected|public|return|static|struct|super|switch|this|throw|true|try|type|typeof|var|void|while|with|yield";

function jsRules(): Rule[] {
  return [
    r("comment", "//[^\\n]*"),
    r("comment", "/\\*[\\s\\S]*?(?:\\*/|$)"),
    r("string", "`(?:\\\\.|[^`\\\\])*(?:`|$)"),
    r("string", '"(?:\\\\.|[^"\\\\\\n])*"?'),
    r("string", "'(?:\\\\.|[^'\\\\\\n])*'?"),
    r("regex", "\\/(?![*/])(?:\\\\.|[^/\\\\\\n])+\\/[dgimsuvy]*"),
    r("number", "\\b(?:0[xX][\\da-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\\d[\\d_]*(?:\\.\\d+)?(?:[eE][+-]?\\d+)?n?)\\b"),
    r("decorator", "@[A-Za-z_$][\\w$]*"),
    r("boolean", "\\b(?:true|false|undefined|null|NaN|Infinity)\\b"),
    r("keyword", `\\b(?:${JS_KEYWORDS})\\b`),
    r("builtin", `\\b(?:${JS_BUILTINS})\\b`),
    r("property", "(?<=\\.)[A-Za-z_$][\\w$]*"),
    r("function", "[A-Za-z_$][\\w$]*(?=\\s*\\()"),
    r("class", "\\b[A-Z][A-Za-z0-9_$]*\\b"),
    r("operator", "=>|===|!==|==|!=|<=|>=|&&|\\|\\||\\?\\?|\\?\\.|[+\\-*/%=<>!&|^~?:]+"),
    r("punctuation", "[{}()\\[\\];,.]"),
  ];
}

function pythonRules(): Rule[] {
  return [
    r("comment", "#[^\\n]*"),
    r("string", "(?:[rbufRBU]{0,2})(?:\"\"\"[\\s\\S]*?(?:\"\"\"|$)|'''[\\s\\S]*?(?:'''|$))"),
    r("string", "(?:[rbufRBU]{0,2})\"(?:\\\\.|[^\"\\\\\\n])*\"?"),
    r("string", "(?:[rbufRBU]{0,2})'(?:\\\\.|[^'\\\\\\n])*'?"),
    r("decorator", "@[A-Za-z_][\\w.]*"),
    r("boolean", "\\b(?:True|False|None)\\b"),
    r("keyword", `\\b(?:${PYTHON_KEYWORDS})\\b`),
    r("builtin", `\\b(?:${PYTHON_BUILTINS})\\b`),
    r("builtin", "\\b(?:self|cls)\\b"),
    r("function", "[A-Za-z_][\\w]*(?=\\s*\\()"),
    r("class", "\\b[A-Z][A-Za-z0-9_]*\\b"),
    r("number", "\\b(?:0[xX][\\da-fA-F]+|0[bB][01]+|0[oO][0-7]+|\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?j?)\\b"),
    r("operator", "\\*\\*|//|:=|==|!=|<=|>=|[-+*/%@&|^~<>]=?"),
    r("punctuation", "[{}()\\[\\];,.:]"),
  ];
}

function bashRules(): Rule[] {
  return [
    r("meta", "^#!.*"),
    r("comment", "#[^\\n]*"),
    r("string", '"(?:\\\\.|\\$(?:\\([^)]*\\)|\\{[^}]*\\}|[\\w@#?*!$-])|[^"\\\\])*"?'),
    r("string", "'[^']*'?"),
    r("string", "`(?:\\\\.|[^`\\\\])*`?"),
    r("variable", "\\$\\{[^}]*\\}|\\$\\([^)]*\\)|\\$[A-Za-z_][\\w]*|\\$[0-9@#?*!$-]"),
    r("keyword", `\\b(?:${BASH_KEYWORDS})\\b`),
    r("builtin", `\\b(?:${BASH_BUILTINS})\\b`),
    r("attr", "--?[A-Za-z][\\w-]*"),
    r("number", "\\b\\d+\\b"),
    r("operator", "&&|\\|\\||>>|<<|[|&;<>!=]"),
    r("punctuation", "[{}()\\[\\]]"),
  ];
}

function jsonRules(): Rule[] {
  return [
    r("key", '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)'),
    r("string", '"(?:\\\\.|[^"\\\\])*"?'),
    r("number", "-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b"),
    r("boolean", "\\b(?:true|false|null)\\b"),
    r("punctuation", "[{}\\[\\],:]"),
  ];
}

function sqlRules(): Rule[] {
  return [
    r("comment", "--[^\\n]*|#[^\\n]*"),
    r("comment", "/\\*[\\s\\S]*?(?:\\*/|$)"),
    r("string", "'(?:''|[^'])*(?:'|$)"),
    r("string", '"(?:\"\"|[^"])*"'),
    r("keyword", `\\b(?:${SQL_KEYWORDS})\\b`, "i"),
    r("type", `\\b(?:${SQL_TYPES})\\b`, "i"),
    r("function", "\\b[A-Za-z_][\\w]*(?=\\s*\\()"),
    r("number", "\\b\\d+(?:\\.\\d+)?\\b"),
    r("operator", "::|<>|!=|<=|>=|[-+*/%=<>]"),
    r("punctuation", "[{}()\\[\\];,.]"),
  ];
}

function htmlRules(): Rule[] {
  return [
    r("comment", "<!--[\\s\\S]*?(?:-->|$)"),
    r("meta", "<!DOCTYPE[^>]*>", "i"),
    r("tag", "</?[A-Za-z][\\w:-]*"),
    r("attr", "\\s+[A-Za-z_:][\\w:.-]*(?=\\s*=)"),
    r("string", '"[^"]*"?|\'[^\']*\'?'),
    r("attr", "(?<=\\s)[A-Za-z_:][\\w:.-]*(?=[\\s/>])"),
    r("punctuation", "/?>"),
    r("punctuation", "="),
    r("meta", "&[A-Za-z#][\\w#]*;"),
  ];
}

function cssRules(): Rule[] {
  return [
    r("comment", "/\\*[\\s\\S]*?(?:\\*/|$)"),
    r("keyword", "@[\\w-]+"),
    r("important", "!important\\b", "i"),
    r("string", '"[^"\\n]*"?|\'[^\'\\n]*\'?'),
    r("variable", "--[\\w-]+"),
    r("color", "#[0-9a-fA-F]{3,8}\\b"),
    r("number", "\\b\\d*\\.?\\d+(?:px|rem|em|%|vh|vw|vmin|vmax|s|ms|deg|fr|ch|ex|pt|cm|mm|turn)?\\b"),
    r("property", "[a-zA-Z-]+(?=\\s*:)"),
    r("selector", "::?[a-zA-Z-]+|[.#][\\w-]+|\\[[^\\]]*\\]"),
    r("keyword", "\\b(?:inherit|initial|unset|revert|none|auto|block|inline|flex|grid|absolute|relative|fixed|sticky|hidden|visible|solid|dashed|transparent|center|left|right|top|bottom|bold|normal)\\b"),
    r("punctuation", "[{}();,>+~*]"),
  ];
}

function yamlRules(): Rule[] {
  return [
    r("comment", "#[^\\n]*"),
    r("meta", "^(?:---|\\.\\.\\.)\\s*$", "m"),
    r("key", "^(?:[ \\t]*-[ \\t]+)?[A-Za-z_\"'][^:\\n]*(?=\\s*:(?:\\s|$))", "m"),
    r("punctuation", "^-\\s", "m"),
    r("string", '"(?:\\\\.|[^"\\\\])*"?|\'[^\']*\'?'),
    r("boolean", "\\b(?:true|false|yes|no|on|off|null|Null|NULL|~)\\b"),
    r("variable", "[&*][\\w.-]+"),
    r("meta", "!![\\w/:.-]+"),
    r("number", "\\b\\d{4}-\\d{2}-\\d{2}(?:[T ][\\d:.]+(?:Z|[+-]\\d{2}:?\\d{2})?)?\\b|\\b\\d+(?:\\.\\d+)?\\b"),
    r("punctuation", "[\\[\\]{},:]"),
  ];
}

function markdownRules(): Rule[] {
  return [
    r("meta", "^#{1,6}[ \\t].*$", "m"),
    r("keyword", "^```[^\\n]*|^~~~[^\\n]*", "m"),
    r("comment", "^>[ \\t].*$", "m"),
    r("string", "`[^`\\n]*`"),
    r("selector", "\\*\\*[^*\\n]+\\*\\*|__[^_\\n]+__"),
    r("variable", "\\[[^\\]]*\\]\\([^)]*\\)"),
    r("punctuation", "^[-*+]\\s|^\\d+[.)]\\s|[#>*_~`|]", "m"),
  ];
}

function diffRules(): Rule[] {
  return [
    r("meta", "^@@.*$", "m"),
    r("added", "^\\+.*$", "m"),
    r("removed", "^-.*$", "m"),
    r("comment", "^\\\\.*$", "m"),
  ];
}

function genericRules(): Rule[] {
  return [
    r("comment", "//[^\\n]*|#[^\\n]*|/\\*[\\s\\S]*?(?:\\*/|$)"),
    r("string", '"(?:\\\\.|[^"\\\\\\n])*"?|\'(?:\\\\.|[^\'\\\\\\n])*\'?'),
    r("number", "\\b\\d+(?:\\.\\d+)?\\b"),
    r("boolean", "\\b(?:true|false|null|nil)\\b"),
    r("keyword", `\\b(?:${GENERIC_KEYWORDS})\\b`),
    r("function", "[A-Za-z_][\\w]*(?=\\s*\\()"),
    r("operator", "[-+*/%=<>!&|^~?:]+"),
    r("punctuation", "[{}()\\[\\];,.]"),
  ];
}

function plainRules(): Rule[] {
  return [];
}

const ALIASES: Record<string, string> = {
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  node: "javascript",
  ts: "typescript",
  tsx: "typescript",
  typescript: "typescript",
  javascript: "javascript",
  py: "python",
  python: "python",
  sh: "bash",
  shell: "bash",
  zsh: "bash",
  fish: "bash",
  console: "bash",
  terminal: "bash",
  bash: "bash",
  json: "json",
  jsonc: "json",
  json5: "json",
  sql: "sql",
  mysql: "sql",
  postgres: "sql",
  postgresql: "sql",
  sqlite: "sql",
  html: "html",
  htm: "html",
  xml: "html",
  svg: "html",
  vue: "html",
  css: "css",
  scss: "css",
  sass: "css",
  less: "css",
  yml: "yaml",
  yaml: "yaml",
  md: "markdown",
  markdown: "markdown",
  mdx: "markdown",
  diff: "diff",
  patch: "diff",
  text: "plain",
  plaintext: "plain",
  txt: "plain",
  plain: "plain",
};

const RULE_FACTORIES: Record<string, () => Rule[]> = {
  javascript: jsRules,
  typescript: jsRules,
  python: pythonRules,
  bash: bashRules,
  json: jsonRules,
  sql: sqlRules,
  html: htmlRules,
  css: cssRules,
  yaml: yamlRules,
  markdown: markdownRules,
  diff: diffRules,
  generic: genericRules,
  plain: plainRules,
};

const LABELS: Record<string, string> = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  bash: "Bash",
  json: "JSON",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  yaml: "YAML",
  markdown: "Markdown",
  diff: "Diff",
  generic: "Code",
  plain: "Text",
};

export function normalizeLanguage(lang: string | null | undefined): string {
  if (!lang) return "plain";
  const clean = lang.toLowerCase().replace(/^language-/, "").replace(/[{}.\s]/g, "");
  return ALIASES[clean] ?? (RULE_FACTORIES[clean] ? clean : "generic");
}

export function languageLabel(lang: string | null | undefined): string {
  if (!lang) return "Text";
  const normalized = normalizeLanguage(lang);
  if (LABELS[normalized]) return LABELS[normalized];
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

export function highlight(code: string, lang: string | null | undefined): Token[] {
  const normalized = normalizeLanguage(lang);
  const rules = (RULE_FACTORIES[normalized] ?? genericRules)();
  if (!rules.length) return code ? [{ text: code, type: "plain" }] : [];
  const tokens: Token[] = [];
  let i = 0;

  const push = (text: string, type: string) => {
    if (!text) return;
    const last = tokens[tokens.length - 1];
    if (last && last.type === type) {
      last.text += text;
    } else {
      tokens.push({ text, type });
    }
  };

  while (i < code.length) {
    let matched = false;
    for (const rule of rules) {
      rule.re.lastIndex = i;
      const match = rule.re.exec(code);
      if (match && match.index === i && match[0].length > 0) {
        push(match[0], rule.type);
        i += match[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      let end = i + 1;
      const nextSpecial = /[A-Za-z0-9_$"'`/#<@!&*\-+=[\]{}()<>~:;,.%^|?\\\n]/g;
      nextSpecial.lastIndex = i + 1;
      const found = nextSpecial.exec(code);
      if (found) end = found.index;
      else end = code.length;
      push(code.slice(i, end), "plain");
      i = end;
    }
  }
  return tokens;
}

export function splitTokensByLine(tokens: Token[]): Token[][] {
  const lines: Token[][] = [[]];
  for (const token of tokens) {
    const parts = token.text.split("\n");
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part) lines[lines.length - 1].push({ text: part, type: token.type });
    });
  }
  return lines;
}
