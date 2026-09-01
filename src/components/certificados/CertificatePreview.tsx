import type { FC } from "react";
import type { CertificateData } from "@/types";
import { DECLARATION_TEXT, DECLARATION_REQUISITES, CERTIFICATE_TYPES } from "@/data/constants";
import DocumentHeader from "@/components/shared/DocumentHeader";
import SignatureBlock from "@/components/shared/SignatureBlock";

interface Props {
  data: CertificateData;
  showSignature: boolean;
  customSignature?: string | null;
}

const CertificatePreview: FC<Props> = ({ data, showSignature, customSignature }) => {
  const certConfig = CERTIFICATE_TYPES.find((t) => t.value === data.certType);
  const title = certConfig?.title ?? "Certificado";
  const isViaje = data.certType === "viaje";

  return (
    <div className="document-page" id="documento-impresion">
      <DocumentHeader />

      <div className="mt-4 text-center">
        <h2 className="inline-block rounded bg-[#1a365d] px-8 py-1.5 text-base font-bold uppercase tracking-wide text-white">
          {title}
        </h2>
        {!isViaje && (
          <p className="mt-1 text-[12px] font-semibold text-[#2b6cb0]">Consultorio Veterinario Dr. Cedeño</p>
        )}
        {isViaje && (
          <p className="mt-1 text-[12px] font-semibold text-[#2b6cb0]">Declaración Médica Veterinaria</p>
        )}
      </div>

      <table className="mt-4 w-full border-collapse text-[11px]">
        <tbody>
          <tr>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d] w-1/6">Paciente</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.patientName || "—"}</td>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d] w-1/6">Especie</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.species || "—"}</td>
          </tr>
          <tr>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Raza</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.breed || "—"}</td>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Edad</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.age || "—"}</td>
          </tr>
          <tr>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Sexo</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.sex || "—"}</td>
            <td className="border border-[#1a365d] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Color/Marcas</td>
            <td className="border border-[#1a365d] px-2 py-1">{data.colorMarks || "—"}</td>
          </tr>
        </tbody>
      </table>

      <table className="mt-3 w-full border-collapse text-[11px]">
        <thead>
          <tr className="bg-[#2b6cb0] text-white">
            <th className="border border-[#2b6cb0] px-2 py-1.5 text-left font-bold" colSpan={4}>Datos del Propietario</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-[#2b6cb0] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d] w-1/4">Nombre Completo</td>
            <td className="border border-[#2b6cb0] px-2 py-1">{data.ownerName || "—"}</td>
            <td className="border border-[#2b6cb0] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d] w-1/6">Cédula/Pasap.</td>
            <td className="border border-[#2b6cb0] px-2 py-1">{data.idNumber || "—"}</td>
          </tr>
          <tr>
            <td className="border border-[#2b6cb0] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Dirección de Residencia</td>
            <td className="border border-[#2b6cb0] px-2 py-1" colSpan={3}>{data.ownerAddress || "—"}</td>
          </tr>
          <tr>
            <td className="border border-[#2b6cb0] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Teléfono de Contacto</td>
            <td className="border border-[#2b6cb0] px-2 py-1">{data.ownerPhone || "—"}</td>
            {isViaje ? (
              <>
                <td className="border border-[#2b6cb0] bg-[#ebf2f8] px-2 py-1 font-bold text-[#1a365d]">Destino</td>
                <td className="border border-[#2b6cb0] px-2 py-1">{data.destination || "—"}</td>
              </>
            ) : (
              <td className="border border-[#2b6cb0] px-2 py-1" colSpan={2}></td>
            )}
          </tr>
        </tbody>
      </table>

      {/* Certificate body — dynamic fields */}
      <div className="mt-4 border-l-4 border-[#1a365d] bg-[#f7fafc] px-4 py-3">
        {data.motivo && (
          <p className="mb-2 text-justify text-[11px] leading-relaxed text-gray-800">
            <span className="font-bold text-[#1a365d]">Motivo: </span>{data.motivo}
          </p>
        )}
        {data.observaciones && (
          <p className="mb-2 text-justify text-[11px] leading-relaxed text-gray-800">
            <span className="font-bold text-[#1a365d]">Observaciones: </span>{data.observaciones}
          </p>
        )}
        {data.recomendacion && (
          <p className="mb-2 text-justify text-[11px] leading-relaxed text-gray-800">
            <span className="font-bold text-[#1a365d]">Recomendación Médica: </span>{data.recomendacion}
          </p>
        )}
      </div>

      {/* Declaration block — only for viaje (export) certificates */}
      {isViaje && (
        <div className="mt-4 border-l-4 border-[#1a365d] bg-[#f7fafc] px-4 py-3">
          <p className="mb-2 text-[12px] font-bold uppercase text-[#1a365d]">Declaración Médica Veterinaria</p>
          {DECLARATION_TEXT.map((p, i) => (
            <p key={i} className="mb-2 text-justify text-[11px] leading-relaxed text-gray-800">{p}</p>
          ))}
          <ul className="ml-4 list-disc space-y-1">
            {DECLARATION_REQUISITES.map((r, i) => (
              <li key={i} className="text-[11px] leading-relaxed text-gray-800">{r}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-4 text-justify text-[11px] leading-relaxed text-gray-800">
        <span className="font-bold">EXPEDICIÓN:</span> La presente certificación se expide a solicitud de la parte interesada. Dado en la Ciudad de Panamá, a los{" "}
        <span className="font-semibold underline">{data.issueDay || "___"}</span> días del mes de{" "}
        <span className="font-semibold underline">{data.issueMonth || "___"}</span> del año{" "}
        <span className="font-semibold underline">{data.issueYear || "___"}</span>.
      </p>

      {data.vetName && (
        <p className="mt-2 text-[11px] text-gray-700">
          <span className="font-bold">Médico Tratante:</span> {data.vetName}
        </p>
      )}

      <SignatureBlock showSignature={showSignature} customSignature={customSignature} />
    </div>
  );
};

export default CertificatePreview;
