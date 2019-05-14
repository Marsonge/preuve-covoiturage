import { Parents, Providers, Interfaces } from '@pdc/core';

import { SendMailAction } from './actions/SendMailAction';
import { SendTemplateMailAction } from './actions/SendTemplateMailAction';
import { MailjetProvider } from './providers/MailjetProvider';
import { HandlebarsProvider } from './providers/HandlebarsProvider';

export class ServiceProvider extends Parents.ServiceProvider implements Interfaces.ServiceProviderInterface {
  readonly alias = [
    MailjetProvider,
    HandlebarsProvider,
  ];

  handlers = [
    SendMailAction,
    SendTemplateMailAction,
  ];

  public async boot() {
    await super.boot();
    this.getContainer().get(Providers.EnvProvider).loadEnvFile(__dirname);
    this.getContainer().get(Providers.ConfigProvider).loadConfigDirectory(__dirname);
  }
}
