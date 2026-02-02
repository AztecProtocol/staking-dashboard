import { useRef, useState } from "react";
import styles from "./StepUploadKeys.module.css";
import type { RawKeystoreData } from "../../types/keystore";
import {
  convertRawToValidatorKeys,
  validateKeystoreData,
} from "../../types/keystore";

interface StepUploadKeysProps {
  attester: string;
  publicKeyG1: { x: string; y: string };
  publicKeyG2: { x: [string, string]; y: [string, string] };
  signature: { x: string; y: string };
  moveWithLatestRollup: boolean;
  canExecute?: boolean;
  onAttesterChange: (attester: string) => void;
  onPublicKeyG1Change: (key: { x: string; y: string }) => void;
  onPublicKeyG2Change: (key: {
    x: [string, string];
    y: [string, string];
  }) => void;
  onSignatureChange: (sig: { x: string; y: string }) => void;
  onMoveWithLatestRollupChange: (move: boolean) => void;
}

export default function StepUploadKeys({
  attester,
  publicKeyG1,
  publicKeyG2,
  signature,
  // moveWithLatestRollup = true,
  canExecute = true,
  onAttesterChange,
  onPublicKeyG1Change,
  onPublicKeyG2Change,
  onSignatureChange,
  onMoveWithLatestRollupChange,
}: StepUploadKeysProps) {
  const canEdit = canExecute;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setUploadError("Please select a valid JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rawKeystoreData: RawKeystoreData = JSON.parse(content);

        if (!validateKeystoreData(rawKeystoreData)) {
          throw new Error("Invalid keystore format");
        }

        const validatorKeys = convertRawToValidatorKeys(rawKeystoreData);
        onAttesterChange(validatorKeys.attester);
        onPublicKeyG1Change(validatorKeys.publicKeyG1);
        onPublicKeyG2Change(validatorKeys.publicKeyG2);
        onSignatureChange(validatorKeys.proofOfPossession);

        setUploadedFile(file.name);
        setUploadError(null);
      } catch (error) {
        setUploadError("Invalid JSON format or missing required fields");
        setUploadedFile(null);
        console.log("Failed to upload file", error);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.keysContainer}>
      <div className={styles.stepDescription}>
        Upload your validator keys and provide necessary validator
        configuration.
      </div>

      <div className={styles.uploadSection}>
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={!canEdit}
          className={styles.uploadButton}
        >
          Select JSON Keystore File
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        {uploadedFile && (
          <div className={styles.uploadSuccess}>✓ Uploaded: {uploadedFile}</div>
        )}
        {uploadError && <div className={styles.uploadError}>{uploadError}</div>}
      </div>

      <div className={styles.keysSection}>
        <div className={styles.keyGroup}>
          <label>Attester Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={attester}
            disabled={!canEdit}
            onChange={(e) => onAttesterChange(e.target.value)}
            className={styles.attesterInput}
          />
        </div>

        <div className={styles.keyGroup}>
          <label>Public Key G1 (x, y)</label>
          <div className={styles.coordinateInputs}>
            <input
              type="text"
              placeholder="x coordinate"
              value={publicKeyG1.x}
              disabled={!canEdit}
              onChange={(e) =>
                onPublicKeyG1Change({
                  ...publicKeyG1,
                  x: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="y coordinate"
              value={publicKeyG1.y}
              disabled={!canEdit}
              onChange={(e) =>
                onPublicKeyG1Change({
                  ...publicKeyG1,
                  y: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className={styles.keyGroup}>
          <label>Public Key G2 (x[0], x[1], y[0], y[1])</label>
          <div className={`${styles.coordinateInputs} ${styles.g2}`}>
            <input
              type="text"
              placeholder="x[0]"
              value={publicKeyG2.x[0]}
              disabled={!canEdit}
              onChange={(e) =>
                onPublicKeyG2Change({
                  ...publicKeyG2,
                  x: [e.target.value, publicKeyG2.x[1]],
                })
              }
            />
            <input
              type="text"
              placeholder="x[1]"
              value={publicKeyG2.x[1]}
              disabled={!canEdit}
              onChange={(e) =>
                onPublicKeyG2Change({
                  ...publicKeyG2,
                  x: [publicKeyG2.x[0], e.target.value],
                })
              }
            />
            <input
              type="text"
              placeholder="y[0]"
              value={publicKeyG2.y[0]}
              disabled={!canEdit}
              onChange={(e) =>
                onPublicKeyG2Change({
                  ...publicKeyG2,
                  y: [e.target.value, publicKeyG2.y[1]],
                })
              }
            />
            <input
              type="text"
              placeholder="y[1]"
              value={publicKeyG2.y[1]}
              disabled={!canEdit}
              onChange={(e) =>
                onPublicKeyG2Change({
                  ...publicKeyG2,
                  y: [publicKeyG2.y[0], e.target.value],
                })
              }
            />
          </div>
        </div>

        <div className={styles.keyGroup}>
          <label>Signature (x, y)</label>
          <div className={styles.coordinateInputs}>
            <input
              type="text"
              placeholder="x coordinate"
              value={signature.x}
              disabled={!canEdit}
              onChange={(e) =>
                onSignatureChange({
                  ...signature,
                  x: e.target.value,
                })
              }
            />
            <input
              type="text"
              placeholder="y coordinate"
              value={signature.y}
              disabled={!canEdit}
              onChange={(e) =>
                onSignatureChange({
                  ...signature,
                  y: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className={styles.governanceSection}>
          <label htmlFor="move-with-rollup">Follow Aztec governance</label>
          <select
            id="move-with-rollup"
            value="true"
            disabled={true}
            onChange={(e) =>
              onMoveWithLatestRollupChange(e.target.value === "true")
            }
          >
            <option value="true">Yes</option>
          </select>
          <div className={styles.governanceNote}>
            Whether validator follows network governance automatically.
          </div>
        </div>
      </div>
    </div>
  );
}
