import { generateCodexFiles } from './renderer';
import {
  GeneratedFile,
  WriteCodexFilesInput,
} from './types';
import { writeGeneratedFiles } from '../writer';

export function writeCodexFiles(input: WriteCodexFilesInput): GeneratedFile[] {
  const generated = generateCodexFiles(input);
  return writeGeneratedFiles(input.projectRoot, generated.files);
}
