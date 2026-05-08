import pc from 'picocolors'

export const log = {
  info: (msg: string): void => console.log(pc.cyan('ℹ'), msg),
  success: (msg: string): void => console.log(pc.green('✓'), msg),
  warn: (msg: string): void => console.warn(pc.yellow('⚠'), msg),
  error: (msg: string): void => console.error(pc.red('✗'), msg),
  hint: (msg: string): void => console.log(pc.dim(`  → ${msg}`))
}
