import { describe, expect, it } from 'vitest';
import {
  net001InterfaceUnavailable,
  net002DnsMissing,
  net003ProxySuspicious,
  net004RouteUnavailable,
} from '../../../src/detection/rules/network/index.js';
import type { EvidenceItem } from '../../../src/domain/evidence.js';

describe('Network Rules (NET-001 through NET-004)', () => {
  describe('NET-001: network.interface.unavailable', () => {
    it('returns PASS when interfaces are available and UNAVAILABLE when missing', () => {
      const availEv: EvidenceItem[] = [
        { key: 'network.interfaces', source: 'test', availability: 'AVAILABLE' },
      ];
      expect(net001InterfaceUnavailable.evaluate({}, availEv).status).toBe('PASS');

      const unavailEv: EvidenceItem[] = [
        { key: 'network.interfaces', source: 'test', availability: 'UNAVAILABLE' },
      ];
      expect(net001InterfaceUnavailable.evaluate({}, unavailEv).status).toBe('UNAVAILABLE');
    });
  });

  describe('NET-002: network.dns.configuration.missing', () => {
    it('passes when usable DNS servers exist and warns when missing', () => {
      const dnsEv: EvidenceItem[] = [
        {
          key: 'network.dns',
          source: 'test',
          availability: 'AVAILABLE',
          value: { servers: ['8.8.8.8'] },
        },
      ];
      expect(net002DnsMissing.evaluate({}, dnsEv).status).toBe('PASS');

      const noDnsEv: EvidenceItem[] = [
        { key: 'network.dns', source: 'test', availability: 'AVAILABLE', value: { servers: [] } },
      ];
      expect(net002DnsMissing.evaluate({}, noDnsEv).status).toBe('WARN');
    });
  });

  describe('NET-003: network.proxy.configuration.suspicious', () => {
    it('skips when proxy is absent, warns when malformed without exposing credentials', () => {
      expect(net003ProxySuspicious.isApplicable({}, [])).toBe(false);

      const malformedEv: EvidenceItem[] = [
        {
          key: 'network.proxy',
          source: 'test',
          availability: 'AVAILABLE',
          value: { isPresent: true, isMalformed: true, proxyVarName: 'HTTPS_PROXY' },
        },
      ];
      expect(net003ProxySuspicious.isApplicable({}, malformedEv)).toBe(true);
      const evalResult = net003ProxySuspicious.evaluate({}, malformedEv);
      expect(evalResult.status).toBe('WARN');
      expect(evalResult.finding?.summary).toContain('HTTPS_PROXY');
    });
  });

  describe('NET-004: network.route.configuration.unavailable', () => {
    it('returns PASS when routes are available and UNAVAILABLE when missing', () => {
      const availEv: EvidenceItem[] = [
        { key: 'network.routes', source: 'test', availability: 'AVAILABLE' },
      ];
      expect(net004RouteUnavailable.evaluate({}, availEv).status).toBe('PASS');

      const unavailEv: EvidenceItem[] = [
        { key: 'network.routes', source: 'test', availability: 'FAILED' },
      ];
      expect(net004RouteUnavailable.evaluate({}, unavailEv).status).toBe('UNAVAILABLE');
    });
  });
});
