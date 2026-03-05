import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Curriculum from "@/components/Curriculum";
import ForWho from "@/components/ForWho";
import Instructor from "@/components/Instructor";
import FAQ from "@/components/FAQ";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Curriculum />
        <ForWho />
        <Instructor />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
