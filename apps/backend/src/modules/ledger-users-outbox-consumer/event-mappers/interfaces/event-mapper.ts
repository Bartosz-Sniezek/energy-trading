export interface EventMapper<T> {
  execute(event: T): Promise<void>;
}
