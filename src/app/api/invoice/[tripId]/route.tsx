import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { Booking } from "@/models/booking";
import { Setting } from "@/models/settings";
import { getCurrencySymbol } from "@/lib/utils";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;

    if (!tripId) {
      return NextResponse.json(
        { success: false, message: "Trip ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the booking
    const booking = await Booking.findOne({ tripId });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    // Get settings for currency and company info
    const settings = await Setting.findOne();
    const currency = settings?.stripeCurrency?.toUpperCase() || "EUR";
    const currencySymbol = getCurrencySymbol(currency);
    const companyName = settings?.smtpSenderName || "Booking Service";

    // Generate PDF
    const pdfDoc = createInvoicePDF(booking, currencySymbol, companyName);
    const pdfBlob = await pdf(pdfDoc).toBlob();
    const pdfBuffer = await pdfBlob.arrayBuffer();

    // Return PDF response with proper headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Invoice-${tripId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: "#f7f7f7",
    borderBottom: "2px solid #333",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 15,
  },
  infoBlock: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#555",
    textTransform: "uppercase",
    borderBottom: "1px solid #eee",
    paddingBottom: 3,
  },
  infoText: {
    fontSize: 9,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#e9e9e9",
    borderBottom: "2px solid #555",
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px dashed #e9e9e9",
    padding: 8,
  },
  tableCol1: { width: "45%" },
  tableCol2: { width: "15%", textAlign: "right" },
  tableCol3: { width: "20%", textAlign: "right" },
  tableCol4: { width: "20%", textAlign: "right" },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 9,
  },
  itemDescription: {
    fontWeight: "bold",
    marginBottom: 2,
  },
  itemDetails: {
    fontSize: 8,
    color: "#777",
  },
  totalsSection: {
    marginTop: 20,
    borderTop: "1px solid #ddd",
    paddingTop: 15,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    width: 120,
    textAlign: "right",
    paddingRight: 15,
    fontWeight: "bold",
  },
  totalValue: {
    width: 100,
    textAlign: "right",
    fontWeight: "bold",
  },
  balanceDue: {
    backgroundColor: "#e9e9e9",
    padding: 10,
    marginTop: 10,
    borderTop: "1px solid #ddd",
    borderBottom: "1px solid #ddd",
  },
  balanceDueLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  balanceDueValue: {
    fontSize: 12,
    fontWeight: "bold",
  },
  notes: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f7f7f7",
    borderLeft: "3px solid #333",
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
    textTransform: "uppercase",
  },
  notesText: {
    fontSize: 9,
    color: "#444",
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: "1px solid #ddd",
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#777",
    marginBottom: 3,
  },
  statusBadge: {
    fontSize: 9,
    fontWeight: "bold",
    padding: "3 8",
    border: "1px solid #333",
    textTransform: "uppercase",
  },
});

function createInvoicePDF(
  booking: {
    tripId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    pickup: string;
    dropoff?: string;
    stops?: Array<{ location: string; order: number }>;
    date: string;
    time: string;
    passengers: number;
    flightNumber?: string;
    tripType: string;
    childSeats: number;
    babySeats: number;
    totalAmount: number;
    subtotalAmount?: number;
    taxAmount?: number;
    taxPercentage?: number;
    taxIncluded?: boolean;
    paymentStatus: string;
    notes?: string;
  },
  currencySymbol: string,
  companyName: string
) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Calculate line items
  const lineItems = [];
  let basePrice = booking.totalAmount || 0;
  const childSeatCost = booking.childSeats > 0 ? booking.childSeats * 10 : 0;
  const babySeatCost = booking.babySeats > 0 ? booking.babySeats * 10 : 0;
  basePrice = basePrice - childSeatCost - babySeatCost;

  lineItems.push({
    description: `Transportation Service - ${
      booking.tripType === "roundtrip" ? "Round Trip" : "One Way"
    }`,
    details: `From: ${booking.pickup} ${
      booking.stops && booking.stops.length > 0 ? "(with stops) " : ""
    }To: ${booking.dropoff || "N/A"}`,
    quantity: 1,
    rate: basePrice,
    amount: basePrice,
  });

  if (booking.childSeats > 0) {
    lineItems.push({
      description: "Child Seats",
      details: "",
      quantity: booking.childSeats,
      rate: 10,
      amount: childSeatCost,
    });
  }

  if (booking.babySeats > 0) {
    lineItems.push({
      description: "Baby Seats",
      details: "",
      quantity: booking.babySeats,
      rate: 10,
      amount: babySeatCost,
    });
  }

  const subtotal = booking.subtotalAmount || booking.totalAmount || 0;
  const taxAmount = booking.taxAmount || 0;
  const totalWithTax = booking.totalAmount || 0;
  const amountPaid = booking.paymentStatus === "completed" ? totalWithTax : 0;
  const balanceDue = totalWithTax - amountPaid;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>INVOICE</Text>
          <Text style={styles.headerSubtitle}>{companyName}</Text>
        </View>

        {/* Invoice Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Invoice To</Text>
            <Text style={styles.infoText}>
              {booking.firstName} {booking.lastName}
            </Text>
            <Text style={styles.infoText}>{booking.email}</Text>
            <Text style={styles.infoText}>{booking.phone}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Invoice Details</Text>
            <Text style={styles.infoText}>Invoice #: {booking.tripId}</Text>
            <Text style={styles.infoText}>Date: {currentDate}</Text>
            <Text style={styles.infoText}>
              Status:{" "}
              <Text style={styles.statusBadge}>
                {booking.paymentStatus === "completed" ? "PAID" : "PENDING"}
              </Text>
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoTitle}>Trip Details</Text>
            <Text style={styles.infoText}>Date: {booking.date}</Text>
            <Text style={styles.infoText}>Time: {booking.time}</Text>
            <Text style={styles.infoText}>
              Passengers: {booking.passengers}
            </Text>
            {booking.flightNumber && (
              <Text style={styles.infoText}>
                Flight: {booking.flightNumber}
              </Text>
            )}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCol1, styles.tableHeaderText]}>
              Description
            </Text>
            <Text style={[styles.tableCol2, styles.tableHeaderText]}>
              Quantity
            </Text>
            <Text style={[styles.tableCol3, styles.tableHeaderText]}>
              Rate
            </Text>
            <Text style={[styles.tableCol4, styles.tableHeaderText]}>
              Amount
            </Text>
          </View>
          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableCol1}>
                <Text style={[styles.tableCellText, styles.itemDescription]}>
                  {item.description}
                </Text>
                {item.details && (
                  <Text style={styles.itemDetails}>{item.details}</Text>
                )}
              </View>
              <Text style={[styles.tableCol2, styles.tableCellText]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCol3, styles.tableCellText]}>
                {currencySymbol}
                {item.rate.toFixed(2)}
              </Text>
              <Text style={[styles.tableCol4, styles.tableCellText]}>
                {currencySymbol}
                {item.amount.toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>
              {currencySymbol}
              {subtotal.toFixed(2)}
            </Text>
          </View>
          {taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax ({booking.taxPercentage || 0}%){booking.taxIncluded ? ' - Included' : ''}:</Text>
              <Text style={styles.totalValue}>
                {currencySymbol}
                {taxAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{taxAmount > 0 ? 'Total (Incl. Tax):' : 'Total:'}</Text>
            <Text style={styles.totalValue}>
              {currencySymbol}
              {totalWithTax.toFixed(2)}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Amount Paid:</Text>
            <Text style={styles.totalValue}>
              {currencySymbol}
              {amountPaid.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.totalRow, styles.balanceDue]}>
            <Text style={[styles.totalLabel, styles.balanceDueLabel]}>
              Balance Due:
            </Text>
            <Text style={[styles.totalValue, styles.balanceDueValue]}>
              {currencySymbol}
              {balanceDue.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {booking.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Additional Notes</Text>
            <Text style={styles.notesText}>{booking.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>
            This invoice was generated on {currentDate}
          </Text>
          <Text style={styles.footerText}>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
