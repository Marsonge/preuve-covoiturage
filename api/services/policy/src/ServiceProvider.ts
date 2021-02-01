import { ServiceProvider as AbstractServiceProvider } from '@ilos/core';
import { serviceProvider, NewableType, ExtensionInterface } from '@ilos/common';
import { PermissionMiddleware } from '@pdc/provider-acl';
import { PostgresConnection } from '@ilos/connection-postgres';
import { RedisConnection } from '@ilos/connection-redis';
import { ValidatorExtension, ValidatorMiddleware } from '@pdc/provider-validator';
import {
  ScopeToSelfMiddleware,
  ChannelServiceWhitelistMiddleware,
  ContextExtractMiddleware,
  ValidateDateMiddleware,
} from '@pdc/provider-middleware';

import { config } from './config';
import { binding as createSchemaBinding } from './shared/policy/create.schema';
import { binding as patchSchemaBinding } from './shared/policy/patch.schema';
import { binding as launchSchemaBinding } from './shared/policy/launch.schema';
import { binding as deleteSchemaBinding } from './shared/policy/delete.schema';
import { binding as listSchemaBinding } from './shared/policy/list.schema';
import { binding as templatesSchemaBinding } from './shared/policy/templates.schema';
import { binding as findSchemaBinding } from './shared/policy/find.schema';
import { binding as simulateOnSchemaBinding } from './shared/policy/simulateOn.schema';

import { CreateCampaignAction } from './actions/CreateCampaignAction';
import { PatchCampaignAction } from './actions/PatchCampaignAction';
import { LaunchCampaignAction } from './actions/LaunchCampaignAction';
import { ListCampaignAction } from './actions/ListCampaignAction';
import { DeleteCampaignAction } from './actions/DeleteCampaignAction';
import { TemplatesCampaignAction } from './actions/TemplatesCampaignAction';
import { FindCampaignAction } from './actions/FindCampaignAction';
import { ApplyAction } from './actions/ApplyAction';
import { FinalizeAction } from './actions/FinalizeAction';

import { CampaignPgRepositoryProvider } from './providers/CampaignPgRepositoryProvider';
import { PolicyEngine } from './engine/PolicyEngine';
import { MetadataProvider } from './engine/meta/MetadataProvider';
import { IncentiveRepositoryProvider } from './providers/IncentiveRepositoryProvider';
import { TripRepositoryProvider } from './providers/TripRepositoryProvider';

import { ValidateRuleParametersMiddleware } from './middlewares/ValidateRuleParametersMiddleware';
import { PolicyProcessCommand } from './commands/PolicyProcessCommand';
import { SeedCommand } from './commands/SeedCommand';
import { SimulateOnPastAction } from './actions/SimulateOnPastAction';
import { SimulateOnFakeAction } from './actions/SimulateOnFakeAction';

@serviceProvider({
  config,
  commands: [PolicyProcessCommand, SeedCommand],
  providers: [
    CampaignPgRepositoryProvider,
    MetadataProvider,
    TripRepositoryProvider,
    ['validate.rules', ValidateRuleParametersMiddleware],
    PolicyEngine,
    IncentiveRepositoryProvider,
  ],
  validator: [
    createSchemaBinding,
    patchSchemaBinding,
    launchSchemaBinding,
    deleteSchemaBinding,
    listSchemaBinding,
    templatesSchemaBinding,
    findSchemaBinding,
    simulateOnSchemaBinding,
  ],
  handlers: [
    TemplatesCampaignAction,
    CreateCampaignAction,
    PatchCampaignAction,
    LaunchCampaignAction,
    DeleteCampaignAction,
    ListCampaignAction,
    FindCampaignAction,
    ApplyAction,
    FinalizeAction,
    SimulateOnPastAction,
    SimulateOnFakeAction,
  ],
  connections: [
    [PostgresConnection, 'connections.postgres'],
    [RedisConnection, 'connections.redis'],
  ],
  queues: ['campaign'],
  middlewares: [
    ['can', PermissionMiddleware],
    ['validate', ValidatorMiddleware],
    ['scope.it', ScopeToSelfMiddleware],
    ['channel.service.only', ChannelServiceWhitelistMiddleware],
    ['context_extract', ContextExtractMiddleware],
    ['validate.date', ValidateDateMiddleware],
  ],
})
export class ServiceProvider extends AbstractServiceProvider {
  readonly extensions: NewableType<ExtensionInterface>[] = [ValidatorExtension];
}
