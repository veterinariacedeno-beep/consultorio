import { CLINIC } from "@/data/constants";

export default function DocumentHeader() {
  return (
    <div style={{ textAlign: "center", marginBottom: "15px" }}>
      <h1 style={{ fontSize: "20px", color: "#1a365d", margin: 0, fontWeight: "bold" }}>
        {CLINIC.title}
      </h1>
      <p style={{ fontSize: "12px", margin: "2px 0", color: "#334155" }}>
        R.U.C. {CLINIC.ruc}
      </p>
      <p style={{ fontSize: "12px", margin: "2px 0", color: "#334155" }}>
        {CLINIC.address} | Tel: {CLINIC.phone} | Cel: {CLINIC.cell}
      </p>
      <p style={{ fontSize: "11px", margin: "2px 0", color: "#334155" }}>
        Horario: {CLINIC.hours}
      </p>
      <hr style={{ border: "none", borderTop: "2px solid #1a365d", margin: "10px 0 20px 0" }} />
    </div>
  );
}
