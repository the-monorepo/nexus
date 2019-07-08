
import { HookOptions, CompleteHooksOptions, fromSchema } from 'hook-schema';

const beforeAfterHookSchema = {
};
const onHookSchema = {
  complete: null,
  fileFinished: null,
  testResult: null,
  allFilesFinished: [null, { yield: true }],
};
export type PartialTestHookOptions = HookOptions<typeof beforeAfterHookSchema, typeof onHookSchema>;
export type TestHookOptions = CompleteHooksOptions<typeof beforeAfterHookSchema, typeof onHookSchema>;
export const schema = fromSchema(beforeAfterHookSchema, onHookSchema);