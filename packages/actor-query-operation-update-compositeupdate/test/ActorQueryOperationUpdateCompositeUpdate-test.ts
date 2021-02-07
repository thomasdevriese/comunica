import {ActorQueryOperation, Bindings} from "@comunica/bus-query-operation";
import {Bus} from "@comunica/core";
import {ArrayIterator} from "asynciterator";
import {literal, variable} from "@rdfjs/data-model";
import {ActorQueryOperationUpdateCompositeUpdate} from "../lib/ActorQueryOperationUpdateCompositeUpdate";
const arrayifyStream = require('arrayify-stream');

describe('ActorQueryOperationUpdateCompositeUpdate', () => {
  let bus;
  let mediatorQueryOperation;

  beforeEach(() => {
    bus = new Bus({ name: 'bus' });
    mediatorQueryOperation = {
      mediate: (arg) => Promise.resolve({
        bindingsStream: new ArrayIterator([
          Bindings({ a: literal('1') }),
          Bindings({ a: literal('2') }),
          Bindings({ a: literal('3') }),
        ]),
        metadata: () => Promise.resolve({ totalItems: 3 }),
        operated: arg,
        type: 'bindings',
        variables: ['a'],
      }),
    };
  });

  describe('The ActorQueryOperationUpdateCompositeUpdate module', () => {
    it('should be a function', () => {
      expect(ActorQueryOperationUpdateCompositeUpdate).toBeInstanceOf(Function);
    });

    it('should be a ActorQueryOperationUpdateCompositeUpdate constructor', () => {
      expect(new (<any> ActorQueryOperationUpdateCompositeUpdate)({ name: 'actor', bus, mediatorQueryOperation }))
        .toBeInstanceOf(ActorQueryOperationUpdateCompositeUpdate);
      expect(new (<any> ActorQueryOperationUpdateCompositeUpdate)({ name: 'actor', bus, mediatorQueryOperation }))
        .toBeInstanceOf(ActorQueryOperation);
    });

    it('should not be able to create new ActorQueryOperationUpdateCompositeUpdate objects without \'new\'', () => {
      expect(() => { (<any> ActorQueryOperationUpdateCompositeUpdate)(); }).toThrow();
    });
  });

  describe('An ActorQueryOperationUpdateCompositeUpdate instance', () => {
    let actor: ActorQueryOperationUpdateCompositeUpdate;

    beforeEach(() => {
      actor = new ActorQueryOperationUpdateCompositeUpdate({ name: 'actor', bus, mediatorQueryOperation });
    });

    it('should test on compositeupdate', () => {
      const op = { operation: { type: 'compositeupdate' } };
      return expect(actor.test(op)).resolves.toBeTruthy();
    });

    it('should not test on non-compositeupdate', () => {
      const op = { operation: { type: 'some-other-type' } };
      return expect(actor.test(op)).rejects.toBeTruthy();
    });

    it('should run', () => {
      const op = { operation: { type: 'compositeupdate' } };
      return expect(actor.run(op)).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
