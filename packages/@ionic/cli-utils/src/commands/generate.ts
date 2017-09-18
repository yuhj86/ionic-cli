import chalk from 'chalk';

import { CommandLineInputs, CommandLineOptions, IonicEnvironment } from '../definitions';
import { FatalException } from '../lib/errors';

export async function generate(env: IonicEnvironment, inputs: CommandLineInputs, options: CommandLineOptions): Promise<void> {
  const { Observable } = await import('rxjs/Observable');
  const { DryRunSink, FileSystemTree, SchematicEngine } = await import('@angular-devkit/schematics');
  const { FileSystemHost, NodeModulesEngineHost } = await import('@angular-devkit/schematics/tools');

  const [ type, name ] = inputs;

  const workingDir = env.project.directory;

  const engineHost = new NodeModulesEngineHost();
  const engine = new SchematicEngine(engineHost);
  const collection = engine.createCollection('@schematics/ionic-angular');

  if (!engineHost.listSchematics(collection).includes(type)) {
    throw new FatalException(`Unknown generator: ${chalk.green(type)}`);
  }

  const schematic = collection.createSchematic(type);

  const sink = new DryRunSink(workingDir, false);
  let errors = false;

  sink.reporter.subscribe(event => {
    if (event.kind === 'error') {
      const reason = event.description === 'alreadyExist' ? 'already exists' : 'does not exist';
      env.log.error(`${event.path} ${reason}`);
      errors = true;
    } else if (event.kind === 'create') {
      env.log.msg(`${chalk.green.bold('create')} ${event.path} ${chalk.dim(`(${event.content.length} bytes)`)}`);

      env.log.msg(String(event.content));
    } else if (event.kind === 'delete') {
      env.log.msg(`${chalk.red.bold('delete')} ${event.path}`);
    } else if (event.kind === 'update') {
      env.log.msg(`${chalk.yellow.bold('update')} ${event.path} ${chalk.dim(`(${event.content.length} bytes)`)}`);
    } else if (event.kind === 'rename') {
      env.log.msg(`${chalk.yellow.bold('rename')} ${event.path} => ${event.to}`);
    }
  });

  if (errors) {
    throw new FatalException('Errors detected.'); // TODO
  }

  // const tree = new EmptyTree();
  const tree = new FileSystemTree(new FileSystemHost(workingDir));
  const host = Observable.of(tree);

  schematic.call({ name }, host)
    // .map(tree => Tree.optimize(tree))
    // .concatMap(tree => {
    //   console.log(tree);
    //   const r = sink.commit(tree);
    //   return r.ignoreElements().concat(Observable.of(tree));
    // })
    .subscribe({
      error(err) {
        console.error(err);
      },
      complete() {
        console.log('done');
      },
    });
}
