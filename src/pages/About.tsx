import { Link } from 'react-router-dom';
import { Leaf, Heart, Award } from 'lucide-react';
import Seo from '../components/Seo';
import Reveal from '../components/Reveal';

const values = [
  { icon: Leaf, title: 'Nature first', text: 'No added sugar, no preservatives, no artificial anything. We sell food the way nature made it.' },
  { icon: Award, title: 'Obsessive quality', text: 'Every batch is hand-inspected. If we would not serve it to our own family, we will not ship it to yours.' },
  { icon: Heart, title: 'Farm-direct fairness', text: 'We source directly from growers in the Middle East and India — better prices for you, better livelihoods for farmers.' },
];

export default function About() {
  return (
    <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <Seo
        title="About Us"
        description="Quality Dates and Nuts sources premium dates, nuts and dry fruits farm-direct and delivers them fresh across India — 100% natural, no added sugar."
        path="/about"
      />
      <Reveal>
        <h1 className="font-serif text-4xl md:text-5xl font-semibold text-espresso text-center leading-tight">
          Honest food,<br />from farm to your family.
        </h1>
        <p className="text-cocoa-light text-center mt-6 max-w-2xl mx-auto leading-relaxed">
          Quality Dates and Nuts began with a simple frustration: it was too hard to find genuinely fresh, genuinely premium dates and nuts in India.
          So we went to the source — date farms in the Middle East, almond orchards in California, cashew belts of coastal India — and built a supply
          chain with no middlemen and no compromises.
        </p>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-5 mt-16">
        {values.map((v, i) => (
          <Reveal key={v.title} delay={i * 0.08}>
            <div className="bg-white rounded-3xl p-8 border border-espresso/5 h-full text-center">
              <v.icon className="w-8 h-8 text-gold mx-auto mb-4" aria-hidden="true" />
              <h2 className="font-serif font-semibold text-espresso text-lg">{v.title}</h2>
              <p className="text-sm text-cocoa-light mt-2 leading-relaxed">{v.text}</p>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="text-center mt-16">
        <Link to="/shop" className="inline-block bg-espresso text-cream px-10 py-4 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-cocoa transition-colors">
          Taste the difference
        </Link>
      </Reveal>
    </div>
  );
}
