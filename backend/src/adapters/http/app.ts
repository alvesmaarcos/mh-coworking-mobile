import express, { type ErrorRequestHandler, type Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import DomainError from '../../domain/DomainError.js';
export function createApp(routes: Router, paths: {
    publicDirectory: string;
    swaggerFile: string;
}) {
    const app = express();
    const options = { swaggerOptions: { url: '/swagger.yaml' } };
    app.use(express.json());
    app.use('/public', express.static(paths.publicDirectory));
    app.get('/swagger.yaml', (_req, res) => res.sendFile(paths.swaggerFile));
    app.use('/docs', swaggerUi.serveFiles(undefined, options), swaggerUi.setup(undefined, options));
    app.use(routes);
    const errors: ErrorRequestHandler = (error, _req, res, _next) => {
        const statuses = { validation: 400, unauthorized: 401, forbidden: 403, not_found: 404, conflict: 409 };
        const status = error instanceof DomainError ? statuses[error.kind] : error.status || 500;
        res.status(status).json({ erro: error.message || 'Erro interno do servidor' });
    };
    app.use(errors);
    return app;
}
