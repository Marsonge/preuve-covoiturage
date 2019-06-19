// tslint:disable max-classes-per-file
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { CryptoProviderInterfaceResolver } from '@pdc/provider-crypto';
import { Container, Interfaces, Types } from '@ilos/core';
import { ConfigProviderInterfaceResolver } from '@ilos/provider-config';
import { ValidatorProvider, ValidatorProviderInterfaceResolver } from '@pdc/provider-validator';


import { UserRepositoryProviderInterfaceResolver } from '../interfaces/repository/UserRepositoryProviderInterface';
import { UserBaseInterface } from '../interfaces/UserInterfaces';

import { ForgottenPasswordUserAction } from './ForgottenPasswordUserAction';

import { User } from '../entities/User';

import { ServiceProvider as BaseServiceProvider } from '../ServiceProvider';

import { mockConnectedUserBase } from '../../tests/mocks/connectedUserBase';
import { mockNewUserBase } from '../../tests/mocks/newUserBase';

chai.use(chaiAsPromised);
const { expect, assert } = chai;

const mockConnectedUser = <UserBaseInterface>{
  ...mockConnectedUserBase,
};

const mockUser = {
  ...mockNewUserBase,
  _id: 'mockUserId',
};

const mockForgottenPasswordParams = {
  forgottenReset: 'randomToken',
  forgottenToken: 'cryptedRandomToken2',
  forgottenAt: new Date(),
};

@Container.provider()
class FakeUserRepository extends UserRepositoryProviderInterfaceResolver {
  async boot() {
    return;
  }
  public async update(user: UserBaseInterface): Promise<User> {
    return new User({
      ...mockUser,
      ...mockForgottenPasswordParams,
    });
  }
  public async findUserByParams(params: { [prop: string]: string }): Promise<User> {
    return new User(mockUser);
  }
}

@Container.provider()
class FakeCryptoProvider extends CryptoProviderInterfaceResolver {
  generateToken(length?: number) {
    return 'randomToken';
  }
  async cryptToken(plainToken: string): Promise<string> {
    return mockForgottenPasswordParams.forgottenToken;
  }
}

@Container.provider()
class FakeKernelProvider extends Interfaces.KernelInterfaceResolver {
  async boot() {
    return;
  }
  async call(method: string, params: any[] | { [p: string]: any }, context: Types.ContextType): Promise<Types.ResultType> {
    return undefined;
  }
}

@Container.provider()
class FakeConfigProvider extends ConfigProviderInterfaceResolver {
  async boot() {
    return;
  }
  get(key: string, fallback?: any): any {
    return 'https://app.covoiturage.beta.gouv.fr';
  }
}

class ServiceProvider extends BaseServiceProvider {
  readonly handlers = [ForgottenPasswordUserAction];
  readonly alias: any[] = [
    [ConfigProviderInterfaceResolver, FakeConfigProvider],
    [CryptoProviderInterfaceResolver, FakeCryptoProvider],
    [Interfaces.KernelInterfaceResolver, FakeKernelProvider],
    [UserRepositoryProviderInterfaceResolver, FakeUserRepository],
    [ValidatorProviderInterfaceResolver, ValidatorProvider],
  ];

  protected registerConfig() {}

  protected registerTemplate() {}
}

let serviceProvider;
let handlers;
let action;


describe('USER ACTION - Forgotten password', () => {
  before(async () => {
    serviceProvider = new ServiceProvider();
    await serviceProvider.boot();
    handlers = serviceProvider.getContainer().getHandlers();
    action = serviceProvider.getContainer().getHandler(handlers[0]);
  });
  it('should update user properties', async () => {
    const result = await action.call({
      method: 'user:deleteUser',
      context: { call: { user: mockConnectedUser }, channel: { service: '' } },
      params: { email: mockUser.email },
    });
    expect(result).to.equal(undefined);
  });
});
