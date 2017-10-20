import * as minimistType from 'minimist';

export type Validator = (input?: string, key?: string) => true | string;

export type CommandLineInput = string | boolean | null | undefined | string[];
export type CommandLineInputs = string[];

export interface CommandLineOptions extends minimistType.ParsedArgs {
  [arg: string]: CommandLineInput;
}

export type CommandRunFn = (inputs: CommandLineInputs, options: CommandLineOptions) => Promise<void>;

export interface ICommand<T = CommandData> {
  metadata: T;

  validate(inputs: CommandLineInputs): Promise<void>;
  run: CommandRunFn;
}

export type CommandOptionType = StringConstructor | BooleanConstructor;

export interface CommandInput {
  name: string;
  description: string;
  validators?: Validator[];
  required?: boolean;
  private?: boolean;
}

export interface CommandOption {
  name: string;
  description: string;
  type?: CommandOptionType;
  default?: CommandLineInput;
  aliases?: string[];
  private?: boolean;
  intents?: string[];
  visible?: boolean;
  advanced?: boolean;
}

export interface CommandData<T = CommandInput, U = CommandOption> {
  name: string;
  description: string;
  longDescription?: string;
  exampleCommands?: string[];
  deprecated?: boolean;
  aliases?: string[];
  inputs?: T[];
  options?: U[];
  visible?: boolean;
  fullName?: string;
}

export interface HydratedCommandData<T extends ICommand> {
  namespace: INamespace<T>;
  aliases: string[];
  fullName: string;
}

export type NamespaceMapGetter<T extends ICommand> = () => Promise<INamespace<T>>;
export type CommandMapGetter<T extends ICommand> = () => Promise<T>;

export interface INamespaceMap<T extends ICommand> extends Map<string, NamespaceMapGetter<T>> {}

export interface ICommandMap<T extends ICommand> extends Map<string, string | CommandMapGetter<T>> {
  getAliases(): Map<string, string[]>;
  resolveAliases(cmdName: string): undefined | CommandMapGetter<T>;
}

export interface INamespace<T extends ICommand> {
  root: boolean;
  name: string;
  description: string;
  longDescription: string;
  namespaces: INamespaceMap<T>;
  commands: ICommandMap<T>;

  locate(argv: string[]): Promise<[number, string[], T | INamespace<T>]>;
  getCommandMetadataList(): Promise<(T['metadata'] & HydratedCommandData<T>)[]>;
}

export interface Validators {
  required: Validator;
  email: Validator;
  numeric: Validator;
}

export interface ValidationError {
  message: string;
  inputName: string;
}

export interface PackageJson {
  name: string;
  version?: string;
  scripts?: { [key: string]: string };
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

export interface BowerJson {
  name: string;
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}
