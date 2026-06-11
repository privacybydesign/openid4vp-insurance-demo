import { randomBytes } from "node:crypto"
import { config } from "./config.js"
import type { RegisterSession, LoginSession, SignupSession } from "./types.js"

const registerSessions = new Map<string, RegisterSession>()
const loginSessions = new Map<string, LoginSession>()
const signupSessions = new Map<string, SignupSession>()

function newId(): string {
  return randomBytes(16).toString("hex")
}

export function createRegisterSession(state: RegisterSession["state"]): RegisterSession {
  const s: RegisterSession = { id: newId(), createdAt: Date.now(), state }
  registerSessions.set(s.id, s)
  return s
}

export function getRegisterSession(id: string): RegisterSession | undefined {
  const s = registerSessions.get(id)
  if (!s) return undefined
  if (Date.now() - s.createdAt > config.sessionTtlMs) {
    registerSessions.delete(id)
    return undefined
  }
  return s
}

export function updateRegisterSession(id: string, state: RegisterSession["state"]): void {
  const s = registerSessions.get(id)
  if (!s) throw new Error(`unknown session: ${id}`)
  s.state = state
}

export function createLoginSession(state: LoginSession["state"]): LoginSession {
  const s: LoginSession = { id: newId(), createdAt: Date.now(), state }
  loginSessions.set(s.id, s)
  return s
}

export function getLoginSession(id: string): LoginSession | undefined {
  const s = loginSessions.get(id)
  if (!s) return undefined
  if (Date.now() - s.createdAt > config.sessionTtlMs) {
    loginSessions.delete(id)
    return undefined
  }
  return s
}

export function updateLoginSession(id: string, state: LoginSession["state"]): void {
  const s = loginSessions.get(id)
  if (!s) throw new Error(`unknown session: ${id}`)
  s.state = state
}

export function createSignupSession(state: SignupSession["state"]): SignupSession {
  const s: SignupSession = { id: newId(), createdAt: Date.now(), state }
  signupSessions.set(s.id, s)
  return s
}

export function getSignupSession(id: string): SignupSession | undefined {
  const s = signupSessions.get(id)
  if (!s) return undefined
  if (Date.now() - s.createdAt > config.sessionTtlMs) {
    signupSessions.delete(id)
    return undefined
  }
  return s
}

export function updateSignupSession(id: string, state: SignupSession["state"]): void {
  const s = signupSessions.get(id)
  if (!s) throw new Error(`unknown session: ${id}`)
  s.state = state
}

// Sweep expired sessions every minute
setInterval(() => {
  const cutoff = Date.now() - config.sessionTtlMs
  for (const [id, s] of registerSessions) if (s.createdAt < cutoff) registerSessions.delete(id)
  for (const [id, s] of loginSessions) if (s.createdAt < cutoff) loginSessions.delete(id)
  for (const [id, s] of signupSessions) if (s.createdAt < cutoff) signupSessions.delete(id)
}, 60_000).unref()
