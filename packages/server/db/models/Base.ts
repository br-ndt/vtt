import { Model, snakeCaseMappers } from "objection";

export class BaseModel extends Model {
  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}
