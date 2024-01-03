import * as fs from 'node:fs';
import * as path from 'node:path';
import { browser, expect, $, $$ } from '@wdio/globals';

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../', 'package.json'), { encoding: 'utf-8' }),
);
const { name, version } = packageJson;

describe('check about page version', () => {
  it('should retrieve app metadata through about page', async () => {
    await browser.url((await browser.getUrl()).split('#')[0].concat('#/index/about'));
    await expect(await $$('//div/p[@id="appVersion"]')[0]).toHaveTextContaining(version);
  });
});
