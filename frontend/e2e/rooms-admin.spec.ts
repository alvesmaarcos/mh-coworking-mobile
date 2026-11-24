import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('http://127.0.0.1:4199/__test/reset');
});

test('administrador cadastra e edita sala com foto de capa mockada', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('textbox', { name: 'E-mail', exact: true }).fill('admin@montehorebe.com');
  await page.getByLabel('Senha', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByText('Sala Individual', { exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('lista-adm.png') });

  await page.getByRole('button', { name: '+ Nova sala', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cadastrar nova sala' })).toBeVisible();
  await page.getByRole('button', { name: 'Cadastrar sala', exact: true }).click();
  await expect(page.getByText('Informe o nome da sala.')).toBeVisible();

  await page.getByRole('textbox', { name: 'NOME', exact: true }).fill('Sala Copa');
  await page.getByRole('textbox', { name: 'DESCRIÇÃO', exact: true }).fill('Espaço de convivência.');
  await page.getByRole('textbox', { name: 'ATRIBUTOS', exact: true }).fill('Café, Wi-Fi');
  await page.getByRole('textbox', { name: 'VALOR DA HORA (R$)', exact: true }).fill('15,50');
  await page.getByRole('button', { name: 'CARREGAR FOTO +' }).click();
  await page.getByRole('button', { name: 'Usar foto copa-1.jpeg' }).click();
  await expect(page.getByLabel('Foto de capa selecionada')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('cadastro.png') });
  await page.getByRole('button', { name: 'Cadastrar sala', exact: true }).click();

  await expect(page.getByText('Sala Copa', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Foto de Sala Copa')).toBeVisible();

  await page.getByRole('button', { name: 'Editar Sala Grande' }).click();
  await expect(page.getByRole('heading', { name: 'Editar sala' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'NOME', exact: true })).toHaveValue('Sala Grande');
  await page.screenshot({ path: testInfo.outputPath('edicao.png') });
  await page.getByRole('textbox', { name: 'VALOR DA HORA (R$)', exact: true }).fill('60');
  await page.getByRole('button', { name: 'Salvar alterações', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Editar sala' })).toBeHidden();
  await expect(page.getByText('R$ 60', { exact: false }).first()).toBeVisible();
});
