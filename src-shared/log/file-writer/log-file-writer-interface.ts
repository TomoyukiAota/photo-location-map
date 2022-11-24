export interface LogFileWriterInterface {
  append(message: string): Promise<void>;
}
