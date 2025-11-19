class ConflictError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 409;
    // this.name = 'ConflictError';
  }
}

export default ConflictError;
