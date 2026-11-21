import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email = 'admin@montehorebe.com', password = 'admin123') {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
}
const cancelButtons = (page: Page) => page.getByRole('button', { name: /^Cancelar reserva de/ });

test.beforeEach(async ({ page, request }) => {
  await request.post('http://127.0.0.1:4199/__test/reset');
  await page.clock.setFixedTime(new Date('2030-01-01T15:00:00Z'));
});

test('abas seguem as referências e sessão é restaurada após recarregar', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await login(page);
  await expect(cancelButtons(page)).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('reservas-proximas.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  await expect(page.getByText('Concluída', { exact: true })).toHaveCount(2);
  await expect(page.getByText('R$ 50', { exact: true })).toBeVisible();
  await expect(cancelButtons(page)).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('reservas-historico.png'), fullPage: true });
  await page.reload();
  await expect(cancelButtons(page)).toHaveCount(3);
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('filtros de sala e data combinam e permanecem ao trocar de aba', async ({ page }) => {
  await login(page);
  await expect(cancelButtons(page)).toHaveCount(3);
  await page.getByRole('button', { name: /Filtrar por sala:/ }).click();
  await page.getByRole('radio', { name: 'Sala Individual', exact: true }).click();
  await page.getByRole('button', { name: /Filtrar por data:/ }).click();
  await page.getByRole('button', { name: '03/01/2030', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(1);
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  await expect(page.getByText('Nenhuma reserva no histórico')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtrar por data: 03/01/2030' })).toBeVisible();
  await page.getByRole('button', { name: /Filtrar por data:/ }).click();
  await page.getByRole('button', { name: 'Todas as datas', exact: true }).click();
  await expect(page.getByText('Concluída', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: /Filtrar por sala:/ }).click();
  await page.getByRole('radio', { name: 'Todas as salas', exact: true }).click();
  await expect(page.getByText('Concluída', { exact: true })).toHaveCount(2);
});

test('cancelamento exige confirmação e só remove após sucesso da API', async ({ page }) => {
  await login(page);
  await expect(cancelButtons(page)).toHaveCount(3);
  await cancelButtons(page).first().click();
  await page.getByRole('button', { name: 'Manter reserva', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(3);
  await cancelButtons(page).first().click();
  let deleteCalls = 0;
  await page.route('**/api/reservas/1', async route => {
    if (route.request().method() === 'DELETE') { deleteCalls++; await new Promise(resolve => setTimeout(resolve, 200)); }
    await route.continue();
  });
  await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(2);
  await expect(page.getByText('Reserva cancelada.', { exact: true })).toBeVisible();
  expect(deleteCalls).toBe(1);
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  await expect(page.getByText('Concluída', { exact: true })).toHaveCount(2);
});

test('falhas de consulta e cancelamento permitem tentar novamente', async ({ page }) => {
  let failList = true;
  await page.route('**/api/reservas', route => failList ? route.fulfill({ status: 503, json: { erro: 'Servidor indisponível' } }) : route.continue());
  await login(page);
  await expect(page.getByText('Servidor indisponível')).toBeVisible();
  failList = false;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(3);
  await page.route('**/api/reservas/1', route => route.fulfill({ status: 500, json: { erro: 'Falha ao cancelar' } }));
  await cancelButtons(page).first().click();
  await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
  await expect(page.getByText('Falha ao cancelar')).toBeVisible();
  await page.unroute('**/api/reservas/1');
  await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(2);
});

test('separa área de CLIENTE e ADM, valida credenciais erradas e expira 401', async ({ page }) => {
  await login(page, 'admin@montehorebe.com', 'wrong');
  await expect(page.getByText('Email ou senha inválidos')).toBeVisible();
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('cliente@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Área do cliente', { exact: true })).toBeVisible();
  await expect(cancelButtons(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Sair da conta' }).click();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await login(page);
  await expect(cancelButtons(page)).toHaveCount(3);
  await page.route('**/api/reservas', route => route.fulfill({ status: 401, json: { erro: 'Token inválido ou expirado' } }));
  await page.reload();
  await expect(page.getByText('Sua sessão expirou. Entre novamente.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
});

test('cadastro cria nova conta e realiza login automático na área do cliente', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('auth-entrar.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Nome completo', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('auth-criar-conta.png'), fullPage: true });
  await page.getByRole('textbox', { name: 'Nome completo', exact: true }).fill('Anna Beatryz');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('anna@example.com');
  await page.getByLabel('Senha', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByText('Área do cliente', { exact: true })).toBeVisible();
  await expect(page.getByText('Olá, Anna Beatryz!', { exact: true })).toBeVisible();
  await expect(cancelButtons(page)).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Olá, Anna Beatryz!', { exact: true })).toBeVisible();
});

test('tela pequena mantém navegação fixa, lista rolável e calendário utilizável', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await login(page);
  await expect(cancelButtons(page)).toHaveCount(3);
  const navigation = page.getByRole('tab', { name: 'Reservas', exact: true });
  const initial = await navigation.boundingBox();
  expect(initial!.y + initial!.height).toBeLessThanOrEqual(568);
  await cancelButtons(page).last().scrollIntoViewIfNeeded();
  const after = await navigation.boundingBox();
  expect(after!.y).toBe(initial!.y);
  await page.getByRole('button', { name: /Filtrar por data:/ }).click();
  await page.getByRole('button', { name: 'Todas as datas', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(3);
  await page.screenshot({ path: testInfo.outputPath('reservas-tela-pequena.png'), fullPage: true });
});

test('reserva removida por outro administrador atualiza a lista sem falso sucesso', async ({ page, request }) => {
  await login(page);
  await expect(cancelButtons(page)).toHaveCount(3);
  await cancelButtons(page).first().click();
  const response = await request.post('http://127.0.0.1:4199/login', { data: { email: 'admin@montehorebe.com', senha: 'admin123' } });
  const { token } = await response.json();
  await request.delete('http://127.0.0.1:4199/reservas/1', { headers: { Authorization: `Bearer ${token}` } });
  await page.getByRole('button', { name: 'Confirmar cancelamento', exact: true }).click();
  await expect(cancelButtons(page)).toHaveCount(2);
  await expect(page.getByText('Reserva não encontrada', { exact: true })).toBeVisible();
  await expect(page.getByText('Reserva cancelada.', { exact: true })).toHaveCount(0);
});
