import { z } from 'zod';

export const zodObjectId = z.string()
  .regex(/^[a-f\d]{24}$/i)
  .meta({ bsonType: 'objectId' });

export const zodBsonDatetime = z.unknown()
  .refine((value) => !Number.isNaN(new Date(value as any).getTime()))
  .meta({ bsonType: "date" });

export const zodBsonEncrypt = z.unknown().meta({ bsonType: "binData" });
// export const zodBsonEncrypted = <T extends z.ZodTypeAny>(schema: T) => {
//   return schema.meta({ encrypted: true });
// };
