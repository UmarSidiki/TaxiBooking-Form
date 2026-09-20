import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Building2, CreditCard, Banknote } from "lucide-react";
import { ISetting } from "@/features/settings/model";
import { useTranslations } from "next-intl";
import { PaymentTabBank } from "@/features/settings/ui/payment-tab-bank";
import { PaymentTabGateway } from "@/features/settings/ui/payment-tab-gateway";
import { PaymentTabInfo } from "@/features/settings/ui/payment-tab-info";
import { PaymentTabMethods } from "@/features/settings/ui/payment-tab-methods";
import { PaymentTabMultiSafepay } from "@/features/settings/ui/payment-tab-multisafepay";
import { PaymentTabStripe } from "@/features/settings/ui/payment-tab-stripe";
import { PaymentTabStripeSettings } from "@/features/settings/ui/payment-tab-stripe-settings";

interface PaymentTabProps {
  settings: Partial<ISetting>;
  handleMapSettingsChange: (
    key: keyof ISetting,
    value: string | number | string[] | boolean
  ) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const PaymentTab: React.FC<PaymentTabProps> = ({
  settings,
  handleMapSettingsChange,
}) => {
  const t = useTranslations();
  const [selectedGateway, setSelectedGateway] = React.useState<'stripe' | 'multisafepay'>(
    settings.multisafepayApiKey ? 'multisafepay' : 'stripe'
  );

  const paymentMethods = [
    {
      id: "card",
      label: t("Dashboard.Settings.stripe-payment"),
      Icon: CreditCard,
      description: t(
        "Dashboard.Settings.cards-paypal-apple-pay-google-pay-and-more"
      ),
    },
    {
      id: "multisafepay",
      label: "MultiSafepay",
      Icon: CreditCard,
      description: t("Dashboard.Settings.multisafepay-methods-desc"),
    },
    {
      id: "cash",
      label: t("Dashboard.Settings.cash-payment"),
      Icon: Banknote,
      description: t("Dashboard.Settings.pay-with-cash-on-delivery"),
    },
    {
      id: "bank_transfer",
      label: t("Dashboard.Settings.bank-transfer"),
      Icon: Building2,
      description: t("Dashboard.Settings.direct-bank-transfer"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Dashboard.Settings.payment-configuration")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <PaymentTabGateway
          t={t}
          selectedGateway={selectedGateway}
          setSelectedGateway={setSelectedGateway}
        />
        <PaymentTabStripe
          settings={settings}
          handleMapSettingsChange={handleMapSettingsChange}
          t={t}
          selectedGateway={selectedGateway}
        />
        <PaymentTabMultiSafepay
          settings={settings}
          handleMapSettingsChange={handleMapSettingsChange}
          t={t}
          selectedGateway={selectedGateway}
        />
        <PaymentTabStripeSettings
          settings={settings}
          handleMapSettingsChange={handleMapSettingsChange}
          t={t}
        />
        <PaymentTabMethods
          settings={settings}
          handleMapSettingsChange={handleMapSettingsChange}
          t={t}
          paymentMethods={paymentMethods}
        />
        <PaymentTabBank
          settings={settings}
          handleMapSettingsChange={handleMapSettingsChange}
          t={t}
        />
        <PaymentTabInfo t={t} />
      </CardContent>
    </Card>
  );
};

export default PaymentTab;
