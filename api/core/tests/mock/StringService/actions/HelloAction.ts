import { Action } from '~/parents/Action';
import { MiddlewareInterface } from '~/interfaces/MiddlewareInterface';
import { ParamsType } from '~/types/ParamsType';
import { ContextType } from '~/types/ContextType';
import { ResultType } from '~/types/ResultType';
import { InvalidParamsException } from '~/exceptions/InvalidParamsException';

export class HelloAction extends Action {
    public readonly signature: string = 'hello';

    protected middlewares: MiddlewareInterface[] = [];

    protected async handle(params: ParamsType, context: ContextType):Promise<ResultType> {
      if (Array.isArray(params) || !('name' in params)) {
        throw new InvalidParamsException();
      }
      return `Hello world ${params.name}`;
    }
  
}