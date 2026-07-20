import { OrganizationJsonLd } from "./_components/json-ld";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <OrganizationJsonLd />
      {children}
    </>
  );
}
