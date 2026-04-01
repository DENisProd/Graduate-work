import { createZodDto } from 'nestjs-zod';
import { createDeviceDataSchema } from '../schemas/device-data.schema';

export class CreateDeviceDataDto extends createZodDto(createDeviceDataSchema) {}
