import { useEffect } from "react";
import type { QuoteTotals } from "../helpers/calculateQuoteTotals.ts";
import type { QuoteDetail, QuoteItem } from "../services/quoteService.ts";

type QuotePdfTemplateProps = {
  quote: QuoteDetail;
  items: QuoteItem[];
  quoteTotals: QuoteTotals;
  moneyFormatter: Intl.NumberFormat;
};

type IssuerSnapshot = {
  profile_name?: string | null;
  issuer_type?: string | null;
  legal_name?: string | null;
  commercial_name?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  tax_responsibility?: string | null;
  city?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  bank_name?: string | null;
  bank_account_type?: string | null;
  bank_account_number?: string | null;
  footer_notes?: string | null;
  logo_url?: string | null;
};

type QuoteTermsSource = QuoteDetail & {
  warranty_terms?: string | null;
  conditions_terms?: string | null;
  commercial_terms?: string | null;
  notes_terms?: string | null;
  exclusions?: string | null;
  exclusions_terms?: string | null;
};

const DEFAULT_WARRANTY = `Se otorga una garantía de 2 meses sobre la instalación realizada.`;

const DEFAULT_CONDITIONS = `• No aplica garantía sobre equipos suministrados por el cliente.\n• No cubre daños ocasionados por:\n  ✓ Fluctuaciones o picos de energía.\n  ✓ Manipulación indebida por terceros.\n  ✓ Cambios posteriores en ubicación o configuración del sistema.`;

const DEFAULT_NOTES = `• La presente cotización tiene una vigencia de 7 días calendario a partir de su fecha de emisión.\n• Los precios indicados están sujetos a cambios según disponibilidad y fluctuaciones de precios de nuestros proveedores.\n• Tiempo estimado de ejecución del servicio: entre 1 y 2 días, según condiciones técnicas del lugar.\n• Disponibilidad para programación del servicio: sábados, domingos, lunes y martes.\n• Forma de pago: 60 % al iniciar el trabajo y 40 % al finalizar la instalación.`;

const DEFAULT_EXCLUSIONS = `Esta cotización NO incluye:\n• Video balunes\n• Fuentes de poder\n• Caja de paso (10x10)\n• Multitomas\n• Elementos adicionales no especificados\n\nEn caso de que algún equipo suministrado por el cliente no funcione, sea incompatible o presente fallas durante la instalación, se notificará al cliente y su reposición tendrá un costo adicional.`;

const getIssuerSnapshot = (quote: QuoteDetail): IssuerSnapshot => {
  const snapshot = quote.issuer_snapshot;

  if (!snapshot || typeof snapshot !== "object") return {};

  return snapshot as IssuerSnapshot;
};

const formatDate = (value?: string | null) => {
  if (!value) return "No registrada";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("es-CO", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(date);
};

const getUnit = (item: QuoteItem) =>
  item.quote_unit ?? item.unit_type ?? "unidad";

const getUnitLabel = (unit?: string | null) => {
  const normalizedUnit = unit?.trim() || "unidad";

  const labels: Record<string, string> = {
    unidad: "unidades",
    metro: "metros",
    hora: "horas",
    punto: "puntos",
    tramo: "tramos",
    rollo: "rollos",
    caja: "cajas",
    paquete: "paquetes",
    kit: "kits",
    servicio: "servicios",
  };

  return labels[normalizedUnit] ?? normalizedUnit;
};

const getItemTypeLabel = (itemType: QuoteItem["item_type"]) => {
  const labels: Record<QuoteItem["item_type"], string> = {
    product: "Producto",
    technical_catalog: "Catálogo técnico",
    labor: "Mano de obra",
    logistics: "Logística",
    manual: "Ítem manual",
  };

  return labels[itemType] ?? "Ítem";
};

const getInitialsDateDiff = (start?: string | null, end?: string | null) => {
  if (!start || !end) return "7 días calendario";

  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return "7 días calendario";
  }

  const diff = Math.round((endDate.getTime() - startDate.getTime()) / 86400000);

  return diff > 0 ? `${diff} días calendario` : "7 días calendario";
};

const getTotalCardClass = (quoteTotals: QuoteTotals) => {
  return quoteTotals.shouldApplyTax
    ? "pdf-total-box with-tax"
    : "pdf-total-box";
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const QuotePdfTemplate = ({
  quote,
  items,
  quoteTotals,
  moneyFormatter,
}: QuotePdfTemplateProps) => {
  const issuer = getIssuerSnapshot(quote);
  const termsSource = quote as QuoteTermsSource;

  const issuerName =
    issuer.legal_name ?? quote.issuer_profile_name ?? "Emisor no asignado";
  const commercialName = issuer.commercial_name ?? "ADDA Seguridad";
  const documentLabel = [issuer.document_type, issuer.document_number]
    .filter(Boolean)
    .join(" ");
  const bankLabel = [
    issuer.bank_name,
    issuer.bank_account_type,
    issuer.bank_account_number,
  ]
    .filter(Boolean)
    .join(" · ");
  const validityLabel = getInitialsDateDiff(
    quote.issue_date,
    quote.expiration_date,
  );
  const printTitle = slugify(
    issuerName || commercialName || "emisor-adda-seguridad",
  );
  const footerContact = [
    "3015068866",
    "3102970477",
    issuer.email ?? "addaseguridad23@gmail.com",
    "Villeta Cundinamarca",
  ].join(" / ");

  const hasDiscount = items.some((item) => Number(item.discount ?? 0) > 0);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = printTitle || previousTitle;

    return () => {
      document.title = previousTitle;
    };
  }, [printTitle]);

  const warranty = termsSource.warranty_terms || DEFAULT_WARRANTY;
  const conditions = termsSource.conditions_terms || DEFAULT_CONDITIONS;
  const notes =
    termsSource.notes_terms ||
    termsSource.commercial_terms ||
    issuer.footer_notes ||
    DEFAULT_NOTES;
  const exclusions =
    termsSource.exclusions_terms ||
    termsSource.exclusions ||
    DEFAULT_EXCLUSIONS;

  return (
    <article className="pdf-document">
      <style>{`
        .pdf-document {
          --adda-blue: #092B5F;
          --adda-blue-2: #2D5398;
          --adda-teal: #087D8F;
          --adda-ink: #071831;
          --adda-muted: #526174;
          --adda-border: #B8C7DB;
          --adda-soft: #F7FAFC;
          --adda-gold: #F4A51C;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: #ffffff;
          color: var(--adda-ink);
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          font-size: 9.5px;
          line-height: 1.28;
          box-sizing: border-box;
          position: relative;
          overflow: visible;
        }

        .pdf-print-shell {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .pdf-print-shell td {
          padding: 0;
          border: 0;
        }

        .pdf-repeat-head {
          display: table-header-group;
        }

        .pdf-repeat-foot {
          display: table-footer-group;
        }

        .pdf-repeat-head-cell {
          height: 6mm;
          background: #ffffff;
          vertical-align: top;
        }

        .pdf-repeat-foot-cell {
          height: 15mm;
          background: #ffffff;
          vertical-align: bottom;
        }

        .pdf-page {
          min-height: 276mm;
          padding: 8mm 8mm 6mm;
          box-sizing: border-box;
          position: relative;
        }

        .pdf-top-ribbon {
          height: 5mm;
          margin: 0 5mm;
          background: linear-gradient(90deg, var(--adda-blue) 0 68%, var(--adda-teal) 68% 72%, #e5e7eb 72% 100%);
        }

        .pdf-print-footer {
          height: 13mm;
          display: grid;
          grid-template-rows: 7mm 6mm;
        }

        .pdf-bottom-ribbon {
          margin: 0 5mm;
          background: linear-gradient(90deg, #e5e7eb 0 18%, var(--adda-blue) 18% 82%, var(--adda-teal) 82% 86%, #e5e7eb 86% 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 7px;
          letter-spacing: 0.42em;
          font-weight: 900;
          text-transform: uppercase;
        }

        .pdf-footer-contact-line {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 5mm;
          background: #ffffff;
          color: var(--adda-blue);
          font-size: 7.2px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .pdf-header {
          display: grid;
          grid-template-columns: 52mm 1fr 51mm;
          gap: 8mm;
          align-items: start;
          margin-top: 2mm;
        }

        .pdf-brand {
          display: flex;
          gap: 0;
          align-items: center;
        }

        .pdf-logo {
          width: 45mm;
          height: 28mm;
          object-fit: contain;
          object-position: left center;
          display: block;
        }

        .pdf-shield {
          width: 16mm;
          height: 16mm;
          border: 2px solid var(--adda-blue);
          border-radius: 7mm 7mm 9mm 9mm;
          display: grid;
          place-items: center;
          color: var(--adda-blue);
          font-size: 18px;
          font-weight: 900;
          flex: 0 0 auto;
        }

        .pdf-brand-title {
          font-size: 20px;
          line-height: 0.88;
          font-weight: 950;
          color: var(--adda-blue);
          letter-spacing: -0.04em;
          text-transform: uppercase;
        }

        .pdf-brand-subtitle {
          margin-top: 1.2mm;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.34em;
          color: var(--adda-blue);
          text-transform: uppercase;
        }

        .pdf-slogan {
          margin-top: 2mm;
          color: var(--adda-blue);
          font-size: 7px;
          font-weight: 700;
        }

        .pdf-kicker {
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--adda-blue-2);
        }

        .pdf-title {
          margin-top: 2mm;
          font-size: 22px;
          line-height: 1.03;
          font-weight: 950;
          color: var(--adda-blue);
          text-transform: uppercase;
          letter-spacing: -0.03em;
        }

        .pdf-subtitle {
          margin-top: 3mm;
          max-width: 82mm;
          font-size: 9.5px;
          line-height: 1.45;
          color: var(--adda-muted);
        }

        .pdf-number-box {
          background: var(--adda-blue);
          color: #fff;
          padding: 7mm 5mm 4mm;
          min-height: 26mm;
          box-sizing: border-box;
        }

        .pdf-number-label {
          font-size: 8px;
          font-weight: 900;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .pdf-number {
          margin-top: 2mm;
          font-size: 18px;
          font-weight: 950;
          line-height: 1.12;
          word-break: break-word;
        }

        .pdf-gold-line {
          width: 16mm;
          height: 1px;
          background: var(--adda-gold);
          margin-top: 3mm;
          position: relative;
        }

        .pdf-gold-line::before {
          content: "";
          position: absolute;
          left: 0;
          top: -2px;
          width: 4px;
          height: 4px;
          border-radius: 999px;
          border: 1px solid var(--adda-gold);
          background: var(--adda-blue);
        }

        .pdf-date-stack {
          padding: 3mm 0 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5mm;
          color: var(--adda-ink);
        }

        .pdf-date-item {
          display: grid;
          grid-template-columns: 6mm 1fr;
          gap: 1.5mm;
          align-items: center;
          min-width: 0;
        }

        .pdf-icon {
          width: 5.5mm;
          height: 5.5mm;
          border-radius: 1.5mm;
          display: grid;
          place-items: center;
          color: var(--adda-blue);
          font-weight: 900;
          font-size: 10px;
        }

        .pdf-date-title {
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .pdf-date-text {
          margin-top: 0.4mm;
          font-size: 7.4px;
          line-height: 1.2;
          color: var(--adda-ink);
        }

        .pdf-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3mm;
          margin-top: 7mm;
        }

        .pdf-card {
          border: 1px solid var(--adda-border);
          border-radius: 2mm;
          min-height: 33mm;
          display: grid;
          grid-template-columns: 16mm 1fr;
          overflow: visible;
        }

        .pdf-card-icon {
          background: var(--adda-blue);
          color: #fff;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: 900;
        }

        .pdf-card-content {
          padding: 7mm 5mm 4mm;
          position: relative;
        }

        .pdf-card-label {
          position: absolute;
          top: -1px;
          left: 5mm;
          transform: none;
          background: var(--adda-blue);
          color: white;
          padding: 1.2mm 5mm;
          border-radius: 0 0 0.8mm 0.8mm;
          font-size: 8px;
          font-weight: 950;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .pdf-card-title {
          margin-top: 1mm;
          font-size: 12.5px;
          font-weight: 950;
          color: var(--adda-blue);
          text-transform: uppercase;
        }

        .pdf-card-subtitle {
          margin-top: 1mm;
          font-size: 9px;
          font-weight: 900;
          color: var(--adda-ink);
          text-transform: uppercase;
        }

        .pdf-list {
          margin-top: 2.5mm;
          display: grid;
          gap: 1.25mm;
          color: var(--adda-ink);
          font-size: 7px;
        }

        .pdf-list-row {
          display: grid;
          grid-template-columns: 5mm 1fr;
          gap: 1mm;
          align-items: start;
        }

        .pdf-list-dot {
          color: var(--adda-blue-2);
          font-weight: 900;
          text-align: center;
        }

        .pdf-scope {
          margin-top: 3mm;
          border: 1px solid var(--adda-border);
          border-radius: 2mm;
          display: grid;
          grid-template-columns: 16mm 1fr;
          overflow: visible;
          min-height: 13mm;
        }

        .pdf-scope-title {
          color: var(--adda-blue);
          font-size: 9.5px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .pdf-scope-text {
          margin-top: 1.5mm;
          font-size: 9.5px;
          line-height: 1.4;
          color: var(--adda-ink);
          white-space: pre-line;
        }

        .pdf-section-title {
          margin: 4mm 0 1.5mm;
          font-size: 9.5px;
          font-weight: 950;
          color: var(--adda-blue);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .pdf-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid var(--adda-border);
          table-layout: fixed;
        }

        .pdf-table th {
          background: var(--adda-blue);
          color: #fff;
          padding: 1.8mm 2mm;
          font-size: 7px;
          font-weight: 950;
          text-transform: uppercase;
          border-right: 1px solid rgba(255,255,255,0.22);
        }

        .pdf-table td {
          padding: 2.1mm 2.2mm;
          border-bottom: 1px solid #edf1f6;
          border-right: 1px solid #edf1f6;
          vertical-align: top;
        }

        .pdf-item-number {
          color: var(--adda-blue-2);
          font-size: 12px;
          font-weight: 950;
          text-align: center;
        }

        .pdf-item-meta {
          color: var(--adda-blue-2);
          font-size: 7.5px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .pdf-item-name {
          margin-top: 0.8mm;
          font-size: 9.5px;
          line-height: 1.18;
          font-weight: 950;
          color: var(--adda-ink);
        }

        .pdf-item-description {
          margin-top: 1mm;
          color: #374151;
          font-size: 6.8px;
          line-height: 1.38;
        }

        .pdf-item-notes {
          margin-top: 1.5mm;
          color: #374151;
          font-size: 7px;
          line-height: 1.35;
        }

        .pdf-num {
          text-align: right;
          font-weight: 800;
          color: #1f2937;
        }

        .pdf-money-strong {
          text-align: right;
          font-size: 12px;
          font-weight: 950;
          color: var(--adda-blue);
        }

        .pdf-total-row td {
          padding: 0;
          border-bottom: 0;
        }

        .pdf-total-wrapper {
          display: flex;
          justify-content: flex-end;
          padding: 3mm 0 0;
          width: 100%;
          box-sizing: border-box;
        }

        .pdf-total-box {
          margin: 0;
          width: 65mm;
          border: 1px solid var(--adda-border);
          border-radius: 2mm;
          overflow: visible;
          background: #fff;
        }

        .pdf-total-line {
          display: flex;
          justify-content: space-between;
          gap: 6mm;
          padding: 2mm 4mm;
          border-bottom: 1px solid #edf1f6;
          font-size: 9.5px;
        }

        .pdf-total-line span:first-child {
          font-weight: 950;
          color: var(--adda-blue);
          text-transform: uppercase;
        }

        .pdf-total-final {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6mm;
          padding: 2.8mm 4mm;
          background: var(--adda-blue);
          color: #fff;
          font-size: 13px;
          font-weight: 950;
        }

        .pdf-total-final strong {
          color: var(--adda-gold);
          font-size: 14px;
          white-space: nowrap;
        }

        .pdf-total-line strong {
          white-space: nowrap;
          text-align: right;
        }

        .pdf-terms-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 2.5mm;
          margin-top: 5mm;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .pdf-term-card {
          border: 1px solid var(--adda-border);
          border-radius: 2mm;
          min-height: 36mm;
          padding: 3mm 3mm;
          box-sizing: border-box;
          page-break-inside: avoid;
        }

        .pdf-term-header {
          display: flex;
          align-items: center;
          gap: 2mm;
          color: var(--adda-blue);
          font-size: 9px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .pdf-term-icon {
          width: 7mm;
          height: 7mm;
          border: 1px solid var(--adda-border);
          border-radius: 99px;
          display: grid;
          place-items: center;
          font-size: 12px;
        }

        .pdf-term-body {
          margin-top: 3mm;
          white-space: pre-line;
          color: var(--adda-ink);
          font-size: 6.8px;
          line-height: 1.34;
        }

        .pdf-signatures {
          display: grid;
          grid-template-columns: 1fr 1fr;
          align-items: end;
          gap: 22mm;
          margin-top: 5mm;
          padding: 0 7mm;
        }

        .pdf-signature-line {
          border-top: 1px solid var(--adda-blue);
          padding-top: 1.5mm;
          text-align: center;
          color: var(--adda-blue);
          font-size: 8px;
          font-weight: 950;
          text-transform: uppercase;
        }

        .pdf-contact-strip {
          border: 1px solid var(--adda-border);
          border-radius: 1.5mm;
          padding: 2.5mm 4mm;
          display: flex;
          justify-content: center;
          gap: 6mm;
          color: var(--adda-ink);
          font-size: 8px;
          background: #fff;
        }

        .pdf-muted {
          color: var(--adda-muted);
        }

        .pdf-page-break-safe {
          page-break-inside: avoid;
          break-inside: avoid;
        }

        @media print {
          @page {
            size: A4;
            margin: 0.5cm 0 0.5cm 0;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .pdf-document {
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          .pdf-print-shell {
            width: 210mm !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }

          .pdf-repeat-head {
            display: table-header-group !important;
          }

          .pdf-repeat-foot {
            display: table-footer-group !important;
          }

          .pdf-repeat-head-cell {
            height: 7mm !important;
            vertical-align: top !important;
          }

          .pdf-repeat-foot-cell {
            height: 0 !important;
            vertical-align: bottom !important;
          }

          .pdf-print-footer {
            position: fixed !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 8mm !important;
            height: 13mm !important;
            z-index: 999 !important;
          }

          .pdf-page {
            min-height: auto !important;
            padding: 7mm 8mm 18mm !important;
            page-break-after: auto;
            overflow: visible !important;
          }

          .pdf-top-ribbon {
            height: 5mm !important;
          }

          .pdf-header,
          .pdf-info-grid,
          .pdf-scope,
          .pdf-section-title,
          .pdf-terms-grid,
          .pdf-signatures {
            position: relative;
            z-index: 1;
          }

          .pdf-table {
            page-break-inside: auto;
          }

          .pdf-table thead {
            display: table-header-group;
          }

          .pdf-table tfoot {
            display: table-footer-group;
          }

          .pdf-table tr,
          .pdf-term-card,
          .pdf-card,
          .pdf-scope,
          .pdf-total-box {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .pdf-total-wrapper {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 8mm;
          }

          .pdf-table tbody tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .pdf-terms-grid {
            margin-top: 6mm !important;
          }
        }
      `}</style>

      <table className="pdf-print-shell">
        <thead className="pdf-repeat-head">
          <tr>
            <td className="pdf-repeat-head-cell">
              <div className="pdf-top-ribbon" />
            </td>
          </tr>
        </thead>

        <tfoot className="pdf-repeat-foot">
          <tr>
            <td className="pdf-repeat-foot-cell">
              <div className="pdf-print-footer">
                <div className="pdf-bottom-ribbon">
                  Protección y confiabilidad a tu alcance
                </div>
                <div className="pdf-footer-contact-line">{footerContact}</div>
              </div>
            </td>
          </tr>
        </tfoot>

        <tbody>
          <tr>
            <td>
              <div className="pdf-page">
                <header className="pdf-header pdf-page-break-safe">
                  <section>
                    <div className="pdf-brand">
                      <img
                        src="/brands/logo-adda-tres.jpg"
                        alt="Logo ADDA Seguridad"
                        className="pdf-logo"
                      />
                    </div>
                  </section>

                  <section>
                    <div className="pdf-kicker">Propuesta comercial</div>
                    <h1 className="pdf-title">
                      Cotización técnica y comercial
                    </h1>
                    <p className="pdf-subtitle">
                      Soluciones de seguridad electrónica, CCTV, intrusión,
                      instalación y mantenimiento.
                    </p>
                  </section>

                  <section>
                    <div className="pdf-number-box">
                      <div className="pdf-number-label">Cotización</div>
                      <div className="pdf-number">{quote.quote_number}</div>
                      <div className="pdf-gold-line" />
                    </div>

                    <div className="pdf-date-stack">
                      <div className="pdf-date-item">
                        <div className="pdf-icon">▣</div>
                        <div>
                          <div className="pdf-date-title">Emisión:</div>
                          <div className="pdf-date-text">
                            {formatDate(quote.issue_date)}
                          </div>
                        </div>
                      </div>

                      <div className="pdf-date-item">
                        <div className="pdf-icon">◷</div>
                        <div>
                          <div className="pdf-date-title">Vigencia:</div>
                          <div className="pdf-date-text">
                            {formatDate(quote.expiration_date)} ({validityLabel}
                            )
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                </header>

                <section className="pdf-info-grid pdf-page-break-safe">
                  <div className="pdf-card">
                    <div className="pdf-card-icon">▥</div>
                    <div className="pdf-card-content">
                      <div className="pdf-card-label">Emisor</div>
                      <div className="pdf-card-title">{commercialName}</div>
                      <div className="pdf-card-subtitle">{issuerName}</div>

                      <div className="pdf-list">
                        {documentLabel && (
                          <div className="pdf-list-row">
                            <span className="pdf-list-dot">▧</span>
                            <span>{documentLabel}</span>
                          </div>
                        )}
                        {issuer.tax_responsibility && (
                          <div className="pdf-list-row">
                            <span className="pdf-list-dot">▧</span>
                            <span>{issuer.tax_responsibility}</span>
                          </div>
                        )}
                        {issuer.phone && (
                          <div className="pdf-list-row">
                            <span className="pdf-list-dot">☏</span>
                            <span>Tel: {issuer.phone}</span>
                          </div>
                        )}
                        {issuer.email && (
                          <div className="pdf-list-row">
                            <span className="pdf-list-dot">✉</span>
                            <span>{issuer.email}</span>
                          </div>
                        )}
                        {[issuer.address, issuer.city].filter(Boolean).length >
                          0 && (
                          <div className="pdf-list-row">
                            <span className="pdf-list-dot">⌖</span>
                            <span>
                              {[issuer.address, issuer.city]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          </div>
                        )}
                        {bankLabel && (
                          <div className="pdf-list-row">
                            <span className="pdf-list-dot">$</span>
                            <span>{bankLabel}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pdf-card">
                    <div className="pdf-card-icon">♙</div>
                    <div className="pdf-card-content">
                      <div className="pdf-card-label">Cliente / Proyecto</div>
                      <div
                        className="pdf-card-title"
                        style={{ textTransform: "none" }}
                      >
                        {quote.customer_name}
                      </div>

                      <div className="pdf-list">
                        <div className="pdf-list-row">
                          <span className="pdf-list-dot">▧</span>
                          <span>
                            {quote.customer_phone ?? "Sin teléfono registrado"}
                          </span>
                        </div>
                        <div className="pdf-list-row">
                          <span className="pdf-list-dot">✉</span>
                          <span>
                            {quote.customer_email ?? "Sin correo registrado"}
                          </span>
                        </div>
                        <div className="pdf-list-row">
                          <span className="pdf-list-dot">⌖</span>
                          <span>
                            {quote.customer_city ?? "Sin ciudad registrada"}
                          </span>
                        </div>
                        <div className="pdf-list-row">
                          <span className="pdf-list-dot">⌂</span>
                          <span>
                            {quote.project_address ??
                              "Sin dirección del proyecto"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pdf-scope pdf-page-break-safe">
                  <div className="pdf-card-icon">◎</div>
                  <div
                    className="pdf-card-content"
                    style={{ padding: "3mm 5mm" }}
                  >
                    <div className="pdf-scope-title">Alcance del proyecto</div>
                    <div className="pdf-scope-text">
                      {quote.technical_scope ?? "Sin alcance técnico definido."}
                    </div>
                  </div>
                </section>

                <section>
                  <div className="pdf-section-title">
                    Detalle de la propuesta
                  </div>
                  <table className="pdf-table">
                    <colgroup>
                      <col style={{ width: "10mm" }} />
                      <col />
                      <col style={{ width: "18mm" }} />
                      <col style={{ width: "25mm" }} />
                      {hasDiscount && <col style={{ width: "19mm" }} />}
                      <col style={{ width: "28mm" }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th style={{ textAlign: "left" }}>Descripción</th>
                        <th>Cant.</th>
                        <th>Precio unit.</th>
                        {hasDiscount && <th>Dto.</th>}
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={hasDiscount ? 6 : 5}
                            style={{ textAlign: "center", padding: "10mm" }}
                          >
                            Esta cotización todavía no tiene ítems registrados.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, index) => {
                          const unit = getUnit(item);
                          const cleanNotes = (item.notes ?? "")
                            .split("\n")
                            .filter((line) => {
                              const normalized = line.toLowerCase();
                              return (
                                !normalized.includes("consumo proporcional") &&
                                !normalized.includes("unidad de cotización") &&
                                !normalized.includes("unidad de cotizacion")
                              );
                            })
                            .join("\n")
                            .trim();

                          return (
                            <tr key={item.id}>
                              <td className="pdf-item-number">
                                {String(index + 1).padStart(2, "0")}
                              </td>
                              <td>
                                <div className="pdf-item-meta">
                                  {getItemTypeLabel(item.item_type)}
                                  {item.sku ? ` · SKU ${item.sku}` : ""}
                                </div>
                                <div className="pdf-item-name">
                                  {item.item_name}
                                </div>
                                {item.item_description && (
                                  <div className="pdf-item-description">
                                    {item.item_description}
                                  </div>
                                )}
                                {cleanNotes && (
                                  <div className="pdf-item-notes">
                                    {cleanNotes}
                                  </div>
                                )}
                              </td>
                              <td className="pdf-num">
                                {Number(item.quantity ?? 0)}
                                <br />
                                <span
                                  className="pdf-muted"
                                  style={{ fontSize: "7.5px", fontWeight: 600 }}
                                >
                                  {getUnitLabel(unit)}
                                </span>
                              </td>
                              <td className="pdf-num">
                                {moneyFormatter.format(
                                  Number(item.unit_price ?? 0),
                                )}
                              </td>
                              {hasDiscount && (
                                <td className="pdf-num">
                                  {moneyFormatter.format(
                                    Number(item.discount ?? 0),
                                  )}
                                </td>
                              )}
                              <td className="pdf-money-strong">
                                {moneyFormatter.format(
                                  Number(item.subtotal ?? 0),
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}

                      <tr className="pdf-total-row">
                        <td colSpan={hasDiscount ? 6 : 5}>
                          <div className="pdf-total-wrapper">
                            <div className={getTotalCardClass(quoteTotals)}>
                              <div className="pdf-total-line">
                                <span>Subtotal</span>
                                <strong>
                                  {moneyFormatter.format(quoteTotals.subtotal)}
                                </strong>
                              </div>

                              {quoteTotals.shouldApplyTax && (
                                <div className="pdf-total-line">
                                  <span>
                                    IVA{" "}
                                    {(
                                      quoteTotals.normalizedTaxRate * 100
                                    ).toFixed(0)}
                                    %
                                  </span>
                                  <strong>
                                    {moneyFormatter.format(
                                      quoteTotals.taxAmount,
                                    )}
                                  </strong>
                                </div>
                              )}

                              <div className="pdf-total-final">
                                <span>Total</span>
                                <strong>
                                  {moneyFormatter.format(quoteTotals.total)}
                                </strong>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <section className="pdf-terms-grid">
                  <div className="pdf-term-card">
                    <div className="pdf-term-header">
                      <span className="pdf-term-icon">🛡</span>
                      <span>Garantía</span>
                    </div>
                    <div className="pdf-term-body">{warranty}</div>
                  </div>

                  <div className="pdf-term-card">
                    <div className="pdf-term-header">
                      <span className="pdf-term-icon">☑</span>
                      <span>Condiciones</span>
                    </div>
                    <div className="pdf-term-body">{conditions}</div>
                  </div>

                  <div className="pdf-term-card">
                    <div className="pdf-term-header">
                      <span className="pdf-term-icon">i</span>
                      <span>Notas importantes</span>
                    </div>
                    <div className="pdf-term-body">{notes}</div>
                  </div>

                  <div className="pdf-term-card">
                    <div className="pdf-term-header">
                      <span className="pdf-term-icon">⚠</span>
                      <span>Exclusiones importantes</span>
                    </div>
                    <div className="pdf-term-body">{exclusions}</div>
                  </div>
                </section>

                <footer className="pdf-signatures pdf-page-break-safe">
                  <div className="pdf-signature-line">{issuerName}</div>

                  <div className="pdf-signature-line">
                    Aceptación del cliente
                    <br />
                    <span
                      className="pdf-muted"
                      style={{ fontWeight: 600, textTransform: "none" }}
                    >
                      Nombre / Firma / Fecha
                    </span>
                  </div>
                </footer>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  );
};
