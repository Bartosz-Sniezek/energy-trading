export abstract class BaseEvent<TEventPayload> {
  protected constructor(protected readonly _data: TEventPayload) {}

  stringify(): string {
    return JSON.stringify(this._data);
  }

  get data(): TEventPayload {
    return structuredClone(this._data);
  }
}
