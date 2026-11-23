import type { Session, User } from '../domain/models';

export interface SessionStorage {
  read(): Promise<string | null>;
  write(value: string): Promise<void>;
  clear(): Promise<void>;
}
export interface AuthApi { login(email: string, password: string): Promise<Session> }
export interface RegisterApi extends AuthApi { register(name: string, email: string, password: string): Promise<User> }
export interface AuthSnapshot { session: Session | null; restoring: boolean; notice: string }

export class RegistrationLoginError extends Error {
  constructor(message = 'Conta criada com sucesso, mas não foi possível entrar automaticamente. Faça login para continuar.') {
    super(message);
    this.name = 'RegistrationLoginError';
  }
}

function isValidRole(tipo: unknown): tipo is User['tipo'] {
  return tipo === 'ADM' || tipo === 'CLIENTE';
}

export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as Session;
    if (typeof session.token !== 'string' || !session.token || !isValidRole(session.usuario?.tipo) ||
      !Number.isInteger(session.usuario.id) || typeof session.usuario.nome !== 'string' || typeof session.usuario.email !== 'string') return null;
    return session;
  } catch { return null; }
}

export class SessionStore {
  private snapshot: AuthSnapshot = { session: null, restoring: true, notice: '' };
  private listeners = new Set<() => void>();
  private generation = 0;
  private storageQueue: Promise<void> = Promise.resolve();
  constructor(private readonly storage: SessionStorage) {}
  getSnapshot = () => this.snapshot;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private update(value: AuthSnapshot) { this.snapshot = value; this.listeners.forEach(listener => listener()); }
  private persist(action: () => Promise<void>): Promise<void> {
    this.storageQueue = this.storageQueue.catch(() => {}).then(action);
    return this.storageQueue;
  }
  private async applySession(generation: number, session: Session) {
    if (generation !== this.generation) return;
    if (!isValidRole(session.usuario?.tipo)) throw new Error('Perfil de usuário inválido.');
    await this.persist(() => this.storage.write(JSON.stringify(session)));
    if (generation === this.generation) this.update({ session, restoring: false, notice: '' });
  }
  async restore() {
    const generation = ++this.generation;
    let session: Session | null = null;
    let notice = '';
    try {
      const raw = await this.storage.read();
      session = parseSession(raw);
      if (raw && !session) await this.persist(() => this.storage.clear());
    } catch { notice = 'Não foi possível restaurar sua sessão. Entre novamente.'; }
    if (generation === this.generation) this.update({ session, restoring: false, notice });
  }
  async login(api: AuthApi, email: string, password: string) {
    const generation = ++this.generation;
    const session = await api.login(email.trim(), password);
    await this.applySession(generation, session);
  }
  async register(api: RegisterApi, name: string, email: string, password: string) {
    const generation = ++this.generation;
    const cleanEmail = email.trim();
    await api.register(name.trim(), cleanEmail, password);
    if (generation !== this.generation) return;
    let session: Session;
    try {
      session = await api.login(cleanEmail, password);
    } catch {
      throw new RegistrationLoginError();
    }
    await this.applySession(generation, session);
  }
  async updateUser(user: User) {
    const current = this.snapshot.session;
    if (!current || current.usuario.id !== user.id) return;
    const generation = this.generation;
    await this.applySession(generation, { ...current, usuario: user });
  }
  async logout(notice = '') {
    ++this.generation;
    this.update({ session: null, restoring: false, notice });
    try { await this.persist(() => this.storage.clear()); }
    catch { this.update({ ...this.snapshot, notice: 'Sessão encerrada. Não foi possível limpar o armazenamento do dispositivo.' }); }
  }
  expire(token: string) {
    if (this.snapshot.session?.token === token) void this.logout('Sua sessão expirou. Entre novamente.');
  }
}
