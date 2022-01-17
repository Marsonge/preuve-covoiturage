import { TripInterface, PersonInterface, IncentiveInterface } from '../../interfaces';
import { MetadataWrapperInterface } from '../../interfaces';
import { priority } from '../helpers/priority';
import { type } from '../helpers/type';

export interface RuleHandlerContextInterface {
  person: PersonInterface;
  trip: TripInterface;
  stack: string[];
}

export interface RuleHandlerParamsInterface extends RuleHandlerContextInterface {
  result: number | undefined;
}

export type RuleHandlerInterface = (context: RuleHandlerContextInterface) => Promise<void>;

export interface RuleInterface {
  slug: string;
  parameters?: any;
}

export interface StaticRuleInterface<H = MetaOrApplicableOrStatefulRuleInterface, P = any> {
  slug: string;
  description?: string;
  schema?: { [k: string]: any };
  index?: priority;
  type: type;
  new (params?: P): H;
}

// apply(parameters?: any): RuleHandlerInterface;

export interface AppliableRuleInterface {
  apply(context: RuleHandlerParamsInterface): void;
}

export interface StatefulRuleInterface {
  readonly uuid: string;
  initState(context: RuleHandlerContextInterface, meta: MetadataWrapperInterface): void;
  apply(result: number, state: number): number;
  setState(result: number, state: number): number;
}

export interface StatefulRuleSetInterface {
  length: number;
  buildInitialState(context: RuleHandlerContextInterface, meta: MetadataWrapperInterface): void;
  listStateKeys(incentive: IncentiveInterface): string[];
  apply(incentive: IncentiveInterface, meta: MetadataWrapperInterface): number;
}

export interface MetaRuleInterface {
  build?(): RuleInterface[];
}

export interface FilterRuleInterface extends AppliableRuleInterface {
  filter(context: RuleHandlerContextInterface): void;
}

export interface ModifierRuleInterface extends AppliableRuleInterface {
  modify(context: RuleHandlerContextInterface, result: number): number;
}

export interface SetterRuleInterface extends AppliableRuleInterface {
  set(context: RuleHandlerContextInterface): number;
}

export interface TransformerRuleInterface extends AppliableRuleInterface {
  transform(context: RuleHandlerContextInterface): RuleHandlerContextInterface;
}

export type MetaOrApplicableOrStatefulRuleInterface =
  | AppliableRuleInterface
  | FilterRuleInterface
  | MetaRuleInterface
  | ModifierRuleInterface
  | SetterRuleInterface
  | TransformerRuleInterface
  | StatefulRuleInterface;
