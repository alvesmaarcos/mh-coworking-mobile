import type { Filters, Reservation, Room, Session, User } from '../domain/models';

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly unauthorized: (token: string) => void = () => {},
    private readonly transport: typeof fetch = (input, init) => fetch(input, init),
  ) {}

  private async request<T>(path: string, options: { token?: string; method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    if (options.signal?.aborted) abort();
    const timer = setTimeout(abort, 15000);
    try {
      const response = await this.transport(`${this.baseUrl.replace(/\/$/, '')}${path}`, {
        method: options.method ?? 'GET',
        headers: {
          Accept: 'application/json',
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: controller.signal,
      });
      if (response.status === 401 && options.token) this.unauthorized(options.token);
      if (response.status === 204) return undefined as T;
      const data = await response.json();
      if (!response.ok) throw new ApiError(data.erro || 'Não foi possível concluir a solicitação.', response.status);
      return data as T;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (options.signal?.aborted) throw error;
      throw new ApiError('Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.', 0);
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener('abort', abort);
    }
  }

  register(nome: string, email: string, senha: string) { return this.request<User>('/usuarios', { method: 'POST', body: { nome, email, senha } }); }
  login(email: string, senha: string) { return this.request<Session>('/login', { method: 'POST', body: { email, senha } }); }
  currentUser(session: Session) { return this.request<User>(`/usuarios/${session.usuario.id}`, { token: session.token }); }
  rooms(signal?: AbortSignal) { return this.request<Room[]>('/salas', { signal }); }
  reservations(token: string, filters: Filters = {}, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (filters.roomId !== undefined) query.set('sala_id', String(filters.roomId));
    if (filters.date) query.set('data', filters.date);
    return this.request<Reservation[]>(`/reservas${query.size ? `?${query}` : ''}`, { token, signal });
  }
  cancel(token: string, id: number) { return this.request<void>(`/reservas/${id}`, { token, method: 'DELETE' }); }
}
