import { describe, expect, it } from 'vitest';
import {
  port001DevConflict,
  port002DuplicateListener,
  port003UnexpectedExposure,
  port004ProcessUnavailable,
} from '../../../src/detection/rules/ports/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Port Rules (PORT-001 through PORT-004)', () => {
  describe('PORT-001: port.development.conflict', () => {
    it('passes when no conflicts exist and warns when dev port conflict is detected', () => {
      const cleanEv: EvidenceItem[] = [
        {
          key: 'port.listeners',
          source: 'test',
          availability: 'AVAILABLE',
          value: { listeners: [], conflicts: [] },
        },
      ];
      expect(port001DevConflict.evaluate({}, cleanEv).status).toBe('PASS');

      const conflictEv: EvidenceItem[] = [
        {
          key: 'port.listeners',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            conflicts: [
              { port: 3000, address: '127.0.0.1', pid: 9999, processName: 'foreign-service' },
            ],
          },
        },
      ];
      expect(port001DevConflict.evaluate({}, conflictEv).status).toBe('WARN');
    });
  });

  describe('PORT-002: port.duplicate.listener', () => {
    it('warns when duplicate listeners are detected on the same port', () => {
      const cleanEv: EvidenceItem[] = [
        {
          key: 'port.listeners',
          source: 'test',
          availability: 'AVAILABLE',
          value: { duplicates: [] },
        },
      ];
      expect(port002DuplicateListener.evaluate({}, cleanEv).status).toBe('PASS');

      const dupEv: EvidenceItem[] = [
        {
          key: 'port.listeners',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            duplicates: [{ port: 8080, address: '0.0.0.0', isDuplicate: true }],
          },
        },
      ];
      expect(port002DuplicateListener.evaluate({}, dupEv).status).toBe('WARN');
    });
  });

  describe('PORT-003: port.unexpected.exposure', () => {
    it('warns when dev port is exposed on broad 0.0.0.0 address', () => {
      const loopbackEv: EvidenceItem[] = [
        {
          key: 'port.exposure',
          source: 'test',
          availability: 'AVAILABLE',
          value: { port: 3000, listenAddress: '127.0.0.1', isBroadlyExposed: false },
        },
      ];
      expect(port003UnexpectedExposure.evaluate({}, loopbackEv).status).toBe('PASS');

      const exposedEv: EvidenceItem[] = [
        {
          key: 'port.exposure',
          source: 'test',
          availability: 'AVAILABLE',
          value: { port: 3000, listenAddress: '0.0.0.0', isBroadlyExposed: true },
        },
      ];
      expect(port003UnexpectedExposure.evaluate({}, exposedEv).status).toBe('WARN');
    });
  });

  describe('PORT-004: port.process.unavailable', () => {
    it('returns UNAVAILABLE when port owner process cannot be determined', () => {
      const knownEv: EvidenceItem[] = [
        {
          key: 'port.listeners',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            hasUnidentifiedOwner: false,
            listeners: [{ port: 3000, address: '127.0.0.1', ownerKnown: true }],
          },
        },
      ];
      expect(port004ProcessUnavailable.evaluate({}, knownEv).status).toBe('PASS');

      const unknownEv: EvidenceItem[] = [
        {
          key: 'port.listeners',
          source: 'test',
          availability: 'AVAILABLE',
          value: {
            hasUnidentifiedOwner: true,
            listeners: [{ port: 80, address: '0.0.0.0', ownerKnown: false }],
          },
        },
      ];
      expect(port004ProcessUnavailable.evaluate({}, unknownEv).status).toBe('UNAVAILABLE');
    });
  });
});
