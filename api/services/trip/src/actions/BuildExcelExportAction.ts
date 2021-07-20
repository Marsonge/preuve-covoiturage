import { ContextType, handler, KernelInterfaceResolver } from '@ilos/common';
import { Action } from '@ilos/core';
import { ParamsInterface as GetCampaignParamInterface, ResultInterface as GetCampaignResultInterface, signature as GetCampaignSignature } from '../shared/policy/find.contract';
import { handlerConfig, ParamsInterface, ResultInterface } from '../shared/trip/buildExcelExport.contract';

@handler({
  ...handlerConfig,
})
export class BuildExcelExportAction extends Action {

  constructor(private kernel: KernelInterfaceResolver) {
    super();
  }

  public async handle(params: ParamsInterface, context: ContextType): Promise<ResultInterface> {
    
  }
}