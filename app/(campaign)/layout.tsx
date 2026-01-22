/**
 * Campaign Layout - No header/footer chrome
 * Used for landing pages like /unit and /updates
 */
export default function CampaignLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
