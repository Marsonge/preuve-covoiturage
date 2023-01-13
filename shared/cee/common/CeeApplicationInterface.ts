export enum CeeJourneyTypeEnum {
  Short = 'short',
  Long = 'long',
}
export type PhoneTrunc = string;
export type LastNameTrunc = string;
export type DrivingLicense = string;
export type Timestamp = string;
export type JourneyId = number;
export type OperatorJourneyId = string;
export type Status = string;
export type Token = string;

export interface CeeAplicationResultInterface {
  uuid: string;
  datetime: Timestamp;
  token: Token;
  journey_id?: JourneyId;
  status?: Status;
}

export interface CeeShortApplicationInterface {
  application_timestamp: Timestamp;
  journey_type: CeeJourneyTypeEnum.Short;
  last_name_trunc: LastNameTrunc;
  driving_license: DrivingLicense;
  operator_journey_id: OperatorJourneyId;
}

export interface CeeLongApplicationInterface {
  application_timestamp: Timestamp;
  journey_type: CeeJourneyTypeEnum.Long;
  last_name_trunc: LastNameTrunc;
  driving_license: DrivingLicense;
  phone_trunc: PhoneTrunc;
  datetime: Date;
}

export type CeeApplicationInterface = CeeShortApplicationInterface | CeeLongApplicationInterface;

export interface CeeSimulateInterface {
  journey_type: CeeJourneyTypeEnum;
  last_name_trunc: LastNameTrunc;
  phone_trunc: PhoneTrunc;
  driving_license?: DrivingLicense;
}

export interface CeeSimulateResultInterface {
  datetime: Timestamp;
  uuid?: string;
}

export interface CeeImportInterface<T> {
  journey_type: CeeJourneyTypeEnum;
  last_name_trunc: LastNameTrunc;
  phone_trunc: PhoneTrunc;
  datetime: T;
}

export interface CeeImportResultInterface {
  imported: number;
  failed: number;
  failed_details: Array<CeeImportInterface<string> & { error: string }>;
}