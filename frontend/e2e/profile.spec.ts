import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4199/__test/reset');
});

test('perfil do administrador exibe cargo Administrador, sem placeholders, permite editar e sair', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('admin@montehorebe.com');
  await page.getByLabel('Senha', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();

  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible();
  await expect(page.getByText('Administrador', { exact: true }).first()).toBeVisible();

  const nameInput = page.getByRole('textbox', { name: 'Nome completo', exact: true });
  const emailInput = page.getByRole('textbox', { name: 'E-mail', exact: true });
  const passwordInput = page.getByLabel('Nova senha', { exact: true });

  await expect(nameInput).toHaveValue('Administrador');
  await expect(emailInput).toHaveValue('admin@montehorebe.com');
  await expect(passwordInput).toHaveValue('');
  await expect(nameInput).not.toHaveAttribute('placeholder', /.+/);
  await expect(emailInput).not.toHaveAttribute('placeholder', /.+/);
  await expect(passwordInput).not.toHaveAttribute('placeholder', /.+/);

  await page.screenshot({ path: testInfo.outputPath('perfil-administrador.png'), fullPage: true });

  await nameInput.fill('Administrador MH');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas com sucesso.', { exact: true })).toBeVisible();
  await expect(page.getByText('Administrador MH', { exact: true })).toBeVisible();

  // Restore seeded admin name for subsequent tests.
  await nameInput.fill('Administrador');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas com sucesso.', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
});

test('perfil do cliente exibe cargo Cliente, altera nome/email/senha e permite excluir conta', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('tab', { name: 'Criar conta', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome completo', exact: true }).fill('Anna Beatryz');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('annabeatryz@email.com');
  await page.getByLabel('Senha', { exact: true }).fill('123456');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();

  await expect(page.getByText('Área do cliente', { exact: true })).toBeVisible();
  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible();
  await expect(page.getByText('Anna Beatryz', { exact: true })).toBeVisible();
  await expect(page.getByText('Cliente', { exact: true })).toBeVisible();

  const nameInput = page.getByRole('textbox', { name: 'Nome completo', exact: true });
  const emailInput = page.getByRole('textbox', { name: 'E-mail', exact: true });
  const passwordInput = page.getByLabel('Nova senha', { exact: true });

  await expect(nameInput).toHaveValue('Anna Beatryz');
  await expect(emailInput).toHaveValue('annabeatryz@email.com');
  await expect(passwordInput).toHaveValue('');
  await expect(nameInput).not.toHaveAttribute('placeholder', /.+/);
  await expect(emailInput).not.toHaveAttribute('placeholder', /.+/);
  await expect(passwordInput).not.toHaveAttribute('placeholder', /.+/);

  await page.screenshot({ path: testInfo.outputPath('perfil-cliente.png'), fullPage: true });

  await nameInput.fill('Beatryz Silva');
  await emailInput.fill('beatryz@email.com');
  await passwordInput.fill('nova123');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByText('Alterações salvas com sucesso.', { exact: true })).toBeVisible();
  await expect(page.getByText('Beatryz Silva', { exact: true })).toBeVisible();
  await expect(passwordInput).toHaveValue('');

  await page.getByRole('button', { name: 'Sair da conta', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();

  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('beatryz@email.com');
  await page.getByLabel('Senha', { exact: true }).fill('nova123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Olá, Beatryz Silva!', { exact: true })).toBeVisible();

  await page.getByRole('tab', { name: 'Perfil', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir minha conta', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Perfil', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Excluir minha conta', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar exclusão', exact: true }).click();
  await expect(page.getByText('Conta excluída com sucesso.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();

  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('beatryz@email.com');
  await page.getByLabel('Senha', { exact: true }).fill('nova123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Email ou senha inválidos', { exact: true })).toBeVisible();
});
