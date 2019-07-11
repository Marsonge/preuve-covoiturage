import { Parents, Container, Extensions, Interfaces } from '@ilos/core';
import { ConfigExtension } from '@ilos/config';
import { ConnectionManagerExtension } from '@ilos/connection-manager';
import { PermissionMiddleware } from '@ilos/package-acl';
import { MongoConnection } from '@ilos/connection-mongo';
import { ValidatorExtension, ValidatorMiddleware } from '@pdc/provider-validator';

import { ApplicationRepositoryProvider } from './providers/ApplicationRepositoryProvider';

import { FindApplicationAction, CreateApplicationAction, RevokeApplicationAction } from './actions';
import { applicationFindSchema, applicationCreateSchema, applicationRevokeSchema } from './schemas';

@Container.serviceProvider({
  config: __dirname,
  providers: [ApplicationRepositoryProvider],
  validator: [
    ['application.find', applicationFindSchema],
    ['application.create', applicationCreateSchema],
    ['application.revoke', applicationRevokeSchema],
  ],
  middlewares: [['can', PermissionMiddleware], ['validate', ValidatorMiddleware]],
  connections: [[MongoConnection, 'mongo']],
  handlers: [FindApplicationAction, CreateApplicationAction, RevokeApplicationAction],
})
export class ServiceProvider extends Parents.ServiceProvider {
  readonly extensions: Interfaces.ExtensionStaticInterface[] = [
    ConfigExtension,
    ConnectionManagerExtension,
    ValidatorExtension,
    Extensions.Middlewares,
    Extensions.Providers,
    Extensions.Handlers,
  ];
}
