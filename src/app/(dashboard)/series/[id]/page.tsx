export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id } = await params;
  return <div>Series page coming soon</div>;
}
