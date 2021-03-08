import { Readable } from 'stream';
import type { IActionSparqlSerialize,
  IActorSparqlSerializeFixedMediaTypesArgs, IActorSparqlSerializeOutput } from '@comunica/bus-sparql-serialize';
import { ActorSparqlSerializeFixedMediaTypes } from '@comunica/bus-sparql-serialize';
import type { ActionContext } from '@comunica/core';
import type { IActorQueryOperationOutputBindings,
  IActorQueryOperationOutputQuads } from '@comunica/types';
import type { ActionObserverHttp } from './ActionObserverHttp';

/**
 * Serializes SPARQL results for testing and debugging.
 */
export class ActorSparqlSerializeStats extends ActorSparqlSerializeFixedMediaTypes {
  public readonly httpObserver: ActionObserverHttp;

  public constructor(args: IActorSparqlSerializeStatsArgs) {
    super(args);
  }

  public async testHandleChecked(action: IActionSparqlSerialize, context: ActionContext): Promise<boolean> {
    if (![ 'bindings', 'quads' ].includes(action.type)) {
      throw new Error('This actor can only handle bindings streams or quad streams.');
    }
    return true;
  }

  public pushHeader(data: Readable): void {
    const header: string = [ 'Result', 'Delay (ms)', 'HTTP requests',
    ].join(',');
    data.push(`${header}\n`);
  }

  public pushStat(data: Readable, startTime: [number, number], result: number): void {
    const row: string = [ result, this.delay(startTime), this.httpObserver.requests,
    ].join(',');
    data.push(`${row}\n`);
  }

  public pushFooter(data: Readable, startTime: [number, number], result: number): void {
    // const footer: string = [ 'TOTAL', this.delay(startTime), this.httpObserver.requests,
    // ].join(',');
    const here = this;
    // Enforce these two lines to always print after the other metrics (otherwise, when there are no results, they are printed after the other metrics but when there are results, they are printed before).
    setTimeout(function(){
      data.push(`|\t|\t|\t\t#Results: ${result}\n`);
      data.push(`|\t|\t|\t\tHTTP requests: ${here.httpObserver.requests}\n|\t|\t|\n`);
      // data.push(`${footer}\n`);
      data.push(null);
    },1);
  }

  public async runHandle(action: IActionSparqlSerialize, mediaType: string, context: ActionContext):
  Promise<IActorSparqlSerializeOutput> {
    const data = new Readable();
    data._read = () => {
      // Do nothing
    };

    const resultStream: NodeJS.EventEmitter = action.type === 'bindings' ?
      (<IActorQueryOperationOutputBindings> action).bindingsStream :
      (<IActorQueryOperationOutputQuads> action).quadStream;

    // TODO: Make initiation timer configurable
    const startTime = process.hrtime();
    let result = 0;

    // this.pushHeader(data);
    resultStream.on('error', error => data.emit('error', error));
    // resultStream.on('data', () => this.pushStat(data, startTime, ++result));
    resultStream.on('data', () => ++result);
    resultStream.on('end', () => this.pushFooter(data, startTime, result));

    return { data };
  }

  public delay(startTime: [number, number]): number {
    const time: [number, number] = process.hrtime(startTime);
    return time[0] * 1_000 + (time[1] / 1_000_000);
  }
}

export interface IActorSparqlSerializeStatsArgs extends IActorSparqlSerializeFixedMediaTypesArgs {
  httpObserver: ActionObserverHttp;
}
