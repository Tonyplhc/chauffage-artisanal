import { Hero } from "@/components/home/hero";
import { Stats } from "@/components/home/stats";
import { Services } from "@/components/home/services";
import { Timeline } from "@/components/home/timeline";
import { Realisations } from "@/components/home/realisations";
import { Process } from "@/components/home/process";
import { Partners } from "@/components/home/partners";
import { Testimonials } from "@/components/home/testimonials";
import { Zone } from "@/components/home/zone";
import { RecruitmentTeaser } from "@/components/home/recruitment";
import { RecruitmentStrip } from "@/components/home/recruitment-strip";
import { AidesStrip } from "@/components/home/aides-strip";
import { FinalCTA } from "@/components/home/cta";

export default function HomePage() {
  return (
    <>
      <Hero />
      <Stats />
      <Services />
      <AidesStrip />
      <Timeline />
      <Realisations />
      <RecruitmentStrip />
      <Process />
      <Partners />
      <Testimonials />
      <Zone />
      <RecruitmentTeaser />
      <FinalCTA />
    </>
  );
}
