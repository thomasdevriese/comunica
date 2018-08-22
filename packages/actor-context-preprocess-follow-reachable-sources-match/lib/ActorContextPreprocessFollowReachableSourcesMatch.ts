import {ActorContextPreprocess, IActorContextPreprocessOutput} from "@comunica/bus-context-preprocess";
import {DataSources, IDataSource, KEY_CONTEXT_SOURCES} from "@comunica/bus-rdf-resolve-quad-pattern";
import {IAction, IActorArgs, IActorTest} from "@comunica/core";
import {AsyncReiterableArray} from "asyncreiterable";
import {ActionObserverRdfResolveQuadPattern} from "./ActionObserverRdfResolveQuadPattern";

/**
 * A comunica Follow Reachable Sources All Context Preprocess Actor.
 */
export class ActorContextPreprocessFollowReachableSourcesMatch extends ActorContextPreprocess {

  public readonly rdfResolveQuadPatternObserver: ActionObserverRdfResolveQuadPattern;

  constructor(args: IActorContextPreprocessFollowReachableSourcesAllAgs) {
    super(args);
  }

  public async test(action: IAction): Promise<IActorTest> {
    return true;
  }

  public async run(action: IAction): Promise<IActorContextPreprocessOutput> {
    if (action.context && action.context.get(KEY_CONTEXT_SOURCES)) {
      const sources: DataSources = action.context.get(KEY_CONTEXT_SOURCES);
      const newSources: DataSources = AsyncReiterableArray.fromInitialEmpty();

      const it = sources.iterator();
      it.on('data', (source: IDataSource) => newSources.push(source));

      this.rdfResolveQuadPatternObserver.addUriListener(
        (uri: string) => newSources.push({ type: 'file', value: encodeURI(uri), silenceErrors: true }));

      // The Web is (practically) infinitely large, so we are not able to emit an 'end' event.

      return { context: action.context.set(KEY_CONTEXT_SOURCES, newSources) };
    }
    return action;
  }

}

export interface IActorContextPreprocessFollowReachableSourcesAllAgs
  extends IActorArgs<IAction, IActorTest, IActorContextPreprocessOutput> {
  rdfResolveQuadPatternObserver: ActionObserverRdfResolveQuadPattern;
}
