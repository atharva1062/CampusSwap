/**
 * AI Content Moderation & Misleading Item Detection Service
 * Analyzes listing titles, descriptions, categories, and keywords
 * Flags inappropriate, adult, prohibited, hygiene, weapons, or scam content.
 */

// Strict list of prohibited words and categorized triggers
const PROHIBITED_PATTERNS = [
  {
    category: 'ADULT_CONTRACEPTIVE',
    keywords: [
      'condom', 'durex', 'moods', 'manforce', 'skore', 'contraceptive', 'vibrator', 'dildo',
      'sex toy', 'adult toy', 'porn', 'erotic', 'viagra', 'kamagra'
    ],
    reason: 'Prohibited adult contraceptive / sexual wellness product not permitted on campus marketplace.',
  },
  {
    category: 'HYGIENE_PERSONAL_CARE',
    keywords: [
      'sanitary pad', 'sanitary pads', 'tampon', 'tampons', 'menstrual cup', 'whisper pad', 'stayfree',
      'used undergarment', 'used underwear', 'used panties', 'used bra'
    ],
    reason: 'Personal hygiene and sanitary products are restricted from peer-to-peer swap/sale.',
  },
  {
    category: 'DRUGS_ALCOHOL_TOBACCO',
    keywords: [
      'weed', 'marijuana', 'cannabis', 'ganja', 'charas', 'vodka', 'whiskey', 'beer',
      'rum', 'alcohol', 'vape', 'e-cigarette', 'juul', 'hookah', 'cigarettes', 'tobacco',
      'bhang', 'hashish', 'lsd', 'cocaine', 'ecstasy'
    ],
    reason: 'Illegal drugs, alcohol, vaping, or tobacco items are strictly prohibited on campus grounds.',
  },
  {
    category: 'WEAPONS_VIOLENCE',
    keywords: [
      'gun', 'pistol', 'revolver', 'knife', 'dagger', 'brass knuckles', 'taser',
      'pepper spray', 'weapon', 'firearm', 'ammo', 'bullets', 'explosive', 'firecracker'
    ],
    reason: 'Weapons, sharp tactical instruments, or hazardous materials are strictly banned.',
  },
  {
    category: 'MISLEADING_SCAM',
    keywords: [
      'free money', 'pyramid scheme', 'crypto investment', 'cheat code exam', 'exam paper leak',
      'proxy attendance', 'fake degree', 'fake certificate', 'id card fake', 'hacked account'
    ],
    reason: 'Misleading scam, academic dishonesty, or fraudulent service detected.',
  }
];

/**
 * Analyze a listing for prohibited or misleading content
 * @param {Object} listingData { title, description, category, price }
 * @returns {Object} { isFlagged: boolean, reason: string|null, category: string|null, confidence: number }
 */
function checkContent(listingData) {
  const textToScan = `${listingData.title || ''} ${listingData.description || ''} ${listingData.swapPreferences || ''}`.toLowerCase();

  for (const group of PROHIBITED_PATTERNS) {
    for (const keyword of group.keywords) {
      // Word boundary regex to avoid partial false positives
      const regex = new RegExp(`\\b${keyword.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (regex.test(textToScan)) {
        return {
          isFlagged: true,
          category: group.category,
          detectedKeyword: keyword,
          reason: `AI Alert: ${group.reason} (Trigger: "${keyword}")`,
          confidence: 0.98,
        };
      }
    }
  }

  // Price anomaly / scam detection (e.g. negative or 99999999)
  if (listingData.price && (listingData.price > 500000 || listingData.price < 0)) {
    return {
      isFlagged: true,
      category: 'MISLEADING_PRICE',
      detectedKeyword: `Price: ₹${listingData.price}`,
      reason: 'AI Alert: Unusual / Suspicious item price value detected.',
      confidence: 0.85,
    };
  }

  return {
    isFlagged: false,
    reason: null,
    category: null,
    confidence: 0.0,
  };
}

module.exports = {
  checkContent,
  PROHIBITED_PATTERNS,
};
