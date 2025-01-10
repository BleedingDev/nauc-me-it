import { Config, Redacted } from 'effect'

export const redactedUrl = (name: string): Config.Config<Redacted.Redacted<URL>> =>
  Config.url(name).pipe(Config.map(Redacted.make))
export const redactedString = (name: string): Config.Config<Redacted.Redacted<string>> =>
  Config.string(name).pipe(Config.map(Redacted.make))
