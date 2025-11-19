class NotFoundError extends Error {
  public statusCode: number;

  constructor(message: string) {
    super(message);
    this.statusCode = 404;
    // this.name = 'NotFoundError';
  }
}

export default NotFoundError;
