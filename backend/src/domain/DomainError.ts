export type ErrorKind = 'validation' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict';
export default class DomainError extends Error {
    constructor(message: string, public readonly kind: ErrorKind = 'validation') { super(message); }
}
