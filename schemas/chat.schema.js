const { z } = require('zod');

const ModelEnum = z.enum([
  'gemma2-9b-it',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'llama-guard-3-8b',
  'llama3-70b-8192',
  'deepseek-r1-distill-llama-70b',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'meta-llama/llama-4-scout-17b-16e-instruct',
]);

const userid = z.string();

const messageScheme = z.object({
  text: z.string(),
  model: ModelEnum,
  fileId: z.string().optional(),
});

const newChatSchema = z.object({
  title: z.string()
});

const imageGenRouteScheme = z.object({
  text: z.string(),
  model: z.string(),
  fileId: z.string(),
});

module.exports = {
  ModelEnum,
  messageScheme,
  newChatSchema,
  imageGenRouteScheme
}