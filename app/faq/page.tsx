'use client';

import { useState, useMemo } from 'react';
import type { Metadata } from 'next';
import { Search, HelpCircle, Car, CreditCard, FileText, Shield, Phone, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// FAQ data organized by categories
const faqCategories = [
  {
    id: 'buying',
    name: 'Blerja e Veturës',
    icon: Car,
    questions: [
      {
        question: 'Si mund të blej një veturë nga AUTO ANI?',
        answer: 'Procesi është i thjeshtë: 1) Zgjidhni veturën në faqen tonë ose vizitoni sallonin, 2) Bëni test drive, 3) Diskutoni opsionet e pagesës/financimit, 4) Plotësoni dokumentacionin, 5) Merrni veturën tuaj! Procesi zakonisht merr 1-3 ditë.',
      },
      {
        question: 'A mund të rezervoj një veturë online?',
        answer: 'Po! Mund të rezervoni veturën tuaj të preferuar online me një depozitë të vogël. Rezervimi është valid për 48 orë dhe depozita është plotësisht e kthyeshme nëse ndryshoni mendje.',
      },
      {
        question: 'Çfarë dokumentesh nevojiten për blerje?',
        answer: 'Për blerje me para në dorë nevojitet vetëm letërnjoftimi. Për financim nevojiten: letërnjoftimi, vërtetimi i të ardhurave, llogaria bankare (3 muajt e fundit), dhe kontrata e punës.',
      },
      {
        question: 'A ofrohet test drive?',
        answer: 'Absolutisht! Ofrojmë test drive falas për të gjitha veturat. Test drive mund të zgjasë 30-60 minuta dhe mund të përfshijë rrugë urbane dhe autostradë sipas kërkesës tuaj.',
      },
      {
        question: 'Sa kohë merr dorëzimi i veturës?',
        answer: 'Për veturat në stok, dorëzimi mund të bëhet brenda ditës nëse dokumentacioni është gati. Për veturat me porosi, koha varion nga 2-8 javë varësisht nga modeli.',
      },
    ],
  },
  {
    id: 'financing',
    name: 'Financimi',
    icon: CreditCard,
    questions: [
      {
        question: 'Cilat janë opsionet e financimit?',
        answer: 'Ofrojmë disa opsione: 1) Financim 0% për periudha të caktuara, 2) Kredi bankare me norma konkurruese 2.9%-5.9%, 3) Leasing për biznese. Këste nga 12-84 muaj me participim minimal 10%.',
      },
      {
        question: 'Sa është participimi minimal?',
        answer: 'Participimi minimal është 10% të vlerës së veturës. Për kushte më të favorshme të kredisë, rekomandojmë participim 20-30%.',
      },
      {
        question: 'A pranoni shkëmbim të veturës së vjetër?',
        answer: 'Po! Pranojmë shkëmbim të veturës tuaj të vjetër. Vlera e veturës tuaj mund të përdoret si participim për veturën e re. Ofrojmë vlerësim falas dhe çmime konkurruese.',
      },
      {
        question: 'Sa kohë merr aprovimi i kredisë?',
        answer: 'Aprovimi paraprak merret brenda 24 orëve. Aprovimi final dhe disbursimi i kredisë përfundohet brenda 2-3 ditëve të punës pas dorëzimit të dokumentacionit të plotë.',
      },
      {
        question: 'A ka penalitete për shlyerje të hershme?',
        answer: 'Jo! Nuk ka penalitete për shlyerje të hershme të kredisë. Mund të shlyeni kredinë në çdo kohë pa kosto shtesë.',
      },
    ],
  },
  {
    id: 'warranty',
    name: 'Garancia & Servisimi',
    icon: Shield,
    questions: [
      {
        question: 'Çfarë përfshin garancia?',
        answer: 'Garancia jonë 2-vjeçare mbulon: motorin, transmisionin, sistemin elektrik, sistemin e frenave, dhe komponentët kryesorë mekanikë. Garancia është e vlefshme në të gjithë Kosovën dhe rajonin.',
      },
      {
        question: 'Ku mund të servisoj veturën?',
        answer: 'Kemi partneritet me qendrat më të mira të servisimit në Kosovë. Servisimi mund të bëhet në çdo qendër të autorizuar pa humbur garancinë.',
      },
      {
        question: 'A ofrohet ndihmë në rrugë (roadside assistance)?',
        answer: 'Po! Për 12 muajt e parë ofrojmë ndihmë falas në rrugë 24/7 në të gjithë Kosovën. Shërbimi përfshin: ndihmë teknike, transport në rast defekti, dhe veturë zëvendësuese.',
      },
      {
        question: 'Çfarë ndodh pas përfundimit të garanc.së?',
        answer: 'Pas përfundimit të garancisë bazë, ofrojmë programe të zgjeruara të garancisë me kosto të arsyeshme. Gjithashtu, keni qasje të vazhdueshme në rrjetin tonë të servisimit.',
      },
    ],
  },
  {
    id: 'documents',
    name: 'Dokumentacioni',
    icon: FileText,
    questions: [
      {
        question: 'Cilat dokumente marr me veturën?',
        answer: 'Do të merrni: kontratën e shitjes, faturën, librezën e veturës, certifikatën e pronësisë, dokumentin e garancisë, dhe historikun e servisimit (nëse disponohet).',
      },
      {
        question: 'A ndihmoni me regjistrimin e veturës?',
        answer: 'Po! Ofrojmë asistencë të plotë për regjistrimin e veturës. Mund ta bëjmë regjistrimin për ju ose t\'ju shoqërojmë në qendrën e regjistrimit.',
      },
      {
        question: 'Si verifikohet historia e veturës?',
        answer: 'Të gjitha veturat tona kalojnë përmes kontrollit të detajuar të historisë. Ofrojmë raport CARFAX/AutoCheck për veturat e importuara dhe garanci për kilometrazhin.',
      },
      {
        question: 'A ofrohet sigurimi i veturës?',
        answer: 'Bashkëpunojmë me kompanitë kryesore të sigurimit në Kosovë. Mund t\'ju ndihmojmë të gjeni ofertën më të mirë dhe ta aktivizoni sigurimin menjëherë.',
      },
    ],
  },
  {
    id: 'contact',
    name: 'Kontakti & Vizitat',
    icon: Phone,
    questions: [
      {
        question: 'Cilat janë oraret e punës?',
        answer: 'E Hënë - E Premte: 08:00 - 19:00, E Shtunë: 09:00 - 17:00, E Diel: 10:00 - 15:00. Gjatë festave zyrtare jemi të mbyllur.',
      },
      {
        question: 'Ku ndodhet salloni juaj?',
        answer: 'Ndodhemi në Mitrovicë, Kosovë, në rrugën kryesore [adresa e plotë]. Kemi parking të madh falas dhe qasje të lehtë nga të gjitha drejtimet.',
      },
      {
        question: 'Si mund t\'ju kontaktoj?',
        answer: 'Na kontaktoni: Tel: +383 4x xxx xxx, WhatsApp: +383 4x xxx xxx, Email: info@autoani.com. Përgjigjemi brenda 1 ore gjatë orarit të punës.',
      },
      {
        question: 'A mund të caktoj takim?',
        answer: 'Po! Rekomandojmë caktimin e takimit paraprakisht për shërbim më të mirë. Mund të rezervoni online ose të na telefononi direkt.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['buying']);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);

  // Filter FAQs based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return faqCategories;

    const query = searchQuery.toLowerCase();
    return faqCategories.map(category => ({
      ...category,
      questions: category.questions.filter(
        q => q.question.toLowerCase().includes(query) ||
             q.answer.toLowerCase().includes(query)
      )
    })).filter(category => category.questions.length > 0);
  }, [searchQuery]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    );
  };

  const totalQuestions = faqCategories.reduce((acc, cat) => acc + cat.questions.length, 0);
  const filteredQuestions = filteredCategories.reduce((acc, cat) => acc + cat.questions.length, 0);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <HelpCircle className="w-16 h-16 mx-auto mb-4 opacity-90" />
          <h1 className="text-4xl font-bold mb-4">Pyetjet e Shpeshta (FAQ)</h1>
          <p className="text-xl mb-8 opacity-90">
            Gjeni përgjigjet për pyetjet tuaja
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Kërkoni në FAQ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-3 text-black text-lg"
            />
            {searchQuery && (
              <Badge className="absolute right-4 top-1/2 transform -translate-y-1/2">
                {filteredQuestions} rezultate
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">
                {totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Pyetje Totale</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">
                {faqCategories.length}
              </div>
              <div className="text-sm text-gray-600">Kategori</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">
                24/7
              </div>
              <div className="text-sm text-gray-600">Suport</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-[var(--primary-orange)]">
                1 orë
              </div>
              <div className="text-sm text-gray-600">Koha e Përgjigjes</div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-4">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategories.includes(category.id);

            return (
              <Card key={category.id} className="overflow-hidden">
                <div
                  className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-[var(--primary-orange)]" />
                      <h2 className="text-xl font-semibold">{category.name}</h2>
                      <Badge variant="secondary">{category.questions.length} pyetje</Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {category.questions.map((qa, index) => {
                        const questionId = `${category.id}-${index}`;
                        const isQuestionExpanded = expandedQuestions.includes(questionId);

                        return (
                          <div key={index} className="p-4">
                            <div
                              className="cursor-pointer"
                              onClick={() => toggleQuestion(questionId)}
                            >
                              <div className="flex items-start justify-between">
                                <h3 className="font-medium text-lg pr-4">
                                  {qa.question}
                                </h3>
                                {isQuestionExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                                )}
                              </div>
                            </div>

                            {isQuestionExpanded && (
                              <div className="mt-3 text-gray-700 leading-relaxed">
                                {qa.answer}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {/* No Results */}
        {filteredCategories.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 mb-4">
                Nuk u gjetën rezultate për "{searchQuery}"
              </p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
              >
                Pastro Kërkimin
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Still Have Questions */}
        <Card className="mt-8 bg-gradient-to-r from-[var(--primary-orange)] to-orange-600 text-white">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Keni Pyetje të Tjera?</h2>
            <p className="mb-6 opacity-90">
              Ekipi ynë është i gatshëm t'ju ndihmojë me çdo pyetje që keni
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-white text-[var(--primary-orange)] hover:bg-gray-100">
                  Kontaktoni
                </Button>
              </Link>
              <Link href="https://wa.me/38349000000">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/20">
                  WhatsApp
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}