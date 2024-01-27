export class PuzlogError extends Error {
  title: string;
  error?: Error;
  constructor(title: string, message: string, error?: Error) {
    super(message);
    this.title = title;
    this.error = error;
  }
}
