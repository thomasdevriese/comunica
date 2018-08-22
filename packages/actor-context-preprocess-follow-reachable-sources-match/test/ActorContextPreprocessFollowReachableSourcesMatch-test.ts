import {ActorContextPreprocess} from "@comunica/bus-context-preprocess";
import {KEY_CONTEXT_SOURCES} from "@comunica/bus-rdf-resolve-quad-pattern";
import {ActionContext, Bus} from "@comunica/core";
import {AsyncReiterableArray} from "asyncreiterable";
import {ActionObserverRdfResolveQuadPattern} from "../lib/ActionObserverRdfResolveQuadPattern";
import {
  ActorContextPreprocessFollowReachableSourcesMatch} from "../lib/ActorContextPreprocessFollowReachableSourcesMatch";
const streamifyArray = require('streamify-array');
const quad = require('rdf-quad');

describe('ActorContextPreprocessFollowReachableSourcesMatch', () => {
  let bus;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
  });

  describe('The ActorContextPreprocessFollowReachableSourcesMatch module', () => {
    it('should be a function', () => {
      expect(ActorContextPreprocessFollowReachableSourcesMatch).toBeInstanceOf(Function);
    });

    it('should be a ActorContextPreprocessFollowReachableSourcesMatch constructor', () => {
      expect(new (<any> ActorContextPreprocessFollowReachableSourcesMatch)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorContextPreprocessFollowReachableSourcesMatch);
      expect(new (<any> ActorContextPreprocessFollowReachableSourcesMatch)({ name: 'actor', bus }))
        .toBeInstanceOf(ActorContextPreprocess);
    });

    it('should not be able to create new ActorContextPreprocessFollowReachableSourcesMatch without \'new\'', () => {
      expect(() => { (<any> ActorContextPreprocessFollowReachableSourcesMatch)(); }).toThrow();
    });
  });

  describe('An ActorContextPreprocessFollowReachableSourcesMatch instance', () => {
    let actor: ActorContextPreprocessFollowReachableSourcesMatch;
    let rdfResolveQuadPatternBus;
    let rdfResolveQuadPatternObserver;

    beforeEach(() => {
      rdfResolveQuadPatternBus = new Bus({ name: 'rdfDereferenceBus' });
      rdfResolveQuadPatternObserver = new ActionObserverRdfResolveQuadPattern(
        { name: 'myObserver', bus: rdfResolveQuadPatternBus });
      actor = new ActorContextPreprocessFollowReachableSourcesMatch(
        { name: 'actor', bus, rdfResolveQuadPatternObserver });
    });

    it('should test', () => {
      return expect(actor.test({})).resolves.toBeTruthy();
    });

    it('should run without a context', () => {
      return expect(actor.run({})).resolves.toEqual({});
    });

    it('should run with a context without sources', () => {
      return expect(actor.run({ context: ActionContext({}) })).resolves.toEqual({ context: ActionContext({}) });
    });

    it('should run with a context without sources', () => {
      return expect(actor.run({ context: ActionContext({}) })).resolves.toEqual({ context: ActionContext({}) });
    });

    it('should run with a context with sources', async () => {
      const context = ActionContext({
        [KEY_CONTEXT_SOURCES]: AsyncReiterableArray.fromFixedData([
          { type: 'file', value: 'x' },
        ]),
      });
      const output = await actor.run({ context });

      // Block until input sources have been processed
      await new Promise((resolve, reject) => {
        const itIn = context.get(KEY_CONTEXT_SOURCES).iterator();
        itIn.on('data', () => { return; });
        itIn.on('end', resolve);
      });

      expect(output.context.get(KEY_CONTEXT_SOURCES).isEnded()).toBe(false);
      const it = output.context.get(KEY_CONTEXT_SOURCES).iterator();
      expect(it.read()).toEqual({ type: 'file', value: 'x' });
    });

    it('should run with a context with sources and append when the observer encounters new quads', async () => {
      const context = ActionContext({
        [KEY_CONTEXT_SOURCES]: AsyncReiterableArray.fromFixedData([
          { type: 'file', value: 'x' },
        ]),
      });

      const output = await actor.run({ context });

      // Block until input sources have been processed
      await new Promise((resolve, reject) => {
        const itIn = context.get(KEY_CONTEXT_SOURCES).iterator();
        itIn.on('data', () => { return; });
        itIn.on('end', resolve);
      });

      const data = streamifyArray([quad('a', 'b', 'b', 'd')]);
      rdfResolveQuadPatternObserver.onRun(null, null, Promise.resolve({ data }));
      await new Promise((resolve) => data.on('end', resolve));

      expect(output.context.get(KEY_CONTEXT_SOURCES).isEnded()).toBe(false);
      const it = output.context.get(KEY_CONTEXT_SOURCES).iterator();
      expect(it.read()).toEqual({ type: 'file', value: 'x' });
      expect(it.read()).toEqual({ type: 'file', value: 'a', silenceErrors: true });
      expect(it.read()).toEqual({ type: 'file', value: 'b', silenceErrors: true });
      expect(it.read()).toEqual({ type: 'file', value: 'd', silenceErrors: true });
    });
  });
});
