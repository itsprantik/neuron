export interface Files {
  html: string
  css: string
  js: string
}

/** Sent from the preview to the page. Only plain text is ever read from it. */
export type LogKind = 'log' | 'info' | 'warn' | 'error'
export const LOG_KINDS: LogKind[] = ['log', 'info', 'warn', 'error']

/**
 * Copies console output and errors to the page. The preview cannot touch the page any other way.
 * Line numbers are left out on purpose: they would count the wrapper, not your file.
 */
const HOOK = `(function(){
var send=function(k,a){try{parent.postMessage({neuron:1,k:k,t:Array.prototype.map.call(a,function(x){
try{var s=typeof x==='string'?x:JSON.stringify(x);return s===undefined?String(x):s}catch(e){return String(x)}}).join(' ').slice(0,300)},'*')}catch(e){}};
['log','info','warn','error'].forEach(function(k){var o=console[k];console[k]=function(){send(k,arguments);if(o)o.apply(console,arguments)}});
addEventListener('error',function(e){send('error',[e.message])});
addEventListener('unhandledrejection',function(e){send('error',['Unhandled: '+e.reason])});
})();`

/**
 * Content-Security-Policy for generated pages: no network at all (fetch, XHR, images, fonts, frames),
 * only inline scripts and styles. NEURON is offline by design, and this keeps previews offline too.
 */
const CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; media-src data: blob:"

/** Stops your text from closing our tag early. */
const safe = (text: string, tag: 'script' | 'style') => text.replace(new RegExp(`</${tag}`, 'gi'), `<\\/${tag}`)

export function buildDoc(f: Files): string {
  return (
    `<!doctype html><html><head><meta charset="utf-8">` +
    `<meta http-equiv="Content-Security-Policy" content="${CSP}">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<script>${HOOK}</script><style>${safe(f.css, 'style')}</style></head>` +
    `<body>${f.html}<script>${safe(f.js, 'script')}</script></body></html>`
  )
}

/** The same page without the console hook, for downloading. */
export function buildDownload(f: Files, title: string): string {
  return (
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width,initial-scale=1"><title>${title.replace(/[<>&"]/g, '')}</title>` +
    `<style>\n${safe(f.css, 'style')}\n</style></head><body>\n${f.html}\n<script>\n${safe(f.js, 'script')}\n</script></body></html>\n`
  )
}