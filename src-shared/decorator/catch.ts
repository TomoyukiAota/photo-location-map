// This file is based on and modified from https://github.com/valjic1/catch-decorator-ts/blob/master/src/index.ts
// Ideally, catch-decorator-ts should simply be installed and used, but there are some compile errors.
// Therefore, the content of catch-decorator-ts exists in photo-location-map repo with some modification.

/* eslint-disable @typescript-eslint/ban-types */ // Suppress the lint error "Don't use `Function` as a type."

function isPromise(object: any): object is Promise<any> {
  return object && Promise.resolve(object) === object;
}

function isFunction(func: any): func is Function {
  return typeof func === 'function' || func instanceof Function;
}

export type Handler = (err: any, context: any, ...args: any) => any;

const Factory = (
  ErrorClassConstructor: Function | Handler,
  handler?: Handler,
) => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    const { value } = descriptor;

    if (!handler) {
      handler = ErrorClassConstructor as Handler;
      ErrorClassConstructor = undefined as unknown as any;
    }

    descriptor.value = async function (...args: any[]) {
      try {
        const response = value.apply(this, args);
        return isPromise(response) ? await response : Promise.resolve(response);
      } catch (error) {
        if (
          isFunction(handler) &&
          (ErrorClassConstructor === undefined ||
            error instanceof ErrorClassConstructor)
        ) {
          return handler.call(null, error, this, ...args);
        }
        throw error;
      }
    };

    return descriptor;
  };
};

export const Catch = (ErrorClassConstructor: Function, handler: Handler) =>
  Factory(ErrorClassConstructor, handler);

export const DefaultCatch = (handler: Handler) => Factory(handler);
