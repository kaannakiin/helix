import type { ProductType, VariantGroupType } from '../client.js';

export interface SeedBrandDefinition {
  slug: string;
  websiteUrl: string;
  en: {
    name: string;
    description: string;
  };
  tr: {
    name: string;
    description: string;
  };
}

export interface SeedCategoryNode {
  slug: string;
  en: {
    name: string;
    description: string;
  };
  tr: {
    name: string;
    description: string;
  };
  children?: SeedCategoryNode[];
}

export interface SeedTagNode {
  slug: string;
  en: {
    name: string;
    description?: string;
  };
  tr: {
    name: string;
    description?: string;
  };
  children?: SeedTagNode[];
}

export interface SeedTagGroupDefinition {
  slug: string;
  en: {
    name: string;
    description: string;
  };
  tr: {
    name: string;
    description: string;
  };
  tags: SeedTagNode[];
}

export interface SeedVariantOptionDefinition {
  slug: string;
  colorCode?: string;
  en: {
    name: string;
  };
  tr: {
    name: string;
  };
}

export interface SeedVariantGroupDefinition {
  slug: string;
  type: VariantGroupType;
  en: {
    name: string;
  };
  tr: {
    name: string;
  };
  options: SeedVariantOptionDefinition[];
}

export interface CatalogSeriesDefinition {
  key: string;
  en: string;
  tr: string;
}

export interface ProductFamilyDefinition {
  key: string;
  type: ProductType;
  segment: 'apparel' | 'footwear' | 'accessory' | 'digital';
  en: {
    name: string;
    shortDescription: string;
    description: string;
  };
  tr: {
    name: string;
    shortDescription: string;
    description: string;
  };
  categorySlugs: string[];
  tagSlugs: string[];
  variantGroupSlugs: string[];
  brandPool: string[];
}

export const CATALOG_SERIES: CatalogSeriesDefinition[] = [
  { key: 'studio', en: 'Studio', tr: 'Stüdyo' },
  { key: 'urban', en: 'Urban', tr: 'Şehir' },
  { key: 'essential', en: 'Essential', tr: 'Temel' },
  { key: 'weekend', en: 'Weekend', tr: 'Hafta Sonu' },
  { key: 'motion', en: 'Motion', tr: 'Hareket' },
  { key: 'signature', en: 'Signature', tr: 'İmza' },
  { key: 'atelier', en: 'Atelier', tr: 'Atölye' },
  { key: 'coastal', en: 'Coastal', tr: 'Sahil' },
  { key: 'midnight', en: 'Midnight', tr: 'Gece' },
  { key: 'transit', en: 'Transit', tr: 'Geçiş' },
];

export const CATALOG_BRANDS: SeedBrandDefinition[] = [
  {
    slug: 'luminara',
    websiteUrl: 'https://luminara.seed.helix.test',
    en: {
      name: 'Luminara',
      description:
        'Polished wardrobe essentials with bright, refined finishes.',
    },
    tr: {
      name: 'Luminara',
      description:
        'Aydınlık ve rafine dokunuşlarla hazırlanmış gardırop parçaları.',
    },
  },
  {
    slug: 'northline',
    websiteUrl: 'https://northline.seed.helix.test',
    en: {
      name: 'Northline',
      description: 'Utility-driven citywear for fast weekday movement.',
    },
    tr: {
      name: 'Northline',
      description: 'Yoğun şehir temposu için tasarlanmış fonksiyonel çizgiler.',
    },
  },
  {
    slug: 'atelier-nera',
    websiteUrl: 'https://atelier-nera.seed.helix.test',
    en: {
      name: 'Atelier Nera',
      description:
        'Sharp tailoring and monochrome silhouettes with studio polish.',
    },
    tr: {
      name: 'Atelier Nera',
      description:
        'Atölye inceliği taşıyan keskin terzilik ve monokrom siluetler.',
    },
  },
  {
    slug: 'solstice-studio',
    websiteUrl: 'https://solstice-studio.seed.helix.test',
    en: {
      name: 'Solstice Studio',
      description: 'Light seasonal dressing built around texture and ease.',
    },
    tr: {
      name: 'Solstice Studio',
      description:
        'Doku ve rahatlık merkezli, mevsim geçişlerine uyumlu koleksiyonlar.',
    },
  },
  {
    slug: 'borough-lane',
    websiteUrl: 'https://borough-lane.seed.helix.test',
    en: {
      name: 'Borough Lane',
      description: 'Modern casual staples tuned for city neighbourhood life.',
    },
    tr: {
      name: 'Borough Lane',
      description: 'Şehir yaşamına uyarlanmış modern günlük temel parçalar.',
    },
  },
  {
    slug: 'forme-atelier',
    websiteUrl: 'https://forme-atelier.seed.helix.test',
    en: {
      name: 'Forme Atelier',
      description: 'Soft structure, elegant proportion and understated finish.',
    },
    tr: {
      name: 'Forme Atelier',
      description:
        'Yumuşak yapı, dengeli oran ve sade şıklıkla kurulan tasarımlar.',
    },
  },
  {
    slug: 'terra-thread',
    websiteUrl: 'https://terra-thread.seed.helix.test',
    en: {
      name: 'Terra Thread',
      description:
        'Natural fibers and grounded palettes for everyday layering.',
    },
    tr: {
      name: 'Terra Thread',
      description:
        'Doğal lifler ve toprak tonlarıyla şekillenen günlük kombinler.',
    },
  },
  {
    slug: 'dune-district',
    websiteUrl: 'https://dune-district.seed.helix.test',
    en: {
      name: 'Dune District',
      description: 'Resort-minded color stories and fluid resort silhouettes.',
    },
    tr: {
      name: 'Dune District',
      description: 'Tatil ruhunu yansıtan akışkan formlar ve yumuşak tonlar.',
    },
  },
  {
    slug: 'marea',
    websiteUrl: 'https://marea.seed.helix.test',
    en: {
      name: 'Marea',
      description:
        'Coastal femininity translated into versatile city dressing.',
    },
    tr: {
      name: 'Marea',
      description:
        'Sahil zarafetini şehir kullanımına taşıyan kadın siluetleri.',
    },
  },
  {
    slug: 'veloura',
    websiteUrl: 'https://veloura.seed.helix.test',
    en: {
      name: 'Veloura',
      description: 'Evening-led softness with luminous drape and subtle shine.',
    },
    tr: {
      name: 'Veloura',
      description:
        'Dökümlü kumaşlar ve yumuşak parlaklıkla öne çıkan gece çizgisi.',
    },
  },
  {
    slug: 'cadence',
    websiteUrl: 'https://cadence.seed.helix.test',
    en: {
      name: 'Cadence',
      description: 'Rhythmic basics built to anchor weekly wardrobes.',
    },
    tr: {
      name: 'Cadence',
      description:
        'Haftalık gardıropları taşıyan ritmik ve dengeli temel parçalar.',
    },
  },
  {
    slug: 'monoweave',
    websiteUrl: 'https://monoweave.seed.helix.test',
    en: {
      name: 'Monoweave',
      description:
        'Quiet palettes, clean knits and essential modular dressing.',
    },
    tr: {
      name: 'Monoweave',
      description:
        'Sessiz tonlar ve sade örgülerle kurulan modüler giyim anlayışı.',
    },
  },
  {
    slug: 'kora-motion',
    websiteUrl: 'https://kora-motion.seed.helix.test',
    en: {
      name: 'Kora Motion',
      description: 'Performance-minded apparel built for daily movement.',
    },
    tr: {
      name: 'Kora Motion',
      description:
        'Günlük hareket temposu için performans odaklı giyim ürünleri.',
    },
  },
  {
    slug: 'peak-supply',
    websiteUrl: 'https://peak-supply.seed.helix.test',
    en: {
      name: 'Peak Supply',
      description: 'Outdoor layers and travel-ready kit with resilient detail.',
    },
    tr: {
      name: 'Peak Supply',
      description:
        'Dayanıklı detaylarla desteklenen outdoor katmanlar ve seyahat ekipmanı.',
    },
  },
  {
    slug: 'ardent',
    websiteUrl: 'https://ardent.seed.helix.test',
    en: {
      name: 'Ardent',
      description: 'Energetic essentials for modern, expressive wardrobes.',
    },
    tr: {
      name: 'Ardent',
      description: 'Çağdaş ve iddialı kombinler için enerjik temel parçalar.',
    },
  },
  {
    slug: 'vale-vine',
    websiteUrl: 'https://vale-vine.seed.helix.test',
    en: {
      name: 'Vale & Vine',
      description:
        'Textured accessories and grounded layers with crafted finish.',
    },
    tr: {
      name: 'Vale & Vine',
      description:
        'İşçilik hissi taşıyan dokulu aksesuarlar ve dengeli katmanlar.',
    },
  },
  {
    slug: 'nexo-run',
    websiteUrl: 'https://nexo-run.seed.helix.test',
    en: {
      name: 'Nexo Run',
      description: 'Technical footwear and motion-first essentials.',
    },
    tr: {
      name: 'Nexo Run',
      description: 'Teknik ayakkabılar ve hareket merkezli ekipmanlar.',
    },
  },
  {
    slug: 'onda',
    websiteUrl: 'https://onda.seed.helix.test',
    en: {
      name: 'Onda',
      description:
        'Soft accessories, gifting edits and elevated casual detail.',
    },
    tr: {
      name: 'Onda',
      description:
        'Yumuşak aksesuarlar, hediye seçenekleri ve rafine günlük detaylar.',
    },
  },
];

export const CATALOG_CATEGORY_TREE: SeedCategoryNode[] = [
  {
    slug: 'clothing',
    en: {
      name: 'Clothing',
      description: 'Ready-to-wear fashion across daily dressing.',
    },
    tr: {
      name: 'Giyim',
      description: 'Günlük kullanıma uygun hazır giyim koleksiyonları.',
    },
    children: [
      {
        slug: 'tops',
        en: {
          name: 'Tops',
          description: 'Layering pieces for upper-body dressing.',
        },
        tr: {
          name: 'Üst Giyim',
          description: 'Üst kombinleri tamamlayan katmanlı parçalar.',
        },
        children: [
          {
            slug: 'tees',
            en: {
              name: 'T-Shirts',
              description: 'Everyday jersey essentials and relaxed fits.',
            },
            tr: {
              name: 'Tişörtler',
              description: 'Günlük kullanıma uygun penye temel ürünler.',
            },
          },
          {
            slug: 'shirts',
            en: {
              name: 'Shirts',
              description: 'Button-up silhouettes from soft to structured.',
            },
            tr: {
              name: 'Gömlekler',
              description: 'Yumuşak ve yapılandırılmış gömlek siluetleri.',
            },
          },
          {
            slug: 'knitwear',
            en: {
              name: 'Knitwear',
              description: 'Refined knit tops and seasonal knit layers.',
            },
            tr: {
              name: 'Trikolar',
              description: 'Mevsime uyumlu triko üstler ve ince katmanlar.',
            },
          },
        ],
      },
      {
        slug: 'bottoms',
        en: {
          name: 'Bottoms',
          description: 'Tailored and relaxed lower-body silhouettes.',
        },
        tr: {
          name: 'Alt Giyim',
          description: 'Rahat ve terzilik etkisi taşıyan alt siluetler.',
        },
        children: [
          {
            slug: 'trousers',
            en: {
              name: 'Trousers',
              description: 'Smart and relaxed trouser shapes.',
            },
            tr: {
              name: 'Pantolonlar',
              description: 'Akıllı ve rahat pantolon formları.',
            },
          },
          {
            slug: 'denim',
            en: {
              name: 'Denim',
              description: 'Denim staples with modern fits.',
            },
            tr: {
              name: 'Denimler',
              description: 'Modern kalıplarla yenilenen denim ürünler.',
            },
          },
          {
            slug: 'skirts',
            en: {
              name: 'Skirts',
              description: 'Day-to-evening skirt silhouettes.',
            },
            tr: {
              name: 'Etekler',
              description: 'Gündüzden geceye taşınabilen etek siluetleri.',
            },
          },
        ],
      },
      {
        slug: 'layers',
        en: {
          name: 'Layers',
          description: 'Structured pieces that complete the look.',
        },
        tr: {
          name: 'Katmanlı Giyim',
          description: 'Kombini tamamlayan yapılandırılmış parçalar.',
        },
        children: [
          {
            slug: 'jackets',
            en: {
              name: 'Jackets',
              description: 'Utility and tailoring-led jacket options.',
            },
            tr: {
              name: 'Ceketler',
              description:
                'Fonksiyon ve terziliği buluşturan ceket seçenekleri.',
            },
          },
          {
            slug: 'dresses',
            en: {
              name: 'Dresses',
              description: 'Fluid and occasion-ready one-piece dressing.',
            },
            tr: {
              name: 'Elbiseler',
              description:
                'Akışkan ve özel kullanıma uygun tek parça seçenekleri.',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'footwear',
    en: {
      name: 'Footwear',
      description: 'Fashion and comfort-led shoes for every pace.',
    },
    tr: {
      name: 'Ayakkabı',
      description: 'Her tempoya uygun şıklık ve konfor odaklı ayakkabılar.',
    },
    children: [
      {
        slug: 'everyday-shoes',
        en: {
          name: 'Everyday Shoes',
          description: 'Core silhouettes for weekday and weekend wear.',
        },
        tr: {
          name: 'Günlük Ayakkabılar',
          description:
            'Hafta içi ve hafta sonu için temel ayakkabı siluetleri.',
        },
        children: [
          {
            slug: 'sneakers',
            en: {
              name: 'Sneakers',
              description: 'City-ready sneakers with versatile styling.',
            },
            tr: {
              name: 'Sneakerlar',
              description:
                'Şehir kullanımına uygun çok yönlü sneaker modelleri.',
            },
          },
          {
            slug: 'loafers',
            en: {
              name: 'Loafers',
              description: 'Easy slip-on styles with polished shape.',
            },
            tr: {
              name: 'Loaferlar',
              description: 'Kolay giyilen ve şık form sunan loafer modelleri.',
            },
          },
          {
            slug: 'flats',
            en: {
              name: 'Flats',
              description: 'Minimal flat shoes for light daily dressing.',
            },
            tr: {
              name: 'Babetler',
              description: 'Hafif günlük kullanım için sade düz ayakkabılar.',
            },
          },
        ],
      },
      {
        slug: 'boots',
        en: {
          name: 'Boots',
          description: 'Transitional and cold-weather boot shapes.',
        },
        tr: {
          name: 'Botlar',
          description: 'Geçiş sezonu ve soğuk hava için bot seçenekleri.',
        },
        children: [
          {
            slug: 'ankle-boots',
            en: {
              name: 'Ankle Boots',
              description: 'Short boot silhouettes for daily rotation.',
            },
            tr: {
              name: 'Bilek Botlar',
              description: 'Günlük rotasyon için kısa bot siluetleri.',
            },
          },
          {
            slug: 'tall-boots',
            en: {
              name: 'Tall Boots',
              description: 'Higher shaft boots for elevated seasonal looks.',
            },
            tr: {
              name: 'Uzun Çizmeler',
              description:
                'Sezonluk kombinleri yükselten uzun çizme modelleri.',
            },
          },
        ],
      },
      {
        slug: 'seasonal-shoes',
        en: {
          name: 'Seasonal Shoes',
          description: 'Warm-weather and motion-ready footwear.',
        },
        tr: {
          name: 'Mevsimsel Ayakkabılar',
          description: 'Sıcak hava ve hareket temposuna uygun ayakkabılar.',
        },
        children: [
          {
            slug: 'sandals',
            en: {
              name: 'Sandals',
              description: 'Open silhouettes for summer dressing.',
            },
            tr: {
              name: 'Sandaletler',
              description: 'Yaz kombinleri için açık formda sandaletler.',
            },
          },
          {
            slug: 'training-shoes',
            en: {
              name: 'Training Shoes',
              description: 'Low-profile shoes for studio and run days.',
            },
            tr: {
              name: 'Antrenman Ayakkabıları',
              description:
                'Stüdyo ve koşu günleri için hafif performans ayakkabıları.',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'accessories',
    en: {
      name: 'Bags & Accessories',
      description: 'Functional and styling-led add-ons for every look.',
    },
    tr: {
      name: 'Çanta ve Aksesuar',
      description: 'Her kombini tamamlayan işlevsel ve stil odaklı parçalar.',
    },
    children: [
      {
        slug: 'bags',
        en: {
          name: 'Bags',
          description: 'Carry solutions from daily commute to travel.',
        },
        tr: {
          name: 'Çantalar',
          description: 'Günlük kullanımdan seyahate uzanan taşıma çözümleri.',
        },
        children: [
          {
            slug: 'backpacks',
            en: {
              name: 'Backpacks',
              description: 'Hands-free carry with practical compartments.',
            },
            tr: {
              name: 'Sırt Çantaları',
              description: 'Pratik bölmelere sahip rahat taşıma çözümleri.',
            },
          },
          {
            slug: 'shoulder-bags',
            en: {
              name: 'Shoulder Bags',
              description: 'Soft and structured shoulder silhouettes.',
            },
            tr: {
              name: 'Omuz Çantaları',
              description:
                'Yumuşak ve yapılandırılmış omuz çantası siluetleri.',
            },
          },
          {
            slug: 'tote-bags',
            en: {
              name: 'Tote Bags',
              description: 'Open-top carryalls for flexible daily use.',
            },
            tr: {
              name: 'Tote Çantalar',
              description:
                'Esnek günlük kullanım sunan açık ağızlı tote çantalar.',
            },
          },
        ],
      },
      {
        slug: 'small-accessories',
        en: {
          name: 'Small Accessories',
          description: 'Compact finishing pieces with tactile detail.',
        },
        tr: {
          name: 'Küçük Aksesuarlar',
          description:
            'Dokulu detaylarla öne çıkan kompakt tamamlayıcı parçalar.',
        },
        children: [
          {
            slug: 'belts',
            en: {
              name: 'Belts',
              description: 'Waist-defining leather and woven options.',
            },
            tr: {
              name: 'Kemerler',
              description: 'Bel vurgusu yapan deri ve dokuma kemerler.',
            },
          },
          {
            slug: 'hats',
            en: {
              name: 'Hats',
              description: 'Caps and soft headwear for seasonal finishing.',
            },
            tr: {
              name: 'Şapkalar',
              description:
                'Mevsimsel görünümü tamamlayan şapka ve baş aksesuarları.',
            },
          },
        ],
      },
      {
        slug: 'digital',
        en: {
          name: 'Digital Edits',
          description:
            'Gifting and digital style content for curated shopping.',
        },
        tr: {
          name: 'Dijital Seçkiler',
          description:
            'Alışverişi destekleyen dijital hediye ve stil içerikleri.',
        },
        children: [
          {
            slug: 'gift-cards',
            en: {
              name: 'Gift Cards',
              description: 'Digital value cards for flexible gifting.',
            },
            tr: {
              name: 'Hediye Kartları',
              description:
                'Esnek hediye deneyimi sunan dijital bakiye kartları.',
            },
          },
          {
            slug: 'style-guides',
            en: {
              name: 'Style Guides',
              description: 'Downloadable wardrobe planning and styling edits.',
            },
            tr: {
              name: 'Stil Rehberleri',
              description:
                'İndirilebilir gardırop planlama ve stil içerikleri.',
            },
          },
        ],
      },
    ],
  },
  {
    slug: 'sport-outdoor',
    en: {
      name: 'Sport & Outdoor',
      description: 'Movement-ready apparel and travel-support essentials.',
    },
    tr: {
      name: 'Spor ve Outdoor',
      description:
        'Hareket odaklı giyim ve seyahati destekleyen tamamlayıcılar.',
    },
    children: [
      {
        slug: 'activewear',
        en: {
          name: 'Activewear',
          description: 'Technical layers for studio, walk and training.',
        },
        tr: {
          name: 'Aktif Giyim',
          description: 'Stüdyo, yürüyüş ve antrenman için teknik katmanlar.',
        },
        children: [
          {
            slug: 'leggings',
            en: {
              name: 'Leggings',
              description: 'Supportive stretch leggings for movement.',
            },
            tr: {
              name: 'Taytlar',
              description: 'Hareket özgürlüğü sunan destekleyici taytlar.',
            },
          },
          {
            slug: 'performance-tops',
            en: {
              name: 'Performance Tops',
              description: 'Breathable tops for training and commute.',
            },
            tr: {
              name: 'Performans Üstleri',
              description:
                'Antrenman ve günlük geçişler için nefes alabilir üstler.',
            },
          },
        ],
      },
      {
        slug: 'outdoor-layers',
        en: {
          name: 'Outdoor Layers',
          description: 'Protective outer layers for changing conditions.',
        },
        tr: {
          name: 'Outdoor Katmanlar',
          description:
            'Değişen hava koşullarına uyum sağlayan koruyucu katmanlar.',
        },
        children: [
          {
            slug: 'fleeces',
            en: {
              name: 'Fleeces',
              description: 'Warm fleece layers for cooler movement.',
            },
            tr: {
              name: 'Polarlar',
              description: 'Serin günler için sıcak tutan polar katmanlar.',
            },
          },
          {
            slug: 'raincoats',
            en: {
              name: 'Raincoats',
              description: 'Weather-resistant shells for commute and trail.',
            },
            tr: {
              name: 'Yağmurluklar',
              description:
                'Şehir ve doğa kullanımı için hava şartlarına dayanıklı dış katmanlar.',
            },
          },
        ],
      },
      {
        slug: 'studio-travel',
        en: {
          name: 'Studio & Travel',
          description: 'Packable pieces that support routines on the move.',
        },
        tr: {
          name: 'Stüdyo ve Seyahat',
          description:
            'Hareketli yaşam düzenini destekleyen taşınabilir parçalar.',
        },
        children: [
          {
            slug: 'yoga-tops',
            en: {
              name: 'Yoga Tops',
              description: 'Soft studio pieces for low-impact sessions.',
            },
            tr: {
              name: 'Yoga Üstleri',
              description:
                'Düşük tempolu egzersizler için yumuşak stüdyo üstleri.',
            },
          },
          {
            slug: 'travel-accessories',
            en: {
              name: 'Travel Accessories',
              description: 'Packing and on-the-go support accessories.',
            },
            tr: {
              name: 'Seyahat Aksesuarları',
              description:
                'Paketleme ve yolculuk sırasında destek sağlayan aksesuarlar.',
            },
          },
        ],
      },
    ],
  },
];

export const CATALOG_TAG_GROUPS: SeedTagGroupDefinition[] = [
  {
    slug: 'season',
    en: {
      name: 'Season',
      description: 'Seasonal rhythm and collection timing.',
    },
    tr: {
      name: 'Sezon',
      description: 'Sezon ritmi ve koleksiyon zamanlaması.',
    },
    tags: [
      {
        slug: 'spring-summer',
        en: { name: 'Spring / Summer' },
        tr: { name: 'İlkbahar / Yaz' },
        children: [
          {
            slug: 'high-summer',
            en: { name: 'High Summer' },
            tr: { name: 'Yüksek Yaz' },
          },
        ],
      },
      {
        slug: 'fall-winter',
        en: { name: 'Fall / Winter' },
        tr: { name: 'Sonbahar / Kış' },
      },
      {
        slug: 'all-season',
        en: { name: 'All Season' },
        tr: { name: 'Tüm Sezon' },
      },
    ],
  },
  {
    slug: 'material',
    en: {
      name: 'Material',
      description: 'Fabric and material stories across the catalog.',
    },
    tr: {
      name: 'Materyal',
      description: 'Katalog boyunca kullanılan kumaş ve malzeme yapıları.',
    },
    tags: [
      { slug: 'cotton', en: { name: 'Cotton' }, tr: { name: 'Pamuk' } },
      { slug: 'linen', en: { name: 'Linen' }, tr: { name: 'Keten' } },
      { slug: 'wool', en: { name: 'Wool' }, tr: { name: 'Yün' } },
      { slug: 'leather', en: { name: 'Leather' }, tr: { name: 'Deri' } },
      { slug: 'denim', en: { name: 'Denim' }, tr: { name: 'Denim' } },
      { slug: 'nylon', en: { name: 'Nylon' }, tr: { name: 'Naylon' } },
      {
        slug: 'polyester',
        en: { name: 'Polyester' },
        tr: { name: 'Polyester' },
      },
      {
        slug: 'recycled-knit',
        en: { name: 'Recycled Knit' },
        tr: { name: 'Geri Dönüşümlü Triko' },
      },
    ],
  },
  {
    slug: 'style',
    en: {
      name: 'Style',
      description: 'Styling mood and silhouette direction.',
    },
    tr: {
      name: 'Stil',
      description: 'Kombin havasını belirleyen siluet ve tavır etiketleri.',
    },
    tags: [
      { slug: 'casual', en: { name: 'Casual' }, tr: { name: 'Günlük' } },
      {
        slug: 'smart-casual',
        en: { name: 'Smart Casual' },
        tr: { name: 'Akıllı Günlük' },
      },
      {
        slug: 'tailored',
        en: { name: 'Tailored' },
        tr: { name: 'Terzilik Etkili' },
      },
      { slug: 'minimal', en: { name: 'Minimal' }, tr: { name: 'Minimal' } },
      {
        slug: 'athleisure',
        en: { name: 'Athleisure' },
        tr: { name: 'Atletik Günlük' },
      },
    ],
  },
  {
    slug: 'feature',
    en: {
      name: 'Feature',
      description: 'Functional details that matter in use.',
    },
    tr: {
      name: 'Özellik',
      description: 'Kullanım sırasında fark yaratan işlevsel detaylar.',
    },
    tags: [
      {
        slug: 'breathable',
        en: { name: 'Breathable' },
        tr: { name: 'Nefes Alabilir' },
      },
      {
        slug: 'waterproof',
        en: { name: 'Waterproof' },
        tr: { name: 'Su Geçirmez' },
      },
      { slug: 'stretch', en: { name: 'Stretch' }, tr: { name: 'Esnek' } },
      {
        slug: 'lightweight',
        en: { name: 'Lightweight' },
        tr: { name: 'Hafif' },
      },
      {
        slug: 'insulated',
        en: { name: 'Insulated' },
        tr: { name: 'Yalıtımlı' },
      },
      {
        slug: 'recycled',
        en: { name: 'Recycled' },
        tr: { name: 'Geri Dönüşümlü' },
      },
    ],
  },
  {
    slug: 'occasion',
    en: {
      name: 'Occasion',
      description: 'Where the product fits in the customer journey.',
    },
    tr: {
      name: 'Kullanım Alanı',
      description: 'Ürünün müşteri yolculuğunda öne çıktığı kullanım anları.',
    },
    tags: [
      {
        slug: 'everyday',
        en: { name: 'Everyday' },
        tr: { name: 'Günlük Kullanım' },
        children: [
          {
            slug: 'office',
            en: { name: 'Office' },
            tr: { name: 'Ofis' },
          },
          {
            slug: 'weekend',
            en: { name: 'Weekend' },
            tr: { name: 'Hafta Sonu' },
          },
        ],
      },
      {
        slug: 'evening',
        en: { name: 'Evening' },
        tr: { name: 'Akşam' },
      },
      {
        slug: 'travel',
        en: { name: 'Travel' },
        tr: { name: 'Seyahat' },
      },
    ],
  },
];

export const CATALOG_VARIANT_GROUPS: SeedVariantGroupDefinition[] = [
  {
    slug: 'color',
    type: 'COLOR',
    en: { name: 'Color' },
    tr: { name: 'Renk' },
    options: [
      {
        slug: 'black',
        colorCode: '#111111',
        en: { name: 'Black' },
        tr: { name: 'Siyah' },
      },
      {
        slug: 'white',
        colorCode: '#F5F5F2',
        en: { name: 'White' },
        tr: { name: 'Beyaz' },
      },
      {
        slug: 'navy',
        colorCode: '#1C2D55',
        en: { name: 'Navy' },
        tr: { name: 'Lacivert' },
      },
      {
        slug: 'olive',
        colorCode: '#66704F',
        en: { name: 'Olive' },
        tr: { name: 'Haki' },
      },
      {
        slug: 'sand',
        colorCode: '#D8C6A4',
        en: { name: 'Sand' },
        tr: { name: 'Kum' },
      },
      {
        slug: 'burgundy',
        colorCode: '#6E2130',
        en: { name: 'Burgundy' },
        tr: { name: 'Bordo' },
      },
      {
        slug: 'sky-blue',
        colorCode: '#8AB6D6',
        en: { name: 'Sky Blue' },
        tr: { name: 'Açık Mavi' },
      },
      {
        slug: 'stone',
        colorCode: '#8D877B',
        en: { name: 'Stone' },
        tr: { name: 'Taş' },
      },
    ],
  },
  {
    slug: 'size',
    type: 'SIZE',
    en: { name: 'Size' },
    tr: { name: 'Beden' },
    options: [
      { slug: 'xs', en: { name: 'XS' }, tr: { name: 'XS' } },
      { slug: 's', en: { name: 'S' }, tr: { name: 'S' } },
      { slug: 'm', en: { name: 'M' }, tr: { name: 'M' } },
      { slug: 'l', en: { name: 'L' }, tr: { name: 'L' } },
      { slug: 'xl', en: { name: 'XL' }, tr: { name: 'XL' } },
      { slug: 'xxl', en: { name: 'XXL' }, tr: { name: 'XXL' } },
    ],
  },
  {
    slug: 'shoe-size',
    type: 'SIZE',
    en: { name: 'Shoe Size' },
    tr: { name: 'Ayakkabı Numarası' },
    options: [
      { slug: '37', en: { name: '37' }, tr: { name: '37' } },
      { slug: '38', en: { name: '38' }, tr: { name: '38' } },
      { slug: '39', en: { name: '39' }, tr: { name: '39' } },
      { slug: '40', en: { name: '40' }, tr: { name: '40' } },
      { slug: '41', en: { name: '41' }, tr: { name: '41' } },
      { slug: '42', en: { name: '42' }, tr: { name: '42' } },
    ],
  },
  {
    slug: 'accessory-size',
    type: 'SIZE',
    en: { name: 'Accessory Size' },
    tr: { name: 'Aksesuar Ölçüsü' },
    options: [
      { slug: 'one-size', en: { name: 'One Size' }, tr: { name: 'Tek Ebat' } },
      { slug: 'small', en: { name: 'Small' }, tr: { name: 'Küçük' } },
      { slug: 'medium', en: { name: 'Medium' }, tr: { name: 'Orta' } },
      { slug: 'large', en: { name: 'Large' }, tr: { name: 'Büyük' } },
    ],
  },
];

export const PRODUCT_FAMILIES: ProductFamilyDefinition[] = [
  {
    key: 'crew-tee',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Crew Tee',
      shortDescription: 'A clean crew-neck tee for daily layering.',
      description:
        'Built with a balanced silhouette and soft hand-feel for everyday wear.',
    },
    tr: {
      name: 'Bisiklet Yaka Tişört',
      shortDescription:
        'Günlük katmanlamaya uygun temiz bir bisiklet yaka tişört.',
      description:
        'Dengeli kalıbı ve yumuşak dokusuyla günlük kullanım için tasarlandı.',
    },
    categorySlugs: ['tees'],
    tagSlugs: ['cotton', 'casual', 'all-season', 'everyday'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['cadence', 'borough-lane', 'luminara'],
  },
  {
    key: 'relaxed-tee',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Relaxed Tee',
      shortDescription: 'An easy silhouette with a laid-back shoulder line.',
      description:
        'Designed for off-duty styling with a slightly oversized feel and clean finish.',
    },
    tr: {
      name: 'Rahat Kalıp Tişört',
      shortDescription: 'Düşük omuzlu ve rahat duruşlu günlük tişört.',
      description:
        'Biraz oversize hissi ve temiz bitişiyle rahat kombinler için hazırlandı.',
    },
    categorySlugs: ['tees'],
    tagSlugs: ['cotton', 'minimal', 'weekend', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['borough-lane', 'ardent', 'cadence'],
  },
  {
    key: 'linen-shirt',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Linen Shirt',
      shortDescription: 'A breathable shirt for warm-weather dressing.',
      description:
        'Lightweight construction and soft structure make it a reliable seasonal staple.',
    },
    tr: {
      name: 'Keten Gömlek',
      shortDescription: 'Sıcak havalara uygun nefes alabilir gömlek.',
      description:
        'Hafif yapısı ve yumuşak formuyla sezon boyunca rahat kullanım sunar.',
    },
    categorySlugs: ['shirts'],
    tagSlugs: ['linen', 'smart-casual', 'spring-summer', 'breathable'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['solstice-studio', 'terra-thread', 'dune-district'],
  },
  {
    key: 'poplin-shirt',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Poplin Shirt',
      shortDescription: 'A crisp shirt with office-ready structure.',
      description:
        'Refined shaping and easy tuckability make it a reliable weekday option.',
    },
    tr: {
      name: 'Poplin Gömlek',
      shortDescription: 'Ofis kullanımına uygun temiz ve düzenli bir gömlek.',
      description:
        'Terzilik etkisi taşıyan formu ve kolay kombinlenebilir yapısıyla öne çıkar.',
    },
    categorySlugs: ['shirts'],
    tagSlugs: ['cotton', 'tailored', 'office', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['atelier-nera', 'forme-atelier', 'luminara'],
  },
  {
    key: 'knit-polo',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Knit Polo',
      shortDescription:
        'A polished knit top bridging smart and casual wardrobes.',
      description:
        'Smooth knit texture and soft collar construction offer a refined daily option.',
    },
    tr: {
      name: 'Triko Polo',
      shortDescription:
        'Akıllı ve günlük gardıropları bağlayan rafine bir triko üst.',
      description:
        'Yumuşak yaka detayı ve pürüzsüz örgüsüyle şık bir günlük seçenek sunar.',
    },
    categorySlugs: ['knitwear'],
    tagSlugs: ['recycled-knit', 'smart-casual', 'all-season', 'minimal'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['monoweave', 'forme-atelier', 'cadence'],
  },
  {
    key: 'merino-cardigan',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Merino Cardigan',
      shortDescription: 'A soft button-front layer for cooler rotations.',
      description:
        'Warm without bulk, it works as a transitional knit layer through the colder months.',
    },
    tr: {
      name: 'Merino Hırka',
      shortDescription: 'Serin günlerde kullanılacak yumuşak düğmeli katman.',
      description:
        'Hacim yapmadan sıcak tutan yapısıyla soğuk havalarda güçlü bir ara katmandır.',
    },
    categorySlugs: ['knitwear'],
    tagSlugs: ['wool', 'fall-winter', 'minimal', 'insulated'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['monoweave', 'terra-thread', 'vale-vine'],
  },
  {
    key: 'tapered-trousers',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Tapered Trousers',
      shortDescription: 'A streamlined trouser with weekday flexibility.',
      description:
        'Refined shape and comfortable movement make it a staple from desk to dinner.',
    },
    tr: {
      name: 'Daralan Paça Pantolon',
      shortDescription: 'Hafta içi kullanıma uygun dengeli ve esnek pantolon.',
      description:
        'Rahat hareket alanı ve düzgün siluetiyle ofisten akşam planlarına taşınır.',
    },
    categorySlugs: ['trousers'],
    tagSlugs: ['stretch', 'tailored', 'office', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['atelier-nera', 'forme-atelier', 'luminara'],
  },
  {
    key: 'wide-leg-trousers',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Wide-Leg Trousers',
      shortDescription:
        'Fluid trousers with movement and structure in balance.',
      description:
        'Easy drape and long-line proportion create a calm statement silhouette.',
    },
    tr: {
      name: 'Geniş Paça Pantolon',
      shortDescription:
        'Akışkan yapılı ve dengeli duruşlu geniş paça pantolon.',
      description:
        'Uzun oran hissi ve rahat dökümüyle sakin ama güçlü bir siluet sunar.',
    },
    categorySlugs: ['trousers'],
    tagSlugs: ['lightweight', 'minimal', 'office', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['marea', 'forme-atelier', 'veloura'],
  },
  {
    key: 'straight-denim',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Straight Denim',
      shortDescription:
        'A dependable denim silhouette with clean line and comfort.',
      description:
        'Designed as a year-round anchor piece with balanced rise and straight leg.',
    },
    tr: {
      name: 'Düz Kesim Denim',
      shortDescription:
        'Temiz çizgili ve rahat kullanımlı güvenilir denim siluet.',
      description:
        'Dengeli bel yüksekliği ve düz paçasıyla yıl boyu kullanılan temel bir parçadır.',
    },
    categorySlugs: ['denim'],
    tagSlugs: ['denim', 'casual', 'all-season', 'weekend'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['borough-lane', 'ardent', 'northline'],
  },
  {
    key: 'relaxed-denim',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Relaxed Denim',
      shortDescription: 'An easy denim fit for casual rotation.',
      description:
        'Softer volume through the leg gives a comfortable and directional daily look.',
    },
    tr: {
      name: 'Rahat Kalıp Denim',
      shortDescription: 'Günlük kombinler için rahat duruşlu denim kalıp.',
      description:
        'Paça boyunca sunduğu daha gevşek hacimle rahat ve yönlü bir görünüm sağlar.',
    },
    categorySlugs: ['denim'],
    tagSlugs: ['denim', 'casual', 'weekend', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['ardent', 'borough-lane', 'cadence'],
  },
  {
    key: 'satin-skirt',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Satin Skirt',
      shortDescription:
        'A light-catching skirt that moves from day to evening.',
      description:
        'Cut to drape softly with enough polish for event dressing and elevated daily looks.',
    },
    tr: {
      name: 'Saten Etek',
      shortDescription: 'Gündüzden akşama taşınabilen hafif parlak etek.',
      description:
        'Yumuşak dökümü ve düzenli çizgisiyle günlük şıklık ve etkinlik kullanımı için uygundur.',
    },
    categorySlugs: ['skirts'],
    tagSlugs: ['lightweight', 'minimal', 'evening', 'spring-summer'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['veloura', 'marea', 'luminara'],
  },
  {
    key: 'pleated-skirt',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Pleated Skirt',
      shortDescription:
        'A structured pleated shape for polished outfit building.',
      description:
        'Regular pleat rhythm adds movement while keeping a sharp, office-ready profile.',
    },
    tr: {
      name: 'Piliseli Etek',
      shortDescription:
        'Düzenli görünümler için yapılandırılmış piliseli etek.',
      description:
        'Düzenli pilileriyle hareket kazandırırken ofis kullanımına uygun şık bir profil sunar.',
    },
    categorySlugs: ['skirts'],
    tagSlugs: ['tailored', 'smart-casual', 'office', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['forme-atelier', 'marea', 'atelier-nera'],
  },
  {
    key: 'bomber-jacket',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Bomber Jacket',
      shortDescription: 'A compact outer layer with sporty ease.',
      description:
        'Utility pockets and a clean rib finish make it a versatile seasonal top layer.',
    },
    tr: {
      name: 'Bomber Ceket',
      shortDescription: 'Sportif hissi olan kompakt dış katman.',
      description:
        'Cepleri ve ribana bitişleriyle sezonda sık kullanılacak çok yönlü bir üst katmandır.',
    },
    categorySlugs: ['jackets'],
    tagSlugs: ['lightweight', 'casual', 'weekend', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['northline', 'ardent', 'borough-lane'],
  },
  {
    key: 'tailored-blazer',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Tailored Blazer',
      shortDescription: 'A sharp blazer for formal and flexible workwear.',
      description:
        'Clean lapel lines and structured shoulders offer a composed, refined silhouette.',
    },
    tr: {
      name: 'Terzi Ceket',
      shortDescription: 'Resmi ve esnek iş giyimine uygun keskin bir blazer.',
      description:
        'Net yaka çizgisi ve güçlü omuz yapısıyla dengeli ve rafine bir siluet sunar.',
    },
    categorySlugs: ['jackets'],
    tagSlugs: ['tailored', 'office', 'minimal', 'all-season'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['atelier-nera', 'forme-atelier', 'luminara'],
  },
  {
    key: 'midi-dress',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Midi Dress',
      shortDescription: 'An effortless midi silhouette with polished balance.',
      description:
        'Easy movement, clean neckline and versatile styling make it a strong wardrobe anchor.',
    },
    tr: {
      name: 'Midi Elbise',
      shortDescription: 'Dengeli duruşu olan zahmetsiz midi elbise.',
      description:
        'Rahat hareket alanı ve temiz yaka çizgisiyle gardırobun güçlü ana parçalarından biridir.',
    },
    categorySlugs: ['dresses'],
    tagSlugs: ['minimal', 'everyday', 'spring-summer', 'lightweight'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['marea', 'luminara', 'solstice-studio'],
  },
  {
    key: 'wrap-dress',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Wrap Dress',
      shortDescription: 'A wrap-front dress with an easy defined waist.',
      description:
        'Built to flatter with fluid movement and a shape that transitions into evening plans.',
    },
    tr: {
      name: 'Anvelop Elbise',
      shortDescription: 'Bel hattını tanımlayan rahat anvelop elbise.',
      description:
        'Akışkan duruşu ve vücuda uyumlu formuyla akşam planlarına da kolayca taşınır.',
    },
    categorySlugs: ['dresses'],
    tagSlugs: ['smart-casual', 'evening', 'spring-summer', 'lightweight'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['veloura', 'marea', 'solstice-studio'],
  },
  {
    key: 'performance-tee',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Performance Tee',
      shortDescription: 'A training top made to breathe through movement.',
      description:
        'Quick-dry comfort and light stretch support everything from commute to training block.',
    },
    tr: {
      name: 'Performans Tişörtü',
      shortDescription:
        'Hareket boyunca nefes alabilirlik sunan antrenman üstü.',
      description:
        'Hızlı kuruyan yapısı ve hafif esnekliğiyle antrenman ve günlük geçişlere uyum sağlar.',
    },
    categorySlugs: ['performance-tops'],
    tagSlugs: ['breathable', 'athleisure', 'travel', 'recycled'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['kora-motion', 'nexo-run', 'peak-supply'],
  },
  {
    key: 'sculpt-leggings',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Sculpt Leggings',
      shortDescription: 'Supportive leggings with studio-to-street confidence.',
      description:
        'Compressive comfort, soft touch and stable recovery keep the silhouette sharp in motion.',
    },
    tr: {
      name: 'Toparlayıcı Tayt',
      shortDescription: 'Stüdyodan sokağa taşınan destekleyici tayt.',
      description:
        'Sıkı ama rahat yapısı ve yumuşak dokusuyla hareket sırasında formunu korur.',
    },
    categorySlugs: ['leggings'],
    tagSlugs: ['stretch', 'athleisure', 'breathable', 'everyday'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['kora-motion', 'peak-supply', 'ardent'],
  },
  {
    key: 'sherpa-fleece',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Sherpa Fleece',
      shortDescription: 'A warm fleece layer with easy outdoor utility.',
      description:
        'Soft pile texture and quick layering value make it ideal for cooler movement.',
    },
    tr: {
      name: 'Sherpa Polar',
      shortDescription: 'Outdoor kullanıma uygun sıcak tutan polar katman.',
      description:
        'Yumuşak yüzeyi ve kolay katmanlanabilir yapısıyla serin günlerde güçlü destek sunar.',
    },
    categorySlugs: ['fleeces'],
    tagSlugs: ['insulated', 'casual', 'travel', 'fall-winter'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['peak-supply', 'northline', 'terra-thread'],
  },
  {
    key: 'trail-rain-shell',
    type: 'PHYSICAL',
    segment: 'apparel',
    en: {
      name: 'Trail Rain Shell',
      shortDescription:
        'A light shell built for city showers and trail detours.',
      description:
        'Weather resistance, low bulk and packability make it a reliable layer on the move.',
    },
    tr: {
      name: 'Patika Yağmurluk',
      shortDescription:
        'Şehir yağmurları ve kısa outdoor rotalar için hafif dış katman.',
      description:
        'Hafif yapısı, kolay taşınabilirliği ve hava korumasıyla hareketli günlerde güven verir.',
    },
    categorySlugs: ['raincoats'],
    tagSlugs: ['waterproof', 'travel', 'lightweight', 'fall-winter'],
    variantGroupSlugs: ['color', 'size'],
    brandPool: ['peak-supply', 'nexo-run', 'northline'],
  },
  {
    key: 'runner-sneaker',
    type: 'PHYSICAL',
    segment: 'footwear',
    en: {
      name: 'Runner Sneaker',
      shortDescription:
        'A cushioned sneaker for daily pace and training rotation.',
      description:
        'Breathable upper, responsive sole and balanced shape support long daily wear.',
    },
    tr: {
      name: 'Koşu Sneakerı',
      shortDescription: 'Günlük tempo ve antrenman için yastıklamalı sneaker.',
      description:
        'Nefes alabilir üst yüzeyi ve dengeli tabanıyla gün boyu konfor sağlar.',
    },
    categorySlugs: ['sneakers', 'training-shoes'],
    tagSlugs: ['breathable', 'athleisure', 'lightweight', 'everyday'],
    variantGroupSlugs: ['color', 'shoe-size'],
    brandPool: ['nexo-run', 'kora-motion', 'peak-supply'],
  },
  {
    key: 'city-loafer',
    type: 'PHYSICAL',
    segment: 'footwear',
    en: {
      name: 'City Loafer',
      shortDescription: 'A polished loafer for easy weekday dressing.',
      description:
        'Soft structure and a neat profile deliver comfort without losing formal clarity.',
    },
    tr: {
      name: 'Şehir Loaferı',
      shortDescription: 'Hafta içi kullanım için şık ve rahat loafer.',
      description:
        'Yumuşak yapısı ve düzenli formuyla resmi görünümü konfordan ödün vermeden sunar.',
    },
    categorySlugs: ['loafers'],
    tagSlugs: ['leather', 'smart-casual', 'office', 'all-season'],
    variantGroupSlugs: ['color', 'shoe-size'],
    brandPool: ['atelier-nera', 'forme-atelier', 'luminara'],
  },
  {
    key: 'soft-flat',
    type: 'PHYSICAL',
    segment: 'footwear',
    en: {
      name: 'Soft Flat',
      shortDescription:
        'A minimal flat shoe with easy carry and flexible wear.',
      description:
        'Soft touch materials and a slim outsole keep it light for all-day city use.',
    },
    tr: {
      name: 'Yumuşak Babet',
      shortDescription:
        'Kolay taşınan ve esnek kullanımlı minimal düz ayakkabı.',
      description:
        'Yumuşak malzemesi ve ince taban yapısıyla gün boyu şehir kullanımında hafiflik sunar.',
    },
    categorySlugs: ['flats'],
    tagSlugs: ['minimal', 'lightweight', 'everyday', 'spring-summer'],
    variantGroupSlugs: ['color', 'shoe-size'],
    brandPool: ['marea', 'luminara', 'onda'],
  },
  {
    key: 'ankle-boot',
    type: 'PHYSICAL',
    segment: 'footwear',
    en: {
      name: 'Ankle Boot',
      shortDescription: 'A compact boot for structured seasonal looks.',
      description:
        'Clean upper lines and reliable traction make it a cold-weather mainstay.',
    },
    tr: {
      name: 'Bilek Bot',
      shortDescription: 'Sezon kombinleri için kompakt ve güçlü bir bot.',
      description:
        'Temiz üst yüzeyi ve güven veren tabanıyla soğuk günlerin ana parçalarından biridir.',
    },
    categorySlugs: ['ankle-boots'],
    tagSlugs: ['leather', 'fall-winter', 'insulated', 'everyday'],
    variantGroupSlugs: ['color', 'shoe-size'],
    brandPool: ['northline', 'atelier-nera', 'vale-vine'],
  },
  {
    key: 'strap-sandal',
    type: 'PHYSICAL',
    segment: 'footwear',
    en: {
      name: 'Strap Sandal',
      shortDescription: 'An open sandal for light and airy summer styling.',
      description:
        'Secure straps and an easy footbed keep the silhouette practical through warm days.',
    },
    tr: {
      name: 'Bantlı Sandalet',
      shortDescription: 'Yaz kombinleri için hafif ve açık formda sandalet.',
      description:
        'Güvenli bant yapısı ve rahat tabanıyla sıcak günlerde pratik kullanım sağlar.',
    },
    categorySlugs: ['sandals'],
    tagSlugs: ['lightweight', 'spring-summer', 'weekend', 'everyday'],
    variantGroupSlugs: ['color', 'shoe-size'],
    brandPool: ['dune-district', 'marea', 'onda'],
  },
  {
    key: 'commuter-backpack',
    type: 'PHYSICAL',
    segment: 'accessory',
    en: {
      name: 'Commuter Backpack',
      shortDescription: 'A structured backpack sized for workday movement.',
      description:
        'Practical compartment layout and durable finish make it a reliable everyday carry.',
    },
    tr: {
      name: 'Şehir Sırt Çantası',
      shortDescription: 'İş günü temposuna uygun yapılandırılmış sırt çantası.',
      description:
        'Düzenli bölmeleri ve dayanıklı yüzeyiyle günlük taşıma ihtiyacını güvenle karşılar.',
    },
    categorySlugs: ['backpacks', 'travel-accessories'],
    tagSlugs: ['nylon', 'waterproof', 'travel', 'everyday'],
    variantGroupSlugs: ['color', 'accessory-size'],
    brandPool: ['northline', 'peak-supply', 'vale-vine'],
  },
  {
    key: 'leather-shoulder-bag',
    type: 'PHYSICAL',
    segment: 'accessory',
    en: {
      name: 'Leather Shoulder Bag',
      shortDescription:
        'A refined carry shape with soft structure and easy capacity.',
      description:
        'Polished finish, balanced strap drop and practical interior make it a versatile staple.',
    },
    tr: {
      name: 'Deri Omuz Çantası',
      shortDescription:
        'Yumuşak yapılı ve dengeli hacimli rafine taşıma çantası.',
      description:
        'Düzenli iç hacmi ve şık yüzeyiyle günlük kullanıma kolayca uyum sağlar.',
    },
    categorySlugs: ['shoulder-bags', 'tote-bags'],
    tagSlugs: ['leather', 'minimal', 'everyday', 'all-season'],
    variantGroupSlugs: ['color'],
    brandPool: ['vale-vine', 'marea', 'onda'],
  },
  {
    key: 'reversible-belt',
    type: 'PHYSICAL',
    segment: 'accessory',
    en: {
      name: 'Reversible Belt',
      shortDescription: 'A dual-sided belt that expands wardrobe flexibility.',
      description:
        'Built for quick switching between polished and relaxed outfits with one accessory.',
    },
    tr: {
      name: 'Çift Taraflı Kemer',
      shortDescription: 'Gardırop esnekliğini artıran iki yüzlü kemer.',
      description:
        'Tek aksesuarla hem şık hem rahat kombinlere uyum sağlayacak şekilde tasarlandı.',
    },
    categorySlugs: ['belts'],
    tagSlugs: ['leather', 'smart-casual', 'all-season', 'everyday'],
    variantGroupSlugs: ['color', 'accessory-size'],
    brandPool: ['vale-vine', 'atelier-nera', 'onda'],
  },
  {
    key: 'wool-cap',
    type: 'PHYSICAL',
    segment: 'accessory',
    en: {
      name: 'Wool Cap',
      shortDescription:
        'A soft cap for cool-weather layering and easy travel days.',
      description:
        'Compact coverage and soft texture make it an easy seasonal finishing piece.',
    },
    tr: {
      name: 'Yün Şapka',
      shortDescription: 'Serin günlerde kullanılacak yumuşak dokulu şapka.',
      description:
        'Kompakt koruması ve yumuşak dokusuyla sezonluk kombinleri kolayca tamamlar.',
    },
    categorySlugs: ['hats'],
    tagSlugs: ['wool', 'fall-winter', 'travel', 'everyday'],
    variantGroupSlugs: ['color'],
    brandPool: ['terra-thread', 'onda', 'vale-vine'],
  },
  {
    key: 'gift-card',
    type: 'DIGITAL',
    segment: 'digital',
    en: {
      name: 'Digital Gift Card',
      shortDescription: 'Flexible store credit delivered instantly.',
      description:
        'A fast gifting option for customers who want to let the recipient choose.',
    },
    tr: {
      name: 'Dijital Hediye Kartı',
      shortDescription: 'Anında teslim edilen esnek mağaza bakiyesi.',
      description:
        'Alıcının seçimini özgür bırakmak isteyen müşteriler için hızlı hediye çözümü.',
    },
    categorySlugs: ['gift-cards'],
    tagSlugs: ['all-season', 'everyday', 'travel'],
    variantGroupSlugs: [],
    brandPool: ['onda', 'luminara', 'marea'],
  },
  {
    key: 'style-guide',
    type: 'DIGITAL',
    segment: 'digital',
    en: {
      name: 'Digital Style Guide',
      shortDescription:
        'Downloadable wardrobe planning and styling inspiration.',
      description:
        'A curated digital guide covering capsule dressing, color balance and look building.',
    },
    tr: {
      name: 'Dijital Stil Rehberi',
      shortDescription:
        'İndirilebilir gardırop planlama ve stil ilhamı içeriği.',
      description:
        'Kapsül giyim, renk dengesi ve kombin kurgusunu anlatan seçkili dijital rehber.',
    },
    categorySlugs: ['style-guides'],
    tagSlugs: ['all-season', 'minimal', 'everyday', 'travel'],
    variantGroupSlugs: [],
    brandPool: ['onda', 'forme-atelier', 'luminara'],
  },
];
