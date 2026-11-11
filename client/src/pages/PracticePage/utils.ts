import katex from 'katex';
import 'katex/dist/katex.min.css';

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

/**
 * 将文本中的 $...$（行内公式）和 $$...$$（块级公式）
 * 替换为 KaTeX 渲染后的 HTML，非公式部分做 HTML 转义防止 XSS。
 */
export function renderMath(text: string): string {
  if (!text) return '';

  const segments: string[] = [];
  let lastIndex = 0;
  // 先匹配块级 $$...$$，再匹配行内 $...$
  const regex = /\$\$([\s\S]*?)\$\$|\$([^\n$]+?)\$/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(text)) !== null) {
    // 转义公式之前的普通文本
    if (m.index > lastIndex) {
      segments.push(escapeHtml(text.slice(lastIndex, m.index)));
    }

    const isBlock = m[1] !== undefined;
    const formula = isBlock ? m[1].trim() : m[2].trim();

    try {
      segments.push(
        katex.renderToString(formula, {
          displayMode: isBlock,
          throwOnError: false,
          output: 'html',
        }),
      );
    } catch {
      segments.push(
        `<span class="text-destructive">公式渲染失败: ${escapeHtml(formula)}</span>`,
      );
    }

    lastIndex = m.index + m[0].length;
  }

  // 转义最后一段普通文本
  if (lastIndex < text.length) {
    segments.push(escapeHtml(text.slice(lastIndex)));
  }

  return segments.join('');
}
