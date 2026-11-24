import type { AvailableHour, CreatedReservation, Filters, Reservation, ReservationInput, Room, RoomInput, Session, UpdateUserInput, User } from '../domain/models';

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
  requestPasswordReset(email: string) { return this.request<void>('/senha/esqueci', { method: 'POST', body: { email } }); }
  resetPassword(email: string, codigo: string, senha: string) { return this.request<void>('/senha/redefinir', { method: 'POST', body: { email, codigo, senha } }); }
  currentUser(session: Session, signal?: AbortSignal) { return this.request<User>(`/usuarios/${session.usuario.id}`, { token: session.token, signal }); }
  updateUser(token: string, id: number, data: UpdateUserInput) { return this.request<User>(`/usuarios/${id}`, { token, method: 'PUT', body: data }); }
  deleteUser(token: string, id: number) { return this.request<void>(`/usuarios/${id}`, { token, method: 'DELETE' }); }
  rooms(signal?: AbortSignal) { return this.request<Room[]>('/salas', { signal }); }
  room(id: number, signal?: AbortSignal) { return this.request<Room>(`/salas/${id}`, { signal }); }
  createRoom(token: string, room: RoomInput) { return this.request<Room>('/salas', { token, method: 'POST', body: room }); }
  updateRoom(token: string, id: number, room: RoomInput) { return this.request<Room>(`/salas/${id}`, { token, method: 'PUT', body: room }); }
  availableHours(roomId: number, date: string, signal?: AbortSignal) {
    const query = new URLSearchParams({ data: date });
    return this.request<AvailableHour[]>(`/salas/${roomId}/horarios?${query}`, { signal });
  }
  createReservation(token: string, reservation: ReservationInput) {
    return this.request<CreatedReservation>('/reservas', { token, method: 'POST', body: reservation });
  }
  assetUrl(path: string | null | undefined) {
    if (!path) return null;
    if (/^https?:\/\//i.test(path)) return path;
    const assetPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = this.baseUrl.replace(/\/+$/, '');
    return baseUrl.startsWith('/') ? `${baseUrl}${assetPath}` : `${new URL(baseUrl).origin}${assetPath}`;
  }
  reservations(token: string, filters: Filters = {}, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (filters.roomId !== undefined) query.set('sala_id', String(filters.roomId));
    if (filters.date) query.set('data', filters.date);
    return this.request<Reservation[]>(`/reservas${query.size ? `?${query}` : ''}`, { token, signal });
  }
  cancel(token: string, id: number) { return this.request<void>(`/reservas/${id}`, { token, method: 'DELETE' }); }
}
