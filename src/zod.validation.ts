import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { AppRegistry } from './auth/dto/auth.validation';
import { ZodError, z } from 'zod';

@Injectable()
export class GlobalZodPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // skip if no class type
    if (!metadata.metatype) return value;

    // get the Zod schema from our registry
    const schema = AppRegistry.get(metadata.metatype.name);
    if (!schema) return value;

    try {
      // parse and validate
      return schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        // flatten the Zod error for clean API output
        const flat = z.flattenError(err);

        throw new BadRequestException({
          message: 'Validation failed',
          fieldErrors: flat.fieldErrors,
          formErrors: flat.formErrors,
        });
      }
      throw err;
    }
  }
}
