import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isValidVonageCallUuid } from "../utils/vonage-call-uuid";

@ValidatorConstraint({ name: "isVonageCallUuid", async: false })
export class IsVonageCallUuidConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (value === undefined || value === null || value === "") return true;
    return typeof value === "string" && isValidVonageCallUuid(value);
  }

  defaultMessage() {
    return "value must be a valid Vonage call UUID";
  }
}

export function IsVonageCallUuid(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsVonageCallUuidConstraint,
    });
  };
}
