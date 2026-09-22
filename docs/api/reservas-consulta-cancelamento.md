# Consulta e cancelamento de reservas

As duas rotas exigem o header `Authorization: Bearer <token>`.

## GET /reservas

Lista reservas em ordem de data e hora.

- `CLIENTE`: recebe somente as próprias reservas, incluindo futuras e passadas (histórico).
- `ADM`: recebe todas as reservas e pode usar os filtros opcionais `sala_id` e `data`.

Exemplo para administrador:

```http
GET /reservas?sala_id=2&data=2026-10-15
Authorization: Bearer <token>
```

Resposta `200`:

```json
[
  {
    "id": 7,
    "usuario_id": 3,
    "sala_id": 2,
    "data": "2026-10-15",
    "hora": 9,
    "valor": 80,
    "sala_nome": "Sala de Reuniões",
    "usuario_nome": "Ana"
  }
]
```

Erros possíveis: `400` para filtro inválido e `401` para autenticação inválida.

## DELETE /reservas/:id

Cancela uma reserva futura. O cliente só pode cancelar a própria reserva; um administrador pode cancelar qualquer reserva. Reservas passadas permanecem no histórico.

Exemplo:

```http
DELETE /reservas/7
Authorization: Bearer <token>
```

Resposta de sucesso: `204 No Content`.

Erros possíveis:

- `400`: ID inválido ou reserva já iniciada/passada.
- `401`: autenticação inválida.
- `403`: cliente tentando cancelar reserva de outro usuário.
- `404`: reserva inexistente.
