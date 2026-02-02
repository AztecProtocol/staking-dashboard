import { normalizeAddress, checksumAddress, normalizeAddressFields, checksumAddressFields } from '../../../src/utils/address';

describe('Address utilities', () => {
  const validAddress = '0x742D35cC6634C0532925a3B8D7389B23F1234567';
  const normalizedAddress = '0x742d35cc6634c0532925a3b8d7389b23f1234567';

  describe('normalizeAddress', () => {
    it('should convert valid address to lowercase', () => {
      const result = normalizeAddress(validAddress);
      expect(result).toBe(normalizedAddress);
    });

    it('should throw error for invalid address', () => {
      expect(() => normalizeAddress('invalid')).toThrow('Invalid address: invalid');
    });
  });

  describe('checksumAddress', () => {
    it('should convert valid address to checksum format', () => {
      const result = checksumAddress(normalizedAddress);
      expect(result).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should throw error for invalid address', () => {
      expect(() => checksumAddress('invalid')).toThrow('Invalid address: invalid');
    });
  });

  describe('normalizeAddressFields', () => {
    it('should normalize specified address fields', () => {
      const obj = {
        address: validAddress,
        beneficiary: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        amount: '1000',
      };

      const result = normalizeAddressFields(obj, ['address', 'beneficiary']);

      expect(result.address).toBe(normalizedAddress);
      expect(result.beneficiary).toBe('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266');
      expect(result.amount).toBe('1000'); // Non-address field unchanged
    });
  });

  describe('checksumAddressFields', () => {
    it('should checksum specified address fields', () => {
      const obj = {
        address: normalizedAddress,
        beneficiary: normalizedAddress,
        amount: '1000',
      };

      const result = checksumAddressFields(obj, ['address', 'beneficiary']);

      expect(result.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.beneficiary).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.amount).toBe('1000'); // Non-address field unchanged
    });
  });
});
