export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4 bg-[#e9f1ff]">
      {children}
    </div>
  );
}
