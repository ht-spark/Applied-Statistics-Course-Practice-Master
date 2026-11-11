import { useEffect, useState } from 'react';

export type ExternalScriptStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseExternalScriptOptions {
  removeOnUnmount?: boolean;
  attributes?: Record<string, string>;
  nonce?: string;
  onloadCallback?: () => void;
  /**
   * 脚本加载期间（插入 → onload / onerror）每个新插入 <head> 的 <style>
   * 都会回调一次，用于处理脚本自带的全局样式。
   */
  onStyleInjected?: (style: HTMLStyleElement) => void;
}

/** 监听 <head> 新增的 <style>，返回的函数会先处理完积压的记录再停止监听 */
function watchHeadStyles(
  onStyle: (style: HTMLStyleElement) => void,
): () => void {
  const handle = (records: MutationRecord[]) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node instanceof HTMLStyleElement) onStyle(node);
      });
    });
  };
  const observer = new MutationObserver(handle);
  observer.observe(document.head, { childList: true });
  return () => {
    handle(observer.takeRecords());
    observer.disconnect();
  };
}

/**
 * 在组件生命周期内按需注入外链脚本（追加到 <body> 末尾），并返回加载状态。
 * - 避免重复注入：如果页面已存在同 src 的脚本，直接标记为 ready。
 * - 支持 CSP：可通过 nonce 传入。
 * - 可选清理：removeOnUnmount=true 时卸载时移除脚本。
 */
export function useExternalScript(
  src: string,
  options: UseExternalScriptOptions = {},
): ExternalScriptStatus {
  const [status, setStatus] = useState<ExternalScriptStatus>('idle');

  useEffect(() => {
    if (!src) return;

    // 如果已经存在同 src 的脚本，直接认为已就绪
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );
    if (existing) {
      queueMicrotask(() => {
        setStatus('ready');
      });
      return;
    }
    // 在 effect 中避免同步 setState，使用微任务调度，防止级联渲染警告
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setStatus('loading');
    });
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    if (options.nonce) script.nonce = options.nonce;
    Object.entries(options.attributes ?? {}).forEach(([k, v]) => {
      script.setAttribute(k, v);
    });

    // 组件提前卸载时脚本仍会继续加载并注入样式，所以只在 onload / onerror 停止监听
    const stopWatchingStyles = options.onStyleInjected
      ? watchHeadStyles(options.onStyleInjected)
      : undefined;

    script.onload = () => {
      stopWatchingStyles?.();
      if (!cancelled) setStatus('ready');
      if (options.onloadCallback) {
        options.onloadCallback();
      }
    };

    script.onerror = () => {
      stopWatchingStyles?.();
      if (!cancelled) setStatus('error');
    };

    document.body.append(script);
    return () => {
      cancelled = true;
      if (options.removeOnUnmount) {
        script.remove();
      }
    };
  }, [options, src]);

  return status;
}
