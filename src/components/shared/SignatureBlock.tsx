import { DOCTOR } from "@/data/constants";
import signatureStamp from "@/assets/signature-stamp.svg";
import type { FC } from "react";

interface Props {
  showSignature: boolean;
  customSignature?: string | null;
}

const SignatureBlock: FC<Props> = ({ showSignature, customSignature }) => {
  const imgSrc = customSignature || signatureStamp;

  return (
    <div className="signature-block">
      <div className="flex flex-col items-center">
        {showSignature ? (
          <>
            <img
              src={imgSrc}
              alt="Firma y sello del médico veterinario"
              className="mb-1 h-20 w-56 object-contain object-left"
            />
            <div className="h-px w-56 border-t-2 border-[#1a365d]" />
          </>
        ) : (
          <div className="h-12 w-56 border-b-2 border-[#1a365d]" />
        )}
      </div>
    </div>
  );
};

export default SignatureBlock;
