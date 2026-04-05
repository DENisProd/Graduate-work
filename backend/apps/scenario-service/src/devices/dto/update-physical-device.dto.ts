import { createZodDto } from 'nestjs-zod';
import { updatePhysicalDeviceSchema } from '../schemas/physical-device.schema';

export class UpdatePhysicalDeviceDto extends createZodDto(
  updatePhysicalDeviceSchema,
) {}
