import { getDataSourceContext, IActionRdfResolveQuadPattern,
  IActorRdfResolveQuadPatternOutput, IDataSource, IQuadSource, KEY_CONTEXT_SOURCES } from '@comunica/bus-rdf-resolve-quad-pattern';
import {
  ActorRdfResolveQuadPattern,
} from '@comunica/bus-rdf-resolve-quad-pattern';
import type { ActionContext, Actor, IActorArgs, IActorTest, Mediator } from '@comunica/core';
import * as fs from 'fs';
import * as path from 'path';
import { termToString } from 'rdf-string';
const Bloem = require('bloem').Bloem;

const KEY_CONTEXT_AMF_EXECUTED = '@comunica/bus-rdf-resolve-quad-pattern:amf-executed';

/**
 * An actor for processing Approximate Membership Filters to enable efficient querying over Solid pods
 */
export class ActorRdfResolveQuadPatternSolidAmf extends ActorRdfResolveQuadPattern
  implements IActorRdfResolveQuadPatternSolidAmfArgs {

  public readonly mediatorResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
  
  public constructor(args: IActorRdfResolveQuadPatternSolidAmfArgs) {
    super(args);
    // this.mediatorResolveQuadPattern = args.mediatorResolveQuadPattern;
  }

  public async test(action: IActionRdfResolveQuadPattern): Promise<IActorTest> {
    // Check if this actor was already executed.
    // If so, throw error so that federated actor will be called instead.
    // If not, return true, and in 'run', create new context with limited sources array based on AMF and set flag.
    if(action.context?.get(KEY_CONTEXT_AMF_EXECUTED, false)) {
      throw new Error(`Actor ${this.name} was already executed, so the sources array has been filtered.`);
    }
    return true;
  }

  public async run(action: IActionRdfResolveQuadPattern): Promise<IActorRdfResolveQuadPatternOutput> {
    const sources = this.getContextSources(action.context);
    let sourcesFiltered: IDataSource[] = [];
    const terms = ['subject', 'predicate', 'object'];
    sources?.forEach((source: any) => {
      const summaryFolder = source.context.summary;
      const name = source.context.name;
      const probability = source.context.probability.toString().replace('.','_');
      if(fs.existsSync(summaryFolder)) {
        let addSource = true;
        for (const term of terms) {
          const summaryName = `${name}.${probability}.${term}.BloomFilter.json`;
          const summaryPath = path.join(summaryFolder, summaryName);
          if(fs.existsSync(summaryPath)) {
            if(action.pattern[term].termType !== 'Variable') {
              const summary = JSON.parse(fs.readFileSync(summaryPath).toString());
              const buffer = Buffer.from(summary.filter, 'base64');
              const bloom = new Bloem(summary.m, summary.k, buffer);
              const searchString = termToString(action.pattern[term]) || '';
              
              if(Boolean(searchString) && !bloom.has(Buffer.from(searchString))) {
                addSource = false;
              }
            }
          } else {
            throw new Error(`Summary file ${summaryName} doesn't exist.`);
          }
        }
        if(addSource)
          sourcesFiltered.push(source.value);
      } else {
        throw new Error(`Summary folder ${summaryFolder} doesn't exist.`);
      }
    });
    action.context = action.context?.set(KEY_CONTEXT_AMF_EXECUTED, true)
                                   .set(KEY_CONTEXT_SOURCES, sourcesFiltered);
    return await this.mediatorResolveQuadPattern.mediate(action);
  }
}

export interface IActorRdfResolveQuadPatternSolidAmfArgs
  extends IActorArgs<IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput> {
  mediatorResolveQuadPattern: Mediator<Actor<IActionRdfResolveQuadPattern, IActorTest,
  IActorRdfResolveQuadPatternOutput>, IActionRdfResolveQuadPattern, IActorTest, IActorRdfResolveQuadPatternOutput>;
}
