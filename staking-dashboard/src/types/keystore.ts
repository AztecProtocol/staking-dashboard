/**
 * Types and interfaces for validator keystore data
 */
import { validateAttesterAddress } from '@/utils/validateAddress'

// Raw keystore data as stored in JSON files
export interface RawKeystoreData {
  attester: string;
  publicKeyG1: {
    x: string;
    y: string;
  };
  publicKeyG2: {
    x0: string;
    x1: string;
    y0: string;
    y1: string;
  };
  proofOfPossession: {
    x: string;
    y: string;
  };
}

// Normalized keystore data used in the UI components
export interface ValidatorKeys {
  attester: string;
  publicKeyG1: {
    x: string;
    y: string;
  };
  publicKeyG2: {
    x: [string, string];
    y: [string, string];
  };
  proofOfPossession: {
    x: string;
    y: string;
  };
}

// Utility functions for keystore data conversion
export const convertRawToValidatorKeys = (
  raw: RawKeystoreData,
): ValidatorKeys => ({
  attester: raw.attester,
  publicKeyG1: raw.publicKeyG1,
  publicKeyG2: {
    x: [raw.publicKeyG2.x0, raw.publicKeyG2.x1],
    y: [raw.publicKeyG2.y0, raw.publicKeyG2.y1],
  },
  proofOfPossession: raw.proofOfPossession,
});

export const validateKeystoreData = (
  data: Partial<RawKeystoreData>,
): boolean => {
  return !!(
    validateAttesterAddress(data.attester as `0x${string}`).isValid &&
    data.publicKeyG1?.x &&
    data.publicKeyG1?.y &&
    data.publicKeyG2?.x0 &&
    data.publicKeyG2?.x1 &&
    data.publicKeyG2?.y0 &&
    data.publicKeyG2?.y1 &&
    data.proofOfPossession?.x &&
    data.proofOfPossession?.y
  );
};

export const validateKeystoreDataWithReason = (
  data: Partial<RawKeystoreData>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate attester address
  if (!data.attester) {
    errors.push('Missing attester address');
  } else {
    const attesterValidation = validateAttesterAddress(data.attester as `0x${string}`);
    if (!attesterValidation.isValid) {
      errors.push(`Invalid attester address: ${attesterValidation.error}`);
    }
  }

  // Validate publicKeyG1
  if (!data.publicKeyG1) {
    errors.push('Missing publicKeyG1 field');
  } else {
    if (!data.publicKeyG1.x) {
      errors.push('Missing publicKeyG1.x value');
    }
    if (!data.publicKeyG1.y) {
      errors.push('Missing publicKeyG1.y value');
    }
  }

  // Validate publicKeyG2
  if (!data.publicKeyG2) {
    errors.push('Missing publicKeyG2 field');
  } else {
    if (!data.publicKeyG2.x0) {
      errors.push('Missing publicKeyG2.x0 value');
    }
    if (!data.publicKeyG2.x1) {
      errors.push('Missing publicKeyG2.x1 value');
    }
    if (!data.publicKeyG2.y0) {
      errors.push('Missing publicKeyG2.y0 value');
    }
    if (!data.publicKeyG2.y1) {
      errors.push('Missing publicKeyG2.y1 value');
    }
  }

  // ValidateproofOfPossession 
  if (!data.proofOfPossession) {
    errors.push('Missing proofOfPossession field');
  } else {
    if (!data.proofOfPossession.x) {
      errors.push('Missing proofOfPossession.x value');
    }
    if (!data.proofOfPossession.y) {
      errors.push('Missing proofOfPossession.y value');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateValidatorKeys = (keys: ValidatorKeys): boolean => {
  return !!(
    keys.attester.trim() !== "" &&
    keys.publicKeyG1.x.trim() !== "" &&
    keys.publicKeyG1.x.trim() !== "0" &&
    keys.publicKeyG1.y.trim() !== "" &&
    keys.publicKeyG1.y.trim() !== "0" &&
    keys.publicKeyG2.x[0].trim() !== "" &&
    keys.publicKeyG2.x[0].trim() !== "0" &&
    keys.publicKeyG2.x[1].trim() !== "" &&
    keys.publicKeyG2.x[1].trim() !== "0" &&
    keys.publicKeyG2.y[0].trim() !== "" &&
    keys.publicKeyG2.y[0].trim() !== "0" &&
    keys.publicKeyG2.y[1].trim() !== "" &&
    keys.publicKeyG2.y[1].trim() !== "0" &&
    keys.proofOfPossession.x.trim() !== "" &&
    keys.proofOfPossession.x.trim() !== "0" &&
    keys.proofOfPossession.y.trim() !== "" &&
    keys.proofOfPossession.y.trim() !== "0"
  );
};
