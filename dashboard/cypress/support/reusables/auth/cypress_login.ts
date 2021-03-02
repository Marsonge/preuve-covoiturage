import { Groups } from '~/core/enums/user/groups';

import { stubLogin } from '../../stubs/auth/login';
import { stubUserMe, stubUserMePermissionError } from '../../stubs/user/user.me';
import { stubMainLists } from '../../stubs/loadMainLists';
import { stubStatList } from '../../stubs/stat/stat.list';
import { stubCampaignList } from '../../stubs/campaign/campaign.list';
import { CI_WAIT } from '../../../config/ci.config';

export function cypress_login(loginData: { email: string; password: string; group: Groups }, e2e = false): void {
  if (!e2e) {
    beforeEach(() => {
      cy.server();
      stubLogin(loginData.group);
      stubMainLists(loginData.group);
      stubStatList();
      stubCampaignList();
    });
  }

  it('go to login page', () => {
    if (!e2e) {
      stubUserMePermissionError();
    }
    cy.visit('/login');
  });

  it('Logges in', () => {
    cy.get('.Login mat-form-field:first-child input').type(loginData.email);

    cy.get('.Login mat-form-field:nth-child(2) input').type(loginData.password);

    if (!e2e) {
      stubUserMe(loginData.group);
    }

    cy.get('.Login form > button').click();

    cy.wait(CI_WAIT.waitLong);
  });
}
