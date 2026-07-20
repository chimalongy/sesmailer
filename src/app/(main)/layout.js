import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col w-full bg-zinc-50/50 dark:bg-zinc-900/30 transition-colors duration-300">
        {children}
      </main>
      <Footer />
    </div>
  );
}
