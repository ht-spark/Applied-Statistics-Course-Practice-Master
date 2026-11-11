/**
 * 飞书 h5-js-sdk 全局样式降层。
 *
 * 问题：SDK 加载时用 style-loader 往 <head> 插入约 200 段 CSS，其中混着几条
 * 不带类名的全局重置，例如 `body{color;background-color;font-family}`、
 * `input,button,select,optgroup,textarea{color:inherit}`。这些规则不在任何
 * cascade layer 里，按层叠规则会压过应用放在 `@layer base` / `@layer utilities`
 * 里的全部样式（与选择器权重无关）。表现为：打开过一次名片后，
 * `bg-primary text-primary-foreground` 的按钮变成蓝底黑字，body 的字体、
 * 颜色、背景也被改掉，直到刷新页面都不会恢复。
 *
 * 做法：只把「所有选择器都不含类名 / id」的规则挪进 `@layer base.lark-sdk`，
 * 让应用自己的 base 层和工具类都能覆盖它们；带类名的名片内部样式原样保留，
 * 名片外观不受影响。
 *
 * ⚠️ 依据 h5-js-sdk 1.2.21 的实现（加载时同步注入）。升级 SDK 后需要重新确认
 * 新版是否还有其他全局规则、注入时机是否变化。
 */

const SDK_STYLE_LAYER = 'base.lark-sdk';

/** 选择器列表里没有任何一项带类名或 id，即作用于整页的元素级规则 */
function isElementLevelSelector(selectorText: string): boolean {
  return selectorText.split(',').every((selector) => !/[.#]/.test(selector));
}

/** 把一个 <style> 里的元素级全局规则挪进低优先级的 cascade layer */
export function demoteGlobalStyleRules(style: HTMLStyleElement): void {
  // emotion 运行时样式都是哈希类名，Vite 开发态样式属于应用自身，都不处理
  if (
    style.hasAttribute('data-emotion') ||
    style.hasAttribute('data-vite-dev-id')
  ) {
    return;
  }

  const sheet = style.sheet;
  if (!sheet) return;

  const moved: string[] = [];
  for (let i = sheet.cssRules.length - 1; i >= 0; i -= 1) {
    const rule = sheet.cssRules[i];
    if (
      rule instanceof CSSStyleRule &&
      isElementLevelSelector(rule.selectorText)
    ) {
      moved.unshift(rule.cssText);
      sheet.deleteRule(i);
    }
  }

  if (moved.length > 0) {
    sheet.insertRule(`@layer ${SDK_STYLE_LAYER} {\n${moved.join('\n')}\n}`, 0);
  }
}
