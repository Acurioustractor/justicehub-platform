import * as usersSchema from './users';
import * as organizationsSchema from './organizations';
import * as storiesSchema from './stories';
import * as mentorsSchema from './mentors';
import * as opportunitiesSchema from './opportunities';
import * as apprenticeshipsSchema from './apprenticeships';
import * as messagesSchema from './messages';

export const schema = {
  ...usersSchema,
  ...organizationsSchema,
  ...storiesSchema,
  ...mentorsSchema,
  ...opportunitiesSchema,
  ...apprenticeshipsSchema,
  ...messagesSchema,
};

export * from './users';
export * from './organizations';
export * from './stories';
export * from './mentors';
export * from './opportunities';
export * from './apprenticeships';
export * from './messages';