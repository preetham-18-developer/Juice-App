export default function DemoBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_30%_200px,#fde04740,transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_70%_400px,#f9731640,transparent)]" />
    </div>
  );
}
