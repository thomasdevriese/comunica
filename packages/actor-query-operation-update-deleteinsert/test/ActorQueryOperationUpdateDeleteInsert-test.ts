import {ActorQueryOperation, Bindings} from "@comunica/bus-query-operation";
import {Bus} from "@comunica/core";
import {ArrayIterator} from "asynciterator";
import {literal, variable} from "@rdfjs/data-model";
import {ActorQueryOperationUpdateDeleteInsert} from "../lib/ActorQueryOperationUpdateDeleteInsert";
const arrayifyStream = require('arrayify-stream');

describe('ActorQueryOperationUpdateDeleteInsert', () => {
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

  describe('The ActorQueryOperationUpdateDeleteInsert module', () => {
    it('should be a function', () => {
      expect(ActorQueryOperationUpdateDeleteInsert).toBeInstanceOf(Function);
    });

    it('should be a ActorQueryOperationUpdateDeleteInsert constructor', () => {
      expect(new (<any> ActorQueryOperationUpdateDeleteInsert)({ name: 'actor', bus, mediatorQueryOperation }))
        .toBeInstanceOf(ActorQueryOperationUpdateDeleteInsert);
      expect(new (<any> ActorQueryOperationUpdateDeleteInsert)({ name: 'actor', bus, mediatorQueryOperation }))
        .toBeInstanceOf(ActorQueryOperation);
    });

    it('should not be able to create new ActorQueryOperationUpdateDeleteInsert objects without \'new\'', () => {
      expect(() => { (<any> ActorQueryOperationUpdateDeleteInsert)(); }).toThrow();
    });
  });

  describe('An ActorQueryOperationUpdateDeleteInsert instance', () => {
    let actor: ActorQueryOperationUpdateDeleteInsert;

    beforeEach(() => {
      actor = new ActorQueryOperationUpdateDeleteInsert({ name: 'actor', bus, mediatorQueryOperation });
    });

    it('should test on deleteinsert', () => {
      const op = { operation: { type: 'deleteinsert' } };
      return expect(actor.test(op)).resolves.toBeTruthy();
    });

    it('should not test on non-deleteinsert', () => {
      const op = { operation: { type: 'some-other-type' } };
      return expect(actor.test(op)).rejects.toBeTruthy();
    });

    it('should run', () => {
      const op = { operation: { type: 'deleteinsert' } };
      return expect(actor.run(op)).resolves.toMatchObject({ todo: true }); // TODO
    });
  });
});
