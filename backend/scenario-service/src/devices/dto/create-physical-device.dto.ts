import { createZodDto } from 'nestjs-zod';
import { createPhysicalDeviceSchema } from '../schemas/physical-device.schema';

export class CreatePhysicalDeviceDto extends createZodDto(
  createPhysicalDeviceSchema,
) {}
