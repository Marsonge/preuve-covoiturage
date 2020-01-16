import puppeteer from 'puppeteer';
import { provider } from '@ilos/common';

import {
  CertificatePrinterProviderInterface,
  CertificatePrinterProviderInterfaceResolver,
} from '../interfaces/CertificatePrinterProviderInterface';

@provider({
  identifier: CertificatePrinterProviderInterfaceResolver,
})
export class CertificatePrinterProvider implements CertificatePrinterProviderInterface {
  private browser: any;
  private page: any;

  async png(identity: string, start_at: Date, end_at: Date): Promise<Buffer> {
    // TODO catch errors and log
    // Do not render image/pdf on errors

    await this.init();
    await this.page.goto(this.getUrl(identity, start_at, end_at));
    const png: Buffer = await this.page.screenshot({ fullPage: true });
    await this.destroy();

    return png;
  }

  async pdf(identity: string, start_at: Date, end_at: Date): Promise<Buffer> {
    // TODO catch errors and log
    // Do not render image/pdf on errors

    await this.init();
    await this.page.goto(this.getUrl(identity, start_at, end_at));
    const pdf: Buffer = await this.page.pdf({ format: 'A4', scale: 0.3333 });
    await this.destroy();

    return pdf;
  }

  private getUrl(identity: string, start_at: Date, end_at: Date): string {
    const id = encodeURIComponent(identity);
    const start = !!start_at ? `&start_at=${start_at.toISOString()}` : '';
    const end = !!end_at ? `&end_at=${end_at.toISOString()}` : '';

    console.log('getUrl', { id, start, end });
    return `http://localhost:8080/certificates/render/?identity=${id}${start}${end}`;
  }

  private async init(): Promise<void> {
    this.browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    this.page = await this.browser.newPage();
  }

  private async destroy(): Promise<void> {
    await this.browser.close();
  }
}
